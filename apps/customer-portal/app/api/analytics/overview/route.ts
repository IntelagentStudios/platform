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

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Get user's license details
    const license = await prisma.licenses.findUnique({
      where: { license_key: auth.license_key },
      select: {
        status: true,
        plan: true,
        domain: true,
        created_at: true,
        used_at: true,
        site_key: true
      }
    })

    if (!license) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 })
    }

    // Build where clause for user's conversations
    const userWhereClause = license.site_key ? { site_key: license.site_key } : { license_key: auth.license_key }

    // Get user's conversations
    const userConversations = await prisma.chatbot_logs.groupBy({
      by: ['session_id'],
      where: userWhereClause,
      _count: true
    })

    // Get recent conversations
    const recentUserConversations = await prisma.chatbot_logs.groupBy({
      by: ['session_id'],
      where: {
        ...userWhereClause,
        timestamp: { gte: sevenDaysAgo }
      },
      _count: true
    })

    // Get conversations from previous 7 days for comparison
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    const previousUserConversations = await prisma.chatbot_logs.groupBy({
      by: ['session_id'],
      where: {
        ...userWhereClause,
        timestamp: {
          gte: fourteenDaysAgo,
          lt: sevenDaysAgo
        }
      },
      _count: true
    })

    // Get message count
    const totalMessages = await prisma.chatbot_logs.count({
      where: userWhereClause
    })

    // Get unique users (if tracked)
    const uniqueUsers = await prisma.chatbot_logs.groupBy({
      by: ['user_id'],
      where: {
        ...userWhereClause,
        user_id: { not: null }
      }
    })

    // Calculate average messages per conversation
    const avgMessagesPerConversation = userConversations.length > 0
      ? Math.round(totalMessages / userConversations.length)
      : 0

    // Calculate conversation growth
    const conversationGrowth = previousUserConversations.length > 0
      ? Math.round(((recentUserConversations.length - previousUserConversations.length) / previousUserConversations.length) * 100)
      : 100

    return NextResponse.json({
      licenseStatus: license.status,
      plan: license.plan,
      domain: license.domain,
      totalConversations: userConversations.length,
      recentConversations: recentUserConversations.length,
      conversationGrowth,
      totalMessages,
      uniqueUsers: uniqueUsers.length,
      avgMessagesPerConversation,
      accountAge: license.created_at 
        ? Math.floor((now.getTime() - new Date(license.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0,
      // For compatibility with dashboard
      totalLicenses: 1,
      licenseGrowth: 0,
      totalRevenue: 0,
      revenueGrowth: 0,
      activeDomains: license.domain ? 1 : 0,
      recentActivity: {
        licenses: 0,
        conversations: recentUserConversations.length,
        domains: license.domain ? 1 : 0
      }
    })

  } catch (error) {
    console.error('Analytics overview error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics overview' },
      { status: 500 }
    )
  }
}