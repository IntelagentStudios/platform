import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// This would normally fetch from database
// For now, we'll use localStorage/cookies to track configured products
export async function GET(request: NextRequest) {
  const authCookie = cookies().get('auth');
  
  if (!authCookie || authCookie.value !== 'authenticated-user-harry') {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  // Get stored configuration from cookie (temporary solution)
  const configCookie = cookies().get('product_configs');
  let configurations = {
    chatbot: {
      configured: false,
      site_key: null,
      domain: null,
      created_at: null,
      embed_code: null
    },
    sales_agent: {
      configured: false
    },
    data_enrichment: {
      configured: false
    },
    setup_agent: {
      configured: false
    }
  };

  if (configCookie) {
    try {
      const stored = JSON.parse(configCookie.value);
      configurations = { ...configurations, ...stored };
    } catch (e) {
      console.error('Failed to parse stored configurations');
    }
  }

  return NextResponse.json(configurations);
}

export async function POST(request: NextRequest) {
  const authCookie = cookies().get('auth');
  
  if (!authCookie || authCookie.value !== 'authenticated-user-harry') {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { product, configuration } = body;

    // Get existing configurations
    const configCookie = cookies().get('product_configs');
    let existingConfigs = {};
    
    if (configCookie) {
      try {
        existingConfigs = JSON.parse(configCookie.value);
      } catch (e) {
        console.error('Failed to parse existing configurations');
      }
    }

    // Update with new configuration
    existingConfigs[product] = configuration;

    // Store in cookie (temporary solution - should use database)
    const response = NextResponse.json({ 
      success: true, 
      message: 'Configuration saved successfully' 
    });
    
    response.cookies.set('product_configs', JSON.stringify(existingConfigs), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to save configuration' 
    }, { status: 500 });
  }
}