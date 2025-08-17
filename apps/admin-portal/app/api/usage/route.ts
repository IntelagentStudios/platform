import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthFromCookies } from '@/lib/auth'
import { usageTracker } from '@/lib/usage-tracker'
import { hasPermission } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthFromCookies()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const organizationId = searchParams.get('organizationId')
    const period = searchParams.get('period') || 'current'

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Check permission
    const hasAccess = auth.isMaster || 
      await hasPermission(auth.licenseKey, organizationId, 'ANALYTICS_VIEW')

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get organization and limits
    const [organization, limits] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: organizationId },
        select: { subscriptionTier: true }
      }),
      prisma.usageLimit.findFirst({
        where: { tier: searchParams.get('tier') || 'free' }
      })
    ])

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Get current usage from Redis
    const currentUsage = await usageTracker.getCurrentUsage(organizationId)

    // Get historical usage from database
    const now = new Date()
    let startDate: Date
    let endDate = now

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    }

    const historicalUsage = await prisma.usageRecord.aggregate({
      where: {
        organizationId,
        periodStart: { gte: startDate },
        periodEnd: { lte: endDate }
      },
      _sum: {
        apiCalls: true,
        storageUsed: true,
        bandwidthUsed: true,
        computeTime: true,
        databaseQueries: true,
        websocketMinutes: true,
        chatbotMessages: true,
        emailsSent: true,
        enrichmentRequests: true,
        setupAgentSessions: true,
        estimatedCost: true
      }
    })

    // Calculate percentages and predictions
    const usage = {
      current: currentUsage,
      historical: {
        apiCalls: historicalUsage._sum.apiCalls || 0,
        storageUsed: Number(historicalUsage._sum.storageUsed || 0),
        bandwidthUsed: Number(historicalUsage._sum.bandwidthUsed || 0),
        computeTime: historicalUsage._sum.computeTime || 0,
        databaseQueries: historicalUsage._sum.databaseQueries || 0,
        websocketMinutes: historicalUsage._sum.websocketMinutes || 0,
        chatbotMessages: historicalUsage._sum.chatbotMessages || 0,
        emailsSent: historicalUsage._sum.emailsSent || 0,
        enrichmentRequests: historicalUsage._sum.enrichmentRequests || 0,
        setupAgentSessions: historicalUsage._sum.setupAgentSessions || 0,
        estimatedCost: historicalUsage._sum.estimatedCost || 0
      },
      limits: limits ? {
        apiCallsPerDay: limits.apiCallsPerDay,
        storageGB: limits.storageGB,
        bandwidthGB: limits.bandwidthGB,
        computeHours: limits.computeHours,
        teamMembers: limits.teamMembers,
        projects: limits.projects
      } : null,
      percentages: calculatePercentages(currentUsage, limits),
      predictions: await calculatePredictions(organizationId, currentUsage)
    }

    return NextResponse.json(usage)
  } catch (error) {
    console.error('Error fetching usage:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    )
  }
}

function calculatePercentages(usage: any, limits: any) {
  if (!limits) return {}

  return {
    apiCalls: (usage.api_calls / limits.apiCallsPerDay) * 100,
    storage: (usage.storage / (limits.storageGB * 1073741824)) * 100,
    bandwidth: (usage.bandwidth / (limits.bandwidthGB * 1073741824)) * 100,
    compute: (usage.compute / (limits.computeHours * 3600)) * 100
  }
}

async function calculatePredictions(organizationId: string, currentUsage: any) {
  // Get usage trend for the last 7 days
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  
  const dailyUsage = await prisma.usageRecord.findMany({
    where: {
      organizationId,
      periodStart: { gte: weekAgo }
    },
    orderBy: { periodStart: 'asc' }
  })

  if (dailyUsage.length < 3) {
    return null // Not enough data for predictions
  }

  // Simple linear regression for predictions
  const predictions: any = {}
  
  // Calculate daily average growth
  const metrics = ['apiCalls', 'storageUsed', 'bandwidthUsed', 'computeTime']
  
  for (const metric of metrics) {
    const values = dailyUsage.map(d => d[metric as keyof typeof d] as number || 0)
    const avgDailyGrowth = values.reduce((sum, val, idx) => {
      if (idx === 0) return sum
      return sum + (val - values[idx - 1])
    }, 0) / (values.length - 1)

    const currentValue = currentUsage[metric] || 0
    const daysRemaining = 30 // Predict for next 30 days
    const predictedValue = currentValue + (avgDailyGrowth * daysRemaining)

    predictions[metric] = {
      current: currentValue,
      predicted30Days: Math.max(0, predictedValue),
      dailyGrowth: avgDailyGrowth,
      trend: avgDailyGrowth > 0 ? 'increasing' : avgDailyGrowth < 0 ? 'decreasing' : 'stable'
    }
  }

  return predictions
}