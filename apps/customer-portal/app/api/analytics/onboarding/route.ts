import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const licenseKey = cookieStore.get('license_key')?.value;

    if (!licenseKey) {
      return NextResponse.json(
        { error: 'No license key found' },
        { status: 401 }
      );
    }

    const { event, properties } = await request.json();

    // Track the onboarding event
    await prisma.events.create({
      data: {
        event_type: `onboarding_${event}`,
        license_key: licenseKey,
        event_data: properties || {},
        created_at: new Date()
      }
    });

    // Update onboarding metrics
    await updateOnboardingMetrics(licenseKey, event, properties);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track analytics' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const licenseKey = cookieStore.get('license_key')?.value;

    if (!licenseKey) {
      return NextResponse.json(
        { error: 'No license key found' },
        { status: 401 }
      );
    }

    // Get onboarding analytics for this user
    const analytics = await prisma.events.findMany({
      where: {
        license_key: licenseKey,
        event_type: {
          startsWith: 'onboarding_'
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Get onboarding metrics
    const onboardingMetrics = await prisma.onboarding_metrics.findMany({
      where: { license_key: licenseKey },
      orderBy: { created_at: 'desc' }
    });

    // Calculate metrics
    const metrics = calculateOnboardingMetrics(analytics, onboardingMetrics);

    return NextResponse.json({
      events: analytics,
      metrics
    });

  } catch (error: any) {
    console.error('Get analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to get analytics' },
      { status: 500 }
    );
  }
}

async function updateOnboardingMetrics(
  licenseKey: string, 
  event: string, 
  properties: any
) {
  try {
    // Track specific metrics based on event type
    await prisma.onboarding_metrics.create({
      data: {
        license_key: licenseKey,
        step_completed: event,
        time_spent: properties?.duration || null,
        properties: properties || {}
      }
    });

    // Also update analytics table
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    await prisma.analytics.upsert({
      where: {
        license_key_metric_type_metric_name_period_start: {
          license_key: licenseKey,
          metric_type: 'onboarding',
          metric_name: event,
          period_start: startOfDay
        }
      },
      update: {
        metric_value: {
          increment: 1
        }
      },
      create: {
        license_key: licenseKey,
        metric_type: 'onboarding',
        metric_name: event,
        metric_value: 1,
        dimension: properties?.step_name || event,
        period_start: startOfDay,
        period_end: endOfDay
      }
    });
  } catch (error) {
    console.error('Failed to update onboarding metrics:', error);
  }
}

function calculateOnboardingMetrics(events: any[], metrics: any[]) {
  const result = {
    total_events: events.length,
    total_metrics: metrics.length,
    steps_completed: 0,
    time_to_complete: null as number | null,
    drop_off_points: [] as string[],
    engagement_score: 0,
    products_explored: new Set<string>(),
    features_used: new Set<string>(),
    step_times: {} as Record<string, number>
  };

  let startTime: Date | null = null;
  let endTime: Date | null = null;

  // Process events
  events.forEach(event => {
    if (event.event_type === 'onboarding_started') {
      startTime = new Date(event.created_at);
    }
    
    if (event.event_type === 'onboarding_completed') {
      endTime = new Date(event.created_at);
    }
    
    if (event.event_type === 'onboarding_step_completed') {
      result.steps_completed++;
    }
    
    if (event.event_type === 'onboarding_abandoned') {
      result.drop_off_points.push(event.event_data?.step || 'unknown');
    }
    
    if (event.event_data?.product) {
      result.products_explored.add(event.event_data.product);
    }
    
    if (event.event_data?.feature) {
      result.features_used.add(event.event_data.feature);
    }
  });

  // Process metrics
  metrics.forEach(metric => {
    const step = metric.step_completed;
    if (!result.step_times[step]) {
      result.step_times[step] = 0;
    }
    result.step_times[step] += metric.time_spent || 0;
  });

  // Calculate time to complete
  if (startTime && endTime) {
    result.time_to_complete = Math.round(
      (endTime.getTime() - startTime.getTime()) / 1000 / 60
    ); // in minutes
  }

  // Calculate engagement score (0-100)
  result.engagement_score = Math.min(100, 
    (result.steps_completed * 10) + 
    (result.products_explored.size * 15) + 
    (result.features_used.size * 5)
  );

  return {
    ...result,
    products_explored: Array.from(result.products_explored),
    features_used: Array.from(result.features_used)
  };
}