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

    const { step, data } = await request.json();

    // Validate step number
    if (typeof step !== 'number' || step < 0 || step > 6) {
      return NextResponse.json(
        { error: 'Invalid step number' },
        { status: 400 }
      );
    }

    // Get existing onboarding data
    const existing = await prisma.onboarding.findUnique({
      where: { license_key: licenseKey }
    });

    // Merge new data with existing data
    const mergedData = {
      ...(existing?.data || {}),
      ...data,
      last_updated: new Date().toISOString()
    };

    // Upsert onboarding progress
    const onboarding = await prisma.onboarding.upsert({
      where: { license_key: licenseKey },
      update: {
        current_step: step,
        data: mergedData,
        updated_at: new Date()
      },
      create: {
        license_key: licenseKey,
        current_step: step,
        completed: false,
        data: mergedData
      }
    });

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

    const onboarding = await prisma.onboarding.findUnique({
      where: { license_key: licenseKey }
    });

    if (!onboarding) {
      return NextResponse.json({
        currentStep: 0,
        completed: false,
        data: {}
      });
    }

    return NextResponse.json({
      currentStep: onboarding.current_step,
      completed: onboarding.completed,
      data: onboarding.data || {}
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

    // TODO: Add analytics table
    // await prisma.analytics.create({
    //   data: {
    //     event_type: 'onboarding_step_completed',
    //     license_key: licenseKey,
    //     properties: {
    //       step: step,
    //       step_name: stepNames[step] || 'unknown',
    //       has_data: !!data && Object.keys(data).length > 0,
    //       timestamp: new Date().toISOString()
    //     },
    //     created_at: new Date()
    //   }
    // });
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
}