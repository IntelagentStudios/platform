import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromCookies } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromCookies()
    
    if (!auth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const view = searchParams.get('view') || 'all'

    // Get the user's license and siteKey
    const userLicense = await prisma.license.findUnique({
      where: { license_key: auth.licenseKey },
      select: {
        license_key: true,
        site_key: true,
        domain: true,
        customer_name: true,
        products: true
      }
    })

    // Build the where clause as the main endpoint does
    let whereClause: any = {
      session_id: { not: null }
    }
    
    // For non-master users
    if (!auth.isMaster) {
      if (!userLicense?.site_key) {
        return NextResponse.json({
          debug: {
            auth: {
              licenseKey: auth.licenseKey,
              isMaster: auth.isMaster
            },
            userLicense: 'No siteKey found',
            message: 'User has no siteKey, should see no data',
            whereClause,
            resultCount: 0
          },
          sessions: []
        })
      }
      whereClause.site_key = userLicense.site_key
    }

    // Run the actual query
    const logs = await prisma.chatbotLog.findMany({
      where: whereClause,
      select: {
        session_id: true,
        domain: true,
        site_key: true,
        timestamp: true,
        role: true,
        content: true,
        customer_message: true,
        chatbot_response: true
      },
      orderBy: { timestamp: 'desc' },
      take: 50
    })

    // Group by session to see what's being returned
    const sessionMap = new Map()
    logs.forEach(log => {
      if (!sessionMap.has(log.session_id)) {
        sessionMap.set(log.session_id, {
          sessionId: log.session_id,
          domain: log.domain || 'Unknown',
          siteKey: log.site_key || 'NULL',
          messageCount: 0,
          firstMessage: log.timestamp
        })
      }
      sessionMap.get(log.session_id).messageCount++
    })

    // Get count of records that match vs don't match the user's siteKey
    let matchingSiteKey = 0
    let differentSiteKey = 0
    let nullSiteKey = 0
    
    logs.forEach(log => {
      if (!log.site_key) {
        nullSiteKey++
      } else if (log.site_key === userLicense?.site_key) {
        matchingSiteKey++
      } else {
        differentSiteKey++
      }
    })

    // Also check what happens without any filtering
    const unfilteredCount = await prisma.chatbotLog.count({
      where: { sessionId: { not: null } }
    })

    // Check distinct siteKeys in results
    const distinctSiteKeys = new Set(logs.map(l => l.site_key).filter(Boolean))

    return NextResponse.json({
      debug: {
        auth: {
          licenseKey: auth.licenseKey,
          isMaster: auth.isMaster,
          domain: auth.domain
        },
        userLicense: {
          hasLicense: !!userLicense,
          siteKey: userLicense?.site_key || 'NULL',
          domain: userLicense?.domain,
          products: userLicense?.products
        },
        whereClause,
        query: {
          totalRecordsFound: logs.length,
          totalSessionsFound: sessionMap.size,
          unfilteredTotalInDB: unfilteredCount,
          matchingSiteKey,
          differentSiteKey,
          nullSiteKey,
          distinctSiteKeysInResults: Array.from(distinctSiteKeys)
        }
      },
      sessions: Array.from(sessionMap.values()),
      sampleLogs: logs.slice(0, 5).map(log => ({
        sessionId: log.session_id,
        siteKey: log.site_key || 'NULL',
        domain: log.domain || 'NULL',
        hasContent: !!(log.content || log.customer_message || log.chatbot_response),
        role: log.role
      }))
    })
  } catch (error) {
    console.error('Debug conversations error:', error)
    return NextResponse.json({
      error: 'Failed to debug conversations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}