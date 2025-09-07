/**
 * User Management Skill
 * Comprehensive user account management and operations
 */

import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillCategory } from '../../types';
import { PrismaClient } from '@intelagent/database';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class UserManagementSkill extends BaseSkill {
  metadata = {
    id: 'user_management',
    name: 'User Management',
    description: 'Manage user accounts, licenses, and subscriptions',
    category: SkillCategory.OPERATIONS,
    version: '1.0.0',
    author: 'Intelagent',
    tags: ['users', 'accounts', 'licenses', 'management']
  };

  validate(params: SkillParams): boolean {
    return params !== null && params !== undefined && params.action !== undefined;
  }

  async execute(params: SkillParams): Promise<SkillResult> {
    try {
      const startTime = Date.now();
      const { action } = params;

      let result: any;

      switch (action) {
        case 'list_users':
          result = await this.listUsers(params);
          break;
        case 'get_user':
          result = await this.getUser(params);
          break;
        case 'create_user':
          result = await this.createUser(params);
          break;
        case 'update_user':
          result = await this.updateUser(params);
          break;
        case 'suspend_user':
          result = await this.suspendUser(params);
          break;
        case 'activate_user':
          result = await this.activateUser(params);
          break;
        case 'delete_user':
          result = await this.deleteUser(params);
          break;
        case 'get_user_activity':
          result = await this.getUserActivity(params);
          break;
        case 'get_user_metrics':
          result = await this.getUserMetrics(params);
          break;
        case 'bulk_operation':
          result = await this.bulkOperation(params);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          ...result,
          executionTime,
          timestamp: new Date()
        },
        metadata: {
          skillId: this.metadata.id,
          skillName: this.metadata.name,
          timestamp: new Date()
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        metadata: {
          skillId: this.metadata.id,
          skillName: this.metadata.name,
          timestamp: new Date()
        }
      };
    }
  }

  private async listUsers(params: SkillParams) {
    const { 
      filter = {}, 
      limit = 50, 
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = params;

    // Build where clause
    const where: any = {};
    
    if (filter.status) {
      const license = { status: filter.status };
      where.license_key = {
        in: await prisma.licenses.findMany({
          where: license,
          select: { license_key: true }
        }).then(licenses => licenses.map(l => l.license_key))
      };
    }

    if (filter.email) {
      where.email = { contains: filter.email, mode: 'insensitive' };
    }

    if (filter.role) {
      where.role = filter.role;
    }

    // Get users with their licenses
    const users = await prisma.users.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
      include: {
        licenses: {
          include: {
            product_keys: true
          }
        }
      }
    });

    // Get total count
    const total = await prisma.users.count({ where });

    // Get stats
    const stats = await this.getUserStats();

    return {
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.created_at,
        lastLogin: user.last_login_at,
        emailVerified: user.email_verified,
        licenseKey: user.license_key,
        stripeCustomerId: user.stripe_customer_id,
        license: user.licenses ? {
          status: user.licenses.status,
          tier: user.licenses.tier,
          products: user.licenses.product_keys?.length || 0,
          expiresAt: user.licenses.current_period_end
        } : null
      })),
      total,
      stats,
      limit,
      offset
    };
  }

  private async getUser(params: SkillParams) {
    const { userId, email } = params;

    const user = await prisma.users.findFirst({
      where: userId ? { id: userId } : { email },
      include: {
        licenses: {
          include: {
            product_keys: true,
            skill_executions: {
              take: 10,
              orderBy: { created_at: 'desc' }
            }
          }
        },
        user_sessions: {
          take: 5,
          orderBy: { created_at: 'desc' }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get activity metrics
    const activityMetrics = await this.getUserActivityMetrics(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.created_at,
        lastLogin: user.last_login_at,
        emailVerified: user.email_verified,
        licenseKey: user.license_key,
        stripeCustomerId: user.stripe_customer_id
      },
      license: user.licenses ? {
        key: user.licenses.license_key,
        status: user.licenses.status,
        tier: user.licenses.tier,
        createdAt: user.licenses.created_at,
        activatedAt: user.licenses.activated_at,
        expiresAt: user.licenses.current_period_end,
        products: user.licenses.product_keys?.map(pk => ({
          key: pk.key,
          type: pk.product_type,
          status: pk.status,
          configuration: pk.configuration
        }))
      } : null,
      activity: activityMetrics,
      sessions: user.user_sessions?.map(session => ({
        id: session.id,
        ipAddress: session.ip_address,
        userAgent: session.user_agent,
        createdAt: session.created_at,
        expiresAt: session.expires_at
      }))
    };
  }

  private async createUser(params: SkillParams) {
    const { email, name, role = 'customer', tier = 'starter', sendWelcomeEmail = true } = params;

    // Check if user exists
    const existing = await prisma.users.findUnique({
      where: { email }
    });

    if (existing) {
      throw new Error('User already exists');
    }

    // Generate license key
    const licenseKey = this.generateLicenseKey('LIC');
    
    // Generate temporary password
    const tempPassword = this.generateTemporaryPassword();
    const passwordHash = crypto.createHash('sha256').update(tempPassword).digest('hex');

    // Create user
    const user = await prisma.users.create({
      data: {
        email,
        name: name || email.split('@')[0],
        password_hash: passwordHash,
        role,
        license_key: licenseKey
      }
    });

    // Create license
    await prisma.licenses.create({
      data: {
        license_key: licenseKey,
        email,
        status: 'active',
        tier,
        user_id: user.id,
        created_at: new Date()
      }
    });

    // Generate product keys based on tier
    await this.generateProductKeys(licenseKey, tier);

    // Log creation
    console.log(`User created: ${email} with license ${licenseKey}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        licenseKey
      },
      temporaryPassword: sendWelcomeEmail ? tempPassword : undefined,
      message: 'User created successfully'
    };
  }

  private async updateUser(params: SkillParams) {
    const { userId, updates } = params;

    const user = await prisma.users.update({
      where: { id: userId },
      data: {
        name: updates.name,
        email: updates.email,
        role: updates.role,
        email_verified: updates.emailVerified,
        updated_at: new Date()
      }
    });

    // Update license if tier changed
    if (updates.tier) {
      await prisma.licenses.update({
        where: { license_key: user.license_key },
        data: { 
          tier: updates.tier,
          metadata: {
            updatedBy: 'UserManagementSkill',
            updatedAt: new Date().toISOString()
          }
        }
      });
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      message: 'User updated successfully'
    };
  }

  private async suspendUser(params: SkillParams) {
    const { userId, reason } = params;

    const user = await prisma.users.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Suspend license
    await prisma.licenses.update({
      where: { license_key: user.license_key },
      data: {
        status: 'suspended',
        suspended_at: new Date(),
        metadata: {
          suspendReason: reason,
          suspendedBy: 'UserManagementSkill',
          suspendedAt: new Date().toISOString()
        }
      }
    });

    // Deactivate product keys
    await prisma.product_keys.updateMany({
      where: { license_key: user.license_key },
      data: { status: 'inactive' }
    });

    // Invalidate sessions
    await prisma.user_sessions.deleteMany({
      where: { user_id: userId }
    });

    return {
      userId,
      status: 'suspended',
      reason,
      message: 'User suspended successfully'
    };
  }

  private async activateUser(params: SkillParams) {
    const { userId } = params;

    const user = await prisma.users.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Activate license
    await prisma.licenses.update({
      where: { license_key: user.license_key },
      data: {
        status: 'active',
        activated_at: new Date(),
        metadata: {
          activatedBy: 'UserManagementSkill',
          activatedAt: new Date().toISOString()
        }
      }
    });

    // Activate product keys
    await prisma.product_keys.updateMany({
      where: { license_key: user.license_key },
      data: { status: 'active' }
    });

    return {
      userId,
      status: 'active',
      message: 'User activated successfully'
    };
  }

  private async deleteUser(params: SkillParams) {
    const { userId, hardDelete = false } = params;

    if (hardDelete) {
      // Hard delete - remove from database
      await prisma.users.delete({
        where: { id: userId }
      });
      
      return {
        userId,
        deleted: true,
        message: 'User permanently deleted'
      };
    } else {
      // Soft delete - mark as deleted
      const user = await prisma.users.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      await prisma.licenses.update({
        where: { license_key: user.license_key },
        data: {
          status: 'cancelled',
          cancelled_at: new Date(),
          metadata: {
            deletedBy: 'UserManagementSkill',
            deletedAt: new Date().toISOString()
          }
        }
      });

      return {
        userId,
        deleted: false,
        status: 'cancelled',
        message: 'User account cancelled'
      };
    }
  }

  private async getUserActivity(params: SkillParams) {
    const { userId, days = 30 } = params;
    
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Get skill executions
    const executions = await prisma.skill_executions.findMany({
      where: {
        licenses: {
          users: {
            id: userId
          }
        },
        created_at: { gte: since }
      },
      orderBy: { created_at: 'desc' },
      take: 100
    });

    // Get sessions
    const sessions = await prisma.user_sessions.findMany({
      where: {
        user_id: userId,
        created_at: { gte: since }
      },
      orderBy: { created_at: 'desc' }
    });

    return {
      userId,
      period: `${days} days`,
      activity: {
        skillExecutions: executions.length,
        sessions: sessions.length,
        lastActivity: executions[0]?.created_at || sessions[0]?.created_at,
        topSkills: this.getTopSkills(executions),
        activityByDay: this.getActivityByDay(executions, days)
      }
    };
  }

  private async getUserMetrics(params: SkillParams) {
    const metrics = await this.getUserStats();
    
    return {
      metrics,
      timestamp: new Date()
    };
  }

  private async bulkOperation(params: SkillParams) {
    const { operation, userIds } = params;
    const results = [];

    for (const userId of userIds) {
      try {
        let result;
        switch (operation) {
          case 'suspend':
            result = await this.suspendUser({ userId, reason: 'Bulk suspension' });
            break;
          case 'activate':
            result = await this.activateUser({ userId });
            break;
          case 'delete':
            result = await this.deleteUser({ userId, hardDelete: false });
            break;
          default:
            result = { error: `Unknown operation: ${operation}` };
        }
        results.push({ userId, success: true, result });
      } catch (error: any) {
        results.push({ userId, success: false, error: error.message });
      }
    }

    return {
      operation,
      totalProcessed: userIds.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  // Helper methods
  private async getUserStats() {
    const total = await prisma.users.count();
    const active = await prisma.licenses.count({ where: { status: 'active' } });
    const suspended = await prisma.licenses.count({ where: { status: 'suspended' } });
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = await prisma.users.count({
      where: { created_at: { gte: thirtyDaysAgo } }
    });

    // Get tier distribution
    const tierCounts = await prisma.licenses.groupBy({
      by: ['tier'],
      _count: true
    });

    return {
      total,
      active,
      suspended,
      newUsers,
      byTier: tierCounts.reduce((acc: any, curr) => {
        acc[curr.tier || 'unknown'] = curr._count;
        return acc;
      }, {})
    };
  }

  private async getUserActivityMetrics(userId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const executions = await prisma.skill_executions.count({
      where: {
        licenses: {
          users: {
            id: userId
          }
        },
        created_at: { gte: thirtyDaysAgo }
      }
    });

    const sessions = await prisma.user_sessions.count({
      where: {
        user_id: userId,
        created_at: { gte: thirtyDaysAgo }
      }
    });

    return {
      skillExecutions30d: executions,
      sessions30d: sessions,
      avgDailyActivity: Math.round(executions / 30)
    };
  }

  private generateLicenseKey(prefix: string = 'LIC'): string {
    const timestamp = Date.now().toString(36);
    const randomStr = crypto.randomBytes(8).toString('hex').toUpperCase();
    return `${prefix}-${timestamp}-${randomStr}`.toUpperCase();
  }

  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  private async generateProductKeys(licenseKey: string, tier: string) {
    const products = {
      starter: ['chatbot'],
      professional: ['chatbot', 'chatbot', 'chatbot', 'sales-agent', 'enrichment'],
      enterprise: ['chatbot', 'sales-agent', 'enrichment', 'setup-agent']
    };

    const tierProducts = products[tier as keyof typeof products] || ['chatbot'];

    for (const product of tierProducts) {
      const prefix = product === 'chatbot' ? 'CHAT' :
                    product === 'sales-agent' ? 'SALES' :
                    product === 'enrichment' ? 'ENRICH' : 'SETUP';
      
      const productKey = this.generateLicenseKey(prefix);
      
      await prisma.product_keys.create({
        data: {
          key: productKey,
          license_key: licenseKey,
          product_type: product,
          status: 'active',
          configuration: {},
          created_at: new Date(),
          updated_at: new Date()
        }
      });
    }
  }

  private getTopSkills(executions: any[]) {
    const skillCounts = new Map<string, number>();
    executions.forEach(exec => {
      const skill = exec.skill_name || 'unknown';
      skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
    });
    
    return Array.from(skillCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([skill, count]) => ({ skill, count }));
  }

  private getActivityByDay(executions: any[], days: number) {
    const dayMap = new Map<string, number>();
    const now = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      dayMap.set(key, 0);
    }
    
    executions.forEach(exec => {
      const date = new Date(exec.created_at).toISOString().split('T')[0];
      if (dayMap.has(date)) {
        dayMap.set(date, (dayMap.get(date) || 0) + 1);
      }
    });
    
    return Array.from(dayMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }

  getConfig(): Record<string, any> {
    return {
      enabled: true,
      category: 'operations',
      version: '1.0.0'
    };
  }
}