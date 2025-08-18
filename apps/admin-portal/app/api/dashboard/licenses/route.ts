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

    let licenses
    
    if (auth.isMaster) {
      licenses = await prisma.licenses.findMany({
        orderBy: {
          created_at: 'desc',
        },
        take: 50,
      })
    } else {
      licenses = await prisma.licenses.findMany({
        where: {
          license_key: auth.licenseKey,
        },
      })
    }

    return NextResponse.json(licenses)
  } catch (error) {
    console.error('Licenses fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch licenses' },
      { status: 500 }
    )
  }
}