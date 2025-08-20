import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

// Product mapping from Squarespace SKUs to our product IDs
const PRODUCT_MAPPING: Record<string, { product_id: string; tier: string }> = {
  'CHATBOT-STARTER': { product_id: 'chatbot', tier: 'basic' },
  'CHATBOT-PRO': { product_id: 'chatbot', tier: 'pro' },
  'SALES-STARTER': { product_id: 'sales_agent', tier: 'basic' },
  'SALES-PRO': { product_id: 'sales_agent', tier: 'pro' },
  'SETUP-AGENT': { product_id: 'setup_agent', tier: 'basic' },
  'AI-INSIGHTS': { product_id: 'ai_insights', tier: 'pro' },
  'ENRICHMENT': { product_id: 'enrichment', tier: 'basic' },
  'BUNDLE-GROWTH': { product_id: 'bundle', tier: 'pro' },
  'BUNDLE-ENTERPRISE': { product_id: 'bundle', tier: 'enterprise' }
};

// Verify Squarespace webhook signature
function verifySquarespaceSignature(payload: string, signature: string): boolean {
  const secret = process.env.SQUARESPACE_WEBHOOK_SECRET;
  if (!secret) return false;
  
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const calculatedSignature = hmac.digest('base64');
  
  return signature === calculatedSignature;
}

// Generate license key
function generateLicenseKey(): string {
  const segments = [];
  for (let i = 0; i < 4; i++) {
    const segment = crypto.randomBytes(2).toString('hex').toUpperCase();
    segments.push(segment);
  }
  return segments.join('-');
}

// POST /api/webhooks/squarespace - Handle Squarespace order webhooks
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-square-signature');
    
    // Verify webhook signature
    if (signature && !verifySquarespaceSignature(body, signature)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    const data = JSON.parse(body);
    console.log('Squarespace webhook received:', data.eventType);
    
    // Handle different event types
    switch (data.eventType) {
      case 'order.create':
      case 'order.complete':
        return handleOrderComplete(data);
      
      case 'subscription.create':
        return handleSubscriptionCreate(data);
      
      case 'subscription.update':
        return handleSubscriptionUpdate(data);
      
      case 'subscription.cancel':
        return handleSubscriptionCancel(data);
      
      default:
        console.log(`Unhandled event type: ${data.eventType}`);
        return NextResponse.json({ received: true });
    }
    
  } catch (error: any) {
    console.error('Squarespace webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    );
  }
}

// Handle order completion
async function handleOrderComplete(data: any) {
  const order = data.data;
  
  // Extract customer information
  const customerEmail = order.customerEmail;
  const customerName = order.billingAddress?.firstName 
    ? `${order.billingAddress.firstName} ${order.billingAddress.lastName}`
    : order.customerEmail.split('@')[0];
  
  // Process each line item
  const products = [];
  let planTier = 'starter';
  
  for (const item of order.lineItems) {
    const sku = item.variantOptions?.[0]?.value || item.sku;
    const productInfo = PRODUCT_MAPPING[sku];
    
    if (productInfo) {
      if (productInfo.product_id === 'bundle') {
        // Handle bundles
        if (productInfo.tier === 'enterprise') {
          products.push(
            { product_id: 'chatbot', tier: 'enterprise' },
            { product_id: 'sales_agent', tier: 'enterprise' },
            { product_id: 'setup_agent', tier: 'enterprise' },
            { product_id: 'ai_insights', tier: 'enterprise' },
            { product_id: 'enrichment', tier: 'enterprise' }
          );
          planTier = 'enterprise';
        } else {
          products.push(
            { product_id: 'chatbot', tier: 'pro' },
            { product_id: 'sales_agent', tier: 'pro' },
            { product_id: 'setup_agent', tier: 'pro' }
          );
          planTier = 'professional';
        }
      } else {
        products.push(productInfo);
        if (productInfo.tier === 'pro' && planTier === 'starter') {
          planTier = 'professional';
        }
      }
    }
  }
  
  if (products.length === 0) {
    console.log('No recognized products in order');
    return NextResponse.json({ received: true });
  }
  
  // Generate license key
  const licenseKey = generateLicenseKey();
  
  // Create license in database
  const license = await prisma.licenses.create({
    data: {
      license_key: licenseKey,
      email: customerEmail,
      customer_name: customerName,
      plan: planTier,
      products: products.map(p => p.product_id),
      status: 'active',
      created_at: new Date(),
      subscription_id: order.subscriptionId || null
    }
  });
  
  // Send welcome email with license key
  await sendWelcomeEmail({
    email: customerEmail,
    name: customerName,
    licenseKey,
    products,
    orderNumber: order.orderNumber,
    setupUrl: `${process.env.NEXT_PUBLIC_APP_URL}/setup?key=${licenseKey}`
  });
  
  // Trigger n8n onboarding workflow
  await triggerOnboardingWorkflow({
    licenseKey,
    customerEmail,
    customerName,
    products,
    orderId: order.id
  });
  
  return NextResponse.json({
    success: true,
    licenseKey,
    message: 'License created successfully'
  });
}

// Handle subscription creation
async function handleSubscriptionCreate(data: any) {
  const subscription = data.data;
  
  // Check if license already exists for this subscription
  const existingLicense = await prisma.licenses.findFirst({
    where: { subscription_id: subscription.id }
  });
  
  if (existingLicense) {
    console.log('License already exists for subscription:', subscription.id);
    return NextResponse.json({ received: true });
  }
  
  // Create new license for subscription
  return handleOrderComplete({
    ...data,
    data: {
      ...subscription,
      customerEmail: subscription.email,
      subscriptionId: subscription.id
    }
  });
}

// Handle subscription update
async function handleSubscriptionUpdate(data: any) {
  const subscription = data.data;
  
  // Find license by subscription ID
  const license = await prisma.licenses.findFirst({
    where: { subscription_id: subscription.id }
  });
  
  if (!license) {
    console.log('No license found for subscription:', subscription.id);
    return NextResponse.json({ received: true });
  }
  
  // Update license based on subscription status
  const updates: any = {
    subscription_status: subscription.status
  };
  
  if (subscription.status === 'CANCELED' || subscription.status === 'EXPIRED') {
    updates.status = 'suspended';
  } else if (subscription.status === 'ACTIVE') {
    updates.status = 'active';
  }
  
  await prisma.licenses.update({
    where: { license_key: license.license_key },
    data: updates
  });
  
  return NextResponse.json({
    success: true,
    message: 'License updated'
  });
}

// Handle subscription cancellation
async function handleSubscriptionCancel(data: any) {
  const subscription = data.data;
  
  // Find and suspend license
  const license = await prisma.licenses.findFirst({
    where: { subscription_id: subscription.id }
  });
  
  if (!license) {
    console.log('No license found for subscription:', subscription.id);
    return NextResponse.json({ received: true });
  }
  
  await prisma.licenses.update({
    where: { license_key: license.license_key },
    data: {
      status: 'suspended',
      subscription_status: 'canceled'
    }
  });
  
  // Send cancellation email
  await sendCancellationEmail({
    email: license.email,
    name: license.customer_name,
    licenseKey: license.license_key
  });
  
  return NextResponse.json({
    success: true,
    message: 'License suspended'
  });
}

// Helper functions
async function sendWelcomeEmail(data: any) {
  // Implement email sending via your email service
  console.log('Sending welcome email:', data);
  
  // Example using SendGrid/Resend/etc
  try {
    const response = await fetch(`${process.env.EMAIL_SERVICE_URL}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EMAIL_SERVICE_API_KEY}`
      },
      body: JSON.stringify({
        to: data.email,
        subject: 'Welcome to Intelagent Platform - Your License Key',
        template: 'license-welcome',
        data: {
          name: data.name,
          licenseKey: data.licenseKey,
          products: data.products,
          setupUrl: data.setupUrl,
          orderNumber: data.orderNumber
        }
      })
    });
    
    if (!response.ok) {
      console.error('Email sending failed:', await response.text());
    }
  } catch (error) {
    console.error('Email service error:', error);
  }
}

async function sendCancellationEmail(data: any) {
  console.log('Sending cancellation email:', data);
  // Implement cancellation email
}

async function triggerOnboardingWorkflow(data: any) {
  // Trigger n8n workflow for onboarding
  try {
    const response = await fetch(`${process.env.N8N_WEBHOOK_URL}/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      console.error('n8n workflow trigger failed:', await response.text());
    }
  } catch (error) {
    console.error('n8n webhook error:', error);
  }
}