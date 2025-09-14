# Vercel Custom Domain Setup Guide

## Quick Setup Steps

### 1. Deploy to Vercel First
```bash
# Login to Vercel (one-time)
vercel login

# Deploy the widget
cd public\widget
vercel --prod
```

Your widget will be live at: `https://intelagent-widget.vercel.app/v1/chatbot.js`

### 2. Add Custom Domain in Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click on your **intelagent-widget** project
3. Go to **Settings** → **Domains**
4. Add: `cdn.intelagentstudios.com`
5. Click **Add**

### 3. Configure DNS (Choose One Option)

#### Option A: If Using Cloudflare for DNS
1. Log into Cloudflare
2. Select your domain (intelagentstudios.com)
3. Go to **DNS**
4. Add CNAME record:
   - Type: `CNAME`
   - Name: `cdn`
   - Target: `cname.vercel-dns.com`
   - Proxy: **OFF** (Important - click the orange cloud to make it gray)

#### Option B: If Using Other DNS Provider
Add this CNAME record:
```
cdn.intelagentstudios.com → cname.vercel-dns.com
```

### 4. Verify Domain in Vercel
1. Go back to Vercel dashboard
2. It should show "Valid Configuration" within 5-10 minutes
3. SSL certificate will be auto-provisioned

### 5. Update Your Embed Codes

Once verified, customers can use either URL:

**CDN URL (Recommended):**
```html
<script
  src="https://cdn.intelagentstudios.com/v1/chatbot.js"
  data-product-key="YOUR_KEY">
</script>
```

**Vercel URL (Backup):**
```html
<script
  src="https://intelagent-widget.vercel.app/v1/chatbot.js"
  data-product-key="YOUR_KEY">
</script>
```

## Railway is Already Running!

Your main platform is deployed at:
- Customer Portal: https://dashboard.intelagentstudios.com
- Admin Portal: https://admin.intelagentstudios.com

Railway will auto-deploy when you push to GitHub (which we just did).

## Testing Your Setup

### Test CDN Widget Loading:
```html
<!DOCTYPE html>
<html>
<head>
    <title>CDN Test</title>
</head>
<body>
    <h1>Testing CDN Widget</h1>

    <!-- Test with your custom domain -->
    <script
      src="https://cdn.intelagentstudios.com/v1/chatbot.js"
      data-product-key="chat_test123">
    </script>
</body>
</html>
```

### Check Deployment Status:

**Railway Status:**
- Go to https://railway.app/dashboard
- Check your project for green checkmarks
- View logs if needed

**Vercel Status:**
- Go to https://vercel.com/dashboard
- Check deployment status
- View function logs

## Troubleshooting

### Domain Not Working?
1. Check DNS propagation: https://dnschecker.org
2. Wait 5-10 minutes for DNS to update
3. In Vercel, click "Refresh" on the domains page

### Widget Not Loading?
1. Check browser console for errors
2. Verify product key is active
3. Check CORS headers in Network tab

### Railway Issues?
- Railway auto-deploys from GitHub
- Check build logs in Railway dashboard
- Ensure environment variables are set

## Final Configuration

Once everything is working:

1. **Update Customer Dashboard** - Already done! The embed codes now use Vercel CDN
2. **Update Documentation** - Update any docs with new CDN URL
3. **Notify Customers** - Let them know about the faster CDN option

## Support

- **Vercel Support**: https://vercel.com/support
- **Railway Support**: https://railway.app/help
- **DNS Issues**: Check with your DNS provider

---

## Summary

✅ **GitHub**: Code pushed and ready
✅ **Railway**: Auto-deploying your platform updates
⏳ **Vercel**: Ready to deploy widget (`vercel login` then `vercel --prod`)
⏳ **Custom Domain**: Add in Vercel dashboard after deployment

**Next Step**: Run `vercel login` to start!