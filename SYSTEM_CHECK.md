# Intelagent Platform - System Check & Migration Guide

## System Health Check Results

### 1. Database Schema ✅
- PostgreSQL schema using snake_case convention (fixed)
- Prisma models properly mapped to database columns
- Relations between licenses and chatbot_logs established

### 2. Build Status ✅
- Customer Portal: Successfully deployed
- Admin Portal: Successfully deployed
- All Prisma field naming issues resolved

### 3. Files to Clean (Run cleanup.bat)
- `.next` folders: ~558MB (can be rebuilt with `npm run build`)
- `.turbo` cache folders
- Log files in enrichment service
- Duplicate folders: Dashboard, Intelagent Sales Agent

## License & Site Key Migration

### Current Database Structure
```sql
-- Licenses table
licenses (
  license_key VARCHAR(20) PRIMARY KEY,
  site_key VARCHAR(255) UNIQUE,
  email VARCHAR(255),
  customer_name VARCHAR(255),
  domain VARCHAR(255),
  status VARCHAR(20),
  plan VARCHAR(50),
  products TEXT[],
  ...
)

-- Chatbot logs linked via site_key
chatbot_logs (
  site_key VARCHAR(255) REFERENCES licenses(site_key),
  session_id VARCHAR(255),
  ...
)
```

### Migration Steps for Existing Licenses

If you have existing licenses from a previous database, you need to:

1. **Export existing licenses** from old database:
```sql
-- From old database
SELECT license_key, site_key, email, customer_name, domain, status, plan, products
FROM licenses
WHERE status IN ('active', 'trial');
```

2. **Import to new Railway database**:
```sql
-- To new Railway database
INSERT INTO licenses (
  license_key, site_key, email, customer_name, 
  domain, status, plan, products, created_at
) VALUES (
  'YOUR-LICENSE-KEY', 
  'YOUR-SITE-KEY',
  'customer@email.com',
  'Customer Name',
  'customer-domain.com',
  'active',
  'pro',
  ARRAY['chatbot', 'setup_agent'],
  NOW()
);
```

3. **Generate new master license** for admin access:
```javascript
// The master license is configured in environment variables
MASTER_LICENSE_KEY=INTL-MSTR-ADMN-PASS
```

## Environment Variables Checklist

### Required for Railway Deployment

#### Admin Portal (.env)
- [x] DATABASE_URL - PostgreSQL connection string
- [x] JWT_SECRET - Secret for JWT tokens
- [x] MASTER_LICENSE_KEY - Master admin license
- [ ] STRIPE_SECRET_KEY - Stripe API key (currently using placeholder)
- [ ] STRIPE_WEBHOOK_SECRET - For Stripe webhooks
- [ ] NEXTAUTH_URL - Your admin portal URL
- [ ] NEXTAUTH_SECRET - NextAuth secret

#### Customer Portal (.env)
- [x] DATABASE_URL - Same PostgreSQL connection
- [x] JWT_SECRET - Same as admin portal
- [x] MASTER_LICENSE_KEY - Same as admin portal
- [ ] NEXT_PUBLIC_API_URL - API endpoint URL

## API Endpoints to Test

### Customer Portal
- `/api/health` - Health check
- `/api/auth/login` - Authentication
- `/api/dashboard/licenses` - License management
- `/api/analytics/overview` - Analytics data

### Admin Portal
- `/api/auth/me` - Current user
- `/api/dashboard/stats` - Statistics
- `/api/financial/metrics` - Financial data (requires Stripe)

## Quick Test Commands

```bash
# Test customer portal health
curl https://your-customer-portal.railway.app/api/health

# Test admin portal health  
curl https://your-admin-portal.railway.app/api/health

# Check database connection (run locally)
npx prisma db pull
npx prisma studio
```

## Stripe Webhook Configuration

1. Go to Stripe Dashboard > Webhooks
2. Add endpoint: `https://your-admin-portal.railway.app/api/webhooks/stripe`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET` env var

## Recommended Actions

1. **Run cleanup.bat** to remove ~600MB of build artifacts
2. **Set up Stripe keys** if using payment processing
3. **Migrate existing licenses** if you have any from old database
4. **Test authentication** with master license key
5. **Monitor Railway logs** for any runtime errors

## Support Contacts

- Railway Dashboard: Check deployment logs
- Database: Use Prisma Studio for direct database access
- Monitoring: Set up error tracking (Sentry recommended)