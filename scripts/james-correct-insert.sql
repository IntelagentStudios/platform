-- Insert James's license with only the actual columns
INSERT INTO licenses (
  license_key,
  customer_name,
  email,
  products,
  status,
  subscription_status,
  created_at
) VALUES (
  'INTL-NW1S-QANW-2025',
  'James',
  'james@steppedin.uk',
  ARRAY['chatbot']::text[],
  'active',
  'active',
  CURRENT_TIMESTAMP
) ON CONFLICT (license_key) DO NOTHING;

-- Verify it was created
SELECT 
  license_key,
  customer_name,
  email,
  products,
  status,
  subscription_status,
  created_at
FROM licenses
WHERE license_key = 'INTL-NW1S-QANW-2025';