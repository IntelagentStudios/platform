import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromCookies } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromCookies()
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { type, dateRange } = await request.json()

    let whereClause: any = {}
    if (!auth.license_key) {
      // Find the user's site_key from their license_key
      const userLicense = await prisma.licenses.findUnique({
        where: { license_key: auth.license_key },
        select: { site_key: true }
      })
      if (userLicense?.site_key) {
        whereClause.site_key = userLicense?.site_key
      }
    }

    if (dateRange?.from && dateRange?.to) {
      whereClause.timestamp = {
        gte: new Date(dateRange.from),
        lte: new Date(dateRange.to),
      }
    }

    const [licenses, conversations, stats] = await Promise.all([
      10})
        : prisma.licenses.findMany({ where: { license_key: auth.license_key } }),
      prisma.chatbot_logs.groupBy({
        by: ['session_id', 'domain'],
        where: whereClause,
        _count: true,
        take: 10,
        orderBy: {
          _count: {
            session_id: 'desc',
          },
        },
      }),
      Promise.resolve({
        totalLicenses: 1,
        totalConversations: await prisma.chatbot_logs.groupBy({
          by: ['session_id'],
          where: whereClause,
          _count: true,
        }).then(r => r.length),
      }),
    ])

    // For now, return JSON data that can be converted to PDF on the client side
    // Full PDF generation would require a different approach (puppeteer or similar)
    const reportData = {
      title: 'Intelagent Studios Dashboard Report',
      generatedDate: new Date().toLocaleDateString(),
      generatedFor: auth.domain,
      stats,
      licenses: licenses.slice(0, 5).map(l => ({
        license_key: l.license_key,
        customer_name: l.customer_name || 'N/A',
        products: l.products || ['chatbot'],
      })),
      topConversations: conversations.slice(0, 5).map(c => ({
        domain: c.domain || 'Unknown',
        count: c._count,
      })),
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}