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
    
    // Fetch user data with related information
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        license: {
          select: {
            license_key: true,
            products: true,
            plan: true,
            status: true,
            subscription_status: true,
            next_billing_date: true,
            customer_name: true,
            email: true
          }
        },
        product_setups: {
          select: {
            id: true,
            product: true,
            setup_completed: true,
            domain: true,
            site_key: true,
            setup_data: true,
            created_at: true,
            updated_at: true
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Prepare response data
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      license_key: user.license_key,
      products: user.license?.products || [],
      plan: user.license?.plan || 'starter',
      status: user.license?.status,
      subscription_status: user.license?.subscription_status,
      next_billing_date: user.license?.next_billing_date,
      onboarding_completed: user.onboarding_completed,
      created_at: user.created_at,
      product_setups: user.product_setups
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
    const { name, avatar_url, preferences, onboarding_completed } = body;
    
    // Update user profile
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(avatar_url !== undefined && { avatar_url }),
        ...(preferences !== undefined && { preferences }),
        ...(onboarding_completed !== undefined && { onboarding_completed })
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar_url: true,
        onboarding_completed: true,
        preferences: true
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