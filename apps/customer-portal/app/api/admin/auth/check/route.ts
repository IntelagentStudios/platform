import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';


export const dynamic = 'force-dynamic';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const adminToken = cookieStore.get('admin_token');
    const userRole = cookieStore.get('user_role');

    if (!adminToken || userRole?.value !== 'admin') {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 401 }
      );
    }

    try {
      const decoded = jwt.verify(adminToken.value, JWT_SECRET) as any;
      
      if (!decoded.isAdmin) {
        return NextResponse.json(
          { error: 'Not an admin' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        authorized: true,
        email: decoded.email,
        role: decoded.role
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}