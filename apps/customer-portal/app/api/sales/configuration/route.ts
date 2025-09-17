import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromCookies } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthFromCookies();
    if (!session?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's license
    const user = await prisma.users.findUnique({
      where: { email: session.email }
    });

    if (!user || !user.license_key) {
      return NextResponse.json({ error: 'No license found' }, { status: 403 });
    }

    // Get product key for sales agent
    const productKey = await prisma.product_keys.findFirst({
      where: {
        license_key: user.license_key,
        product: 'sales-outreach',
        status: 'active'
      }
    });

    if (!productKey) {
      return NextResponse.json({ error: 'Product key not found' }, { status: 404 });
    }

    // Get configuration from metadata
    const config = (productKey.metadata as any) || {};

    return NextResponse.json({
      productKey: productKey.product_key,
      configuration: config,
      onboardingComplete: config.onboardingComplete || false
    });
  } catch (error) {
    console.error('Error fetching configuration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthFromCookies();
    if (!session?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productKey, configuration } = body;

    // Verify product key ownership
    const productKeyRecord = await prisma.product_keys.findUnique({
      where: { product_key: productKey }
    });

    if (!productKeyRecord) {
      return NextResponse.json({ error: 'Invalid product key' }, { status: 403 });
    }

    // Verify ownership via user's license
    const user = await prisma.users.findUnique({
      where: { email: session.email }
    });

    if (!user || user.license_key !== productKeyRecord.license_key) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update configuration in metadata
    const updatedConfig = {
      ...(productKeyRecord.metadata as any || {}),
      ...configuration,
      onboardingComplete: true,
      lastUpdated: new Date().toISOString()
    };

    await prisma.product_keys.update({
      where: { product_key: productKey },
      data: {
        metadata: updatedConfig,
        last_used_at: new Date()
      }
    });

    // If email configuration is provided, store it securely
    if (configuration.emailPassword) {
      // Check if integration exists
      const existingIntegration = await prisma.sales_integrations.findFirst({
        where: {
          license_key: productKeyRecord.license_key,
          integration_type: 'email'
        }
      });

      if (existingIntegration) {
        // Update existing integration
        await prisma.sales_integrations.update({
          where: { id: existingIntegration.id },
          data: {
            name: `${configuration.emailProvider} - ${configuration.emailAddress}`,
            config: {
              provider: configuration.emailProvider,
              email: configuration.emailAddress,
              host: configuration.smtpHost,
              port: configuration.smtpPort,
              // In production, encrypt sensitive data
              password: configuration.emailPassword
            },
            is_active: true,
            updated_at: new Date()
          }
        });
      } else {
        // Create new integration
        await prisma.sales_integrations.create({
          data: {
            license_key: productKeyRecord.license_key,
            integration_type: 'email',
            name: `${configuration.emailProvider} - ${configuration.emailAddress}`,
            config: {
              provider: configuration.emailProvider,
              email: configuration.emailAddress,
              host: configuration.smtpHost,
              port: configuration.smtpPort,
              // In production, encrypt sensitive data
              password: configuration.emailPassword
            },
            is_active: true
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Configuration saved successfully'
    });
  } catch (error) {
    console.error('Error saving configuration:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}