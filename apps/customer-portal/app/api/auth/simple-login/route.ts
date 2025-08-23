import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const VALID_USER = {
  email: 'harry@intelagentstudios.com',
  password: 'Birksgrange226!',
  id: '1a66bf30-01cc-4f6b-ae50-e8d063a7443e',
  licenseKey: 'INTL-AGNT-BOSS-MODE'
};

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Check credentials
    if (email !== VALID_USER.email || password !== VALID_USER.password) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Create token
    const token = jwt.sign(
      {
        userId: VALID_USER.id,
        email: VALID_USER.email,
        licenseKey: VALID_USER.licenseKey
      },
      'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS',
      { expiresIn: '7d' }
    );
    
    // Create response
    const response = NextResponse.json({
      success: true,
      token: token,
      user: {
        email: VALID_USER.email,
        licenseKey: VALID_USER.licenseKey
      }
    });
    
    // Set simple cookie
    response.cookies.set('auth', token, {
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });
    
    return response;
    
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth')?.value;
    
    if (!token) {
      return NextResponse.json({ authenticated: false });
    }
    
    try {
      const decoded = jwt.verify(token, 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS') as any;
      return NextResponse.json({
        authenticated: true,
        user: decoded
      });
    } catch {
      return NextResponse.json({ authenticated: false });
    }
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}