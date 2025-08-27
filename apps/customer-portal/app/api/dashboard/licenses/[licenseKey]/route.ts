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

    // Customer can only view their own license
    if (auth.license_key !== params.licenseKey) {
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
        subscription_id: true
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

    // Count chatbot_logs through product_keys
    let conversationCount = 0
    if (license.products?.includes('chatbot')) {
      // Find the product_key for this license's chatbot
      const productKey = await prisma.product_keys.findFirst({
        where: {
          license_key: license.license_key,
          product: 'chatbot',
          status: 'active'
        },
        select: { product_key: true }
      })

      if (productKey) {
        // Count chatbot_logs for this product_key
        conversationCount = await prisma.chatbot_logs.count({
          where: { product_key: productKey.product_key }
        })
      }
    }

    return NextResponse.json({
      license_key: license.license_key,
      email: license.email,
      customer_name: license.customer_name,
      domain: actualDomain,
      status: license.status,
      created_at: license.created_at,
      used_at: license.used_at,
      lastIndexed: license.last_indexed,
      plan: license.plan,
      products: license.products,
      subscription_status: license.subscription_status,
      lastPaymentDate: license.last_payment_date,
      nextBillingDate: license.next_billing_date,
      conversationCount
    })
  } catch (error) {
    console.error('Licence API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch licence data' },
      { status: 500 }
    )
  }
}