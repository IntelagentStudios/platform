import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

export async function GET(request: NextRequest) {
  // Get product key from query params
  const { searchParams } = new URL(request.url);
  const productKey = searchParams.get('key');
  
  if (!productKey) {
    return NextResponse.json({ 
      error: 'Product key required' 
    }, { status: 400 });
  }

  try {
    // Get the product key info and associated license
    const productKeyInfo = await prisma.product_keys.findUnique({
      where: { product_key: productKey },
      select: {
        license_key: true,
        status: true,
        metadata: true
      }
    });

    if (!productKeyInfo || productKeyInfo.status !== 'active') {
      return NextResponse.json({ 
        error: 'Invalid or inactive product key' 
      }, { status: 404 });
    }

    // Get custom knowledge from custom_knowledge table
    const customKnowledge = await prisma.custom_knowledge.findFirst({
      where: { 
        license_key: productKeyInfo.license_key,
        is_active: true
      },
      select: {
        content: true
      }
    });

    // Get saved settings (if any) from metadata or a settings table
    const metadata = productKeyInfo.metadata as any;
    const settings = metadata?.settings || {};

    // Return simplified configuration for the widget with CORS headers
    return NextResponse.json({
      config: {
        // Single theme color (backwards compatible)
        themeColor: settings.themeColor || settings.primaryColor || '#0070f3',
        position: settings.position || 'bottom-right',
        welcomeMessage: settings.welcomeMessage || "Hello! How can I help you today?",
        responseStyle: settings.responseStyle || 'professional',
        showWelcomeMessage: settings.showWelcomeMessage !== false,
        playNotificationSound: settings.playNotificationSound !== false,
        collectEmail: settings.collectEmail || false,
        
        // Custom knowledge for AI context
        customKnowledge: customKnowledge ? {
          content: customKnowledge.content,
          instructions: 'Use the provided knowledge base content to answer user questions accurately.'
        } : null,
        
        // Product key for tracking
        productKey: productKey
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    console.error('Error fetching widget config:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch configuration',
      config: {
        themeColor: '#0070f3',
        position: 'bottom-right',
        welcomeMessage: 'Hello! How can I help you today?',
        responseStyle: 'professional'
      }
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
}

// Save settings endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productKey, settings } = body;

    if (!productKey || !settings) {
      return NextResponse.json({ 
        error: 'Product key and settings required' 
      }, { status: 400 });
    }

    // Update the product key metadata with settings
    const updated = await prisma.product_keys.update({
      where: { product_key: productKey },
      data: {
        metadata: {
          ...(await prisma.product_keys.findUnique({
            where: { product_key: productKey },
            select: { metadata: true }
          }))?.metadata as any || {},
          settings: settings,
          lastUpdated: new Date().toISOString()
        }
      }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Settings saved successfully'
    });
  } catch (error) {
    console.error('Error saving widget settings:', error);
    return NextResponse.json({ 
      error: 'Failed to save settings' 
    }, { status: 500 });
  }
}