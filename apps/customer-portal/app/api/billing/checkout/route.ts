import { NextRequest, NextResponse } from 'next/server';
import { getTenantDb } from '@intelagent/database';
import stripeService from '@intelagent/billing';

// POST /api/billing/checkout - Create checkout session for new subscription
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
    const products = data.products || JSON.parse(licenseData.products || '[]');
    
    // Fetch product prices from database
    const productData = await db.$queryRaw`
      SELECT slug, base_price_pence, name
      FROM public.products 
      WHERE slug = ANY(${products}::text[])
        AND active = true
    `;

    for (const product of productData) {
      const productId = await stripeService.ensureProduct(
        product.name,
        `Intelagent ${product.name} subscription`
      );
      
      const priceId = await stripeService.createPrice({
        productId,
        amount: product.base_price_pence,
        interval: data.billing_cycle === 'annual' ? 'year' : 'month',
        currency: 'gbp'
      });
      priceIds.push(priceId);
    }

    // Add pro addon if requested
    if (data.include_pro) {
      const proProductId = await stripeService.ensureProduct(
        'Pro Addon',
        'Advanced features and priority support'
      );
      const proPriceId = await stripeService.createPrice({
        productId: proProductId,
        amount: 49900, // £499
        interval: data.billing_cycle === 'annual' ? 'year' : 'month',
        currency: 'gbp'
      });
      priceIds.push(proPriceId);
    }

    // Create checkout session
    const session = await stripeService.createCheckoutSession(
      customerId,
      priceIds,
      data.success_url || `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`,
      data.cancel_url || `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
      {
        license_key: licenseData.license_key,
        products: products.join(','),
        is_pro: data.include_pro ? 'true' : 'false'
      }
    );

    return NextResponse.json({ 
      checkout_url: session.url,
      session_id: session.id 
    });
  } catch (error) {
    console.error('Failed to create checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}