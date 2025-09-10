import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromCookies } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic';

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
    const view = searchParams.get('view') || 'all' // all, by-domain, recent
    const domain = searchParams.get('domain')
    const product = searchParams.get('product')
    const limit = parseInt(searchParams.get('limit') || '50')

    // For non-master users, get their product_key and products first
    let userProductKey: string | null = null
    let userProducts: string[] = []
    {
      const userLicense = await prisma.licenses.findUnique({
        where: { license_key: auth.license_key },
        select: { products: true }
      })
      userProducts = userLicense?.products || []
      
      // Get user's chatbot product key
      const productKeyRecord = await prisma.product_keys.findFirst({
        where: { 
          license_key: auth.license_key, 
          product: 'chatbot', 
          status: 'active' 
        },
        select: { product_key: true }
      })
      userProductKey = productKeyRecord?.product_key || null
      
      // If user has no product_key, return empty results
      if (!userProductKey) {
        return NextResponse.json({ sessions: [] })
      }
    }

    // Build where clause
    let whereClause: any = {
      session_id: { not: null }
    }
    
    // Filter by product_key for non-master users
    {
      // We already checked userProductKey exists above
      whereClause.product_key = userProductKey
    }

    // Filter by domain if specified
    if (domain) {
      whereClause.domain = domain
    }

    // Handle product filtering for non-master users
    if (!product) {
      // For now, only return data if chatbot is selected or combined view
      // In future, add filtering based on product-specific tables
      if (product !== 'chatbot' && product !== 'combined') {
        // Return empty for other products as we don't have their data yet
        return NextResponse.json({ sessions: [] })
      }
      // For combined view, check if user has premium
      if (product === 'combined') {
        const userLicense = await prisma.licenses.findUnique({
          where: { license_key: auth.license_key },
          select: { plan: true }
        })
        const isPremium = userLicense?.plan === 'premium' || userLicense?.plan === 'enterprise'
        if (!isPremium) {
          return NextResponse.json({ 
            sessions: [],
            error: 'Premium required for combined view'
          })
        }
      }
    }

    if (view === 'by-domain') {
      // Get sessions grouped by domain
      const domainSessions = await prisma.chatbot_logs.findMany({
        where: whereClause,
        select: {
          session_id: true,
          domain: true,
          product_key: true,
          timestamp: true
        },
        orderBy: { timestamp: 'desc' },
        take: limit * 5 // Get more to group properly
      })

      // Get license info for each unique product_key
      const uniqueProductKeys = [...new Set(domainSessions.map(s => s.product_key).filter(Boolean))] as string[]
      const productKeys = uniqueProductKeys.length > 0 ? await prisma.product_keys.findMany({
        where: { product_key: { in: uniqueProductKeys } }
      }) : []
      
      // Get licenses for each product key
      const licenseKeys = [...new Set(productKeys.map(pk => pk.license_key).filter(Boolean))]
      const licenses = licenseKeys.length > 0 ? await prisma.licenses.findMany({
        where: { license_key: { in: licenseKeys } },
        select: { domain: true, customer_name: true, license_key: true }
      }) : []
      const licenseMap = new Map(licenses.map(l => [l.license_key, l]))
      
      // Create product key to license mapping
      const productKeyLicenseMap = new Map()
      productKeys.forEach(pk => {
        const license = licenseMap.get(pk.license_key)
        if (license) {
          productKeyLicenseMap.set(pk.product_key, {
            ...license,
            product_key: pk.product_key
          })
        }
      })

      // Group by session
      const sessionMap = new Map()
      domainSessions.forEach(log => {
        if (!sessionMap.has(log.session_id)) {
          const license: any = log.product_key ? productKeyLicenseMap.get(log.product_key) : null
          sessionMap.set(log.session_id, {
            session_id: log.session_id,
            domain: log.domain || license?.domain || 'Unknown',
            customer_name: license?.customer_name,
            license_key: license?.license_key,
            messageCount: 0,
            startTime: log.timestamp,
            lastActivity: log.timestamp
          })
        }
        const session = sessionMap.get(log.session_id)
        session.messageCount++
        if (log.timestamp && session.startTime && log.timestamp < session.startTime) {
          session.startTime = log.timestamp
        }
        if (log.timestamp && session.lastActivity && log.timestamp > session.lastActivity) {
          session.lastActivity = log.timestamp
        }
      })

      const formattedSessions = Array.from(sessionMap.values())
        .slice(0, limit)
        .sort((a, b) => (b.lastActivity?.getTime() || 0) - (a.lastActivity?.getTime() || 0))

      return NextResponse.json({ sessions: formattedSessions })
      
    } else if (view === 'recent') {
      // Get recent conversations with full details
      const recentLogs = await prisma.chatbot_logs.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: limit,
        select: {
          id: true,
          session_id: true,
          domain: true,
          user_id: true,
          customer_message: true,
          chatbot_response: true,
          role: true,
          content: true,
          timestamp: true,
          conversation_id: true,
          product_key: true
        }
      })

      // Get license info for each unique product_key
      const uniqueProductKeys = [...new Set(recentLogs.map(s => s.product_key).filter(Boolean))] as string[]
      const productKeys = uniqueProductKeys.length > 0 ? await prisma.product_keys.findMany({
        where: { product_key: { in: uniqueProductKeys } }
      }) : []
      
      // Get licenses for each product key
      const licenseKeys = [...new Set(productKeys.map(pk => pk.license_key).filter(Boolean))]
      const licenses = licenseKeys.length > 0 ? await prisma.licenses.findMany({
        where: { license_key: { in: licenseKeys } },
        select: { domain: true, customer_name: true, license_key: true }
      }) : []
      const licenseMap = new Map(licenses.map(l => [l.license_key, l]))
      
      // Create product key to license mapping
      const productKeyLicenseMap = new Map()
      productKeys.forEach(pk => {
        const license = licenseMap.get(pk.license_key)
        if (license) {
          productKeyLicenseMap.set(pk.product_key, {
            ...license,
            product_key: pk.product_key
          })
        }
      })

      // Group by session
      const sessionMap = new Map()
      
      recentLogs.forEach(log => {
        if (!sessionMap.has(log.session_id)) {
          const license: any = log.product_key ? productKeyLicenseMap.get(log.product_key) : null
          sessionMap.set(log.session_id, {
            session_id: log.session_id,
            domain: log.domain || license?.domain || 'Unknown',
            customer_name: license?.customer_name,
            license_key: undefined,
            conversationId: log.conversation_id,
            messages: [],
            startTime: log.timestamp,
            lastActivity: log.timestamp,
            userId: log.user_id
          })
        }
        
        const session = sessionMap.get(log.session_id)
        session.messages.push({
          id: log.id,
          role: log.role || (log.customer_message ? 'user' : 'assistant'),
          content: log.content || log.customer_message || log.chatbot_response,
          timestamp: log.timestamp
        })
        
        if (log.timestamp && session.lastActivity && log.timestamp > session.lastActivity) {
          session.lastActivity = log.timestamp
        }
        if (log.timestamp && session.startTime && log.timestamp < session.startTime) {
          session.startTime = log.timestamp
        }
      })

      const sessions = Array.from(sessionMap.values())
        .sort((a, b) => (b.lastActivity?.getTime() || 0) - (a.lastActivity?.getTime() || 0))
        .slice(0, 20) // Limit to 20 recent sessions

      return NextResponse.json({ sessions })
      
    } else {
      // Get all active sessions summary
      const activeDomains = await prisma.chatbot_logs.groupBy({
        by: ['domain'],
        where: {
          ...whereClause,
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        _count: {
          session_id: true,
          id: true
        }
      })

      const totalSessions = await prisma.chatbot_logs.groupBy({
        by: ['session_id'],
        where: whereClause,
        _count: true
      })

      // Get session details
      const sessionDetails = await prisma.chatbot_logs.findMany({
        where: whereClause,
        select: {
          session_id: true,
          domain: true,
          product_key: true,
          timestamp: true
        },
        orderBy: { timestamp: 'desc' },
        take: limit * 5
      })

      // Get license info for each unique product_key
      const uniqueProductKeys = [...new Set(sessionDetails.map(s => s.product_key).filter(Boolean))] as string[]
      const productKeys = uniqueProductKeys.length > 0 ? await prisma.product_keys.findMany({
        where: { product_key: { in: uniqueProductKeys } }
      }) : []
      
      // Get licenses for each product key
      const licenseKeys = [...new Set(productKeys.map(pk => pk.license_key).filter(Boolean))]
      const licenses = licenseKeys.length > 0 ? await prisma.licenses.findMany({
        where: { license_key: { in: licenseKeys } },
        select: { domain: true, customer_name: true, license_key: true }
      }) : []
      const licenseMap = new Map(licenses.map(l => [l.license_key, l]))
      
      // Create product key to license mapping
      const productKeyLicenseMap = new Map()
      productKeys.forEach(pk => {
        const license = licenseMap.get(pk.license_key)
        if (license) {
          productKeyLicenseMap.set(pk.product_key, {
            ...license,
            product_key: pk.product_key
          })
        }
      })

      // Group sessions
      const sessionMap = new Map()
      sessionDetails.forEach(log => {
        if (!sessionMap.has(log.session_id)) {
          const license: any = log.product_key ? productKeyLicenseMap.get(log.product_key) : null
          sessionMap.set(log.session_id, {
            session_id: log.session_id,
            domain: log.domain || license?.domain || 'Unknown',
            license_key: undefined,
            customer_name: license?.customer_name,
            messageCount: 0,
            startTime: log.timestamp,
            lastActivity: log.timestamp
          })
        }
        const session = sessionMap.get(log.session_id)
        session.messageCount++
        if (log.timestamp && session.startTime && log.timestamp < session.startTime) {
          session.startTime = log.timestamp
        }
        if (log.timestamp && session.lastActivity && log.timestamp > session.lastActivity) {
          session.lastActivity = log.timestamp
        }
      })

      const formattedSessions = Array.from(sessionMap.values())
        .slice(0, limit)
        .map(session => {
          const startTime = session.startTime
          const endTime = session.lastActivity
          let duration = 0
          
          if (startTime && endTime) {
            const diff = endTime.getTime() - startTime.getTime()
            if (diff > 0 && diff < 86400000) { // Less than 24 hours
              duration = Math.round(diff / 1000)
            }
          }
          
          return {
            ...session,
            duration
          }
        })

      return NextResponse.json({
        summary: {
          totalSessions: totalSessions.length,
          activeDomains: activeDomains.length,
          totalMessages: activeDomains.reduce((sum, d) => sum + d._count.id, 0)
        },
        sessions: formattedSessions,
        domains: activeDomains.map(d => ({
          domain: d.domain || 'Unknown',
          sessionCount: d._count.session_id,
          messageCount: d._count.id
        }))
      })
    }
  } catch (error) {
    console.error('Chatbot sessions API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chatbot sessions' },
      { status: 500 }
    )
  }
}