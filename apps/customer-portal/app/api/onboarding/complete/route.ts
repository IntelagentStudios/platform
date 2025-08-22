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
    if (data.business) {
      await prisma.licenses.update({
        where: { license_key: licenseKey },
        data: {
          // company_name field doesn't exist in licenses table
          // company_name: data.business.company_name,
          metadata: {
            company_name: data.business.company_name,
            industry: data.business.industry,
            company_size: data.business.company_size,
            website: data.business.website,
            description: data.business.description
          }
        }
      });
    }

    // TODO: Implement onboarding table
    // Save onboarding completion - table doesn't exist yet
    /*
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
    */

    // Save product configurations - table doesn't exist yet
    /*
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
              updated_at: new Date()
            },
            create: {
              license_key: licenseKey,
              product: product.name,
              config: product.config,
              created_at: new Date()
            }
          });
        }
      }
    }
    */

    // Send real-time event
    await sendCustomEvent({
      channel: `license:${licenseKey}`,
      event: 'onboarding:complete',
      data: {
        completed: true,
        products: data.products?.filter((p: any) => p.configured).map((p: any) => p.name)
      }
    });

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