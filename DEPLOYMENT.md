# Production Deployment Guide - Intelagent Platform

## Current Production Setup

### Live URLs
- **Customer Portal**: https://dashboard.intelagentstudios.com
- **Admin Portal**: https://admin.intelagentstudios.com (if separate) or use license key

### Railway Configuration

## Environment Variables (Production)

Set these in Railway's environment variables:

```env
# Database - Use EXTERNAL URL for builds and migrations
DATABASE_URL=postgresql://postgres:[password]@[external-host]:[port]/railway

# Redis - Using External URL (as provided)
REDIS_URL=redis://default:P-0Bcx~Ufyw8hSKYsSjb-nx_S3Q-G0I6@mainline.proxy.rlwy.net:59858

# JWT & Security
JWT_SECRET=xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS
MASTER_LICENSE_KEY=INTL-AGNT-BOSS-MODE

# Production URLs
NEXT_PUBLIC_APP_URL=https://dashboard.intelagentstudios.com
NEXT_PUBLIC_API_URL=https://dashboard.intelagentstudios.com/api
NEXT_PUBLIC_WS_URL=wss://dashboard.intelagentstudios.com

# Stripe (Live Keys)
STRIPE_SECRET_KEY=your_stripe_secret_key_here

# Email Service (Add your Resend or SMTP details)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@intelagentstudios.com

# Environment
NODE_ENV=production
PORT=3000
```

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Fix production redirect loop and update Redis configuration"
git push origin main
```

### 2. Railway Deployment

Railway should auto-deploy when you push to GitHub. If not:

1. Go to Railway Dashboard
2. Select your project
3. Click "Deploy" or "Redeploy"

### 3. Build Command (in Railway)
```bash
npm install && npm run db:generate && npm run build
```

### 4. Start Command (in Railway)
```bash
npm start
```

## Fixed Issues

### ✅ Redirect Loop Fix
- Updated middleware to properly handle public routes
- Added /validate-license to public routes
- Prevented infinite redirect loops
- Fixed authentication flow

### ✅ Redis Configuration
- Using external Redis URL for production
- This ensures build process can connect to Redis
- Prevents deployment failures

### ✅ Database Configuration
- Ensure you're using the EXTERNAL database URL in production
- Internal URLs only work within Railway's network

## Testing Production

After deployment:

1. **Customer Portal Access**:
   - Visit: https://dashboard.intelagentstudios.com
   - Should see login page without redirect loops
   - Register with a valid license key

2. **Admin Portal Access**:
   - Visit: https://dashboard.intelagentstudios.com/login
   - Use License Key: `INTL-AGNT-BOSS-MODE`
   - Set password on first login

## Monitoring

### Health Check
- Endpoint: https://dashboard.intelagentstudios.com/api/health
- Should return: `{"status":"healthy","service":"customer-portal"}`

### Common Issues & Solutions

**Issue**: "Too many redirects"
**Solution**: Clear browser cookies and cache, ensure middleware is deployed

**Issue**: "Database connection failed"
**Solution**: Use external DATABASE_URL in production environment variables

**Issue**: "Redis connection failed"  
**Solution**: Use external Redis URL (as configured above)

**Issue**: "Build failed on Railway"
**Solution**: Ensure all environment variables are set in Railway dashboard

## Important Notes

1. **External vs Internal URLs**: Always use EXTERNAL URLs for:
   - Build processes
   - Migrations
   - Local development connecting to production services

2. **Internal URLs**: Only work within Railway's private network:
   - Use for service-to-service communication
   - Not accessible from outside Railway

3. **License Key System**: 
   - Master admin: `INTL-AGNT-BOSS-MODE`
   - Customer licenses: Generated via Squarespace webhook

4. **Deployment Triggers**:
   - Automatic: Push to main branch
   - Manual: Railway dashboard "Redeploy" button

## Support

If deployment issues persist:
1. Check Railway build logs
2. Verify all environment variables are set
3. Ensure database migrations have run
4. Check application logs in Railway