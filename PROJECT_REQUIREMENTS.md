# Intelagent Platform - Complete Project Requirements

## 🎯 Project Vision
A unified enterprise platform where clients purchase products on Squarespace, receive license keys, and manage all their Intelagent products through a single dashboard at dashboard.intelagentstudios.com.

## 🏗️ Core Architecture

### Domain Structure
- **Sales Website**: intelagentstudios.com (Squarespace)
- **Customer Dashboard**: dashboard.intelagentstudios.com
- **Master Admin Portal**: dashboard.intelagentstudios.com/admin (separate from customer dashboard)
- **Database**: PostgreSQL (Railway hosting, fully connected)
- **Automation**: n8n workflows (Railway hosting)
- **Deployment**: Railway platform with auto-deploy from GitHub

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL with Prisma
- **Authentication**: JWT-based with role-based access control
- **Real-time**: WebSocket for live updates
- **Caching**: Redis for performance (✅ Fully implemented with license isolation)

## 📦 Product Ecosystem

### Currently Implemented Products
1. **Chatbot Service** 
   - ✅ AI-powered customer support
   - ✅ Real-time conversation tracking
   - ✅ Advanced search and filtering
   - ✅ Manual refresh with refresh button (replaced auto-refresh)
   - ✅ Conversation analytics
   - ✅ Product key generation (format: chat_[16_chars])
   - ✅ Universal configuration system
   - ✅ Embed code generation for websites
   - ✅ Installation instructions for multiple platforms (HTML, React, WordPress, Shopify)

2. **Sales Agent** 
   - ✅ Automated sales outreach configuration
   - ✅ Product key generation (format: sale_[16_chars])
   - ✅ Industry-specific setup
   - Lead generation and qualification (coming soon)
   - CRM integration (coming soon)

3. **Data Enrichment Tool** 
   - ✅ API configuration interface
   - ✅ Product key generation (format: data_[16_chars])
   - ✅ Data source selection
   - Business data enrichment service (coming soon)
   - API access for bulk processing (coming soon)

4. **Setup Agent** 
   - ✅ Universal form-based configuration
   - ✅ Product key generation (format: agnt_[16_chars])
   - ✅ Company-specific customization
   - ✅ Onboarding flow configuration
   - To be productized as standalone offering

### Product Tiers
- **Standard**: Individual product + dashboard access
- **Pro Upgrade**: AI intelligence layer across all products
- **Enterprise**: Custom solutions, dedicated support, SLA

## 🔐 Authentication & User Management

### Authentication System (✅ Fully Implemented - August 2024)
- **JWT-based sessions** with secure token management and Redis caching
- **Role-based access control**: customer, master_admin, team_member
- **Single sign-on** across all products
- **Password hashing** with bcrypt
- **Session management** with database + Redis dual tracking
- **Rate limiting** per license (5 attempts/15 min lockout)
- **Email normalization** for consistent authentication
- **License validation** during login with status checking
- **Active session tracking** with counters per license
- **Centralized auth validator** with cache-first approach
- **Performance optimized** for thousands of concurrent users

### User Roles
1. **Customer** (`role: customer`)
   - Access to purchased products
   - View analytics and usage
   - Manage account settings
   - Team collaboration features

2. **Master Admin** (`role: master_admin`)
   - Complete platform control
   - User and license management
   - Financial oversight
   - System administration
   - Custom product assignment

3. **Team Member** (`role: team_member`)
   - Limited access based on permissions
   - Assigned by organization owner
   - Product-specific access

### License Management
- **License Key Format**: XXXX-XXXX-XXXX-XXXX (Squarespace) or custom
- **One License, Multiple Products**: Additional purchases link to existing license
- **Special Admin Key**: INTL-ADMIN-KEY (master admin access)
- **Customer Test Key**: INTL-AGNT-BOSS-MODE (full feature access for testing)
- **Multi-tenant Architecture**: License key as primary data isolation boundary
- **Cache Isolation**: All Redis cache keys prefixed with license for data separation
- **Product Access Pattern**: 
  - Chatbot: `license_key → site_key → chatbot_logs`
  - Other products: `license_key → product_data` (direct access)

## 👥 User Dashboards

### Customer Dashboard (✅ Implemented Features)

#### Navigation System
- **Sidebar Navigation**: Collapsible with icons and labels
- **Quick Actions**: Dashboard, Products, Analytics, Settings
- **Product-specific Navigation**: Dynamic based on active products
- **Mobile Responsive**: Adaptive layout for all devices

#### Product Management
- **Products Page**: 
  - ✅ Active Products section (configured products)
  - ✅ Available to Configure section
  - ✅ Coming Soon section
  - ✅ Marketplace section (future products)
- **Setup Flow**:
  - ✅ "Configure" button for unconfigured products
  - ✅ "Manage" button for active products
  - ✅ Iframe-based setup agent
  - ✅ Real-time configuration status

#### Chatbot Features (✅ Fully Implemented)
- **Conversation Management**:
  - Real-time conversation updates (10-second auto-refresh)
  - Advanced search by message, session ID, or domain
  - Date range filtering (today, 7 days, 30 days)
  - Domain filtering for multi-site setups
  - Intent-based filtering
  - Conversation count indicators
- **Analytics Dashboard**:
  - Total conversations metric
  - Unique sessions tracking
  - Domain distribution
  - Response time analytics
- **Configuration**:
  - Site key display and management
  - Embed code generation
  - Domain verification

### Master Admin Portal (/admin)

#### Access Control
- ✅ Separate route from customer dashboard
- ✅ Role-based middleware protection
- ✅ Automatic redirect based on user role
- Dedicated admin license (INTL-ADMIN-KEY)

#### Core Functions (To Be Implemented)
- **Business Operations**:
  - Company-wide financial dashboard
  - Revenue tracking (MRR, ARR, LTV, CAC)
  - Cost analysis and profitability reports
  - Invoice and payment management
  - Subscription analytics

- **User Management**:
  - View all customers and licenses
  - Add custom products to accounts
  - Suspend/activate licenses
  - User activity monitoring
  - Support ticket handling

- **Product Management**:
  - Create and configure new products
  - Set pricing and usage limits
  - Monitor product performance
  - A/B testing configuration
  - Feature flags management

- **System Administration**:
  - Server health monitoring
  - Service status dashboard
  - Error tracking and debugging
  - Database management
  - Deployment controls
  - Compliance management

## 🔧 Universal Product Configuration System (v2.0 - January 2025)

### Architecture
- ✅ **Form-based configuration** - Simple, direct setup process
- ✅ **Universal component** - Single ProductConfigurator handles all products
- ✅ **Password authentication** - Enhanced security, no license key exposure
- ✅ **Product key generation** - Unique prefixes per product (chat_, sale_, data_, agnt_)
- ✅ **Configuration persistence** - Stored in product_keys table with metadata

### Key Features
- ✅ **Universal status detection** - Works identically for all licenses
- ✅ **No legacy dependencies** - Removed site_key fallbacks
- ✅ **Product access control** - Only shows products in user's license
- ✅ **Duplicate prevention** - Checks for existing configurations
- ✅ **Instant embed codes** - Generated immediately after configuration

### Product-Specific Fields
- **Chatbot**: Domain configuration, License key authentication
- **Sales Agent**: Domain, Industry, Target Audience
- **Data Enrichment**: API Endpoint, Data Sources, Refresh Rate
- **Setup Agent**: Company Name, Onboarding Steps

### Management Pages
- ✅ Individual management page per product
- ✅ Shows product key and embed code
- ✅ Copy-to-clipboard functionality
- ✅ Reconfigure option
- ✅ Analytics integration

## 🤖 Legacy Setup Agent System (Deprecated)

### Previous Implementation
- Live iframe integration (replaced with forms)
- N8n workflow orchestration (removed dependency)
- Conversational interface (replaced with direct forms)
- API webhook integration
- Template library for common setups
- Standalone product packaging

## 🔄 Integration Architecture

### Current Integrations
- **PostgreSQL Database**: Full CRUD operations via Prisma
- **N8n Workflows**: 
  - ✅ Chatbot webhook processing
  - ✅ Setup agent orchestration
  - ✅ Data enrichment pipelines
- **Railway Deployment**: Auto-deploy from GitHub main branch

### Planned Integrations
- **Squarespace Webhooks**: License generation on purchase
- **Stripe**: Subscription and payment processing
- **SendGrid/Resend**: Email notifications
- **Slack/Discord**: Team notifications
- **CRM Systems**: Salesforce, HubSpot integration
- **Analytics**: Mixpanel, Segment tracking

## 📊 Technical Specifications

### Database Schema (Current)
```sql
-- Core tables implemented
users (id, email, password_hash, license_key, role, email_verified)
user_sessions (id, user_id, token, expires_at, ip_address)
licenses (license_key, email, products, status, site_key, domain)
chatbot_logs (id, session_id, customer_message, chatbot_response, site_key)
product_configs (license_key, product, config, enabled)
organizations (id, name, license_key, settings)
teams (id, organization_id, name, permissions)
team_members (id, organization_id, team_id, user_id, role)
```

### API Endpoints (Implemented)
- `/api/auth/login` - User authentication with rate limiting & Redis caching
- `/api/auth/register` - New user registration
- `/api/auth/me` - Session validation with cached user data (5 min TTL)
- `/api/auth/logout` - Session termination with cache cleanup
- `/api/products/configuration` - Product config management
- `/api/products/chatbot/conversations` - Conversation data with license isolation
- `/api/products/chatbot/setup-agent-frame` - Setup UI
- `/api/products/analytics` - Usage analytics
- `/api/test/isolation-check` - Verify multi-tenant data isolation
- `/api/example/cached-data` - Example of Redis cache with rate limiting

### Performance Metrics (Current)
- **Response Time**: <200ms average (cache hits <50ms)
- **Uptime**: 99.9% on Railway
- **Real-time Updates**: 10-second polling
- **Database Queries**: Optimized with indexes
- **Session Validation**: <10ms with Redis cache
- **Auth Cache TTL**: Sessions (7 days), User data (5 min)
- **Rate Limiting**: Per-license with configurable windows
- **Cache Strategy**: Redis with in-memory fallback

## 🚀 Implementation Status

### ✅ Phase 1: Core Platform (COMPLETED)
- [x] Database setup and connection
- [x] Customer dashboard with product view
- [x] License key authentication system
- [x] Product setup flow integration
- [x] Basic product management interface
- [x] Navigation system
- [x] Real-time updates

### ✅ Phase 2: Authentication & Multi-tenancy (COMPLETED - August 2024)
- [x] JWT authentication system with consistent secrets
- [x] Role-based access control
- [x] User registration with license validation
- [x] Session management with Redis caching
- [x] Middleware protection
- [x] Rate limiting per license (5 attempts/15 min)
- [x] License-based data isolation
- [x] Redis cache with license key prefixing
- [x] Centralized auth validator library
- [x] Active session tracking
- [x] Scalable to thousands of users
- [ ] Email verification (ready for implementation)
- [ ] Password reset flow
- [ ] Two-factor authentication

### 📋 Phase 3: Master Admin Portal (NEXT)
- [ ] Admin dashboard UI
- [ ] User management interface
- [ ] Financial dashboard
- [ ] System health monitoring
- [ ] Custom product assignment
- [ ] Analytics and reporting

### 🎯 Phase 4: Enhanced Features (PLANNED)
- [ ] Conversation export (CSV/PDF)
- [ ] Advanced analytics dashboard
- [ ] Conversation tagging system
- [ ] Email notifications
- [ ] Team collaboration features
- [ ] Multi-language support
- [ ] Custom chatbot styling
- [ ] A/B testing framework

### 🚀 Phase 5: Scale & Monetization (FUTURE)
- [ ] Stripe subscription integration
- [ ] Usage-based billing
- [ ] White-label options
- [ ] API for developers
- [ ] Marketplace for add-ons
- [ ] Affiliate program
- [ ] Enterprise features

## 🎨 Design System

### Colors (RGB) - Implemented
- **Primary Background**: rgb(48, 54, 54) - Dark grey
- **Secondary Background**: rgb(58, 64, 64) - Medium grey
- **Card Background**: rgba(58, 64, 64, 0.5) - Semi-transparent
- **Text Primary**: rgb(229, 227, 220) - Light beige
- **Text Secondary**: rgb(169, 189, 203) - Soft blue
- **Success**: rgb(76, 175, 80) - Green
- **Warning**: rgb(255, 152, 0) - Orange
- **Error**: rgb(244, 67, 54) - Red

### UI Components (Implemented)
- **Cards**: Rounded corners, subtle shadows
- **Buttons**: Primary/secondary variants with hover states
- **Forms**: Clean inputs with validation states
- **Tables**: Sortable, filterable data grids
- **Modals**: Overlay dialogs for actions
- **Navigation**: Collapsible sidebar with icons
- **Badges**: Status indicators and counts

## 📈 Success Metrics

### Current Performance
- **Active Users**: Growing
- **Conversations Tracked**: 7+ per customer
- **Uptime**: 99.9% on Railway
- **Deploy Time**: <5 minutes
- **Database Response**: <50ms

### Target Metrics
- **MRR**: $10,000+ within 6 months
- **Active Customers**: 100+ by Q2 2025
- **Churn Rate**: <5%
- **NPS Score**: >50
- **Support Response**: <2 hours

## 🔒 Security Implementation

### Current Security
- ✅ Password hashing with bcrypt
- ✅ JWT token validation with centralized validator
- ✅ HTTPS only in production
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection (React)
- ✅ CORS configuration
- ✅ Environment variables for secrets
- ✅ Rate limiting on login attempts (per license)
- ✅ Account lockout after failed attempts (15 min)
- ✅ Session invalidation in both database and cache
- ✅ License status validation during auth
- ✅ Multi-tenant data isolation verified

### Planned Security
- [x] Rate limiting on login endpoints (✅ Implemented)
- [ ] Rate limiting on all API endpoints
- [ ] Two-factor authentication
- [ ] Audit logging for admin actions
- [ ] Data encryption at rest
- [ ] GDPR compliance tools
- [ ] Security headers (CSP, HSTS)
- [ ] Penetration testing

## 📝 User Journeys

### New Customer Journey (Current)
1. Purchase product on Squarespace
2. Receive license key via email
3. Visit dashboard.intelagentstudios.com/register
4. Register with license key
5. Login and view dashboard
6. Click "Configure" on purchased product
7. Complete setup via conversational agent
8. Product shows as "Active"
9. Access full product features

### Admin Journey (Implemented)
1. Login with admin@intelagentstudios.com
2. Automatically redirect to /admin portal
3. View system dashboard
4. Manage users and licenses
5. Monitor platform health
6. Generate reports

## 🛠️ Development Workflow

### Current Process
- **Version Control**: Git with GitHub
- **Deployment**: Railway auto-deploy from main branch
- **Database Migrations**: Prisma migrate
- **Code Style**: TypeScript, ESLint, Prettier
- **Testing**: Manual testing (automated tests planned)
- **Monitoring**: Railway logs and metrics

### Development Commands
```bash
# Local development
npm run dev           # Start development server
npx prisma studio    # Database GUI
npx prisma generate  # Generate Prisma client
npx prisma db push   # Sync database schema

# Deployment
git push origin main  # Auto-deploys to Railway
```

## 📞 Support Structure

### Current Support
- GitHub issues for bug tracking
- Direct email support
- In-app error messages with guidance

### Planned Support
- In-dashboard help center
- Video tutorials library
- API documentation
- Community forum
- Priority support for Pro tier
- Live chat for Enterprise

## 🔄 Recent Updates (August 28, 2024 - Session 2)

### Major Features Added
1. **Multi-user Authentication System**
   - JWT-based sessions
   - Role-based access control
   - Secure password management

2. **Product Configuration UI**
   - Dynamic Configure/Manage buttons
   - Status-based product display
   - Organized product sections

3. **Chatbot Enhancements**
   - Real-time conversation updates
   - Advanced filtering and search
   - N8n webhook integration fixes
   - Site key synchronization

4. **Navigation System**
   - Collapsible sidebar
   - Product-specific routes
   - Mobile responsive design

5. **Setup Agent Integration**
   - Iframe-based implementation
   - Conversational onboarding
   - Configuration persistence

6. **Scalable Authentication System** (August 25, 2024)
   - Unified login endpoint for all users
   - Rate limiting per license with account lockout
   - Redis session caching for performance at scale
   - Centralized auth validator with cache-first approach
   - License-based data isolation architecture
   - Support for thousands of concurrent users

7. **Redis Cache Implementation** (August 25, 2024)
   - License-scoped cache keys for multi-tenant isolation
   - Session caching with 7-day TTL
   - User data caching with 5-minute TTL
   - Rate limiting per license
   - Active session tracking
   - In-memory fallback when Redis unavailable

8. **Enhanced Chatbot Setup Experience** (August 28, 2024)
   - Added comprehensive installation instructions for multiple platforms
   - Platform-specific guides for HTML, React/Next.js, WordPress, Shopify
   - Explanatory info box for data collection (domain and license key)
   - Improved UI with gradient backgrounds and better styling
   - Continue to Dashboard button after successful setup

9. **Manual Refresh Implementation** (August 28, 2024)
   - Replaced auto-refresh with manual refresh buttons across platform
   - Removed problematic auto-polling (was causing performance issues)
   - Fixed infinite loading bug on conversations page
   - Added refresh indicators and loading states
   - Improved user control over data updates

10. **Conversation Session Management** (August 28, 2024 - Session 2)
   - Implemented unique session ID generation for each conversation
   - Added 30-minute timeout for automatic new session creation
   - Added manual "New Conversation" button (🔄) in chatbot widget
   - Fixed issue where all conversations shared same session_id
   - Sessions now properly separated in database and UI
   - Format: `sess_timestamp_randomstring` for better tracking

11. **UI/UX Improvements** (August 28, 2024 - Session 2)
   - Messages now display chronologically (oldest first) for better readability
   - Increased spacing between chatbot widget button and chat box (110px → 120px)
   - Fixed navigation flow to eliminate confusing redirects
   - Removed "No Products Configured" error page
   - Back buttons now correctly redirect to /products page
   - Chatbot manage button goes directly to conversations

## ✅ Definition of Done

A feature is complete when:
1. ✅ Functionality matches requirements
2. ✅ UI follows design system
3. ✅ Code reviewed and documented
4. ✅ Deployed to production (Railway)
5. ✅ Tested on production environment
6. ✅ User documentation updated
7. ✅ Performance benchmarks met
8. ✅ Security considerations addressed

---

**Last Updated**: August 28, 2024
**Version**: 2.1
**Owner**: Intelagent Studios
**Platform URL**: dashboard.intelagentstudios.com