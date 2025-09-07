import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const cookieStore = cookies();
    const adminToken = cookieStore.get('admin_token');
    
    if (!adminToken) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 401 }
      );
    }

    try {
      const decoded = jwt.verify(adminToken.value, JWT_SECRET) as any;
      if (!decoded.isAdmin) {
        return NextResponse.json(
          { error: 'Not an admin' },
          { status: 403 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Collect insights from management agents
    // In production, these would come from actual agent monitoring
    const insights = [
      {
        agent: 'Analytics Agent',
        type: 'info',
        title: 'Usage Pattern Detected',
        description: 'Peak usage hours identified between 9 AM - 11 AM EST',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        relevance: 0.75
      },
      {
        agent: 'Finance Agent',
        type: 'success',
        title: 'Revenue Growth',
        description: 'MRR increased by 12% compared to last month',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        relevance: 0.95
      },
      {
        agent: 'Security Agent',
        type: 'info',
        title: 'Security Scan Complete',
        description: 'No vulnerabilities detected in latest scan',
        timestamp: new Date(Date.now() - 5400000).toISOString(),
        relevance: 0.8
      },
      {
        agent: 'Operations Agent',
        type: 'warning',
        title: 'Resource Utilization',
        description: 'CPU usage approaching 80% threshold',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        relevance: 0.85
      },
      {
        agent: 'Compliance Agent',
        type: 'info',
        title: 'Policy Update',
        description: 'New GDPR requirements processed and implemented',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        relevance: 0.7
      },
      {
        agent: 'Infrastructure Agent',
        type: 'success',
        title: 'Auto-scaling Triggered',
        description: 'Successfully scaled up to handle increased load',
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        relevance: 0.9
      },
      {
        agent: 'Integration Agent',
        type: 'info',
        title: 'API Integration',
        description: '3 new API integrations configured successfully',
        timestamp: new Date(Date.now() - 18000000).toISOString(),
        relevance: 0.65
      },
      {
        agent: 'Communications Agent',
        type: 'success',
        title: 'Notification Delivery',
        description: '99.8% email delivery rate achieved this week',
        timestamp: new Date(Date.now() - 21600000).toISOString(),
        relevance: 0.7
      }
    ];

    // Sort by relevance and timestamp
    insights.sort((a, b) => {
      const relevanceDiff = b.relevance - a.relevance;
      if (Math.abs(relevanceDiff) > 0.1) return relevanceDiff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return NextResponse.json({
      insights: insights.slice(0, 10), // Return top 10 insights
      count: insights.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Agent insights error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent insights' },
      { status: 500 }
    );
  }
}