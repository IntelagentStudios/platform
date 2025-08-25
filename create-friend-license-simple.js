// Simple script to create the friend's license
// Run this AFTER deploying to Railway to insert into production database

const licenseKey = 'INTL-8K3M-QB7X-2024';
const email = 'friend@testbusiness.com';
const businessName = 'Test Business Inc';

console.log('Copy and run this SQL in your Railway PostgreSQL console:\n');
console.log('==================================================\n');

const sql = `
-- Check if license exists
SELECT * FROM licenses WHERE license_key = '${licenseKey}';

-- If it doesn't exist, run this INSERT:
INSERT INTO licenses (
  license_key,
  email,
  customer_name,
  products,
  status,
  plan,
  created_at,
  expires_at
) VALUES (
  '${licenseKey}',
  '${email}',
  '${businessName}',
  ARRAY['chatbot'],
  'active',
  'starter',
  NOW(),
  NOW() + INTERVAL '1 year'
)
ON CONFLICT (license_key) 
DO UPDATE SET
  email = EXCLUDED.email,
  customer_name = EXCLUDED.customer_name,
  products = EXCLUDED.products,
  status = EXCLUDED.status,
  plan = EXCLUDED.plan;

-- Verify it was created:
SELECT license_key, email, status, plan, products FROM licenses WHERE license_key = '${licenseKey}';
`;

console.log(sql);
console.log('\n==================================================');
console.log('\nHow to run this:');
console.log('1. Go to Railway dashboard');
console.log('2. Click on your PostgreSQL service');
console.log('3. Go to the "Data" tab');
console.log('4. Click "Query"');
console.log('5. Paste the SQL above and run it');
console.log('\nOr use Railway CLI:');
console.log('railway run psql $DATABASE_URL');