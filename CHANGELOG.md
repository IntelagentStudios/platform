# Changelog

## [2025-01-29] - Product Standardization and Admin Dashboard Improvements

### Added
- **Master Admin Dashboard** (`apps/admin-portal/app/admin/overview/page.tsx`)
  - Real-time statistics from database (removed all fake data)
  - Inverted color scheme from customer dashboard (light background, dark text)
  - License-centric data hierarchy
  - AI Assistant integration with CORS proxy endpoint
  - License consolidation tools for managing multiple licenses

- **Standardized Chatbot Configuration**
  - Password-based authentication for all accounts
  - Automatic license key retrieval from logged-in user
  - Consistent configuration flow across all user types
  - Dark theme matching customer dashboard design
  - Collapsible installation instructions with platform-specific guides

- **Pricing Page** (`apps/customer-portal/app/pricing/page.tsx`)
  - £199/month for Additional Chatbot
  - £399/month for Sales Outreach Agent
  - "Coming Soon" for Onboarding Agent
  - Purchase requirement for multiple product instances

### Changed
- **Product Naming Updates**
  - `sales-agent` → `sales-outreach-agent` throughout the codebase
  - `setup-agent` → `onboarding-agent` throughout the codebase
  - Updated all references in dashboard, routes, and API endpoints

- **Chatbot Widget Styling**
  - Black and white theme for refresh and send buttons
  - Smaller text input box (single line height)
  - Muted green success page colors
  - Fixed copy button overlay issue

- **Configuration Success Page**
  - "Configure Another" changed to "Purchase Another" with pricing redirect
  - Proper product instance tracking implementation

### Fixed
- Build errors with non-existent database fields (name, type, metadata)
- Foreign key constraint errors when deleting product keys
- Dashboard null reference error with user.products array
- CORS issues with AI Assistant by implementing proxy endpoint
- Password field made required for security (was incorrectly optional)

### Removed
- Special authentication route for James (`/api/products/chatbot/authenticate-james`)
- Fake/hardcoded data from admin dashboard
- Data enrichment module from active products (not yet available)
- Test licenses and duplicate entries for harry@intelagentstudios.com

## [2025-01-26] - Universal Product Configuration System

### Added
- **Universal ProductConfigurator Component** (`components/products/ProductConfigurator.tsx`)
  - Single component handles configuration for all products (chatbot, sales-agent, data-enrichment, setup-agent)
  - Supports multiple field types: text, select, multiselect, textarea, url, email
  - Password-based authentication for enhanced security
  - Custom field configurations per product type

- **Universal Configuration API Endpoint** (`/api/products/configure`)
  - Single endpoint for all product configurations
  - Product-specific key generation with prefixes (chat_, sale_, data_, agnt_)
  - Metadata storage for configuration details
  - Duplicate configuration detection and reuse

- **Individual Product Setup Pages**
  - `/products/chatbot/setup-agent-frame` - Chatbot configuration
  - `/products/sales-agent/setup` - Sales Agent configuration
  - `/products/data-enrichment/setup` - Data Enrichment configuration
  - `/products/setup-agent/setup` - Setup Agent configuration
  - `/products/configure` - Universal configuration page with product selection

- **Quick Setup Endpoint** (`/api/products/chatbot/quick-setup`)
  - Domain + password authentication method
  - Automatic license validation
  - Existing configuration detection

### Changed
- **Replaced Conversational Setup Agent with Form-Based Configuration**
  - Previous: 5-7 message conversation flow with N8N webhook integration
  - New: Single form submission with instant configuration
  - Improved UX and reduced complexity

- **Updated Dashboard Product Navigation**
  - Unconfigured products now route to form-based setup pages
  - Configured products route to management pages
  - Dynamic button text: "Configure" for new, "Manage" for existing

- **Enhanced Security**
  - No longer exposes license keys in client-side forms
  - Uses password authentication for all configurations
  - License validation happens server-side only

### Removed
- Conversational Setup Agent iframe implementation
- Complex N8N webhook integration for product setup
- License key input fields from client-facing forms

### Technical Details

#### Product Configuration Fields

**Chatbot**
- Domain (required) - Website where chatbot will be installed

**Sales Agent**
- Domain (required) - Business website
- Industry (required) - Business industry selection
- Target Audience (optional) - Ideal customer description

**Data Enrichment**
- API Endpoint (required) - Webhook URL for enriched data
- Data Sources (required) - Multi-select from available sources
- Refresh Rate (required) - Update frequency selection

**Setup Agent**
- Company Name (required) - For personalized responses
- Onboarding Steps (optional) - Custom onboarding flow

#### Database Schema Updates
- Product keys stored with comprehensive metadata
- Configuration tracking includes user, timestamp, and method
- Support for domain-based duplicate detection

### Benefits
1. **Simplified User Experience** - Single form submission vs multi-step conversation
2. **Improved Security** - Password-based authentication, no license key exposure
3. **Better Maintainability** - Single component and API endpoint for all products
4. **Increased Flexibility** - Easy to add new products or modify fields
5. **Reduced Dependencies** - Removed complex N8N workflow requirements

### Migration Notes
- Existing product keys remain valid and functional
- Old Setup Agent webhook endpoints deprecated but not removed
- Previous configurations automatically detected and reused

### Files Modified
- `apps/customer-portal/components/products/ProductConfigurator.tsx` (NEW)
- `apps/customer-portal/app/api/products/configure/route.ts` (NEW)
- `apps/customer-portal/app/api/products/chatbot/quick-setup/route.ts` (NEW)
- `apps/customer-portal/app/products/chatbot/configure/page.tsx` (NEW)
- `apps/customer-portal/app/products/configure/page.tsx` (NEW)
- `apps/customer-portal/app/products/chatbot/setup-agent-frame/page.tsx` (MODIFIED)
- `apps/customer-portal/app/products/sales-agent/setup/page.tsx` (MODIFIED)
- `apps/customer-portal/app/products/data-enrichment/setup/page.tsx` (NEW)
- `apps/customer-portal/app/products/setup-agent/setup/page.tsx` (NEW)
- `apps/customer-portal/app/dashboard/page.tsx` (MODIFIED)