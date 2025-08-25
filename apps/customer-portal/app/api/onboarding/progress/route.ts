import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';


export const dynamic = 'force-dynamic';
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

    const { step, data } = await request.json();

    // Validate step number
    if (typeof step !== 'number' || step < 0 || step > 6) {
      return NextResponse.json(
        { error: 'Invalid step number' },
        { status: 400 }
      );
    }

    // TODO: Get existing onboarding data from audit_logs since onboarding table doesn't exist
    const existingLog = await prisma.audit_logs.findFirst({
      where: {
        license_key: licenseKey,
        action: 'onboarding_progress'
      },
      orderBy: { created_at: 'desc' }
    });

    // Merge new data with existing data
    const existingData = existingLog?.changes as Record<string, any> || {};
    const mergedData = {
      ...existingData,
      ...data,
      last_updated: new Date().toISOString()
    };

    // Save onboarding progress in audit_logs
    await prisma.audit_logs.create({
      data: {
        license_key: licenseKey,
        user_id: licenseKey,
        action: 'onboarding_progress',
        resource_type: 'onboarding',
        resource_id: `step_${step}`,
        changes: {
          current_step: step,
          completed: false,
          data: mergedData
        }
      }
    });

    const onboarding = {
      current_step: step,
      data: mergedData
    };

    // Track step completion analytics
    await trackStepProgress(licenseKey, step, data);

    return NextResponse.json({
      success: true,
      currentStep: onboarding.current_step,
      data: onboarding.data
    });

  } catch (error: any) {
    console.error('Onboarding progress error:', error);
    return NextResponse.json(
      { error: 'Failed to save onboarding progress' },
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

    // TODO: Get onboarding data from audit_logs since onboarding table doesn't exist
    const onboardingLog = await prisma.audit_logs.findFirst({
      where: {
        license_key: licenseKey,
        action: 'onboarding_progress'
      },
      orderBy: { created_at: 'desc' }
    });

    if (!onboardingLog) {
      return NextResponse.json({
        currentStep: 0,
        completed: false,
        data: {}
      });
    }

    const progress = onboardingLog.changes as any;
    return NextResponse.json({
      currentStep: progress?.current_step || 0,
      completed: progress?.completed || false,
      data: progress?.data || {}
    });

  } catch (error: any) {
    console.error('Get onboarding progress error:', error);
    return NextResponse.json(
      { error: 'Failed to get onboarding progress' },
      { status: 500 }
    );
  }
}

async function trackStepProgress(licenseKey: string, step: number, data: any) {
  try {
    const stepNames = [
      'welcome',
      'business_info',
      'goals',
      'products',
      'setup',
      'completion'
    ];

    // TODO: Track step completion in audit_logs since analytics/events tables don't exist
    await prisma.audit_logs.create({
      data: {
        license_key: licenseKey,
        user_id: licenseKey,
        action: 'onboarding_step_completed',
        resource_type: 'onboarding',
        resource_id: `step_${step}`,
        changes: {
          step: step,
          step_name: stepNames[step] || 'unknown',
          has_data: !!data && Object.keys(data).length > 0,
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
}