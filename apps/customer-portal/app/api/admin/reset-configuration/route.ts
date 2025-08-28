import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // IMPORTANT: This only works for master admin
    // Add proper admin authentication check here
    
    const body = await request.json();
    const { license_key, product } = body;
    
    // Find and delete product keys for this license and product
    const deleted = await prisma.product_keys.deleteMany({
      where: {
        license_key,
        product
      }
    });
    
    // Log this critical action
    await prisma.audit_logs.create({
      data: {
        action: 'reset_product_configuration',
        resource_type: 'product_key',
        resource_id: product,
        license_key,
        changes: {
          deleted_count: deleted.count,
          product,
          reset_by: 'master_admin'
        },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      }
    });
    
    // If it's chatbot, also clear site_key from license (backward compatibility)
    if (product === 'chatbot') {
      await prisma.licenses.update({
        where: { license_key },
        data: { 
          site_key: null,
          domain: null 
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      deleted: deleted.count,
      message: `Reset ${product} configuration for license ${license_key}`
    });
    
  } catch (error) {
    console.error('Error resetting configuration:', error);
    return NextResponse.json({ error: 'Failed to reset configuration' }, { status: 500 });
  }
}