import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const metric = searchParams.get('metric') || 'overview';
    const period = searchParams.get('period') || '30d';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Mock response for now - will be replaced with actual FinanceAgent implementation
    // once the skills-orchestrator build issues are resolved
    let result: any = {
      success: true,
      data: {
        metric,
        period,
        message: 'Finance metrics temporarily unavailable - skills-orchestrator rebuild in progress'
      }
    };

    // Handle different metric types with mock data
    switch (metric) {
      case 'revenue_breakdown':
        result.data.groupBy = searchParams.get('groupBy') || 'product';
        break;

      case 'customer_ltv':
        result.data.cohort = searchParams.get('cohort');
        break;

      case 'failed_payments':
        result.data.limit = parseInt(searchParams.get('limit') || '50');
        break;

      case 'forecasting':
        result.data.months = parseInt(searchParams.get('months') || '3');
        break;

      case 'cohort_analysis':
        result.data.startDate = startDate;
        result.data.endDate = endDate;
        break;
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Financial metrics error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch financial metrics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, params } = body;

    // Mock responses for financial actions
    // Will be replaced with actual FinanceAgent implementation once resolved
    switch (action) {
      case 'export_report':
        return NextResponse.json({
          success: true,
          data: {
            action: 'export_report',
            format: params.format || 'csv',
            period: params.period,
            message: 'Export temporarily unavailable - skills-orchestrator rebuild in progress'
          }
        });

      case 'sync_stripe':
        return NextResponse.json({
          success: true,
          data: {
            action: 'sync_stripe_data',
            full: params.full || false,
            message: 'Sync temporarily unavailable - skills-orchestrator rebuild in progress'
          }
        });

      case 'create_report':
        return NextResponse.json({
          success: true,
          data: {
            action: 'create_custom_report',
            ...params,
            message: 'Custom reports temporarily unavailable - skills-orchestrator rebuild in progress'
          }
        });

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('Financial action error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute financial action' },
      { status: 500 }
    );
  }
}