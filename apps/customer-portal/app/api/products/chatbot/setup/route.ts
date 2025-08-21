import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@intelagent/database';
import crypto from 'crypto';

// Generate a unique site key
function generateSiteKey(domain: string, licenseKey: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(`${domain}-${licenseKey}-${Date.now()}`)
    .digest('hex');
  return `sk_${hash.substring(0, 32)}`;
}

// GET existing setup
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get existing chatbot setup
    const setup = await prisma.product_setups.findUnique({
      where: {
        user_id_product: {
          user_id: userId,
          product: 'chatbot'
        }
      }
    });
    
    if (!setup) {
      return NextResponse.json({
        setup_completed: false,
        message: 'No setup found'
      });
    }
    
    return NextResponse.json({
      setup_completed: setup.setup_completed,
      domain: setup.domain,
      site_key: setup.site_key,
      setup_data: setup.setup_data,
      created_at: setup.created_at,
      updated_at: setup.updated_at
    });
    
  } catch (error) {
    console.error('Get setup error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch setup' },
      { status: 500 }
    );
  }
}

// POST create or update setup
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const licenseKey = request.headers.get('x-license-key');
    
    if (!userId || !licenseKey) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { domain, setup_data } = body;
    
    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }
    
    // Check if domain is already used by another license
    const existingDomain = await prisma.product_setups.findFirst({
      where: {
        domain,
        user_id: { not: userId }
      }
    });
    
    if (existingDomain) {
      return NextResponse.json(
        { error: 'This domain is already registered to another account' },
        { status: 409 }
      );
    }
    
    // Generate site key
    const siteKey = generateSiteKey(domain, licenseKey);
    
    // Create or update product setup
    const setup = await prisma.product_setups.upsert({
      where: {
        user_id_product: {
          user_id: userId,
          product: 'chatbot'
        }
      },
      update: {
        domain,
        site_key: siteKey,
        setup_data: setup_data || {},
        setup_started_at: new Date(),
        webhook_url: process.env.N8N_WEBHOOK_URL || null,
        api_endpoint: `${process.env.NEXT_PUBLIC_API_URL}/api/chatbot/${siteKey}`,
        is_active: true
      },
      create: {
        user_id: userId,
        product: 'chatbot',
        domain,
        site_key: siteKey,
        setup_data: setup_data || {},
        setup_started_at: new Date(),
        webhook_url: process.env.N8N_WEBHOOK_URL || null,
        api_endpoint: `${process.env.NEXT_PUBLIC_API_URL}/api/chatbot/${siteKey}`,
        is_active: true
      }
    });
    
    // Also update the license with domain and site_key for backward compatibility
    await prisma.licenses.update({
      where: { license_key: licenseKey },
      data: {
        domain,
        site_key: siteKey,
        used_at: new Date()
      }
    });
    
    // Call N8N webhook to set up the agent (if configured)
    if (process.env.N8N_SETUP_WEBHOOK) {
      try {
        await fetch(process.env.N8N_SETUP_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            site_key: siteKey,
            domain,
            license_key: licenseKey,
            config: setup_data
          })
        });
      } catch (webhookError) {
        console.error('N8N webhook error:', webhookError);
        // Don't fail the setup if webhook fails
      }
    }
    
    return NextResponse.json({
      success: true,
      site_key: siteKey,
      domain,
      message: 'Chatbot setup created successfully'
    });
    
  } catch (error) {
    console.error('Create setup error:', error);
    return NextResponse.json(
      { error: 'Failed to create setup' },
      { status: 500 }
    );
  }
}

// PATCH update setup status
export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { setup_completed } = body;
    
    // Update setup completion status
    const setup = await prisma.product_setups.update({
      where: {
        user_id_product: {
          user_id: userId,
          product: 'chatbot'
        }
      },
      data: {
        setup_completed,
        ...(setup_completed && { setup_completed_at: new Date() })
      }
    });
    
    return NextResponse.json({
      success: true,
      setup_completed: setup.setup_completed,
      message: 'Setup status updated'
    });
    
  } catch (error) {
    console.error('Update setup error:', error);
    return NextResponse.json(
      { error: 'Failed to update setup' },
      { status: 500 }
    );
  }
}