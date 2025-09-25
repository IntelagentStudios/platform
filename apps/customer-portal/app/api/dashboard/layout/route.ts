import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productKey = searchParams.get('productKey');
    const userId = searchParams.get('userId');

    if (!productKey || !userId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // For now, return a mock layout
    // In production, this would fetch from the database
    const mockLayout = {
      layout: [
        { i: 'metric-1', x: 0, y: 0, w: 3, h: 2 },
        { i: 'metric-2', x: 3, y: 0, w: 3, h: 2 },
        { i: 'chart-1', x: 6, y: 0, w: 6, h: 4 },
        { i: 'table-1', x: 0, y: 2, w: 6, h: 4 },
      ],
      widgets: [
        { id: 'metric-1', type: 'metric', name: 'Active Workflows', data: { value: '12', label: 'Running' } },
        { id: 'metric-2', type: 'metric', name: 'SLA Compliance', data: { value: '98%', label: 'On Target' } },
        { id: 'chart-1', type: 'chart', name: 'Workflow Timeline', config: { chartType: 'timeline' } },
        { id: 'table-1', type: 'table', name: 'Recent Runs', config: { pageSize: 10 } }
      ],
      theme: {
        primaryColor: 'rgb(169, 189, 203)',
        backgroundColor: 'rgb(48, 54, 54)',
        textColor: 'rgb(229, 227, 220)',
        borderColor: 'rgba(169, 189, 203, 0.3)'
      }
    };

    return NextResponse.json(mockLayout);
  } catch (error) {
    console.error('Error fetching dashboard layout:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productKey, userId, layout, widgets, theme } = body;

    if (!productKey || !userId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // In production, save to database
    // For now, just return success
    console.log('Saving dashboard layout:', { productKey, userId, layout, widgets, theme });

    return NextResponse.json({ success: true, message: 'Layout saved successfully' });
  } catch (error) {
    console.error('Error saving dashboard layout:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const layoutId = searchParams.get('layoutId');

    if (!layoutId) {
      return NextResponse.json({ error: 'Missing layout ID' }, { status: 400 });
    }

    // In production, delete from database
    console.log('Deleting dashboard layout:', layoutId);

    return NextResponse.json({ success: true, message: 'Layout deleted successfully' });
  } catch (error) {
    console.error('Error deleting dashboard layout:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}