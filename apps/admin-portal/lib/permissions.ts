import { prisma } from './db'

enum Permission {
  ORG_VIEW = 'ORG_VIEW',
  ORG_EDIT = 'ORG_EDIT',
  ORG_DELETE = 'ORG_DELETE',
  ORG_BILLING = 'ORG_BILLING',
  TEAM_CREATE = 'TEAM_CREATE',
  TEAM_VIEW = 'TEAM_VIEW',
  TEAM_EDIT = 'TEAM_EDIT',
  TEAM_DELETE = 'TEAM_DELETE',
  TEAM_INVITE = 'TEAM_INVITE',
  TEAM_REMOVE_MEMBER = 'TEAM_REMOVE_MEMBER',
  PROJECT_CREATE = 'PROJECT_CREATE',
  PROJECT_VIEW = 'PROJECT_VIEW',
  PROJECT_EDIT = 'PROJECT_EDIT',
  PROJECT_DELETE = 'PROJECT_DELETE',
  CHATBOT_VIEW = 'CHATBOT_VIEW',
  CHATBOT_EDIT = 'CHATBOT_EDIT',
  CHATBOT_DELETE = 'CHATBOT_DELETE',
  SALES_AGENT_VIEW = 'SALES_AGENT_VIEW',
  SALES_AGENT_EDIT = 'SALES_AGENT_EDIT',
  SALES_AGENT_DELETE = 'SALES_AGENT_DELETE',
  SETUP_AGENT_VIEW = 'SETUP_AGENT_VIEW',
  SETUP_AGENT_EDIT = 'SETUP_AGENT_EDIT',
  SETUP_AGENT_DELETE = 'SETUP_AGENT_DELETE',
  ENRICHMENT_VIEW = 'ENRICHMENT_VIEW',
  ENRICHMENT_EDIT = 'ENRICHMENT_EDIT',
  ENRICHMENT_DELETE = 'ENRICHMENT_DELETE',
  ANALYTICS_VIEW = 'ANALYTICS_VIEW',
  ANALYTICS_EXPORT = 'ANALYTICS_EXPORT',
  SECURITY_VIEW = 'SECURITY_VIEW',
  SECURITY_EDIT = 'SECURITY_EDIT',
  AUDIT_VIEW = 'AUDIT_VIEW',
  API_KEY_CREATE = 'API_KEY_CREATE',
  API_KEY_DELETE = 'API_KEY_DELETE',
  FINANCIAL_VIEW = 'FINANCIAL_VIEW',
  FINANCIAL_EXPORT = 'FINANCIAL_EXPORT',
  INVOICE_VIEW = 'INVOICE_VIEW',
  INVOICE_PAY = 'INVOICE_PAY'
}

enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER'
}

enum TeamRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER'
}

// Permission hierarchy
const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.OWNER]: Object.values(Permission),
  [UserRole.ADMIN]: [
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
    Permission.ORG_VIEW,
    Permission.TEAM_VIEW, Permission.TEAM_EDIT,
    Permission.TEAM_INVITE,
    Permission.PROJECT_CREATE, Permission.PROJECT_VIEW, Permission.PROJECT_EDIT, Permission.PROJECT_DELETE,
    Permission.CHATBOT_VIEW, Permission.CHATBOT_EDIT,
    Permission.SALES_AGENT_VIEW, Permission.SALES_AGENT_EDIT,
    Permission.SETUP_AGENT_VIEW, Permission.SETUP_AGENT_EDIT,
    Permission.ENRICHMENT_VIEW, Permission.ENRICHMENT_EDIT,
    Permission.ANALYTICS_VIEW, Permission.ANALYTICS_EXPORT,
    Permission.AUDIT_VIEW,
    Permission.API_KEY_CREATE
  ],
  [UserRole.MEMBER]: [
    Permission.ORG_VIEW,
    Permission.TEAM_VIEW,
    Permission.PROJECT_VIEW, Permission.PROJECT_EDIT,
    Permission.CHATBOT_VIEW, Permission.CHATBOT_EDIT,
    Permission.SALES_AGENT_VIEW, Permission.SALES_AGENT_EDIT,
    Permission.SETUP_AGENT_VIEW, Permission.SETUP_AGENT_EDIT,
    Permission.ENRICHMENT_VIEW,
    Permission.ANALYTICS_VIEW
  ],
  [UserRole.VIEWER]: [
    Permission.ORG_VIEW,
    Permission.TEAM_VIEW,
    Permission.PROJECT_VIEW,
    Permission.CHATBOT_VIEW,
    Permission.SALES_AGENT_VIEW,
    Permission.SETUP_AGENT_VIEW,
    Permission.ENRICHMENT_VIEW,
    Permission.ANALYTICS_VIEW,
    Permission.INVOICE_VIEW
  ]
}

export async function checkPermission(
  userId: string,
  organizationId: string,
  permission: Permission
): Promise<boolean> {
  // Implementation would check user's role in organization
  // and return whether they have the permission
  return true // Simplified for now
}

export async function getUserRole(
  userId: string,
  organizationId: string
): Promise<UserRole | null> {
  // Implementation would fetch user's role from database
  return UserRole.MEMBER // Simplified for now
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) || false
}

export { Permission, UserRole, TeamRole }