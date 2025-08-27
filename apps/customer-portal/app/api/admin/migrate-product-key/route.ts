import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Check for admin authorization (you can add more security here)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== 'Bearer INTL-ADMIN-KEY') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create the product key
    const productKey = await prisma.product_keys.upsert({
      where: {
        product_key: 'chat_9b3f7e8a2c5d1f0e'
      },
      update: {
        status: 'active'
      },
      create: {
        product_key: 'chat_9b3f7e8a2c5d1f0e',
        license_key: 'INTL-AGNT-BOSS-MODE',
        product: 'chatbot',
        status: 'active',
        metadata: {
          domain: 'intelagentstudios.com'
        }
      }
    });

    // Ensure the license has chatbot in products array
    await prisma.licenses.update({
      where: {
        license_key: 'INTL-AGNT-BOSS-MODE'
      },
      data: {
        products: {
          set: ['chatbot', 'data_enrichment', 'sales_agent', 'setup_agent']
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Product key created successfully',
      product_key: productKey.product_key
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Failed to create product key', details: error.message },
      { status: 500 }
    );
  }
}