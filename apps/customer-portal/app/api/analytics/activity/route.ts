import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromCookies } from '@/lib/auth'
import { prisma } from '@/lib/db'


export const dynamic = 'force-dynamic';
// Route to fetch recent activity data
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromCookies()
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Customer portal - only show data for their license
    const whereClause = { license_key: auth.license_key }

    // Get recent activities from multiple sources
    const activities: any[] = []
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // 1. Get license status and recent updates for this customer
    const license = await prisma.licenses.findUnique({
      where: { license_key: auth.license_key },
      select: {
        license_key: true,
        customer_name: true,
        domain: true,
        status: true,
        created_at: true,
        used_at: true,
        plan: true,
        products: true
      }
    })

    if (license) {
      // Show license activation (using used_at as activation time)
      if (license.used_at && license.used_at >= thirtyDaysAgo) {
        activities.push({
          type: 'license_activated',
          timestamp: license.used_at,
          title: 'License Activated',
          description: `Your license was successfully activated`,
          metadata: {
            domain: license.domain,
            products: license.products
          },
          icon: 'check',
          color: 'green'
        })
      }

      // Show license creation
      if (license.created_at && license.created_at >= thirtyDaysAgo) {
        activities.push({
          type: 'license_created',
          timestamp: license.created_at,
          title: 'License Created',
          description: `Your license was created`,
          metadata: {
            domain: license.domain
          },
          icon: 'user',
          color: 'blue'
        })
      }

      // Warning if license is expiring soon
      if (license.status === 'active') {
        // Check expiration in licenses table if needed
        activities.push({
          type: 'license_status',
          timestamp: now,
          title: 'License Active',
          description: `Your ${license.plan || 'Standard'} license is active`,
          metadata: {
            plan: license.plan,
            products: license.products
          },
          icon: 'shield',
          color: 'green'
        })
      }
    }

    // 2. Get recent conversation sessions
    const recentSessions = await prisma.chatbot_logs.groupBy({
      by: ['session_id', 'domain', 'product_key'],
      where: {
        ...whereClause,
        timestamp: { gte: thirtyDaysAgo },
        session_id: { not: null }
      },
      _min: { timestamp: true },
      _max: { timestamp: true },
      _count: { id: true },
      orderBy: {
        _max: { timestamp: 'desc' }
      },
      take: 30
    })

    for (const session of recentSessions) {
      // Get customer name for the session if we have a site key
      let license = null
      if (session.product_key) {
        // Get license from product_key
        const productKeyRecord = await prisma.product_keys.findUnique({
          where: { product_key: session.product_key },
          select: { license_key: true }
        })
        if (productKeyRecord) {
          license = await prisma.licenses.findUnique({
            where: { license_key: productKeyRecord.license_key },
            select: { customer_name: true, domain: true }
          })
        }
      }

      activities.push({
        type: 'new_conversation',
        timestamp: session._min.timestamp,
        title: 'New Conversation Started',
        description: `${session.domain || license?.domain || 'Unknown Domain'} - ${session._count.id} messages`,
        metadata: {
          session_id: session.session_id,
          domain: session.domain || license?.domain,
          messageCount: session._count.id,
          duration: session._max.timestamp && session._min.timestamp
            ? Math.round((session._max.timestamp.getTime() - session._min.timestamp.getTime()) / 1000)
            : 0
        },
        icon: 'message',
        color: 'purple'
      })
    }

    // 3. Get high-volume activity alerts
    const highVolumeCheck = await prisma.chatbot_logs.groupBy({
      by: ['domain'],
      where: {
        ...whereClause,
        timestamp: {
          gte: new Date(now.getTime() - 60 * 60 * 1000) // Last hour
        }
      },
      _count: { id: true }
    })

    highVolumeCheck.forEach((domainActivity: any) => {
      if (domainActivity._count.id > 100) { // More than 100 messages in an hour
        activities.push({
          type: 'high_volume',
          timestamp: now,
          title: 'High Activity Detected',
          description: `${domainActivity.domain || 'Unknown Domain'} - ${domainActivity._count.id} messages in the last hour`,
          metadata: {
            domain: domainActivity.domain,
            messageCount: domainActivity._count.id
          },
          icon: 'trending-up',
          color: 'orange'
        })
      }
    })

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => {
      const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime()
      const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime()
      return timeB - timeA
    })

    // Apply pagination
    const paginatedActivities = activities.slice(offset, offset + limit)

    // Format timestamps
    const formattedActivities = paginatedActivities.map(activity => ({
      ...activity,
      timestamp: activity.timestamp.toISOString(),
      timeAgo: getTimeAgo(activity.timestamp)
    }))

    return NextResponse.json({
      activities: formattedActivities,
      total: activities.length,
      hasMore: offset + limit < activities.length
    })

  } catch (error) {
    console.error('Activity feed error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity feed' },
      { status: 500 }
    )
  }
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}