# Unified License System Design

## Overview
A comprehensive license management system that unifies access control across all Intelagent products, integrates with Stripe for payments, n8n for automation, and Squarespace for customer acquisition.

## Core Architecture

### 1. License Structure
```typescript
interface License {
  // Core Identity
  license_key: string;          // Format: XXXX-XXXX-XXXX-XXXX
  organization_id: string;      // Links to organization
  
  // Customer Information
  customer_email: string;
  customer_name: string;
  company_name?: string;
  
  // Product Access
  products: ProductAccess[];    // Array of product configurations
  plan_tier: 'starter' | 'professional' | 'enterprise' | 'custom';
  
  // Activation & Status
  status: 'pending' | 'active' | 'suspended' | 'expired' | 'revoked';
  activation_date?: Date;
  expiration_date?: Date;
  
  // Usage Limits
  usage_limits: {
    chatbot_conversations?: number;
    sales_leads?: number;
    api_calls?: number;
    custom_limits?: Record<string, number>;
  };
  
  // Integration Keys
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  squarespace_order_id?: string;
  
  // Domain & Security
  allowed_domains: string[];    // Multiple domains per license
  ip_whitelist?: string[];
  
  // Metadata
  created_at: Date;
  updated_at: Date;
  last_verified: Date;
  notes?: string;
}

interface ProductAccess {
  product_id: 'chatbot' | 'sales_agent' | 'setup_agent' | 'enrichment' | 'custom';
  enabled: boolean;
  tier: 'basic' | 'pro' | 'enterprise';
  features: string[];
  usage_current: number;
  usage_limit: number;
  config?: Record<string, any>;
}
```

### 2. Integration Points

#### A. Squarespace Integration
```javascript
// Webhook endpoint for Squarespace orders
POST /api/webhooks/squarespace
- Receives order completion events
- Auto-generates license based on product purchased
- Sends welcome email with license key
- Triggers n8n onboarding workflow
```

#### B. n8n Workflow Integration
```javascript
// License validation endpoints for n8n
GET /api/licenses/validate/{license_key}
- Used by setup, chatbot, and index workflows
- Returns product access and configuration
- Caches validation for performance

POST /api/licenses/activate
- Called by setup agent after configuration
- Updates license status and domain
- Triggers product provisioning
```

#### C. Stripe Subscription Management
```javascript
// Stripe webhook handlers
POST /api/webhooks/stripe
- subscription.created → Generate/activate license
- subscription.updated → Update plan/limits
- subscription.deleted → Suspend license
- invoice.paid → Extend expiration
- payment_failed → Send warning
```

### 3. Dashboard Integration

#### A. Master Admin Portal
```typescript
// License management features
- Create/edit/revoke licenses
- View all customer licenses
- Analytics by product/plan
- Revenue tracking per license
- Usage monitoring across products
- Bulk operations
```

#### B. Customer Portal
```typescript
// Self-service features
- View license details
- Check usage/limits
- Add allowed domains
- Download invoices
- Upgrade plan
- Manage team access
```

### 4. API Endpoints

#### License Management
```typescript
// Admin endpoints
POST   /api/admin/licenses/generate
PUT    /api/admin/licenses/{key}/update
DELETE /api/admin/licenses/{key}/revoke
GET    /api/admin/licenses/analytics

// Customer endpoints  
GET    /api/licenses/my-license
POST   /api/licenses/activate
PUT    /api/licenses/add-domain
GET    /api/licenses/usage

// Public validation
POST   /api/licenses/validate
GET    /api/licenses/check/{key}
```

### 5. Security Features

#### A. License Validation
- Domain verification (CORS check)
- IP whitelisting (optional)
- Rate limiting per license
- Usage tracking and limits
- Fraud detection

#### B. Token System
```typescript
// JWT tokens for authenticated sessions
interface LicenseToken {
  license_key: string;
  products: string[];
  expires: number;
  domain: string;
}
```

### 6. Database Schema Updates

```sql
-- Enhanced licenses table
CREATE TABLE licenses (
  license_key VARCHAR(20) PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  
  -- Customer info
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255),
  company_name VARCHAR(255),
  
  -- Product access (JSONB for flexibility)
  products JSONB NOT NULL DEFAULT '[]',
  plan_tier VARCHAR(50) NOT NULL,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  activation_date TIMESTAMP,
  expiration_date TIMESTAMP,
  
  -- Usage limits (JSONB)
  usage_limits JSONB DEFAULT '{}',
  usage_current JSONB DEFAULT '{}',
  
  -- Integration IDs
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  squarespace_order_id VARCHAR(255),
  
  -- Security
  allowed_domains TEXT[] DEFAULT '{}',
  ip_whitelist TEXT[],
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_verified TIMESTAMP,
  notes TEXT,
  
  -- Indexes
  INDEX idx_organization (organization_id),
  INDEX idx_email (customer_email),
  INDEX idx_status (status),
  INDEX idx_stripe (stripe_customer_id)
);

-- License usage tracking
CREATE TABLE license_usage (
  id SERIAL PRIMARY KEY,
  license_key VARCHAR(20) REFERENCES licenses(license_key),
  product_id VARCHAR(50),
  action VARCHAR(100),
  count INTEGER DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_license_product (license_key, product_id),
  INDEX idx_created (created_at)
);

-- License audit log
CREATE TABLE license_audit (
  id SERIAL PRIMARY KEY,
  license_key VARCHAR(20),
  action VARCHAR(50),
  performed_by VARCHAR(255),
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_license (license_key),
  INDEX idx_action (action)
);
```

### 7. Implementation Phases

#### Phase 1: Core License System
- [ ] Update database schema
- [ ] Build license CRUD API
- [ ] Implement validation endpoints
- [ ] Create admin management UI

#### Phase 2: Product Integration
- [ ] Update chatbot to use new system
- [ ] Integrate sales agent
- [ ] Connect setup agent
- [ ] Update n8n workflows

#### Phase 3: Payment Integration
- [ ] Connect Stripe subscriptions
- [ ] Implement usage-based billing
- [ ] Add payment history

#### Phase 4: Squarespace Integration
- [ ] Build order webhook handler
- [ ] Auto-provision licenses
- [ ] Customer onboarding flow

#### Phase 5: Advanced Features
- [ ] Team/organization management
- [ ] Usage analytics dashboard
- [ ] API key generation
- [ ] Partner/reseller portal

### 8. Migration Strategy

```typescript
// Migrate existing licenses
async function migrateLicenses() {
  const oldLicenses = await db.licenses.findAll();
  
  for (const old of oldLicenses) {
    await db.licenses.create({
      license_key: old.license_key,
      customer_email: old.email,
      customer_name: old.customer_name,
      products: old.products.map(p => ({
        product_id: p,
        enabled: true,
        tier: old.plan || 'basic',
        features: getDefaultFeatures(p, old.plan)
      })),
      plan_tier: old.plan || 'starter',
      status: old.status || 'active',
      allowed_domains: old.domain ? [old.domain] : [],
      stripe_subscription_id: old.subscription_id,
      created_at: old.created_at
    });
  }
}
```

### 9. Benefits

1. **Unified Access Control**: Single license for all products
2. **Flexible Product Bundling**: Easy to add/remove products
3. **Usage Tracking**: Monitor and limit usage per product
4. **Payment Integration**: Automatic provisioning from Stripe/Squarespace
5. **Multi-Domain Support**: One license, multiple installations
6. **Team Management**: Organizations can manage multiple users
7. **Analytics**: Comprehensive usage and revenue tracking
8. **Security**: Domain locking, IP whitelisting, fraud detection

### 10. Example Workflows

#### A. Customer Purchase Flow
1. Customer buys on Squarespace
2. Webhook triggers license generation
3. Welcome email sent with license key
4. Customer runs setup agent
5. License activated with domain
6. Products provisioned automatically

#### B. License Validation (n8n)
1. Workflow receives request
2. Calls /api/licenses/validate
3. Gets product access and config
4. Routes to appropriate workflow
5. Tracks usage automatically

#### C. Upgrade Flow
1. Customer clicks upgrade in dashboard
2. Redirected to Stripe checkout
3. Payment processed
4. License automatically updated
5. New features enabled instantly