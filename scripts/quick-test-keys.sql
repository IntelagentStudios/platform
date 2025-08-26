-- Quick test query to verify all keys are correct
-- Run this to see a simple overview

-- Show all licenses with their product keys
SELECT 
    l.license_key,
    l.email,
    l.customer_name,
    l.status,
    l.products as purchased_products,
    COALESCE(
        array_agg(
            CASE 
                WHEN pk.product_key IS NOT NULL 
                THEN pk.product || ': ' || pk.product_key 
                ELSE NULL 
            END
        ) FILTER (WHERE pk.product_key IS NOT NULL),
        ARRAY[]::text[]
    ) as configured_keys,
    CASE 
        WHEN l.site_key IS NOT NULL THEN 'HAS LEGACY site_key: ' || l.site_key
        ELSE 'No legacy keys ✓'
    END as legacy_check
FROM licenses l
LEFT JOIN product_keys pk ON pk.license_key = l.license_key
GROUP BY l.license_key, l.email, l.customer_name, l.status, l.products, l.site_key
ORDER BY l.license_key;

-- Show any issues
SELECT 
    '--- ISSUES TO FIX ---' as section;

-- Licenses with products but no keys
SELECT 
    l.license_key,
    unnest(l.products) as missing_product_key_for
FROM licenses l
WHERE EXISTS (
    SELECT 1 FROM unnest(l.products) AS p
    WHERE NOT EXISTS (
        SELECT 1 FROM product_keys pk 
        WHERE pk.license_key = l.license_key 
        AND pk.product = p
    )
);

-- Invalid key formats
SELECT 
    license_key,
    product,
    product_key as invalid_format_key
FROM product_keys
WHERE product_key NOT LIKE 'chat_%' 
  AND product_key NOT LIKE 'sale_%'
  AND product_key NOT LIKE 'data_%'
  AND product_key NOT LIKE 'agnt_%';