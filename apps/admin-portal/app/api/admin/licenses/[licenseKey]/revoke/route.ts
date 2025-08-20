import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromCookies } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface RouteParams {
  params: {
    licenseKey: string
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication and admin permissions
    const auth = await getAuthFromCookies()
    
    if (!auth || !auth.isMaster) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const { licenseKey } = params

    if (!licenseKey || typeof licenseKey !== 'string') {
      return NextResponse.json(
        { error: 'Invalid license key provided' },
        { status: 400 }
      )
    }

    // First, check if the license exists
    const existingLicense = await prisma.licenses.findUnique({
      where: { license_key: licenseKey },
      select: {
        license_key: true,
        customer_name: true,
        email: true,
        status: true
      }
    })

    if (!existingLicense) {
      return NextResponse.json(
        { 
          error: 'License key not found',
          message: 'The provided license key does not exist in our system'
        },
        { status: 404 }
      )
    }

    // Check if license is already revoked
    if (existingLicense.status === 'revoked') {
      return NextResponse.json({
        success: true,
        message: 'License is already revoked',
        license: {
          licenseKey: existingLicense.license_key,
          customerName: existingLicense.customer_name,
          email: existingLicense.email,
          status: 'revoked'
        }
      }, { status: 200 })
    }

    // Update the license status to revoked
    const updatedLicense = await prisma.licenses.update({
      where: { license_key: licenseKey },
      data: {
        status: 'revoked'
      },
      select: {
        license_key: true,
        customer_name: true,
        email: true,
        status: true,
        created_at: true,
        plan: true,
        products: true
      }
    })

    console.log(`License revoked: ${licenseKey} for ${updatedLicense.customer_name} (${updatedLicense.email})`)

    return NextResponse.json({
      success: true,
      message: 'License key has been successfully revoked',
      license: {
        licenseKey: updatedLicense.license_key,
        customerName: updatedLicense.customer_name,
        email: updatedLicense.email,
        plan: updatedLicense.plan,
        products: updatedLicense.products,
        status: updatedLicense.status,
        createdAt: updatedLicense.created_at
      }
    }, { status: 200 })

  } catch (error: any) {
    console.error('License revocation error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to revoke license key',
        details: error.message 
      },
      { status: 500 }
    )
  }
}