-- Delete all data associated with the friend's test license
-- This will cascade delete user accounts and related data

-- 1. Delete any users registered with this license
DELETE FROM users WHERE license_key = 'INTL-8K3M-QB7X-2024';

-- 2. Delete any chatbot configs
DELETE FROM chatbot_config WHERE license_key = 'INTL-8K3M-QB7X-2024';

-- 3. Delete any audit logs
DELETE FROM audit_logs WHERE license_key = 'INTL-8K3M-QB7X-2024';

-- 4. Delete the license itself
DELETE FROM licenses WHERE license_key = 'INTL-8K3M-QB7X-2024';

-- 5. Create fresh license with new key
INSERT INTO licenses (
  license_key,
  email,
  customer_name,
  products,
  status,
  plan,
  created_at
) VALUES (
  'INTL-9P4K-NC8Z-2024',  -- New professional key
  'friend@business.com',   -- Update to their real email
  'Friend Business Name',  -- Update to their real business
  ARRAY['chatbot'],
  'active',
  'starter',
  NOW()
);