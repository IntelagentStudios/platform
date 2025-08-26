-- ============================================================
-- Purchase Transaction for james@steppedin.uk
-- Generated: August 26, 2025
-- Order: #ORD-2025-0826-001
-- ============================================================

BEGIN TRANSACTION;

-- 1. Insert the license
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
) VALUES (
  'INTL-NW1S-QANW-2025',
  'James',
  'james@steppedin.uk',
  'Stepped In',
  'active',
  'active',
  ARRAY['chatbot']::text[],
  false,
  jsonb_build_object(
    'type', 'purchase',
    'order_id', 'ORD-2025-0826-001',
    'purchase_date', '2025-08-26T16:17:53.968Z',
    'amount', 0.00,
    'currency', 'GBP',
    'promotion', 'friend_offer',
    'payment_method', 'complimentary',
    'ip_address', '86.155.241.93',
    'user_agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/127.0.0.0',
    'notes', 'Complimentary license for testing'
  ),
  CURRENT_TIMESTAMP,
  NULL,  -- Not used yet
  NULL   -- Never expires
) ON CONFLICT (license_key) DO NOTHING;

-- 2. Log the transaction
INSERT INTO setup_agent_logs (
  session_id,
  user_message,
  agent_response,
  domain,
  timestamp
) VALUES (
  'purchase_' || extract(epoch from now())::text,
  'Automatic purchase completion',
  'License INTL-NW1S-QANW-2025 generated for james@steppedin.uk',
  'steppedin.uk',
  CURRENT_TIMESTAMP
);

COMMIT;

-- Verify the license was created
SELECT 
  '✅ Purchase Complete' as status,
  license_key,
  customer_name,
  email,
  company_name,
  products,
  status as license_status,
  created_at,
  metadata->>'order_id' as order_id
FROM licenses
WHERE license_key = 'INTL-NW1S-QANW-2025';

-- Display summary
SELECT 
  E'\n' ||
  E'====================================\n' ||
  E'PURCHASE CONFIRMATION\n' ||
  E'====================================\n' ||
  E'Order ID: ORD-2025-0826-001\n' ||
  E'Customer: James (james@steppedin.uk)\n' ||
  E'Company: Stepped In\n' ||
  E'Product: AI Chatbot\n' ||
  E'License: INTL-NW1S-QANW-2025\n' ||
  E'Amount: £0.00 (Complimentary)\n' ||
  E'Status: Active\n' ||
  E'====================================\n' ||
  E'Email sent to: james@steppedin.uk\n' ||
  E'====================================\n'
  as purchase_summary;