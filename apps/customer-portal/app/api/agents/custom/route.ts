import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// POST: Create a custom agent
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      description,
      industry,
      requirements,
      skills,
      pricing
    } = body;

    // Custom agents are available to all authenticated users for now
    // TODO: Implement proper plan-based restrictions when plan structure is finalized

    // Create the custom agent configuration
    const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store custom agent configuration in product_keys table
    const configuration = await prisma.product_keys.create({
      data: {
        product_key: agentId,
        license_key: user.license_key,
        product: 'custom_agent',
        status: 'pending', // Will be activated after payment
        metadata: {
          name: name,
          description: description,
          industry: industry,
          requirements: requirements,
          skills: skills,
          pricing: {
            monthlyPrice: pricing.monthlyPrice,
            setupFee: pricing.setupFee || 0,
            complexity: pricing.complexity
          },
          created_by: user.id,
          created_at: new Date().toISOString(),
          isActivated: false
        },
        created_at: new Date()
      }
    });

    // Log the agent creation in audit logs
    await prisma.audit_logs.create({
      data: {
        license_key: user.license_key,
        user_id: user.id,
        action: 'custom_agent_created',
        resource_type: 'custom_agent',
        resource_id: agentId,
        changes: {
          name,
          skillCount: skills.length,
          monthlyPrice: pricing.monthlyPrice
        },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      agentId,
      name,
      status: 'pending_payment',
      configuration,
      nextStep: {
        action: 'checkout',
        message: 'Complete payment to activate your custom agent'
      }
    });

  } catch (error: any) {
    console.error('Error creating custom agent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create custom agent' },
      { status: 500 }
    );
  }
}

// GET: Retrieve custom agents for a user
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all custom agents for this user from product_keys table
    const customAgents = await prisma.product_keys.findMany({
      where: {
        license_key: user.license_key,
        product: 'custom_agent'
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    const agentsWithStatus = customAgents.map(agent => {
      const metadata = agent.metadata as any;
      return {
        id: agent.id,
        agentId: agent.product_key,
        name: metadata?.name || 'Unnamed Agent',
        description: metadata?.description || '',
        industry: metadata?.industry || '',
        skills: metadata?.skills || [],
        skillCount: metadata?.skills?.length || 0,
        complexity: metadata?.pricing?.complexity || 0,
        monthlyPrice: metadata?.pricing?.monthlyPrice || 0,
        setupFee: metadata?.pricing?.setupFee || 0,
        isActive: agent.status === 'active',
        isActivated: metadata?.isActivated || false,
        createdAt: agent.created_at,
        activatedAt: agent.last_used_at
      };
    });

    return NextResponse.json({
      agents: agentsWithStatus,
      summary: {
        total: agentsWithStatus.length,
        active: agentsWithStatus.filter(a => a.isActive).length,
        pending: agentsWithStatus.filter(a => !a.isActive).length
      }
    });

  } catch (error: any) {
    console.error('Error fetching custom agents:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch custom agents' },
      { status: 500 }
    );
  }
}