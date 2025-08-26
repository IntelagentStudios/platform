/**
 * Send purchase confirmation email to James
 * Run: node scripts/send-james-email.js
 */

const fs = require('fs');
const path = require('path');

// Email configuration
const EMAIL_CONFIG = {
  to: 'james@steppedin.uk',
  from: 'noreply@intelagentstudios.com',  // Update with your email
  subject: '🎉 Order Confirmation - Your AI Chatbot is Ready!',
  licenseKey: 'INTL-NW1S-QANW-2025',
  orderNumber: 'ORD-2025-0826-001'
};

// Option 1: Using Resend (if you have an API key)
async function sendViaResend() {
  const { Resend } = require('resend');
  
  if (!process.env.RESEND_API_KEY) {
    console.log('❌ RESEND_API_KEY not found in environment variables');
    return false;
  }
  
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  const htmlContent = fs.readFileSync(
    path.join(__dirname, '../emails/james-purchase-confirmation.html'),
    'utf8'
  );
  
  try {
    const data = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: EMAIL_CONFIG.to,
      subject: EMAIL_CONFIG.subject,
      html: htmlContent
    });
    
    console.log('✅ Email sent via Resend!');
    console.log('Email ID:', data.id);
    return true;
  } catch (error) {
    console.error('❌ Failed to send via Resend:', error);
    return false;
  }
}

// Option 2: Using nodemailer with SMTP
async function sendViaSMTP() {
  const nodemailer = require('nodemailer');
  
  // Check for SMTP configuration
  if (!process.env.SMTP_HOST) {
    console.log('❌ SMTP configuration not found in environment variables');
    return false;
  }
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  
  const htmlContent = fs.readFileSync(
    path.join(__dirname, '../emails/james-purchase-confirmation.html'),
    'utf8'
  );
  
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || EMAIL_CONFIG.from,
      to: EMAIL_CONFIG.to,
      subject: EMAIL_CONFIG.subject,
      html: htmlContent
    });
    
    console.log('✅ Email sent via SMTP!');
    console.log('Message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send via SMTP:', error);
    return false;
  }
}

// Option 3: Generate mailto link for manual sending
function generateMailtoLink() {
  const plainText = `
Hi James,

Your AI Chatbot purchase is confirmed!

Order Number: ${EMAIL_CONFIG.orderNumber}
License Key: ${EMAIL_CONFIG.licenseKey}

Quick Setup:
1. Validate your license: https://dashboard.intelagentstudios.com/validate-license
2. Set up your chatbot: https://dashboard.intelagentstudios.com/products/chatbot/setup-agent-frame
3. Enter your website domain and license key
4. Copy the embed code to your website

Your chatbot will be live immediately!

Need help? Just reply to this email.

Best regards,
Intelagent Studios Team
`;

  const mailto = `mailto:${EMAIL_CONFIG.to}?subject=${encodeURIComponent(EMAIL_CONFIG.subject)}&body=${encodeURIComponent(plainText)}`;
  
  console.log('\n📧 MANUAL EMAIL OPTION:');
  console.log('=' .repeat(60));
  console.log('Click this link to open in your email client:');
  console.log(mailto);
  console.log('=' .repeat(60));
  
  return mailto;
}

// Main execution
async function main() {
  console.log('📧 Sending purchase confirmation to james@steppedin.uk\n');
  
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });
  
  // Try Resend first
  let sent = await sendViaResend();
  
  // If Resend fails, try SMTP
  if (!sent) {
    sent = await sendViaSMTP();
  }
  
  // If both fail, provide manual option
  if (!sent) {
    console.log('\n⚠️  Automated sending not configured.');
    console.log('Please configure either:');
    console.log('1. RESEND_API_KEY in your .env.local file');
    console.log('2. SMTP settings (SMTP_HOST, SMTP_USER, SMTP_PASS) in your .env.local');
    console.log('\nAlternatively, use the manual option below:');
    
    generateMailtoLink();
    
    console.log('\n📋 Or copy the HTML file content from:');
    console.log('   emails/james-purchase-confirmation.html');
    console.log('   and send manually from your email client.');
  }
  
  // Display the license details regardless
  console.log('\n📦 LICENSE DETAILS:');
  console.log('=' .repeat(60));
  console.log(`Customer: James (james@steppedin.uk)`);
  console.log(`Company: Stepped In`);
  console.log(`License Key: ${EMAIL_CONFIG.licenseKey}`);
  console.log(`Order Number: ${EMAIL_CONFIG.orderNumber}`);
  console.log(`Product: AI Chatbot (Professional)`);
  console.log(`Price: £0.00 (Complimentary)`);
  console.log('=' .repeat(60));
}

// Run the script
main().catch(console.error);