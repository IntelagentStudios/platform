import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthFromCookies } from '@/lib/auth'
import { z } from 'zod'
import { createAuditLog } from '@/lib/audit'
import { hasPermission } from '@/lib/permissions'

// Validation schema
const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  domain: z.string().optional(),
  website: z.string().url().optional(),
  industry: z.string().optional(),
  size: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
  billingEmail: z.string().email().optional(),
  logo: z.string().optional(),
  settings: z.object({}).optional()
})

// GET /api/organizations/[organizationId] - Get organization details
export async function GET(
  req: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const auth = await getAuthFromCookies()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organization = await prisma.organization.findUnique({
      where: { id: params.organizationId },
      include: {
        teams: {
          include: {
            _count: {
              select: { members: true }
            }
          }
        },
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
            lastActiveAt: true
          }
        },
        licenses: {
          select: {
            licenseKey: true,
            status: true,
            tier: true,
            products: true
          }
        },
        _count: {
          select: {
            invoices: true,
            apiKeys: true,
            webhooks: true
          }
        }
      }
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to view this organization
    const hasAccess = auth.isMaster || 
      (await hasPermission(auth.licenseKey, params.organizationId, 'ORG_VIEW'))

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Calculate additional metrics
    const metrics = await prisma.usageRecord.aggregate({
      where: {
        organizationId: params.organizationId,
        periodStart: {
          gte: new Date(new Date().setDate(1)) // Start of current month
        }
      },
      _sum: {
        apiCalls: true,
        storageUsed: true,
        bandwidthUsed: true,
        estimatedCost: true
      }
    })

    return NextResponse.json({
      organization,
      metrics: {
        monthlyApiCalls: metrics._sum.apiCalls || 0,
        storageUsedGB: (Number(metrics._sum.storageUsed) || 0) / 1073741824,
        bandwidthUsedGB: (Number(metrics._sum.bandwidthUsed) || 0) / 1073741824,
        estimatedCost: metrics._sum.estimatedCost || 0
      }
    })
  } catch (error) {
    console.error('Error fetching organization:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    )
  }
}

// PATCH /api/organizations/[organizationId] - Update organization
export async function PATCH(
  req: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const auth = await getAuthFromCookies()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    const hasAccess = auth.isMaster || 
      (await hasPermission(auth.licenseKey, params.organizationId, 'ORG_EDIT'))

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const validation = updateOrganizationSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const data = validation.data

    // Get current organization for audit log
    const currentOrg = await prisma.organization.findUnique({
      where: { id: params.organizationId }
    })

    if (!currentOrg) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Update organization
    const updatedOrg = await prisma.organization.update({
      where: { id: params.organizationId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.domain !== undefined && { domain: data.domain }),
        ...(data.website !== undefined && { website: data.website }),
        ...(data.industry !== undefined && { industry: data.industry }),
        ...(data.size !== undefined && { size: data.size }),
        ...(data.billingEmail !== undefined && { billingEmail: data.billingEmail }),
        ...(data.logo !== undefined && { logo: data.logo }),
        ...(data.settings && { 
          settings: {
            ...currentOrg.settings as any,
            ...data.settings
          }
        })
      }
    })

    // Create audit log
    await createAuditLog({
      organizationId: params.organizationId,
      userId: auth.licenseKey,
      action: 'ORG_UPDATE',
      resource: 'organization',
      resourceId: params.organizationId,
      oldValue: currentOrg,
      newValue: updatedOrg
    })

    return NextResponse.json({ organization: updatedOrg })
  } catch (error) {
    console.error('Error updating organization:', error)
    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    )
  }
}

// DELETE /api/organizations/[organizationId] - Delete organization
export async function DELETE(
  req: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const auth = await getAuthFromCookies()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission - only admins can delete organizations
    const hasAccess = auth.isMaster || 
      (await hasPermission(auth.licenseKey, params.organizationId, 'ORG_DELETE'))

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Soft delete by setting deletedAt
    const deletedOrg = await prisma.organization.update({
      where: { id: params.organizationId },
      data: {
        deletedAt: new Date(),
        subscriptionStatus: 'canceled'
      }
    })

    // Create audit log
    await createAuditLog({
      organizationId: params.organizationId,
      userId: auth.licenseKey,
      action: 'ORG_DELETE',
      resource: 'organization',
      resourceId: params.organizationId,
      oldValue: deletedOrg
    })

    return NextResponse.json({ 
      message: 'Organization deleted successfully',
      organization: deletedOrg 
    })
  } catch (error) {
    console.error('Error deleting organization:', error)
    return NextResponse.json(
      { error: 'Failed to delete organization' },
      { status: 500 }
    )
  }
}