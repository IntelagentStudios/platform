import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Temporary endpoint to check recent chatbot logs with new structure
export async function GET() {
  try {
    // Get the 10 most recent chatbot logs
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
        created_at: true
      }
    })

    // Get license info for each unique site_key
    const uniqueSiteKeys = [...new Set(recentLogs.map(s => s.site_key).filter(Boolean))] as string[]
    const licenses = uniqueSiteKeys.length > 0 ? await prisma.licenses.findMany({
      where: { site_key: { in: uniqueSiteKeys } },
      select: {
        site_key: true,
        license_key: true,
        domain: true,
        customer_name: true,
        products: true
      }
    }) : []
    const licenseMap = new Map(licenses.map(l => [l.site_key, l]))

    // Add license info to logs
    const logsWithLicense = recentLogs.map(log => ({
      ...log,
      license: log.site_key ? licenseMap.get(log.site_key) : null
    }))

    // Check for NULL values in critical fields
    const nullChecks = {
      totalLogs: logsWithLicense.length,
      logsWithNullDomain: logsWithLicense.filter(log => !log.domain && !log.license?.domain).length,
      logsWithNullSiteKey: logsWithLicense.filter(log => !log.site_key).length,
      logsWithNullSession: logsWithLicense.filter(log => !log.session_id).length,
      logsWithContent: logsWithLicense.filter(log => log.customer_message || log.chatbot_response || log.content).length,
      logsWithLicense: logsWithLicense.filter(log => log.license).length
    }

    // Get unique domains, site_keys and products
    const uniqueDomains = Array.from(new Set(
      logsWithLicense.map(log => log.domain || log.license?.domain).filter(Boolean)
    ))
    const uniqueSiteKeysFromLogs = Array.from(new Set(
      logsWithLicense.map(log => log.site_key).filter(Boolean)
    ))
    const allProducts = new Set<string>()
    logsWithLicense.forEach(log => {
      if (log.license?.products) {
        log.license.products.forEach(p => allProducts.add(p))
      }
    })

    // Format logs for easier reading
    const formattedLogs = logsWithLicense.map(log => ({
      id: log.id,
      session_id: log.session_id || 'NULL',
      domain: log.domain || log.license?.domain || 'NULL',
      site_key: log.site_key || 'NULL',
      license_key: log.license?.license_key || 'Not linked',
      customer_name: log.license?.customer_name || 'Unknown',
      products: log.license?.products || [],
      message: log.customer_message || log.chatbot_response || log.content || 'No content',
      role: log.role || (log.customer_message ? 'user' : log.chatbot_response ? 'assistant' : 'unknown'),
      timestamp: log.timestamp?.toISOString() || log.created_at?.toISOString() || 'No timestamp',
      userId: log.user_id || 'anonymous'
    }))

    // Test JOIN functionality
    const testJoin = await prisma.chatbot_logs.findFirst({
      where: {
        site_key: { not: null }
      }
    })
    
    const testLicense = testJoin?.site_key ? await prisma.licenses.findUnique({
      where: { site_key: testJoin.site_key }
    }) : null

    return NextResponse.json({
      summary: {
        ...nullChecks,
        uniqueDomains,
        uniqueSiteKeys: uniqueSiteKeysFromLogs,
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
        hasLicense: !!testLicense,
        licenseDomain: testLicense?.domain,
        licenseProducts: testLicense?.products
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