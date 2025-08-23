import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // Check for session cookie
    const token = request.cookies.get('session')?.value || 
                  request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({
        authenticated: false,
        message: 'No session token found'
      });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS'
      ) as any;
      
      return NextResponse.json({
        authenticated: true,
        user: {
          userId: decoded.userId,
          email: decoded.email,
          licenseKey: decoded.licenseKey
        },
        message: 'Session valid'
      });
      
    } catch (error) {
      return NextResponse.json({
        authenticated: false,
        message: 'Invalid or expired token'
      });
    }
    
  } catch (error: any) {
    return NextResponse.json({
      authenticated: false,
      message: error.message || 'Verification failed'
    });
  }
}