-- Comprehensive test query for all license keys and product keys
-- This will show the complete state of your multi-tenant system

-- 1. Overview of all licenses and their products
SELECT 
    '=== LICENSE OVERVIEW ===' as section;

SELECT 
    l.license_key,
    l.email,
    l.customer_name,
    l.status as license_status,
    l.is_pro,
    array_length(l.products, 1) as product_count,
    l.products,
    l.site_key as legacy_site_key,
    CASE 
        WHEN l.site_key IS NOT NULL THEN 'HAS LEGACY KEY - NEEDS MIGRATION'
        ELSE 'OK - No legacy keys'
    END as legacy_status
FROM licenses l
ORDER BY l.created_at DESC;

-- 2. Product keys summary by license
SELECT 
    '=== PRODUCT KEYS BY LICENSE ===' as section;

SELECT 
    pk.license_key,
    COUNT(*) as total_product_keys,
    array_agg(DISTINCT pk.product ORDER BY pk.product) as configured_products,
    array_agg(pk.product_key ORDER BY pk.product) as product_keys,
    array_agg(pk.status ORDER BY pk.product) as key_statuses
FROM product_keys pk
GROUP BY pk.license_key
ORDER BY pk.license_key;

-- 3. Detailed product key information
SELECT 
    '=== DETAILED PRODUCT KEYS ===' as section;

SELECT 
    pk.license_key,
    pk.product,
    pk.product_key,
    pk.status,
    pk.created_at,
    pk.last_used_at,
    CASE 
        WHEN pk.product_key LIKE 'chat_%' THEN 'Valid Chatbot Key'
        WHEN pk.product_key LIKE 'sale_%' THEN 'Valid Sales Key'
        WHEN pk.product_key LIKE 'data_%' THEN 'Valid Data Key'
        WHEN pk.product_key LIKE 'agnt_%' THEN 'Valid Setup Agent Key'
        WHEN pk.product_key LIKE 'key_%' THEN 'LEGACY FORMAT - Needs Update'
        WHEN pk.product_key LIKE 'sk_%' THEN 'OLD FORMAT - Needs Update'
        ELSE 'UNKNOWN FORMAT'
    END as key_format_check
FROM product_keys pk
ORDER BY pk.license_key, pk.product;

-- 4. Check for missing product keys (licenses with products but no keys)
SELECT 
    '=== MISSING PRODUCT KEYS ===' as section;

SELECT 
    l.license_key,
    l.email,
    unnest(l.products) as product,
    'NO KEY FOUND' as status
FROM licenses l
WHERE EXISTS (
    SELECT 1 FROM unnest(l.products) AS p
    WHERE NOT EXISTS (
        SELECT 1 FROM product_keys pk 
        WHERE pk.license_key = l.license_key 
        AND pk.product = p
    )
)
ORDER BY l.license_key, product;

-- 5. Check for orphaned product keys (keys without matching license products)
SELECT 
    '=== ORPHANED PRODUCT KEYS ===' as section;

SELECT 
    pk.license_key,
    pk.product,
    pk.product_key,
    'Product not in license.products array' as issue
FROM product_keys pk
JOIN licenses l ON l.license_key = pk.license_key
WHERE pk.product != ALL(l.products)
ORDER BY pk.license_key, pk.product;

-- 6. Users and their license associations
SELECT 
    '=== USER TO LICENSE MAPPING ===' as section;

SELECT 
    u.email as user_email,
    u.name as user_name,
    u.license_key,
    u.role,
    l.status as license_status,
    l.products,
    COUNT(pk.product_key) as configured_products_count
FROM users u
LEFT JOIN licenses l ON l.license_key = u.license_key
LEFT JOIN product_keys pk ON pk.license_key = u.license_key
GROUP BY u.email, u.name, u.license_key, u.role, l.status, l.products
ORDER BY u.created_at DESC;

-- 7. Data integrity checks
SELECT 
    '=== DATA INTEGRITY CHECKS ===' as section;

-- Check for duplicate product keys
SELECT 
    'Duplicate Keys Check:' as check_type,
    COUNT(*) as duplicates_found,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS - No duplicate product keys'
        ELSE 'FAIL - Duplicate keys found!'
    END as status
FROM (
    SELECT product_key, COUNT(*) 
    FROM product_keys 
    GROUP BY product_key 
    HAVING COUNT(*) > 1
) dupes;

-- Check for invalid key formats
SELECT 
    'Invalid Key Format Check:' as check_type,
    COUNT(*) as invalid_keys,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS - All keys have valid format'
        ELSE 'FAIL - Invalid key formats found'
    END as status
FROM product_keys
WHERE product_key NOT LIKE 'chat_%' 
  AND product_key NOT LIKE 'sale_%'
  AND product_key NOT LIKE 'data_%'
  AND product_key NOT LIKE 'agnt_%';

-- Check for licenses without users
SELECT 
    'Orphaned Licenses Check:' as check_type,
    COUNT(*) as orphaned_licenses,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS - All licenses have users'
        ELSE 'WARNING - Licenses without users found'
    END as status
FROM licenses l
WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE u.license_key = l.license_key
);

-- 8. Summary statistics
SELECT 
    '=== SUMMARY STATISTICS ===' as section;

SELECT 
    (SELECT COUNT(*) FROM licenses) as total_licenses,
    (SELECT COUNT(*) FROM licenses WHERE status = 'active') as active_licenses,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM product_keys) as total_product_keys,
    (SELECT COUNT(DISTINCT license_key) FROM product_keys) as licenses_with_keys,
    (SELECT COUNT(*) FROM licenses WHERE site_key IS NOT NULL) as licenses_with_legacy_keys,
    (SELECT COUNT(*) FROM product_keys WHERE product = 'chatbot') as chatbot_keys,
    (SELECT COUNT(*) FROM product_keys WHERE product = 'sales-agent') as sales_keys,
    (SELECT COUNT(*) FROM product_keys WHERE product = 'data-enrichment') as data_keys,
    (SELECT COUNT(*) FROM product_keys WHERE product = 'setup-agent') as setup_keys;