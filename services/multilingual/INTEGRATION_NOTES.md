# Multilingual Service Integration Notes

## Overview

The Intelaglot multilingual service has been successfully integrated into the Intelagent Platform as an independently deployable Cloudflare Worker that exposes skills through the orchestrator.

## Architecture

### Service Location
- **Path**: `services/multilingual/`
- **Type**: Cloudflare Worker
- **Entry**: `src/index.ts`

### Skill Endpoints
The service exposes three REST API endpoints that can be called by the orchestrator:

1. **POST /api/skills/translate-content**
   - Translates web pages or raw HTML
   - Supports caching and translation memory
   - Tier: Custom or Pro

2. **POST /api/skills/generate-sitemap**
   - Generates localized sitemaps
   - SEO optimization for multiple languages
   - Tier: Pro only

3. **POST /api/skills/inject-hreflang**
   - Injects hreflang tags for SEO
   - Supports canonical tags
   - Tier: Custom or Pro

## Authentication & Authorization

### Headers Required
```
X-License-Key: <license-key>
X-User-Id: <user-id>
X-Tier: Base|Custom|Pro
```

### Tier Restrictions
- **Base**: No access to multilingual skills
- **Custom**: Access to translate-content and inject-hreflang
- **Pro**: Access to all three skills

## Skill Registration

The skills are registered in the orchestrator at:
- `packages/skills-orchestrator/src/skills/impl/TranslateContentSkill.ts`
- `packages/skills-orchestrator/src/skills/impl/GenerateSitemapSkill.ts`
- `packages/skills-orchestrator/src/skills/impl/InjectHreflangSkill.ts`

They are added to:
- `SkillFactory` for definition
- `SkillsRegistry` for runtime loading

## Database Integration

### Skills Table
The migration at `packages/database/prisma/migrations/add_multilingual_skills.sql` adds the three skills to the database with:
- Proper categorization (communication/seo)
- Cost configuration
- Tier requirements
- Implementation references

### Execution Logging
Each skill execution is logged to `skill_executions` table with:
- Input/output hashes
- Performance metrics
- Provider used (OpenAI/DeepL)
- Cache hit status (edge/kv/miss)

## Deployment

### CI/CD Pipeline
GitHub Actions workflow at `.github/workflows/multilingual.yml`:
- Automatic deployment on push to main/develop
- Tag-based releases (multilingual-v*)
- Separate staging and production environments
- KV namespace management

### Environment Variables
Required secrets in GitHub:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `STAGING_ORIGIN_URL`
- `PRODUCTION_ORIGIN_URL`
- `DEEPL_API_KEY`
- `OPENAI_API_KEY`

## Squarespace Integration

### CORS Support
The service includes full CORS headers for cross-origin requests:
- Allows all origins (configurable)
- Supports OPTIONS preflight
- Headers: Content-Type, X-License-Key, X-User-Id, X-Tier

### Implementation Example
```javascript
// In Squarespace Code Injection
async function translatePage() {
  const response = await fetch('https://intelaglot.workers.dev/api/skills/translate-content', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-License-Key': 'your-key',
      'X-User-Id': 'user-123',
      'X-Tier': 'Pro'
    },
    body: JSON.stringify({
      url: window.location.href,
      locale: 'fr'
    })
  });
  
  const result = await response.json();
  // Use result.html for translated content
}
```

## License & Tier Configuration

### Setting Up Tiers
Configure in the admin portal which tiers have access to which skills:
- Can be sold as individual add-ons
- Or bundled with Pro subscriptions
- Usage-based pricing possible through execution logging

### Monitoring
Track usage through:
- `skill_executions` table for individual calls
- `skill_metrics` table for aggregated stats
- Admin dashboard widgets for visualization

## Performance Optimization

### Edge Proxy Path
The core proxy functionality remains unchanged:
- Direct edge caching for end-user requests
- Translation memory for consistency
- Glossary support for brand terms

### Skill Path
When called as skills:
- Additional auth/logging overhead
- But benefits from orchestrator's queue management
- Can be combined with other skills in workflows

## Security Considerations

1. **API Keys**: Never expose license keys in client-side code
2. **Rate Limiting**: Implement at orchestrator level
3. **Content Validation**: HTML sanitization for XSS prevention
4. **Origin Validation**: Consider restricting CORS origins in production

## Next Steps for AI SEO Agent

Planned additional skills (not implemented yet):

### seo-audit_v1
- AI-powered SEO analysis
- Title/meta/structure checks
- Keyword gap analysis
- Returns scored recommendations

### content-rewrite_v1
- AI rewriting for target locale/keywords
- Maintains brand voice
- Returns diff + updated HTML

### rank-monitor_v1
- Search Console integration
- Rank tracking across locales
- Trend analysis and alerts

### competitor-gap_v1
- Crawl competitor pages
- Identify content opportunities
- Suggest new pages/keywords

These would integrate with existing dashboard widgets for:
- SEO score visualization
- Content opportunity finder
- Rank tracking charts
- Competitor comparison matrix