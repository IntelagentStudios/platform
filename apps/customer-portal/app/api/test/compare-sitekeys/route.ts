import { NextResponse } from 'next/server'
import { getAuthFromCookies } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const auth = await getAuthFromCookies()
    
    if (!auth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get all unique siteKeys from licenses
    const licenses = await prisma.licenses.findMany({
      select: {
        license_key: true,
        site_key: true,
        domain: true,
        customer_name: true
      }
    })

    // Get all unique siteKeys from chatbot logs
    const chatbotSiteKeys = await prisma.chatbot_logs.groupBy({
      by: ['site_key'],
      _count: true,
      orderBy: {
        _count: {
          site_key: 'desc'
        }
      }
    })

    // Find the current user's license
    const currentUserLicense = licenses.find(l => l.license_key === auth.license_key)

    // Check for case sensitivity issues
    const siteKeyComparisons = []
    if (currentUserLicense?.site_key) {
      const userSiteKey = currentUserLicense.site_key
      
      // Check exact matches
      const exactMatches = chatbotSiteKeys.filter(c => c.site_key === userSiteKey)
      
      // Check case-insensitive matches
      const caseInsensitiveMatches = chatbotSiteKeys.filter(c => 
        c.site_key?.toLowerCase() === userSiteKey.toLowerCase()
      )
      
      // Check partial matches
      const partialMatches = chatbotSiteKeys.filter(c => 
        c.site_key?.includes(userSiteKey) || userSiteKey.includes(c.site_key || '')
      )

      siteKeyComparisons.push({
        userSiteKey,
        exactMatches: exactMatches.length,
        caseInsensitiveMatches: caseInsensitiveMatches.length,
        partialMatches: partialMatches.length,
        exactMatchRecords: exactMatches[0]?._count || 0
      })
    }

    // Map licenses to their chatbot log counts
    const licenseMapping = licenses.map(license => {
      const chatbotData = chatbotSiteKeys.find(c => c.site_key === license.site_key)
      return {
        license_key: (license.license_key === auth.license_key ? license.license_key : 'HIDDEN'),
        domain: license.domain,
        site_key: license.site_key,
        chatbotLogCount: chatbotData?._count || 0,
        isCurrentUser: license.license_key === auth.license_key
      }
    })

    // Find orphaned siteKeys (in chatbot logs but not in licenses)
    const licenseSiteKeys = new Set(licenses.map(l => l.site_key).filter(Boolean))
    const orphanedSiteKeys = chatbotSiteKeys.filter(c => 
      c.site_key && !licenseSiteKeys.has(c.site_key)
    )

    return NextResponse.json({
      currentUser: {
        license_key: auth.license_key,
        isMaster: false,
        license: currentUserLicense || 'Not found',
        siteKeyComparisons
      },
      summary: {
        totalLicenses: licenses.length,
        licensesWithSiteKey: licenses.filter(l => l.site_key).length,
        uniqueChatbotSiteKeys: chatbotSiteKeys.length,
        nullSiteKeyRecords: chatbotSiteKeys.find(c => !c.site_key)?._count || 0,
        orphanedSiteKeys: orphanedSiteKeys.length
      },
      licenseMapping: licenseMapping.filter(l => l.isCurrentUser),
      chatbotSiteKeys: chatbotSiteKeys.filter(c => c.site_key === currentUserLicense?.site_key).map(c => ({
        site_key: c.site_key || 'NULL',
        recordCount: c._count
      })),
      orphanedSiteKeys: []
    })
  } catch (error) {
    console.error('Compare siteKeys error:', error)
    return NextResponse.json({
      error: 'Failed to compare siteKeys',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}