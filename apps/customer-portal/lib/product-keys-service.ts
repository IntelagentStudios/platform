/**
 * Product Keys Service
 * Handles product key operations with backward compatibility
 */

import { prisma } from '@/lib/prisma';
import { generateProductKey, ProductType, parseProductKey } from '@/lib/product-keys';

export interface ProductKeyRecord {
  id: string;
  license_key: string;
  product: string;
  product_key: string;
  created_at: Date | null;
  last_used_at: Date | null;
  status: string | null;
  metadata: any;
}

/**
 * Get product key for a specific product and license
 * Falls back to legacy site_key for chatbot if needed
 */
export async function getProductKey(
  licenseKey: string, 
  product: ProductType
): Promise<string | null> {
  try {
    // First, try to get from product_keys table
    const productKeyRecord = await prisma.product_keys.findFirst({
      where: {
        license_key: licenseKey,
        product: product,
        status: 'active'
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    if (productKeyRecord) {
      return productKeyRecord.product_key;
    }

    // No fallback to legacy site_key - require proper product key configuration
    return null;
  } catch (error) {
    console.error(`Error getting product key for ${product}:`, error);
    return null;
  }
}

/**
 * Get all product keys for a license
 */
export async function getAllProductKeys(
  licenseKey: string
): Promise<ProductKeyRecord[]> {
  try {
    // Get from product_keys table only - no legacy fallback
    const productKeys = await prisma.product_keys.findMany({
      where: {
        license_key: licenseKey,
        status: 'active'
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    return productKeys;
  } catch (error) {
    console.error('Error getting all product keys:', error);
    return [];
  }
}

/**
 * Create a new product key
 */
export async function createProductKey(
  licenseKey: string,
  product: ProductType,
  metadata?: Record<string, any>
): Promise<string | null> {
  try {
    console.log(`[product-keys-service] Creating product key for license: ${licenseKey}, product: ${product}`);
    
    // Check if key already exists for this product
    const existing = await prisma.product_keys.findFirst({
      where: {
        license_key: licenseKey,
        product: product,
        status: 'active'
      }
    });

    if (existing) {
      console.log(`[product-keys-service] Product key already exists: ${existing.product_key.substring(0, 8)}...`);
      return existing.product_key;
    }

    // Generate new key
    const { key } = generateProductKey(product);
    console.log(`[product-keys-service] Generated new key: ${key.substring(0, 8)}...`);

    // Create in database
    const created = await prisma.product_keys.create({
      data: {
        license_key: licenseKey,
        product: product,
        product_key: key,
        status: 'active',
        metadata: metadata || {}
      }
    });

    console.log(`[product-keys-service] Product key created successfully: ${created.product_key.substring(0, 8)}...`);
    return created.product_key;
  } catch (error) {
    console.error(`[product-keys-service] Error creating product key for ${product}:`, error);
    return null;
  }
}

/**
 * Get license key from product key
 * This is useful for webhook endpoints that receive product_key
 */
export async function getLicenseFromProductKey(
  productKey: string
): Promise<{ licenseKey: string; product: string } | null> {
  try {
    // Check product_keys table
    const productKeyRecord = await prisma.product_keys.findUnique({
      where: { product_key: productKey },
      select: {
        license_key: true,
        product: true
      }
    });

    if (productKeyRecord) {
      return {
        licenseKey: productKeyRecord.license_key,
        product: productKeyRecord.product
      };
    }

    // No legacy site_key check - only use product_keys table
    return null;
  } catch (error) {
    console.error('Error getting license from product key:', error);
    return null;
  }
}

/**
 * Update last used timestamp for a product key
 */
export async function updateProductKeyUsage(productKey: string): Promise<void> {
  try {
    await prisma.product_keys.updateMany({
      where: { product_key: productKey },
      data: { last_used_at: new Date() }
    });
  } catch (error) {
    // Non-critical, don't throw
    console.error('Error updating product key usage:', error);
  }
}

/**
 * Check if a license has access to a specific product
 */
export async function hasProductAccess(
  licenseKey: string,
  product: ProductType
): Promise<boolean> {
  const productKey = await getProductKey(licenseKey, product);
  return productKey !== null;
}