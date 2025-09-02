#!/bin/bash

# Install all skill dependencies in one go

echo "📦 Installing all skill dependencies..."

# Core dependencies
npm install --save \
  axios \
  node-cron \
  bull \
  agenda \
  uuid \
  bcrypt \
  shortid \
  qrcode \
  crypto \
  archiver

# Communication
npm install --save \
  @sendgrid/mail \
  nodemailer \
  twilio \
  @slack/web-api \
  discord.js \
  node-telegram-bot-api \
  firebase-admin

# File Processing  
npm install --save \
  pdfkit \
  pdf-parse \
  puppeteer \
  playwright \
  sharp \
  exceljs \
  csv-parse \
  csv-writer \
  xml2js \
  jszip \
  multer

# Payments
npm install --save \
  stripe \
  @paypal/checkout-server-sdk \
  square \
  razorpay

# AI/ML
npm install --save \
  openai \
  @anthropic-ai/sdk \
  @google-cloud/vision \
  @google-cloud/translate \
  @google-cloud/text-to-speech \
  @azure/cognitiveservices-computervision \
  @tensorflow/tfjs-node

# Databases
npm install --save \
  pg \
  mysql2 \
  mongodb \
  mongoose \
  redis \
  ioredis \
  @prisma/client \
  knex

# Integrations
npm install --save \
  @octokit/rest \
  jsforce \
  @hubspot/api-client \
  @mailchimp/mailchimp_marketing \
  jira-client \
  @slack/bolt \
  @microsoft/microsoft-graph-client \
  googleapis

# Analytics
npm install --save \
  @google-analytics/data \
  mixpanel \
  analytics \
  @segment/analytics-node \
  @sentry/node

# Cloud Storage
npm install --save \
  @aws-sdk/client-s3 \
  @google-cloud/storage \
  dropbox \
  @azure/storage-blob

# Utilities
npm install --save \
  cheerio \
  jsonwebtoken \
  moment \
  date-fns \
  lodash \
  validator \
  joi

# Types
npm install --save-dev \
  @types/node \
  @types/nodemailer \
  @types/bcrypt \
  @types/jsonwebtoken \
  @types/lodash \
  @types/uuid \
  @types/qrcode \
  @types/sharp \
  @types/bull

echo "✅ All dependencies installed!"
echo "📝 Don't forget to add your API keys to .env file"