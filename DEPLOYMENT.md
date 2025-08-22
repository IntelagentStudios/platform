# Deployment Guide for Intelagent Platform

## Overview

The Intelagent Platform consists of two separate web applications that should be deployed independently:

1. **Customer Portal** (`apps/customer-portal`) - For customers to manage their licenses and products
2. **Admin Portal** (`apps/admin-portal`) - For master administrators to manage all licenses and platform operations

## Current Deployment Setup

### Customer Portal
- **URL**: https://dashboard.intelagentstudios.com
- **Purpose**: Customer license management, product dashboards
- **Login**: License key validation at `/validate-license`
- **Build Command**: `npm run build`
- **Start Command**: `npm run start`

### Admin Portal
- **Recommended URL**: https://admin.intelagentstudios.com (or separate Railway service)
- **Purpose**: Master admin dashboard for all platform management
- **Login**: Email/password authentication at `/login`
- **Default Credentials**: admin@intelagentstudios.com / AdminPass123!
- **Build Command**: `npm run build`
- **Start Command**: `npm run start`

## Railway Deployment Instructions

### Option 1: Single Repository, Multiple Services (Recommended)

1. In Railway, create two separate services from the same GitHub repository:
   
   **Service 1: Customer Portal**
   - Root Directory: `/apps/customer-portal`
   - Domain: dashboard.intelagentstudios.com
   - Environment Variables:
     ```
     NODE_ENV=production
     DATABASE_URL=[your-postgres-url]
     REDIS_URL=[your-redis-url]
     JWT_SECRET=[your-jwt-secret]
     ```

   **Service 2: Admin Portal**
   - Root Directory: `/apps/admin-portal`
   - Domain: admin.intelagentstudios.com (or use Railway's generated domain)
   - Environment Variables:
     ```
     NODE_ENV=production
     DATABASE_URL=[your-postgres-url]
     REDIS_URL=[your-redis-url]
     JWT_SECRET=[your-jwt-secret]
     MASTER_ADMIN_EMAIL=admin@intelagentstudios.com
     MASTER_ADMIN_PASSWORD=[secure-password-hash]
     ```

### Option 2: Current Setup (Single Service)

If you're currently running only the customer portal:

1. The customer portal is at: https://dashboard.intelagentstudios.com
2. Access it with a license key at: https://dashboard.intelagentstudios.com/validate-license
3. The admin portal needs to be deployed separately

## Environment Variables

### Required for Both Portals:
```env
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=your-secret-key-change-in-production
```

### Additional for Admin Portal:
```env
MASTER_ADMIN_EMAIL=admin@intelagentstudios.com
MASTER_ADMIN_PASSWORD=$2a$10$... (bcrypt hash)
```

### Additional for Customer Portal:
```env
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Build Configuration

Both apps use the same build process:

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Accessing the Applications

### Customer Portal
- Main URL: https://dashboard.intelagentstudios.com
- License Validation: https://dashboard.intelagentstudios.com/validate-license
- Dashboard: https://dashboard.intelagentstudios.com/dashboard (requires authentication)

### Admin Portal (when deployed)
- Main URL: https://admin.intelagentstudios.com (or your chosen domain)
- Login: https://admin.intelagentstudios.com/login
- Dashboard: https://admin.intelagentstudios.com/dashboard (requires authentication)

## Troubleshooting

### 404 Errors
- If you get a 404 at `/login`, you're likely on the customer portal. Use `/validate-license` instead.
- If you get a 404 at `/admin`, the admin portal needs to be deployed as a separate service.

### Authentication Issues
- Customer Portal uses license key authentication
- Admin Portal uses email/password authentication
- Ensure JWT_SECRET is the same across both services if they need to share sessions

### Database Connection
- Both portals connect to the same PostgreSQL database
- Ensure DATABASE_URL is set correctly in both services
- Run migrations before first deployment: `npm run db:migrate`

## Next Steps

1. Deploy the admin portal as a separate Railway service
2. Configure a subdomain for the admin portal (e.g., admin.intelagentstudios.com)
3. Update environment variables with production values
4. Set up monitoring and logging for both services