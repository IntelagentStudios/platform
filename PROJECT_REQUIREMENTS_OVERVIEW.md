# Intelagent Platform - Project Requirements & Progress Overview

## Project Summary
Multi-tenant SaaS platform with license-based authentication and product key management system. The platform supports multiple AI-powered products (chatbot, sales-agent, data-enrichment, setup-agent) with per-license isolation and product-specific access control.

## Architecture Overview

### Authentication System
- **Primary Identifier**: License keys (format: INTL-XXXX-XXXX-YYYY)
- **Product Keys**: Coded prefixes for product identification
  - `chat_` - AI Chatbot
  - `sale_` - Sales Agent  
  - `data_` - Data Enrichment
  - `agnt_` - Setup Agent
- **Session Management**: JWT tokens with Redis caching (currently using in-memory cache)
- **Multi-tenant Isolation**: All data scoped by license_key

### Database Schema
- **Users Table**: Stores user accounts linked to licenses
- **Licenses Table**: Contains license information, products array, and billing data
- **Product Keys Table**: New table for managing product-specific access keys
- **User Sessions Table**: Tracks active sessions per user

## Current Implementation Status

### ✅ Completed Features

#### 1. Product Key System
- Created `product_keys` table with proper foreign keys
- Implemented product key generation with coded prefixes
- Migration script to convert legacy site_keys to new format
- Product key service layer (`lib/product-keys-service.ts`)
- Backward compatibility for existing site_keys

#### 2. Authentication & Authorization
- JWT-based authentication with license key claims
- Centralized auth validator (`lib/auth-validator.ts`)
- License-based cache isolation (`lib/license-cache.ts`)
- Rate limiting per license key
- Session management with database persistence

#### 3. Caching Layer
- Simplified in-memory cache implementation (removed Redis dependency for Railway deployment)
- License-scoped cache keys for multi-tenant isolation
- Product-specific data caching
- Rate limiting and usage counters

#### 4. API Endpoints
- `/api/auth/login` - User authentication
- `/api/auth/me` - Current user info with license data
- `/api/products/keys` - Product key management
- `/api/products/chatbot/configure` - Chatbot setup
- `/api/example/cached-data` - Demo of license-isolated caching

### 🔧 Recent Fixes

#### Railway Deployment Issues (Resolved)
1. **Module Resolution Errors**
   - Fixed import paths for local packages
   - Copied shared files into customer-portal lib folder
   - Removed external package dependencies

2. **TypeScript Compilation Errors**
   - Fixed Prisma query syntax (removed invalid includes)
   - Separated user and license queries (no relations defined)
   - Fixed spread operator type issues

3. **Build Configuration**
   - Simplified cache to in-memory implementation
   - Removed Redis package dependency
   - Fixed all Next.js route export issues

### ⚠️ Current Issues

#### 1. Login Loop Problem
- **Symptom**: After login, users are redirected back to login page
- **Previous Fix**: Issue was related to auth cookie not being properly set or validated
- **Possible Causes**:
  - Cookie domain/path mismatch
  - Auth validation failing
  - Middleware redirect logic
  - Session not properly stored

#### 2. n8n Integration
- Setup agent generating old format keys (sk_xxxx instead of chat_xxxx)
- Need to update n8n workflow with new system message and key generator
- Webhook endpoint: https://1ntelagent.up.railway.app/webhook/setup

### 📋 Migration Status

#### Product Keys Migration
```sql
-- Migration executed successfully
-- Result: 1 key migrated (bEast account)
-- Issue: Friend's account (INTL-8K3M-QB7X-2024) had NULL site_key
```

## Technical Decisions

### 1. License Key as Primary Identifier
- All operations scoped by license_key
- Supports thousands of users per license
- Enables true multi-tenant architecture

### 2. Product Key Architecture
- Each product has unique prefix for easy identification
- Format: `{prefix}_{16_random_chars}`
- Stored in dedicated `product_keys` table
- Multiple products per license supported

### 3. Caching Strategy
- Currently using in-memory cache (SimpleCache class)
- Redis planned for production deployment
- Cache keys format: `license:{license_key}:{namespace}:{key}`
- Automatic TTL management

## Deployment Configuration

### Railway Platform
- Automatic builds from GitHub main branch
- PostgreSQL database (shared with production)
- Environment variables configured
- Build successful after dependency fixes

### Environment Variables Required
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
NEXT_PUBLIC_API_URL=https://...
NODE_ENV=production
```

## Next Steps

### Immediate Priority
1. Fix login loop issue
2. Test complete authentication flow
3. Verify product key generation

### Short Term
1. Update n8n setup agent with new system message
2. Test friend's account with fresh configuration
3. Implement proper Redis caching (when available)

### Long Term
1. Add more product integrations
2. Implement usage analytics per product
3. Add billing integration for product upgrades
4. Create admin dashboard for license management

## Testing Accounts

### Primary Account (bEast)
- License: INTL-BOSS-MODE-2024
- Products: All (chatbot, sales-agent, data-enrichment, setup-agent)
- Status: Active, Pro account
- Product Key: Successfully migrated

### Test Account (Friend)
- License: INTL-8K3M-QB7X-2024  
- Products: Chatbot
- Status: Needs fresh configuration
- Issue: No site_key configured initially

## Code Structure

```
apps/customer-portal/
├── app/
│   ├── api/
│   │   ├── auth/          # Authentication endpoints
│   │   ├── products/      # Product-specific APIs
│   │   └── example/       # Demo endpoints
│   ├── dashboard/         # Main dashboard
│   └── products/         # Product pages
├── lib/
│   ├── auth-validator.ts     # Centralized auth validation
│   ├── license-cache.ts      # License-scoped caching
│   ├── product-keys.ts       # Product key utilities
│   ├── product-keys-service.ts # Product key service layer
│   └── prisma.ts             # Database client
└── middleware.ts             # Auth middleware

packages/database/
└── prisma/
    ├── schema.prisma         # Main database schema
    └── migrations/           # Database migrations
```

## Development Notes

### Known Gotchas
1. Prisma schema doesn't define relations between users and licenses tables
2. Must fetch license data separately from user data
3. Railway builds require all dependencies to be local (no workspace packages)
4. Next.js routes only allow specific HTTP method exports

### Debug Commands
```bash
# Check current git status
git status

# View recent commits  
git log --oneline -5

# Test local build
npm run build

# Check Railway logs
# Visit Railway dashboard
```

---

*Last Updated: Current Session*
*Platform Status: Build successful on Railway, login loop issue present*