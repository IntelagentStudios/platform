# Vercel Widget Deployment Guide

## Step 1: Create Vercel Account (if needed)
1. Go to https://vercel.com/signup
2. Sign up with GitHub, GitLab, or email (free)

## Step 2: Login to Vercel CLI
Open Command Prompt and run:
```bash
vercel login
```
This will open your browser to authenticate.

## Step 3: Deploy Your Widget

### Option A: Run the deployment script
```bash
deploy-widget.bat
```

### Option B: Manual deployment
```bash
cd public\widget
vercel --prod
```

When prompted:
- Set up and deploy: **Y**
- Which scope: Select your account
- Link to existing project? **N** (first time)
- Project name: **intelagent-widget** (or press enter for default)
- Directory: **./** (current directory)
- Build Command: (leave blank - no build needed)
- Output Directory: (leave blank)
- Development Command: (leave blank)

## Step 4: Your Widget is Live! 🎉

After deployment, you'll get URLs like:
- Production: `https://intelagent-widget.vercel.app`
- Your widget: `https://intelagent-widget.vercel.app/v1/chatbot.js`

## Step 5: Test Your Widget

Create a test HTML file:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Widget Test</title>
</head>
<body>
    <h1>Testing Intelagent Chatbot</h1>

    <!-- Your deployed widget -->
    <script
      src="https://intelagent-widget.vercel.app/v1/chatbot.js"
      data-product-key="YOUR_PRODUCT_KEY">
    </script>
</body>
</html>
```

## Step 6: Customer Embed Code

Your customers can now use:
```html
<script
  src="https://intelagent-widget.vercel.app/v1/chatbot.js"
  data-product-key="THEIR_PRODUCT_KEY">
</script>
```

## Optional: Custom Domain Setup

1. Go to https://vercel.com/dashboard
2. Click on your **intelagent-widget** project
3. Go to **Settings** → **Domains**
4. Add `cdn.intelagentstudios.com`
5. Add CNAME record in your DNS:
   ```
   cdn.intelagentstudios.com → cname.vercel-dns.com
   ```

Then customers can use:
```html
<script
  src="https://cdn.intelagentstudios.com/v1/chatbot.js"
  data-product-key="THEIR_KEY">
</script>
```

## Updating the Widget

To deploy updates:
```bash
cd public\widget
vercel --prod
```

## Monitoring

View analytics and logs:
- Dashboard: https://vercel.com/dashboard
- Analytics: Shows load times, requests, bandwidth
- Functions: Monitor any serverless functions
- Logs: Real-time error tracking

## Rollback

If something goes wrong:
1. Go to https://vercel.com/dashboard
2. Click your project
3. Go to **Deployments**
4. Find previous working deployment
5. Click **...** → **Promote to Production**

## Support

- Vercel Status: https://www.vercel-status.com
- Vercel Docs: https://vercel.com/docs
- Your widget URL: https://intelagent-widget.vercel.app/v1/chatbot.js

---

## Quick Commands Reference

```bash
# First time setup
vercel login
cd public\widget
vercel --prod

# Deploy updates
cd public\widget
vercel --prod

# Deploy preview (not production)
vercel

# Check deployment status
vercel ls

# View logs
vercel logs
```

## What's Included

Your deployment includes:
- ✅ Global CDN (200+ edge locations)
- ✅ HTTPS/SSL certificates
- ✅ Automatic compression (Brotli/Gzip)
- ✅ DDoS protection
- ✅ Analytics dashboard
- ✅ 100GB bandwidth/month (free)
- ✅ Unlimited requests
- ✅ Auto-scaling

---

**Ready to deploy!** Start with Step 2: `vercel login`