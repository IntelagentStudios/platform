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
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Retrieve the checkout session from Stripe
    const session = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'subscription']
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get metadata
    const { userId, tier, billing, isGuest } = session.metadata || {};
    const customerEmail = session.customer_email || 
                         (session.customer as any)?.email || 
                         session.customer_details?.email;

    // Check if this was a new user signup
    const isNewUser = isGuest === 'true' || userId === 'pending';

    // Get license information
    let licenseKey = null;
    let products = [];

    if (isNewUser && customerEmail) {
      // Find the newly created user
      const user = await prisma.users.findUnique({
        where: { email: customerEmail }
      });

      if (user) {
        licenseKey = user.license_key;
        
        // Get product keys
        const productKeys = await prisma.product_keys.findMany({
          where: { license_key: user.license_key }
        });

        products = productKeys.map(pk => {
          const productName = pk.product === 'chatbot' ? 'AI Chatbot' :
                            pk.product === 'sales-agent' ? 'Sales Agent' :
                            pk.product === 'enrichment' ? 'Data Enrichment' :
                            pk.product === 'setup-agent' ? 'Setup Agent' :
                            pk.product;
          return productName;
        });
      }
    } else if (userId && userId !== 'pending') {
      // Existing user
      const user = await prisma.users.findUnique({
        where: { id: userId }
      });

      if (user) {
        licenseKey = user.license_key;
        
        const productKeys = await prisma.product_keys.findMany({
          where: { license_key: user.license_key }
        });

        products = productKeys.map(pk => {
          const productName = pk.product === 'chatbot' ? 'AI Chatbot' :
                            pk.product === 'sales-agent' ? 'Sales Agent' :
                            pk.product === 'enrichment' ? 'Data Enrichment' :
                            pk.product === 'setup-agent' ? 'Setup Agent' :
                            pk.product;
          return productName;
        });
      }
    }

    // Remove duplicates from products array
    products = [...new Set(products)];

    return NextResponse.json({
      success: true,
      email: customerEmail,
      tier: tier || 'starter',
      billing: billing || 'monthly',
      licenseKey,
      products,
      isNewUser,
      amount: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency,
      customerName: session.customer_details?.name
    });

  } catch (error: any) {
    console.error('Error verifying session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify session' },
      { status: 500 }
    );
  }
}