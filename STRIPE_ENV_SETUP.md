# Stripe Environment Setup Guide

## Required Environment Variables

Add these to your `.env` file in the root directory:

```env
# Stripe Configuration (Required)
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Stripe Price IDs (After running setup script)
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

## How to Get Your Keys

1. **Test Keys (for development)**:
   - Go to https://dashboard.stripe.com/test/apikeys
   - Copy the "Secret key" (starts with `sk_test_`)
   - Copy the "Publishable key" (starts with `pk_test_`)

2. **Live Keys (for production)**:
   - Go to https://dashboard.stripe.com/apikeys
   - Copy the "Secret key" (starts with `sk_live_`)
   - Copy the "Publishable key" (starts with `pk_live_`)

3. **Webhook Secret**:
   - Go to https://dashboard.stripe.com/webhooks
   - Create a new endpoint or select existing
   - Copy the "Signing secret" (starts with `whsec_`)

## Quick Setup Steps

1. Copy the test keys from Stripe Dashboard
2. Add them to your `.env` file
3. Run the setup script to create products:
   ```bash
   node scripts/setup-stripe-products.js
   ```
4. Copy the generated price IDs to your `.env` file
5. Test the payment flow:
   ```bash
   node scripts/test-payment-flow.js
   ```

## Verification

To verify your setup is complete:

```bash
# Check environment variables
node -e "console.log('Stripe key:', process.env.STRIPE_SECRET_KEY ? '✅ Found' : '❌ Missing')"

# Test Stripe connection
node -e "const s = require('stripe')(process.env.STRIPE_SECRET_KEY); s.accounts.retrieve().then(() => console.log('✅ Connected')).catch(e => console.log('❌', e.message))"
```

## Troubleshooting

If you see "STRIPE_SECRET_KEY not found":
1. Make sure `.env` file exists in the root directory
2. Verify the key is added with correct format: `STRIPE_SECRET_KEY=sk_test_...`
3. No quotes around the value
4. Restart your development server after adding keys

## Security Notes

- Never commit `.env` file to version control
- Use test keys for development, live keys for production
- Keep webhook secret secure - it verifies webhooks are from Stripe
- Rotate keys regularly for security