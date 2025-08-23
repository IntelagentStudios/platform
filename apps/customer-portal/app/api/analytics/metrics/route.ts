import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';


export const dynamic = 'force-dynamic';
// GET /api/analytics/metrics - Get analytics metrics
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const licenseKey = cookieStore.get('license_key')?.value;

    if (!licenseKey) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const metricType = searchParams.get('type');
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const whereClause: any = {
      license_key: licenseKey,
      period_start: {
        gte: startDate
      }
    };

    if (metricType) {
      whereClause.metric_type = metricType;
    }

    const metrics = await prisma.analytics.findMany({
      where: whereClause,
      orderBy: { period_start: 'desc' }
    });

    // Group metrics by type
    const groupedMetrics = metrics.reduce((acc: any, metric) => {
      if (!acc[metric.metric_type]) {
        acc[metric.metric_type] = [];
      }
      acc[metric.metric_type].push({
        name: metric.metric_name,
        value: metric.metric_value,
        dimension: metric.dimension,
        date: metric.period_start
      });
      return acc;
    }, {});

    return NextResponse.json({ 
      metrics: groupedMetrics,
      period: {
        start: startDate,
        end: new Date(),
        days
      }
    });
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

// POST /api/analytics/metrics - Track a metric
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const licenseKey = cookieStore.get('license_key')?.value;

    if (!licenseKey) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { 
      metric_type, 
      metric_name, 
      metric_value, 
      dimension 
    } = await request.json();

    if (!metric_type || !metric_name || metric_value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // Upsert metric for today
    const metric = await prisma.analytics.upsert({
      where: {
        license_key_metric_type_metric_name_period_start: {
          license_key: licenseKey,
          metric_type,
          metric_name,
          period_start: startOfDay
        }
      },
      update: {
        metric_value: {
          increment: metric_value
        }
      },
      create: {
        license_key: licenseKey,
        metric_type,
        metric_name,
        metric_value,
        dimension,
        period_start: startOfDay,
        period_end: endOfDay
      }
    });

    return NextResponse.json({
      success: true,
      metric
    });
  } catch (error) {
    console.error('Failed to track metric:', error);
    return NextResponse.json(
      { error: 'Failed to track metric' },
      { status: 500 }
    );
  }
}