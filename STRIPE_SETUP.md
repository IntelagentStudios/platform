# Stripe API Keys Configuration

## Your LIVE Keys (STORE SECURELY)
```
Publishable Key: pk_live_[YOUR_PUBLISHABLE_KEY]
Secret Key: sk_live_[YOUR_SECRET_KEY]
```
⚠️ **IMPORTANT**: Store these keys securely and only add them via Railway's environment variables UI.

⚠️ **IMPORTANT**: These are LIVE keys - real money will be processed!

## Railway Environment Variables to Set

### Admin Portal
In Railway dashboard for admin-portal service, add these environment variables:

```env
STRIPE_SECRET_KEY=sk_live_[YOUR_SECRET_KEY]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[YOUR_PUBLISHABLE_KEY]
```

### Customer Portal (if needed)
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[YOUR_PUBLISHABLE_KEY]
```

## Webhook Setup

1. Go to Stripe Dashboard: https://dashboard.stripe.com/webhooks (LIVE mode, not test!)
2. Click "Add endpoint"
3. Enter endpoint URL: `https://your-admin-portal.railway.app/api/webhooks/stripe`
4. Select events:
   - customer.subscription.created
   - customer.subscription.updated  
   - customer.subscription.deleted
   - invoice.payment_succeeded
   - invoice.payment_failed
5. After creating, copy the "Signing secret" (starts with `whsec_`)
6. Add to Railway environment:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
   ```

## Test the Integration

Once configured, test with:
```bash
curl https://your-admin-portal.railway.app/api/financial/metrics
```

This should now return real Stripe data instead of mock data.