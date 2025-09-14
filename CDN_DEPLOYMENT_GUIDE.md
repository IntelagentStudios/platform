# CDN Deployment Guide for Chatbot Widget

## Overview
This guide explains how to deploy the Intelagent Chatbot widget via CDN for optimal performance and global availability.

## CDN Options

### Option 1: Cloudflare (Recommended - Free Tier Available)

1. **Create Cloudflare Account**
   - Sign up at https://cloudflare.com
   - Add your domain (intelagentstudios.com)

2. **Upload Widget Files**
   - Go to Cloudflare Pages
   - Create new project "intelagent-widget"
   - Upload the `/public/widget` folder

3. **Configure Custom Domain**
   ```
   cdn.intelagentstudios.com → Points to Cloudflare Pages
   ```

4. **Your CDN URL**
   ```
   https://cdn.intelagentstudios.com/widget/v1/chatbot.js
   ```

### Option 2: AWS CloudFront

1. **Create S3 Bucket**
   ```bash
   aws s3 mb s3://intelagent-widget-cdn
   aws s3 cp public/widget/ s3://intelagent-widget-cdn/ --recursive
   ```

2. **Create CloudFront Distribution**
   - Origin: S3 bucket
   - Enable compression
   - Set cache headers

3. **Your CDN URL**
   ```
   https://d1234567890.cloudfront.net/widget/v1/chatbot.js
   ```

### Option 3: Vercel Edge Network (Easiest)

1. **Deploy to Vercel**
   ```bash
   npm i -g vercel
   cd public/widget
   vercel --prod
   ```

2. **Your CDN URL**
   ```
   https://intelagent-widget.vercel.app/v1/chatbot.js
   ```

## Customer Embed Code

Once deployed to CDN, customers will use:

```html
<!-- Production CDN Version -->
<script
  src="https://cdn.intelagentstudios.com/widget/v1/chatbot.js"
  data-product-key="YOUR_PRODUCT_KEY">
</script>
```

## Version Management

### Current Structure
```
/public/widget/
├── v1/
│   └── chatbot.js (current stable)
├── v2/
│   └── chatbot.js (next version)
└── beta/
    └── chatbot.js (testing)
```

### Versioning Strategy
- **v1**: Current stable version
- **v2**: Major updates (breaking changes)
- **beta**: Testing new features
- **latest**: Always points to newest stable

### Cache Control Headers
Add these headers for optimal caching:
```
Cache-Control: public, max-age=3600, s-maxage=86400
```

## Quick Deployment Script

Create `deploy-cdn.sh`:

```bash
#!/bin/bash
# Deploy to Cloudflare Pages
wrangler pages publish public/widget --project-name=intelagent-widget

# Or deploy to Vercel
vercel public/widget --prod

# Or sync to S3
aws s3 sync public/widget/ s3://intelagent-widget-cdn/ --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

## Testing CDN Deployment

1. **Test Load Time**
   ```javascript
   // Add to test page
   console.time('Widget Load');
   const script = document.createElement('script');
   script.src = 'https://cdn.intelagentstudios.com/widget/v1/chatbot.js';
   script.onload = () => console.timeEnd('Widget Load');
   document.head.appendChild(script);
   ```

2. **Verify Global Availability**
   - Use https://www.uptrends.com/tools/cdn-performance-check
   - Test from multiple regions

3. **Monitor Performance**
   - Set up Cloudflare Analytics
   - Monitor load times < 200ms globally

## Widget API Endpoints

The widget communicates with these endpoints:
- Config: `https://dashboard.intelagentstudios.com/api/widget/config`
- Messages: `https://dashboard.intelagentstudios.com/api/chatbot-skills/modular`
- Analytics: `https://dashboard.intelagentstudios.com/api/chatbot/analytics`

## Rollback Procedure

If issues occur:

1. **Immediate Rollback**
   ```bash
   # Point latest to previous version
   cp public/widget/v1/chatbot.js public/widget/latest/chatbot.js
   # Invalidate CDN cache
   curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/purge_cache" \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     -H "Content-Type: application/json" \
     --data '{"purge_everything":true}'
   ```

2. **Notify Customers** (if breaking changes)
   - Use Communications Agent to send update emails
   - Update documentation

## Monitoring & Alerts

Set up monitoring for:
- CDN availability (uptime monitoring)
- Load time performance
- Error rates from widget
- API endpoint health

## Cost Optimization

- **Cloudflare**: Free tier includes 10GB/month
- **AWS CloudFront**: $0.085 per GB after 1TB free
- **Vercel**: 100GB free, then $0.15 per GB

## Security Headers

Add these security headers:
```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Content-Security-Policy: default-src 'self' https://dashboard.intelagentstudios.com
```

## Support

For CDN issues:
- Contact Infrastructure Agent through support portal
- Priority: High for production CDN issues
- Include: Error logs, affected regions, customer impact

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Status**: Ready for deployment