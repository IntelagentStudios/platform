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
        products: ['chatbot', 'sales-outreach']
      }
    });
    
    // Upsert the chatbot product key
    const chatbotKey = await prisma.product_keys.upsert({
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

    // Upsert the sales-outreach product key
    const salesKey = await prisma.product_keys.upsert({
      where: {
        product_key: 'sales_9b3f7e8a2c5d1f0e'
      },
      update: {
        status: 'active'
      },
      create: {
        product_key: 'sales_9b3f7e8a2c5d1f0e',
        license_key: 'INTL-AGNT-BOSS-MODE',
        product: 'sales-outreach',
        status: 'active',
        metadata: {
          configured: true
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
      message: 'Product keys created/activated successfully',
      chatbot_key: chatbotKey.product_key,
      sales_key: salesKey.product_key,
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