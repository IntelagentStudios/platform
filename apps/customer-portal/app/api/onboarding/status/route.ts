import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';


export const dynamic = 'force-dynamic';
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

    // TODO: Check if onboarding is completed from audit_logs since onboarding table doesn't exist
    const onboardingLog = await prisma.audit_logs.findFirst({
      where: {
        license_key: licenseKey,
        action: 'onboarding_completed'
      },
      orderBy: { created_at: 'desc' }
    });

    if (!onboardingLog) {
      // Check for progress
      const progressLog = await prisma.audit_logs.findFirst({
        where: {
          license_key: licenseKey,
          action: 'onboarding_progress'
        },
        orderBy: { created_at: 'desc' }
      });

      if (!progressLog) {
        // First time user
        return NextResponse.json({
          completed: false,
          currentStep: 0,
          data: {}
        });
      }

      const progress = progressLog.changes as any;
      return NextResponse.json({
        completed: false,
        currentStep: progress?.current_step || 0,
        data: progress?.data || {}
      });
    }

    const onboardingData = onboardingLog.changes as any;
    return NextResponse.json({
      completed: true,
      currentStep: onboardingData?.current_step || 6,
      data: onboardingData?.data || {}
    });

  } catch (error: any) {
    console.error('Onboarding status error:', error);
    return NextResponse.json(
      { error: 'Failed to check onboarding status' },
      { status: 500 }
    );
  }
}