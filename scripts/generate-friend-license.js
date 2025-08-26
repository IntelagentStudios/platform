#!/usr/bin/env node

/**
 * Generate a proper random license key for a friend
 * Run: node scripts/generate-friend-license.js
 */

const crypto = require('crypto');

// Generate license key in INTL-XXXX-XXXX-YYYY format
function generateLicenseKey(year = new Date().getFullYear()) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let segments = ['INTL'];
  
  // Generate two middle segments
  for (let seg = 0; seg < 2; seg++) {
    let segment = '';
    for (let i = 0; i < 4; i++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  
  // Add year as final segment
  segments.push(String(year));
  
  return segments.join('-');
}

// Generate product key for chatbot
function generateProductKey(product = 'chatbot') {
  const prefixes = {
    'chatbot': 'chat',
    'sales-agent': 'sale',
    'data-enrichment': 'data',
    'setup-agent': 'agnt'
  };
  
  const prefix = prefixes[product] || 'chat';
  const randomBytes = crypto.randomBytes(8);
  const randomString = randomBytes.toString('hex');
  
  return `${prefix}_${randomString}`;
}

// Generate friend license
function generateFriendLicense(friendDetails = {}) {
  const licenseKey = generateLicenseKey();
  const productKey = generateProductKey('chatbot');
  
  const license = {
    license_key: licenseKey,
    customer_name: friendDetails.name || 'Your Friend Name',
    email: friendDetails.email || 'friend@example.com',
    company_name: friendDetails.company || 'Friend Company',
    status: 'active',
    subscription_status: 'active',
    products: ['chatbot'],
    pro_mode_enabled: false,
    metadata: {
      type: 'friend_license',
      generated_by: 'admin',
      purpose: 'testing',
      generated_date: new Date().toISOString()
    }
  };

  return { license, productKey };
}

// Main execution
if (require.main === module) {
  console.log('🎲 Generating Random Friend License...\n');
  
  // Get command line arguments
  const args = process.argv.slice(2);
  const friendDetails = {
    name: args[0] || null,
    email: args[1] || null,
    company: args[2] || null
  };
  
  const { license, productKey } = generateFriendLicense(friendDetails);
  
  console.log('=' .repeat(60));
  console.log('GENERATED LICENSE DETAILS');
  console.log('=' .repeat(60));
  console.log(`License Key:    ${license.license_key}`);
  console.log(`Product Key:    ${productKey}`);
  console.log(`Customer:       ${license.customer_name}`);
  console.log(`Email:          ${license.email}`);
  console.log(`Company:        ${license.company_name}`);
  console.log(`Products:       ${license.products.join(', ')}`);
  console.log(`Pro Mode:       ${license.pro_mode_enabled ? 'Yes' : 'No'}`);
  console.log('=' .repeat(60));
  
  // Generate SQL insert statement
  console.log('\n📄 SQL INSERT STATEMENT:');
  console.log('-' .repeat(60));
  console.log(`
INSERT INTO licenses (
  license_key, customer_name, email, company_name,
  status, subscription_status, products, pro_mode_enabled,
  metadata, created_at
) VALUES (
  '${license.license_key}',
  '${license.customer_name.replace(/'/g, "''")}',
  '${license.email}',
  '${license.company_name.replace(/'/g, "''")}',
  '${license.status}',
  '${license.subscription_status}',
  ARRAY['${license.products.join("','")}']::text[],
  ${license.pro_mode_enabled},
  '${JSON.stringify(license.metadata)}'::jsonb,
  CURRENT_TIMESTAMP
) ON CONFLICT (license_key) DO NOTHING;
  `.trim());
  console.log('-' .repeat(60));
  
  // Email template
  console.log('\n📧 EMAIL TEMPLATE:');
  console.log('-' .repeat(60));
  console.log(`
Subject: 🎉 Your Free AI Chatbot is Ready - Intelagent Platform

Hi ${license.customer_name},

Your free AI chatbot license is ready to use!

LICENSE KEY: ${license.license_key}

Quick Setup:
1. Validate your license:
   https://dashboard.intelagentstudios.com/validate-license

2. Set up your chatbot:
   https://dashboard.intelagentstudios.com/products/chatbot/setup-agent-frame

3. Enter your website domain and license key when prompted

4. Copy the embed code to your website

That's it! Your chatbot will be live immediately.

Need help? Just reply to this email.

Best regards,
Intelagent Studios Team
  `.trim());
  console.log('-' .repeat(60));
  
  console.log('\n✅ License generation complete!');
  console.log('\n💡 Usage: node scripts/generate-friend-license.js [name] [email] [company]');
  console.log('Example: node scripts/generate-friend-license.js "John Doe" "john@example.com" "Acme Inc"');
}

module.exports = { generateLicenseKey, generateProductKey, generateFriendLicense };