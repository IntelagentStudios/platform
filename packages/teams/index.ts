import { prisma } from '@intelagent/database';
import { generateSecureToken, hashData } from '@intelagent/security';
import { sendWelcomeNotification } from '@intelagent/notifications';
import crypto from 'crypto';

interface TeamMember {
  id?: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions?: string[];
  teamId?: string;
}

interface Team {
  id?: string;
  name: string;
  description?: string;
  permissions?: string[];
}

interface Organization {
  id?: string;
  name: string;
  licenseKey: string;
  settings?: Record<string, any>;
}

type Permission = 
  | 'view:all'
  | 'edit:all'
  | 'delete:all'
  | 'manage:team'
  | 'manage:billing'
  | 'manage:settings'
  | 'view:analytics'
  | 'edit:products'
  | 'view:products'
  | 'export:data';

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  owner: [
    'view:all', 'edit:all', 'delete:all', 
    'manage:team', 'manage:billing', 'manage:settings',
    'view:analytics', 'edit:products', 'export:data'
  ],
  admin: [
    'view:all', 'edit:all',
    'manage:team', 'view:analytics', 
    'edit:products', 'export:data'
  ],
  member: [
    'view:all', 'edit:products',
    'view:analytics', 'export:data'
  ],
  viewer: [
    'view:all', 'view:products', 'view:analytics'
  ]
};

class TeamCollaborationService {
  // Organization Management
  async createOrganization(
    name: string,
    licenseKey: string,
    ownerEmail: string,
    ownerName: string
  ): Promise<Organization> {
    // Create organization
    const org = await prisma.organizations.create({
      data: {
        name,
        license_key: licenseKey,
        settings: {
          allowInvites: true,
          requireApproval: false,
          maxTeams: 10,
          maxMembers: 50
        }
      }
    });

    // Add owner as first member
    await prisma.team_members.create({
      data: {
        organization_id: org.id,
        user_id: crypto.randomUUID(),
        email: ownerEmail,
        name: ownerName,
        role: 'owner',
        permissions: ROLE_PERMISSIONS.owner,
        status: 'active',
        joined_at: new Date()
      }
    });

    // Log audit event
    await this.logAudit(
      org.id,
      licenseKey,
      null,
      'organization.created',
      'organization',
      org.id,
      { name, owner: ownerEmail }
    );

    return org;
  }

  async getOrganization(organizationId: string): Promise<Organization | null> {
    return await prisma.organizations.findUnique({
      where: { id: organizationId },
      include: {
        teams: true,
        team_members: {
          where: { status: 'active' }
        }
      }
    });
  }

  async updateOrganizationSettings(
    organizationId: string,
    settings: Record<string, any>,
    userId: string
  ): Promise<void> {
    const org = await prisma.organizations.findUnique({
      where: { id: organizationId }
    });

    if (!org) throw new Error('Organization not found');

    await prisma.organizations.update({
      where: { id: organizationId },
      data: {
        settings: { ...org.settings, ...settings },
        updated_at: new Date()
      }
    });

    await this.logAudit(
      organizationId,
      org.license_key,
      userId,
      'organization.settings.updated',
      'organization',
      organizationId,
      settings
    );
  }

  // Team Management
  async createTeam(
    organizationId: string,
    name: string,
    description?: string,
    createdBy?: string
  ): Promise<Team> {
    const team = await prisma.teams.create({
      data: {
        organization_id: organizationId,
        name,
        description,
        permissions: []
      }
    });

    await this.logAudit(
      organizationId,
      '',
      createdBy || null,
      'team.created',
      'team',
      team.id,
      { name, description }
    );

    return team;
  }

  async addTeamMember(
    teamId: string,
    memberId: string,
    addedBy: string
  ): Promise<void> {
    const member = await prisma.team_members.findUnique({
      where: { id: memberId }
    });

    if (!member) throw new Error('Member not found');

    await prisma.team_members.update({
      where: { id: memberId },
      data: { team_id: teamId }
    });

    await this.logAudit(
      member.organization_id,
      '',
      addedBy,
      'team.member.added',
      'team',
      teamId,
      { memberId, memberEmail: member.email }
    );
  }

  async removeTeamMember(
    teamId: string,
    memberId: string,
    removedBy: string
  ): Promise<void> {
    const member = await prisma.team_members.findUnique({
      where: { id: memberId }
    });

    if (!member) throw new Error('Member not found');

    await prisma.team_members.update({
      where: { id: memberId },
      data: { team_id: null }
    });

    await this.logAudit(
      member.organization_id,
      '',
      removedBy,
      'team.member.removed',
      'team',
      teamId,
      { memberId, memberEmail: member.email }
    );
  }

  // Member Management
  async inviteMember(
    organizationId: string,
    email: string,
    name: string,
    role: 'admin' | 'member' | 'viewer',
    invitedBy: string,
    teamId?: string
  ): Promise<TeamMember> {
    // Check if already exists
    const existing = await prisma.team_members.findUnique({
      where: {
        organization_id_email: {
          organization_id: organizationId,
          email
        }
      }
    });

    if (existing) {
      throw new Error('Member already exists in organization');
    }

    // Create invitation token
    const inviteToken = generateSecureToken();
    const userId = crypto.randomUUID();

    const member = await prisma.team_members.create({
      data: {
        organization_id: organizationId,
        team_id: teamId,
        user_id: userId,
        email,
        name,
        role,
        permissions: ROLE_PERMISSIONS[role],
        invited_by: invitedBy,
        invited_at: new Date(),
        status: 'pending'
      }
    });

    // Store invite token (would be in a separate table in production)
    await prisma.audit_logs.create({
      data: {
        organization_id: organizationId,
        license_key: '',
        user_id: userId,
        action: 'invite.created',
        resource_type: 'invite',
        resource_id: inviteToken,
        changes: { email, role, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
      }
    });

    // Send invitation email
    await this.sendInvitationEmail(email, name, inviteToken, organizationId);

    await this.logAudit(
      organizationId,
      '',
      invitedBy,
      'member.invited',
      'member',
      member.id,
      { email, role }
    );

    return member;
  }

  async acceptInvitation(inviteToken: string): Promise<void> {
    // Find invitation
    const invite = await prisma.audit_logs.findFirst({
      where: {
        action: 'invite.created',
        resource_id: inviteToken
      }
    });

    if (!invite) throw new Error('Invalid invitation');

    const inviteData = invite.changes as any;
    if (new Date(inviteData.expiresAt) < new Date()) {
      throw new Error('Invitation expired');
    }

    // Activate member
    await prisma.team_members.update({
      where: { id: invite.user_id! },
      data: {
        status: 'active',
        joined_at: new Date()
      }
    });

    // Delete invitation
    await prisma.audit_logs.delete({
      where: { id: invite.id }
    });

    await this.logAudit(
      invite.organization_id!,
      '',
      invite.user_id!,
      'member.joined',
      'member',
      invite.user_id!,
      {}
    );
  }

  async updateMemberRole(
    memberId: string,
    newRole: 'admin' | 'member' | 'viewer',
    updatedBy: string
  ): Promise<void> {
    const member = await prisma.team_members.findUnique({
      where: { id: memberId }
    });

    if (!member) throw new Error('Member not found');
    if (member.role === 'owner') throw new Error('Cannot change owner role');

    const oldRole = member.role;

    await prisma.team_members.update({
      where: { id: memberId },
      data: {
        role: newRole,
        permissions: ROLE_PERMISSIONS[newRole]
      }
    });

    await this.logAudit(
      member.organization_id,
      '',
      updatedBy,
      'member.role.updated',
      'member',
      memberId,
      { oldRole, newRole }
    );
  }

  async removeMember(
    memberId: string,
    removedBy: string
  ): Promise<void> {
    const member = await prisma.team_members.findUnique({
      where: { id: memberId }
    });

    if (!member) throw new Error('Member not found');
    if (member.role === 'owner') throw new Error('Cannot remove owner');

    await prisma.team_members.update({
      where: { id: memberId },
      data: { status: 'removed' }
    });

    await this.logAudit(
      member.organization_id,
      '',
      removedBy,
      'member.removed',
      'member',
      memberId,
      { email: member.email }
    );
  }

  // Permission Management
  async checkPermission(
    userId: string,
    organizationId: string,
    permission: Permission
  ): Promise<boolean> {
    const member = await prisma.team_members.findFirst({
      where: {
        user_id: userId,
        organization_id: organizationId,
        status: 'active'
      }
    });

    if (!member) return false;

    return member.permissions.includes(permission) || 
           member.permissions.includes('view:all') ||
           (permission.startsWith('view:') && member.permissions.includes('edit:all'));
  }

  async getEffectivePermissions(
    userId: string,
    organizationId: string
  ): Promise<Permission[]> {
    const member = await prisma.team_members.findFirst({
      where: {
        user_id: userId,
        organization_id: organizationId,
        status: 'active'
      },
      include: {
        team: true
      }
    });

    if (!member) return [];

    const permissions = new Set<Permission>(member.permissions as Permission[]);
    
    // Add team permissions if applicable
    if (member.team?.permissions) {
      member.team.permissions.forEach(p => permissions.add(p as Permission));
    }

    return Array.from(permissions);
  }

  // Activity Tracking
  async updateLastActive(userId: string, organizationId: string): Promise<void> {
    await prisma.team_members.updateMany({
      where: {
        user_id: userId,
        organization_id: organizationId
      },
      data: {
        last_active: new Date()
      }
    });
  }

  async getTeamActivity(
    organizationId: string,
    days: number = 30
  ): Promise<any> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [members, auditLogs] = await Promise.all([
      prisma.team_members.findMany({
        where: {
          organization_id: organizationId,
          status: 'active'
        },
        select: {
          id: true,
          name: true,
          email: true,
          last_active: true,
          role: true
        }
      }),

      prisma.audit_logs.findMany({
        where: {
          organization_id: organizationId,
          created_at: { gte: since }
        },
        orderBy: { created_at: 'desc' },
        take: 100
      })
    ]);

    return {
      activeMembers: members.filter(m => 
        m.last_active && m.last_active > since
      ).length,
      totalMembers: members.length,
      recentActivity: auditLogs,
      memberStatus: members.map(m => ({
        ...m,
        isActive: m.last_active && m.last_active > since
      }))
    };
  }

  // Audit Logging
  private async logAudit(
    organizationId: string,
    licenseKey: string,
    userId: string | null,
    action: string,
    resourceType: string,
    resourceId: string,
    changes: any
  ): Promise<void> {
    await prisma.audit_logs.create({
      data: {
        organization_id: organizationId,
        license_key: licenseKey,
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        changes,
        created_at: new Date()
      }
    });
  }

  // Email Notifications
  private async sendInvitationEmail(
    email: string,
    name: string,
    token: string,
    organizationId: string
  ): Promise<void> {
    const org = await prisma.organizations.findUnique({
      where: { id: organizationId }
    });

    // Send email using notification service
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept?token=${token}`;
    
    // This would use the notification service
    console.log(`Sending invite to ${email}: ${inviteUrl}`);
  }

  // Collaboration Features
  async shareResource(
    resourceType: string,
    resourceId: string,
    sharedBy: string,
    sharedWith: string[], // Array of member IDs
    permissions: string[]
  ): Promise<void> {
    // Implementation for sharing dashboards, reports, etc.
    for (const memberId of sharedWith) {
      await prisma.audit_logs.create({
        data: {
          organization_id: '',
          license_key: '',
          user_id: sharedBy,
          action: 'resource.shared',
          resource_type: resourceType,
          resource_id: resourceId,
          changes: {
            sharedWith: memberId,
            permissions
          }
        }
      });
    }
  }

  async getSharedResources(userId: string): Promise<any[]> {
    const shares = await prisma.audit_logs.findMany({
      where: {
        action: 'resource.shared',
        changes: {
          path: ['sharedWith'],
          equals: userId
        }
      }
    });

    return shares;
  }
}

// Singleton instance
const teamCollaboration = new TeamCollaborationService();

export { 
  teamCollaboration, 
  TeamCollaborationService, 
  TeamMember, 
  Team, 
  Organization,
  Permission,
  ROLE_PERMISSIONS
};