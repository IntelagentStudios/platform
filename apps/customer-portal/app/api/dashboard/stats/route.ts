import { NextResponse } from 'next/server'
import { getAuthFromCookies } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period')
  try {
    const auth = await getAuthFromCookies()
    
    if (!auth || !auth.license_key) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get the user's license data
    const userLicense = await prisma.licenses.findUnique({
      where: { license_key: auth.license_key },
      select: { 
        site_key: true,
        products: true,
        plan: true,
        status: true,
        subscription_status: true
      }
    })
    
    if (!userLicense) {
      return NextResponse.json(
        { error: 'License not found' },
        { status: 404 }
      )
    }

    // Filter data by this license's site_key
    let whereClause: any = {}
    if (userLicense.site_key) {
      whereClause.site_key = userLicense.site_key
    }

    // If requesting previous period stats
    if (period === 'previous') {
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      
      const [prevLicenses, prevConversations, prevSessions] = await Promise.all([
        Promise.resolve(0), // Customer portal doesn't track licenses
        
        prisma.chatbot_logs.groupBy({
          by: ['session_id'],
          where: {
            ...whereClause,
            session_id: { not: null },
            timestamp: {
              gte: sixtyDaysAgo,
              lt: thirtyDaysAgo
            }
          },
          _count: true,
        }).then(result => result.length),

        prisma.chatbot_logs.groupBy({
          by: ['session_id'],
          where: {
            ...whereClause,
            session_id: { not: null },
            timestamp: {
              gte: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
              lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          },
          _count: true,
        }).then(result => result.length)
      ])

      // Calculate previous revenue
      const prevSubscriptions = await prisma.licenses.findMany({
        where: {
          ...({ license_key: auth.license_key}),
          created_at: {
            lt: thirtyDaysAgo
          }
        },
        select: {
          plan: true,
          subscription_status: true
        }
      })

      const planPrices: Record<string, number> = {
        'basic': 25,
        'pro': 89,
        'enterprise': 259,
        'starter': 15
      }

      const prevRevenue = prevSubscriptions.reduce((total, sub) => {
        if (sub.subscription_status === 'active' && sub.plan) {
          return total + (planPrices[sub.plan.toLowerCase()] || 25)
        }
        return total
      }, 0)

      return NextResponse.json({
        totalLicenses: 0,
        activeConversations: prevConversations,
        revenue: prevRevenue,
        sessionsToday: prevSessions,
      })
    }

    // Get counts specific to this license's products
    const [totalConversations, recentConversations, uniqueUsers] = await Promise.all([
      // Total conversations for this license's site
      prisma.chatbot_logs.groupBy({
        by: ['session_id'],
        where: {
          ...whereClause,
          session_id: { not: null }
        },
        _count: true,
      }).then(result => result.length),
      
      // Recent conversations (last 30 days)
      prisma.chatbot_logs.groupBy({
        by: ['session_id'],
        where: {
          ...whereClause,
          session_id: { not: null },
          timestamp: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        _count: true,
      }).then(result => result.length),
      
      // Unique users for this license
      prisma.chatbot_logs.groupBy({
        by: ['user_id'],
        where: {
          ...whereClause,
          user_id: { not: null }
        },
        _count: true,
      }).then(result => result.length)
    ])

    // Calculate previous period for growth comparison
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const previousPeriodConversations = await prisma.chatbot_logs.groupBy({
      by: ['session_id'],
      where: {
        ...whereClause,
        session_id: { not: null },
        timestamp: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo
        }
      },
      _count: true,
    }).then(result => result.length)

    // Calculate real growth percentage
    const monthlyGrowth = previousPeriodConversations > 0
      ? Math.round(((recentConversations - previousPeriodConversations) / previousPeriodConversations) * 100)
      : recentConversations > 0 ? 100 : 0

    // Get sessions from today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const sessionsToday = await prisma.chatbot_logs.groupBy({
      by: ['session_id'],
      where: {
        ...whereClause,
        session_id: { not: null },
        timestamp: {
          gte: todayStart
        }
      },
      _count: true,
    }).then(result => result.length)

    // Calculate average response time from recent conversations
    const recentLogs = await prisma.chatbot_logs.findMany({
      where: {
        ...whereClause,
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      select: {
        timestamp: true,
        session_id: true,
        customer_message: true,
        chatbot_response: true
      },
      orderBy: {
        timestamp: 'asc'
      },
      take: 1000 // Limit to last 1000 messages for performance
    })

    // Calculate response times
    let responseTimes: number[] = []
    const sessionMessages = new Map<string, any[]>()
    
    recentLogs.forEach(log => {
      if (log.session_id) {
        if (!sessionMessages.has(log.session_id)) {
          sessionMessages.set(log.session_id, [])
        }
        sessionMessages.get(log.session_id)!.push(log)
      }
    })

    sessionMessages.forEach(messages => {
      for (let i = 0; i < messages.length - 1; i++) {
        if (messages[i].customer_message && messages[i + 1].chatbot_response) {
          const responseTime = (messages[i + 1].timestamp.getTime() - messages[i].timestamp.getTime()) / 1000
          if (responseTime > 0 && responseTime < 60) { // Reasonable response time (under 60 seconds)
            responseTimes.push(responseTime)
          }
        }
      }
    })

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : null

    const responseTime = avgResponseTime !== null
      ? avgResponseTime < 1 
        ? `${Math.round(avgResponseTime * 1000)}ms`
        : `${avgResponseTime.toFixed(1)}s`
      : null

    // Check if user has AI Pro upgrade
    const hasAiPro = userLicense.products?.includes('ai-pro') || false

    // Get API usage for this license
    const apiCalls = await prisma.events.count({
      where: {
        license_key: auth.license_key,
        event_type: 'api_call',
        created_at: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    })

    // Calculate data processed (in MB)
    const dataProcessed = Math.round(totalConversations * 2.5) // Estimate 2.5MB per conversation

    return NextResponse.json({
      // License-specific stats
      totalConversations,
      activeConversations: recentConversations,
      avgResponseTime: responseTime || '0s',
      uniqueUsers,
      growthRate: monthlyGrowth,
      apiCalls,
      dataProcessed,
      
      // License details
      products: userLicense.products || [],
      plan: userLicense.plan || 'basic',
      hasAiPro,
      licenseStatus: userLicense.status
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}