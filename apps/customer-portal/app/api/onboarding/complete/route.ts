import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { sendCustomEvent } from '@/lib/realtime';


export const dynamic = 'force-dynamic';
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

    // TODO: Save onboarding completion in audit_logs since onboarding table doesn't exist
    await prisma.audit_logs.create({
      data: {
        license_key: licenseKey,
        user_id: licenseKey,
        action: 'onboarding_completed',
        resource_type: 'onboarding',
        resource_id: licenseKey,
        changes: {
          completed: true,
          completed_at: new Date(),
          current_step: 6,
          data: data
        }
      }
    });

    // TODO: Save product configurations in audit_logs since product_configs table doesn't exist
    if (data.products) {
      for (const product of data.products) {
        if (product.configured) {
          await prisma.audit_logs.create({
            data: {
              license_key: licenseKey,
              user_id: licenseKey,
              action: 'product_configured',
              resource_type: 'product_config',
              resource_id: product.name,
              changes: {
                config: product.config,
                enabled: true
              }
            }
          });
        }
      }
    }

    // TODO: Log completion event in audit_logs since events table doesn't exist
    await prisma.audit_logs.create({
      data: {
        license_key: licenseKey,
        user_id: licenseKey,
        action: 'onboarding.completed',
        resource_type: 'onboarding',
        resource_id: licenseKey,
        changes: {
          products_configured: data.products?.filter((p: any) => p.configured).map((p: any) => p.name),
          business_info: data.business
        }
      }
    });

    // TODO: Track onboarding metrics in audit_logs since onboarding_metrics table doesn't exist
    await prisma.audit_logs.create({
      data: {
        license_key: licenseKey,
        user_id: licenseKey,
        action: 'onboarding_metrics_tracked',
        resource_type: 'metrics',
        resource_id: 'onboarding_complete',
        changes: {
          step_completed: 'onboarding_complete',
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