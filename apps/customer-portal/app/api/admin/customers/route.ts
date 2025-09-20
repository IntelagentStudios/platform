import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateAuth } from '@/lib/auth-validator';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access using standard auth
    const authResult = await validateAuth(request);

    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check for master admin role or specific master license key
    const isMasterAdmin = authResult.user.role === 'master_admin' ||
                          authResult.user.licenseKey === 'INTL-AGNT-BOSS-MODE';

    if (!isMasterAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const skip = (page - 1) * limit;

    // Calculate API calls in the last 24 hours for each customer
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Build where clause for filtering
    const whereClause: any = {
      AND: [
        { NOT: { email: { contains: 'test' } } },
        { email: { not: 'admin@intelagentstudios.com' } }
      ]
    };

    // Add search filter
    if (search) {
      whereClause.AND.push({
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { customer_name: { contains: search, mode: 'insensitive' } },
          { license_key: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    // Add status filter
    if (status) {
      whereClause.AND.push({ status: status });
    }

    // Fetch customers with comprehensive data
    const [customers, totalCount] = await Promise.all([
      prisma.licenses.findMany({
        where: whereClause,
        select: {
          license_key: true,
          email: true,
          customer_name: true,
          status: true,
          plan: true,
          tier: true,
          created_at: true,
          last_payment_date: true,
          next_billing_date: true,
          total_pence: true,
          products: true,
          domain: true,
          subscription_status: true,
          user_id: true
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.licenses.count({ where: whereClause })
    ]);

    // Get additional data for each customer
    const enrichedCustomers = await Promise.all(
      customers.map(async (customer) => {
        // Get user count for this license
        const userCount = await prisma.users.count({
          where: { license_key: customer.license_key }
        });

        // Get API calls in last 24h for this customer
        const apiCalls24h = await prisma.chatbot_logs.count({
          where: {
            product_key: customer.license_key,
            timestamp: { gte: oneDayAgo }
          }
        });

        // Get product keys for this license
        const productKeys = await prisma.product_keys.findMany({
          where: { license_key: customer.license_key },
          select: { product: true, status: true }
        });

        return {
          license_key: customer.license_key,
          email: customer.email,
          customer_name: customer.customer_name,
          status: customer.status,
          plan: customer.plan,
          tier: customer.tier,
          created_at: customer.created_at,
          last_payment_date: customer.last_payment_date,
          next_billing_date: customer.next_billing_date,
          total_pence: customer.total_pence || 0,
          products: customer.products || [],
          domain: customer.domain,
          subscription_status: customer.subscription_status,
          user_count: userCount,
          api_calls_24h: apiCalls24h,
          product_keys: productKeys
        };
      })
    );

    // Calculate summary statistics
    const summary = {
      total: totalCount,
      active: enrichedCustomers.filter(c => c.status === 'active').length,
      trial: enrichedCustomers.filter(c => c.status === 'trial').length,
      expired: enrichedCustomers.filter(c => c.status === 'expired').length,
      total_revenue: enrichedCustomers.reduce((sum, c) => sum + (c.total_pence || 0), 0) / 100,
      total_api_calls_24h: enrichedCustomers.reduce((sum, c) => sum + (c.api_calls_24h || 0), 0)
    };

    return NextResponse.json({
      customers: enrichedCustomers,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      summary
    });

  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access using standard auth
    const authResult = await validateAuth(request);

    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check for master admin role or specific master license key
    const isMasterAdmin = authResult.user.role === 'master_admin' ||
                          authResult.user.licenseKey === 'INTL-AGNT-BOSS-MODE';

    if (!isMasterAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, license_key, data } = body;

    switch (action) {
      case 'update_status':
        await prisma.licenses.update({
          where: { license_key },
          data: { status: data.status }
        });
        break;

      case 'update_plan':
        await prisma.licenses.update({
          where: { license_key },
          data: { plan: data.plan, tier: data.tier }
        });
        break;

      case 'update_customer_info':
        await prisma.licenses.update({
          where: { license_key },
          data: {
            customer_name: data.customer_name,
            email: data.email
          }
        });
        break;

      case 'suspend_customer':
        await prisma.licenses.update({
          where: { license_key },
          data: {
            status: 'suspended',
            suspended_at: new Date()
          }
        });
        break;

      case 'reactivate_customer':
        await prisma.licenses.update({
          where: { license_key },
          data: {
            status: 'active',
            suspended_at: null
          }
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}