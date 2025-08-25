-- Create test license for friend's business
INSERT INTO licenses (
  license_key,
  email,
  customer_name,
  products,
  status,
  plan,
  created_at
) VALUES (
  'INTL-8K3M-QB7X-2024',
  'friend@testbusiness.com',
  'Test Business Inc',
  ARRAY['chatbot'],
  'active',
  'starter',
  NOW()
)
ON CONFLICT (license_key) 
DO UPDATE SET
  email = EXCLUDED.email,
  customer_name = EXCLUDED.customer_name,
  products = EXCLUDED.products,
  status = EXCLUDED.status,
  plan = EXCLUDED.plan,
  used_at = NULL,
  site_key = NULL,
  domain = NULL;