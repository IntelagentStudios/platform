# Stripe Integration Setup Guide

## Overview
The Intelagent Platform now has a fully integrated marketplace with Stripe payments, automatic license provisioning, and subscription management.

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
cd apps/customer-portal
npm install stripe @stripe/stripe-js
```

### 2. Set Environment Variables
Add these to your `.env` file or Railway environment:

```env
# Stripe API Keys (get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY

# After setting up webhook (step 4)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Application URL
NEXT_PUBLIC_APP_URL=https://dashboard.intelagentstudios.com
```

### 3. Run Database Migrations
```bash
npx prisma db push
```

### 4. Create Stripe Products
Run the setup script to create all products and prices:
```bash
node scripts/setup-stripe-products.js
```

This will output price IDs - add them to your environment variables:
```env
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

### 5. Configure Webhook
In Stripe Dashboard:
1. Go to **Developers → Webhooks**
2. Click **Add endpoint**
3. Enter URL: `https://dashboard.intelagentstudios.com/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the signing secret and add to env as `STRIPE_WEBHOOK_SECRET`

## 📦 Features Implemented

### Public Marketplace (`/marketplace`)
- ✅ Tiered pricing (Starter, Professional, Enterprise)
- ✅ Monthly/Annual billing toggle
- ✅ Add-on products
- ✅ Guest checkout (creates account on purchase)
- ✅ Member checkout (uses existing account)

### Checkout Flow
- ✅ Stripe Checkout integration
- ✅ Automatic customer creation
- ✅ Success page with order details
- ✅ License key display

### Billing Dashboard (`/dashboard/billing`)
- ✅ Current subscription display
- ✅ Payment method management
- ✅ Invoice history with downloads
- ✅ Upgrade/downgrade via Stripe Portal

### Webhook Processing
- ✅ Automatic license creation on payment
- ✅ Product key generation based on tier
- ✅ User account creation for guests
- ✅ Subscription status updates
- ✅ Payment failure handling

### Email Notifications
- ✅ Welcome email for new users
- ✅ Temporary password generation
- ✅ Password reset links
- ✅ License key delivery

## 🔄 Customer Journey

### New Customer (Guest)
1. Browse `/marketplace` without login
2. Select plan and click purchase
3. Complete Stripe Checkout
4. Account automatically created
5. Receive welcome email with credentials
6. Redirect to success page
7. Set password and start using platform

### Existing Customer
1. Browse `/marketplace` while logged in
2. Select upgrade/add-on
3. Complete Stripe Checkout (pre-filled)
4. License automatically updated
5. Redirect to success page
6. New features immediately available

## 📊 Tier Configuration

### Starter (£299/month)
- 1 AI Chatbot
- 10,000 messages/month
- Basic analytics

### Professional (£799/month)
- 3 AI Chatbots
- 50,000 messages/month
- Sales Agent included
- Data enrichment (1,000 credits)

### Enterprise (Custom pricing)
- Unlimited chatbots
- Unlimited messages
- All features included
- White-label options

## 🧪 Testing

### Test Mode
For testing, use Stripe test keys:
```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Test card numbers:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

### Local Webhook Testing
Use Stripe CLI for local development:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## 🛠️ API Endpoints

### Stripe APIs
- `POST /api/stripe/create-checkout` - Create checkout session
- `POST /api/stripe/webhook` - Handle Stripe webhooks
- `GET /api/stripe/verify-session` - Verify checkout completion

### Billing APIs
- `GET /api/billing/subscription` - Get current subscription
- `GET /api/billing/invoices` - List all invoices
- `POST /api/billing/manage` - Create portal session

## 📝 Database Schema Updates

Added to `users` table:
- `stripe_customer_id` - Stripe customer ID

Added to `licenses` table:
- `tier` - Subscription tier (starter/professional/enterprise)
- `stripe_subscription_id` - Stripe subscription ID
- `stripe_price_id` - Stripe price ID
- `current_period_end` - Subscription renewal date
- `user_id` - Link to user
- `metadata` - Additional subscription data

## 🚨 Important Notes

1. **Production Checklist**:
   - [ ] Use live Stripe keys
   - [ ] Configure webhook endpoint
   - [ ] Set up email service (SendGrid/Resend)
   - [ ] Enable SSL/HTTPS
   - [ ] Configure domain in Stripe

2. **Security**:
   - Never commit Stripe keys to git
   - Always verify webhook signatures
   - Use HTTPS in production
   - Implement rate limiting on checkout

3. **Monitoring**:
   - Check Stripe Dashboard for failed payments
   - Monitor webhook failures
   - Set up alerts for subscription cancellations
   - Track conversion rates

## 📧 Email Integration

Currently using console logging for emails. To enable real email:

1. Choose a provider (SendGrid, Resend, AWS SES)
2. Update `/lib/email/send-welcome-email.ts`
3. Add API keys to environment
4. Test email delivery

## 🔗 Useful Links

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe API Docs](https://stripe.com/docs/api)
- [Webhook Events](https://stripe.com/docs/webhooks/events)
- [Testing Guide](https://stripe.com/docs/testing)

## 💡 Next Steps

1. **Configure Stripe Products**: Run the setup script
2. **Set up Webhook**: Add endpoint in Stripe Dashboard
3. **Test Purchase Flow**: Use test cards
4. **Configure Email**: Set up email service
5. **Go Live**: Switch to live keys

---

For support, contact: support@intelagentstudios.com