import { prisma } from './db'
import { AuditAction } from '@/types/security'

interface CreateAuditLogParams {
  organizationId: string
  userId: string | null
  action: AuditAction | string
  resource: string
  resourceId?: string | null
  oldValue?: any
  newValue?: any
  ipAddress?: string | null
  userAgent?: string | null
  metadata?: Record<string, any>
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: CreateAuditLogParams) {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        oldValue: params.oldValue ? JSON.stringify(params.oldValue) : null,
        newValue: params.newValue ? JSON.stringify(params.newValue) : null,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        metadata: params.metadata || {}
      }
    })

    // Send to webhook if configured
    await sendAuditWebhook(params.organizationId, auditLog)

    // Check for suspicious activity
    await checkSuspiciousActivity(params)

    return auditLog
  } catch (error) {
    console.error('Error creating audit log:', error)
    // Don't throw - audit logging should not break the main flow
  }
}

/**
 * Query audit logs with filters
 */
export async function queryAuditLogs(
  organizationId: string,
  filters?: {
    userId?: string
    action?: string
    resource?: string
    resourceId?: string
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  }
) {
  const where: any = { organizationId }

  if (filters?.userId) {
    where.userId = filters.userId
  }

  if (filters?.action) {
    where.action = filters.action
  }

  if (filters?.resource) {
    where.resource = filters.resource
  }

  if (filters?.resourceId) {
    where.resourceId = filters.resourceId
  }

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {}
    if (filters?.startDate) {
      where.createdAt.gte = filters.startDate
    }
    if (filters?.endDate) {
      where.createdAt.lte = filters.endDate
    }
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100,
      skip: filters?.offset || 0
    }),
    prisma.auditLog.count({ where })
  ])

  return { logs, total }
}

/**
 * Get audit log statistics
 */
export async function getAuditStats(
  organizationId: string,
  period: 'day' | 'week' | 'month' = 'week'
) {
  const now = new Date()
  let startDate: Date

  switch (period) {
    case 'day':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      break
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
  }

  // Get action counts
  const actionCounts = await prisma.auditLog.groupBy({
    by: ['action'],
    where: {
      organizationId,
      createdAt: { gte: startDate }
    },
    _count: true
  })

  // Get resource counts
  const resourceCounts = await prisma.auditLog.groupBy({
    by: ['resource'],
    where: {
      organizationId,
      createdAt: { gte: startDate }
    },
    _count: true
  })

  // Get top users
  const topUsers = await prisma.auditLog.groupBy({
    by: ['userId'],
    where: {
      organizationId,
      createdAt: { gte: startDate },
      userId: { not: null }
    },
    _count: true,
    orderBy: {
      _count: {
        userId: 'desc'
      }
    },
    take: 10
  })

  // Get user details for top users
  const userIds = topUsers.map(u => u.userId).filter(Boolean) as string[]
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, name: true }
  })

  const userMap = new Map(users.map(u => [u.id, u]))

  return {
    period,
    startDate,
    endDate: now,
    actionCounts: actionCounts.map(a => ({
      action: a.action,
      count: a._count
    })),
    resourceCounts: resourceCounts.map(r => ({
      resource: r.resource,
      count: r._count
    })),
    topUsers: topUsers.map(u => ({
      userId: u.userId,
      user: u.userId ? userMap.get(u.userId) : null,
      count: u._count
    }))
  }
}

/**
 * Export audit logs
 */
export async function exportAuditLogs(
  organizationId: string,
  format: 'json' | 'csv',
  filters?: {
    startDate?: Date
    endDate?: Date
  }
) {
  const { logs } = await queryAuditLogs(organizationId, {
    ...filters,
    limit: 10000 // Max export limit
  })

  if (format === 'json') {
    return JSON.stringify(logs, null, 2)
  }

  // CSV format
  const headers = [
    'Timestamp',
    'User',
    'Action',
    'Resource',
    'Resource ID',
    'IP Address',
    'User Agent'
  ]

  const rows = logs.map(log => [
    log.createdAt.toISOString(),
    log.user?.email || log.userId || 'System',
    log.action,
    log.resource,
    log.resourceId || '',
    log.ipAddress || '',
    log.userAgent || ''
  ])

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return csv
}

/**
 * Send audit log to webhook
 */
async function sendAuditWebhook(organizationId: string, auditLog: any) {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: {
        organizationId,
        isActive: true,
        events: { has: 'audit.log' }
      }
    })

    for (const webhook of webhooks) {
      // Send webhook asynchronously
      fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': webhook.secret
        },
        body: JSON.stringify({
          event: 'audit.log',
          data: auditLog,
          timestamp: new Date().toISOString()
        })
      }).catch(error => {
        console.error(`Failed to send audit webhook to ${webhook.url}:`, error)
        // Increment failure count
        prisma.webhook.update({
          where: { id: webhook.id },
          data: { failureCount: { increment: 1 } }
        }).catch(() => {})
      })
    }
  } catch (error) {
    console.error('Error sending audit webhooks:', error)
  }
}

/**
 * Check for suspicious activity patterns
 */
async function checkSuspiciousActivity(params: CreateAuditLogParams) {
  try {
    // Check for rapid API key creation
    if (params.action === AuditAction.API_KEY_CREATE) {
      const recentKeys = await prisma.auditLog.count({
        where: {
          organizationId: params.organizationId,
          userId: params.userId,
          action: AuditAction.API_KEY_CREATE,
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
          }
        }
      })

      if (recentKeys > 5) {
        await createSecurityAlert(params.organizationId, {
          type: 'suspicious_activity',
          severity: 'medium',
          title: 'Rapid API Key Creation',
          description: `User ${params.userId} created ${recentKeys} API keys in the last hour`,
          userId: params.userId
        })
      }
    }

    // Check for mass deletion
    if (params.action.includes('delete')) {
      const recentDeletions = await prisma.auditLog.count({
        where: {
          organizationId: params.organizationId,
          userId: params.userId,
          action: { contains: 'delete' },
          createdAt: {
            gte: new Date(Date.now() - 10 * 60 * 1000) // Last 10 minutes
          }
        }
      })

      if (recentDeletions > 10) {
        await createSecurityAlert(params.organizationId, {
          type: 'suspicious_activity',
          severity: 'high',
          title: 'Mass Deletion Detected',
          description: `User ${params.userId} deleted ${recentDeletions} items in the last 10 minutes`,
          userId: params.userId
        })
      }
    }

    // Check for unusual login location
    if (params.action === AuditAction.USER_LOGIN && params.ipAddress) {
      // This would typically involve IP geolocation
      // For now, just check if it's a new IP
      const previousLogins = await prisma.auditLog.findMany({
        where: {
          organizationId: params.organizationId,
          userId: params.userId,
          action: AuditAction.USER_LOGIN,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        select: { ipAddress: true },
        distinct: ['ipAddress']
      })

      const knownIPs = previousLogins.map(l => l.ipAddress).filter(Boolean)
      
      if (knownIPs.length > 0 && !knownIPs.includes(params.ipAddress)) {
        await createSecurityAlert(params.organizationId, {
          type: 'new_login_location',
          severity: 'low',
          title: 'Login from New Location',
          description: `User ${params.userId} logged in from new IP: ${params.ipAddress}`,
          userId: params.userId,
          metadata: { ipAddress: params.ipAddress }
        })
      }
    }
  } catch (error) {
    console.error('Error checking suspicious activity:', error)
  }
}

/**
 * Create a security alert
 */
async function createSecurityAlert(
  organizationId: string,
  alert: {
    type: string
    severity: string
    title: string
    description: string
    userId?: string | null
    metadata?: any
  }
) {
  try {
    // Store in database
    await prisma.securityIncident.create({
      data: {
        organizationId,
        type: alert.type as any,
        severity: alert.severity as any,
        title: alert.title,
        description: alert.description,
        detectedAt: new Date(),
        detectedBy: 'system',
        affectedUsers: alert.userId ? [alert.userId] : [],
        affectedResources: [],
        status: 'detected',
        metadata: alert.metadata
      }
    })

    // Send notifications
    // This would typically send emails, Slack messages, etc.
    console.log('Security alert created:', alert)
  } catch (error) {
    console.error('Error creating security alert:', error)
  }
}