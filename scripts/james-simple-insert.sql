-- Simple insert for James's license
INSERT INTO licenses (
  license_key,
  customer_name,
  email,
  status,
  subscription_status,
  products,
  pro_mode_enabled,
  created_at
) VALUES (
  'INTL-NW1S-QANW-2025',
  'James',
  'james@steppedin.uk',
  'active',
  'active',
  ARRAY['chatbot']::text[],
  false,
  CURRENT_TIMESTAMP
) ON CONFLICT (license_key) DO NOTHING;

-- Verify it was created
SELECT 
  license_key,
  customer_name,
  email,
  products,
  status,
  created_at
FROM licenses
WHERE license_key = 'INTL-NW1S-QANW-2025';