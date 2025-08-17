import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthFromCookies } from '@/lib/auth'
import { z } from 'zod'
import { createAuditLog } from '@/lib/audit'
import { hasPermission } from '@/lib/permissions'
import { generateSlug } from '@/lib/utils'

// Validation schemas
const createTeamSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional()
})

// GET /api/organizations/[organizationId]/teams - List teams
export async function GET(
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
      (await hasPermission(auth.licenseKey, params.organizationId, 'TEAM_VIEW'))

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const teams = await prisma.team.findMany({
      where: { organizationId: params.organizationId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                status: true
              }
            }
          }
        },
        projects: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        _count: {
          select: {
            members: true,
            projects: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ teams })
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    )
  }
}

// POST /api/organizations/[organizationId]/teams - Create team
export async function POST(
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
      (await hasPermission(auth.licenseKey, params.organizationId, 'TEAM_CREATE'))

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const validation = createTeamSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const data = validation.data
    const slug = generateSlug(data.name)

    // Check if team with same slug exists
    const existingTeam = await prisma.team.findFirst({
      where: {
        organizationId: params.organizationId,
        slug
      }
    })

    if (existingTeam) {
      return NextResponse.json(
        { error: 'Team with similar name already exists' },
        { status: 409 }
      )
    }

    // Create team
    const team = await prisma.team.create({
      data: {
        organizationId: params.organizationId,
        name: data.name,
        slug,
        description: data.description,
        permissions: data.permissions || [],
        settings: {
          defaultPermissions: data.permissions || [],
          notifications: {
            email: true,
            inApp: true
          }
        }
      },
      include: {
        _count: {
          select: {
            members: true,
            projects: true
          }
        }
      }
    })

    // Get current user and add them as team lead
    const currentUser = await prisma.user.findFirst({
      where: {
        organizationId: params.organizationId,
        email: auth.licenseKey // Assuming license key maps to email for now
      }
    })

    if (currentUser) {
      await prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId: currentUser.id,
          role: 'lead',
          permissions: ['TEAM_EDIT', 'TEAM_DELETE', 'TEAM_INVITE', 'TEAM_REMOVE_MEMBER']
        }
      })
    }

    // Create audit log
    await createAuditLog({
      organizationId: params.organizationId,
      userId: auth.licenseKey,
      action: 'TEAM_CREATE',
      resource: 'team',
      resourceId: team.id,
      newValue: team
    })

    return NextResponse.json({ team }, { status: 201 })
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    )
  }
}