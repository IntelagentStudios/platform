-- Check all users in the system
SELECT 
  id,
  email,
  license_key,
  name,
  role,
  email_verified,
  created_at,
  LENGTH(password_hash) as pw_hash_length
FROM users
ORDER BY created_at DESC;