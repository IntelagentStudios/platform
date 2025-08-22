import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@intelagent/database';
import stripeService from '@intelagent/billing';

// POST /api/billing/portal - Create Stripe customer portal session
export async function POST(request: NextRequest) {
  try {
    const db = prisma;
    const { return_url } = await request.json();
    
    // Get customer ID
    const result = await db.$queryRaw`
      SELECT u.stripe_customer_id 
      FROM public.users u
      WHERE u.license_key = current_setting('app.current_license')
        AND u.role = 'owner'
      LIMIT 1
    ` as any[];

    if (!result || result.length === 0 || !result[0].stripe_customer_id) {
      return NextResponse.json(
        { error: 'No billing account found' },
        { status: 404 }
      );
    }

    const session = await stripeService.createPortalSession(
      result[0].stripe_customer_id,
      return_url || `${process.env.NEXT_PUBLIC_APP_URL}/billing`
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Failed to create portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}