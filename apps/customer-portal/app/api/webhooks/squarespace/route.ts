import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@intelagent/database';
import { sendPurchaseConfirmation } from '@intelagent/notifications';
import crypto from 'crypto';

// Generate a unique license key
function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = [];
  
  for (let i = 0; i < 4; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  
  return segments.join('-');
}

// Map Squarespace product IDs to our product IDs
function mapSquarespaceProducts(items: any[]): string[] {
  const productMap: Record<string, string | string[]> = {
    // Map Squarespace product IDs/SKUs to our internal product IDs
    'chatbot-basic': 'chatbot',
    'chatbot-pro': 'chatbot',
    'sales-agent-basic': 'sales-agent',
    'sales-agent-pro': 'sales-agent',
    'enrichment-basic': 'enrichment',
    'enrichment-pro': 'enrichment',
    'setup-agent': 'setup-agent',
    'bundle-starter': ['chatbot', 'sales-agent'],
    'bundle-professional': ['chatbot', 'sales-agent', 'enrichment'],
    'bundle-enterprise': ['chatbot', 'sales-agent', 'enrichment', 'setup-agent']
  };

  const products = new Set<string>();
  
  for (const item of items) {
    const sku = item.variantOptions?.[0]?.value || item.sku || item.productId;
    const mapped = productMap[sku.toLowerCase()];
    
    if (mapped) {
      if (Array.isArray(mapped)) {
        mapped.forEach(p => products.add(p));
      } else {
        products.add(mapped);
      }
    }
  }
  
  return Array.from(products);
}

// Determine plan tier based on products and variants
function determinePlan(items: any[]): string {
  // Check for explicit plan indicators
  for (const item of items) {
    const name = item.productName?.toLowerCase() || '';
    const variant = item.variantOptions?.[0]?.value?.toLowerCase() || '';
    
    if (name.includes('enterprise') || variant.includes('enterprise')) {
      return 'enterprise';
    }
    if (name.includes('professional') || variant.includes('professional') || name.includes('pro')) {
      return 'professional';
    }
    if (name.includes('starter') || variant.includes('starter')) {
      return 'starter';
    }
  }
  
  // Default based on number of products
  const productCount = mapSquarespaceProducts(items).length;
  if (productCount >= 3) return 'professional';
  if (productCount >= 2) return 'starter';
  return 'starter';
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature if configured
    const signature = request.headers.get('x-squarespace-signature');
    const secret = process.env.SQUARESPACE_WEBHOOK_SECRET;
    
    if (secret && signature) {
      const body = await request.text();
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('base64');
      
      if (signature !== expectedSignature) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
      
      // Parse body after verification
      const data = JSON.parse(body);
      return processOrder(data);
    }
    
    // If no secret configured, process directly (dev mode)
    const data = await request.json();
    return processOrder(data);
    
  } catch (error) {
    console.error('Squarespace webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function processOrder(data: any) {
  try {
    // Extract order information
    const {
      orderId,
      customerEmail,
      billingAddress,
      lineItems = [],
      grandTotal,
      createdOn,
      fulfillmentStatus
    } = data;

    // Only process completed orders
    if (fulfillmentStatus === 'PENDING' || fulfillmentStatus === 'CANCELED') {
      return NextResponse.json({ 
        message: 'Order not yet fulfilled or was canceled',
        status: 'skipped' 
      });
    }

    const customerName = billingAddress?.firstName && billingAddress?.lastName 
      ? `${billingAddress.firstName} ${billingAddress.lastName}`
      : billingAddress?.firstName || customerEmail.split('@')[0];

    // Check if this order was already processed
    const existingLicense = await prisma.licenses.findFirst({
      where: { 
        email: customerEmail.toLowerCase(),
        metadata: {
          path: '$.squarespace_order_id',
          equals: orderId
        }
      }
    });

    if (existingLicense) {
      return NextResponse.json({ 
        message: 'Order already processed',
        licenseKey: existingLicense.license_key,
        status: 'duplicate' 
      });
    }

    // Check if customer already has a license
    let license = await prisma.licenses.findFirst({
      where: { 
        email: customerEmail.toLowerCase(),
        status: { in: ['active', 'pending'] }
      }
    });

    const products = mapSquarespaceProducts(lineItems);
    const plan = determinePlan(lineItems);

    if (license) {
      // Add products to existing license
      const currentProducts = license.products || [];
      const newProducts = [...new Set([...currentProducts, ...products])];
      
      license = await prisma.licenses.update({
        where: { license_key: license.license_key },
        data: {
          products: newProducts,
          plan: plan === 'enterprise' || license.plan === 'enterprise' ? 'enterprise' :
                plan === 'professional' || license.plan === 'professional' ? 'professional' :
                plan,
          metadata: {
            ...(license.metadata as any || {}),
            squarespace_orders: [
              ...((license.metadata as any)?.squarespace_orders || []),
              {
                order_id: orderId,
                amount: grandTotal?.value || 0,
                currency: grandTotal?.currency || 'USD',
                date: createdOn
              }
            ]
          },
          updated_at: new Date()
        }
      });

      console.log(`Updated existing license ${license.license_key} with new products`);

    } else {
      // Create new license
      const licenseKey = generateLicenseKey();
      
      license = await prisma.licenses.create({
        data: {
          license_key: licenseKey,
          email: customerEmail.toLowerCase(),
          customer_name: customerName,
          products,
          plan,
          status: 'pending', // Will become active after registration
          metadata: {
            squarespace_order_id: orderId,
            squarespace_orders: [{
              order_id: orderId,
              amount: grandTotal?.value || 0,
              currency: grandTotal?.currency || 'USD',
              date: createdOn
            }]
          },
          created_at: new Date()
        }
      });

      console.log(`Created new license ${licenseKey} for ${customerEmail}`);
    }

    // Send purchase confirmation email with license key and signup instructions
    try {
      await sendPurchaseConfirmation(
        customerEmail,
        license.license_key,
        products,
        plan
      );
      console.log(`Sent purchase confirmation email to ${customerEmail}`);
    } catch (emailError) {
      console.error('Failed to send purchase confirmation email:', emailError);
      // Don't fail the webhook if email fails - customer can still use license
    }

    // Trigger n8n workflow for additional processing if configured
    if (process.env.N8N_WEBHOOK_URL) {
      try {
        await fetch(`${process.env.N8N_WEBHOOK_URL}/squarespace-purchase`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            licenseKey: license.license_key,
            email: customerEmail,
            customerName,
            products,
            plan,
            orderId,
            amount: grandTotal?.value || 0
          })
        });
      } catch (n8nError) {
        console.error('Failed to trigger n8n workflow:', n8nError);
        // Non-critical, don't fail the webhook
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order processed successfully',
      licenseKey: license.license_key,
      products,
      plan,
      status: existingLicense ? 'updated' : 'created'
    });

  } catch (error) {
    console.error('Order processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process order' },
      { status: 500 }
    );
  }
}

// GET endpoint for testing/verification
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  }

  return NextResponse.json({
    status: 'ok',
    message: 'Squarespace webhook endpoint is ready',
    expectedPayload: {
      orderId: 'string',
      customerEmail: 'string',
      billingAddress: {
        firstName: 'string',
        lastName: 'string'
      },
      lineItems: [{
        productName: 'string',
        sku: 'string',
        variantOptions: [{ value: 'string' }]
      }],
      grandTotal: {
        value: 'number',
        currency: 'string'
      },
      createdOn: 'string',
      fulfillmentStatus: 'string'
    }
  });
}