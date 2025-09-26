import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get user's license key from cookies
    const licenseKey = request.cookies.get('licenseKey')?.value;
    const userId = request.cookies.get('userId')?.value;

    if (!licenseKey || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all agents for this license
    const agents = await prisma.product_configurations.findMany({
      where: {
        product_key: licenseKey,
        customization_type: 'agent'
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    const agentList = agents.map(agent => {
      const config = JSON.parse(agent.configuration as string || '{}');
      return {
        id: agent.custom_name,
        name: config.name || agent.product_name,
        description: config.description || agent.description,
        status: config.status || 'active',
        skillCount: config.skills?.length || 0,
        price: config.price || 0,
        createdAt: agent.created_at,
        updatedAt: agent.updated_at
      };
    });

    // Get usage stats for each agent
    const agentStats = await Promise.all(
      agentList.map(async (agent) => {
        const stats = await prisma.skill_audit_log.count({
          where: {
            license_key: licenseKey,
            event_type: 'skill_execution',
            event_data: {
              path: ['agent_id'],
              equals: agent.id
            },
            created_at: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        });

        return {
          ...agent,
          executionCount: stats
        };
      })
    );

    return NextResponse.json({
      success: true,
      agents: agentStats
    });
  } catch (error) {
    console.error('Error listing agents:', error);
    return NextResponse.json(
      { error: 'Failed to list agents' },
      { status: 500 }
    );
  }
}