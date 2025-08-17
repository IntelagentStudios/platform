import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromCookies } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthFromCookies()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Temporarily return mock usage data - usage models not yet in schema
    return NextResponse.json({
      usage: {
        apiCalls: 0,
        storageBytes: 0,
        bandwidthBytes: 0,
        activeUsers: 0
      },
      limits: {
        apiCalls: 10000,
        storageBytes: 1073741824, // 1GB
        bandwidthBytes: 10737418240, // 10GB
        activeUsers: 100
      },
      period: {
        start: new Date().toISOString(),
        end: new Date().toISOString()
      },
      message: 'Usage tracking functionality is coming soon'
    })
  } catch (error) {
    console.error('Usage fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    )
  }
}