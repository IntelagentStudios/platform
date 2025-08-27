import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // First ensure the license has chatbot in products array
    await prisma.licenses.update({
      where: {
        license_key: 'INTL-AGNT-BOSS-MODE'
      },
      data: {
        products: ['chatbot', 'data_enrichment', 'sales_agent', 'setup_agent']
      }
    });
    
    // Upsert the product key
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
    
    // Verify configuration
    const configs = await prisma.product_keys.findMany({
      where: {
        license_key: 'INTL-AGNT-BOSS-MODE',
        status: 'active'
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Product key created/activated successfully',
      product_key: productKey.product_key,
      status: productKey.status,
      all_active_products: configs.map(c => ({
        product: c.product,
        key: c.product_key,
        status: c.status
      }))
    });
    
  } catch (error) {
    console.error('Error creating product key:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}