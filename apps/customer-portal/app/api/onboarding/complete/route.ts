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
          company_name: data.business.company_name,
          metadata: {
            industry: data.business.industry,
            company_size: data.business.company_size,
            website: data.business.website,
            description: data.business.description
          }
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

    // Track onboarding analytics
    await trackOnboardingCompletion(licenseKey, data);

    // Send real-time notification
    sendCustomEvent(licenseKey, 'onboarding-complete', {
      message: 'Welcome! Your account setup is complete.',
      products: data.products || []
    });

    // If products were selected, create initial configurations
    if (data.products && data.products.length > 0) {
      await setupInitialProducts(licenseKey, data.products, data.setup);
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully'
    });

  } catch (error: any) {
    console.error('Onboarding completion error:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}

async function trackOnboardingCompletion(licenseKey: string, data: any) {
  // Track analytics
  try {
    await prisma.analytics.create({
      data: {
        event_type: 'onboarding_completed',
        license_key: licenseKey,
        properties: {
          products_selected: data.products?.length || 0,
          goals: data.goals || [],
          time_to_complete: Date.now() - (data.started_at || Date.now()),
          skipped_steps: data.skipped || []
        },
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
}

async function setupInitialProducts(licenseKey: string, products: string[], setupData: any) {
  // Create initial product configurations
  for (const productId of products) {
    try {
      if (productId === 'chatbot' && setupData?.domain) {
        // Configure chatbot for the domain
        await prisma.product_configs.create({
          data: {
            license_key: licenseKey,
            product_id: productId,
            config: {
              domain: setupData.domain,
              enabled: true,
              welcome_message: 'Hello! How can I help you today?'
            }
          }
        });
      } else {
        // Create default config
        await prisma.product_configs.create({
          data: {
            license_key: licenseKey,
            product_id: productId,
            config: {
              enabled: true
            }
          }
        });
      }
    } catch (error) {
      console.error(`Failed to setup ${productId}:`, error);
    }
  }
}