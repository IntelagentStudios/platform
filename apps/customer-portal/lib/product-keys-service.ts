/**
 * Product Keys Service
 * Handles product key operations with backward compatibility
 */

import { prisma } from '@/lib/prisma';
import { generateProductKey, ProductType, parseProductKey } from '@/packages/shared/src/utils/product-keys';

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

    // For chatbot, fall back to legacy site_key
    if (product === 'chatbot') {
      const license = await prisma.licenses.findUnique({
        where: { license_key: licenseKey },
        select: { site_key: true }
      });

      if (license?.site_key) {
        // Migrate the legacy key to product_keys table for future use
        try {
          await prisma.product_keys.create({
            data: {
              license_key: licenseKey,
              product: 'chatbot',
              product_key: license.site_key,
              status: 'active',
              metadata: {
                migrated_from: 'licenses.site_key',
                migration_date: new Date().toISOString(),
                auto_migrated: true
              }
            }
          });
        } catch (e) {
          // Key might already exist, ignore error
        }

        return license.site_key;
      }
    }

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
    // Get from product_keys table
    const productKeys = await prisma.product_keys.findMany({
      where: {
        license_key: licenseKey,
        status: 'active'
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    // Check for legacy site_key and add if not in product_keys
    const license = await prisma.licenses.findUnique({
      where: { license_key: licenseKey },
      select: { site_key: true }
    });

    if (license?.site_key) {
      const hasChatbotKey = productKeys.some(pk => pk.product === 'chatbot');
      
      if (!hasChatbotKey) {
        // Add legacy site_key as chatbot key
        productKeys.push({
          id: 'legacy-site-key',
          license_key: licenseKey,
          product: 'chatbot',
          product_key: license.site_key,
          created_at: new Date(),
          last_used_at: null,
          status: 'active',
          metadata: {
            source: 'legacy_site_key'
          }
        });
      }
    }

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
    // Check if key already exists for this product
    const existing = await prisma.product_keys.findFirst({
      where: {
        license_key: licenseKey,
        product: product,
        status: 'active'
      }
    });

    if (existing) {
      return existing.product_key;
    }

    // Generate new key
    const { key } = generateProductKey(product);

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

    return created.product_key;
  } catch (error) {
    console.error(`Error creating product key for ${product}:`, error);
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

    // Check legacy site_key
    const license = await prisma.licenses.findFirst({
      where: { site_key: productKey },
      select: { license_key: true }
    });

    if (license) {
      return {
        licenseKey: license.license_key,
        product: 'chatbot'
      };
    }

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