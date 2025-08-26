import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/auth-validator';
import { licenseCache } from '@/lib/license-cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Use the centralized auth validator for consistency and performance
    const authResult = await validateAuth(request);
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { authenticated: false, error: authResult.error || 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const { user, license } = authResult;
    
    // Get additional cached data if available
    let cachedStats = null;
    if (user?.licenseKey) {
      // Try to get cached dashboard stats for faster response
      cachedStats = await licenseCache.get(
        user.licenseKey,
        'api',
        'user_stats'
      );
    }
    
    // Build the response with all required fields
    const userData = {
      authenticated: true,
      user: {
        id: user!.userId,
        email: user!.email,
        name: user!.name || user!.email.split('@')[0],
        license_key: user!.licenseKey,
        license_type: license?.is_pro ? 'pro_platform' : 'platform',
        site_key: license?.site_key || null,
        role: user!.role || 'customer',
        products: license?.products || ['chatbot'],
        plan: license?.is_pro ? 'pro' : 'starter',
        subscription_status: license?.status || 'active',
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        // Include cached stats if available
        ...(cachedStats && { stats: cachedStats })
      },
      license: {
        key: license?.key,
        products: license?.products || [],
        is_pro: license?.is_pro || false,
        site_key: license?.site_key,
        status: license?.status || 'active'
      }
    };
    
    // Cache the user data for subsequent requests (5 minute TTL)
    if (user?.licenseKey) {
      await licenseCache.set(
        user.licenseKey,
        'api',
        'user_data',
        userData,
        300
      );
    }
    
    return NextResponse.json(userData);
    
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Invalid session' },
      { status: 401 }
    );
  }
}