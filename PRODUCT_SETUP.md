# Product Setup Guide

## Making Your Products Usable and Sellable

### 1. Chatbot Integration

To get the chatbot working on your website:

#### Quick Setup:
1. Go to Admin Portal → Products → AI Chatbot
2. Enter your website URL
3. Copy the embed code
4. Add it to your website's HTML before `</body>`

#### What's Needed to Make it Fully Functional:

**Backend Requirements:**
- [ ] **AI Integration** - Connect to OpenAI, Claude, or another LLM provider
- [ ] **Database Setup** - Store conversations and user data
- [ ] **Authentication System** - Generate and validate API keys
- [ ] **Rate Limiting** - Prevent abuse and manage costs
- [ ] **Webhook System** - Send notifications for new conversations

**Frontend Requirements:**
- [ ] **Chat Interface** - Build the actual chat UI (currently using iframe placeholder)
- [ ] **Mobile Responsive** - Ensure it works on all devices
- [ ] **Customization Options** - Allow color, position, and behavior changes
- [ ] **File Uploads** - Support for images and documents in chat

### 2. Sales Agent Setup

**Core Features Needed:**
- [ ] **Email Integration** - Connect to email providers (SendGrid, Mailgun, etc.)
- [ ] **CRM Integration** - Connect to HubSpot, Salesforce, etc.
- [ ] **Lead Scoring Algorithm** - Qualify leads automatically
- [ ] **Template System** - Email templates for campaigns
- [ ] **Analytics Dashboard** - Track open rates, clicks, conversions

### 3. Payment & Billing Integration

To actually sell these products, you need:

**Payment Processing:**
```bash
npm install stripe
# or
npm install @paddle/paddle-js
```

**Required Setup:**
1. Create Stripe/Paddle account
2. Set up product pricing in payment provider
3. Add webhook endpoints for payment events
4. Implement subscription management

**Database Schema Needed:**
```sql
-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  price DECIMAL(10,2),
  billing_period VARCHAR(50)
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID,
  product_id UUID,
  status VARCHAR(50),
  current_period_end TIMESTAMP
);

-- Usage tracking
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY,
  subscription_id UUID,
  timestamp TIMESTAMP,
  usage_count INTEGER,
  details JSONB
);
```

### 4. Essential API Endpoints

Create these endpoints in your admin portal:

```typescript
// Product management
POST   /api/products          // Create product
GET    /api/products          // List products
GET    /api/products/:id      // Get product details
PUT    /api/products/:id      // Update product
DELETE /api/products/:id      // Delete product

// Subscription management
POST   /api/subscriptions     // Create subscription
GET    /api/subscriptions     // List subscriptions
PATCH  /api/subscriptions/:id // Update subscription
DELETE /api/subscriptions/:id // Cancel subscription

// Usage tracking
POST   /api/usage             // Track usage
GET    /api/usage/stats       // Get usage statistics

// Billing
POST   /api/billing/checkout  // Create checkout session
POST   /api/billing/webhook   // Handle payment webhooks
GET    /api/billing/invoices  // Get invoices
```

### 5. Environment Variables Needed

Add these to your `.env` file:

```env
# Database
DATABASE_URL=your_database_url

# AI Provider (choose one)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_claude_key

# Payment Provider
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret
STRIPE_PUBLISHABLE_KEY=your_stripe_public_key

# Email Provider
SENDGRID_API_KEY=your_sendgrid_key
EMAIL_FROM=noreply@yourdomain.com

# Authentication
JWT_SECRET=your_jwt_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_auth_secret

# Chat Widget
WIDGET_URL=https://chat.yourdomain.com
API_URL=https://api.yourdomain.com
```

### 6. Deployment Steps

1. **Database Setup:**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

2. **Deploy Admin Portal:**
   ```bash
   npm run build
   npm start
   ```

3. **Setup Domain & SSL:**
   - Point your domain to your server
   - Install SSL certificate
   - Configure CORS for widget

4. **CDN for Widget:**
   - Host widget.js on a CDN
   - Update embed code with CDN URL

### 7. Testing Checklist

- [ ] Widget loads on test website
- [ ] Chat messages are sent and received
- [ ] API key validation works
- [ ] Usage is tracked correctly
- [ ] Billing integration processes payments
- [ ] Webhooks are received and processed
- [ ] Analytics data is accurate

### 8. Go-Live Checklist

- [ ] Production database configured
- [ ] Environment variables set
- [ ] SSL certificates installed
- [ ] Monitoring setup (Sentry, LogRocket, etc.)
- [ ] Backup system in place
- [ ] Rate limiting configured
- [ ] Terms of Service & Privacy Policy
- [ ] Customer support system ready

## Quick Start for Chatbot

The minimum to get a working chatbot:

1. **Set up OpenAI:**
   ```typescript
   // app/api/chat/route.ts
   import OpenAI from 'openai';
   
   const openai = new OpenAI({
     apiKey: process.env.OPENAI_API_KEY,
   });
   
   // In your POST handler
   const completion = await openai.chat.completions.create({
     model: "gpt-3.5-turbo",
     messages: [
       { role: "system", content: "You are a helpful assistant." },
       { role: "user", content: message }
     ],
   });
   
   return completion.choices[0].message.content;
   ```

2. **Update widget.js in public folder** with your actual domain

3. **Deploy to Vercel/Railway:**
   ```bash
   vercel deploy
   # or
   railway up
   ```

That's it! Your chatbot will be functional.

## Support

Need help? Contact support@intelagent.ai or check our documentation.