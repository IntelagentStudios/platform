import { NextResponse } from 'next/server'
import { getAuthFromCookies } from '@/lib/auth'
import { prisma } from '@/lib/db'


export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const auth = await getAuthFromCookies()
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Customer portal - only show user's own license
    const licenses = await prisma.licenses.findMany({
      where: {
        license_key: auth.license_key,
      },
    })

    return NextResponse.json(licenses)
  } catch (error) {
    console.error('Licenses fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch licenses' },
      { status: 500 }
    )
  }
}