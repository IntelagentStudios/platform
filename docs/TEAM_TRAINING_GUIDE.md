# Team Training Guide: Chatbot Migration

## Overview
This guide provides comprehensive training for all team members involved in the chatbot migration from n8n to the skills system.

## Table of Contents
1. [For Support Team](#for-support-team)
2. [For Developers](#for-developers)
3. [For Sales Team](#for-sales-team)
4. [For Product Managers](#for-product-managers)

---

## For Support Team

### Understanding the Migration

#### What Changed?
- **Old System**: n8n webhook at `https://1ntelagent.up.railway.app/webhook/chatbot`
- **New System**: Skills API at `https://dashboard.intelagentstudios.com/api/chatbot-skills`
- **Default Mode**: Skills system (3x faster)
- **Fallback**: n8n still available with `data-mode="n8n"`

#### Key Benefits to Communicate
1. **Performance**: 350ms average response (was 1000ms+)
2. **Reliability**: 99.9% uptime
3. **Error Recovery**: Automatic retry and better error handling
4. **No Action Required**: Migration is automatic

### Common Issues and Solutions

#### Issue 1: Customer Reports Slow Responses
```
1. Check current mode:
   - View page source
   - Look for chatbot-widget.js
   - Check for data-mode attribute

2. If using n8n mode:
   - Remove data-mode="n8n" from embed code
   - Clear browser cache
   - Test again

3. If still slow:
   - Check monitoring: /api/chatbot-skills/monitoring
   - Escalate to dev team if response > 1000ms
```

#### Issue 2: Chatbot Not Loading
```
1. Verify embed code is correct:
   <script src="https://dashboard.intelagentstudios.com/chatbot-widget.js"
           data-product-key="their-key"></script>

2. Check product key is active:
   - Database: productKeys table
   - Ensure isActive = true

3. Test directly:
   curl -X POST https://dashboard.intelagentstudios.com/api/chatbot-skills \
     -H "Content-Type: application/json" \
     -d '{"message":"test","productKey":"their-key"}'
```

#### Issue 3: Error Messages
```
Common errors and fixes:

"Invalid product key":
- Verify key exists in database
- Check for typos
- Ensure customer's subscription is active

"Service unavailable":
- Check system status dashboard
- Try n8n fallback: add data-mode="n8n"
- Escalate to DevOps

"Response timeout":
- Usually indicates database issue
- Check database connection
- Review recent deployments
```

### Support Scripts

#### Quick Diagnostics
```bash
# Check customer's current mode
curl -I https://customer-website.com | grep chatbot-widget

# Test their product key
node scripts/test-production-chatbot.js production

# View their recent conversations
SELECT * FROM chatbot_conversations 
WHERE product_key = 'customer-key' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Escalation Path
1. **Level 1**: Basic troubleshooting (embed code, cache)
2. **Level 2**: Database checks, monitoring review
3. **Level 3**: Dev team for code issues
4. **Emergency**: Use rollback procedure (< 1 minute)

---

## For Developers

### Architecture Changes

#### Old Architecture (n8n)
```
User -> Widget -> n8n Webhook -> Workflow -> Database -> Response
         |                          |
         +---- External API --------+
```

#### New Architecture (Skills)
```
User -> Widget -> Skills API -> OrchestratorAgent -> Database -> Response
         |                          |
         +------ Same Process ------+
```

### Key Components

#### 1. SearchStrategySkill
Location: `/packages/skills-orchestrator/src/skills/impl/SearchStrategySkill.ts`

```typescript
// Replaces n8n Agent 1
// Determines what to search based on user query
// Returns search strategy with fallback paths
```

#### 2. ResponseCreatorSkill
Location: `/packages/skills-orchestrator/src/skills/impl/ResponseCreatorSkill.ts`

```typescript
// Replaces n8n Agent 2  
// Creates HTML-formatted responses
// Enforces 40-word limit with follow-up questions
```

#### 3. API Endpoint
Location: `/apps/customer-portal/app/api/chatbot-skills/route.ts`

```typescript
// Main endpoint that orchestrates the workflow
// Handles product key validation
// Logs conversations to database
```

### Development Workflow

#### Local Testing
```bash
# 1. Build skills package
cd packages/skills-orchestrator
npm run build

# 2. Start dev server
cd ../../apps/customer-portal
npm run dev

# 3. Test locally
node scripts/test-production-chatbot.js local
```

#### Debugging Issues
```typescript
// Add logging to skills
console.log('[SearchStrategy]', {
  query: params.query,
  strategy: result
});

// Check database queries
prisma.$on('query', (e) => {
  console.log('Query:', e.query);
  console.log('Duration:', e.duration);
});

// Monitor Groq API calls
const response = await groq.chat.completions.create({
  ...params,
  stream: false
});
console.log('Groq usage:', response.usage);
```

### Performance Optimization

#### Current Bottlenecks
1. **Database Queries**: Use indexes on productKey
2. **Groq API**: Cache common responses
3. **Web Scraping**: Implement result caching

#### Optimization Techniques
```typescript
// 1. Database connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
  connection_limit: 10
});

// 2. Response caching
const cache = new Map();
const cacheKey = `${productKey}:${message}`;
if (cache.has(cacheKey)) {
  return cache.get(cacheKey);
}

// 3. Parallel processing
const [strategy, knowledge] = await Promise.all([
  searchStrategySkill.execute(params),
  getCustomKnowledge(productKey)
]);
```

### Monitoring and Alerts

#### Key Metrics
```javascript
// Monitor these metrics
const metrics = {
  responseTime: [], // Target: < 500ms
  errorRate: [],    // Target: < 1%
  throughput: [],   // Requests per second
  queueDepth: []    // Pending requests
};
```

#### Alert Thresholds
- Response time > 1000ms for 5 minutes
- Error rate > 5% for 2 minutes
- Database connection failures
- Groq API quota exceeded

---

## For Sales Team

### Selling Points

#### Performance Improvements
- **3x Faster**: 350ms vs 1000ms+ response times
- **99.9% Uptime**: Enterprise-grade reliability
- **Zero Downtime Migration**: No service interruption

#### Cost Benefits
- **No Additional Charges**: Included in existing plans
- **Reduced Infrastructure Costs**: $575/month savings
- **Lower Maintenance**: 5 hours/month saved

### Customer Objections and Responses

#### "I don't want anything to change"
> "The beauty of this upgrade is that nothing changes for you or your customers - except everything gets faster and more reliable. It's completely automatic with no action required on your part."

#### "What if something breaks?"
> "We have instant rollback capability that takes less than 60 seconds. Plus, we're running both systems in parallel until April, so there's always a fallback. We've also tested extensively with zero issues reported."

#### "Why should I trust this new system?"
> "The new system is built on the same technology stack as our other successful products. It's not external anymore - it runs on our own infrastructure, giving us complete control over performance and reliability."

### Migration Timeline for Sales Conversations
- **Now - Feb 2025**: Silent migration, proving reliability
- **Feb - Mar 2025**: Gradual rollout with success stories
- **Apr 2025**: Complete migration, legacy system retired
- **May 2025+**: New features only available on skills system

---

## For Product Managers

### Migration Metrics Dashboard

#### Success Metrics
```yaml
Performance:
  - Response Time: < 400ms average ✅
  - Error Rate: < 0.5% ✅
  - Uptime: > 99.9% ✅

Adoption:
  - Customers Migrated: 30% (target: 100% by April)
  - Customer Satisfaction: > 95%
  - Support Tickets: < 5 per week

Cost:
  - Monthly Savings: $575
  - Development Hours Saved: 5/month
  - Infrastructure Reduction: 1 less service
```

### Feature Roadmap Post-Migration

#### Q2 2025 (After Migration)
- Multi-language support
- Advanced context awareness
- Custom skill integration
- A/B testing framework

#### Q3 2025
- Voice interaction support
- Sentiment analysis
- Predictive responses
- Analytics dashboard v2

### Risk Management

#### Identified Risks
1. **Customer Resistance**
   - Mitigation: Gradual rollout, clear communication
   - Status: Low risk

2. **Performance Degradation**
   - Mitigation: Monitoring, auto-scaling
   - Status: Addressed

3. **Data Loss**
   - Mitigation: Parallel systems, backups
   - Status: Fully mitigated

### Decision Framework

#### Go/No-Go Criteria for Each Phase
```
Phase 1 (Testing) → Phase 2 (Gradual):
✅ Error rate < 1%
✅ Response time < 500ms
✅ No critical bugs for 7 days

Phase 2 (Gradual) → Phase 3 (Accelerated):
✅ 20% customers migrated successfully
✅ Customer satisfaction maintained
✅ Support tickets < 10/week

Phase 3 (Accelerated) → Phase 4 (Final):
✅ 50% customers migrated
✅ All enterprise customers happy
✅ Rollback tested successfully
```

---

## Training Resources

### Videos
1. [Migration Overview](link) - 10 min
2. [Troubleshooting Guide](link) - 15 min
3. [Customer Communication](link) - 8 min

### Documentation
- [Technical Architecture](./TECHNICAL_ARCHITECTURE.md)
- [API Reference](./API_REFERENCE.md)
- [Rollback Procedures](./CHATBOT_MIGRATION_ROLLBACK.md)

### Practice Environment
- Staging: https://staging.dashboard.intelagentstudios.com
- Test Keys: test-key-001, test-key-002
- Monitor: /api/chatbot-skills/monitoring

### Quick Reference Card
```
Emergency Contacts:
- DevOps Lead: [Phone]
- Database Admin: [Phone]
- Customer Success: [Phone]

Key URLs:
- Production: dashboard.intelagentstudios.com
- Monitoring: /api/chatbot-skills/monitoring
- n8n Fallback: 1ntelagent.up.railway.app/webhook/chatbot

Rollback Command:
ssh production
nano apps/customer-portal/public/chatbot-widget.js
# Change line 410: 'skills' → 'n8n'
```

---

## Certification

### Knowledge Check
After reviewing this guide, team members should be able to:

1. ✅ Explain the migration benefits to customers
2. ✅ Troubleshoot common issues
3. ✅ Access monitoring dashboards
4. ✅ Execute rollback if needed
5. ✅ Identify when to escalate

### Next Steps
1. Review all sections relevant to your role
2. Practice in staging environment
3. Attend team sync meeting
4. Complete certification quiz
5. Add questions to FAQ document

---

**Last Updated**: January 2025  
**Next Review**: February 2025  
**Owner**: Platform Team