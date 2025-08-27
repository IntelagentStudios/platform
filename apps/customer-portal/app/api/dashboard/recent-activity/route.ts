import { NextResponse } from 'next/server'
import { getAuthFromCookies } from '@/lib/auth'
import { prisma } from '@/lib/db'


export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const auth = await getAuthFromCookies()
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get recent license activities
    const recentLicenses = await prisma.licenses.findMany({
      orderBy: { created_at: 'desc' },
      take: 10,
      select: {
        license_key: true,
        status: true,
        created_at: true,
        domain: true,
        customer_name: true,
        used_at: true,
      }
    })

    // Get user's license to check for chatbot product
    const userLicense = await prisma.licenses.findUnique({
      where: { license_key: auth.license_key },
      select: { products: true }
    })

    let recentSessions: Array<any> = []
    
    // Only get chatbot activities if user has chatbot product
    if (userLicense?.products && userLicense.products.includes('chatbot')) {
      const productKey = await prisma.product_keys.findFirst({
        where: {
          license_key: auth.license_key,
          product: 'chatbot',
          status: 'active'
        },
        select: { product_key: true }
      });
      
      if (productKey?.product_key) {
        const sessions = await prisma.chatbot_logs.groupBy({
          by: ['session_id'],
          where: {
            product_key: productKey.product_key
          },
          _max: {
            timestamp: true
          }
        })
        recentSessions = sessions as any[]
      }
    }

    // Format activities
    const activities = []

    // Add license activities
    recentLicenses.forEach(license => {
      if (license.created_at) {
        activities.push({
          type: 'license_created',
          description: `Licence created for ${license?.customer_name || license.domain || 'Unknown'}`,
          timestamp: license.created_at,
          status: 'info'
        })
      }

      if (license.used_at && license.created_at && license.used_at > license.created_at) {
        activities.push({
          type: 'license_activated',
          description: `Licence activated by ${license?.customer_name || license.domain || 'Unknown'}`,
          timestamp: license.used_at,
          status: 'success'
        })
      }

      if (license.status === 'expired' && license.created_at) {
        activities.push({
          type: 'license_expired',
          description: `Licence expired for ${license?.customer_name || license.domain || 'Unknown'}`,
          timestamp: license.created_at,
          status: 'warning'
        })
      }
    })

    // Add session activities
    for (const session of recentSessions) {
      if (session._max.timestamp) {
        activities.push({
          type: 'new_session',
          description: `New conversation from ${userLicense ? 'your domain' : 'Unknown'}`,
          timestamp: session._max.timestamp,
          status: 'activity'
        })
      }
    }

    // Sort by timestamp and take the most recent
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    const recentActivities = activities.slice(0, 5).map(activity => ({
      ...activity,
      timeAgo: getTimeAgo(activity.timestamp)
    }))

    return NextResponse.json({ activities: recentActivities })
  } catch (error) {
    console.error('Recent activity error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent activity' },
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
  return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
}