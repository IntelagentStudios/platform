import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromCookies } from '@/lib/auth'
import { getRateLimitStatus } from '@/lib/rate-limiter'
import { redis } from '@/lib/redis'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthFromCookies()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get rate limit status
    const rateLimits = await getRateLimitStatus(auth.licenseKey)

    // Get storage usage from Redis cache
    const storageKey = `usage:storage:${auth.licenseKey}`
    const cachedStorage = await redis.get(storageKey)
    const storageUsed = cachedStorage ? parseInt(cachedStorage) : 524288000 // Default 500MB

    // Get team member count
    const teamKey = `team:count:${auth.licenseKey}`
    const cachedTeamCount = await redis.get(teamKey)
    const teamMembers = cachedTeamCount ? parseInt(cachedTeamCount) : 3

    // Get current plan limits
    const plan = 'pro' // Default to pro
    const limits = getPlanLimits(plan)

    // Calculate usage percentages
    const calculatePercentage = (used: number, limit: number) => {
      if (limit === -1) return 0 // Unlimited
      return Math.round((used / limit) * 100)
    }

    // Get historical usage data (last 30 days)
    const historicalUsage = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]
      
      // Generate mock historical data
      historicalUsage.push({
        date: dateKey,
        apiCalls: Math.floor(Math.random() * 300) + 50,
        chatbotMessages: Math.floor(Math.random() * 50) + 10,
        enrichmentRequests: Math.floor(Math.random() * 20) + 5,
        storageAdded: Math.floor(Math.random() * 10485760), // Random MB
      })
    }

    // Get usage alerts/warnings
    const alerts = []
    
    if (calculatePercentage(rateLimits.apiMonthly.consumed, rateLimits.apiMonthly.limit) > 80) {
      alerts.push({
        type: 'warning',
        resource: 'API Calls',
        message: `You've used ${calculatePercentage(rateLimits.apiMonthly.consumed, rateLimits.apiMonthly.limit)}% of your monthly API calls`,
        severity: 'medium',
      })
    }

    const usage = {
      current: {
        apiCalls: {
          used: rateLimits.apiMonthly.consumed,
          limit: rateLimits.apiMonthly.limit,
          percentage: calculatePercentage(rateLimits.apiMonthly.consumed, rateLimits.apiMonthly.limit),
          remaining: rateLimits.apiMonthly.remaining,
        },
        storage: {
          used: storageUsed,
          limit: limits.storage,
          percentage: calculatePercentage(storageUsed, limits.storage),
          remaining: limits.storage === -1 ? -1 : limits.storage - storageUsed,
        },
        teamMembers: {
          used: teamMembers,
          limit: limits.teamMembers,
          percentage: calculatePercentage(teamMembers, limits.teamMembers),
          remaining: limits.teamMembers === -1 ? -1 : limits.teamMembers - teamMembers,
        },
        chatbotMessages: {
          used: rateLimits.chatbot.consumed,
          limit: rateLimits.chatbot.limit,
          percentage: calculatePercentage(rateLimits.chatbot.consumed, rateLimits.chatbot.limit),
          remaining: rateLimits.chatbot.remaining,
        },
        enrichmentRequests: {
          used: rateLimits.enrichment.consumed,
          limit: rateLimits.enrichment.limit,
          percentage: calculatePercentage(rateLimits.enrichment.consumed, rateLimits.enrichment.limit),
          remaining: rateLimits.enrichment.remaining,
        },
      },
      historical: historicalUsage,
      alerts,
      recommendations: generateRecommendations(rateLimits, storageUsed, limits, plan),
      plan: {
        current: plan,
        limits,
        resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    }

    return NextResponse.json(usage)
  } catch (error) {
    console.error('Usage fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    )
  }
}

function getPlanLimits(plan: string) {
  switch (plan.toLowerCase()) {
    case 'basic':
      return {
        apiCalls: 1000,
        storage: 1073741824, // 1GB
        teamMembers: 5,
        chatbotMessages: 1000,
        enrichmentRequests: 100,
      }
    case 'enterprise':
      return {
        apiCalls: -1, // Unlimited
        storage: -1,
        teamMembers: -1,
        chatbotMessages: -1,
        enrichmentRequests: -1,
      }
    default: // Pro
      return {
        apiCalls: 10000,
        storage: 10737418240, // 10GB
        teamMembers: 20,
        chatbotMessages: 10000,
        enrichmentRequests: 1000,
      }
  }
}

function generateRecommendations(rateLimits: any, storageUsed: number, limits: any, plan: string) {
  const recommendations = []

  // API usage recommendations
  if (rateLimits.apiMonthly.consumed > limits.apiCalls * 0.8) {
    recommendations.push({
      type: 'upgrade',
      title: 'Consider upgrading your plan',
      description: 'You are approaching your API call limit. Upgrade to get more API calls.',
      action: 'View Plans',
      priority: 'high',
    })
  }

  // Storage recommendations
  if (storageUsed > limits.storage * 0.7 && limits.storage !== -1) {
    recommendations.push({
      type: 'optimization',
      title: 'Optimize storage usage',
      description: 'Consider cleaning up old data or upgrading for more storage space.',
      action: 'Manage Storage',
      priority: 'medium',
    })
  }

  return recommendations
}