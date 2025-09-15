import { NextRequest, NextResponse } from 'next/server';
import { FinanceAgent } from '@intelagent/skills-orchestrator';

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

    // Get the Finance Agent
    const financeAgent = FinanceAgent.getInstance();
    
    // Build params based on requested metric
    let params: any = {
      action: 'get_metrics',
      period,
      _context: {
        executedBy: 'admin_dashboard',
        timestamp: new Date()
      }
    };

    // Handle different metric types
    switch (metric) {
      case 'revenue_breakdown':
        params.action = 'get_revenue_breakdown';
        params.groupBy = searchParams.get('groupBy') || 'product';
        break;
        
      case 'customer_ltv':
        params.action = 'get_customer_ltv';
        params.cohort = searchParams.get('cohort');
        break;
        
      case 'payment_methods':
        params.action = 'get_payment_methods';
        break;
        
      case 'failed_payments':
        params.action = 'get_failed_payments';
        params.limit = parseInt(searchParams.get('limit') || '50');
        break;
        
      case 'forecasting':
        params.action = 'get_revenue_forecast';
        params.months = parseInt(searchParams.get('months') || '3');
        break;
        
      case 'subscription_health':
        params.action = 'get_subscription_health';
        break;
        
      case 'cohort_analysis':
        params.action = 'get_cohort_analysis';
        params.startDate = startDate;
        params.endDate = endDate;
        break;
    }
    
    // Execute skill through the agent
    const result = await financeAgent.executeSkill('financial_analytics', params);

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

    const financeAgent = FinanceAgent.getInstance();
    
    // Handle financial actions
    switch (action) {
      case 'export_report':
        const reportResult = await financeAgent.executeSkill('financial_analytics', {
          action: 'export_report',
          format: params.format || 'csv',
          period: params.period,
          ...params
        });
        return NextResponse.json(reportResult);
        
      case 'sync_stripe':
        const syncResult = await financeAgent.executeSkill('financial_analytics', {
          action: 'sync_stripe_data',
          full: params.full || false
        });
        return NextResponse.json(syncResult);
        
      case 'create_report':
        const customReport = await financeAgent.executeSkill('financial_analytics', {
          action: 'create_custom_report',
          ...params
        });
        return NextResponse.json(customReport);
        
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