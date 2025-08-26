-- Clean up duplicate and old format product keys

-- 1. First, see all current keys
SELECT 
    license_key,
    product,
    product_key,
    created_at,
    CASE 
        WHEN product_key LIKE 'key_%' THEN 'OLD FORMAT - DELETE'
        WHEN product_key LIKE 'sk_%' THEN 'OLD FORMAT - DELETE'
        ELSE 'KEEP'
    END as action
FROM product_keys
ORDER BY license_key, product, created_at;

-- 2. Delete old format keys (key_ and sk_ prefixes)
DELETE FROM product_keys 
WHERE product_key LIKE 'key_%' 
   OR product_key LIKE 'sk_%';

-- 3. For each license/product combo, keep only the newest key
DELETE FROM product_keys pk1
WHERE EXISTS (
    SELECT 1 
    FROM product_keys pk2 
    WHERE pk1.license_key = pk2.license_key 
      AND pk1.product = pk2.product 
      AND pk1.created_at < pk2.created_at
);

-- 4. Show cleaned up results
SELECT 
    license_key,
    product,
    product_key,
    status
FROM product_keys
ORDER BY license_key, product;

-- 5. Now check what products still need keys
SELECT 
    l.license_key,
    l.customer_name,
    unnest(l.products) as product,
    'NEEDS KEY' as status
FROM licenses l
WHERE NOT EXISTS (
    SELECT 1 
    FROM product_keys pk 
    WHERE pk.license_key = l.license_key 
      AND pk.product = unnest(l.products)
)
ORDER BY l.license_key;