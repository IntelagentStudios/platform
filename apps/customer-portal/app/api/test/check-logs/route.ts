import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'


export const dynamic = 'force-dynamic';
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
        product_key: true,
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

    // Get license info for each unique product_key
    const uniqueProductKeys = [...new Set(recentLogs.map(s => s.product_key).filter(Boolean))] as string[]
    // Get product_keys info to map to licenses
    const productKeys = uniqueProductKeys.length > 0 ? await prisma.product_keys.findMany({
      where: { product_key: { in: uniqueProductKeys } }
    }) : []
    
    // Get licenses for these product keys
    const licenseKeys = [...new Set(productKeys.map(pk => pk.license_key).filter(Boolean))] as string[]
    const licenses = licenseKeys.length > 0 ? await prisma.licenses.findMany({
      where: { license_key: { in: licenseKeys } },
      select: {
        license_key: true,
        domain: true,
        customer_name: true,
        products: true
      }
    }) : []
    
    // Create a map of product_key to license
    const licenseKeyMap = new Map(licenses.map(l => [l.license_key, l]))
    const licenseMap = new Map(productKeys.map(pk => [
      pk.product_key, 
      pk.license_key ? licenseKeyMap.get(pk.license_key) : null
    ]))

    // Add license info to logs
    const logsWithLicense = recentLogs.map(log => ({
      ...log,
      license: log.product_key ? licenseMap.get(log.product_key) : null
    }))

    // Check for NULL values in critical fields
    const nullChecks = {
      totalLogs: logsWithLicense.length,
      logsWithNullDomain: logsWithLicense.filter(log => !log.domain && !log.license?.domain).length,
      logsWithNullProductKey: logsWithLicense.filter(log => !log.product_key).length,
      logsWithNullSession: logsWithLicense.filter(log => !log.session_id).length,
      logsWithContent: logsWithLicense.filter(log => log.customer_message || log.chatbot_response || log.content).length,
      logsWithLicense: logsWithLicense.filter(log => log.license).length
    }

    // Get unique domains, product_keys and products
    const uniqueDomains = Array.from(new Set(
      logsWithLicense.map(log => log.domain || log.license?.domain).filter(Boolean)
    ))
    const uniqueProductKeysFromLogs = Array.from(new Set(
      logsWithLicense.map(log => log.product_key).filter(Boolean)
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
      product_key: log.product_key || 'NULL',
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
        product_key: { not: null }
      }
    })
    
    let testLicense = null
    if (testJoin?.product_key) {
      const productKeyRecord = await prisma.product_keys.findUnique({
        where: { product_key: testJoin.product_key },
        include: { licenses: true }
      })
      testLicense = productKeyRecord?.licenses
    }

    return NextResponse.json({
      summary: {
        ...nullChecks,
        uniqueDomains,
        uniqueProductKeys: uniqueProductKeysFromLogs,
        uniqueProducts: Array.from(allProducts),
        mostRecentLog: formattedLogs[0] ? {
          timestamp: formattedLogs[0].timestamp,
          domain: formattedLogs[0].domain,
          product_key: formattedLogs[0].product_key,
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