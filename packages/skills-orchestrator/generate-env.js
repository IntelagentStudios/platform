/**
 * Environment Variable Generator
 * Generates .env.example with all required API keys
 */

const fs = require('fs');
const path = require('path');

const ENV_TEMPLATE = `# ============================================
# INTELAGENT SKILLS - ENVIRONMENT CONFIGURATION
# ============================================
# Copy this file to .env and fill in your API keys

# ============================================
# COMMUNICATION SERVICES
# ============================================

# SendGrid (Email)
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Your Company

# Twilio (SMS, WhatsApp, Voice)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890

# Slack
SLACK_BOT_TOKEN=xoxb-
SLACK_SIGNING_SECRET=
SLACK_APP_TOKEN=xapp-

# Discord
DISCORD_BOT_TOKEN=
DISCORD_CLIENT_ID=

# Telegram
TELEGRAM_BOT_TOKEN=

# Push Notifications (Firebase)
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# ============================================
# PAYMENT PROCESSORS
# ============================================

# Stripe
STRIPE_SECRET_KEY=sk_
STRIPE_PUBLISHABLE_KEY=pk_
STRIPE_WEBHOOK_SECRET=

# PayPal
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_MODE=sandbox

# Square
SQUARE_ACCESS_TOKEN=
SQUARE_APPLICATION_ID=

# ============================================
# AI/ML SERVICES
# ============================================

# OpenAI
OPENAI_API_KEY=sk-
OPENAI_ORGANIZATION=
OPENAI_MODEL=gpt-4

# Anthropic (Claude)
ANTHROPIC_API_KEY=

# Google Cloud AI
GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_CLOUD_KEY_FILE=./keys/google-cloud-key.json
GOOGLE_APPLICATION_CREDENTIALS=./keys/google-cloud-key.json

# Azure Cognitive Services
AZURE_COMPUTER_VISION_KEY=
AZURE_COMPUTER_VISION_ENDPOINT=

# ============================================
# CRM & SALES PLATFORMS
# ============================================

# Salesforce
SALESFORCE_CLIENT_ID=
SALESFORCE_CLIENT_SECRET=
SALESFORCE_USERNAME=
SALESFORCE_PASSWORD=
SALESFORCE_SECURITY_TOKEN=
SALESFORCE_LOGIN_URL=https://login.salesforce.com

# HubSpot
HUBSPOT_API_KEY=
HUBSPOT_ACCESS_TOKEN=

# Mailchimp
MAILCHIMP_API_KEY=
MAILCHIMP_SERVER_PREFIX=us1

# ============================================
# PROJECT MANAGEMENT
# ============================================

# Jira
JIRA_HOST=https://yourcompany.atlassian.net
JIRA_EMAIL=
JIRA_API_TOKEN=

# Trello
TRELLO_API_KEY=
TRELLO_TOKEN=

# Asana
ASANA_ACCESS_TOKEN=

# GitHub
GITHUB_TOKEN=ghp_
GITHUB_WEBHOOK_SECRET=

# ============================================
# CLOUD STORAGE
# ============================================

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=

# Google Drive
GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=
GOOGLE_DRIVE_REFRESH_TOKEN=

# Dropbox
DROPBOX_ACCESS_TOKEN=

# Azure Storage
AZURE_STORAGE_CONNECTION_STRING=

# ============================================
# DATABASES
# ============================================

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=intelagent
POSTGRES_USER=postgres
POSTGRES_PASSWORD=
POSTGRES_SSL=false

# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=intelagent

# MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=intelagent
MYSQL_USER=root
MYSQL_PASSWORD=

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ============================================
# ANALYTICS & MONITORING
# ============================================

# Google Analytics
GOOGLE_ANALYTICS_TRACKING_ID=UA-
GOOGLE_ANALYTICS_VIEW_ID=

# Mixpanel
MIXPANEL_TOKEN=
MIXPANEL_API_SECRET=

# Segment
SEGMENT_WRITE_KEY=

# Sentry
SENTRY_DSN=

# ============================================
# OTHER SERVICES
# ============================================

# Zoom
ZOOM_API_KEY=
ZOOM_API_SECRET=
ZOOM_JWT_TOKEN=

# LinkedIn
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=

# Twitter
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_BEARER_TOKEN=

# Weather API
OPENWEATHER_API_KEY=

# Maps & Geocoding
GOOGLE_MAPS_API_KEY=
MAPBOX_ACCESS_TOKEN=

# URL Shortener
BITLY_ACCESS_TOKEN=

# ============================================
# SMTP (Fallback Email)
# ============================================

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@yourdomain.com

# ============================================
# APPLICATION SETTINGS
# ============================================

NODE_ENV=development
SKILLS_AUTO_UPGRADE=true
ENABLE_MOCK_MODE=true
DEFAULT_TIMEOUT_MS=30000
MAX_RETRIES=3
RATE_LIMIT_PER_MINUTE=60

# ============================================
# SECURITY
# ============================================

ENCRYPTION_KEY=
JWT_SECRET=
API_KEY_SALT=
`;

// Generate the file
fs.writeFileSync('.env.example', ENV_TEMPLATE);
console.log('✅ Generated .env.example file');
console.log('📝 Copy to .env and fill in your API keys');

// Also create a minimal .env for development
const DEV_ENV = `# Development Environment - Minimal Config
NODE_ENV=development
ENABLE_MOCK_MODE=true
SKILLS_AUTO_UPGRADE=false

# Add your API keys below as needed:
`;

if (!fs.existsSync('.env')) {
  fs.writeFileSync('.env', DEV_ENV);
  console.log('✅ Created .env file for development');
}