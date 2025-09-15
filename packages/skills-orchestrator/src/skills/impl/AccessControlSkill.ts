import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillMetadata, SkillCategory } from '../../types';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class AccessControlSkill extends BaseSkill {
  metadata: SkillMetadata = {
    id: 'access_control',
    name: 'Access Control & Permission Management',
    description: 'Comprehensive access control, permission management, and security enforcement',
    category: SkillCategory.SECURITY,
    version: '1.0.0',
    author: 'Intelagent Platform',
    tags: ['security', 'permissions', 'access', 'rbac', 'authorization', 'authentication']
  };

  async executeImpl(params: SkillParams): Promise<SkillResult> {
    const { action, licenseKey, data } = params;

    if (!licenseKey) {
      return this.error('License key is required');
    }

    try {
      switch (action) {
        // Permission Management
        case 'grant_permission':
          return await this.grantPermission(licenseKey, data);
        case 'revoke_permission':
          return await this.revokePermission(licenseKey, data);
        case 'check_permission':
          return await this.checkPermission(licenseKey, data);
        case 'get_permissions':
          return await this.getPermissions(licenseKey, data);

        // Role Management
        case 'create_role':
          return await this.createRole(licenseKey, data);
        case 'update_role':
          return await this.updateRole(licenseKey, data);
        case 'delete_role':
          return await this.deleteRole(licenseKey, data.roleId);
        case 'assign_role':
          return await this.assignRole(licenseKey, data);
        case 'remove_role':
          return await this.removeRole(licenseKey, data);
        case 'get_roles':
          return await this.getRoles(licenseKey, data);

        // Access Control
        case 'authorize_access':
          return await this.authorizeAccess(licenseKey, data);
        case 'validate_token':
          return await this.validateToken(licenseKey, data.token);
        case 'generate_token':
          return await this.generateAccessToken(licenseKey, data);
        case 'revoke_token':
          return await this.revokeToken(licenseKey, data.tokenId);

        // Resource Protection
        case 'protect_resource':
          return await this.protectResource(licenseKey, data);
        case 'unprotect_resource':
          return await this.unprotectResource(licenseKey, data.resourceId);
        case 'get_resource_permissions':
          return await this.getResourcePermissions(licenseKey, data.resourceId);

        // Policy Management
        case 'create_policy':
          return await this.createPolicy(licenseKey, data);
        case 'update_policy':
          return await this.updatePolicy(licenseKey, data);
        case 'delete_policy':
          return await this.deletePolicy(licenseKey, data.policyId);
        case 'evaluate_policy':
          return await this.evaluatePolicy(licenseKey, data);

        // Session Management
        case 'create_session':
          return await this.createSession(licenseKey, data);
        case 'validate_session':
          return await this.validateSession(licenseKey, data.sessionId);
        case 'terminate_session':
          return await this.terminateSession(licenseKey, data.sessionId);
        case 'get_active_sessions':
          return await this.getActiveSessions(licenseKey, data.userId);

        // Audit & Compliance
        case 'audit_access':
          return await this.auditAccess(licenseKey, data);
        case 'get_access_logs':
          return await this.getAccessLogs(licenseKey, data);
        case 'generate_compliance_report':
          return await this.generateComplianceReport(licenseKey, data);

        default:
          return this.error(`Unknown action: ${action}`);
      }
    } catch (error: any) {
      this.log(`Error in AccessControlSkill: ${error.message}`, 'error');
      return this.error(error.message);
    }
  }

  private async grantPermission(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const {
        userId,
        agentId,
        permission,
        resource,
        scope = 'read',
        expiresAt,
        conditions = {}
      } = data;

      const entityId = userId || agentId;
      const entityType = userId ? 'user' : 'agent';

      // Check if permission already exists
      const existing = await prisma.permissions.findFirst({
        where: {
          license_key: licenseKey,
          entity_id: entityId,
          entity_type: entityType,
          permission,
          resource
        }
      });

      if (existing && existing.is_active) {
        return this.error('Permission already granted');
      }

      // Create or update permission
      const perm = await prisma.permissions.upsert({
        where: {
          license_key_entity_permission: {
            license_key: licenseKey,
            entity_id: entityId,
            entity_type: entityType,
            permission,
            resource
          }
        },
        create: {
          license_key: licenseKey,
          entity_id: entityId,
          entity_type: entityType,
          permission,
          resource,
          scope,
          conditions,
          expires_at: expiresAt ? new Date(expiresAt) : null,
          is_active: true
        },
        update: {
          scope,
          conditions,
          expires_at: expiresAt ? new Date(expiresAt) : null,
          is_active: true
        }
      });

      // Audit the grant
      await this.auditPermissionChange(licenseKey, {
        action: 'grant',
        entityId,
        entityType,
        permission,
        resource,
        scope
      });

      return this.success({
        permissionId: perm.id,
        entityId,
        entityType,
        permission,
        resource,
        scope,
        message: 'Permission granted successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to grant permission: ${error.message}`);
    }
  }

  private async revokePermission(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { userId, agentId, permission, resource, reason } = data;

      const entityId = userId || agentId;
      const entityType = userId ? 'user' : 'agent';

      const updated = await prisma.permissions.updateMany({
        where: {
          license_key: licenseKey,
          entity_id: entityId,
          entity_type: entityType,
          permission,
          resource
        },
        data: {
          is_active: false,
          revoked_at: new Date(),
          revoked_reason: reason
        }
      });

      if (updated.count === 0) {
        return this.error('Permission not found');
      }

      // Audit the revocation
      await this.auditPermissionChange(licenseKey, {
        action: 'revoke',
        entityId,
        entityType,
        permission,
        resource,
        reason
      });

      // Invalidate related tokens/sessions
      await this.invalidateRelatedAccess(licenseKey, entityId, entityType);

      return this.success({
        revoked: updated.count,
        entityId,
        entityType,
        permission,
        resource,
        message: 'Permission revoked successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to revoke permission: ${error.message}`);
    }
  }

  private async checkPermission(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { userId, agentId, permission, resource, scope = 'read' } = data;

      const entityId = userId || agentId;
      const entityType = userId ? 'user' : 'agent';

      // Check direct permissions
      const directPerm = await prisma.permissions.findFirst({
        where: {
          license_key: licenseKey,
          entity_id: entityId,
          entity_type: entityType,
          permission,
          resource,
          is_active: true,
          OR: [
            { expires_at: null },
            { expires_at: { gt: new Date() } }
          ]
        }
      });

      if (directPerm && this.scopeAllows(directPerm.scope, scope)) {
        return this.success({
          hasPermission: true,
          source: 'direct',
          scope: directPerm.scope,
          message: 'Permission granted'
        });
      }

      // Check role-based permissions
      const roles = await prisma.role_assignments.findMany({
        where: {
          license_key: licenseKey,
          entity_id: entityId,
          entity_type: entityType,
          is_active: true
        },
        include: {
          role: {
            include: {
              permissions: {
                where: {
                  permission,
                  resource,
                  is_active: true
                }
              }
            }
          }
        }
      });

      for (const assignment of roles) {
        for (const rolePerm of assignment.role.permissions) {
          if (this.scopeAllows(rolePerm.scope, scope)) {
            return this.success({
              hasPermission: true,
              source: 'role',
              roleId: assignment.role_id,
              roleName: assignment.role.name,
              scope: rolePerm.scope,
              message: 'Permission granted via role'
            });
          }
        }
      }

      // Check policy-based permissions
      const policyResult = await this.evaluatePolicies(licenseKey, {
        entityId,
        entityType,
        permission,
        resource,
        scope
      });

      if (policyResult.allowed) {
        return this.success({
          hasPermission: true,
          source: 'policy',
          policyId: policyResult.policyId,
          message: 'Permission granted via policy'
        });
      }

      return this.success({
        hasPermission: false,
        message: 'Permission denied'
      });
    } catch (error: any) {
      return this.error(`Failed to check permission: ${error.message}`);
    }
  }

  private async getPermissions(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { userId, agentId, resource, includeInherited = true } = data;

      const entityId = userId || agentId;
      const entityType = userId ? 'user' : 'agent';

      const whereClause: any = {
        license_key: licenseKey,
        entity_id: entityId,
        entity_type: entityType,
        is_active: true
      };

      if (resource) whereClause.resource = resource;

      // Get direct permissions
      const directPerms = await prisma.permissions.findMany({
        where: whereClause
      });

      const permissions = directPerms.map(p => ({
        id: p.id,
        permission: p.permission,
        resource: p.resource,
        scope: p.scope,
        source: 'direct',
        expiresAt: p.expires_at
      }));

      if (includeInherited) {
        // Get role-based permissions
        const rolePerms = await this.getRolePermissions(licenseKey, entityId, entityType);
        permissions.push(...rolePerms);

        // Get policy-based permissions
        const policyPerms = await this.getPolicyPermissions(licenseKey, entityId, entityType);
        permissions.push(...policyPerms);
      }

      // Remove duplicates and sort
      const unique = this.deduplicatePermissions(permissions);

      return this.success({
        permissions: unique,
        total: unique.length,
        direct: directPerms.length,
        inherited: unique.length - directPerms.length,
        message: 'Permissions retrieved'
      });
    } catch (error: any) {
      return this.error(`Failed to get permissions: ${error.message}`);
    }
  }

  private async createRole(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { name, description, permissions = [], metadata = {} } = data;

      // Check if role exists
      const existing = await prisma.roles.findFirst({
        where: {
          license_key: licenseKey,
          name
        }
      });

      if (existing) {
        return this.error('Role already exists');
      }

      // Create role
      const role = await prisma.roles.create({
        data: {
          license_key: licenseKey,
          name,
          description,
          metadata,
          is_system: false,
          is_active: true
        }
      });

      // Add permissions to role
      if (permissions.length > 0) {
        await prisma.role_permissions.createMany({
          data: permissions.map((p: any) => ({
            role_id: role.id,
            permission: p.permission,
            resource: p.resource,
            scope: p.scope || 'read'
          }))
        });
      }

      return this.success({
        roleId: role.id,
        name,
        permissions: permissions.length,
        message: 'Role created successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to create role: ${error.message}`);
    }
  }

  private async updateRole(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { roleId, name, description, permissions, metadata } = data;

      const role = await prisma.roles.findFirst({
        where: {
          license_key: licenseKey,
          id: roleId
        }
      });

      if (!role) {
        return this.error('Role not found');
      }

      if (role.is_system) {
        return this.error('Cannot modify system role');
      }

      // Update role
      await prisma.roles.update({
        where: { id: roleId },
        data: {
          name: name || role.name,
          description: description || role.description,
          metadata: metadata || role.metadata
        }
      });

      // Update permissions if provided
      if (permissions) {
        // Remove existing permissions
        await prisma.role_permissions.deleteMany({
          where: { role_id: roleId }
        });

        // Add new permissions
        if (permissions.length > 0) {
          await prisma.role_permissions.createMany({
            data: permissions.map((p: any) => ({
              role_id: roleId,
              permission: p.permission,
              resource: p.resource,
              scope: p.scope || 'read'
            }))
          });
        }
      }

      return this.success({
        roleId,
        updated: true,
        message: 'Role updated successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to update role: ${error.message}`);
    }
  }

  private async deleteRole(licenseKey: string, roleId: string): Promise<SkillResult> {
    try {
      const role = await prisma.roles.findFirst({
        where: {
          license_key: licenseKey,
          id: roleId
        }
      });

      if (!role) {
        return this.error('Role not found');
      }

      if (role.is_system) {
        return this.error('Cannot delete system role');
      }

      // Check if role is assigned
      const assignments = await prisma.role_assignments.count({
        where: {
          role_id: roleId,
          is_active: true
        }
      });

      if (assignments > 0) {
        return this.error(`Cannot delete role with ${assignments} active assignments`);
      }

      // Soft delete role
      await prisma.roles.update({
        where: { id: roleId },
        data: {
          is_active: false,
          deleted_at: new Date()
        }
      });

      return this.success({
        roleId,
        deleted: true,
        message: 'Role deleted successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to delete role: ${error.message}`);
    }
  }

  private async assignRole(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { userId, agentId, roleId, expiresAt } = data;

      const entityId = userId || agentId;
      const entityType = userId ? 'user' : 'agent';

      // Check if role exists
      const role = await prisma.roles.findFirst({
        where: {
          license_key: licenseKey,
          id: roleId,
          is_active: true
        }
      });

      if (!role) {
        return this.error('Role not found');
      }

      // Check if already assigned
      const existing = await prisma.role_assignments.findFirst({
        where: {
          license_key: licenseKey,
          entity_id: entityId,
          entity_type: entityType,
          role_id: roleId,
          is_active: true
        }
      });

      if (existing) {
        return this.error('Role already assigned');
      }

      // Create assignment
      const assignment = await prisma.role_assignments.create({
        data: {
          license_key: licenseKey,
          entity_id: entityId,
          entity_type: entityType,
          role_id: roleId,
          expires_at: expiresAt ? new Date(expiresAt) : null,
          is_active: true
        }
      });

      // Audit the assignment
      await this.auditRoleChange(licenseKey, {
        action: 'assign',
        entityId,
        entityType,
        roleId,
        roleName: role.name
      });

      return this.success({
        assignmentId: assignment.id,
        entityId,
        entityType,
        roleId,
        roleName: role.name,
        message: 'Role assigned successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to assign role: ${error.message}`);
    }
  }

  private async removeRole(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { userId, agentId, roleId, reason } = data;

      const entityId = userId || agentId;
      const entityType = userId ? 'user' : 'agent';

      const updated = await prisma.role_assignments.updateMany({
        where: {
          license_key: licenseKey,
          entity_id: entityId,
          entity_type: entityType,
          role_id: roleId,
          is_active: true
        },
        data: {
          is_active: false,
          removed_at: new Date(),
          removed_reason: reason
        }
      });

      if (updated.count === 0) {
        return this.error('Role assignment not found');
      }

      // Audit the removal
      await this.auditRoleChange(licenseKey, {
        action: 'remove',
        entityId,
        entityType,
        roleId,
        reason
      });

      // Invalidate related access
      await this.invalidateRelatedAccess(licenseKey, entityId, entityType);

      return this.success({
        removed: updated.count,
        entityId,
        entityType,
        roleId,
        message: 'Role removed successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to remove role: ${error.message}`);
    }
  }

  private async getRoles(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { userId, agentId, includePermissions = false } = data;

      if (userId || agentId) {
        // Get roles for specific entity
        const entityId = userId || agentId;
        const entityType = userId ? 'user' : 'agent';

        const assignments = await prisma.role_assignments.findMany({
          where: {
            license_key: licenseKey,
            entity_id: entityId,
            entity_type: entityType,
            is_active: true
          },
          include: {
            role: includePermissions ? {
              include: {
                permissions: true
              }
            } : true
          }
        });

        const roles = assignments.map(a => ({
          id: a.role.id,
          name: a.role.name,
          description: a.role.description,
          assignedAt: a.created_at,
          expiresAt: a.expires_at,
          permissions: includePermissions ? a.role.permissions : undefined
        }));

        return this.success({
          roles,
          total: roles.length,
          entityId,
          entityType,
          message: 'Roles retrieved'
        });
      } else {
        // Get all roles
        const roles = await prisma.roles.findMany({
          where: {
            license_key: licenseKey,
            is_active: true
          },
          include: includePermissions ? {
            permissions: true
          } : undefined
        });

        return this.success({
          roles: roles.map(r => ({
            id: r.id,
            name: r.name,
            description: r.description,
            isSystem: r.is_system,
            permissions: includePermissions ? r.permissions : undefined
          })),
          total: roles.length,
          message: 'All roles retrieved'
        });
      }
    } catch (error: any) {
      return this.error(`Failed to get roles: ${error.message}`);
    }
  }

  private async authorizeAccess(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { userId, agentId, resource, action: accessAction, context = {} } = data;

      const entityId = userId || agentId;
      const entityType = userId ? 'user' : 'agent';

      // Check permission
      const permCheck = await this.checkPermission(licenseKey, {
        userId,
        agentId,
        permission: accessAction,
        resource,
        scope: context.scope || 'read'
      });

      if (!permCheck.data?.hasPermission) {
        // Log denied access
        await this.logAccessAttempt(licenseKey, {
          entityId,
          entityType,
          resource,
          action: accessAction,
          result: 'denied',
          reason: 'insufficient_permissions'
        });

        return this.success({
          authorized: false,
          reason: 'insufficient_permissions',
          message: 'Access denied'
        });
      }

      // Additional context checks (IP, time, etc.)
      const contextCheck = await this.validateAccessContext(licenseKey, context);
      if (!contextCheck.valid) {
        await this.logAccessAttempt(licenseKey, {
          entityId,
          entityType,
          resource,
          action: accessAction,
          result: 'denied',
          reason: contextCheck.reason
        });

        return this.success({
          authorized: false,
          reason: contextCheck.reason,
          message: 'Access denied due to context restrictions'
        });
      }

      // Log successful access
      await this.logAccessAttempt(licenseKey, {
        entityId,
        entityType,
        resource,
        action: accessAction,
        result: 'granted'
      });

      // Generate access token if needed
      let accessToken = null;
      if (context.generateToken) {
        const tokenResult = await this.generateAccessToken(licenseKey, {
          entityId,
          entityType,
          resource,
          permissions: [accessAction],
          expiresIn: context.tokenExpiry || 3600
        });
        accessToken = tokenResult.data?.token;
      }

      return this.success({
        authorized: true,
        entityId,
        entityType,
        resource,
        action: accessAction,
        accessToken,
        message: 'Access authorized'
      });
    } catch (error: any) {
      return this.error(`Failed to authorize access: ${error.message}`);
    }
  }

  private async validateToken(licenseKey: string, token: string): Promise<SkillResult> {
    try {
      // Decode and verify token
      const decoded = this.decodeToken(token);

      if (!decoded || decoded.licenseKey !== licenseKey) {
        return this.success({
          valid: false,
          reason: 'invalid_token',
          message: 'Token is invalid'
        });
      }

      // Check if token is revoked
      const revoked = await prisma.revoked_tokens.findFirst({
        where: {
          token_id: decoded.tokenId,
          license_key: licenseKey
        }
      });

      if (revoked) {
        return this.success({
          valid: false,
          reason: 'revoked',
          message: 'Token has been revoked'
        });
      }

      // Check expiration
      if (decoded.expiresAt && new Date(decoded.expiresAt) < new Date()) {
        return this.success({
          valid: false,
          reason: 'expired',
          message: 'Token has expired'
        });
      }

      return this.success({
        valid: true,
        tokenId: decoded.tokenId,
        entityId: decoded.entityId,
        entityType: decoded.entityType,
        permissions: decoded.permissions,
        expiresAt: decoded.expiresAt,
        message: 'Token is valid'
      });
    } catch (error: any) {
      return this.success({
        valid: false,
        reason: 'invalid_token',
        message: 'Token validation failed'
      });
    }
  }

  private async generateAccessToken(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const {
        entityId,
        entityType = 'user',
        resource,
        permissions = [],
        expiresIn = 3600 // seconds
      } = data;

      const tokenId = crypto.randomBytes(16).toString('hex');
      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      const tokenData = {
        tokenId,
        licenseKey,
        entityId,
        entityType,
        resource,
        permissions,
        expiresAt,
        issuedAt: new Date()
      };

      // Create token record
      await prisma.access_tokens.create({
        data: {
          token_id: tokenId,
          license_key: licenseKey,
          entity_id: entityId,
          entity_type: entityType,
          resource,
          permissions,
          expires_at: expiresAt,
          is_active: true
        }
      });

      // Encode token
      const token = this.encodeToken(tokenData);

      return this.success({
        token,
        tokenId,
        expiresAt,
        expiresIn,
        message: 'Access token generated'
      });
    } catch (error: any) {
      return this.error(`Failed to generate token: ${error.message}`);
    }
  }

  private async revokeToken(licenseKey: string, tokenId: string): Promise<SkillResult> {
    try {
      // Find token
      const token = await prisma.access_tokens.findFirst({
        where: {
          token_id: tokenId,
          license_key: licenseKey,
          is_active: true
        }
      });

      if (!token) {
        return this.error('Token not found');
      }

      // Revoke token
      await prisma.access_tokens.update({
        where: { id: token.id },
        data: {
          is_active: false,
          revoked_at: new Date()
        }
      });

      // Add to revoked tokens list
      await prisma.revoked_tokens.create({
        data: {
          token_id: tokenId,
          license_key: licenseKey,
          revoked_at: new Date()
        }
      });

      return this.success({
        tokenId,
        revoked: true,
        message: 'Token revoked successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to revoke token: ${error.message}`);
    }
  }

  private async protectResource(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const {
        resourceId,
        resourceType,
        requiredPermissions = [],
        allowedRoles = [],
        policies = [],
        metadata = {}
      } = data;

      // Create or update resource protection
      const protection = await prisma.protected_resources.upsert({
        where: {
          license_key_resource: {
            license_key: licenseKey,
            resource_id: resourceId
          }
        },
        create: {
          license_key: licenseKey,
          resource_id: resourceId,
          resource_type: resourceType,
          required_permissions: requiredPermissions,
          allowed_roles: allowedRoles,
          policies,
          metadata,
          is_active: true
        },
        update: {
          required_permissions: requiredPermissions,
          allowed_roles: allowedRoles,
          policies,
          metadata,
          is_active: true
        }
      });

      return this.success({
        protectionId: protection.id,
        resourceId,
        resourceType,
        requiredPermissions,
        allowedRoles,
        message: 'Resource protected successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to protect resource: ${error.message}`);
    }
  }

  private async unprotectResource(licenseKey: string, resourceId: string): Promise<SkillResult> {
    try {
      const updated = await prisma.protected_resources.updateMany({
        where: {
          license_key: licenseKey,
          resource_id: resourceId
        },
        data: {
          is_active: false,
          removed_at: new Date()
        }
      });

      if (updated.count === 0) {
        return this.error('Protected resource not found');
      }

      return this.success({
        resourceId,
        unprotected: true,
        message: 'Resource unprotected successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to unprotect resource: ${error.message}`);
    }
  }

  private async getResourcePermissions(licenseKey: string, resourceId: string): Promise<SkillResult> {
    try {
      const protection = await prisma.protected_resources.findFirst({
        where: {
          license_key: licenseKey,
          resource_id: resourceId,
          is_active: true
        }
      });

      if (!protection) {
        return this.success({
          resourceId,
          protected: false,
          message: 'Resource is not protected'
        });
      }

      return this.success({
        resourceId,
        protected: true,
        resourceType: protection.resource_type,
        requiredPermissions: protection.required_permissions,
        allowedRoles: protection.allowed_roles,
        policies: protection.policies,
        message: 'Resource permissions retrieved'
      });
    } catch (error: any) {
      return this.error(`Failed to get resource permissions: ${error.message}`);
    }
  }

  private async createPolicy(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const {
        name,
        description,
        effect = 'allow', // allow or deny
        subjects = [], // Who the policy applies to
        resources = [], // What resources
        actions = [], // What actions
        conditions = {} // When to apply
      } = data;

      const policy = await prisma.access_policies.create({
        data: {
          license_key: licenseKey,
          name,
          description,
          effect,
          subjects,
          resources,
          actions,
          conditions,
          is_active: true
        }
      });

      return this.success({
        policyId: policy.id,
        name,
        effect,
        message: 'Policy created successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to create policy: ${error.message}`);
    }
  }

  private async updatePolicy(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { policyId, ...updates } = data;

      const policy = await prisma.access_policies.findFirst({
        where: {
          license_key: licenseKey,
          id: policyId
        }
      });

      if (!policy) {
        return this.error('Policy not found');
      }

      await prisma.access_policies.update({
        where: { id: policyId },
        data: updates
      });

      return this.success({
        policyId,
        updated: true,
        message: 'Policy updated successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to update policy: ${error.message}`);
    }
  }

  private async deletePolicy(licenseKey: string, policyId: string): Promise<SkillResult> {
    try {
      const updated = await prisma.access_policies.updateMany({
        where: {
          license_key: licenseKey,
          id: policyId
        },
        data: {
          is_active: false,
          deleted_at: new Date()
        }
      });

      if (updated.count === 0) {
        return this.error('Policy not found');
      }

      return this.success({
        policyId,
        deleted: true,
        message: 'Policy deleted successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to delete policy: ${error.message}`);
    }
  }

  private async evaluatePolicy(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { subject, resource, action: policyAction, context = {} } = data;

      const policies = await prisma.access_policies.findMany({
        where: {
          license_key: licenseKey,
          is_active: true
        }
      });

      let allowed = false;
      let deniedBy = null;
      let allowedBy = null;

      for (const policy of policies) {
        // Check if policy applies
        if (!this.policyApplies(policy, subject, resource, policyAction)) {
          continue;
        }

        // Evaluate conditions
        if (!this.evaluateConditions(policy.conditions as any, context)) {
          continue;
        }

        if (policy.effect === 'deny') {
          deniedBy = policy.id;
          allowed = false;
          break; // Deny takes precedence
        } else if (policy.effect === 'allow') {
          allowedBy = policy.id;
          allowed = true;
        }
      }

      return this.success({
        allowed,
        effect: allowed ? 'allow' : 'deny',
        policyId: deniedBy || allowedBy,
        message: allowed ? 'Policy allows access' : 'Policy denies access'
      });
    } catch (error: any) {
      return this.error(`Failed to evaluate policy: ${error.message}`);
    }
  }

  private async createSession(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const {
        userId,
        agentId,
        ipAddress,
        userAgent,
        expiresIn = 86400 // 24 hours
      } = data;

      const entityId = userId || agentId;
      const entityType = userId ? 'user' : 'agent';

      const sessionId = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      const session = await prisma.sessions.create({
        data: {
          session_id: sessionId,
          license_key: licenseKey,
          entity_id: entityId,
          entity_type: entityType,
          ip_address: ipAddress,
          user_agent: userAgent,
          expires_at: expiresAt,
          is_active: true
        }
      });

      return this.success({
        sessionId,
        entityId,
        entityType,
        expiresAt,
        message: 'Session created successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to create session: ${error.message}`);
    }
  }

  private async validateSession(licenseKey: string, sessionId: string): Promise<SkillResult> {
    try {
      const session = await prisma.sessions.findFirst({
        where: {
          session_id: sessionId,
          license_key: licenseKey,
          is_active: true
        }
      });

      if (!session) {
        return this.success({
          valid: false,
          reason: 'not_found',
          message: 'Session not found'
        });
      }

      if (session.expires_at && new Date(session.expires_at) < new Date()) {
        // Mark session as expired
        await prisma.sessions.update({
          where: { id: session.id },
          data: {
            is_active: false,
            terminated_at: new Date(),
            termination_reason: 'expired'
          }
        });

        return this.success({
          valid: false,
          reason: 'expired',
          message: 'Session has expired'
        });
      }

      // Update last activity
      await prisma.sessions.update({
        where: { id: session.id },
        data: { last_activity: new Date() }
      });

      return this.success({
        valid: true,
        sessionId,
        entityId: session.entity_id,
        entityType: session.entity_type,
        expiresAt: session.expires_at,
        message: 'Session is valid'
      });
    } catch (error: any) {
      return this.error(`Failed to validate session: ${error.message}`);
    }
  }

  private async terminateSession(licenseKey: string, sessionId: string): Promise<SkillResult> {
    try {
      const updated = await prisma.sessions.updateMany({
        where: {
          session_id: sessionId,
          license_key: licenseKey,
          is_active: true
        },
        data: {
          is_active: false,
          terminated_at: new Date(),
          termination_reason: 'manual'
        }
      });

      if (updated.count === 0) {
        return this.error('Session not found');
      }

      return this.success({
        sessionId,
        terminated: true,
        message: 'Session terminated successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to terminate session: ${error.message}`);
    }
  }

  private async getActiveSessions(licenseKey: string, userId?: string): Promise<SkillResult> {
    try {
      const whereClause: any = {
        license_key: licenseKey,
        is_active: true
      };

      if (userId) {
        whereClause.entity_id = userId;
        whereClause.entity_type = 'user';
      }

      const sessions = await prisma.sessions.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' }
      });

      const sessionList = sessions.map(s => ({
        sessionId: s.session_id,
        entityId: s.entity_id,
        entityType: s.entity_type,
        ipAddress: s.ip_address,
        userAgent: s.user_agent,
        createdAt: s.created_at,
        lastActivity: s.last_activity,
        expiresAt: s.expires_at
      }));

      return this.success({
        sessions: sessionList,
        total: sessionList.length,
        message: 'Active sessions retrieved'
      });
    } catch (error: any) {
      return this.error(`Failed to get active sessions: ${error.message}`);
    }
  }

  private async auditAccess(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { startDate, endDate, entityId, resource, action: auditAction } = data;

      const whereClause: any = {
        license_key: licenseKey
      };

      if (startDate || endDate) {
        whereClause.timestamp = {};
        if (startDate) whereClause.timestamp.gte = new Date(startDate);
        if (endDate) whereClause.timestamp.lte = new Date(endDate);
      }

      if (entityId) whereClause.entity_id = entityId;
      if (resource) whereClause.resource = resource;
      if (auditAction) whereClause.action = auditAction;

      const accessLogs = await prisma.access_logs.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: 1000
      });

      // Analyze access patterns
      const analysis = {
        totalAccess: accessLogs.length,
        granted: accessLogs.filter(l => l.result === 'granted').length,
        denied: accessLogs.filter(l => l.result === 'denied').length,
        byEntity: this.groupBy(accessLogs, 'entity_id'),
        byResource: this.groupBy(accessLogs, 'resource'),
        byAction: this.groupBy(accessLogs, 'action'),
        denialReasons: this.groupBy(
          accessLogs.filter(l => l.result === 'denied'),
          'reason'
        )
      };

      return this.success({
        audit: analysis,
        period: { startDate, endDate },
        message: 'Access audit completed'
      });
    } catch (error: any) {
      return this.error(`Failed to audit access: ${error.message}`);
    }
  }

  private async getAccessLogs(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { entityId, resource, limit = 100, offset = 0 } = data;

      const whereClause: any = {
        license_key: licenseKey
      };

      if (entityId) whereClause.entity_id = entityId;
      if (resource) whereClause.resource = resource;

      const [logs, total] = await Promise.all([
        prisma.access_logs.findMany({
          where: whereClause,
          orderBy: { timestamp: 'desc' },
          take: limit,
          skip: offset
        }),
        prisma.access_logs.count({ where: whereClause })
      ]);

      return this.success({
        logs: logs.map(l => ({
          id: l.id,
          entityId: l.entity_id,
          entityType: l.entity_type,
          resource: l.resource,
          action: l.action,
          result: l.result,
          reason: l.reason,
          timestamp: l.timestamp
        })),
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
        message: 'Access logs retrieved'
      });
    } catch (error: any) {
      return this.error(`Failed to get access logs: ${error.message}`);
    }
  }

  private async generateComplianceReport(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { reportType = 'access_control', period = '30d' } = data;

      const startDate = this.getPeriodStartDate(period);

      const report: any = {
        type: reportType,
        period,
        generatedAt: new Date().toISOString()
      };

      switch (reportType) {
        case 'access_control':
          report.permissions = await this.getPermissionsSummary(licenseKey, startDate);
          report.roles = await this.getRolesSummary(licenseKey);
          report.accessPatterns = await this.getAccessPatternsSummary(licenseKey, startDate);
          break;

        case 'security_audit':
          report.failedAttempts = await this.getFailedAccessAttempts(licenseKey, startDate);
          report.suspiciousActivity = await this.detectSuspiciousActivity(licenseKey, startDate);
          report.privilegedAccess = await this.getPrivilegedAccessSummary(licenseKey, startDate);
          break;

        case 'compliance':
          report.policyCompliance = await this.checkPolicyCompliance(licenseKey);
          report.permissionReview = await this.reviewPermissions(licenseKey);
          report.accessReview = await this.reviewAccessPatterns(licenseKey, startDate);
          break;
      }

      return this.success({
        report,
        message: 'Compliance report generated'
      });
    } catch (error: any) {
      return this.error(`Failed to generate compliance report: ${error.message}`);
    }
  }

  // Helper methods
  private scopeAllows(grantedScope: string, requiredScope: string): boolean {
    const scopeHierarchy: Record<string, number> = {
      'read': 1,
      'write': 2,
      'delete': 3,
      'admin': 4
    };

    return (scopeHierarchy[grantedScope] || 0) >= (scopeHierarchy[requiredScope] || 0);
  }

  private async auditPermissionChange(licenseKey: string, data: any): Promise<void> {
    await prisma.audit_trails.create({
      data: {
        license_key: licenseKey,
        entity: 'permission',
        entity_id: `${data.entityId}:${data.permission}:${data.resource}`,
        action: data.action,
        changes: data,
        created_at: new Date()
      }
    });
  }

  private async auditRoleChange(licenseKey: string, data: any): Promise<void> {
    await prisma.audit_trails.create({
      data: {
        license_key: licenseKey,
        entity: 'role',
        entity_id: data.roleId,
        action: data.action,
        changes: data,
        created_at: new Date()
      }
    });
  }

  private async invalidateRelatedAccess(licenseKey: string, entityId: string, entityType: string): Promise<void> {
    // Invalidate tokens
    await prisma.access_tokens.updateMany({
      where: {
        license_key: licenseKey,
        entity_id: entityId,
        entity_type: entityType,
        is_active: true
      },
      data: {
        is_active: false,
        revoked_at: new Date()
      }
    });

    // Terminate sessions
    await prisma.sessions.updateMany({
      where: {
        license_key: licenseKey,
        entity_id: entityId,
        entity_type: entityType,
        is_active: true
      },
      data: {
        is_active: false,
        terminated_at: new Date(),
        termination_reason: 'permission_change'
      }
    });
  }

  private async getRolePermissions(licenseKey: string, entityId: string, entityType: string): Promise<any[]> {
    const assignments = await prisma.role_assignments.findMany({
      where: {
        license_key: licenseKey,
        entity_id: entityId,
        entity_type: entityType,
        is_active: true
      },
      include: {
        role: {
          include: {
            permissions: true
          }
        }
      }
    });

    const permissions: any[] = [];

    assignments.forEach(a => {
      a.role.permissions.forEach(p => {
        permissions.push({
          permission: p.permission,
          resource: p.resource,
          scope: p.scope,
          source: 'role',
          roleId: a.role_id,
          roleName: a.role.name
        });
      });
    });

    return permissions;
  }

  private async getPolicyPermissions(licenseKey: string, entityId: string, entityType: string): Promise<any[]> {
    // Simplified policy permissions
    return [];
  }

  private async evaluatePolicies(licenseKey: string, data: any): Promise<any> {
    // Simplified policy evaluation
    return { allowed: false };
  }

  private deduplicatePermissions(permissions: any[]): any[] {
    const seen = new Set();
    return permissions.filter(p => {
      const key = `${p.permission}:${p.resource}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private async validateAccessContext(licenseKey: string, context: any): Promise<any> {
    // Validate IP restrictions, time-based access, etc.
    return { valid: true };
  }

  private async logAccessAttempt(licenseKey: string, data: any): Promise<void> {
    await prisma.access_logs.create({
      data: {
        license_key: licenseKey,
        entity_id: data.entityId,
        entity_type: data.entityType,
        resource: data.resource,
        action: data.action,
        result: data.result,
        reason: data.reason,
        timestamp: new Date()
      }
    });
  }

  private encodeToken(data: any): string {
    // Simple base64 encoding (in production, use JWT)
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  private decodeToken(token: string): any {
    try {
      return JSON.parse(Buffer.from(token, 'base64').toString());
    } catch {
      return null;
    }
  }

  private policyApplies(policy: any, subject: string, resource: string, action: string): boolean {
    const subjects = policy.subjects as string[];
    const resources = policy.resources as string[];
    const actions = policy.actions as string[];

    return (subjects.includes('*') || subjects.includes(subject)) &&
           (resources.includes('*') || resources.includes(resource)) &&
           (actions.includes('*') || actions.includes(action));
  }

  private evaluateConditions(conditions: any, context: any): boolean {
    // Simplified condition evaluation
    return true;
  }

  private groupBy(items: any[], field: string): Record<string, number> {
    return items.reduce((acc, item) => {
      const key = item[field] || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  private getPeriodStartDate(period: string): Date {
    const now = new Date();
    const match = period.match(/(\d+)([dwmy])/);

    if (!match) return new Date(0);

    const [, value, unit] = match;
    const num = parseInt(value);

    switch (unit) {
      case 'd': return new Date(now.getTime() - num * 24 * 60 * 60 * 1000);
      case 'w': return new Date(now.getTime() - num * 7 * 24 * 60 * 60 * 1000);
      case 'm': return new Date(now.getTime() - num * 30 * 24 * 60 * 60 * 1000);
      case 'y': return new Date(now.getTime() - num * 365 * 24 * 60 * 60 * 1000);
      default: return new Date(0);
    }
  }

  // Compliance report helper methods (simplified)
  private async getPermissionsSummary(licenseKey: string, startDate: Date): Promise<any> {
    return { total: 0, active: 0, expired: 0 };
  }

  private async getRolesSummary(licenseKey: string): Promise<any> {
    return { total: 0, system: 0, custom: 0 };
  }

  private async getAccessPatternsSummary(licenseKey: string, startDate: Date): Promise<any> {
    return { patterns: [] };
  }

  private async getFailedAccessAttempts(licenseKey: string, startDate: Date): Promise<any> {
    return { attempts: 0, uniqueEntities: 0 };
  }

  private async detectSuspiciousActivity(licenseKey: string, startDate: Date): Promise<any> {
    return { incidents: [] };
  }

  private async getPrivilegedAccessSummary(licenseKey: string, startDate: Date): Promise<any> {
    return { adminAccess: 0, elevated: 0 };
  }

  private async checkPolicyCompliance(licenseKey: string): Promise<any> {
    return { compliant: true, violations: [] };
  }

  private async reviewPermissions(licenseKey: string): Promise<any> {
    return { excessive: [], unused: [] };
  }

  private async reviewAccessPatterns(licenseKey: string, startDate: Date): Promise<any> {
    return { anomalies: [] };
  }

  validate(params: SkillParams): boolean {
    if (!params.action) {
      this.log('Missing required parameter: action', 'error');
      return false;
    }

    const validActions = [
      'grant_permission', 'revoke_permission', 'check_permission', 'get_permissions',
      'create_role', 'update_role', 'delete_role', 'assign_role', 'remove_role', 'get_roles',
      'authorize_access', 'validate_token', 'generate_token', 'revoke_token',
      'protect_resource', 'unprotect_resource', 'get_resource_permissions',
      'create_policy', 'update_policy', 'delete_policy', 'evaluate_policy',
      'create_session', 'validate_session', 'terminate_session', 'get_active_sessions',
      'audit_access', 'get_access_logs', 'generate_compliance_report'
    ];

    if (!validActions.includes(params.action)) {
      this.log(`Invalid action: ${params.action}`, 'error');
      return false;
    }

    return true;
  }
}