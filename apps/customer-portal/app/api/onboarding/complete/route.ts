import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { sendCustomEvent } from '@/lib/realtime';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const licenseKey = cookieStore.get('license_key')?.value;

    if (!licenseKey) {
      return NextResponse.json(
        { error: 'No license key found' },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Update license with business info
    if (data.business && data.business.company_name) {
      // Update customer_name field which exists in licenses table
      await prisma.licenses.update({
        where: { license_key: licenseKey },
        data: {
          customer_name: data.business.company_name
        }
      });
    }

    // Save onboarding completion
    await prisma.onboarding.upsert({
      where: { license_key: licenseKey },
      update: {
        completed: true,
        completed_at: new Date(),
        data: data
      },
      create: {
        license_key: licenseKey,
        completed: true,
        completed_at: new Date(),
        current_step: 6,
        data: data
      }
    });

    // Save product configurations
    if (data.products) {
      for (const product of data.products) {
        if (product.configured) {
          await prisma.product_configs.upsert({
            where: {
              license_key_product: {
                license_key: licenseKey,
                product: product.name
              }
            },
            update: {
              config: product.config,
              enabled: true,
              updated_at: new Date()
            },
            create: {
              license_key: licenseKey,
              product: product.name,
              config: product.config,
              enabled: true
            }
          });
        }
      }
    }

    // Log completion event
    await prisma.events.create({
      data: {
        license_key: licenseKey,
        event_type: 'onboarding.completed',
        event_data: {
          products_configured: data.products?.filter((p: any) => p.configured).map((p: any) => p.name),
          business_info: data.business
        }
      }
    });

    // Track onboarding metrics
    await prisma.onboarding_metrics.create({
      data: {
        license_key: licenseKey,
        step_completed: 'onboarding_complete',
        properties: {
          total_products: data.products?.length || 0,
          configured_products: data.products?.filter((p: any) => p.configured).length || 0
        }
      }
    });

    // Send real-time event
    sendCustomEvent(
      licenseKey,
      'onboarding:complete',
      {
        completed: true,
        products: data.products?.filter((p: any) => p.configured).map((p: any) => p.name)
      }
    );

    return NextResponse.json({
      success: true,
      redirect: '/dashboard'
    });
  } catch (error) {
    console.error('Onboarding completion error:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}