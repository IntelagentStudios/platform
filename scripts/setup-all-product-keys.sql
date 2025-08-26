-- Setup product keys for all existing licenses
-- This will create proper product keys for all purchased products

-- 1. First, let's see what we're working with
SELECT 
    license_key,
    customer_name,
    products,
    site_key
FROM licenses
ORDER BY license_key;

-- 2. Create chatbot keys for all licenses that have 'chatbot' product
INSERT INTO product_keys (license_key, product, product_key, status, created_at)
SELECT 
    l.license_key,
    'chatbot',
    'chat_' || substr(md5(random()::text || l.license_key), 1, 16),
    'active',
    now()
FROM licenses l
WHERE 'chatbot' = ANY(l.products)
  AND NOT EXISTS (
      SELECT 1 FROM product_keys pk 
      WHERE pk.license_key = l.license_key 
      AND pk.product = 'chatbot'
  );

-- 3. Create sales-agent keys for licenses with that product
INSERT INTO product_keys (license_key, product, product_key, status, created_at)
SELECT 
    l.license_key,
    'sales-agent',
    'sale_' || substr(md5(random()::text || l.license_key), 1, 16),
    'active',
    now()
FROM licenses l
WHERE 'sales_agent' = ANY(l.products) OR 'sales-agent' = ANY(l.products)
  AND NOT EXISTS (
      SELECT 1 FROM product_keys pk 
      WHERE pk.license_key = l.license_key 
      AND pk.product = 'sales-agent'
  );

-- 4. Create setup-agent keys
INSERT INTO product_keys (license_key, product, product_key, status, created_at)
SELECT 
    l.license_key,
    'setup-agent',
    'agnt_' || substr(md5(random()::text || l.license_key), 1, 16),
    'active',
    now()
FROM licenses l
WHERE 'setup_agent' = ANY(l.products) OR 'setup-agent' = ANY(l.products)
  AND NOT EXISTS (
      SELECT 1 FROM product_keys pk 
      WHERE pk.license_key = l.license_key 
      AND pk.product = 'setup-agent'
  );

-- 5. Create data-enrichment keys (handling both 'enrichment' and 'data-enrichment')
INSERT INTO product_keys (license_key, product, product_key, status, created_at)
SELECT 
    l.license_key,
    'data-enrichment',
    'data_' || substr(md5(random()::text || l.license_key), 1, 16),
    'active',
    now()
FROM licenses l
WHERE ('enrichment' = ANY(l.products) OR 'data-enrichment' = ANY(l.products))
  AND NOT EXISTS (
      SELECT 1 FROM product_keys pk 
      WHERE pk.license_key = l.license_key 
      AND pk.product = 'data-enrichment'
  );

-- 6. Clear all legacy site_keys now that we have product keys
UPDATE licenses SET site_key = NULL WHERE site_key IS NOT NULL;

-- 7. Show the results
SELECT 
    l.license_key,
    l.customer_name,
    l.products as purchased_products,
    array_agg(
        pk.product || ': ' || pk.product_key 
        ORDER BY pk.product
    ) as configured_keys
FROM licenses l
LEFT JOIN product_keys pk ON pk.license_key = l.license_key
GROUP BY l.license_key, l.customer_name, l.products
ORDER BY l.license_key;