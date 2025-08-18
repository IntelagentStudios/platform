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

    if (auth.isMaster) {
      return NextResponse.json({
        license_key: auth.licenseKey,
        domain: auth.domain,
        isMaster: true,
        customerName: 'Master Admin',
      })
    }

    const license = await prisma.licenses.findUnique({
      where: { license_key: auth.licenseKey },
    })

    return NextResponse.json({
      license_key: auth.licenseKey,
      domain: auth.domain,
      isMaster: false,
      customerName: license?.customer_name,
      email: license?.email,
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