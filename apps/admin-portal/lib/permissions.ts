import { prisma } from './db'
import { Permission, UserRole, TeamRole } from '@/types/organization'

// Permission hierarchy
const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.OWNER]: [
    // All permissions
    Permission.ORG_VIEW, Permission.ORG_EDIT, Permission.ORG_DELETE, Permission.ORG_BILLING,
    Permission.TEAM_CREATE, Permission.TEAM_VIEW, Permission.TEAM_EDIT, Permission.TEAM_DELETE,
    Permission.TEAM_INVITE, Permission.TEAM_REMOVE_MEMBER,
    Permission.PROJECT_CREATE, Permission.PROJECT_VIEW, Permission.PROJECT_EDIT, Permission.PROJECT_DELETE,
    Permission.CHATBOT_VIEW, Permission.CHATBOT_EDIT, Permission.CHATBOT_DELETE,
    Permission.SALES_AGENT_VIEW, Permission.SALES_AGENT_EDIT, Permission.SALES_AGENT_DELETE,
    Permission.SETUP_AGENT_VIEW, Permission.SETUP_AGENT_EDIT, Permission.SETUP_AGENT_DELETE,
    Permission.ENRICHMENT_VIEW, Permission.ENRICHMENT_EDIT, Permission.ENRICHMENT_DELETE,
    Permission.ANALYTICS_VIEW, Permission.ANALYTICS_EXPORT,
    Permission.SECURITY_VIEW, Permission.SECURITY_EDIT,
    Permission.AUDIT_VIEW,
    Permission.API_KEY_CREATE, Permission.API_KEY_DELETE,
    Permission.FINANCIAL_VIEW, Permission.FINANCIAL_EXPORT,
    Permission.INVOICE_VIEW, Permission.INVOICE_PAY
  ],
  [UserRole.ADMIN]: [
    // Most permissions except org deletion and some financial
    Permission.ORG_VIEW, Permission.ORG_EDIT, Permission.ORG_BILLING,
    Permission.TEAM_CREATE, Permission.TEAM_VIEW, Permission.TEAM_EDIT, Permission.TEAM_DELETE,
    Permission.TEAM_INVITE, Permission.TEAM_REMOVE_MEMBER,
    Permission.PROJECT_CREATE, Permission.PROJECT_VIEW, Permission.PROJECT_EDIT, Permission.PROJECT_DELETE,
    Permission.CHATBOT_VIEW, Permission.CHATBOT_EDIT, Permission.CHATBOT_DELETE,
    Permission.SALES_AGENT_VIEW, Permission.SALES_AGENT_EDIT, Permission.SALES_AGENT_DELETE,
    Permission.SETUP_AGENT_VIEW, Permission.SETUP_AGENT_EDIT, Permission.SETUP_AGENT_DELETE,
    Permission.ENRICHMENT_VIEW, Permission.ENRICHMENT_EDIT, Permission.ENRICHMENT_DELETE,
    Permission.ANALYTICS_VIEW, Permission.ANALYTICS_EXPORT,
    Permission.SECURITY_VIEW, Permission.SECURITY_EDIT,
    Permission.AUDIT_VIEW,
    Permission.API_KEY_CREATE, Permission.API_KEY_DELETE,
    Permission.FINANCIAL_VIEW,
    Permission.INVOICE_VIEW
  ],
  [UserRole.MANAGER]: [
    // Team and project management, view most things
    Permission.ORG_VIEW,
    Permission.TEAM_VIEW, Permission.TEAM_EDIT,
    Permission.TEAM_INVITE,
    Permission.PROJECT_CREATE, Permission.PROJECT_VIEW, Permission.PROJECT_EDIT, Permission.PROJECT_DELETE,
    Permission.CHATBOT_VIEW, Permission.CHATBOT_EDIT,
    Permission.SALES_AGENT_VIEW, Permission.SALES_AGENT_EDIT,
    Permission.SETUP_AGENT_VIEW, Permission.SETUP_AGENT_EDIT,
    Permission.ENRICHMENT_VIEW, Permission.ENRICHMENT_EDIT,
    Permission.ANALYTICS_VIEW, Permission.ANALYTICS_EXPORT,
    Permission.SECURITY_VIEW,
    Permission.API_KEY_CREATE
  ],
  [UserRole.MEMBER]: [
    // Basic permissions
    Permission.ORG_VIEW,
    Permission.TEAM_VIEW,
    Permission.PROJECT_VIEW, Permission.PROJECT_EDIT,
    Permission.CHATBOT_VIEW,
    Permission.SALES_AGENT_VIEW,
    Permission.SETUP_AGENT_VIEW,
    Permission.ENRICHMENT_VIEW,
    Permission.ANALYTICS_VIEW
  ],
  [UserRole.VIEWER]: [
    // Read-only permissions
    Permission.ORG_VIEW,
    Permission.TEAM_VIEW,
    Permission.PROJECT_VIEW,
    Permission.CHATBOT_VIEW,
    Permission.SALES_AGENT_VIEW,
    Permission.SETUP_AGENT_VIEW,
    Permission.ENRICHMENT_VIEW,
    Permission.ANALYTICS_VIEW
  ]
}

const teamRolePermissions: Record<TeamRole, Permission[]> = {
  [TeamRole.LEAD]: [
    Permission.TEAM_EDIT,
    Permission.TEAM_INVITE,
    Permission.TEAM_REMOVE_MEMBER,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_EDIT,
    Permission.PROJECT_DELETE
  ],
  [TeamRole.MEMBER]: [
    Permission.PROJECT_VIEW,
    Permission.PROJECT_EDIT
  ],
  [TeamRole.VIEWER]: [
    Permission.PROJECT_VIEW
  ]
}

/**
 * Check if a user has a specific permission
 */
export async function hasPermission(
  userIdOrLicenseKey: string,
  organizationId: string,
  permission: Permission | string
): Promise<boolean> {
  try {
    // First try to find user by ID
    let user = await prisma.user.findFirst({
      where: {
        id: userIdOrLicenseKey,
        organizationId
      }
    })

    // If not found by ID, try by email (assuming license key maps to email)
    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          email: userIdOrLicenseKey,
          organizationId
        }
      })
    }

    if (!user) {
      return false
    }

    // Check user's organization role permissions
    const userPermissions = rolePermissions[user.role as UserRole] || []
    if (userPermissions.includes(permission as Permission)) {
      return true
    }

    // Check team-specific permissions
    const teamMemberships = await prisma.teamMember.findMany({
      where: {
        userId: user.id,
        team: {
          organizationId
        }
      }
    })

    for (const membership of teamMemberships) {
      // Check team role permissions
      const teamPerms = teamRolePermissions[membership.role as TeamRole] || []
      if (teamPerms.includes(permission as Permission)) {
        return true
      }

      // Check custom permissions assigned to this team member
      if (membership.permissions.includes(permission as string)) {
        return true
      }
    }

    return false
  } catch (error) {
    console.error('Error checking permission:', error)
    return false
  }
}

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(
  userId: string,
  organizationId: string
): Promise<Permission[]> {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId
      }
    })

    if (!user) {
      return []
    }

    // Start with role permissions
    const permissions = new Set(rolePermissions[user.role as UserRole] || [])

    // Add team permissions
    const teamMemberships = await prisma.teamMember.findMany({
      where: {
        userId: user.id,
        team: {
          organizationId
        }
      }
    })

    for (const membership of teamMemberships) {
      // Add team role permissions
      const teamPerms = teamRolePermissions[membership.role as TeamRole] || []
      teamPerms.forEach(p => permissions.add(p))

      // Add custom permissions
      membership.permissions.forEach(p => permissions.add(p as Permission))
    }

    return Array.from(permissions)
  } catch (error) {
    console.error('Error getting user permissions:', error)
    return []
  }
}

/**
 * Check if a user can perform an action on a specific resource
 */
export async function canAccessResource(
  userId: string,
  resourceType: 'organization' | 'team' | 'project' | 'license',
  resourceId: string,
  action: 'view' | 'edit' | 'delete'
): Promise<boolean> {
  try {
    // Map resource and action to permission
    const permissionMap: Record<string, Permission> = {
      'organization.view': Permission.ORG_VIEW,
      'organization.edit': Permission.ORG_EDIT,
      'organization.delete': Permission.ORG_DELETE,
      'team.view': Permission.TEAM_VIEW,
      'team.edit': Permission.TEAM_EDIT,
      'team.delete': Permission.TEAM_DELETE,
      'project.view': Permission.PROJECT_VIEW,
      'project.edit': Permission.PROJECT_EDIT,
      'project.delete': Permission.PROJECT_DELETE
    }

    const permission = permissionMap[`${resourceType}.${action}`]
    if (!permission) {
      return false
    }

    // Get the organization ID for the resource
    let organizationId: string | null = null

    switch (resourceType) {
      case 'organization':
        organizationId = resourceId
        break
      case 'team':
        const team = await prisma.team.findUnique({
          where: { id: resourceId },
          select: { organizationId: true }
        })
        organizationId = team?.organizationId || null
        break
      case 'project':
        const project = await prisma.project.findUnique({
          where: { id: resourceId },
          select: { team: { select: { organizationId: true } } }
        })
        organizationId = project?.team.organizationId || null
        break
      case 'license':
        const license = await prisma.license.findUnique({
          where: { licenseKey: resourceId },
          select: { organizationId: true }
        })
        organizationId = license?.organizationId || null
        break
    }

    if (!organizationId) {
      return false
    }

    return hasPermission(userId, organizationId, permission)
  } catch (error) {
    console.error('Error checking resource access:', error)
    return false
  }
}

/**
 * Grant permission to a user or team member
 */
export async function grantPermission(
  granterId: string,
  targetUserId: string,
  permission: Permission,
  teamId?: string
): Promise<boolean> {
  try {
    // Check if granter has permission to grant permissions
    // This would typically require TEAM_EDIT or ADMIN role

    if (teamId) {
      // Grant team-specific permission
      await prisma.teamMember.update({
        where: {
          teamId_userId: {
            teamId,
            userId: targetUserId
          }
        },
        data: {
          permissions: {
            push: permission
          }
        }
      })
    } else {
      // For organization-wide permissions, would need to update user role
      // This is typically done through role changes rather than individual permissions
      return false
    }

    return true
  } catch (error) {
    console.error('Error granting permission:', error)
    return false
  }
}

/**
 * Revoke permission from a user or team member
 */
export async function revokePermission(
  revokerId: string,
  targetUserId: string,
  permission: Permission,
  teamId?: string
): Promise<boolean> {
  try {
    if (teamId) {
      const member = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId: targetUserId
          }
        }
      })

      if (member) {
        const updatedPermissions = member.permissions.filter(p => p !== permission)
        
        await prisma.teamMember.update({
          where: {
            teamId_userId: {
              teamId,
              userId: targetUserId
            }
          },
          data: {
            permissions: updatedPermissions
          }
        })
      }
    }

    return true
  } catch (error) {
    console.error('Error revoking permission:', error)
    return false
  }
}