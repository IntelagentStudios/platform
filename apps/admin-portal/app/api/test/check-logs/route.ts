import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Temporary endpoint to check recent chatbot logs with new structure
export async function GET() {
  try {
    // Get the 10 most recent chatbot logs with license info
    const recentLogs = await prisma.chatbot_logs.findMany({
      orderBy: { timestamp: 'desc' },
      take: 10,
      select: {
        id: true,
        session_id: true,
        domain: true,
        site_key: true,
        customer_message: true,
        chatbot_response: true,
        timestamp: true,
        user_id: true,
        conversation_id: true,
        role: true,
        content: true,
        created_at: true,
        licenses: {
          select: {
            license_key: true,
            domain: true,
            customer_name: true,
            products: true
          }
        }
      }
    })

    // Check for NULL values in critical fields
    const nullChecks = {
      totalLogs: recentLogs.length,
      logsWithNullDomain: recentLogs.filter(log => !log.domain && !log.licenses?.domain).length,
      logsWithNullSiteKey: recentLogs.filter(log => !log.site_key).length,
      logsWithNullSession: recentLogs.filter(log => !log.session_id).length,
      logsWithContent: recentLogs.filter(log => log.customer_message || log.chatbot_response || log.content).length,
      logsWithLicense: recentLogs.filter(log => log.licenses).length
    }

    // Get unique domains, site_keys and products
    const uniqueDomains = Array.from(new Set(
      recentLogs.map(log => log.domain || log.licenses?.domain).filter(Boolean)
    ))
    const uniqueSiteKeys = Array.from(new Set(
      recentLogs.map(log => log.site_key).filter(Boolean)
    ))
    const allProducts = new Set<string>()
    recentLogs.forEach(log => {
      if (log.licenses?.products) {
        log.licenses.products.forEach(p => allProducts.add(p))
      }
    })

    // Format logs for easier reading
    const formattedLogs = recentLogs.map(log => ({
      id: log.id,
      sessionId: log.session_id || 'NULL',
      domain: log.domain || log.licenses?.domain || 'NULL',
      site_key: log.site_key || 'NULL',
      license_key: log.licenses?.license_key || 'Not linked',
      customerName: log.licenses?.customer_name || 'Unknown',
      products: log.licenses?.products || [],
      message: log.customer_message || log.chatbot_response || log.content || 'No content',
      role: log.role || (log.customer_message ? 'user' : log.chatbot_response ? 'assistant' : 'unknown'),
      timestamp: log.timestamp?.toISOString() || log.created_at?.toISOString() || 'No timestamp',
      userId: log.user_id || 'anonymous'
    }))

    // Test JOIN functionality
    const testJoin = await prisma.chatbot_logs.findFirst({
      where: {
        site_key: { not: null }
      },
      include: {
        licenses: true
      }
    })

    return NextResponse.json({
      summary: {
        ...nullChecks,
        uniqueDomains,
        uniqueSiteKeys,
        uniqueProducts: Array.from(allProducts),
        mostRecentLog: formattedLogs[0] ? {
          timestamp: formattedLogs[0].timestamp,
          domain: formattedLogs[0].domain,
          site_key: formattedLogs[0].site_key,
          hasContent: formattedLogs[0].message !== 'No content',
          isLinkedToLicense: formattedLogs[0].license_key !== 'Not linked'
        } : null
      },
      joinTest: {
        success: !!testJoin,
        hasLicense: !!testJoin?.licenses,
        licenseDomain: testJoin?.licenses?.domain,
        licenseProducts: testJoin?.licenses?.products
      },
      recentLogs: formattedLogs
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Error checking logs:', error)
    return NextResponse.json({
      error: 'Failed to check logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}