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
    await prisma.analytics.create({
      data: {
        event_type: `onboarding_${event}`,
        license_key: licenseKey,
        properties: properties || {},
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
    const analytics = await prisma.analytics.findMany({
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

    // Calculate metrics
    const metrics = calculateOnboardingMetrics(analytics);

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
    switch (event) {
      case 'started':
        await prisma.onboarding_metrics.upsert({
          where: { license_key: licenseKey },
          update: {
            started_at: new Date(),
            updated_at: new Date()
          },
          create: {
            license_key: licenseKey,
            started_at: new Date(),
            completed: false
          }
        });
        break;

      case 'step_completed':
        const stepName = properties.step_name;
        const duration = properties.duration;
        
        await prisma.onboarding_metrics.update({
          where: { license_key: licenseKey },
          data: {
            [`step_${stepName}_completed`]: true,
            [`step_${stepName}_duration`]: duration,
            last_step_completed: stepName,
            updated_at: new Date()
          }
        });
        break;

      case 'completed':
        await prisma.onboarding_metrics.update({
          where: { license_key: licenseKey },
          data: {
            completed: true,
            completed_at: new Date(),
            total_duration: properties.total_duration,
            products_setup: properties.products || [],
            updated_at: new Date()
          }
        });
        break;

      case 'skipped':
        await prisma.onboarding_metrics.update({
          where: { license_key: licenseKey },
          data: {
            skipped: true,
            skipped_at: new Date(),
            skipped_reason: properties.reason,
            updated_at: new Date()
          }
        });
        break;

      case 'abandoned':
        await prisma.onboarding_metrics.update({
          where: { license_key: licenseKey },
          data: {
            abandoned: true,
            abandoned_at: new Date(),
            abandoned_step: properties.step,
            updated_at: new Date()
          }
        });
        break;
    }
  } catch (error) {
    console.error('Failed to update onboarding metrics:', error);
  }
}

function calculateOnboardingMetrics(analytics: any[]) {
  const metrics = {
    total_events: analytics.length,
    steps_completed: 0,
    time_to_complete: null as number | null,
    drop_off_points: [] as string[],
    engagement_score: 0,
    products_explored: new Set<string>(),
    features_used: new Set<string>()
  };

  let startTime: Date | null = null;
  let endTime: Date | null = null;

  analytics.forEach(event => {
    if (event.event_type === 'onboarding_started') {
      startTime = new Date(event.created_at);
    }
    
    if (event.event_type === 'onboarding_completed') {
      endTime = new Date(event.created_at);
    }
    
    if (event.event_type === 'onboarding_step_completed') {
      metrics.steps_completed++;
    }
    
    if (event.event_type === 'onboarding_abandoned') {
      metrics.drop_off_points.push(event.properties.step);
    }
    
    if (event.properties.product) {
      metrics.products_explored.add(event.properties.product);
    }
    
    if (event.properties.feature) {
      metrics.features_used.add(event.properties.feature);
    }
  });

  // Calculate time to complete
  if (startTime && endTime) {
    metrics.time_to_complete = Math.round(
      (endTime.getTime() - startTime.getTime()) / 1000 / 60
    ); // in minutes
  }

  // Calculate engagement score (0-100)
  metrics.engagement_score = Math.min(100, 
    (metrics.steps_completed * 10) + 
    (metrics.products_explored.size * 15) + 
    (metrics.features_used.size * 5)
  );

  return {
    ...metrics,
    products_explored: Array.from(metrics.products_explored),
    features_used: Array.from(metrics.features_used)
  };
}