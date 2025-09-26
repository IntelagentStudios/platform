import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

// Initialize Stripe lazily to avoid build-time errors
let stripe: Stripe | null = null;
const getStripe = () => {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
      apiVersion: '2025-08-27.basil',
    });
  }
  return stripe;
};

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get user from auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;

    // Get user and license
    const user = await prisma.users.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const license = await prisma.licenses.findFirst({
      where: { license_key: user.license_key }
    });

    if (!license || !license.subscription_id) {
      return NextResponse.json({
        subscription: null,
        paymentMethod: null
      });
    }

    // Get subscription from Stripe
    const subscription = await getStripe().subscriptions.retrieve(license.subscription_id);
    
    // Get payment method
    let paymentMethod = null;
    if (subscription.default_payment_method) {
      const pm = await getStripe().paymentMethods.retrieve(
        subscription.default_payment_method as string
      );
      paymentMethod = {
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        exp_month: pm.card?.exp_month,
        exp_year: pm.card?.exp_year
      };
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        tier: 'pro_platform', // Using default tier since field doesn't exist
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        price: subscription.items.data[0]?.price.unit_amount || 0,
        interval: subscription.items.data[0]?.price.recurring?.interval || 'month'
      },
      paymentMethod
    });

  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}