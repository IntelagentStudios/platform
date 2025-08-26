-- Comprehensive verification of test account product keys
-- This will show if the sk_ format key is gone and what keys remain

-- 1. Check ALL product keys for test account
SELECT 
    '=== ALL PRODUCT KEYS FOR TEST ACCOUNT ===' as section;

SELECT 
    license_key,
    product,
    product_key,
    status,
    created_at,
    last_used_at,
    CASE 
        WHEN product_key LIKE 'sk_%' THEN '❌ OLD SK FORMAT - NEEDS DELETION'
        WHEN product_key LIKE 'chat_%' THEN '✓ Valid Chatbot Key'
        WHEN product_key LIKE 'sale_%' THEN '✓ Valid Sales Key'
        WHEN product_key LIKE 'data_%' THEN '✓ Valid Data Key'
        WHEN product_key LIKE 'agnt_%' THEN '✓ Valid Setup Agent Key'
        ELSE '⚠️ UNKNOWN FORMAT'
    END as key_format
FROM product_keys
WHERE license_key = 'INTL-8K3M-QB7X-2024'
ORDER BY created_at DESC;

-- 2. Check license table for any legacy site_key
SELECT 
    '=== LICENSE TABLE CHECK ===' as section;

SELECT 
    license_key,
    email,
    customer_name,
    products,
    site_key,
    CASE 
        WHEN site_key IS NOT NULL THEN '❌ HAS LEGACY site_key: ' || site_key
        ELSE '✓ No legacy site_key'
    END as legacy_status
FROM licenses
WHERE license_key = 'INTL-8K3M-QB7X-2024';

-- 3. Count of keys by format for test account
SELECT 
    '=== KEY FORMAT SUMMARY ===' as section;

SELECT 
    COUNT(*) FILTER (WHERE product_key LIKE 'sk_%') as sk_format_keys,
    COUNT(*) FILTER (WHERE product_key LIKE 'chat_%') as chat_format_keys,
    COUNT(*) FILTER (WHERE product_key LIKE 'sale_%') as sale_format_keys,
    COUNT(*) FILTER (WHERE product_key LIKE 'data_%') as data_format_keys,
    COUNT(*) FILTER (WHERE product_key LIKE 'agnt_%') as agnt_format_keys,
    COUNT(*) as total_keys
FROM product_keys
WHERE license_key = 'INTL-8K3M-QB7X-2024';

-- 4. Expected vs Actual products
SELECT 
    '=== PRODUCTS COMPARISON ===' as section;

WITH license_products AS (
    SELECT unnest(products) as product
    FROM licenses
    WHERE license_key = 'INTL-8K3M-QB7X-2024'
),
configured_products AS (
    SELECT DISTINCT product
    FROM product_keys
    WHERE license_key = 'INTL-8K3M-QB7X-2024'
)
SELECT 
    COALESCE(lp.product, cp.product) as product,
    CASE WHEN lp.product IS NOT NULL THEN '✓' ELSE '✗' END as in_license,
    CASE WHEN cp.product IS NOT NULL THEN '✓' ELSE '✗' END as has_key,
    CASE 
        WHEN lp.product IS NOT NULL AND cp.product IS NULL THEN 'Ready to configure'
        WHEN lp.product IS NOT NULL AND cp.product IS NOT NULL THEN 'Configured'
        WHEN lp.product IS NULL AND cp.product IS NOT NULL THEN 'Orphaned key'
        ELSE 'Unknown'
    END as status
FROM license_products lp
FULL OUTER JOIN configured_products cp ON lp.product = cp.product
ORDER BY product;

-- 5. Final status check
SELECT 
    '=== FINAL STATUS ===' as section;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM product_keys 
            WHERE license_key = 'INTL-8K3M-QB7X-2024' 
            AND product_key LIKE 'sk_%'
        ) THEN '❌ FAILED: sk_ format keys still exist!'
        ELSE '✅ SUCCESS: No sk_ format keys found'
    END as deletion_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM product_keys 
            WHERE license_key = 'INTL-8K3M-QB7X-2024' 
            AND product = 'chatbot'
        ) THEN '⚠️ Chatbot has product key - will show as Active'
        ELSE '✅ Chatbot has no key - will show as Ready to configure'
    END as chatbot_status;