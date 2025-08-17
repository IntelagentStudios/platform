import { prisma } from './db'
import { Redis } from 'ioredis'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

enum UsageMetric {
  API_CALLS = 'API_CALLS',
  STORAGE_BYTES = 'STORAGE_BYTES',
  BANDWIDTH_BYTES = 'BANDWIDTH_BYTES',
  ACTIVE_USERS = 'ACTIVE_USERS',
  CHATBOT_MESSAGES = 'CHATBOT_MESSAGES',
  ENRICHMENT_REQUESTS = 'ENRICHMENT_REQUESTS'
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
  private flushInterval: NodeJS.Timer | null = null
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
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { subscriptionTier: true }
    })

    if (!org) return

    const limits = await prisma.usageLimit.findUnique({
      where: { tier: org.subscriptionTier }
    })

    if (!limits) return

    const current = await this.getCurrentUsage(organizationId)
    const limitMap: Record<UsageMetric, number> = {
      [UsageMetric.API_CALLS]: limits.apiCallsPerDay,
      [UsageMetric.STORAGE]: limits.storageGB * 1073741824,
      [UsageMetric.BANDWIDTH]: limits.bandwidthGB * 1073741824,
      [UsageMetric.COMPUTE]: limits.computeHours * 3600,
      [UsageMetric.DATABASE_QUERIES]: limits.apiCallsPerDay * 10,
      [UsageMetric.WEBSOCKET_CONNECTIONS]: 100,
      [UsageMetric.CHATBOT_MESSAGES]: limits.apiCallsPerDay,
      [UsageMetric.EMAILS_SENT]: limits.apiCallsPerDay / 10,
      [UsageMetric.ENRICHMENT_REQUESTS]: limits.apiCallsPerDay / 5,
      [UsageMetric.SETUP_SESSIONS]: 100
    }

    const limit = limitMap[metric]
    const usage = current[metric] || 0
    const percentage = (usage / limit) * 100

    if (percentage >= 100 && !limits.allowOverage) {
      await this.createUsageAlert(organizationId, {
        type: UsageAlertType.QUOTA_EXCEEDED,
        metric,
        threshold: limit,
        currentValue: usage
      })
      throw new Error(`Usage limit exceeded for ${metric}`)
    } else if (percentage >= 90) {
      await this.createUsageAlert(organizationId, {
        type: UsageAlertType.THRESHOLD_CRITICAL,
        metric,
        threshold: limit * 0.9,
        currentValue: usage
      })
    } else if (percentage >= 75) {
      await this.createUsageAlert(organizationId, {
        type: UsageAlertType.THRESHOLD_WARNING,
        metric,
        threshold: limit * 0.75,
        currentValue: usage
      })
    }
  }

  private async createUsageAlert(organizationId: string, alert: any) {
    await prisma.usageAlert.create({
      data: {
        organizationId,
        ...alert,
        status: 'active',
        triggeredAt: new Date(),
        notificationsSent: []
      }
    })
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

    for (const [organizationId, metrics] of bufferCopy) {
      const now = new Date()
      const periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const periodEnd = new Date(periodStart)
      periodEnd.setDate(periodEnd.getDate() + 1)

      const updates: any = {}
      for (const [metric, value] of metrics) {
        switch (metric) {
          case UsageMetric.API_CALLS:
            updates.apiCalls = { increment: value }
            break
          case UsageMetric.STORAGE:
            updates.storageUsed = { increment: BigInt(value) }
            break
          case UsageMetric.BANDWIDTH:
            updates.bandwidthUsed = { increment: BigInt(value) }
            break
          case UsageMetric.COMPUTE:
            updates.computeTime = { increment: value }
            break
          case UsageMetric.DATABASE_QUERIES:
            updates.databaseQueries = { increment: value }
            break
          case UsageMetric.WEBSOCKET_CONNECTIONS:
            updates.websocketMinutes = { increment: value }
            break
          case UsageMetric.CHATBOT_MESSAGES:
            updates.chatbotMessages = { increment: value }
            break
          case UsageMetric.EMAILS_SENT:
            updates.emailsSent = { increment: value }
            break
          case UsageMetric.ENRICHMENT_REQUESTS:
            updates.enrichmentRequests = { increment: value }
            break
          case UsageMetric.SETUP_SESSIONS:
            updates.setupAgentSessions = { increment: value }
            break
        }
      }

      await prisma.usageRecord.upsert({
        where: {
          organizationId_periodStart_periodEnd: {
            organizationId,
            periodStart,
            periodEnd
          }
        },
        update: updates,
        create: {
          organizationId,
          periodStart,
          periodEnd,
          ...Object.keys(updates).reduce((acc, key) => {
            acc[key] = updates[key].increment
            return acc
          }, {} as any)
        }
      })
    }
  }

  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
  }
}

export const usageTracker = UsageTracker.getInstance()