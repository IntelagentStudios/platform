import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromCookies } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthFromCookies()
    if (!auth || !auth.isMaster) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Temporarily return mock data - financial models not yet in schema
    return NextResponse.json({
      mrr: 0,
      arr: 0,
      ltv: 0,
      churnRate: 0,
      growthRate: 0,
      activeCustomers: 0,
      newCustomers: 0,
      revenue: {
        total: 0,
        recurring: 0,
        oneTime: 0
      },
      customers: {
        total: 0,
        active: 0,
        churned: 0
      },
      message: 'Financial metrics functionality is coming soon'
    })
  } catch (error) {
    console.error('Financial metrics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch financial metrics' },
      { status: 500 }
    )
  }
}