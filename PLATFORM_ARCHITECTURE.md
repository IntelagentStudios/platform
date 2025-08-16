# Intelagent Platform Architecture

## Overview
The Intelagent Platform is a consolidated, modular business automation system that integrates multiple AI-powered products under a unified dashboard with consistent design and full compatibility.

## Core Components

### 1. Products Suite

#### A. Chatbot Product
- **Description**: AI-powered customer support chatbot
- **Components**:
  - Chat widget (embeddable via JavaScript)
  - Setup Agent (converts form-filling into conversation)
  - N8N webhook integration for real-time responses
  - Vector database for content search
- **Status**: Complete and operational

#### B. Sales Outreach Agent
- **Description**: Automated lead discovery and email outreach system
- **Components**:
  - Lead discovery and enrichment
  - Email finder and validator
  - Company research and analysis
  - Campaign management
  - Template generation and personalization
- **Status**: Mostly complete, needs setup agent integration

#### C. Setup Agent (Modular Service)
- **Description**: Universal conversational interface for complex forms
- **Use Cases**:
  - Product onboarding (current)
  - License activation
  - Configuration wizards
  - Multi-step applications
  - Any form-based workflow
- **Status**: Working for chatbot, needs modularization

### 2. Dashboard System

#### A. Management Portal (Master Admin)
- **Access**: Master license key authentication
- **Features**:
  - Full system overview
  - All customer data access
  - License management
  - Product distribution analytics
  - System configuration
  - Revenue tracking
  - Customer activity monitoring

#### B. Customer Portal
- **Access**: License key authentication
- **Features**:
  - Product-specific dashboards
  - Usage analytics
  - Conversation logs (chatbot)
  - Campaign performance (sales)
  - Smart insights (premium feature)
  - Multi-product view (if licensed)

### 3. Data Architecture

#### A. Database Schema
```
PostgreSQL Multi-Schema Design:
- public schema: Core platform data (licenses, logs, shared items)
- sales_agent schema: Sales agent specific data (leads, campaigns, outreach)
- Future: Additional schemas per product
```

#### B. License System
- Single license key can grant access to multiple products
- Products array in license record: ["chatbot", "sales", "setup"]
- Domain locking for security
- Subscription status tracking

### 4. AI Smart Insights Module (Premium Feature)

#### A. Core Capabilities
- Cross-product data analysis
- Trend detection and anomaly identification
- Predictive analytics
- Actionable recommendations
- Custom queries via natural language

#### B. Access Tiers
- **Basic**: Simple metrics and charts
- **Premium**: AI insights, predictions, recommendations
- **Enterprise**: Custom AI models, advanced analytics

## Implementation Plan

### Phase 1: Repository Setup
```
IntelagentStudios/platform/
├── packages/
│   ├── core/               # Shared utilities, types, configs
│   ├── database/           # Prisma schemas, migrations
│   ├── auth/               # Authentication service
│   └── ui/                 # Shared UI components
├── products/
│   ├── chatbot/            # Chatbot product
│   ├── sales-agent/        # Sales outreach product
│   └── setup-agent/        # Modular setup service
├── apps/
│   ├── dashboard/          # Main dashboard application
│   ├── admin-portal/       # Management dashboard
│   └── customer-portal/    # Customer dashboard
├── services/
│   ├── enrichment/         # Data enrichment service
│   ├── ai-insights/        # AI analytics service
│   └── webhooks/           # Webhook processors
└── infrastructure/
    ├── docker/             # Docker configurations
    ├── kubernetes/         # K8s manifests
    └── terraform/          # Infrastructure as code
```

### Phase 2: Setup Agent Modularization

#### API Design
```typescript
interface SetupAgentConfig {
  productId: string;
  fields: FieldDefinition[];
  validators: ValidationRule[];
  workflow: WorkflowStep[];
  integrations: Integration[];
}

interface SetupSession {
  sessionId: string;
  productId: string;
  currentStep: string;
  collectedData: Record<string, any>;
  validated: boolean;
}
```

#### Integration Points
- REST API for session management
- WebSocket for real-time conversation
- Webhook notifications for completion
- SDK for easy integration

### Phase 3: Portal Separation

#### Management Portal Features
```typescript
// Admin-only routes
/admin/overview          // System-wide metrics
/admin/licenses          // License management
/admin/customers         // Customer management
/admin/revenue           // Financial analytics
/admin/system            // System configuration
/admin/products          // Product management
```

#### Customer Portal Features
```typescript
// Customer routes
/dashboard               // Product dashboard
/products/{product}      // Product-specific view
/analytics               // Usage analytics
/insights                // AI insights (premium)
/settings                // Account settings
/billing                 // Subscription management
```

### Phase 4: Unified Authentication

#### Authentication Flow
1. User enters license key
2. System validates against database
3. JWT token issued with permissions
4. Token includes:
   - License key
   - Products access
   - Premium features flag
   - Admin flag (for master)

#### Security Features
- Domain verification
- Rate limiting
- Session management
- 2FA support (future)

### Phase 5: AI Insights Integration

#### Data Pipeline
```
Products → Data Collection → Processing → AI Analysis → Insights → Dashboard
```

#### Insight Types
- **Operational**: Usage patterns, peak times, error rates
- **Customer**: Engagement trends, satisfaction indicators
- **Predictive**: Future trends, capacity planning
- **Actionable**: Specific recommendations for improvement

## Technical Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn/ui components
- Recharts for visualizations

### Backend
- Node.js with Express
- Next.js API routes
- WebSocket for real-time
- Bull for job queues

### Database
- PostgreSQL with Prisma ORM
- Multi-schema architecture
- Redis for caching (optional)

### Infrastructure
- Railway/Vercel for hosting
- Docker for containerization
- GitHub Actions for CI/CD
- Cloudflare for CDN

## Migration Strategy

### Step 1: Code Consolidation
1. Create monorepo structure
2. Move existing code to appropriate packages
3. Extract shared components
4. Standardize configurations

### Step 2: Database Migration
1. Create unified schema
2. Migrate existing data
3. Update connection strings
4. Test data integrity

### Step 3: Authentication Update
1. Implement new auth system
2. Migrate existing sessions
3. Update all products to use new auth
4. Add portal separation logic

### Step 4: Feature Integration
1. Connect setup agent to all products
2. Implement cross-product data sharing
3. Add AI insights module
4. Enable premium features

### Step 5: Testing & Deployment
1. Unit tests for all components
2. Integration testing
3. Load testing
4. Staged rollout

## API Documentation

### Setup Agent API
```typescript
POST /api/setup/session
GET  /api/setup/session/{id}
POST /api/setup/session/{id}/step
POST /api/setup/session/{id}/complete

WS   /ws/setup/{sessionId}
```

### Dashboard API
```typescript
GET  /api/dashboard/stats
GET  /api/dashboard/products
GET  /api/dashboard/insights
POST /api/dashboard/query
```

### License API
```typescript
POST /api/license/validate
GET  /api/license/{key}/products
POST /api/license/{key}/activate
```

## Monitoring & Analytics

### Key Metrics
- Product usage by license
- API response times
- Error rates by product
- Customer engagement scores
- Revenue per product
- System health indicators

### Logging Strategy
- Structured logging with correlation IDs
- Centralized log aggregation
- Error tracking with Sentry
- Performance monitoring with OpenTelemetry

## Security Considerations

### Data Protection
- Encryption at rest and in transit
- PII data masking in logs
- GDPR compliance
- Regular security audits

### Access Control
- Role-based permissions
- Product-level access control
- API rate limiting
- IP whitelisting for admin

## Future Enhancements

### Planned Features
1. Mobile applications
2. White-label support
3. Custom integrations marketplace
4. Advanced workflow builder
5. Multi-language support
6. Voice interface for setup agent

### Scalability Plans
1. Microservices architecture
2. Kubernetes deployment
3. Global CDN distribution
4. Database sharding
5. Event-driven architecture

## Development Guidelines

### Code Standards
- TypeScript for type safety
- ESLint + Prettier for formatting
- Conventional commits
- Comprehensive documentation
- Test coverage > 80%

### Git Workflow
- Feature branches
- Pull request reviews
- Automated testing
- Semantic versioning
- Protected main branch

## Support & Maintenance

### Documentation
- API documentation with OpenAPI
- User guides per product
- Admin documentation
- Developer documentation
- Video tutorials

### Support Channels
- In-app chat support
- Email support
- Documentation site
- Community forum
- Priority support for premium

## Conclusion

This architecture provides a scalable, maintainable foundation for the Intelagent Platform. The modular design allows for independent development of products while maintaining consistency and compatibility across the platform.