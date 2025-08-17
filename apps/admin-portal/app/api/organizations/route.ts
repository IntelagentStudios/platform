import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthFromCookies } from '@/lib/auth'
import { z } from 'zod'
import { createAuditLog } from '@/lib/audit'
import { generateSlug } from '@/lib/utils'

// Validation schemas
const createOrganizationSchema = z.object({
  name: z.string().min(1).max(255),
  domain: z.string().optional(),
  website: z.string().url().optional(),
  industry: z.string().optional(),
  size: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
  billingEmail: z.string().email().optional()
})

const updateOrganizationSchema = createOrganizationSchema.partial()

// GET /api/organizations - List organizations (admin only)
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthFromCookies()
    if (!auth || !auth.isMaster) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const tier = searchParams.get('tier')
    const search = searchParams.get('search')

    const where: any = {}
    
    if (status) {
      where.subscriptionStatus = status
    }
    
    if (tier) {
      where.subscriptionTier = tier
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { domain: { contains: search, mode: 'insensitive' } },
        { billingEmail: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        include: {
          _count: {
            select: {
              teams: true,
              users: true,
              licenses: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.organization.count({ where })
    ])

    return NextResponse.json({
      organizations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching organizations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    )
  }
}

// POST /api/organizations - Create new organization
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromCookies()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validation = createOrganizationSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const data = validation.data
    const slug = generateSlug(data.name)

    // Check if slug already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { slug }
    })

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Organization with similar name already exists' },
        { status: 409 }
      )
    }

    // Create organization
    const organization = await prisma.organization.create({
      data: {
        name: data.name,
        slug,
        domain: data.domain,
        website: data.website,
        industry: data.industry,
        size: data.size,
        billingEmail: data.billingEmail || null,
        subscriptionTier: 'free',
        subscriptionStatus: 'active',
        settings: {
          branding: {},
          notifications: {
            email: true,
            slack: false,
            webhook: false
          },
          security: {
            requireTwoFactor: false,
            sessionTimeout: 1440
          }
        }
      }
    })

    // Create default team
    const defaultTeam = await prisma.team.create({
      data: {
        organizationId: organization.id,
        name: 'Default Team',
        slug: 'default',
        settings: {}
      }
    })

    // Create audit log
    await createAuditLog({
      organizationId: organization.id,
      userId: auth.licenseKey,
      action: 'ORG_CREATE',
      resource: 'organization',
      resourceId: organization.id,
      newValue: organization
    })

    return NextResponse.json({
      organization,
      defaultTeam
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating organization:', error)
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    )
  }
}