/**
 * Product Key Management Utilities
 * 
 * Architecture:
 * - Each license can have multiple product keys
 * - Product keys are prefixed with product identifiers
 * - Format: {product_prefix}_{random_16_chars}
 * 
 * Example for a user with chatbot and sales-agent:
 * License: INTL-AGNT-BOSS-MODE
 *   - Chatbot key: chat_a1b2c3d4e5f6g7h8
 *   - Sales key: sale_9i8h7g6f5e4d3c2b
 */

import crypto from 'crypto';

export type ProductType = 'chatbot' | 'sales-agent' | 'data-enrichment' | 'setup-agent';

export interface ProductKey {
  id: string;
  license_key: string;
  product: ProductType;
  product_key: string;
  created_at: Date;
  last_used_at?: Date | null;
  status: 'active' | 'suspended' | 'revoked';
  metadata?: Record<string, any>;
}

export interface ProductKeyGeneration {
  product: ProductType;
  key: string;
  prefix: string;
}

// Product prefix mapping for key generation
const PRODUCT_PREFIXES: Record<ProductType, string> = {
  'chatbot': 'chat',
  'sales-agent': 'sale',
  'data-enrichment': 'data',
  'setup-agent': 'agnt'
};

/**
 * Generate a new product key with appropriate prefix
 */
export function generateProductKey(product: ProductType): ProductKeyGeneration {
  const prefix = PRODUCT_PREFIXES[product];
  if (!prefix) {
    throw new Error(`Unknown product type: ${product}`);
  }

  // Generate 16 random characters
  const randomBytes = crypto.randomBytes(8);
  const randomString = randomBytes.toString('hex');
  
  const key = `${prefix}_${randomString}`;
  
  return {
    product,
    key,
    prefix
  };
}

/**
 * Parse a product key to extract product type
 */
export function parseProductKey(productKey: string): { product: ProductType | null; prefix: string; id: string } {
  const parts = productKey.split('_');
  if (parts.length !== 2) {
    return { product: null, prefix: '', id: productKey };
  }

  const [prefix, id] = parts;
  
  // Reverse lookup to find product type
  const product = Object.entries(PRODUCT_PREFIXES).find(
    ([_, p]) => p === prefix
  )?.[0] as ProductType | undefined;

  return {
    product: product || null,
    prefix,
    id
  };
}

/**
 * Validate a product key format
 */
export function isValidProductKey(productKey: string): boolean {
  const parsed = parseProductKey(productKey);
  return parsed.product !== null && parsed.id.length === 16;
}

/**
 * Check if a key belongs to a specific product
 */
export function isProductKey(productKey: string, product: ProductType): boolean {
  const parsed = parseProductKey(productKey);
  return parsed.product === product;
}

/**
 * Generate a legacy site_key format (for backward compatibility)
 * Format: key_{16_chars}
 */
export function generateLegacySiteKey(): string {
  const randomString = crypto.randomBytes(8).toString('hex');
  return `key_${randomString}`;
}

/**
 * Convert legacy site_key to new product key format
 */
export function migrateSiteKeyToProductKey(siteKey: string): string {
  // If it's already in new format, return as is
  if (isValidProductKey(siteKey)) {
    return siteKey;
  }
  
  // If it's in legacy format (key_xxxx), convert to chatbot key
  if (siteKey.startsWith('key_')) {
    const id = siteKey.substring(4);
    return `chat_${id}`;
  }
  
  // Otherwise, generate new chatbot key
  return generateProductKey('chatbot').key;
}

/**
 * Get all product types
 */
export function getAllProductTypes(): ProductType[] {
  return Object.keys(PRODUCT_PREFIXES) as ProductType[];
}

/**
 * Get product display name
 */
export function getProductDisplayName(product: ProductType): string {
  const displayNames: Record<ProductType, string> = {
    'chatbot': 'AI Chatbot',
    'sales-agent': 'Sales Agent',
    'data-enrichment': 'Data Enrichment',
    'setup-agent': 'Setup Agent'
  };
  return displayNames[product] || product;
}

/**
 * Example usage patterns for reference
 */
export const examples = {
  // Generate keys for a new customer
  generateCustomerKeys(licenseKey: string, products: ProductType[]) {
    return products.map(product => ({
      license_key: licenseKey,
      product,
      ...generateProductKey(product)
    }));
  },

  // Check what products a license has access to
  async getActiveProducts(productKeys: ProductKey[]): Promise<ProductType[]> {
    return productKeys
      .filter(pk => pk.status === 'active')
      .map(pk => pk.product);
  },

  // Find specific product key
  findProductKey(productKeys: ProductKey[], product: ProductType): ProductKey | undefined {
    return productKeys.find(pk => 
      pk.product === product && 
      pk.status === 'active'
    );
  }
};