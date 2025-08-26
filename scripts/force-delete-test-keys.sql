-- FORCE DELETE all product keys for test account
-- This will completely remove ALL keys and check for any auto-creation issues

-- 1. First, show what we're about to delete
SELECT 
    '=== KEYS TO BE DELETED ===' as section;

SELECT 
    id,
    license_key,
    product,
    product_key,
    status,
    created_at
FROM product_keys
WHERE license_key = 'INTL-8K3M-QB7X-2024';

-- 2. Delete ALL product keys for this license
DELETE FROM product_keys 
WHERE license_key = 'INTL-8K3M-QB7X-2024';

-- 3. Also clear any site_key from licenses table
UPDATE licenses 
SET site_key = NULL 
WHERE license_key = 'INTL-8K3M-QB7X-2024';

-- 4. Verify deletion
SELECT 
    '=== AFTER DELETION CHECK ===' as section;

SELECT 
    COUNT(*) as remaining_keys,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCCESS: All keys deleted'
        ELSE '❌ FAILED: Keys still exist'
    END as status
FROM product_keys
WHERE license_key = 'INTL-8K3M-QB7X-2024';

-- 5. Check if there are any database triggers that might recreate keys
SELECT 
    '=== DATABASE TRIGGERS CHECK ===' as section;

SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid IN ('product_keys'::regclass, 'licenses'::regclass)
   OR tgname LIKE '%product%' 
   OR tgname LIKE '%key%';

-- 6. Check for any default values or constraints
SELECT 
    '=== COLUMN DEFAULTS CHECK ===' as section;

SELECT 
    table_name,
    column_name,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('product_keys', 'licenses')
  AND column_default IS NOT NULL;