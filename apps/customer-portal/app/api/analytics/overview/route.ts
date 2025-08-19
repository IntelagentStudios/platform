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

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    if (auth.isMaster) {
      // Master admin sees everything
      
      // Get total active licenses
      const totalLicenses = await prisma.licenses.count({
        where: {
          OR: [
            { status: 'active' },
            { status: 'trial' }
          ]
        }
      })

      // Get licenses from last 30 days for growth calculation
      const recentLicenses = await prisma.licenses.count({
        where: {
          created_at: { gte: thirtyDaysAgo },
          OR: [
            { status: 'active' },
            { status: 'trial' }
          ]
        }
      })

      // Get total conversations
      const totalConversations = await prisma.chatbot_logs.groupBy({
        by: ['session_id'],
        _count: true
      })

      // Get conversations from last 7 days
      const recentConversations = await prisma.chatbot_logs.groupBy({
        by: ['session_id'],
        where: {
          timestamp: { gte: sevenDaysAgo }
        },
        _count: true
      })

      // Get conversations from previous 7 days for comparison
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
      const previousConversations = await prisma.chatbot_logs.groupBy({
        by: ['session_id'],
        where: {
          timestamp: {
            gte: fourteenDaysAgo,
            lt: sevenDaysAgo
          }
        },
        _count: true
      })

      // Calculate revenue (assuming each active license is worth something)
      const activeLicenses = await prisma.licenses.findMany({
        where: {
          OR: [
            { status: 'active' },
            { status: 'trial' }
          ]
        },
        select: {
          plan: true
        }
      })

      // Simple revenue calculation - you can adjust these values
      const planPrices: Record<string, number> = {
        'basic': 29,
        'pro': 99,
        'enterprise': 299,
        'trial': 0
      }

      const totalRevenue = activeLicenses.reduce((sum, license) => {
        const plan = license.plan?.toLowerCase() || 'basic'
        return sum + (planPrices[plan] || planPrices.basic)
      }, 0)

      // Calculate growth percentages
      const conversationGrowth = previousConversations.length > 0
        ? Math.round(((recentConversations.length - previousConversations.length) / previousConversations.length) * 100)
        : 100

      const licenseGrowth = totalLicenses > recentLicenses
        ? Math.round((recentLicenses / (totalLicenses - recentLicenses)) * 100)
        : 100

      // Get active domains count
      const activeDomains = await prisma.chatbot_logs.groupBy({
        by: ['domain'],
        where: {
          timestamp: { gte: sevenDaysAgo },
          domain: { not: null }
        }
      })

      return NextResponse.json({
        totalLicenses,
        licenseGrowth,
        totalConversations: totalConversations.length,
        conversationGrowth,
        totalRevenue,
        revenueGrowth: licenseGrowth, // Simplified - revenue growth follows license growth
        activeDomains: activeDomains.length,
        recentActivity: {
          licenses: recentLicenses,
          conversations: recentConversations.length,
          domains: activeDomains.length
        }
      })

    } else {
      // Individual user sees only their data
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
      const userWhereClause = license?.site_key ? { site_key: license?.site_key } : {}

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

      return NextResponse.json({
        licenseStatus: license.status,
        plan: license.plan,
        domain: license.domain,
        totalConversations: userConversations.length,
        recentConversations: recentUserConversations.length,
        totalMessages,
        uniqueUsers: uniqueUsers.length,
        avgMessagesPerConversation,
        accountAge: license.created_at 
          ? Math.floor((now.getTime() - new Date(license.created_at).getTime()) / (1000 * 60 * 60 * 24))
          : 0
      })
    }

  } catch (error) {
    console.error('Analytics overview error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics overview' },
      { status: 500 }
    )
  }
}