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

    // Get data for the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    // Get the user's site_key from their license_key
    let whereClause: any = {
      timestamp: { gte: thirtyDaysAgo }
    }
    
    if (auth.license_key) {
      const userLicense = await prisma.licenses.findUnique({
        where: { license_key: auth.license_key },
        select: { site_key: true }
      })
      
      if (userLicense?.site_key) {
        whereClause.site_key = userLicense?.site_key
      } else {
        // No site_key found, return empty data
        return NextResponse.json({
          totalConversations: 0,
          activeUsers: 0,
          responseRate: 0,
          averageResponseTime: 'N/A'
        })
      }
    }

    // Get total conversations (unique sessions)
    const conversations = await prisma.chatbot_logs.groupBy({
      by: ['session_id'],
      where: {
        ...whereClause,
        session_id: { not: null }
      },
      _count: true
    })

    // Get unique users
    const uniqueUsers = await prisma.chatbot_logs.groupBy({
      by: ['user_id'],
      where: {
        ...whereClause,
        user_id: { not: null }
      },
      _count: true
    })

    // Calculate response rate (messages with responses / total messages)
    const [totalMessages, messagesWithResponses] = await Promise.all([
      prisma.chatbot_logs.count({
        where: {
          ...whereClause,
          role: 'user'
        }
      }),
      prisma.chatbot_logs.count({
        where: {
          ...whereClause,
          role: 'assistant',
          chatbot_response: { not: null }
        }
      })
    ])

    const responseRate = totalMessages > 0 
      ? Math.round((messagesWithResponses / totalMessages) * 100)
      : 0

    // Calculate average response time (simplified - you may want to enhance this)
    const averageResponseTime = '1.2s' // You can calculate this from actual timestamp differences

    return NextResponse.json({
      totalConversations: conversations.length,
      activeUsers: uniqueUsers.length,
      responseRate,
      averageResponseTime
    })
  } catch (error) {
    console.error('Customer summary API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer summary' },
      { status: 500 }
    )
  }
}