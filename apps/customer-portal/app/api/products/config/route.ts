import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

// GET /api/products/config - Get all product configurations
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const licenseKey = cookieStore.get('license_key')?.value;

    if (!licenseKey) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const configs = await prisma.product_configs.findMany({
      where: { license_key: licenseKey }
    });

    return NextResponse.json({ configs });
  } catch (error) {
    console.error('Failed to fetch product configs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configurations' },
      { status: 500 }
    );
  }
}

// POST /api/products/config - Create or update product configuration
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const licenseKey = cookieStore.get('license_key')?.value;

    if (!licenseKey) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { product, config, enabled = true } = await request.json();

    if (!product) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    const productConfig = await prisma.product_configs.upsert({
      where: {
        license_key_product: {
          license_key: licenseKey,
          product: product
        }
      },
      update: {
        config,
        enabled,
        updated_at: new Date()
      },
      create: {
        license_key: licenseKey,
        product,
        config,
        enabled
      }
    });

    // Log configuration update
    await prisma.events.create({
      data: {
        license_key: licenseKey,
        event_type: 'product.config_updated',
        event_data: {
          product,
          enabled
        }
      }
    });

    return NextResponse.json({
      success: true,
      config: productConfig
    });
  } catch (error) {
    console.error('Failed to update product config:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/config - Delete product configuration
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const licenseKey = cookieStore.get('license_key')?.value;

    if (!licenseKey) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { product } = await request.json();

    if (!product) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    await prisma.product_configs.delete({
      where: {
        license_key_product: {
          license_key: licenseKey,
          product: product
        }
      }
    });

    // Log configuration deletion
    await prisma.events.create({
      data: {
        license_key: licenseKey,
        event_type: 'product.config_deleted',
        event_data: {
          product
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Configuration for ${product} deleted`
    });
  } catch (error) {
    console.error('Failed to delete product config:', error);
    return NextResponse.json(
      { error: 'Failed to delete configuration' },
      { status: 500 }
    );
  }
}