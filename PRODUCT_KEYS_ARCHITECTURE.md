# Product Keys Architecture

## Overview

The Intelagent Platform now uses a **universal license key system** with **product-specific coded keys** for multi-product management. This architecture provides clean separation between account identity (license) and product access (product keys).

## Key Concepts

### 1. License Key (Account Identifier)
- **Format**: `XXXX-XXXX-XXXX-XXXX` (e.g., `INTL-AGNT-BOSS-MODE`)
- **Purpose**: Primary account identifier
- **Scope**: One per customer account
- **Contains**: Customer info, subscription status, purchased products list

### 2. Product Keys (Product Access)
- **Format**: `{product_prefix}_{random_16_chars}`
- **Purpose**: Product-specific access control
- **Examples**:
  - Chatbot: `chat_a1b2c3d4e5f6g7h8`
  - Sales Agent: `sale_9i8h7g6f5e4d3c2b`
  - Data Enrichment: `data_1a2b3c4d5e6f7g8h`
  - Setup Agent: `agnt_5e4d3c2b1a9i8h7g`

## Database Structure

```sql
-- Main account table (existing)
licenses {
  license_key: "INTL-AGNT-BOSS-MODE"  -- Primary identifier
  products: ["chatbot", "sales-agent"] -- Purchased products
  site_key: "key_old123"               -- Legacy field (being phased out)
  ...
}

-- New product keys table
product_keys {
  id: "uuid-1234"
  license_key: "INTL-AGNT-BOSS-MODE"  -- Links to account
  product: "chatbot"                   -- Product type
  product_key: "chat_a1b2c3d4e5f6g7h8" -- Actual key used
  status: "active"
  created_at: "2024-08-25"
  metadata: { ... }                    -- Additional config
}
```

## Data Access Pattern

```
User Authentication
    ↓
JWT Token (contains license_key)
    ↓
License Key: INTL-AGNT-BOSS-MODE
    ↓
Product Keys Lookup
    ├── chatbot → chat_a1b2c3d4e5f6g7h8
    └── sales-agent → sale_9i8h7g6f5e4d3c2b
         ↓
    Product Data Access
```

## Migration Strategy

### Existing Chatbot Keys
Your two existing chatbots with site_keys will be automatically migrated:

**Before Migration:**
```
License: INTL-AGNT-BOSS-MODE
  site_key: "key_abcd1234efgh5678"
  
License: INTL-8K3M-QB7X-2024
  site_key: "key_xyz789qwerty456"
```

**After Migration:**
```
product_keys table:
  - license: INTL-AGNT-BOSS-MODE, product: chatbot, key: "key_abcd1234efgh5678"
  - license: INTL-8K3M-QB7X-2024, product: chatbot, key: "key_xyz789qwerty456"
```

The existing `site_key` values are preserved as chatbot product keys, ensuring no disruption to existing chatbot integrations.

## Multi-Product Example

When a customer owns multiple products:

```javascript
// Customer: INTL-AGNT-BOSS-MODE owns chatbot and sales-agent

// Product keys in database:
[
  {
    license_key: "INTL-AGNT-BOSS-MODE",
    product: "chatbot",
    product_key: "chat_a1b2c3d4e5f6g7h8"  // Or migrated legacy key
  },
  {
    license_key: "INTL-AGNT-BOSS-MODE",
    product: "sales-agent",
    product_key: "sale_9i8h7g6f5e4d3c2b"
  }
]

// Each product uses its own key for data access:
// Chatbot logs: WHERE site_key = "chat_a1b2c3d4e5f6g7h8"
// Sales data: WHERE agent_key = "sale_9i8h7g6f5e4d3c2b"
```

## API Usage

### Get All Product Keys
```typescript
GET /api/products/keys

Response:
{
  "license_key": "INTL-AGNT-BOSS-MODE",
  "product_keys": [
    {
      "product": "chatbot",
      "product_key": "chat_a1b2c3d4e5f6g7h8",
      "status": "active"
    },
    {
      "product": "sales-agent",
      "product_key": "sale_9i8h7g6f5e4d3c2b",
      "status": "active"
    }
  ]
}
```

### Create New Product Key
```typescript
POST /api/products/keys
{
  "product": "data-enrichment"
}

Response:
{
  "product": "data-enrichment",
  "product_key": "data_newkey123456789"
}
```

## Benefits

### 1. **Scalability**
- Add new products without schema changes
- Support multiple instances of same product
- Easy key rotation and revocation

### 2. **Security**
- Product keys can be individually revoked
- Rate limiting per product key
- Audit trail per product usage

### 3. **Flexibility**
- A/B testing with multiple keys
- Regional keys for global deployment
- Different access levels per key

### 4. **Backward Compatibility**
- Legacy site_keys continue to work
- Automatic migration on first use
- No breaking changes to existing integrations

## Implementation Status

✅ **Completed:**
- Product keys table schema
- Migration script for existing site_keys
- Product key generation utilities
- Service layer with backward compatibility
- Updated chatbot API to use new system

🔄 **Next Steps:**
1. Run migration script to create product_keys table
2. Test with existing chatbot data
3. Implement for other products (sales-agent, etc.)
4. Update webhook endpoints to use product keys
5. Add UI for managing product keys

## Code Examples

### Generate Product Key
```typescript
import { generateProductKey } from '@/utils/product-keys';

const { key, prefix } = generateProductKey('chatbot');
// Returns: { key: "chat_a1b2c3d4e5f6g7h8", prefix: "chat" }
```

### Get Product Key for API
```typescript
import { getProductKey } from '@/lib/product-keys-service';

const chatbotKey = await getProductKey(licenseKey, 'chatbot');
// Returns existing key or legacy site_key

const salesKey = await getProductKey(licenseKey, 'sales-agent');
// Returns sales agent key or null if not configured
```

### Check Product Access
```typescript
import { hasProductAccess } from '@/lib/product-keys-service';

const hasAccess = await hasProductAccess(licenseKey, 'data-enrichment');
// Returns true if product key exists and is active
```

## Summary

This architecture provides a clean, scalable solution for multi-product key management while maintaining backward compatibility with existing systems. Each license (customer) can have multiple product keys, all linked through their primary license key, enabling proper data isolation and access control across the platform.