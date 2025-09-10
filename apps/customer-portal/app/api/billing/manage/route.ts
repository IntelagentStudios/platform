import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

// Initialize Stripe lazily to avoid build-time errors
let stripe: Stripe | null = null;
const getStripe = () => {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
      apiVersion: '2023-10-16',
    });
  }
  return stripe;
};

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Get user from auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;

    // Get user
    const user = await prisma.users.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the user's license to find their subscription
    const license = await prisma.licenses.findUnique({
      where: { license_key: user.license_key }
    });

    if (!license || !license.subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Get the subscription from Stripe to find the customer ID
    let customerId: string;
    try {
      const subscription = await getStripe().subscriptions.retrieve(license.subscription_id);
      customerId = subscription.customer as string;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve subscription details' },
        { status: 500 }
      );
    }

    // Create billing portal session
    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    });

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create portal session' },
      { status: 500 }
    );
  }
}