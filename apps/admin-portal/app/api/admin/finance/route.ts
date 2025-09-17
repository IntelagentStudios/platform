import { NextRequest, NextResponse } from 'next/server';

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

    // Mock response - FinanceAgent temporarily unavailable
    // Will be replaced once skills-orchestrator build is fixed
    const result = {
      success: true,
      data: {
        action,
        period,
        _context: {
          executedBy: 'admin_dashboard',
          timestamp: new Date()
        },
        message: 'Finance data temporarily unavailable - skills-orchestrator rebuild in progress'
      }
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Financial analytics error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch financial data' },
      { status: 500 }
    );
  }
}