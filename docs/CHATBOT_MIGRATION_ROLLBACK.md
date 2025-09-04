# Chatbot Migration Rollback Procedure

## Quick Rollback (< 1 minute)

If critical issues are detected with the skills system, follow these steps for immediate rollback:

### 1. Instant Revert via Widget

```bash
# SSH into production server
ssh production.dashboard.intelagentstudios.com

# Edit the chatbot widget
nano apps/customer-portal/public/chatbot-widget.js

# Find line ~410 and change:
# FROM: const mode = scriptTag?.getAttribute('data-mode') || 'skills';
# TO:   const mode = scriptTag?.getAttribute('data-mode') || 'n8n';

# Save and exit
# The change takes effect immediately for new chat sessions
```

### 2. Force Clear CDN Cache

```bash
# Clear Cloudflare cache (if using)
curl -X POST "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/purge_cache" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://dashboard.intelagentstudios.com/chatbot-widget.js"]}'
```

### 3. Verify Rollback

```bash
# Test that n8n endpoint is being used
curl -X POST https://dashboard.intelagentstudios.com/chatbot-widget.js \
  | grep "n8n Webhook" # Should show n8n as default
```

## Partial Rollback (Specific Customers)

For rolling back specific customers while keeping others on skills system:

### Option 1: Update Customer's Embed Code

```html
<!-- Force specific customer to n8n mode -->
<script src="https://dashboard.intelagentstudios.com/chatbot-widget.js"
        data-product-key="CUSTOMER_KEY"
        data-mode="n8n"></script>
```

### Option 2: Server-Side Override

Add to `/api/chatbot-skills/route.ts`:

```typescript
// Emergency override list
const N8N_OVERRIDE_KEYS = [
  'customer-key-1',
  'customer-key-2'
];

if (N8N_OVERRIDE_KEYS.includes(productKey)) {
  // Redirect to n8n webhook
  return fetch('https://1ntelagent.up.railway.app/webhook/chatbot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}
```

## Database Rollback

If database schema changes were made:

```sql
-- Check recent conversations
SELECT COUNT(*), MAX(created_at) 
FROM chatbot_conversations 
WHERE created_at > NOW() - INTERVAL '1 hour';

-- If needed, restore from backup
pg_restore -d your_database backup_before_migration.sql
```

## Monitoring During Rollback

### Check System Status

```bash
# Monitor error rates
curl https://dashboard.intelagentstudios.com/api/chatbot-skills/monitoring?period=1h

# Check n8n webhook status
curl -I https://1ntelagent.up.railway.app/webhook/chatbot

# View real-time logs
tail -f /var/log/customer-portal/error.log
```

### Key Metrics to Watch

1. **Response Times**: Should return to normal within 5 minutes
2. **Error Rates**: Should drop immediately after rollback
3. **Customer Reports**: Monitor support channels
4. **Database Load**: Check for query bottlenecks

## Post-Rollback Checklist

- [ ] Confirm all customers can access chatbot
- [ ] Verify n8n webhook is responding
- [ ] Check error logs are clean
- [ ] Document issue that caused rollback
- [ ] Notify team of rollback status
- [ ] Schedule post-mortem meeting
- [ ] Update monitoring alerts

## Rollback Testing

Test rollback procedure in staging:

```bash
# 1. Deploy skills version
./scripts/deploy-chatbot-migration.sh

# 2. Simulate failure
# 3. Execute rollback
# 4. Verify functionality
# 5. Document time taken
```

## Emergency Contacts

- **n8n Support**: support@n8n.io
- **Database Admin**: [Contact]
- **DevOps Lead**: [Contact]
- **Customer Success**: [Contact]

## Troubleshooting Common Issues

### Issue: Skills API returns 500 errors
```bash
# Check if database is accessible
npm run prisma:status

# Restart API service
pm2 restart customer-portal

# Check environment variables
env | grep DATABASE_URL
```

### Issue: Customers report blank responses
```bash
# Check if skills are built
ls packages/skills-orchestrator/dist/skills/impl/

# Rebuild if necessary
cd packages/skills-orchestrator && npm run build
```

### Issue: High latency after migration
```bash
# Check database connections
SELECT count(*) FROM pg_stat_activity;

# Restart connection pool
pm2 restart all
```

## Recovery Time Objectives

- **Instant Rollback**: < 1 minute
- **Partial Rollback**: < 5 minutes  
- **Full System Recovery**: < 15 minutes
- **Data Recovery**: < 30 minutes

## Lessons Learned Log

Document each rollback incident:

| Date | Issue | Resolution | Time to Resolve | Prevention |
|------|-------|------------|-----------------|------------|
| | | | | |

---

**Remember**: The dual-mode architecture allows instant rollback without service interruption. Always prioritize customer experience over migration timeline.