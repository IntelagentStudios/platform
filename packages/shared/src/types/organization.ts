// Organization and Team Types

export interface Organization {
  id: string
  name: string
  slug: string
  domain?: string | null
  logo?: string | null
  website?: string | null
  industry?: string | null
  size?: string | null
  
  // Billing & Subscription
  stripeCustomerId?: string | null
  subscriptionId?: string | null
  subscriptionTier: SubscriptionTier
  subscriptionStatus: SubscriptionStatus
  billingEmail?: string | null
  
  // Financial
  mrr: number
  ltv: number
  totalSpent: number
  creditBalance: number
  
  // Settings
  settings: OrganizationSettings
  features: string[]
  metadata?: Record<string, any> | null
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}

export interface Team {
  id: string
  organizationId: string
  name: string
  slug: string
  description?: string | null
  
  // Settings
  settings: TeamSettings
  permissions: Permission[]
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  
  // Relations
  organization?: Organization
  members?: TeamMember[]
  projects?: Project[]
}

export interface User {
  id: string
  organizationId?: string | null
  email: string
  name?: string | null
  avatar?: string | null
  phone?: string | null
  
  // Authentication
  emailVerified: boolean
  emailVerifiedAt?: Date | null
  
  // Two-Factor Auth
  twoFactorEnabled: boolean
  recoveryEmail?: string | null
  
  // Status & Settings
  status: UserStatus
  role: UserRole
  preferences: UserPreferences
  lastActiveAt?: Date | null
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
  
  // Relations
  organization?: Organization | null
  teamMemberships?: TeamMember[]
  sessions?: Session[]
  activities?: Activity[]
  notifications?: Notification[]
}

export interface TeamMember {
  id: string
  teamId: string
  userId: string
  role: TeamRole
  permissions: Permission[]
  
  // Timestamps
  joinedAt: Date
  updatedAt: Date
  
  // Relations
  team?: Team
  user?: User
}

export interface Project {
  id: string
  teamId: string
  
  // Project Details
  name: string
  description?: string | null
  status: ProjectStatus
  
  // Settings
  settings: ProjectSettings
  metadata?: Record<string, any> | null
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  
  // Relations
  team?: Team
  activities?: Activity[]
}

// Enums and Types

export enum SubscriptionTier {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
  CUSTOM = 'custom'
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIALING = 'trialing',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  UNPAID = 'unpaid',
  INCOMPLETE = 'incomplete'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending'
}

export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MANAGER = 'manager',
  MEMBER = 'member',
  VIEWER = 'viewer'
}

export enum TeamRole {
  LEAD = 'lead',
  MEMBER = 'member',
  VIEWER = 'viewer'
}

export enum ProjectStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

export enum Permission {
  // Organization
  ORG_VIEW = 'org:view',
  ORG_EDIT = 'org:edit',
  ORG_DELETE = 'org:delete',
  ORG_BILLING = 'org:billing',
  
  // Teams
  TEAM_CREATE = 'team:create',
  TEAM_VIEW = 'team:view',
  TEAM_EDIT = 'team:edit',
  TEAM_DELETE = 'team:delete',
  TEAM_INVITE = 'team:invite',
  TEAM_REMOVE_MEMBER = 'team:remove_member',
  
  // Projects
  PROJECT_CREATE = 'project:create',
  PROJECT_VIEW = 'project:view',
  PROJECT_EDIT = 'project:edit',
  PROJECT_DELETE = 'project:delete',
  
  // Products
  CHATBOT_VIEW = 'chatbot:view',
  CHATBOT_EDIT = 'chatbot:edit',
  CHATBOT_DELETE = 'chatbot:delete',
  
  SALES_AGENT_VIEW = 'sales_agent:view',
  SALES_AGENT_EDIT = 'sales_agent:edit',
  SALES_AGENT_DELETE = 'sales_agent:delete',
  
  SETUP_AGENT_VIEW = 'setup_agent:view',
  SETUP_AGENT_EDIT = 'setup_agent:edit',
  SETUP_AGENT_DELETE = 'setup_agent:delete',
  
  ENRICHMENT_VIEW = 'enrichment:view',
  ENRICHMENT_EDIT = 'enrichment:edit',
  ENRICHMENT_DELETE = 'enrichment:delete',
  
  // Analytics
  ANALYTICS_VIEW = 'analytics:view',
  ANALYTICS_EXPORT = 'analytics:export',
  
  // Security
  SECURITY_VIEW = 'security:view',
  SECURITY_EDIT = 'security:edit',
  AUDIT_VIEW = 'audit:view',
  API_KEY_CREATE = 'api_key:create',
  API_KEY_DELETE = 'api_key:delete',
  
  // Financial
  FINANCIAL_VIEW = 'financial:view',
  FINANCIAL_EXPORT = 'financial:export',
  INVOICE_VIEW = 'invoice:view',
  INVOICE_PAY = 'invoice:pay'
}

// Settings Interfaces

export interface OrganizationSettings {
  branding?: {
    primaryColor?: string
    logo?: string
    favicon?: string
  }
  notifications?: {
    email?: boolean
    slack?: boolean
    webhook?: boolean
  }
  security?: {
    requireTwoFactor?: boolean
    ipWhitelist?: string[]
    sessionTimeout?: number
  }
  integrations?: {
    slack?: {
      enabled: boolean
      webhookUrl?: string
    }
    zapier?: {
      enabled: boolean
      apiKey?: string
    }
  }
}

export interface TeamSettings {
  defaultPermissions?: Permission[]
  notifications?: {
    email?: boolean
    inApp?: boolean
  }
  workingHours?: {
    timezone?: string
    start?: string
    end?: string
  }
}

export interface ProjectSettings {
  visibility?: 'public' | 'team' | 'private'
  allowComments?: boolean
  requireApproval?: boolean
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system'
  language?: string
  timezone?: string
  notifications?: {
    email?: boolean
    push?: boolean
    sms?: boolean
    digest?: 'daily' | 'weekly' | 'never'
  }
  dashboard?: {
    layout?: 'grid' | 'list'
    widgets?: string[]
  }
}

// Activity and Notification Types

export interface Activity {
  id: string
  userId: string
  projectId?: string | null
  
  // Activity Details
  type: ActivityType
  action: string
  target?: string | null
  targetId?: string | null
  
  // Context
  metadata?: Record<string, any> | null
  
  // Timestamps
  createdAt: Date
  
  // Relations
  user?: User
  project?: Project | null
}

export enum ActivityType {
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_REGISTER = 'user_register',
  USER_UPDATE = 'user_update',
  
  TEAM_CREATE = 'team_create',
  TEAM_UPDATE = 'team_update',
  TEAM_DELETE = 'team_delete',
  TEAM_MEMBER_ADD = 'team_member_add',
  TEAM_MEMBER_REMOVE = 'team_member_remove',
  
  PROJECT_CREATE = 'project_create',
  PROJECT_UPDATE = 'project_update',
  PROJECT_DELETE = 'project_delete',
  
  LICENSE_CREATE = 'license_create',
  LICENSE_ACTIVATE = 'license_activate',
  LICENSE_EXPIRE = 'license_expire',
  
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  
  API_KEY_CREATE = 'api_key_create',
  API_KEY_DELETE = 'api_key_delete',
  
  WEBHOOK_CREATE = 'webhook_create',
  WEBHOOK_UPDATE = 'webhook_update',
  WEBHOOK_DELETE = 'webhook_delete'
}

export interface Notification {
  id: string
  userId: string
  
  // Notification Details
  type: NotificationType
  title: string
  message: string
  
  // Status
  isRead: boolean
  readAt?: Date | null
  
  // Context
  actionUrl?: string | null
  metadata?: Record<string, any> | null
  
  // Timestamps
  createdAt: Date
  
  // Relations
  user?: User
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  
  TEAM_INVITE = 'team_invite',
  PROJECT_UPDATE = 'project_update',
  PAYMENT_DUE = 'payment_due',
  USAGE_LIMIT = 'usage_limit',
  SECURITY_ALERT = 'security_alert',
  SYSTEM_UPDATE = 'system_update'
}

// Session Type

export interface Session {
  id: string
  userId: string
  token: string
  
  // Session Details
  ipAddress?: string | null
  userAgent?: string | null
  location?: string | null
  deviceType?: string | null
  
  // Security
  isActive: boolean
  lastActivityAt: Date
  expiresAt: Date
  
  // Timestamps
  createdAt: Date
  
  // Relations
  user?: User
}