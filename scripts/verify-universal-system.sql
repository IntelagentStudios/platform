-- Verify universal product status system
-- This query shows what each license should see in their dashboard

-- Show all licenses and their product configurations
SELECT 
  l.license_key,
  l.customer_name,
  l.email,
  l.products as license_products,
  l.site_key as legacy_site_key,
  COUNT(pk.id) as configured_products,
  STRING_AGG(pk.product || ':' || LEFT(pk.product_key, 8), ', ') as product_keys
FROM licenses l
LEFT JOIN product_keys pk ON l.license_key = pk.license_key AND pk.status = 'active'
WHERE l.status = 'active'
GROUP BY l.license_key, l.customer_name, l.email, l.products, l.site_key
ORDER BY l.created_at DESC;

-- Show which products need configuration for each license
SELECT 
  l.license_key,
  l.customer_name,
  product_list.product,
  CASE 
    WHEN pk.product_key IS NOT NULL THEN 'Configured (Show Manage)'
    ELSE 'Not Configured (Show Configure)'
  END as dashboard_status
FROM licenses l
CROSS JOIN LATERAL unnest(l.products) as product_list(product)
LEFT JOIN product_keys pk ON l.license_key = pk.license_key 
  AND pk.product = product_list.product 
  AND pk.status = 'active'
WHERE l.status = 'active'
ORDER BY l.license_key, product_list.product;