import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/auth-validator';
import { getProductKey } from '@/lib/product-keys-service';
import { ProductType } from '@/lib/product-keys';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/products/check-keys
 * Check which products have active product keys configured
 */
export async function GET(request: NextRequest) {
  const authResult = await validateAuth(request);
  
  if (!authResult.authenticated || !authResult.user) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  const { licenseKey } = authResult.user;
  const userProducts = authResult.license?.products || [];
  
  try {
    // Check each product for active product keys AND configuration
    const productStatus: Record<string, any> = {};
    
    for (const product of userProducts) {
      const productKey = await getProductKey(licenseKey, product as ProductType);
      
      // Product key existence means it's configured
      // (Setup Agent creates the key when configuration is complete)
      const hasKey = !!productKey;
      
      productStatus[product] = {
        configured: hasKey,  // Has key = configured
        hasProductKey: hasKey,
        productKey: productKey,
        canManage: hasKey,   // Can manage if has key
        canConfigure: !hasKey // Can configure if no key
      };
    }

    // Legacy site_key support removed - all accounts should use product_keys table
    
    return NextResponse.json({
      success: true,
      configurations: productStatus,
      userProducts
    });
  } catch (error) {
    console.error('Error checking product keys:', error);
    return NextResponse.json(
      { error: 'Failed to check product configurations' },
      { status: 500 }
    );
  }
}