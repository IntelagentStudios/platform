import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Return dummy stats for now
    const stats = {
      totalConversations: 1247,
      activeConversations: 23,
      avgResponseTime: '1.2s',
      uniqueUsers: 892,
      growthRate: 15.3,
      apiCalls: 45678,
      dataProcessed: 234.5, // MB
      products: ['chatbot', 'sales_agent', 'data_enrichment', 'setup_agent'],
      plan: 'Pro Platform',
      hasAiPro: true,
      licenseStatus: 'active'
    };
    
    return NextResponse.json(stats);
    
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}