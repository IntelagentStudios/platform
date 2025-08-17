import { prisma } from './db'
import { Redis } from 'ioredis'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

export enum UsageMetric {
  API_CALLS = 'API_CALLS',
  STORAGE_BYTES = 'STORAGE_BYTES',
  BANDWIDTH_BYTES = 'BANDWIDTH_BYTES',
  ACTIVE_USERS = 'ACTIVE_USERS',
  CHATBOT_MESSAGES = 'CHATBOT_MESSAGES',
  ENRICHMENT_REQUESTS = 'ENRICHMENT_REQUESTS',
  COMPUTE = 'COMPUTE',
  BANDWIDTH = 'BANDWIDTH'
}

enum UsageAlertType {
  LIMIT_EXCEEDED = 'LIMIT_EXCEEDED',
  THRESHOLD_REACHED = 'THRESHOLD_REACHED',
  UNUSUAL_ACTIVITY = 'UNUSUAL_ACTIVITY'
}

interface UsageUpdate {
  organizationId: string
  licenseKey?: string
  metric: UsageMetric
  value: number
  timestamp?: Date
}

export class UsageTracker {
  private static instance: UsageTracker
  private flushInterval: NodeJS.Timeout | null = null
  private buffer: Map<string, Map<UsageMetric, number>> = new Map()

  private constructor() {
    this.startFlushInterval()
  }

  static getInstance(): UsageTracker {
    if (!UsageTracker.instance) {
      UsageTracker.instance = new UsageTracker()
    }
    return UsageTracker.instance
  }

  async track(update: UsageUpdate) {
    const key = `${update.organizationId}:${update.metric}`
    
    // Update Redis counter
    await redis.hincrby(
      `usage:realtime:${update.organizationId}`,
      update.metric,
      update.value
    )

    // Update daily counter
    const today = new Date().toISOString().split('T')[0]
    await redis.hincrby(
      `usage:daily:${update.organizationId}:${today}`,
      update.metric,
      update.value
    )

    // Buffer for batch database updates
    if (!this.buffer.has(update.organizationId)) {
      this.buffer.set(update.organizationId, new Map())
    }
    const orgBuffer = this.buffer.get(update.organizationId)!
    orgBuffer.set(
      update.metric,
      (orgBuffer.get(update.metric) || 0) + update.value
    )

    // Check limits
    await this.checkLimits(update.organizationId, update.metric)
  }

  async getCurrentUsage(organizationId: string): Promise<Record<UsageMetric, number>> {
    const usage = await redis.hgetall(`usage:realtime:${organizationId}`)
    const result: Record<string, number> = {}
    
    for (const [key, value] of Object.entries(usage)) {
      result[key as UsageMetric] = parseInt(value) || 0
    }
    
    return result as Record<UsageMetric, number>
  }

  async checkLimits(organizationId: string, metric: UsageMetric) {
    // Simplified version - database models not yet implemented
    // Default limits for now
    const defaultLimits: Record<UsageMetric, number> = {
      [UsageMetric.API_CALLS]: 10000,
      [UsageMetric.STORAGE_BYTES]: 1073741824, // 1GB
      [UsageMetric.BANDWIDTH_BYTES]: 10737418240, // 10GB
      [UsageMetric.ACTIVE_USERS]: 100,
      [UsageMetric.CHATBOT_MESSAGES]: 5000,
      [UsageMetric.ENRICHMENT_REQUESTS]: 1000
    }

    const current = await this.getCurrentUsage(organizationId)
    const limit = defaultLimits[metric] || 1000
    const usage = current[metric] || 0
    const percentage = (usage / limit) * 100

    if (percentage >= 100) {
      console.warn(`Usage limit exceeded for ${metric}:`, {
        organizationId,
        metric,
        usage,
        limit
      })
      // In production, this would throw an error or block the action
    } else if (percentage >= 90) {
      console.warn(`Usage approaching limit for ${metric}:`, {
        organizationId,
        metric,
        usage,
        limit,
        percentage
      })
    }
  }

  private async createUsageAlert(organizationId: string, alert: any) {
    // Simplified version - just log for now
    console.log('Usage alert:', {
      organizationId,
      ...alert,
      timestamp: new Date().toISOString()
    })
    
    // In production, this would store in database and send notifications
  }

  private startFlushInterval() {
    this.flushInterval = setInterval(() => {
      this.flushToDatabase()
    }, 60000) // Flush every minute
  }

  private async flushToDatabase() {
    if (this.buffer.size === 0) return

    const bufferCopy = new Map(this.buffer)
    this.buffer.clear()

    // Simplified version - just log for now
    for (const [organizationId, metrics] of Array.from(bufferCopy)) {
      const now = new Date()
      const periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const periodEnd = new Date(periodStart)
      periodEnd.setDate(periodEnd.getDate() + 1)

      const metricsObj: Record<string, number> = {}
      for (const [metric, value] of Array.from(metrics)) {
        metricsObj[metric] = value
      }

      console.log('Flushing usage metrics to database:', {
        organizationId,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        metrics: metricsObj
      })
    }

    // In production, this would store in database
  }

  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
  }
}

export const usageTracker = UsageTracker.getInstance()