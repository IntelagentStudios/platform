import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromCookies } from '@/lib/auth'

// GET /api/organizations/[organizationId]/teams
export async function GET(
  req: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const auth = await getAuthFromCookies()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Temporarily return empty data - team model not yet in schema
    return NextResponse.json({
      teams: [],
      total: 0,
      message: 'Team management functionality is coming soon'
    })
  } catch (error) {
    console.error('Teams fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    )
  }
}

// POST /api/organizations/[organizationId]/teams
export async function POST(
  req: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  return NextResponse.json(
    { error: 'Team creation is temporarily disabled' },
    { status: 503 }
  )
}