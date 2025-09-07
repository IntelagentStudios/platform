import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrismaClient } from '@repo/database';
import jwt from 'jsonwebtoken';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

const prisma = new PrismaClient();

// Product configuration
const PRODUCTS = {
  starter: {
    name: 'Starter Plan',
    description: 'Perfect for small businesses getting started with AI',
    monthly: { price: 29900, priceId: process.env.STRIPE_PRICE_STARTER_MONTHLY },
    annual: { price: 299000, priceId: process.env.STRIPE_PRICE_STARTER_ANNUAL }
  },
  professional: {
    name: 'Professional Plan',
    description: 'For growing businesses ready to scale with AI',
    monthly: { price: 79900, priceId: process.env.STRIPE_PRICE_PRO_MONTHLY },
    annual: { price: 799000, priceId: process.env.STRIPE_PRICE_PRO_ANNUAL }
  },
  enterprise: {
    name: 'Enterprise Plan',
    description: 'Tailored solutions for large organizations',
    monthly: { price: 249900, priceId: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY },
    annual: { price: 2499000, priceId: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL }
  }
};

const ADDONS = {
  'extra-chatbot': {
    name: 'Additional Chatbot',
    price: 19900,
    priceId: process.env.STRIPE_PRICE_EXTRA_CHATBOT
  },
  'sales-agent-addon': {
    name: 'Sales Agent',
    price: 39900,
    priceId: process.env.STRIPE_PRICE_SALES_AGENT
  },
  'enrichment-credits': {
    name: 'Data Enrichment Credits',
    price: 9900,
    priceId: process.env.STRIPE_PRICE_ENRICHMENT_CREDITS
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tier, billing = 'monthly', addons = [], email, isGuest = false } = body;

    // Get user info if logged in
    let userId = null;
    let userEmail = email;
    let customerId = null;

    const authHeader = request.headers.get('authorization');
    if (authHeader && !isGuest) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        userId = decoded.userId;

        // Get user from database
        const user = await prisma.users.findUnique({
          where: { id: userId }
        });

        if (user) {
          userEmail = user.email;
          customerId = user.stripe_customer_id;
        }
      } catch (error) {
        console.error('Auth error:', error);
      }
    }

    // Create or retrieve Stripe customer
    if (!customerId && userEmail) {
      // Check if customer exists
      const customers = await stripe.customers.list({
        email: userEmail,
        limit: 1
      });

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        // Create new customer
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: {
            userId: userId || 'pending',
            tier: tier
          }
        });
        customerId = customer.id;
      }

      // Update user record if logged in
      if (userId) {
        await prisma.users.update({
          where: { id: userId },
          data: { stripe_customer_id: customerId }
        });
      }
    }

    // Build line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    // Add main tier subscription
    if (tier && PRODUCTS[tier as keyof typeof PRODUCTS]) {
      const product = PRODUCTS[tier as keyof typeof PRODUCTS];
      const priceData = billing === 'annual' ? product.annual : product.monthly;

      if (priceData.priceId) {
        // Use existing price ID from Stripe dashboard
        lineItems.push({
          price: priceData.priceId,
          quantity: 1
        });
      } else {
        // Create price on the fly (for development)
        lineItems.push({
          price_data: {
            currency: 'gbp',
            product_data: {
              name: product.name,
              description: product.description,
            },
            recurring: {
              interval: billing === 'annual' ? 'year' : 'month',
              interval_count: 1
            },
            unit_amount: priceData.price,
          },
          quantity: 1,
        });
      }
    }

    // Add any addon subscriptions
    for (const addonId of addons) {
      const addon = ADDONS[addonId as keyof typeof ADDONS];
      if (addon) {
        if (addon.priceId) {
          lineItems.push({
            price: addon.priceId,
            quantity: 1
          });
        } else {
          lineItems.push({
            price_data: {
              currency: 'gbp',
              product_data: {
                name: addon.name,
              },
              recurring: {
                interval: 'month',
                interval_count: 1
              },
              unit_amount: addon.price,
            },
            quantity: 1,
          });
        }
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'subscription',
      customer: customerId || undefined,
      customer_email: !customerId ? userEmail : undefined,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace`,
      metadata: {
        userId: userId || 'pending',
        tier: tier,
        billing: billing,
        addons: JSON.stringify(addons),
        isGuest: isGuest.toString()
      },
      subscription_data: {
        metadata: {
          userId: userId || 'pending',
          tier: tier,
          billing: billing
        }
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      phone_number_collection: {
        enabled: true
      }
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}