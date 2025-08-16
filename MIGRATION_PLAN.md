# Migration Plan: Consolidating to Unified Platform

## Overview
This document outlines the step-by-step migration plan to consolidate the existing separate products into the unified Intelagent Platform.

## Current State

### Existing Components
1. **Intelagent Chatbot** (./Intelagent Chatbot/)
   - Complete product with setup agent
   - N8N webhook integration
   - Static frontend with widget

2. **Intelagent Sales Agent** (./Intelagent Sales Agent/)
   - Next.js dashboard
   - API backend
   - Database schema in sales_agent

3. **Intelagent Enrichment** (./Intelagent Enrichment/)
   - Standalone enrichment service
   - Email finder, web scraper, company enricher

4. **Dashboard** (./Dashboard/)
   - Unified dashboard (current)
   - Mixed admin/customer views
   - Prisma with public schema

## Migration Steps

### Phase 1: Repository Restructuring (Week 1)

#### Step 1.1: Move Chatbot Product
```bash
# Move chatbot components
mv "Intelagent Chatbot" products/chatbot
cd products/chatbot
npm init -y
# Update package.json name to @intelagent/chatbot
```

**Files to migrate:**
- server.js → products/chatbot/src/server.ts
- public/widget.js → products/chatbot/src/widget/widget.ts
- public/setup_agent.html → products/chatbot/src/setup/index.html

#### Step 1.2: Move Sales Agent
```bash
# Move sales agent
mv "Intelagent Sales Agent/api" products/sales-agent
mv "Intelagent Sales Agent/app" apps/sales-dashboard
```

**Components to extract:**
- Lead discovery → services/lead-discovery
- Email generation → products/sales-agent/src/email
- Campaign management → products/sales-agent/src/campaigns

#### Step 1.3: Move Enrichment Service
```bash
# Move enrichment as a service
mv "Intelagent Enrichment" services/enrichment
```

**Modularize:**
- Email finder → services/enrichment/src/modules/email
- Web scraper → services/enrichment/src/modules/scraper
- Company enricher → services/enrichment/src/modules/company

#### Step 1.4: Split Dashboard
```bash
# Split current dashboard
cp -r Dashboard apps/admin-portal
cp -r Dashboard apps/customer-portal
```

**Admin Portal** (apps/admin-portal):
- Keep master admin views
- License management
- System overview
- Revenue tracking

**Customer Portal** (apps/customer-portal):
- Product dashboards
- Usage analytics
- AI insights (premium)
- Settings

### Phase 2: Setup Agent Modularization (Week 2)

#### Step 2.1: Extract Setup Agent
Create standalone setup agent service:

```typescript
// products/setup-agent/src/index.ts
export class SetupAgent {
  constructor(config: SetupConfig) {}
  
  async createSession(product: string): Promise<Session> {}
  async processStep(sessionId: string, data: any): Promise<StepResult> {}
  async completeSession(sessionId: string): Promise<CompletionResult> {}
}
```

#### Step 2.2: Create Setup API
```typescript
// products/setup-agent/src/api/routes.ts
POST /api/setup/session        // Create new session
GET  /api/setup/session/:id    // Get session status
POST /api/setup/session/:id/step  // Process step
POST /api/setup/session/:id/complete  // Complete session
```

#### Step 2.3: Integrate with Products
- Chatbot: Use for initial setup
- Sales Agent: Use for campaign creation
- Any new product: Plug-and-play integration

### Phase 3: Database Consolidation (Week 2)

#### Step 3.1: Create Unified Schema
```sql
-- packages/database/prisma/schema.prisma
-- Multi-schema setup
schemas = ["public", "sales_agent", "chatbot", "enrichment"]
```

#### Step 3.2: Migrate Data
1. Backup all existing data
2. Create migration scripts
3. Test migrations on staging
4. Execute production migration

#### Step 3.3: Update Connections
- Update all connection strings
- Test all database operations
- Verify data integrity

### Phase 4: Authentication Unification (Week 3)

#### Step 4.1: Implement Central Auth
```typescript
// packages/auth/src/index.ts
export class AuthService {
  validateLicense(key: string): Promise<License>
  createSession(license: License): Promise<Session>
  validateSession(token: string): Promise<User>
}
```

#### Step 4.2: Update All Products
- Replace individual auth with central auth
- Update API endpoints
- Test authorization flows

### Phase 5: UI Component Library (Week 3)

#### Step 5.1: Extract Shared Components
```typescript
// packages/ui/src/components/
- Button
- Card
- Dialog
- Table
- Chart
- Form components
```

#### Step 5.2: Standardize Styling
- Create unified theme
- Consistent color palette
- Shared Tailwind config

### Phase 6: AI Insights Integration (Week 4)

#### Step 6.1: Create AI Service
```typescript
// services/ai-insights/src/index.ts
export class AIInsightsService {
  analyzeData(product: string, data: any): Promise<Insights>
  generatePredictions(historical: any): Promise<Predictions>
  getRecommendations(metrics: any): Promise<Recommendations>
}
```

#### Step 6.2: Integrate with Dashboard
- Add insights tab
- Premium feature gate
- Real-time updates

### Phase 7: Testing & Quality Assurance (Week 4)

#### Step 7.1: Unit Tests
- Test all core functions
- Test API endpoints
- Test UI components

#### Step 7.2: Integration Tests
- Test product interactions
- Test auth flows
- Test data flows

#### Step 7.3: Load Testing
- Test with production-like load
- Identify bottlenecks
- Optimize performance

### Phase 8: Deployment (Week 5)

#### Step 8.1: Staging Deployment
1. Deploy to staging environment
2. Full system test
3. User acceptance testing

#### Step 8.2: Production Rollout
1. Gradual rollout (10% → 50% → 100%)
2. Monitor metrics
3. Quick rollback plan ready

#### Step 8.3: DNS & Routing Updates
- Update DNS records
- Configure load balancers
- Set up CDN

## File Movement Map

### Chatbot Files
```
Intelagent Chatbot/server.js → products/chatbot/src/server.ts
Intelagent Chatbot/public/widget.js → products/chatbot/src/widget/index.ts
Intelagent Chatbot/public/setup_agent.html → products/setup-agent/src/templates/default.html
```

### Sales Agent Files
```
Intelagent Sales Agent/api/src/ → products/sales-agent/src/
Intelagent Sales Agent/dashboard/ → apps/sales-dashboard/
Intelagent Sales Agent/prisma/schema.prisma → packages/database/prisma/sales.prisma
```

### Enrichment Files
```
Intelagent Enrichment/src/modules/ → services/enrichment/src/modules/
Intelagent Enrichment/src/api/routes.js → services/enrichment/src/api/routes.ts
```

### Dashboard Files
```
Dashboard/components/dashboard/ → packages/ui/src/components/dashboard/
Dashboard/app/api/dashboard/ → apps/admin-portal/app/api/
Dashboard/lib/auth.ts → packages/auth/src/auth.ts
```

## Environment Variables

### New Structure
```env
# Platform
PLATFORM_URL=https://platform.intelagent.com
API_URL=https://api.intelagent.com

# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Auth
JWT_SECRET=...
MASTER_LICENSE_KEY=...

# Products
CHATBOT_WEBHOOK_URL=...
SALES_AGENT_API_KEY=...
ENRICHMENT_API_KEY=...

# Services
AI_SERVICE_URL=...
WEBHOOK_SERVICE_URL=...

# External
OPENAI_API_KEY=...
SENDGRID_API_KEY=...
```

## Rollback Plan

If issues arise during migration:

1. **Database Rollback**
   - Restore from backup
   - Revert schema changes
   - Update connection strings

2. **Code Rollback**
   - Git revert to previous commit
   - Redeploy previous version
   - Update DNS if needed

3. **Communication**
   - Notify affected users
   - Provide status updates
   - Document issues for post-mortem

## Success Metrics

### Technical Metrics
- [ ] All tests passing (>80% coverage)
- [ ] Response time <200ms (p95)
- [ ] Error rate <0.1%
- [ ] Uptime >99.9%

### Business Metrics
- [ ] User adoption rate >80%
- [ ] Support tickets <10% increase
- [ ] Feature usage across products
- [ ] Customer satisfaction maintained

## Timeline

| Week | Phase | Tasks |
|------|-------|-------|
| 1 | Repository Setup | Move files, create structure |
| 2 | Core Services | Setup agent, database |
| 3 | Platform Features | Auth, UI library |
| 4 | Integration & Testing | AI insights, QA |
| 5 | Deployment | Staging, production rollout |

## Team Responsibilities

- **Harry (Lead)**: Architecture, coordination
- **Backend Team**: API migration, database
- **Frontend Team**: UI consolidation, dashboards
- **DevOps**: Infrastructure, deployment
- **QA**: Testing, validation

## Risk Mitigation

### High-Risk Areas
1. **Database Migration**: Extensive testing, backup strategy
2. **Authentication Changes**: Gradual rollout, fallback auth
3. **Customer Impact**: Clear communication, support ready

### Contingency Plans
- 24/7 on-call during migration
- Rollback procedures documented
- Customer support briefed
- Status page ready

## Post-Migration

### Week 6-7: Stabilization
- Monitor all metrics
- Address any issues
- Gather feedback
- Performance optimization

### Week 8: Enhancement
- Enable new features
- Cross-product integrations
- Premium features rollout
- Documentation updates

## Checklist

### Pre-Migration
- [ ] All code committed
- [ ] Backups created
- [ ] Team briefed
- [ ] Customers notified

### During Migration
- [ ] Follow runbook
- [ ] Monitor metrics
- [ ] Test each phase
- [ ] Document issues

### Post-Migration
- [ ] Verify all features
- [ ] Update documentation
- [ ] Customer communication
- [ ] Post-mortem meeting

---

**Note**: This migration plan is a living document. Update as needed based on discoveries during implementation.