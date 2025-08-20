import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromCookies } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for license validation
const ValidateLicenseSchema = z.object({
  licenseKey: z.string().min(1, 'License key is required')
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin permissions
    const auth = await getAuthFromCookies()
    
    if (!auth || !auth.isMaster) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = ValidateLicenseSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { licenseKey } = validationResult.data

    // Look up the license in the database
    const license = await prisma.licenses.findUnique({
      where: { license_key: licenseKey },
      select: {
        license_key: true,
        email: true,
        customer_name: true,
        plan: true,
        products: true,
        status: true,
        created_at: true,
        used_at: true,
        domain: true,
        site_key: true,
        last_payment_date: true,
        next_billing_date: true,
        subscription_status: true,
        last_indexed: true
      }
    })

    if (!license) {
      return NextResponse.json({
        valid: false,
        error: 'License key not found',
        message: 'The provided license key does not exist in our system'
      }, { status: 404 })
    }

    // Check if license is active
    const isActive = license.status === 'active'
    
    if (!isActive) {
      return NextResponse.json({
        valid: false,
        error: 'License inactive',
        message: `License status is: ${license.status}`,
        license: {
          licenseKey: license.license_key,
          status: license.status,
          customerName: license.customer_name,
          email: license.email
        }
      }, { status: 200 })
    }

    console.log(`License validated: ${licenseKey} - Status: ${license.status}`)

    return NextResponse.json({
      valid: true,
      message: 'License key is valid and active',
      license: {
        licenseKey: license.license_key,
        email: license.email,
        customerName: license.customer_name,
        plan: license.plan,
        products: license.products,
        status: license.status,
        createdAt: license.created_at,
        usedAt: license.used_at,
        domain: license.domain,
        siteKey: license.site_key,
        lastPaymentDate: license.last_payment_date,
        nextBillingDate: license.next_billing_date,
        subscriptionStatus: license.subscription_status,
        lastIndexed: license.last_indexed
      }
    }, { status: 200 })

  } catch (error: any) {
    console.error('License validation error:', error)
    
    return NextResponse.json(
      { 
        valid: false,
        error: 'Failed to validate license key',
        details: error.message 
      },
      { status: 500 }
    )
  }
}