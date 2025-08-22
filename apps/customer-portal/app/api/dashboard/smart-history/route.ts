import { NextResponse } from 'next/server'
import { getAuthFromCookies } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const auth = await getAuthFromCookies()
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Fetch query history from database
    const requests = await prisma.SmartDashboardRequest.findMany({
      where: {
        license_key: auth.license_key,
        request_type: 'query'
      },
      select: {
        query: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' },
      take: 20
    })

    // Extract unique queries
    const history = Array.from(
      new Set(requests.map(r => r.query))
    ).slice(0, 10)

    return NextResponse.json({ history })
  } catch (error) {
    console.error('Smart history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    )
  }
}