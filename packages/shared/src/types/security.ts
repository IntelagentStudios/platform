// Security and Compliance Types

export interface AuditLog {
  id: string
  organizationId: string
  userId?: string | null
  
  // Audit Details
  action: AuditAction
  resource: string
  resourceId?: string | null
  
  // Changes
  oldValue?: any | null
  newValue?: any | null
  
  // Context
  ipAddress?: string | null
  userAgent?: string | null
  metadata?: Record<string, any> | null
  
  // Timestamps
  createdAt: Date
  
  // Relations
  organization?: Organization
  user?: User | null
}

export interface SecuritySetting {
  id: string
  organizationId: string
  
  // Security Policies
  requireTwoFactor: boolean
  ipWhitelist: string[]
  allowedDomains: string[]
  sessionTimeout: number // in minutes
  passwordPolicy: PasswordPolicy
  
  // Compliance
  gdprEnabled: boolean
  ccpaEnabled: boolean
  hipaaEnabled: boolean
  soc2Compliant: boolean
  dataRetentionDays: number
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
}

export interface ApiKey {
  id: string
  organizationId: string
  userId?: string | null
  
  // Key Details
  name: string
  key: string // Partial key for display (e.g., "sk_live_...xyz")
  hashedKey: string // Full hashed key for verification
  
  // Permissions
  scopes: ApiScope[]
  rateLimit: number // requests per hour
  
  // Status
  isActive: boolean
  expiresAt?: Date | null
  lastUsedAt?: Date | null
  
  // Timestamps
  createdAt: Date
  revokedAt?: Date | null
  
  // Relations
  organization?: Organization
  user?: User | null
}

export interface Webhook {
  id: string
  organizationId: string
  
  // Webhook Details
  url: string
  events: WebhookEvent[]
  secret: string // For signature verification
  
  // Status
  isActive: boolean
  failureCount: number
  lastTriggeredAt?: Date | null
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
  
  // Relations
  organization?: Organization
}

export interface SecurityIncident {
  id: string
  organizationId: string
  
  // Incident Details
  type: IncidentType
  severity: IncidentSeverity
  title: string
  description: string
  
  // Detection
  detectedAt: Date
  detectedBy: string // system, user, external
  
  // Impact
  affectedResources: string[]
  affectedUsers: string[]
  dataCompromised?: boolean
  
  // Response
  status: IncidentStatus
  assignedTo?: string | null
  resolvedAt?: Date | null
  resolution?: string | null
  
  // Metadata
  metadata?: Record<string, any>
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
}

export interface ComplianceReport {
  id: string
  organizationId: string
  
  // Report Details
  type: ComplianceType
  period: {
    start: Date
    end: Date
  }
  
  // Compliance Status
  overallScore: number // 0-100
  status: ComplianceStatus
  
  // Findings
  findings: ComplianceFinding[]
  
  // Recommendations
  recommendations: string[]
  
  // Certification
  certifiedBy?: string | null
  certifiedAt?: Date | null
  expiresAt?: Date | null
  
  // Timestamps
  generatedAt: Date
}

export interface ComplianceFinding {
  id: string
  requirement: string
  category: string
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable'
  evidence?: string[]
  notes?: string
  remediation?: string
}

export interface DataPrivacyRequest {
  id: string
  organizationId: string
  userId: string
  
  // Request Details
  type: PrivacyRequestType
  status: PrivacyRequestStatus
  
  // Processing
  requestedAt: Date
  processedAt?: Date | null
  processedBy?: string | null
  
  // Data
  dataProvided?: any | null
  dataDeleted?: boolean
  
  // Verification
  verificationToken?: string
  verifiedAt?: Date | null
  
  // Metadata
  metadata?: Record<string, any>
}

export interface SecurityScore {
  organizationId: string
  
  // Overall Score
  score: number // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  
  // Category Scores
  categories: {
    authentication: number
    authorization: number
    dataProtection: number
    networkSecurity: number
    incidentResponse: number
    compliance: number
  }
  
  // Risk Factors
  risks: SecurityRisk[]
  
  // Recommendations
  recommendations: SecurityRecommendation[]
  
  // Trends
  trend: 'improving' | 'declining' | 'stable'
  previousScore?: number
  
  // Timestamps
  calculatedAt: Date
}

export interface SecurityRisk {
  id: string
  category: string
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  impact: string
  likelihood: 'very_likely' | 'likely' | 'possible' | 'unlikely'
  mitigation: string
}

export interface SecurityRecommendation {
  id: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  effort: 'low' | 'medium' | 'high'
  impact: 'low' | 'medium' | 'high'
  implementationGuide?: string
}

// Authentication & Authorization

export interface TwoFactorAuth {
  userId: string
  
  // Methods
  methods: TwoFactorMethod[]
  
  // Backup Codes
  backupCodes: string[]
  backupCodesUsed: number
  
  // Recovery
  recoveryEmail?: string
  recoveryPhone?: string
  
  // Status
  enabled: boolean
  enforcedAt?: Date | null
  lastUsedAt?: Date | null
}

export interface TwoFactorMethod {
  id: string
  type: 'totp' | 'sms' | 'email' | 'hardware'
  name: string
  isDefault: boolean
  verifiedAt: Date
  lastUsedAt?: Date | null
}

export interface LoginAttempt {
  id: string
  email: string
  
  // Attempt Details
  success: boolean
  ipAddress: string
  userAgent?: string
  location?: string
  
  // Security
  suspicious: boolean
  blocked?: boolean
  reason?: string
  
  // Timestamps
  attemptedAt: Date
}

// Interfaces and Types

export interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  preventReuse: number // Number of previous passwords to check
  expirationDays?: number
  requireChangeOnFirstLogin: boolean
}

// Enums

export enum AuditAction {
  // User Actions
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_REGISTER = 'user.register',
  USER_UPDATE = 'user.update',
  USER_DELETE = 'user.delete',
  USER_PASSWORD_CHANGE = 'user.password_change',
  USER_2FA_ENABLE = 'user.2fa_enable',
  USER_2FA_DISABLE = 'user.2fa_disable',
  
  // Organization Actions
  ORG_CREATE = 'org.create',
  ORG_UPDATE = 'org.update',
  ORG_DELETE = 'org.delete',
  ORG_BILLING_UPDATE = 'org.billing_update',
  
  // Team Actions
  TEAM_CREATE = 'team.create',
  TEAM_UPDATE = 'team.update',
  TEAM_DELETE = 'team.delete',
  TEAM_MEMBER_ADD = 'team.member_add',
  TEAM_MEMBER_REMOVE = 'team.member_remove',
  TEAM_MEMBER_ROLE_CHANGE = 'team.member_role_change',
  
  // Security Actions
  API_KEY_CREATE = 'api_key.create',
  API_KEY_DELETE = 'api_key.delete',
  WEBHOOK_CREATE = 'webhook.create',
  WEBHOOK_UPDATE = 'webhook.update',
  WEBHOOK_DELETE = 'webhook.delete',
  SECURITY_SETTING_UPDATE = 'security.setting_update',
  
  // Data Actions
  DATA_EXPORT = 'data.export',
  DATA_IMPORT = 'data.import',
  DATA_DELETE = 'data.delete',
  
  // Compliance Actions
  COMPLIANCE_REPORT_GENERATE = 'compliance.report_generate',
  PRIVACY_REQUEST_CREATE = 'privacy.request_create',
  PRIVACY_REQUEST_COMPLETE = 'privacy.request_complete'
}

export enum ApiScope {
  // Read Scopes
  READ_PROFILE = 'read:profile',
  READ_ORGANIZATION = 'read:organization',
  READ_TEAMS = 'read:teams',
  READ_PROJECTS = 'read:projects',
  READ_ANALYTICS = 'read:analytics',
  READ_FINANCIAL = 'read:financial',
  READ_AUDIT = 'read:audit',
  
  // Write Scopes
  WRITE_PROFILE = 'write:profile',
  WRITE_ORGANIZATION = 'write:organization',
  WRITE_TEAMS = 'write:teams',
  WRITE_PROJECTS = 'write:projects',
  
  // Product Scopes
  CHATBOT_ACCESS = 'chatbot:access',
  SALES_AGENT_ACCESS = 'sales_agent:access',
  SETUP_AGENT_ACCESS = 'setup_agent:access',
  ENRICHMENT_ACCESS = 'enrichment:access',
  
  // Admin Scopes
  ADMIN_USERS = 'admin:users',
  ADMIN_BILLING = 'admin:billing',
  ADMIN_SECURITY = 'admin:security',
  ADMIN_FULL = 'admin:full'
}

export enum WebhookEvent {
  // User Events
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_LOGIN = 'user.login',
  
  // Team Events
  TEAM_CREATED = 'team.created',
  TEAM_UPDATED = 'team.updated',
  TEAM_DELETED = 'team.deleted',
  TEAM_MEMBER_ADDED = 'team.member.added',
  TEAM_MEMBER_REMOVED = 'team.member.removed',
  
  // Project Events
  PROJECT_CREATED = 'project.created',
  PROJECT_UPDATED = 'project.updated',
  PROJECT_DELETED = 'project.deleted',
  
  // Billing Events
  INVOICE_CREATED = 'invoice.created',
  INVOICE_PAID = 'invoice.paid',
  INVOICE_OVERDUE = 'invoice.overdue',
  PAYMENT_FAILED = 'payment.failed',
  SUBSCRIPTION_UPDATED = 'subscription.updated',
  SUBSCRIPTION_CANCELLED = 'subscription.cancelled',
  
  // Security Events
  SECURITY_ALERT = 'security.alert',
  SUSPICIOUS_ACTIVITY = 'security.suspicious_activity',
  
  // Usage Events
  USAGE_LIMIT_WARNING = 'usage.limit_warning',
  USAGE_LIMIT_EXCEEDED = 'usage.limit_exceeded'
}

export enum IncidentType {
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  DATA_BREACH = 'data_breach',
  MALWARE = 'malware',
  DDOS = 'ddos',
  PHISHING = 'phishing',
  INSIDER_THREAT = 'insider_threat',
  MISCONFIGURATION = 'misconfiguration',
  VULNERABILITY = 'vulnerability',
  COMPLIANCE_VIOLATION = 'compliance_violation'
}

export enum IncidentSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

export enum IncidentStatus {
  DETECTED = 'detected',
  INVESTIGATING = 'investigating',
  CONTAINED = 'contained',
  ERADICATED = 'eradicated',
  RECOVERED = 'recovered',
  CLOSED = 'closed'
}

export enum ComplianceType {
  GDPR = 'gdpr',
  CCPA = 'ccpa',
  HIPAA = 'hipaa',
  SOC2 = 'soc2',
  ISO27001 = 'iso27001',
  PCI_DSS = 'pci_dss'
}

export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  PARTIAL = 'partial',
  NON_COMPLIANT = 'non_compliant',
  PENDING = 'pending'
}

export enum PrivacyRequestType {
  ACCESS = 'access',
  RECTIFICATION = 'rectification',
  DELETION = 'deletion',
  PORTABILITY = 'portability',
  RESTRICTION = 'restriction',
  OBJECTION = 'objection'
}

export enum PrivacyRequestStatus {
  PENDING = 'pending',
  VERIFYING = 'verifying',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

// Import types
import type { Organization, User } from './organization'