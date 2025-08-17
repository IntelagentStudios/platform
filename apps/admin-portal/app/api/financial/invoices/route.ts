import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthFromCookies } from '@/lib/auth'
import { z } from 'zod'
import { generateInvoiceNumber, calculateTax } from '@/lib/billing'

const createInvoiceSchema = z.object({
  organizationId: z.string(),
  lineItems: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number()
  })),
  dueDate: z.string().transform(str => new Date(str)),
  currency: z.enum(['USD', 'EUR', 'GBP']).default('USD'),
  description: z.string().optional()
})

// GET /api/financial/invoices
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthFromCookies()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const organizationId = searchParams.get('organizationId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {}
    
    if (organizationId) {
      where.organizationId = organizationId
    }
    
    if (status) {
      where.status = status
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              billingEmail: true
            }
          },
          transactions: {
            where: { type: 'payment', status: 'success' },
            select: {
              id: true,
              amount: true,
              processedAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.invoice.count({ where })
    ])

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

// POST /api/financial/invoices
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromCookies()
    if (!auth || !auth.isMaster) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validation = createInvoiceSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const data = validation.data

    // Calculate totals
    let subtotal = 0
    const processedLineItems = data.lineItems.map(item => {
      const amount = item.quantity * item.unitPrice
      subtotal += amount
      return {
        ...item,
        amount,
        tax: 0 // Tax calculated below
      }
    })

    // Get organization for tax calculation
    const organization = await prisma.organization.findUnique({
      where: { id: data.organizationId }
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    const tax = calculateTax(subtotal, organization)
    const total = subtotal + tax

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        organizationId: data.organizationId,
        invoiceNumber: await generateInvoiceNumber(),
        amount: subtotal,
        tax,
        total,
        currency: data.currency,
        status: 'pending',
        dueDate: data.dueDate,
        description: data.description,
        lineItems: processedLineItems
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            billingEmail: true
          }
        }
      }
    })

    // Send invoice email
    await sendInvoiceEmail(invoice)

    return NextResponse.json({ invoice }, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}

async function sendInvoiceEmail(invoice: any) {
  // This would integrate with email service
  console.log('Sending invoice email to:', invoice.organization.billingEmail)
}