import { NextRequest, NextResponse } from 'next/server';
import { FinanceAgent } from '@repo/skills-orchestrator';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'get_metrics';
    const period = searchParams.get('period') || '30d';

    // Get the Finance Agent
    const financeAgent = FinanceAgent.getInstance();
    
    // Execute financial analytics skill through the agent
    const result = await financeAgent.executeSkill('financial_analytics', {
      action,
      period,
      _context: {
        executedBy: 'admin_dashboard',
        timestamp: new Date()
      }
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Financial analytics error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch financial data' },
      { status: 500 }
    );
  }
}