-- Create product_keys table for multi-product key management
CREATE TABLE IF NOT EXISTS product_keys (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    license_key VARCHAR(20) NOT NULL,
    product VARCHAR(50) NOT NULL,
    product_key VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    
    -- Foreign key constraint
    CONSTRAINT fk_license FOREIGN KEY (license_key) 
        REFERENCES licenses(license_key) ON DELETE CASCADE
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_product_keys_license ON product_keys(license_key);
CREATE INDEX IF NOT EXISTS idx_product_keys_product ON product_keys(product);
CREATE INDEX IF NOT EXISTS idx_product_keys_status ON product_keys(status);
CREATE INDEX IF NOT EXISTS idx_product_keys_product_key ON product_keys(product_key);

-- Migrate existing site_keys from licenses table to product_keys
-- This preserves existing chatbot configurations
INSERT INTO product_keys (license_key, product, product_key, status, metadata)
SELECT 
    license_key,
    'chatbot' as product,
    site_key as product_key,
    'active' as status,
    jsonb_build_object(
        'migrated_from', 'licenses.site_key',
        'migration_date', CURRENT_TIMESTAMP,
        'domain', domain
    ) as metadata
FROM licenses
WHERE site_key IS NOT NULL
ON CONFLICT (product_key) DO NOTHING;

-- Add comment to table
COMMENT ON TABLE product_keys IS 'Stores product-specific access keys for each license, supporting multi-product architecture';
COMMENT ON COLUMN product_keys.product IS 'Product identifier: chatbot, sales-agent, data-enrichment, setup-agent';
COMMENT ON COLUMN product_keys.product_key IS 'Unique key with product prefix (e.g., chat_xxx, sale_xxx)';

-- Display migration results
SELECT 
    'Migration complete' as status,
    COUNT(*) as migrated_keys,
    COUNT(DISTINCT license_key) as affected_licenses
FROM product_keys
WHERE metadata->>'migrated_from' = 'licenses.site_key';