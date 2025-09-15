import { NextRequest, NextResponse } from 'next/server';
import { OperationsAgent } from '@intelagent/skills-orchestrator';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, params } = body;

    // Get the Operations Agent
    const operationsAgent = OperationsAgent.getInstance();
    
    // Execute user management skill through the agent
    const result = await operationsAgent.executeSkill('user_management', {
      action,
      ...params,
      _context: {
        executedBy: 'admin_dashboard',
        timestamp: new Date()
      }
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('User management error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute user management action' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list_users';
    const filter = searchParams.get('filter') ? JSON.parse(searchParams.get('filter')!) : {};
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get the Operations Agent
    const operationsAgent = OperationsAgent.getInstance();
    
    // Execute user management skill
    const result = await operationsAgent.executeSkill('user_management', {
      action,
      filter,
      limit,
      offset,
      _context: {
        executedBy: 'admin_dashboard',
        timestamp: new Date()
      }
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('User management error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}