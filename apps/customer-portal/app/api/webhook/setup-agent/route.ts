import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@intelagent/database';

// This endpoint is called by N8N to set up the agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { site_key, domain, license_key, config } = body;
    
    // Verify the site key exists
    const setup = await prisma.product_setups.findFirst({
      where: { site_key }
    });
    
    if (!setup) {
      return NextResponse.json(
        { error: 'Invalid site key' },
        { status: 404 }
      );
    }
    
    // Log the setup request (you can expand this to store agent configuration)
    console.log('N8N Agent Setup Request:', {
      site_key,
      domain,
      config
    });
    
    // Here you would typically:
    // 1. Configure the N8N workflow for this specific customer
    // 2. Set up any necessary webhooks
    // 3. Initialize the chatbot's knowledge base
    // 4. Configure integrations
    
    // For now, we'll just mark it as configured
    await prisma.product_setups.update({
      where: {
        user_id_product: {
          user_id: setup.user_id,
          product: 'chatbot'
        }
      },
      data: {
        setup_data: {
          ...(setup.setup_data as any || {}),
          n8n_configured: true,
          n8n_configured_at: new Date().toISOString(),
          ...config
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Agent configured successfully',
      site_key
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