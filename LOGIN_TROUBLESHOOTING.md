# Login Troubleshooting Guide

## Your License Keys

1. **Master Admin Key**: `INTL-MSTR-ADMN-PASS` (with hyphens, not underscores!)
   - This gives full admin access
   - Doesn't need to be in the database
   - Must match the `MASTER_LICENSE_KEY` environment variable in Railway

2. **Personal License**: `INTL-M0L9-TLN0-1QZ5`
   - This needs to be inserted into the database
   - Must have status = 'active'

## Quick Fix Steps

### 1. Check Railway Environment Variables
Make sure these are set in BOTH admin-portal and customer-portal services:
```
MASTER_LICENSE_KEY=INTL-MSTR-ADMN-PASS
JWT_SECRET=xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS
DATABASE_URL=postgresql://...your-railway-database-url...
```

### 2. Test Master Admin Login
Try logging in with:
- License Key: `INTL-MSTR-ADMN-PASS`
- Domain: `admin.intelagent.com` (or any domain for master)

### 3. Insert Your Personal License
Connect to your Railway PostgreSQL database and run:

```sql
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
  NULL,  -- NULL domain allows any domain
  'active',
  'enterprise',
  ARRAY['chatbot', 'setup_agent', 'email_assistant', 'voice_assistant', 'analytics'],
  NOW()
) ON CONFLICT (license_key) DO UPDATE
SET status = 'active',
    domain = NULL;  -- Allow any domain
```

### 4. Test Personal License Login
Try logging in with:
- License Key: `INTL-M0L9-TLN0-1QZ5`
- Domain: Your actual domain

## Common Issues

### "Invalid license key" Error
- License doesn't exist in database
- License status is not 'active'
- Typo in the license key

### "Domain does not match license" Error
- The domain in the database doesn't match what you're entering
- Solution: Set domain to NULL in database to allow any domain

### Can't login with master key
- Environment variable `MASTER_LICENSE_KEY` not set in Railway
- Using underscores instead of hyphens
- Railway deployment hasn't picked up the environment variable (redeploy needed)

## Debug via API

Test the login endpoint directly:

```bash
curl -X POST https://your-customer-portal.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "license_key": "INTL-MSTR-ADMN-PASS",
    "domain": "test.com",
    "rememberMe": true
  }'
```

Expected response:
```json
{
  "success": true,
  "isMaster": true,
  "customer_name": "Master Admin"
}
```

## Direct Database Check

Use Railway's database UI or connect via psql to run:

```sql
-- Check if your license exists and is active
SELECT * FROM licenses WHERE license_key = 'INTL-M0L9-TLN0-1QZ5';

-- Check all licenses
SELECT license_key, status, domain, created_at FROM licenses;
```

## Emergency Access

If nothing works, temporarily update the code to bypass authentication:
1. SSH into Railway service
2. Set a temporary bypass flag
3. Login and fix the issue
4. Remove the bypass

Or use the Railway PostgreSQL UI to directly insert/update licenses.