import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/auth-validator';
import { 
  getAllProductKeys, 
  createProductKey, 
  getProductKey 
} from '@/lib/product-keys-service';
import { ProductType } from '@intelagent/shared/utils/product-keys';

/**
 * GET /api/products/keys
 * Get all product keys for the authenticated user's license
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
  
  try {
    const productKeys = await getAllProductKeys(licenseKey);
    
    // Format response with additional metadata
    const formattedKeys = productKeys.map(pk => ({
      ...pk,
      display_name: getProductDisplayName(pk.product as ProductType),
      is_legacy: pk.metadata?.source === 'legacy_site_key' || pk.metadata?.migrated_from === 'licenses.site_key'
    }));
    
    return NextResponse.json({
      success: true,
      license_key: licenseKey,
      product_keys: formattedKeys,
      summary: {
        total: formattedKeys.length,
        active: formattedKeys.filter(pk => pk.status === 'active').length,
        legacy: formattedKeys.filter(pk => pk.is_legacy).length
      }
    });
  } catch (error) {
    console.error('Error fetching product keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product keys' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products/keys
 * Create a new product key for a specific product
 */
export async function POST(request: NextRequest) {
  const authResult = await validateAuth(request);
  
  if (!authResult.authenticated || !authResult.user) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  const { licenseKey } = authResult.user;
  
  try {
    const { product, metadata } = await request.json();
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product type is required' },
        { status: 400 }
      );
    }
    
    // Validate product type
    const validProducts: ProductType[] = ['chatbot', 'sales-agent', 'data-enrichment', 'setup-agent'];
    if (!validProducts.includes(product)) {
      return NextResponse.json(
        { error: 'Invalid product type' },
        { status: 400 }
      );
    }
    
    // Check if user has purchased this product
    if (authResult.license && !authResult.license.products.includes(product)) {
      return NextResponse.json(
        { error: `You don't have access to ${product}. Please purchase it first.` },
        { status: 403 }
      );
    }
    
    // Create or get existing product key
    const productKey = await createProductKey(
      licenseKey,
      product as ProductType,
      metadata
    );
    
    if (!productKey) {
      return NextResponse.json(
        { error: 'Failed to create product key' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      product,
      product_key: productKey,
      message: `Product key for ${product} created successfully`
    });
  } catch (error) {
    console.error('Error creating product key:', error);
    return NextResponse.json(
      { error: 'Failed to create product key' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/products/keys/[product]
 * Get specific product key
 */
export async function getSpecificProductKey(
  request: NextRequest,
  product: ProductType
) {
  const authResult = await validateAuth(request);
  
  if (!authResult.authenticated || !authResult.user) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  const { licenseKey } = authResult.user;
  
  try {
    const productKey = await getProductKey(licenseKey, product);
    
    if (!productKey) {
      return NextResponse.json({
        success: false,
        product,
        product_key: null,
        message: `No active key found for ${product}`
      });
    }
    
    return NextResponse.json({
      success: true,
      product,
      product_key: productKey,
      display_name: getProductDisplayName(product)
    });
  } catch (error) {
    console.error(`Error fetching ${product} key:`, error);
    return NextResponse.json(
      { error: `Failed to fetch ${product} key` },
      { status: 500 }
    );
  }
}

// Helper function for product display names
function getProductDisplayName(product: ProductType): string {
  const names: Record<ProductType, string> = {
    'chatbot': 'AI Chatbot',
    'sales-agent': 'Sales Agent',
    'data-enrichment': 'Data Enrichment',
    'setup-agent': 'Setup Agent'
  };
  return names[product] || product;
}