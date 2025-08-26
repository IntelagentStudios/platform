-- Create a free chatbot license for testing
-- This script generates a new license with chatbot product only

-- Generate license key in format INTL-XXXX-XXXX-2024
-- Using a special prefix to identify friend/test licenses
WITH new_license AS (
  SELECT 
    'INTL-FR3E-CH4T-2024' as license_key,  -- FR3E = FREE, CH4T = CHAT
    'Your Friend Name' as customer_name,    -- UPDATE THIS
    'friend@example.com' as email,          -- UPDATE THIS
    'Intelagent Platform' as company_name,
    'active' as status,
    'active' as subscription_status,
    ARRAY['chatbot']::text[] as products,   -- Only chatbot product
    false as pro_mode_enabled,
    jsonb_build_object(
      'type', 'free_trial',
      'generated_by', 'admin',
      'purpose', 'friend_testing',
      'created_date', CURRENT_TIMESTAMP
    ) as metadata,
    CURRENT_TIMESTAMP as created_at,
    NULL as used_at,
    NULL as expires_at  -- No expiration for friend license
)
-- First check if license already exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM licenses WHERE license_key = 'INTL-FR3E-CH4T-2024')
    THEN 'License already exists - skipping creation'
    ELSE 'Creating new license'
  END as status;

-- Insert the license only if it doesn't exist
INSERT INTO licenses (
  license_key,
  customer_name,
  email,
  company_name,
  status,
  subscription_status,
  products,
  pro_mode_enabled,
  metadata,
  created_at,
  used_at,
  expires_at
)
SELECT 
  'INTL-FR3E-CH4T-2024',
  'Your Friend Name',     -- UPDATE THIS with actual name
  'friend@example.com',   -- UPDATE THIS with actual email
  'Friend Company',       -- UPDATE THIS with company or use personal
  'active',
  'active',
  ARRAY['chatbot']::text[],
  false,
  jsonb_build_object(
    'type', 'free_trial',
    'generated_by', 'admin',
    'purpose', 'friend_testing',
    'created_date', CURRENT_TIMESTAMP,
    'notes', 'Free license for friend to test chatbot'
  ),
  CURRENT_TIMESTAMP,
  NULL,
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM licenses WHERE license_key = 'INTL-FR3E-CH4T-2024'
);

-- Verify the license was created
SELECT 
  license_key,
  customer_name,
  email,
  products,
  status,
  pro_mode_enabled,
  created_at
FROM licenses
WHERE license_key = 'INTL-FR3E-CH4T-2024';