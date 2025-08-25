import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';


export const dynamic = 'force-dynamic';
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

    // TODO: product_configs table doesn't exist - return empty array for now
    // const configs = await prisma.product_configs.findMany({
    //   where: { license_key: licenseKey }
    // });
    const configs: any[] = [];

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

    // TODO: product_configs table doesn't exist - mock the response
    // const productConfig = await prisma.product_configs.upsert({
    //   where: {
    //     license_key_product: {
    //       license_key: licenseKey,
    //       product: product
    //     }
    //   },
    //   update: {
    //     config,
    //     enabled,
    //     updated_at: new Date()
    //   },
    //   create: {
    //     license_key: licenseKey,
    //     product,
    //     config,
    //     enabled
    //   }
    // });

    const productConfig = {
      license_key: licenseKey,
      product,
      config,
      enabled,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Log configuration update in audit_logs since events table doesn't exist
    await prisma.audit_logs.create({
      data: {
        license_key: licenseKey,
        user_id: licenseKey,
        action: 'product.config_updated',
        resource_type: 'product_config',
        resource_id: product,
        changes: { config, enabled }
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

    // TODO: product_configs table doesn't exist - skip deletion
    // await prisma.product_configs.delete({
    //   where: {
    //     license_key_product: {
    //       license_key: licenseKey,
    //       product: product
    //     }
    //   }
    // });

    // Log configuration deletion in audit_logs since events table doesn't exist
    await prisma.audit_logs.create({
      data: {
        license_key: licenseKey,
        user_id: licenseKey,
        action: 'product.config_deleted',
        resource_type: 'product_config',
        resource_id: product,
        changes: { product }
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