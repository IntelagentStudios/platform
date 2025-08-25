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
    
    // TODO: Get existing chatbot setup from audit_logs since product_setups doesn't exist
    const setupLog = await prisma.audit_logs.findFirst({
      where: {
        user_id: userId,
        action: 'chatbot_setup',
        resource_type: 'chatbot'
      },
      orderBy: { created_at: 'desc' }
    });
    
    if (!setupLog) {
      return NextResponse.json({
        setup_completed: false,
        message: 'No setup found'
      });
    }
    
    const setupData = setupLog.changes as any;
    return NextResponse.json({
      setup_completed: setupData?.setup_completed || false,
      domain: setupData?.domain,
      site_key: setupData?.site_key,
      setup_data: setupData?.setup_data || {},
      created_at: setupLog.created_at,
      updated_at: setupLog.created_at
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
    const existingDomain = await prisma.licenses.findFirst({
      where: {
        domain,
        license_key: { not: licenseKey }
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
    
    // TODO: Create or update product setup in audit_logs since product_setups doesn't exist
    await prisma.audit_logs.create({
      data: {
        license_key: licenseKey,
        user_id: userId,
        action: 'chatbot_setup',
        resource_type: 'chatbot',
        resource_id: siteKey,
        changes: {
          domain,
          site_key: siteKey,
          setup_data: setup_data || {},
          setup_started_at: new Date(),
          webhook_url: process.env.N8N_WEBHOOK_URL || null,
          api_endpoint: `${process.env.NEXT_PUBLIC_API_URL}/api/chatbot/${siteKey}`,
          is_active: true
        }
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
    
    // TODO: Update setup completion status in audit_logs since product_setups doesn't exist
    await prisma.audit_logs.create({
      data: {
        license_key: request.headers.get('x-license-key') || '',
        user_id: userId,
        action: 'chatbot_setup_completed',
        resource_type: 'chatbot',
        resource_id: userId,
        changes: {
          setup_completed,
          ...(setup_completed && { setup_completed_at: new Date() })
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      setup_completed,
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