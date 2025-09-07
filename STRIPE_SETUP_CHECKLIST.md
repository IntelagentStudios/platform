# 🚀 Stripe Setup Checklist

## Prerequisites
- [ ] Stripe account (create at https://stripe.com)
- [ ] Access to Stripe Dashboard
- [ ] Node.js installed locally

## Step 1: Get Your Stripe Keys
1. Go to https://dashboard.stripe.com/apikeys
2. Copy your keys:
   - **Test Mode** (for initial setup):
     - Publishable key: `pk_test_...`
     - Secret key: `sk_test_...`
   - **Live Mode** (for production):
     - Publishable key: `pk_live_...`
     - Secret key: `sk_live_...`

## Step 2: Add Keys to Environment
Add these to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE

# After webhook setup (Step 4)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

## Step 3: Create Products & Prices
Run the setup script:
```bash
cd C:\Projects\Intelagent Platform
node scripts/setup-stripe-products.js
```

This will output price IDs. Add them to `.env`:
```env
# Stripe Price IDs
STRIPE_PRICE_STARTER_MONTHLY=price_xxx
STRIPE_PRICE_STARTER_ANNUAL=price_xxx
STRIPE_PRICE_PRO_MONTHLY=price_xxx
STRIPE_PRICE_PRO_ANNUAL=price_xxx
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxx
STRIPE_PRICE_ENTERPRISE_ANNUAL=price_xxx
STRIPE_PRICE_EXTRA_CHATBOT=price_xxx
STRIPE_PRICE_SALES_AGENT=price_xxx
STRIPE_PRICE_ENRICHMENT_CREDITS=price_xxx
```

## Step 4: Configure Webhook
1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter endpoint URL:
   - **Local testing**: Use Stripe CLI
   - **Production**: `https://dashboard.intelagentstudios.com/api/stripe/webhook`
4. Select events:
   - [x] checkout.session.completed
   - [x] customer.subscription.created
   - [x] customer.subscription.updated
   - [x] customer.subscription.deleted
   - [x] invoice.payment_succeeded
   - [x] invoice.payment_failed
5. Copy the signing secret: `whsec_...`
6. Add to `.env` as `STRIPE_WEBHOOK_SECRET`

## Step 5: Update Database
Run migrations to add Stripe fields:
```bash
cd packages/database
npx prisma db push
```

## Step 6: Test the Integration

### Test Checkout Flow:
1. Visit `/marketplace`
2. Select a plan
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout
5. Verify:
   - [ ] Success page shows
   - [ ] License created in database
   - [ ] User account created (if guest)
   - [ ] Webhook received

### Test Billing Dashboard:
1. Login to admin dashboard
2. Go to `/admin/billing`
3. Verify you can see:
   - [ ] Subscription details
   - [ ] Payment methods
   - [ ] Invoice history

## Step 7: Deploy to Production
1. Update Railway environment variables
2. Switch to live Stripe keys
3. Update webhook URL to production domain
4. Test with real payment

## Quick Commands

### Local Webhook Testing:
```bash
# Install Stripe CLI
npm install -g stripe

# Forward webhooks to local
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### View Stripe Logs:
```bash
stripe logs tail
```

### Test Webhook Manually:
```bash
stripe trigger checkout.session.completed
```

## Troubleshooting

### Webhook Not Receiving Events
- Check webhook secret is correct
- Verify endpoint URL is accessible
- Check Stripe Dashboard webhook logs

### License Not Created
- Check database connection
- Verify user creation logic
- Check webhook handler logs

### Payment Failing
- Ensure products/prices exist
- Check API keys are correct
- Verify checkout session parameters

## Support
- Stripe Support: https://support.stripe.com
- API Docs: https://stripe.com/docs
- Dashboard: https://dashboard.stripe.com