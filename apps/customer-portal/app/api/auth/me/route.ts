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

    const license = await prisma.licenses.findUnique({
      where: { license_key: auth.license_key },
    })

    return NextResponse.json({
      licenseKey: auth.license_key, // Changed to camelCase for consistency
      domain: license?.domain || '',
      isMaster: false,
      customerName: license?.customer_name,
      email: license?.email || auth.email,
      products: license?.products,
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}