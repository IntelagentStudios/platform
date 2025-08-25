-- Check if test user exists
SELECT id, email, license_key, role, created_at 
FROM users 
WHERE email = 'test@friend.com';