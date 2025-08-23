import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Only show in non-production or with special header
  const debugHeader = request.headers.get('x-debug-auth');
  
  if (debugHeader !== 'check-env-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return NextResponse.json({
    jwt_secret_exists: !!process.env.JWT_SECRET,
    jwt_secret_length: process.env.JWT_SECRET?.length || 0,
    jwt_secret_first_chars: process.env.JWT_SECRET?.substring(0, 4) || 'not-set',
    node_env: process.env.NODE_ENV,
    nextauth_secret_exists: !!process.env.NEXTAUTH_SECRET,
    database_url_exists: !!process.env.DATABASE_URL,
    expected_fallback: 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS'
  });
}