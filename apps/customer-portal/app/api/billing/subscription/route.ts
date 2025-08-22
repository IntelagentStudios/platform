import { NextRequest, NextResponse } from 'next/server';
import { getTenantDb } from '@intelagent/database';
import stripeService from '@intelagent/billing';

// GET /api/billing/subscription - Get current subscription
export async function GET(request: NextRequest) {
  try {
    const db = await getTenantDb();
    
    // Get license info
    const license = await db.$queryRaw`
      SELECT 
        l.*,
        u.stripe_customer_id,
        u.stripe_subscription_id
      FROM public.licenses l
      LEFT JOIN public.users u ON u.license_key = l.license_key
      WHERE l.license_key = current_setting('app.current_license')
      LIMIT 1
    `;

    if (!license || license.length === 0) {
      return NextResponse.json(
        { error: 'License not found' },
        { status: 404 }
      );
    }

    const licenseData = license[0];
    
    // Get subscription from Stripe if exists
    let subscription = null;
    if (licenseData.stripe_subscription_id) {
      subscription = await stripeService.stripe.subscriptions.retrieve(
        licenseData.stripe_subscription_id
      );
    }

    return NextResponse.json({
      license: {
        ...licenseData,
        total: licenseData.total_pence / 100,
        formatted_total: `£${(licenseData.total_pence / 100).toFixed(2)}`
      },
      subscription
    });
  } catch (error) {
    console.error('Failed to get subscription:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription' },
      { status: 500 }
    );
  }
}

// POST /api/billing/subscription - Create new subscription
export async function POST(request: NextRequest) {
  try {
    const db = await getTenantDb();
    const data = await request.json();
    
    // Get license and user info
    const result = await db.$queryRaw`
      SELECT 
        l.*,
        u.email,
        u.name,
        u.stripe_customer_id
      FROM public.licenses l
      JOIN public.users u ON u.license_key = l.license_key
      WHERE l.license_key = current_setting('app.current_license')
        AND u.role = 'owner'
      LIMIT 1
    `;

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: 'License not found' },
        { status: 404 }
      );
    }

    const licenseData = result[0];
    
    // Create or get Stripe customer
    let customerId = licenseData.stripe_customer_id;
    if (!customerId) {
      const customer = await stripeService.createCustomer({
        email: licenseData.email,
        name: licenseData.name,
        licenseKey: licenseData.license_key
      });
      customerId = customer.id;
      
      // Update user with Stripe customer ID
      await db.$executeRaw`
        UPDATE public.users 
        SET stripe_customer_id = ${customerId}
        WHERE license_key = ${licenseData.license_key}
          AND role = 'owner'
      `;
    }

    // Create prices for selected products
    const priceIds: string[] = [];
    const products = JSON.parse(licenseData.products || '[]');
    
    for (const productSlug of products) {
      const productId = await stripeService.ensureProduct(
        productSlug,
        `Intelagent ${productSlug} subscription`
      );
      
      // Get price from our database
      const productData = await db.$queryRaw`
        SELECT base_price_pence 
        FROM public.products 
        WHERE slug = ${productSlug}
      `;
      
      if (productData && productData[0]) {
        const priceId = await stripeService.createPrice({
          productId,
          amount: productData[0].base_price_pence,
          interval: licenseData.billing_cycle === 'annual' ? 'year' : 'month',
          currency: 'gbp'
        });
        priceIds.push(priceId);
      }
    }

    // Add pro addon if applicable
    if (licenseData.is_pro) {
      const proProductId = await stripeService.ensureProduct(
        'Pro Addon',
        'Advanced features and priority support'
      );
      const proPriceId = await stripeService.createPrice({
        productId: proProductId,
        amount: 49900, // £499
        interval: licenseData.billing_cycle === 'annual' ? 'year' : 'month',
        currency: 'gbp'
      });
      priceIds.push(proPriceId);
    }

    // Create subscription
    const subscription = await stripeService.createSubscription({
      customerId,
      priceIds,
      licenseKey: licenseData.license_key,
      trialDays: data.trial_days,
      promoCode: data.promo_code
    });

    // Update license with subscription ID
    await db.$executeRaw`
      UPDATE public.licenses 
      SET stripe_subscription_id = ${subscription.id}
      WHERE license_key = ${licenseData.license_key}
    `;

    return NextResponse.json({
      subscription,
      client_secret: subscription.latest_invoice?.payment_intent?.client_secret
    });
  } catch (error) {
    console.error('Failed to create subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

// PUT /api/billing/subscription - Update subscription
export async function PUT(request: NextRequest) {
  try {
    const db = await getTenantDb();
    const data = await request.json();
    
    if (!data.action) {
      return NextResponse.json(
        { error: 'Action required' },
        { status: 400 }
      );
    }

    // Get current subscription
    const result = await db.$queryRaw`
      SELECT stripe_subscription_id 
      FROM public.licenses 
      WHERE license_key = current_setting('app.current_license')
    `;

    if (!result || result.length === 0 || !result[0].stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription' },
        { status: 404 }
      );
    }

    const subscriptionId = result[0].stripe_subscription_id;
    let subscription;

    switch (data.action) {
      case 'cancel':
        subscription = await stripeService.cancelSubscription(
          subscriptionId,
          data.immediately || false
        );
        
        // Update license status
        await db.$executeRaw`
          UPDATE public.licenses 
          SET status = 'cancelled',
              cancelled_at = NOW()
          WHERE license_key = current_setting('app.current_license')
        `;
        break;
        
      case 'resume':
        subscription = await stripeService.stripe.subscriptions.update(
          subscriptionId,
          { cancel_at_period_end: false }
        );
        
        // Update license status
        await db.$executeRaw`
          UPDATE public.licenses 
          SET status = 'active',
              cancelled_at = NULL
          WHERE license_key = current_setting('app.current_license')
        `;
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Failed to update subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}