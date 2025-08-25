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

    // Fetch business metrics
    const [
      totalLicenses,
      activeLicenses,
      expiredLicenses,
      trialLicenses,
      productStats,
      recentActivity
    ] = await Promise.all([
      prisma.licenses.count(),
      prisma.licenses.count({
        where: { status: 'active' }
      }),
      prisma.licenses.count({
        where: { status: 'expired' }
      }),
      prisma.licenses.count({
        where: { status: 'trial' }
      }),
      prisma.licenses.findMany({
        select: { products: true }
      }),
      // TODO: Use audit_logs since events table doesn't exist
      prisma.audit_logs.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        select: {
          action: true,
          license_key: true,
          created_at: true
        }
      })
    ]);

    // Calculate unique products and their usage
    const productUsage = new Map();
    productStats.forEach(license => {
      (license.products || []).forEach(product => {
        productUsage.set(product, (productUsage.get(product) || 0) + 1);
      });
    });

    const totalProducts = productUsage.size;
    const activeProducts = Array.from(productUsage.entries()).filter(([_, count]) => count > 0).length;

    return NextResponse.json({
      totalLicenses,
      activeLicenses,
      expiredLicenses,
      trialLicenses,
      totalProducts,
      activeProducts,
      productUsage: Object.fromEntries(productUsage),
      recentActivity: recentActivity.map(event => ({
        type: event.action,
        license: event.license_key,
        time: event.created_at
      }))
    });

  } catch (error) {
    console.error('Admin business stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business stats' },
      { status: 500 }
    );
  }
}