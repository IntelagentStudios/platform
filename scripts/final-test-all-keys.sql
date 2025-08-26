-- Final comprehensive test to verify everything is set up correctly
-- Run this to confirm your product key system is fully operational

-- 1. OVERALL SYSTEM HEALTH CHECK
SELECT '=== SYSTEM HEALTH CHECK ===' as test_section;

WITH health_checks AS (
    -- Check for old format keys
    SELECT 
        'Old Format Keys' as check_name,
        COUNT(*) as issue_count,
        CASE 
            WHEN COUNT(*) = 0 THEN '✅ PASS - No old format keys'
            ELSE '❌ FAIL - Old format keys found: ' || COUNT(*)
        END as status
    FROM product_keys
    WHERE product_key LIKE 'key_%' 
       OR product_key LIKE 'sk_%'
    
    UNION ALL
    
    -- Check for duplicate keys per license/product
    SELECT 
        'Duplicate Keys' as check_name,
        COUNT(*) as issue_count,
        CASE 
            WHEN COUNT(*) = 0 THEN '✅ PASS - No duplicates'
            ELSE '❌ FAIL - Duplicates found: ' || COUNT(*)
        END as status
    FROM (
        SELECT license_key, product, COUNT(*) 
        FROM product_keys 
        GROUP BY license_key, product 
        HAVING COUNT(*) > 1
    ) dupes
    
    UNION ALL
    
    -- Check for legacy site_keys
    SELECT 
        'Legacy site_keys' as check_name,
        COUNT(*) as issue_count,
        CASE 
            WHEN COUNT(*) = 0 THEN '✅ PASS - No legacy site_keys'
            ELSE '⚠️  WARNING - Legacy site_keys found: ' || COUNT(*)
        END as status
    FROM licenses
    WHERE site_key IS NOT NULL
    
    UNION ALL
    
    -- Check key format validity
    SELECT 
        'Invalid Key Formats' as check_name,
        COUNT(*) as issue_count,
        CASE 
            WHEN COUNT(*) = 0 THEN '✅ PASS - All keys have valid format'
            ELSE '❌ FAIL - Invalid formats found: ' || COUNT(*)
        END as status
    FROM product_keys
    WHERE product_key NOT LIKE 'chat_%' 
      AND product_key NOT LIKE 'sale_%'
      AND product_key NOT LIKE 'data_%'
      AND product_key NOT LIKE 'agnt_%'
      AND product_key NOT LIKE 'pro_%'
      AND product_key NOT LIKE 'admn_%'
)
SELECT * FROM health_checks;

-- 2. LICENSE AND PRODUCT KEY SUMMARY
SELECT '=== LICENSE SUMMARY ===' as test_section;

SELECT 
    l.license_key,
    l.customer_name,
    l.is_pro,
    l.status as license_status,
    array_length(l.products, 1) as products_purchased,
    COUNT(pk.product_key) as keys_configured,
    CASE 
        WHEN array_length(l.products, 1) = COUNT(pk.product_key) THEN '✅ Complete'
        WHEN COUNT(pk.product_key) = 0 THEN '❌ No keys'
        ELSE '⚠️  Partial (' || COUNT(pk.product_key) || '/' || array_length(l.products, 1) || ')'
    END as setup_status
FROM licenses l
LEFT JOIN product_keys pk ON pk.license_key = l.license_key 
    AND pk.product != 'pro-platform' -- Don't count pro keys in product count
GROUP BY l.license_key, l.customer_name, l.is_pro, l.status, l.products
ORDER BY l.customer_name, l.license_key;

-- 3. DETAILED PRODUCT KEY BREAKDOWN
SELECT '=== PRODUCT KEY DETAILS ===' as test_section;

SELECT 
    pk.license_key,
    pk.product,
    pk.product_key,
    pk.status,
    CASE 
        WHEN pk.product = 'chatbot' AND pk.product_key LIKE 'chat_%' THEN '✅ Correct'
        WHEN pk.product = 'sales-agent' AND pk.product_key LIKE 'sale_%' THEN '✅ Correct'
        WHEN pk.product = 'data-enrichment' AND pk.product_key LIKE 'data_%' THEN '✅ Correct'
        WHEN pk.product = 'setup-agent' AND pk.product_key LIKE 'agnt_%' THEN '✅ Correct'
        WHEN pk.product = 'pro-platform' AND pk.product_key LIKE 'pro_%' THEN '✅ Correct'
        WHEN pk.product = 'admin_panel' AND pk.product_key LIKE 'admn_%' THEN '✅ Correct'
        ELSE '❌ Wrong prefix'
    END as format_check,
    date_trunc('day', pk.created_at) as created_date
FROM product_keys pk
ORDER BY pk.license_key, pk.product;

-- 4. MISSING PRODUCT KEYS (if any)
SELECT '=== MISSING KEYS CHECK ===' as test_section;

WITH expected_keys AS (
    SELECT 
        l.license_key,
        l.customer_name,
        unnest(l.products) as product
    FROM licenses l
    WHERE l.products IS NOT NULL AND array_length(l.products, 1) > 0
)
SELECT 
    ek.license_key,
    ek.customer_name,
    ek.product,
    CASE 
        WHEN pk.product_key IS NULL THEN '❌ MISSING KEY'
        ELSE '✅ Has key: ' || left(pk.product_key, 20)
    END as status
FROM expected_keys ek
LEFT JOIN product_keys pk ON pk.license_key = ek.license_key AND pk.product = ek.product
WHERE pk.product_key IS NULL
ORDER BY ek.license_key, ek.product;

-- 5. FINAL STATISTICS
SELECT '=== FINAL STATISTICS ===' as test_section;

SELECT 
    (SELECT COUNT(DISTINCT license_key) FROM licenses WHERE status = 'active') as active_licenses,
    (SELECT COUNT(DISTINCT license_key) FROM product_keys) as licenses_with_keys,
    (SELECT COUNT(*) FROM product_keys) as total_product_keys,
    (SELECT COUNT(*) FROM product_keys WHERE product = 'chatbot') as chatbot_keys,
    (SELECT COUNT(*) FROM product_keys WHERE product = 'sales-agent') as sales_agent_keys,
    (SELECT COUNT(*) FROM product_keys WHERE product = 'data-enrichment') as data_enrichment_keys,
    (SELECT COUNT(*) FROM product_keys WHERE product = 'setup-agent') as setup_agent_keys,
    (SELECT COUNT(*) FROM product_keys WHERE product = 'pro-platform') as pro_platform_keys,
    (SELECT COUNT(*) FROM licenses WHERE site_key IS NOT NULL) as legacy_site_keys_remaining;

-- 6. READY FOR PRODUCTION CHECK
SELECT '=== PRODUCTION READINESS ===' as test_section;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM product_keys WHERE product_key LIKE 'key_%' OR product_key LIKE 'sk_%') = 0
         AND (SELECT COUNT(*) FROM licenses WHERE site_key IS NOT NULL) = 0
         AND (SELECT COUNT(*) FROM (SELECT license_key, product FROM product_keys GROUP BY license_key, product HAVING COUNT(*) > 1) dupes) = 0
        THEN '🎉 READY FOR PRODUCTION - All checks passed!'
        ELSE '⚠️  NOT READY - Issues found above need fixing'
    END as production_status;