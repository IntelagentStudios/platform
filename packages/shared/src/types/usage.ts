// Usage and Resource Management Types

export interface UsageRecord {
  id: string
  organizationId: string
  licenseKey?: string | null
  
  // Usage Metrics
  apiCalls: number
  storageUsed: bigint // in bytes
  bandwidthUsed: bigint // in bytes
  computeTime: number // in seconds
  databaseQueries: number
  websocketMinutes: number
  
  // Product-Specific Usage
  chatbotMessages: number
  emailsSent: number
  enrichmentRequests: number
  setupAgentSessions: number
  
  // Period
  periodStart: Date
  periodEnd: Date
  
  // Cost Calculation
  estimatedCost: number
  
  // Timestamps
  createdAt: Date
  
  // Relations
  organization?: Organization
  license?: License | null
}

export interface UsageLimit {
  id: string
  tier: string
  
  // Limits
  apiCallsPerDay: number
  apiCallsPerMinute: number
  storageGB: number
  bandwidthGB: number
  computeHours: number
  teamMembers: number
  projects: number
  
  // Features
  features: string[]
  
  // Overage Handling
  allowOverage: boolean
  overageRate: number
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
}

export interface UsageSnapshot {
  organizationId: string
  timestamp: Date
  
  // Current Usage
  current: {
    apiCalls: number
    storage: number
    bandwidth: number
    compute: number
    websockets: number
  }
  
  // Limits
  limits: {
    apiCalls: number
    storage: number
    bandwidth: number
    compute: number
    websockets: number
  }
  
  // Percentages
  percentages: {
    apiCalls: number
    storage: number
    bandwidth: number
    compute: number
    websockets: number
  }
  
  // Predictions
  predictions: {
    apiCallsExhaustion?: Date | null
    storageExhaustion?: Date | null
    bandwidthExhaustion?: Date | null
    computeExhaustion?: Date | null
  }
}

export interface UsageAlert {
  id: string
  organizationId: string
  
  // Alert Details
  type: UsageAlertType
  metric: UsageMetric
  threshold: number
  currentValue: number
  
  // Status
  status: AlertStatus
  triggeredAt: Date
  resolvedAt?: Date | null
  
  // Actions
  notificationsSent: string[]
  autoScalingTriggered?: boolean
  
  // Metadata
  metadata?: Record<string, any>
}

export interface RateLimitStatus {
  endpoint: string
  limit: number
  remaining: number
  reset: Date
  retryAfter?: number | null
}

export interface QuotaStatus {
  organizationId: string
  period: 'daily' | 'monthly'
  
  quotas: {
    [key in UsageMetric]: {
      used: number
      limit: number
      remaining: number
      percentage: number
      resetAt: Date
    }
  }
}

// Resource Cost Calculations

export interface ResourceCost {
  organizationId: string
  period: Date
  
  // Base Costs
  baseCost: number
  
  // Usage Costs
  apiCallsCost: number
  storageCost: number
  bandwidthCost: number
  computeCost: number
  
  // Product Costs
  chatbotCost: number
  salesAgentCost: number
  setupAgentCost: number
  enrichmentCost: number
  
  // Additional Costs
  overageCost: number
  supportCost: number
  
  // Credits & Discounts
  credits: number
  discounts: number
  
  // Total
  subtotal: number
  tax: number
  total: number
}

export interface UsageTrend {
  metric: UsageMetric
  period: TrendPeriod
  
  // Data Points
  dataPoints: {
    timestamp: Date
    value: number
  }[]
  
  // Statistics
  average: number
  min: number
  max: number
  trend: 'increasing' | 'decreasing' | 'stable'
  growthRate: number
  
  // Forecast
  forecast?: {
    nextPeriod: number
    confidence: number
  }
}

// Enums

export enum UsageMetric {
  API_CALLS = 'api_calls',
  STORAGE = 'storage',
  BANDWIDTH = 'bandwidth',
  COMPUTE = 'compute',
  DATABASE_QUERIES = 'database_queries',
  WEBSOCKET_CONNECTIONS = 'websocket_connections',
  CHATBOT_MESSAGES = 'chatbot_messages',
  EMAILS_SENT = 'emails_sent',
  ENRICHMENT_REQUESTS = 'enrichment_requests',
  SETUP_SESSIONS = 'setup_sessions'
}

export enum UsageAlertType {
  THRESHOLD_WARNING = 'threshold_warning',
  THRESHOLD_CRITICAL = 'threshold_critical',
  QUOTA_EXCEEDED = 'quota_exceeded',
  UNUSUAL_ACTIVITY = 'unusual_activity',
  RATE_LIMIT = 'rate_limit',
  COST_SPIKE = 'cost_spike'
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  IGNORED = 'ignored'
}

export enum TrendPeriod {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

// Import types
import type { Organization, License } from './organization'