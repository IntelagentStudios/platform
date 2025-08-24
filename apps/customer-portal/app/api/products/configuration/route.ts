import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// This would normally fetch from database
// For now, we'll use localStorage/cookies to track configured products
export async function GET(request: NextRequest) {
  const authCookie = cookies().get('auth');
  
  if (!authCookie || authCookie.value !== 'authenticated-user-harry') {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  // TODO: Fetch from database using user's email/id
  // For now, return placeholder data
  const configurations = {
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

    // TODO: Save to database
    // For now, we'll just return success
    console.log('Saving configuration:', { product, configuration });

    return NextResponse.json({ 
      success: true, 
      message: 'Configuration saved successfully' 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to save configuration' 
    }, { status: 500 });
  }
}