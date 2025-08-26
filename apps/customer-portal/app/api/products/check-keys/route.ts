import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/auth-validator';
import { getProductKey } from '@/lib/product-keys-service';
import { ProductType } from '@/lib/product-keys';

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
    // Check each product for active product keys
    const productStatus: Record<string, any> = {};
    
    for (const product of userProducts) {
      const productKey = await getProductKey(licenseKey, product as ProductType);
      
      productStatus[product] = {
        configured: !!productKey,
        productKey: productKey,
        canManage: !!productKey,
        canConfigure: !productKey
      };
    }

    // Also check for legacy site_key for backward compatibility with chatbot
    if (userProducts.includes('chatbot') && !productStatus['chatbot']?.configured) {
      if (authResult.license?.site_key) {
        productStatus['chatbot'] = {
          configured: true,
          productKey: authResult.license.site_key,
          canManage: true,
          canConfigure: false,
          isLegacy: true
        };
      }
    }
    
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