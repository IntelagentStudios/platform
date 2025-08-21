# Intelagent Platform - Complete Flow Test Guide

## Overview
This guide walks through the complete user journey from initial purchase on Squarespace to having a fully functional AI chatbot on their website.

## Prerequisites
1. PostgreSQL database running with proper schema
2. Redis server running (or fallback to memory)
3. Environment variables configured in `.env.local`
4. Squarespace webhook configured to create licenses

## Test Flow

### Phase 1: Purchase & License Creation

#### 1.1 Squarespace Purchase Simulation
```bash
# Simulate a purchase by creating a license in the database
POST /api/admin/licenses
{
  "email": "testuser@example.com",
  "plan": "growth",
  "products": ["chatbot", "sales-agent", "setup-agent"],
  "customer_name": "John Doe"
}
```

Expected Result:
- License created with format: `XXXX-XXXX-XXXX-XXXX`
- Status: `pending`
- Purchase confirmation email sent with license key

### Phase 2: User Registration

#### 2.1 Access Registration Page
1. Navigate to `/register`
2. Enter:
   - **License Key**: From purchase email
   - **Email**: testuser@example.com
   - **Password**: SecurePass123!

Expected Result:
- Account created successfully
- License status changes to `active`
- Welcome email sent
- User redirected to onboarding

### Phase 3: Onboarding Flow

#### 3.1 Complete Onboarding Steps
1. **Welcome Screen**: Click "Let's Get Started"
2. **Company Info**:
   - Company Name: Test Company
   - Industry: Technology
   - Company Size: 11-50 employees
   - Website: https://testcompany.com
3. **Goals**: Select:
   - Improve Customer Support
   - Generate More Leads
4. **Products**: Select "AI Chatbot" first
5. **Preferences**:
   - Enable email notifications
   - Set timezone
6. **Complete**: Click "Go to Dashboard"

Expected Result:
- User profile updated with company info
- Selected products marked for setup
- Redirected to dashboard or first product setup

### Phase 4: Chatbot Setup

#### 4.1 Navigate to Chatbot Setup
1. From dashboard, click "Set up Chatbot" or navigate to `/products/chatbot/setup`

#### 4.2 Complete Setup Wizard
1. **Step 1 - Domain Configuration**:
   - Enter domain: testcompany.com
   - Validate domain (should pass)
   
2. **Step 2 - Customize Appearance**:
   - Bot Name: TestBot
   - Welcome Message: "Hi! How can I help you today?"
   - Primary Color: #667eea
   - Position: bottom-right

3. **Step 3 - Training Data**:
   - Business Type: E-commerce
   - Add FAQ:
     - Q: "What are your business hours?"
     - A: "We're open Monday-Friday, 9 AM - 5 PM EST"

4. **Step 4 - Generate Key**:
   - Click "Generate Site Key"
   - Copy the generated key (format: `CB-TIMESTAMP-RANDOM`)

5. **Step 5 - Installation**:
   - Copy embed code
   - Note webhook URL for N8N integration

Expected Result:
- Site key generated and stored
- Product setup marked as `completed`
- Setup completion email sent

### Phase 5: Embed & Test Chatbot

#### 5.1 Test Embed Code
Create a test HTML file:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Test Website</title>
</head>
<body>
    <h1>Welcome to Test Company</h1>
    
    <!-- Intelagent Chatbot -->
    <script>
        (function(w,d,s,o,f,js,fjs){
            w['IntelagentChat']=o;w[o]=w[o]||function(){
            (w[o].q=w[o].q||[]).push(arguments)};
            js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
            js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
        }(window,document,'script','intelagent','https://cdn.intelagent.ai/widget.js'));
        
        intelagent('init', {
            siteKey: 'YOUR_SITE_KEY_HERE',
            position: 'bottom-right'
        });
    </script>
</body>
</html>
```

#### 5.2 Verify Chatbot Functionality
1. Open test HTML in browser
2. Chatbot widget should appear bottom-right
3. Click to open chat
4. Test conversation:
   - Type: "Hello"
   - Expected: Welcome message response
   - Type: "What are your business hours?"
   - Expected: FAQ response

### Phase 6: Additional Features Testing

#### 6.1 API Key Management
1. Navigate to `/settings/api-keys`
2. Create new API key:
   - Name: "Test Integration"
   - Permissions: Read, Write
   - Expiry: Never
3. Copy generated key
4. Test API call:
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.intelagent.ai/v1/chat/conversations
```

#### 6.2 Team Collaboration
1. Navigate to `/settings/team`
2. Invite team member:
   - Email: teammate@example.com
   - Role: Member
3. Verify invitation email sent
4. Accept invitation (separate browser/incognito)
5. Verify team member access

#### 6.3 Analytics Dashboard
1. Navigate to `/analytics`
2. Verify metrics display:
   - Chatbot conversations count
   - Response times
   - User engagement
   - Popular questions

#### 6.4 Billing & Usage
1. Navigate to `/billing`
2. Verify:
   - Current plan displayed (Growth)
   - Usage metrics accurate
   - Upgrade/downgrade options available
   - Invoice history

### Phase 7: Advanced Product Setup

#### 7.1 Sales Agent Setup
1. Navigate to `/products/sales-agent/setup`
2. Complete setup:
   - Skip CRM integration
   - Set target industries
   - Create campaign
   - Configure automation rules
3. Verify agent key generated

#### 7.2 Setup Agent Configuration
1. Navigate to `/products/setup-agent`
2. Create new wizard:
   - Name: "Customer Onboarding"
   - Add 3 steps
   - Configure fields
3. Get embed code
4. Test wizard functionality

### Validation Checklist

- [ ] License key validation works
- [ ] Registration creates user account
- [ ] Onboarding saves preferences
- [ ] Chatbot setup generates valid site key
- [ ] Embed code displays widget
- [ ] Chatbot responds to messages
- [ ] API keys authenticate correctly
- [ ] Team invitations send emails
- [ ] Analytics track events
- [ ] Billing displays correct usage
- [ ] All products can be configured
- [ ] Email notifications sent at key points
- [ ] Redis caching works (or falls back gracefully)
- [ ] Error handling for invalid inputs
- [ ] Session management maintains state

## Common Issues & Solutions

### Issue: Chatbot widget doesn't appear
**Solution**: Check browser console for errors, verify site key matches, ensure domain is whitelisted

### Issue: Registration fails with "No license found"
**Solution**: Verify license exists in database, check email case sensitivity

### Issue: API calls return 401
**Solution**: Check API key format, verify it's active, check rate limits

### Issue: Team invitations not received
**Solution**: Check SMTP configuration, verify email in spam folder

### Issue: Analytics not updating
**Solution**: Check Redis connection, verify events table is being populated

## Test Data Cleanup

After testing, clean up test data:
```sql
-- Remove test user and related data
DELETE FROM users WHERE email = 'testuser@example.com';
DELETE FROM licenses WHERE email = 'testuser@example.com';
DELETE FROM product_setups WHERE user_id IN (
  SELECT id FROM users WHERE email = 'testuser@example.com'
);
DELETE FROM api_keys WHERE user_id IN (
  SELECT id FROM users WHERE email = 'testuser@example.com'
);
```

## Performance Benchmarks

Expected response times:
- Registration: < 2s
- Dashboard load: < 1s
- Chatbot response: < 500ms
- API calls: < 200ms
- Analytics queries: < 1s

## Security Verification

- [ ] Passwords hashed with bcrypt
- [ ] API keys hashed before storage
- [ ] Session cookies httpOnly and secure
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] SQL injection prevention
- [ ] XSS protection enabled

## Production Deployment Checklist

Before deploying to production:
1. Set all environment variables
2. Configure production database
3. Set up Redis cluster
4. Configure CDN for widget.js
5. Set up monitoring (Sentry, etc.)
6. Configure backup strategy
7. Set up SSL certificates
8. Configure rate limiting
9. Set up logging aggregation
10. Create admin dashboard access

## Support Resources

- Documentation: `/docs`
- API Reference: `/api-docs`
- Admin Portal: `/admin`
- Status Page: `status.intelagent.ai`
- Support Email: support@intelagentstudios.com

---

## Test Completion Sign-off

- [ ] All test scenarios completed successfully
- [ ] No critical bugs identified
- [ ] Performance meets requirements
- [ ] Security measures verified
- [ ] Documentation complete
- [ ] Ready for production deployment

**Tested By**: _________________
**Date**: _________________
**Version**: 1.0.0