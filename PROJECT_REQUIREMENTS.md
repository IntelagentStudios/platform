# Intelagent Platform - Complete Project Requirements

## 🎯 Project Vision
A unified enterprise platform where clients purchase products on Squarespace, receive license keys, and manage all their Intelagent products through a single dashboard at dashboard.intelagentstudios.com.

## 🏗️ Core Architecture

### Domain Structure
- **Sales Website**: intelagentstudios.com (Squarespace)
- **Customer Dashboard**: dashboard.intelagentstudios.com
- **Master Admin**: Accessible via special license key
- **Database**: PostgreSQL (fully connected)
- **Automation**: n8n workflows

## 📦 Product Ecosystem

### Current Products
1. **Chatbot Service** - AI-powered customer support
2. **Sales Agent** - Automated sales outreach
3. **Enrichment Tool** - Data enrichment service
4. **Setup Agent** - Universal form-filling agent (to be productized)

### Product Tiers
- **Standard**: Individual product + dashboard access
- **Pro Upgrade**: AI intelligence layer across all products
- **Custom**: Tailored solutions built by admin

## 🔐 License & Authentication Flow

### Purchase to Activation
1. **Purchase**: Client buys product on Squarespace
2. **License Generation**: System creates unique license key (format: XXXX-XXXX-XXXX-XXXX)
3. **Welcome Email**: Contains:
   - License key
   - Dashboard signup link
   - Getting started guide
4. **Registration**: Client signs up with:
   - Email (from checkout)
   - License key (for security)
   - Password (created by client)
5. **Access**: Login at dashboard.intelagentstudios.com

### License Management
- **One License, Multiple Products**: Additional purchases link to existing license
- **Master Admin Key**: `INTL-AGNT-BOSS-MODE` (already in database)
- **Custom Products**: Admin can add custom products to any license

## 👥 User Dashboards

### Customer Dashboard (dashboard.intelagentstudios.com)

#### Features
- **Product Overview**: View all purchased products
- **Setup Flow**: 
  - Unsetup products show "Start Setup" button
  - Launches product-specific setup agent
  - Post-setup: Full product management interface
- **Usage Analytics**: Track usage across all products
- **Billing**: View invoices, manage subscriptions
- **Settings**: Account, security, domains

#### Design Requirements
- Simple, sleek, intuitive interface
- Color Palette (RGB):
  - Primary: 229, 227, 220 (light beige)
  - Secondary: 169, 189, 203 (soft blue)
  - Accent: 73, 90, 88 (dark green)
  - Background: 48, 54, 54 (dark grey)

### Master Admin Dashboard

#### Core Functions
- **Business Operations**:
  - Company-wide financial management
  - Revenue tracking (MRR, ARR, LTV)
  - Cost analysis and profitability
  - Invoice and payment management

- **User Management**:
  - View all customers and licenses
  - Add custom products to accounts
  - Suspend/activate licenses
  - Support ticket handling

- **Product Management**:
  - Create new products
  - Configure product features
  - Set pricing and limits
  - Monitor product performance

- **System Administration**:
  - Server health monitoring
  - Service status (all products)
  - Error tracking and debugging
  - Compliance management

- **AI Intelligence** (Built-in):
  - Performance insights
  - Predictive analytics
  - Anomaly detection
  - Smart recommendations

## 🤖 Setup Agent System

### Current State
- Live n8n workflow (chatbot-specific)

### Target State
- **Universal Setup Framework**: Customizable for any form/onboarding
- **Product Integration**: Used by all Intelagent products
- **Standalone Product**: Sellable as independent service

### Features
- Conversational form filling
- Multi-step wizard support
- Validation and error handling
- Progress saving
- API integration capability

## 🧠 Pro AI Layer

### Standard Dashboard (Free with any product)
- Basic analytics
- Product management
- Usage tracking
- Account settings

### Pro AI Upgrade (Paid add-on)
- **Connected Intelligence**: Cross-product insights
- **Smart Suggestions**: 
  - Optimization recommendations
  - Best time to engage
  - Content improvements
- **Predictive Analytics**:
  - Usage forecasting
  - Churn prediction
  - Revenue projections
- **Natural Language Queries**: "Show me this week's performance"
- **Automated Actions**: Smart triggers and workflows

## 🔄 Integration Architecture

### Squarespace → Platform
```
Purchase → Webhook → License Generation → Email → Dashboard Registration
```

### n8n Workflows
- Setup agent orchestration
- License validation
- Product provisioning
- Email automation
- Data enrichment

### Stripe Integration
- Subscription management
- Usage-based billing
- Payment processing
- Invoice generation

## 📊 Technical Specifications

### Database Schema (PostgreSQL)
```sql
-- Core tables already exist and connected
licenses (license_key, email, products, status, etc.)
users (email, password, license_key, role)
products (id, name, features, pricing)
usage (license_key, product_id, metrics)
```

### Environment Variables (Already configured)
- Database connection
- API keys
- Service URLs
- Security tokens

### Performance Targets
- **Scale**: 100,000+ active users
- **Response Time**: <100ms P50, <500ms P95
- **Uptime**: 99.9% SLA
- **Real-time**: WebSocket updates <100ms

## 🚀 Implementation Priorities

### Phase 1: Core Platform (Current Focus)
- [x] Database setup and connection
- [ ] Customer dashboard with product view
- [ ] License key authentication system
- [ ] Product setup flow integration
- [ ] Basic product management interface

### Phase 2: Master Admin
- [ ] Admin authentication (INTL-AGNT-BOSS-MODE)
- [ ] User and license management
- [ ] Financial dashboard
- [ ] System health monitoring
- [ ] Custom product assignment

### Phase 3: Setup Agent Productization
- [ ] Abstract current n8n workflow
- [ ] Create customizable framework
- [ ] Product-specific configurations
- [ ] Standalone product packaging

### Phase 4: Pro AI Layer
- [ ] Cross-product analytics engine
- [ ] AI insight generation
- [ ] Natural language interface
- [ ] Predictive models
- [ ] Smart automation

### Phase 5: Advanced Features (Future)
- [ ] Modular upgrades marketplace
- [ ] Third-party integrations (CRM, social, messaging)
- [ ] Team collaboration (multi-user per license)
- [ ] White-label options
- [ ] API for external developers

## 🎨 Design System

### Colors (RGB)
- **Primary Background**: rgb(48, 54, 54) - Dark grey
- **Secondary Background**: rgb(229, 227, 220) - Light beige
- **Primary Accent**: rgb(169, 189, 203) - Soft blue
- **Secondary Accent**: rgb(73, 90, 88) - Dark green

### UI Principles
- Minimalist and professional
- Clear visual hierarchy
- Consistent spacing and typography
- Mobile-responsive
- Accessibility compliant (WCAG 2.1)
- Dark mode by default with light mode option

## 📈 Success Metrics

### Business KPIs
- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- Churn Rate <5%
- Net Promoter Score >50

### Technical KPIs
- Page Load Time <2s
- API Response Time <200ms
- System Uptime >99.9%
- Error Rate <1%
- Security Score >95

## 🔒 Security Requirements

### Authentication
- Secure password requirements
- Two-factor authentication (optional)
- Session management
- License key validation

### Data Protection
- Encryption at rest and in transit
- GDPR compliance
- Regular backups
- Audit logging
- PCI compliance for payments

## 📝 User Journey

### New Customer
1. Browse products on intelagentstudios.com
2. Purchase product → Receive license key via email
3. Click signup link → Register on dashboard
4. View purchased product → Click "Start Setup"
5. Complete setup agent flow
6. Access full product features in dashboard
7. Purchase additional products (auto-linked to license)
8. Upgrade to Pro for AI features

### Returning Customer
1. Login at dashboard.intelagentstudios.com
2. View all products in unified interface
3. Monitor usage and performance
4. Manage settings and billing
5. Access support and documentation

### Admin Workflow
1. Login with INTL-AGNT-BOSS-MODE
2. Monitor all customers and products
3. View financial metrics and projections
4. Manage system health and services
5. Add custom products to customer accounts
6. Handle support escalations

## 🛠️ Development Guidelines

### Code Standards
- TypeScript for type safety
- React/Next.js for frontend
- Node.js/Express for backend
- PostgreSQL with Prisma ORM
- Redis for caching
- WebSocket for real-time

### Testing Requirements
- Unit tests >80% coverage
- Integration tests for critical paths
- E2E tests for user journeys
- Load testing for 10,000 concurrent users

### Deployment
- Docker containerization
- CI/CD pipeline
- Railway/Vercel hosting
- Zero-downtime deployments
- Automated rollback capability

## 📞 Support Structure

### Customer Support
- In-dashboard help center
- Setup agent assistance
- Email support
- Pro tier: Priority support

### Documentation
- User guides per product
- API documentation
- Video tutorials
- FAQ section

## ✅ Definition of Done

A feature is complete when:
1. Functionality matches requirements
2. UI follows design system
3. Tests pass (unit, integration, E2E)
4. Documentation updated
5. Security review passed
6. Performance benchmarks met
7. Deployed to production
8. Analytics tracking enabled

---

**Last Updated**: December 2024
**Version**: 1.0
**Owner**: Intelagent Studios