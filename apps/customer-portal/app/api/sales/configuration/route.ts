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
        OR: [
          { product: 'sales-outreach' },
          { product_type: 'sales-agent' }
        ],
        status: 'active'
      }
    });

    if (!productKey) {
      return NextResponse.json({ error: 'Product key not found' }, { status: 404 });
    }

    // Get configuration
    const config = productKey.configuration || {};

    return NextResponse.json({
      productKey: productKey.key,
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
      where: { key: productKey },
      include: {
        licenses: true
      }
    });

    if (!productKeyRecord || productKeyRecord.licenses?.email !== session.email) {
      return NextResponse.json({ error: 'Invalid product key' }, { status: 403 });
    }

    // Update configuration
    const updatedConfig = {
      ...productKeyRecord.configuration,
      ...configuration,
      onboardingComplete: true,
      lastUpdated: new Date().toISOString()
    };

    await prisma.product_keys.update({
      where: { key: productKey },
      data: {
        configuration: updatedConfig,
        updated_at: new Date()
      }
    });

    // If email configuration is provided, store it securely
    if (configuration.emailPassword) {
      // Create or update email integration
      await prisma.sales_integrations.upsert({
        where: {
          license_key_type: {
            license_key: productKeyRecord.license_key,
            integration_type: 'email'
          }
        },
        create: {
          license_key: productKeyRecord.license_key,
          integration_type: 'email',
          provider: configuration.emailProvider,
          configuration: {
            email: configuration.emailAddress,
            host: configuration.smtpHost,
            port: configuration.smtpPort,
            // In production, encrypt sensitive data
            password: configuration.emailPassword
          },
          status: 'active'
        },
        update: {
          provider: configuration.emailProvider,
          configuration: {
            email: configuration.emailAddress,
            host: configuration.smtpHost,
            port: configuration.smtpPort,
            // In production, encrypt sensitive data
            password: configuration.emailPassword
          },
          status: 'active',
          updated_at: new Date()
        }
      });
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