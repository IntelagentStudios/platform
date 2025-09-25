import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

// POST /api/ui/telemetry - Log widget events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { widgetId, widgetType, eventType, eventData } = body;

    if (!widgetId || !eventType) {
      return NextResponse.json({
        error: 'Widget ID and event type are required'
      }, { status: 400 });
    }

    // Get user info from session
    const cookieStore = cookies();
    const userId = cookieStore.get('userId')?.value || 'anonymous';
    const licenseKey = cookieStore.get('licenseKey')?.value || 'default';
    const sessionId = cookieStore.get('sessionId')?.value || `session-${Date.now()}`;

    // In production, save to database
    // For now, just log and aggregate in memory
    const telemetryEvent = {
      widgetId,
      widgetType,
      eventType,
      eventData,
      userId,
      tenantId: licenseKey,
      sessionId,
      timestamp: new Date().toISOString()
    };

    console.log('[TELEMETRY]', telemetryEvent);

    // Track metrics
    if (eventType === 'view') {
      // Increment view counter
    } else if (eventType === 'action_execute') {
      // Track action usage
    } else if (eventType === 'error') {
      // Log errors for debugging
    }

    return NextResponse.json({
      success: true,
      message: 'Telemetry recorded'
    });
  } catch (error) {
    console.error('Error recording telemetry:', error);
    return NextResponse.json({
      error: 'Failed to record telemetry'
    }, { status: 500 });
  }
}

// GET /api/ui/telemetry - Get telemetry summary for admin
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product');
    const period = searchParams.get('period') || '7d';

    // For now, return mock telemetry data
    const mockTelemetry = {
      summary: {
        totalViews: 15234,
        uniqueUsers: 342,
        totalActions: 1823,
        errorRate: 0.02
      },
      widgets: [
        {
          id: 'metric-1',
          title: 'Active Workflows',
          views: 3421,
          actionClicks: 234,
          avgDwellTime: 8.5,
          age: 30
        },
        {
          id: 'chart-1',
          title: 'Workflow Timeline',
          views: 2890,
          actionClicks: 89,
          avgDwellTime: 45.2,
          age: 30
        },
        {
          id: 'table-1',
          title: 'Recent Runs',
          views: 4123,
          actionClicks: 567,
          avgDwellTime: 23.4,
          age: 30
        },
        {
          id: 'metric-2',
          title: 'Error Count',
          views: 8,
          actionClicks: 0,
          avgDwellTime: 2.1,
          age: 15
        }
      ],
      suggestions: [
        {
          type: 'remove_low_usage',
          widgets: ['metric-2'],
          reason: 'Widget "Error Count" has very low engagement (8 views in 15 days)'
        },
        {
          type: 'add_actions',
          widgets: ['table-1'],
          reason: 'Table "Recent Runs" has high interaction - consider adding quick actions'
        }
      ]
    };

    return NextResponse.json(mockTelemetry);
  } catch (error) {
    console.error('Error fetching telemetry:', error);
    return NextResponse.json({
      error: 'Failed to fetch telemetry'
    }, { status: 500 });
  }
}