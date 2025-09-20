import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * One-time setup endpoint to configure master admin
 * Visit: /api/admin/setup-master to set up your account as master admin
 */
export async function GET(request: NextRequest) {
  try {
    // Update the Harry user to have master_admin role
    const user = await prisma.users.findUnique({
      where: { email: 'harry@intelagentstudios.com' }
    });

    if (user) {
      await prisma.users.update({
        where: { email: 'harry@intelagentstudios.com' },
        data: { role: 'master_admin' }
      });
    }

    // Also ensure the license has both products
    await prisma.licenses.upsert({
      where: { license_key: 'INTL-AGNT-BOSS-MODE' },
      update: {
        products: ['chatbot', 'sales-outreach'],
        status: 'active',
        is_pro: true
      },
      create: {
        license_key: 'INTL-AGNT-BOSS-MODE',
        email: 'harry@intelagentstudios.com',
        products: ['chatbot', 'sales-outreach'],
        status: 'active',
        is_pro: true,
        plan: 'master',
        tier: 'enterprise',
        created_at: new Date()
      }
    });

    // Ensure both product keys exist
    await prisma.product_keys.upsert({
      where: { product_key: 'chat_9b3f7e8a2c5d1f0e' },
      update: { status: 'active' },
      create: {
        product_key: 'chat_9b3f7e8a2c5d1f0e',
        license_key: 'INTL-AGNT-BOSS-MODE',
        product: 'chatbot',
        status: 'active',
        metadata: { configured: true }
      }
    });

    await prisma.product_keys.upsert({
      where: { product_key: 'sales_9b3f7e8a2c5d1f0e' },
      update: { status: 'active' },
      create: {
        product_key: 'sales_9b3f7e8a2c5d1f0e',
        license_key: 'INTL-AGNT-BOSS-MODE',
        product: 'sales-outreach',
        status: 'active',
        metadata: { configured: true }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Master admin setup complete',
      details: {
        user: user ? 'Updated to master_admin' : 'User not found - may need to login first',
        license: 'Configured with both products',
        productKeys: 'Both chatbot and sales-outreach keys active'
      }
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({
      error: 'Setup failed',
      details: error.message
    }, { status: 500 });
  }
}