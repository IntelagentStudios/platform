-- Migrate BOSS-MODE account from legacy site_key to new product_key format
-- This will create a proper chatbot product key and remove the legacy site_key

-- First, check current state
SELECT 
    license_key,
    site_key,
    products
FROM licenses 
WHERE license_key = 'INTL-AGNT-BOSS-MODE';

-- Insert new product key for chatbot (if not exists)
INSERT INTO product_keys (
    license_key,
    product,
    product_key,
    status,
    metadata,
    created_at
) 
SELECT 
    'INTL-AGNT-BOSS-MODE',
    'chatbot',
    'chat_' || substr(md5(random()::text), 1, 16),
    'active',
    jsonb_build_object(
        'migrated_from', 'legacy_site_key',
        'original_site_key', site_key,
        'migration_date', now()
    ),
    now()
FROM licenses 
WHERE license_key = 'INTL-AGNT-BOSS-MODE'
  AND site_key IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM product_keys 
      WHERE license_key = 'INTL-AGNT-BOSS-MODE' 
      AND product = 'chatbot'
  );

-- Clear the legacy site_key from licenses table
UPDATE licenses 
SET site_key = NULL
WHERE license_key = 'INTL-AGNT-BOSS-MODE';

-- Verify the migration
SELECT 
    pk.product,
    pk.product_key,
    pk.status,
    pk.created_at,
    pk.metadata
FROM product_keys pk
WHERE pk.license_key = 'INTL-AGNT-BOSS-MODE'
ORDER BY pk.created_at DESC;