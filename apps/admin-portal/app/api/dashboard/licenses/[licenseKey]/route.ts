import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromCookies } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { licenseKey: string } }
) {
  try {
    const auth = await getAuthFromCookies()
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Only master admin can view other licenses
    if (!auth.isMaster && auth.licenseKey !== params.licenseKey) {
      return NextResponse.json(
        { error: 'Unauthorised' },
        { status: 403 }
      )
    }

    const license = await prisma.licenses.findUnique({
      where: { license_key: params.licenseKey },
      select: {
        license_key: true,
        email: true,
        customer_name: true,
        domain: true,
        status: true,
        created_at: true,
        used_at: true,
        last_indexed: true,
        plan: true,
        products: true,
        subscription_status: true,
        last_payment_date: true,
        next_billing_date: true,
        subscription_id: true,
        _count: {
          select: {
            chatbot_logs: true
          }
        }
      }
    })

    if (!license) {
      return NextResponse.json(
        { error: 'Licence not found' },
        { status: 404 }
      )
    }

    // Use the domain directly from the license
    let actualDomain = license.domain

    return NextResponse.json({
      license_key: license.license_key,
      email: license.email,
      customerName: license.customer_name,
      domain: actualDomain,
      status: license.status,
      created_at: license.created_at,
      usedAt: license.used_at,
      lastIndexed: license.last_indexed,
      plan: license.plan,
      products: license.products,
      subscriptionStatus: license.subscription_status,
      lastPaymentDate: license.last_payment_date,
      nextBillingDate: license.next_billing_date,
      conversationCount: license._count.chatbot_logs
    })
  } catch (error) {
    console.error('Licence API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch licence data' },
      { status: 500 }
    )
  }
}