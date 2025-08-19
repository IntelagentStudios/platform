import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthFromCookies } from '@/lib/auth'
import { redis } from '@/lib/redis'

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthFromCookies()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get team members from cache or database
    const cacheKey = `team:${auth.license_key}`
    const cached = await redis.get(cacheKey)
    
    if (cached) {
      return NextResponse.json(JSON.parse(cached))
    }

    // For now, return mock team data
    const teamData = {
      organization: {
        id: 'org_' + auth.license_key.substring(0, 8),
        name: auth.domain || 'My Organization',
        plan: 'professional',
        license_key: auth.license_key,
      },
      members: [
        {
          id: '1',
          name: 'Admin User',
          email: 'admin@' + auth.domain,
          role: 'owner',
          status: 'active',
          joinedAt: new Date('2024-01-01').toISOString(),
          lastActive: new Date().toISOString(),
          avatar: null,
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          email: 'sarah@' + auth.domain,
          role: 'admin',
          status: 'active',
          joinedAt: new Date('2024-02-15').toISOString(),
          lastActive: new Date(Date.now() - 3600000).toISOString(),
          avatar: null,
        },
        {
          id: '3',
          name: 'Mike Chen',
          email: 'mike@' + auth.domain,
          role: 'member',
          status: 'active',
          joinedAt: new Date('2024-03-10').toISOString(),
          lastActive: new Date(Date.now() - 7200000).toISOString(),
          avatar: null,
        },
        {
          id: '4',
          name: 'Emily Davis',
          email: 'emily@' + auth.domain,
          role: 'member',
          status: 'pending',
          joinedAt: new Date('2024-12-01').toISOString(),
          lastActive: null,
          avatar: null,
        }
      ],
      invitations: [
        {
          id: 'inv_1',
          email: 'john@' + auth.domain,
          role: 'member',
          invitedBy: 'admin@' + auth.domain,
          invitedAt: new Date(Date.now() - 86400000).toISOString(),
          expiresAt: new Date(Date.now() + 518400000).toISOString(),
          status: 'pending',
        }
      ],
      stats: {
        totalMembers: 4,
        activeMembers: 3,
        pendingInvitations: 1,
        monthlyActiveUsers: 3,
        storageUsed: 524288000, // 500MB in bytes
        apiCallsThisMonth: 3421,
      }
    }

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(teamData))

    return NextResponse.json(teamData)
  } catch (error) {
    console.error('Team fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team data' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthFromCookies()
    if (!auth || !auth.isMaster) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { email, role, name } = body

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      )
    }

    // Create invitation (in production, would send email)
    const invitation = {
      id: 'inv_' + Date.now(),
      email,
      role,
      invitedBy: 'admin',
      invitedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 604800000).toISOString(), // 7 days
      status: 'pending',
    }

    // Invalidate cache
    const cacheKey = `team:${auth.license_key}`
    await redis.del(cacheKey)

    // In production, send invitation email using Resend
    console.log('Would send invitation email to:', email)

    return NextResponse.json({
      success: true,
      invitation,
      message: `Invitation sent to ${email}`
    })
  } catch (error) {
    console.error('Team invite error:', error)
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    )
  }
}