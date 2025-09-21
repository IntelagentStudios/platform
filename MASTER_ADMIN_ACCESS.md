# Master Admin Dashboard - Management Team Guide

## Overview
The Master Admin Dashboard provides complete platform oversight and management capabilities for the Intelagent Platform management team. This dashboard gives you access to all customer accounts, platform-wide analytics, and system administration tools.

## Access Setup

### Current Master Admin Account
- **Email**: harry@intelagentstudios.com
- **Role**: master_admin
- **License Key**: INTL-AGNT-BOSS-MODE

### One-Time Setup (Already Configured)
The master admin setup endpoint (`/api/admin/setup-master`) has been configured to:
1. Set Harry's account as master_admin role
2. Configure the master license with both products (chatbot & sales-outreach)
3. Activate all product keys

## Accessing the Master Admin Dashboard

### 1. Login
- Navigate to: `https://your-domain.com/login`
- Use your master admin credentials
- You'll be redirected to the regular dashboard

### 2. Access Admin Portal
- Once logged in, navigate to `/admin`
- Or click the "Admin" link in the sidebar (only visible to master admins)
- The Admin link shows a "Master" badge to indicate special access

## Master Admin Features

### Admin Portal Home (/admin)
The main admin portal provides access to three key sections:

#### Platform Management
- **Master Dashboard**: Platform-wide analytics and metrics
- **Customer Management**: View and manage all customer accounts
- **Billing & Subscriptions**: Manage billing and payment information

#### System Administration
- **Database Management**: Direct database operations
- **System Monitoring**: API usage and system health metrics
- **License Management**: Create and manage customer licenses

#### Support Tools
- **View All Conversations**: Access any customer's chatbot logs
- **Audit Logs**: View all system audit trails
- **Security Settings**: Platform security configuration

### Master Dashboard (/admin/dashboard)
The master dashboard provides comprehensive platform statistics:

#### Platform Statistics
- **Licenses**: Total, active, trial, and expired licenses with growth metrics
- **Users**: Total users, verified vs unverified, with growth percentages
- **Product Keys**: Distribution of products across customers
- **Revenue**: Monthly and total revenue in GBP with growth tracking

#### System Health Monitoring
- **Active in Last 24h**: Number of active API calls
- **Total API Calls**: All-time API usage
- **Uptime**: System availability percentage
- **Response Time**: Average API response time

#### Customer Management Tab
- **Search & Filter**: Find customers by email, name, or license key
- **Customer Details**: View comprehensive information for each customer:
  - License status and plan
  - User count per license
  - API calls in last 24 hours
  - Products activated
  - Revenue contribution

#### Available Actions
- Update customer status (active/trial/expired/suspended)
- Modify customer plans and tiers
- Update customer information
- Suspend or reactivate accounts

## API Endpoints for Master Admin

### Platform Statistics
```
GET /api/admin/platform-stats
```
Returns comprehensive platform-wide statistics

### Customer Management
```
GET /api/admin/customers
POST /api/admin/customers
```
Fetch all customers or update customer information

### Available Actions via API
- `update_status`: Change customer account status
- `update_plan`: Modify customer plan/tier
- `update_customer_info`: Update customer details
- `suspend_customer`: Suspend a customer account
- `reactivate_customer`: Reactivate a suspended account

## Security & Authentication

### Authentication Flow
1. Master admin role is verified on each request
2. Uses JWT-based authentication with secure cookies
3. All admin actions are logged for audit purposes

### Role Verification
The system checks for:
- `role === 'master_admin'` in user profile
- OR `licenseKey === 'INTL-AGNT-BOSS-MODE'`

### Security Measures
- All admin endpoints require authentication
- Admin actions are audit logged
- Sensitive data is encrypted
- Database queries are isolated by license_key for multi-tenancy

## Database Access

### Key Tables
- **licenses**: Customer license information
- **users**: User accounts and profiles
- **product_keys**: Product activations
- **chatbot_logs**: Customer conversation history
- **api_usage**: API call tracking
- **skill_audit_log**: Skill execution audit trail

### Multi-Tenant Isolation
- Regular users only see their own data
- Master admin can access all customer data
- Queries automatically filter by license_key for isolation

## Deployment Notes

### Railway Deployment
- Database: PostgreSQL on Railway
- Environment: Production uses Railway internal URLs
- Authentication: JWT_SECRET required in environment

### Local Development
- Update DATABASE_URL in .env.local for local testing
- Use Railway's external database URL for local development
- Master admin features work in both local and production

## Management Team Usage Guidelines

### Daily Operations
1. Monitor platform statistics from Master Dashboard
2. Review customer activity and usage patterns
3. Address any suspended or problematic accounts
4. Check system health metrics

### Customer Support
1. Use Customer Management to look up specific accounts
2. View customer's chatbot conversations for debugging
3. Check API usage to identify issues
4. Update customer status or plans as needed

### Revenue Management
1. Track monthly revenue growth
2. Identify high-value customers
3. Monitor trial-to-paid conversions
4. Review billing status across accounts

## Important URLs

- Admin Portal: `/admin`
- Master Dashboard: `/admin/dashboard`
- Customer Management: `/admin/dashboard?tab=customers`
- Setup Endpoint: `/api/admin/setup-master` (one-time use)

## Troubleshooting

### Can't Access Admin Portal
1. Verify you're logged in with master admin account
2. Check that your role is set to `master_admin`
3. Ensure your license key is `INTL-AGNT-BOSS-MODE`

### Database Connection Issues
1. Check DATABASE_URL environment variable
2. For local development, use Railway's external database URL
3. Ensure PostgreSQL service is running on Railway

### Missing Statistics
1. Verify database tables have data
2. Check that queries include proper date ranges
3. Ensure license_key filtering isn't excluding data

---

Last Updated: Current deployment
Version: 1.0.0
For: Intelagent Platform Management Team