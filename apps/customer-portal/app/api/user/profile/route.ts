import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@intelagent/database';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from middleware headers
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Fetch user data
    const user = await prisma.users.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Fetch license data separately
    let license = null;
    if (user.license_key) {
      license = await prisma.licenses.findUnique({
        where: { license_key: user.license_key }
      });
    }
    
    // Prepare response data
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      license_key: user.license_key,
      products: license?.products || [],
      plan: license?.plan || 'starter',
      status: license?.status,
      subscription_status: license?.subscription_status,
      next_billing_date: license?.next_billing_date,
      created_at: user.created_at,
      product_setups: [] // product_setups table doesn't exist
    };
    
    return NextResponse.json(userData);
    
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { name } = body;
    
    // Update user profile (only name field exists)
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name })
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });
    
    return NextResponse.json({
      success: true,
      user: updatedUser
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}