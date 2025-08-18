import { NextResponse } from 'next/server'
import { getAuthFromCookies } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const auth = await getAuthFromCookies()
    
    if (!auth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get the user's license details
    const userLicense = await prisma.license.findUnique({
      where: { license_key: auth.licenseKey },
      select: {
        license_key: true,
        site_key: true,
        domain: true,
        customer_name: true,
        products: true,
        status: true,
        created_at: true
      }
    })

    // Check what data would be returned without filtering
    const unfiltered = await prisma.chatbotLog.groupBy({
      by: ['session_id', 'site_key', 'domain'],
      where: {
        session_id: { not: null }
      },
      _count: true,
      take: 10,
      orderBy: {
        _count: {
          session_id: 'desc'
        }
      }
    })

    // Check what data would be returned WITH siteKey filtering
    const filteredBySiteKey = userLicense?.site_key ? 
      await prisma.chatbotLog.groupBy({
        by: ['session_id', 'site_key', 'domain'],
        where: {
          site_key: userLicense.site_key,
          session_id: { not: null }
        },
        _count: true,
        take: 10,
        orderBy: {
          _count: {
            session_id: 'desc'
          }
        }
      }) : []

    // Check for NULL siteKey records
    const nullSiteKeyRecords = await prisma.chatbotLog.count({
      where: {
        site_key: null,
        session_id: { not: null }
      }
    })

    // Get distinct siteKeys in the database
    const distinctSiteKeys = await prisma.chatbotLog.groupBy({
      by: ['site_key'],
      _count: true,
      orderBy: {
        _count: {
          site_key: 'desc'
        }
      }
    })

    return NextResponse.json({
      auth: {
        licenseKey: auth.licenseKey,
        domain: auth.domain,
        isMaster: auth.isMaster
      },
      userLicense: userLicense || 'No license found',
      analysis: {
        userHasSiteKey: !!userLicense?.site_key,
        userSiteKey: userLicense?.site_key || 'NULL',
        totalUnfilteredSessions: unfiltered.length,
        totalFilteredSessions: filteredBySiteKey.length,
        nullSiteKeyRecords,
        distinctSiteKeysCount: distinctSiteKeys.length
      },
      unfilteredSample: unfiltered.slice(0, 3).map(item => ({
        sessionId: item.session_id,
        siteKey: item.site_key || 'NULL',
        domain: item.domain || 'NULL',
        count: item._count
      })),
      filteredSample: filteredBySiteKey.slice(0, 3).map(item => ({
        sessionId: item.session_id,
        siteKey: item.site_key || 'NULL',
        domain: item.domain || 'NULL',
        count: item._count
      })),
      distinctSiteKeys: distinctSiteKeys.map(item => ({
        siteKey: item.site_key || 'NULL',
        recordCount: item._count
      }))
    })
  } catch (error) {
    console.error('Debug user error:', error)
    return NextResponse.json({
      error: 'Failed to debug user data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}