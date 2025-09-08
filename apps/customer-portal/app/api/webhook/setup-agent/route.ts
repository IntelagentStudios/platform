import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@intelagent/database';

// This endpoint is called by N8N to set up the agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { site_key, product_key, domain, license_key, config } = body;
    
    // Support both product_key (new) and site_key (legacy)
    const key = product_key || site_key;
    
    if (!key) {
      return NextResponse.json(
        { error: 'Missing product_key or site_key' },
        { status: 400 }
      );
    }
    
    // Try to find by product_key first
    let license = null;
    if (key) {
      const productKeyRecord = await prisma.product_keys.findUnique({
        where: { product_key: key }
      });
      
      if (productKeyRecord?.license_key) {
        license = await prisma.licenses.findUnique({
          where: { license_key: productKeyRecord.license_key }
        });
      }
    }
    
    if (!license) {
      return NextResponse.json(
        { error: 'Invalid product key' },
        { status: 404 }
      );
    }
    
    // Log the setup request (you can expand this to store agent configuration)
    console.log('N8N Agent Setup Request:', {
      product_key: key,
      domain,
      config
    });
    
    // Here you would typically:
    // 1. Configure the N8N workflow for this specific customer
    // 2. Set up any necessary webhooks
    // 3. Initialize the chatbot's knowledge base
    // 4. Configure integrations
    
    // TODO: For now, we'll log the configuration in audit_logs since product_setups doesn't exist
    await prisma.audit_logs.create({
      data: {
        license_key: license.license_key,
        user_id: license.license_key,
        action: 'n8n_agent_configured',
        resource_type: 'setup_agent',
        resource_id: key,
        changes: {
          n8n_configured: true,
          n8n_configured_at: new Date().toISOString(),
          ...config
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Agent configured successfully',
      product_key: key
    });
    
  } catch (error) {
    console.error('Setup agent webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to configure agent' },
      { status: 500 }
    );
  }
}

// GET endpoint for N8N to verify the webhook is working
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'N8N setup webhook is active',
    timestamp: new Date().toISOString()
  });
}