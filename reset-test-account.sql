-- Reset test account for friend
-- 1. Delete the test user account
DELETE FROM user_sessions WHERE user_id IN (SELECT id FROM users WHERE email = 'testuser@example.com');
DELETE FROM users WHERE email = 'testuser@example.com';

-- 2. Reset the license to unused state
UPDATE licenses 
SET 
  used_at = NULL,
  site_key = NULL,
  domain = NULL
WHERE license_key = 'TEST-CHAT-BOT1-2024';