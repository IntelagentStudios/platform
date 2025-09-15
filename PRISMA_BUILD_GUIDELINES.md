# Prisma Build Guidelines

## Overview
This document provides guidelines for working with Prisma in our project to avoid TypeScript compilation errors and maintain consistency with the database schema.

## Common Issues and Solutions

### 1. Always Check the Actual Schema
Before using any Prisma model or field, verify it exists in `packages/database/prisma/schema.prisma`

```bash
# Check if a model exists
grep "^model your_model_name" packages/database/prisma/schema.prisma

# Check fields in a model
grep -A20 "^model your_model_name" packages/database/prisma/schema.prisma
```

### 2. Field Naming Discrepancies
Common field naming issues we've encountered:

| Incorrect Field | Correct Field | Model |
|-----------------|---------------|-------|
| `customer_email` | `email` | licenses |
| `product_name` | `products` (array) | licenses |
| `knowledge_files` | `custom_knowledge` | (table name) |
| `filename` | `knowledge_type` | custom_knowledge |
| `responses_received` | `replies_received` | sales_campaigns |
| `is_bounced` | (doesn't exist) | sales_leads |
| `is_unsubscribed` | (doesn't exist) | sales_leads |
| `last_response` | `last_engaged_at` | sales_leads |
| `lead_score` | `score` | sales_leads |
| `qualified_at` | (doesn't exist) | sales_leads |
| `last_email_sent` | `last_contacted_at` | sales_leads |
| `contacted_at` | `last_contacted_at` | sales_leads |
| `daily_send_limit` | (in settings JSON) | sales_campaigns |
| `leads_contacted` | (doesn't exist) | sales_campaigns |
| `last_activity_at` | `updated_at` | sales_campaigns |

### 3. JSON Fields
Many fields are stored as JSON in the database. Access them properly:

```typescript
// sales_campaigns
const campaign = await prisma.sales_campaigns.findFirst({...});
const dailyLimit = (campaign.settings as any)?.daily_send_limit || 50;

// sales_activities - use metadata for extra fields
await prisma.sales_activities.create({
  data: {
    // Standard fields
    activity_type: 'email_sent',
    subject: 'Subject',
    content: 'Content',

    // Extra data goes in metadata
    metadata: {
      email_template_id: templateId,
      sentiment_score: score,
      custom_field: value
    }
  }
});
```

### 4. Auth Token Structure
The `AuthToken` interface doesn't have a `user` property:

```typescript
// Wrong
if (!session?.user?.id) { ... }

// Correct
if (!session?.email) { ... }

// AuthToken structure:
interface AuthToken {
  license_key: string
  email?: string
  name?: string
  exp: number
}
```

### 5. Missing Tables
Some tables that don't exist in our schema:
- `customers` - Use `licenses` table with `email` field instead
- `knowledge_files` - Use `custom_knowledge` table instead

### 6. Array Fields
Some fields are arrays and require special queries:

```typescript
// Check if products array contains a value
const license = await prisma.licenses.findFirst({
  where: {
    products: {
      has: 'Sales Outreach Agent'
    }
  }
});
```

## Best Practices

### 1. Always Generate Prisma Client After Schema Changes
```bash
cd apps/customer-portal
npx prisma generate --schema=../../packages/database/prisma/schema.prisma
```

### 2. Type-Safe Field Access
Use TypeScript to catch field errors early:

```typescript
// Let TypeScript help you
const lead = await prisma.sales_leads.findFirst({...});
// TypeScript will show available fields when you type: lead.
```

### 3. Check Related Models
When a model has relations, they won't be included by default:

```typescript
// Won't include related data
const campaign = await prisma.sales_campaigns.findFirst({...});

// Include related data explicitly (when relations are set up)
const campaign = await prisma.sales_campaigns.findFirst({
  include: {
    leads: true,
    activities: true
  }
});
```

### 4. Handle Optional Fields
Many fields are optional (nullable). Always handle null cases:

```typescript
const lead = await prisma.sales_leads.findFirst({...});
const score = lead.score || 0;  // Default value for null
const date = lead.last_contacted_at || new Date();  // Default for null dates
```

### 5. Testing Queries
Before implementing complex queries, test them in a simple script:

```typescript
// test-query.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  const result = await prisma.your_model.findFirst({
    where: { /* your conditions */ }
  });
  console.log(result);
}

test().catch(console.error).finally(() => prisma.$disconnect());
```

## Debugging Build Errors

### 1. Identify the Error
```bash
npm run build 2>&1 | grep -A5 "Type error:"
```

### 2. Check the Schema
```bash
grep "model_name" packages/database/prisma/schema.prisma
```

### 3. Common Fixes
- Replace non-existent fields with correct ones
- Move extra data to JSON fields (metadata, settings)
- Use `updated_at` instead of custom timestamp fields
- Check if the field is in a JSON column

## Migration Checklist

When updating code to work with the schema:

- [ ] Check all model names match schema exactly
- [ ] Verify all field names exist in the schema
- [ ] Update field types to match schema (string vs array, etc.)
- [ ] Move non-existent fields to appropriate JSON columns
- [ ] Update auth checks to use correct token structure
- [ ] Test queries with actual database before deploying
- [ ] Run `npm run build` to catch TypeScript errors
- [ ] Update this document with any new discoveries

## Quick Reference

### Run Build with Error Details
```bash
cd apps/customer-portal
npm run build 2>&1 | tail -30
```

### Check Schema for Model
```bash
grep -A50 "^model sales_campaigns" packages/database/prisma/schema.prisma
```

### Generate Prisma Client
```bash
cd apps/customer-portal
npx prisma generate --schema=../../packages/database/prisma/schema.prisma
```

### Find All Uses of a Field
```bash
grep -r "field_name" apps/customer-portal --include="*.ts" --include="*.tsx"
```