import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

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

    // Check if onboarding is completed
    const onboarding = await prisma.onboarding.findUnique({
      where: { license_key: licenseKey }
    });

    if (!onboarding) {
      // First time user
      return NextResponse.json({
        completed: false,
        currentStep: 0,
        data: {}
      });
    }

    return NextResponse.json({
      completed: onboarding.completed,
      currentStep: onboarding.current_step,
      data: onboarding.data
    });

  } catch (error: any) {
    console.error('Onboarding status error:', error);
    return NextResponse.json(
      { error: 'Failed to check onboarding status' },
      { status: 500 }
    );
  }
}