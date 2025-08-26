-- Check if Harry's license has a site_key
SELECT 
  license_key,
  email,
  site_key,
  products,
  status
FROM licenses
WHERE license_key = 'INTL-AGNT-BOSS-MODE'
   OR email = 'harry@intelagentstudios.com';