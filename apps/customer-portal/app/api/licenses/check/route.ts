import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Check for simple auth first
  const simpleAuth = request.cookies.get('auth');
  
  if (simpleAuth && simpleAuth.value === 'authenticated-user-harry') {
    // Return mock license data for simple auth
    return NextResponse.json({
      success: true,
      tier: 'pro',
      license: {
        key: 'INTL-MSTR-ADMN-PASS',
        status: 'active',
        plan: 'pro',
        is_pro: true,
        products: ['chatbot', 'sales-agent', 'data-enrichment', 'setup-agent'],
        site_key: null
      }
    });
  }

  // Check for JWT token
  const authToken = request.cookies.get('auth_token');
  
  if (!authToken) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  // For JWT auth, would normally validate and fetch from database
  // For now, return default data
  return NextResponse.json({
    success: true,
    tier: 'starter',
    license: {
      key: 'DEFAULT-KEY',
      status: 'active',
      plan: 'starter',
      is_pro: false,
      products: ['chatbot'],
      site_key: null
    }
  });
}