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

    // Validate enterprise tier for custom agents
    const license = await prisma.licenses.findUnique({
      where: { license_key: user.license_key }
    });

    if (license?.tier !== 'enterprise') {
      return NextResponse.json(
        { 
          error: 'Custom Agent Builder requires Enterprise tier',
          upgradeRequired: true 
        },
        { status: 403 }
      );
    }

    // Create the custom agent configuration
    const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store in product_configurations as a custom product
    const configuration = await prisma.product_configurations.create({
      data: {
        product_key: agentId,
        license_key: user.license_key,
        base_product: 'custom_agent',
        custom_name: name,
        customization_type: 'custom',
        description,
        skills_enabled: skills,
        custom_settings: {
          industry,
          requirements,
          created_by: user.id,
          created_at: new Date().toISOString()
        },
        complexity_score: pricing.complexity,
        base_price_pence: pricing.monthlyPrice,
        total_price_pence: pricing.monthlyPrice,
        skill_count: skills.length,
        setup_fee_pence: pricing.setupFee || 0,
        is_active: false // Will be activated after payment
      }
    });

    // Create a product key for the agent
    await prisma.product_keys.create({
      data: {
        product_key: agentId,
        license_key: user.license_key,
        product_type: 'custom_agent',
        product_name: name,
        is_activated: false,
        assigned_skills: skills,
        monthly_price: pricing.monthlyPrice / 100,
        created_at: new Date(),
        activated_at: null
      }
    });

    // Log the agent creation
    await prisma.activity_logs.create({
      data: {
        user_id: user.id,
        action: 'custom_agent_created',
        details: {
          agentId,
          name,
          skillCount: skills.length,
          monthlyPrice: pricing.monthlyPrice
        },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
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

    // Get all custom agents for this user
    const customAgents = await prisma.product_configurations.findMany({
      where: {
        license_key: user.license_key,
        base_product: 'custom_agent'
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Get product keys for activation status
    const productKeys = await prisma.product_keys.findMany({
      where: {
        license_key: user.license_key,
        product_type: 'custom_agent'
      }
    });

    const agentsWithStatus = customAgents.map(agent => {
      const productKey = productKeys.find(pk => pk.product_key === agent.product_key);
      return {
        id: agent.id,
        agentId: agent.product_key,
        name: agent.custom_name || 'Unnamed Agent',
        description: agent.description || '',
        industry: (agent.custom_settings as any)?.industry || '',
        skills: agent.skills_enabled as string[],
        skillCount: agent.skill_count,
        complexity: agent.complexity_score,
        monthlyPrice: agent.total_price_pence / 100,
        isActive: agent.is_active,
        isActivated: productKey?.is_activated || false,
        createdAt: agent.created_at,
        activatedAt: productKey?.activated_at
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