import { NextResponse } from 'next/server'
import { getAuthFromCookies } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const auth = await getAuthFromCookies()
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Fetch existing insights from database
    const insights = await prisma.smart_dashboard_insights.findMany({
      where: {
        licenseKey: auth.licenseKey,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      orderBy: { created_at: 'desc' },
      take: 20
    })

    // If no insights exist, generate some based on current data
    if (insights.length === 0) {
      const generatedInsights = await generateInitialInsights(auth.licenseKey)
      return NextResponse.json({ insights: generatedInsights })
    }

    return NextResponse.json({ insights })
  } catch (error) {
    console.error('Smart insights error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    )
  }
}

async function generateInitialInsights(license_key: string) {
  const license = await prisma.licenses.findUnique({
    where: { license_key: license_key },
    select: { site_key: true, products: true, plan: true }
  })

  if (!license?.site_key) {
    return []
  }

  const insights = []
  
  // Check conversation volume
  const conversations = await prisma.chatbot_logs.groupBy({
    by: ['session_id'],
    where: { site_key: license.site_key },
    _count: true
  })

  if (conversations.length > 0) {
    insights.push({
      id: 1,
      insight_type: 'trend',
      title: 'Active Engagement',
      content: `You have ${conversations.length} total conversation sessions recorded.`,
      severity: 'low',
      created_at: new Date().toISOString()
    })
  }

  // Check for recent activity
  const recentActivity = await prisma.chatbot_logs.count({
    where: {
      site_key: license.site_key,
      timestamp: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    }
  })

  if (recentActivity > 10) {
    insights.push({
      id: 2,
      insight_type: 'alert',
      title: 'High Recent Activity',
      content: `${recentActivity} interactions in the last 24 hours shows strong engagement.`,
      severity: 'medium',
      created_at: new Date().toISOString()
    })
  }

  // Product recommendations
  if (license.products && license.products.length === 1) {
    insights.push({
      id: 3,
      insight_type: 'recommendation',
      title: 'Expand Your Product Suite',
      content: 'Consider adding Email Assistant or Voice Assistant to provide more value to your users.',
      severity: 'low',
      created_at: new Date().toISOString()
    })
  }

  // Premium upsell
  if (license.plan !== 'premium' && license.plan !== 'enterprise') {
    insights.push({
      id: 4,
      insight_type: 'recommendation',
      title: 'Unlock Premium Features',
      content: 'Upgrade to Premium for AI insights, combined analytics, and advanced reporting.',
      severity: 'medium',
      created_at: new Date().toISOString()
    })
  }

  return insights
}