import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS') as any;
    
    // Return hardcoded user data for now
    const userData = {
      id: decoded.userId,
      email: decoded.email,
      name: 'Harry',
      license_key: decoded.licenseKey,
      products: ['chatbot', 'sales_agent', 'data_enrichment', 'setup_agent'],
      plan: 'Pro Platform',
      subscription_status: 'active',
      next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    };
    
    return NextResponse.json(userData);
    
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Invalid session' },
      { status: 401 }
    );
  }
}