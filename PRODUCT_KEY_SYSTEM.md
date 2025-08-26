# Product Key System Architecture

## Overview
The Intelagent Platform uses a product key system to manage product activation and configuration. Each product requires a unique product key that is created when the product is configured (not when purchased).

## Key Principles

1. **Product Key = Configuration Indicator**
   - No key = Product purchased but not configured (shows "Ready to configure")
   - Has key = Product configured and ready to use (shows "Active")

2. **Setup Agent Creates Keys**
   - Product keys are ONLY created by the Setup Agent during configuration
   - Keys are NOT pre-created when products are purchased
   - This ensures products transition from "purchased" to "configured" state properly

3. **Key Format Standards**
   - `chat_` prefix: Chatbot product keys
   - `sale_` prefix: Sales Agent product keys
   - `data_` prefix: Data Enrichment product keys
   - `agnt_` prefix: Setup Agent product keys
   - Old formats (`sk_`, `key_`) are deprecated and should be migrated

## Database Schema

### product_keys table
```sql
- id: Primary key
- license_key: Foreign key to licenses table
- product: Product type (chatbot, sales-agent, data-enrichment, setup-agent)
- product_key: The actual key (chat_xxxxx, sale_xxxxx, etc.)
- status: active/inactive
- created_at: Timestamp
- last_used_at: Timestamp
- metadata: JSON field for additional data
```

### licenses table
```sql
- license_key: Primary key (e.g., INTL-XXXX-XXXX-2024)
- products: Array of purchased products
- site_key: DEPRECATED - Legacy field, should be NULL
```

## API Endpoints

### Check Product Keys
`GET /api/products/check-keys`
- Returns configuration status for all user products
- Used by dashboard to show Configure/Manage buttons

### Setup Agent Frame
`POST /api/products/chatbot/setup-agent-frame`
- Creates product key when configuration is complete
- Saves configuration data
- Returns new product key to client

## Flow Diagram

```
1. User purchases product → Product added to license.products array
2. Dashboard checks product keys → No key found → Shows "Ready to configure"
3. User clicks Configure → Redirected to Setup Agent
4. Setup Agent collects configuration → Creates product key
5. Product key saved → Dashboard now shows "Active" with Manage button
```

## Important Logging Points

All key operations are logged with the `[component-name]` prefix:

- `[dashboard]` - Dashboard authentication and product checks
- `[check-keys]` - Product key verification endpoint
- `[product-keys-service]` - Core product key operations
- `[setup-agent-frame]` - Setup Agent configuration endpoint
- `[setup-agent-frame-page]` - Setup Agent UI interactions

## Migration Notes

### Legacy site_key Migration
The system automatically migrates legacy `site_key` values from the licenses table to the product_keys table. However:
- This auto-migration should be disabled for testing
- All site_key fields should be NULL in production
- Old format keys (sk_, key_) should be deleted and recreated with proper format

### SQL Commands for Maintenance

```sql
-- Check all product keys for a license
SELECT * FROM product_keys WHERE license_key = 'LICENSE-KEY-HERE';

-- Delete all product keys for testing
DELETE FROM product_keys WHERE license_key = 'LICENSE-KEY-HERE';

-- Clear legacy site_key
UPDATE licenses SET site_key = NULL WHERE license_key = 'LICENSE-KEY-HERE';

-- Verify clean state
SELECT 
    l.license_key,
    l.site_key,
    COUNT(pk.id) as product_key_count
FROM licenses l
LEFT JOIN product_keys pk ON pk.license_key = l.license_key
WHERE l.license_key = 'LICENSE-KEY-HERE'
GROUP BY l.license_key, l.site_key;
```

## Testing Checklist

1. ✅ Delete all product keys for test account
2. ✅ Clear any legacy site_key values
3. ✅ Verify dashboard shows "Ready to configure"
4. ✅ Click Configure button
5. ⏳ Complete Setup Agent flow
6. ⏳ Verify new chat_ format key is created
7. ⏳ Verify dashboard shows "Active" with Manage button
8. ⏳ Verify product key persists across sessions

## Common Issues

### Issue: Old sk_ format keys keep reappearing
**Cause**: The product-keys-service.ts has auto-migration from licenses.site_key
**Solution**: Ensure site_key is NULL in licenses table

### Issue: Product shows as Active when it shouldn't
**Cause**: Product key exists in database
**Solution**: Delete the product key to reset to "Ready to configure" state

### Issue: Configure button doesn't work
**Cause**: Product key already exists
**Solution**: Check product_keys table and delete if testing

## Security Considerations

- Product keys are tied to license keys for multi-tenancy
- Keys are validated on every API request
- Setup Agent requires authentication before creating keys
- Product keys should never be exposed in client-side code (except for embed scripts)