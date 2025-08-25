import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@intelagent/database';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const cookieStore = cookies();
    const adminToken = cookieStore.get('admin_token');
    
    if (!adminToken) {
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
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Fetch admin stats
    const [
      totalLicenses,
      activeLicenses,
      totalProducts,
      recentActivity
    ] = await Promise.all([
      prisma.licenses.count(),
      prisma.licenses.count({
        where: { status: 'active' }
      }),
      prisma.licenses.findMany({
        select: { products: true }
      }),
      // TODO: Use audit_logs since events table doesn't exist
      prisma.audit_logs.count({
        where: {
          created_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })
    ]);

    // Calculate unique products
    const uniqueProducts = new Set();
    totalProducts.forEach(license => {
      (license.products || []).forEach(product => {
        uniqueProducts.add(product);
      });
    });

    // Calculate revenue (simplified - you can enhance this)
    const planPricing = {
      basic: 29,
      pro: 99,
      enterprise: 299
    };

    const licenses = await prisma.licenses.findMany({
      where: { status: 'active' },
      select: { plan: true }
    });

    const totalRevenue = licenses.reduce((sum, license) => {
      const plan = (license.plan || 'basic').toLowerCase();
      return sum + (planPricing[plan as keyof typeof planPricing] || 29);
    }, 0);

    return NextResponse.json({
      totalLicenses,
      activeLicenses,
      activeProducts: uniqueProducts.size,
      totalRevenue,
      recentActivity,
      growthRate: 12 // Placeholder - calculate actual growth
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}