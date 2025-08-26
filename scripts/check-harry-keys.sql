-- Check Harry's license and product keys
SELECT 
  l.license_key,
  l.email,
  l.products,
  l.status as license_status,
  pk.product,
  pk.product_key,
  pk.status as key_status,
  pk.metadata
FROM licenses l
LEFT JOIN product_keys pk ON l.license_key = pk.license_key
WHERE l.license_key = 'INTL-AGNT-BOSS-MODE'
   OR l.email = 'harry@intelagentstudios.com'
ORDER BY pk.created_at DESC;