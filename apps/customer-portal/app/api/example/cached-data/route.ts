import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { licenseCache } from '@/packages/redis/license-cache';

const JWT_SECRET = process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS';

/**
 * Example API route demonstrating Redis caching with license key isolation
 * 
 * This ensures cached data is properly scoped to each account (license_key)
 */
export async function GET(request: NextRequest) {
  try {
    // Get auth token and extract license key
    const authToken = cookies().get('auth_token');
    
    if (!authToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = jwt.verify(authToken.value, JWT_SECRET) as any;
    const licenseKey = decoded.licenseKey;
    
    if (!licenseKey) {
      return NextResponse.json({ error: 'No license key found' }, { status: 403 });
    }

    // Check rate limit for this license
    const rateLimit = await licenseCache.checkRateLimit(
      licenseKey,
      'api_calls',
      100, // 100 requests
      60   // per minute
    );

    if (!rateLimit.allowed) {
      return NextResponse.json({
        error: 'Rate limit exceeded',
        remaining: rateLimit.remaining,
        resetAt: new Date(rateLimit.resetAt).toISOString()
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetAt.toString()
        }
      });
    }

    // Try to get cached data first
    const cacheKey = 'dashboard_stats';
    let stats = await licenseCache.get(licenseKey, 'api', cacheKey);

    if (stats) {
      console.log(`Cache hit for license ${licenseKey}`);
      return NextResponse.json({
        ...stats,
        _cache: {
          hit: true,
          key: `license:${licenseKey}:api:${cacheKey}`,
          ttl: 300
        }
      });
    }

    console.log(`Cache miss for license ${licenseKey}, fetching from database...`);

    // Fetch from database if not cached
    const license = await prisma.licenses.findUnique({
      where: { license_key: licenseKey },
      select: {
        license_key: true,
        products: true,
        is_pro: true,
        site_key: true,
        domain: true
      }
    });

    if (!license) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 });
    }

    // Get chatbot stats if they have the product
    let chatbotStats = null;
    if (license.products.includes('chatbot') && license.site_key) {
      // Try cached chatbot stats first
      chatbotStats = await licenseCache.getProductData(
        licenseKey,
        'chatbot',
        `stats:${license.site_key}`
      );

      if (!chatbotStats) {
        // Fetch from database
        const conversationCount = await prisma.chatbot_logs.count({
          where: { site_key: license.site_key }
        });

        const uniqueSessions = await prisma.chatbot_logs.groupBy({
          by: ['session_id'],
          where: { site_key: license.site_key },
          _count: true
        });

        chatbotStats = {
          conversations: conversationCount,
          uniqueSessions: uniqueSessions.length,
          lastUpdated: new Date().toISOString()
        };

        // Cache for 10 minutes
        await licenseCache.cacheProductData(
          licenseKey,
          'chatbot',
          `stats:${license.site_key}`,
          chatbotStats,
          600
        );
      }
    }

    // Build response
    stats = {
      license: {
        key: license.license_key,
        products: license.products,
        is_pro: license.is_pro,
        domain: license.domain
      },
      products: {
        chatbot: chatbotStats || { message: 'Not configured or no data' },
        sales_agent: { message: 'Coming soon' },
        data_enrichment: { message: 'Coming soon' },
        setup_agent: { message: 'Coming soon' }
      },
      usage: {
        api_calls_today: await licenseCache.getCounter(licenseKey, 'api_calls_today'),
        api_calls_month: await licenseCache.getCounter(licenseKey, 'api_calls_month')
      },
      timestamp: new Date().toISOString()
    };

    // Cache the response for 5 minutes
    await licenseCache.set(licenseKey, 'api', cacheKey, stats, 300);

    // Increment usage counters
    await licenseCache.incrementCounter(licenseKey, 'api_calls_today');
    await licenseCache.incrementCounter(licenseKey, 'api_calls_month');

    return NextResponse.json({
      ...stats,
      _cache: {
        hit: false,
        key: `license:${licenseKey}:api:${cacheKey}`,
        ttl: 300,
        cached_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Cached data API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Clear cache for the authenticated user
 */
export async function DELETE(request: NextRequest) {
  try {
    const authToken = cookies().get('auth_token');
    
    if (!authToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = jwt.verify(authToken.value, JWT_SECRET) as any;
    const licenseKey = decoded.licenseKey;
    
    // Clear specific cache entries
    await licenseCache.delete(licenseKey, 'api', 'dashboard_stats');
    
    // Clear product caches
    const license = await prisma.licenses.findUnique({
      where: { license_key: licenseKey },
      select: { site_key: true }
    });

    if (license?.site_key) {
      await licenseCache.delete(licenseKey, 'chatbot', `stats:${license.site_key}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Cache cleared for your account',
      license_key: licenseKey
    });

  } catch (error) {
    console.error('Cache clear error:', error);
    return NextResponse.json({ 
      error: 'Failed to clear cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}