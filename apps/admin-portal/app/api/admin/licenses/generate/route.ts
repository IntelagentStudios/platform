import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromCookies } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for license generation
const GenerateLicenseSchema = z.object({
  email: z.string().email('Invalid email address'),
  customerName: z.string().min(1, 'Customer name is required'),
  plan: z.string().min(1, 'Plan is required'),
  products: z.array(z.string()).min(1, 'At least one product is required')
})

// Generate a unique 20-character license key in format XXXX-XXXX-XXXX-XXXX
function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  
  for (let i = 0; i < 20; i++) {
    if (i > 0 && i % 4 === 0) {
      result += '-'
    }
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}

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
    const validationResult = GenerateLicenseSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { email, customerName, plan, products } = validationResult.data

    // Generate unique license key
    let licenseKey: string
    let attempts = 0
    const maxAttempts = 10

    do {
      licenseKey = generateLicenseKey()
      attempts++
      
      // Check if license key already exists
      const existingLicense = await prisma.licenses.findUnique({
        where: { license_key: licenseKey }
      })
      
      if (!existingLicense) {
        break
      }
      
      if (attempts >= maxAttempts) {
        return NextResponse.json(
          { error: 'Failed to generate unique license key. Please try again.' },
          { status: 500 }
        )
      }
    } while (attempts < maxAttempts)

    // Create the license in the database
    const newLicense = await prisma.licenses.create({
      data: {
        license_key: licenseKey,
        email,
        customer_name: customerName,
        plan,
        products,
        status: 'active',
        created_at: new Date()
      }
    })

    console.log(`License generated: ${licenseKey} for ${customerName} (${email})`)

    return NextResponse.json({
      success: true,
      licenseKey: newLicense.license_key,
      message: 'License key generated successfully'
    }, { status: 201 })

  } catch (error: any) {
    console.error('License generation error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate license key',
        details: error.message 
      },
      { status: 500 }
    )
  }
}