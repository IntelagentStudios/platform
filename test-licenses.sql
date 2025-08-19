-- Test SQL to check and insert licenses
-- Run this in your Railway PostgreSQL database

-- Check if licenses exist
SELECT license_key, customer_name, domain, status, created_at 
FROM licenses 
WHERE license_key IN ('INTL-M0L9-TLN0-1QZ5', 'INTL-MSTR-ADMN-PASS');

-- If your personal license doesn't exist, insert it:
INSERT INTO licenses (
  license_key, 
  customer_name, 
  email,
  domain, 
  status, 
  plan,
  products,
  created_at
) VALUES (
  'INTL-M0L9-TLN0-1QZ5',
  'Your Name',
  'your-email@example.com',
  'your-domain.com',  -- Replace with your actual domain
  'active',
  'enterprise',
  ARRAY['chatbot', 'setup_agent', 'email_assistant', 'voice_assistant', 'analytics'],
  NOW()
) ON CONFLICT (license_key) DO UPDATE
SET status = 'active',
    plan = 'enterprise';

-- The master license doesn't need to be in the database
-- It's checked directly against the environment variable