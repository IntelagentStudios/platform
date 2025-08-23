import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

// Hardcoded user for testing
const TEST_USER = {
  id: '1a66bf30-01cc-4f6b-ae50-e8d063a7443e',
  email: 'harry@intelagentstudios.com',
  password_hash: '$2b$12$2ukCbMdeoeptdXCwKsaVeuVskSkPFeOZvknT6qyPWI8ueAwHzCWRO', // Birksgrange226!
  license_key: 'INTL-AGNT-BOSS-MODE',
  name: 'Harry'
};

const JWT_SECRET = process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    // Get host and protocol for all redirects
    const host = request.headers.get('host') || 'dashboard.intelagentstudios.com';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    
    // Validate credentials
    if (!email || !password) {
      return NextResponse.redirect(`${protocol}://${host}/login?error=missing`);
    }
    
    if (email.toLowerCase() !== TEST_USER.email.toLowerCase()) {
      return NextResponse.redirect(`${protocol}://${host}/login?error=invalid`);
    }
    
    const passwordValid = await bcrypt.compare(password, TEST_USER.password_hash);
    if (!passwordValid) {
      return NextResponse.redirect(`${protocol}://${host}/login?error=invalid`);
    }
    
    // Create JWT token
    const token = jwt.sign(
      { 
        userId: TEST_USER.id,
        email: TEST_USER.email,
        licenseKey: TEST_USER.license_key
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Create redirect response with correct URL
    const redirectUrl = `${protocol}://${host}/dashboard`;
    const response = NextResponse.redirect(redirectUrl);
    
    // Set cookie directly on redirect response
    response.cookies.set({
      name: 'session',
      value: token,
      httpOnly: true,
      secure: !host.includes('localhost'),
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });
    
    return response;
    
  } catch (error: any) {
    // Get host from headers for error redirect
    const errorHost = request.headers.get('host') || 'dashboard.intelagentstudios.com';
    const errorProtocol = errorHost.includes('localhost') ? 'http' : 'https';
    return NextResponse.redirect(`${errorProtocol}://${errorHost}/login?error=failed`);
  }
}