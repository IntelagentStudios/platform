# n8n Webhook Deprecation Timeline

## Overview
This document outlines the phased deprecation of the n8n webhook chatbot system in favor of the native skills-based implementation.

## Current State (January 2025)
- **Primary System**: Skills API (default)
- **Legacy System**: n8n webhook (opt-in via `data-mode="n8n"`)
- **Both systems**: Fully operational and monitored

## Deprecation Schedule

### Phase 1: Silent Migration (Weeks 1-2)
**Status**: IN PROGRESS
**Target**: January 15-29, 2025

- [x] Deploy skills system as default
- [x] Set up monitoring for both systems
- [x] Document rollback procedures
- [ ] Monitor error rates and performance
- [ ] Gather initial metrics
- [ ] Fix any critical bugs

**Success Criteria**:
- Skills API error rate < 1%
- Average response time < 500ms
- No critical customer complaints

### Phase 2: Soft Launch (Weeks 3-4)
**Target**: January 30 - February 12, 2025

- [ ] Select 20% of customers for migration feedback
- [ ] Send communication about improved performance
- [ ] Create migration guide for customers
- [ ] Set up A/B testing dashboard
- [ ] Document customer feedback

**Monitoring Metrics**:
```bash
# Weekly metrics comparison
curl https://dashboard.intelagentstudios.com/api/chatbot-skills/monitoring?period=7d
```

### Phase 3: Broad Migration (Weeks 5-8)
**Target**: February 13 - March 12, 2025

- [ ] Migrate 50% of active customers
- [ ] Update all documentation to skills-first
- [ ] Train support team on new system
- [ ] Create video tutorials
- [ ] Set up automated migration tools

**Customer Communication Template**:
```
Subject: Improved Chatbot Performance Now Available

We've upgraded our chatbot infrastructure for better performance:
- 3x faster response times
- More reliable connections
- Enhanced error recovery

No action needed - your chatbot will automatically use the new system.
```

### Phase 4: Final Migration (Weeks 9-12)
**Target**: March 13 - April 9, 2025

- [ ] Migrate remaining customers
- [ ] Send deprecation notices for n8n mode
- [ ] Update all embed codes in documentation
- [ ] Remove n8n references from UI
- [ ] Prepare for webhook shutdown

**Deprecation Notice**:
```
The legacy n8n webhook mode will be discontinued on April 30, 2025.
Please ensure your embed code doesn't include data-mode="n8n".
```

### Phase 5: n8n Shutdown (Week 13+)
**Target**: April 30, 2025

- [ ] Final backup of n8n workflow
- [ ] Export all n8n conversation logs
- [ ] Redirect n8n endpoint to skills API
- [ ] Cancel n8n infrastructure
- [ ] Archive n8n documentation

## Migration Checkpoints

### Weekly Review Meeting Agenda
Every Thursday at 2:00 PM

1. **Metrics Review** (10 min)
   - Error rates comparison
   - Response times
   - Customer feedback

2. **Issue Triage** (15 min)
   - Critical bugs
   - Performance bottlenecks
   - Customer complaints

3. **Go/No-Go Decision** (5 min)
   - Continue migration?
   - Need rollback?
   - Adjust timeline?

## Risk Mitigation

### High-Risk Scenarios

1. **Skills API Outage**
   - Automatic failover to n8n
   - Alert DevOps team
   - Customer notification if > 1 hour

2. **Performance Degradation**
   - If response time > 2s for > 10% requests
   - Investigate root cause
   - Consider partial rollback

3. **Data Loss**
   - Daily backups of conversations
   - Sync between systems during migration
   - Audit logs for all changes

## Technical Debt Cleanup

### Code to Remove After Deprecation

1. **Widget Code** (`chatbot-widget.js`):
```javascript
// Remove these lines after April 30, 2025
const mode = scriptTag?.getAttribute('data-mode') || 'skills';
const useSkillsSystem = mode !== 'n8n';
// Simplify to just use skills endpoint
```

2. **API Routes**:
- `/api/webhook/chatbot` - Remove entire route
- `/api/chatbot/[siteKey]` - Update to remove n8n references

3. **Test Files**:
- `test-skills-chatbot.html` - Archive
- `test-chatbot.html` - Archive

4. **Documentation**:
- Remove n8n setup guides
- Update API documentation
- Clean README files

## Cost Savings

### Monthly Infrastructure Costs
- **n8n Railway Instance**: $25/month
- **n8n Workflow Maintenance**: 5 hours/month @ $100/hour = $500
- **External API Calls**: $50/month
- **Total Savings**: ~$575/month ($6,900/year)

## Success Metrics

### Target KPIs by April 30, 2025
- **Adoption Rate**: 100% on skills system
- **Response Time**: < 400ms average
- **Error Rate**: < 0.5%
- **Customer Satisfaction**: > 95%
- **Cost Reduction**: $575/month
- **Maintenance Time**: -5 hours/month

## Contingency Plans

### If Migration Stalls
1. Extend dual-mode period by 4 weeks
2. Investigate blocking issues
3. Consider hybrid approach for complex cases
4. Engage n8n support for transition assistance

### If Critical Issues Arise
1. Immediate rollback via widget config
2. Restore n8n as default
3. Post-mortem within 24 hours
4. Revised migration plan within 1 week

## Communication Timeline

| Date | Audience | Message | Channel |
|------|----------|---------|---------|
| Feb 1 | Internal Team | Migration progress update | Slack |
| Feb 15 | Beta Customers | Performance improvements | Email |
| Mar 1 | All Customers | New features available | Newsletter |
| Mar 15 | All Customers | Migration benefits | Blog Post |
| Apr 1 | n8n Users | Deprecation notice | Email |
| Apr 15 | n8n Users | Final reminder | Email + Dashboard |
| Apr 30 | All | n8n sunset complete | Announcement |

## Post-Deprecation Review

### May 2025 Retrospective
- [ ] Document lessons learned
- [ ] Calculate actual vs projected savings
- [ ] Survey customer satisfaction
- [ ] Plan next optimization phase
- [ ] Archive all n8n materials

---

**Note**: This timeline is flexible and can be adjusted based on migration progress and customer feedback. The priority is always a smooth, zero-downtime transition for customers.