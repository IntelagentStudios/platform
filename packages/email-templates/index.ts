export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailData {
  to: string;
  name?: string;
  [key: string]: any;
}

// Base template wrapper
const baseTemplate = (content: string, preheader: string = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Intelagent Platform</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f3f4f6;
    }
    
    .wrapper {
      width: 100%;
      background-color: #f3f4f6;
      padding: 40px 20px;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 32px;
      text-align: center;
    }
    
    .header h1 {
      color: #ffffff;
      font-size: 28px;
      font-weight: 700;
      margin: 0;
    }
    
    .content {
      padding: 40px 32px;
    }
    
    .button {
      display: inline-block;
      padding: 14px 28px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
    }
    
    .button-outline {
      display: inline-block;
      padding: 12px 24px;
      border: 2px solid #667eea;
      color: #667eea !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
    }
    
    .footer {
      background-color: #f9fafb;
      padding: 24px 32px;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
    }
    
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 24px 0;
    }
    
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background-color: #f3f4f6;
      color: #4b5563;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .feature-list {
      list-style: none;
      padding: 0;
      margin: 20px 0;
    }
    
    .feature-list li {
      padding: 12px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    
    .feature-list li:last-child {
      border-bottom: none;
    }
    
    .checkmark {
      color: #10b981;
      font-weight: bold;
      margin-right: 8px;
    }
    
    .code-block {
      background-color: #1f2937;
      color: #f9fafb;
      padding: 16px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      margin: 20px 0;
      word-break: break-all;
    }
    
    .alert {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    
    .success-box {
      background-color: #d1fae5;
      border-left: 4px solid #10b981;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    
    @media only screen and (max-width: 600px) {
      .content {
        padding: 24px 20px;
      }
      
      .header {
        padding: 24px;
      }
      
      .header h1 {
        font-size: 24px;
      }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    ${preheader ? `<div style="display:none;font-size:1px;color:#f3f4f6;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div>` : ''}
    ${content}
  </div>
</body>
</html>
`;

// Welcome email for new registration
export const welcomeEmail = (data: { name: string; licenseKey: string; products: string[]; dashboardUrl: string }): EmailTemplate => ({
  subject: '🎉 Welcome to Intelagent Platform - Let\'s Get Started!',
  html: baseTemplate(`
    <div class="container">
      <div class="header">
        <h1>Welcome to Intelagent!</h1>
      </div>
      
      <div class="content">
        <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 16px;">
          Hi ${data.name || 'there'} 👋
        </h2>
        
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 20px;">
          Welcome to the Intelagent Platform! Your account has been successfully created and linked to your license. 
          You're just a few steps away from transforming your business with AI automation.
        </p>
        
        <div class="success-box">
          <strong>✅ Account Created Successfully!</strong><br>
          Your license key: <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${data.licenseKey}</code>
        </div>
        
        <h3 style="color: #1f2937; font-size: 18px; margin: 24px 0 16px;">
          Your Products:
        </h3>
        
        <ul class="feature-list">
          ${data.products.map(product => {
            const productNames: Record<string, string> = {
              'chatbot': '🤖 AI Chatbot - 24/7 Customer Support',
              'sales-agent': '📧 Sales Agent - Automated Outreach',
              'enrichment': '🔍 Data Enrichment - Enhanced Insights'
            };
            return `<li><span class="checkmark">✓</span> ${productNames[product] || product}</li>`;
          }).join('')}
        </ul>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${data.dashboardUrl}" class="button">
            Access Your Dashboard
          </a>
        </div>
        
        <h3 style="color: #1f2937; font-size: 18px; margin: 24px 0 16px;">
          Next Steps:
        </h3>
        
        <ol style="color: #4b5563; padding-left: 20px; margin-bottom: 20px;">
          <li style="margin-bottom: 12px;">Log into your dashboard</li>
          <li style="margin-bottom: 12px;">Set up your first product (takes less than 5 minutes!)</li>
          <li style="margin-bottom: 12px;">Install the widget on your website</li>
          <li style="margin-bottom: 12px;">Watch the magic happen! ✨</li>
        </ol>
        
        <div class="divider"></div>
        
        <p style="color: #6b7280; font-size: 14px;">
          Need help getting started? Check out our 
          <a href="https://docs.intelagent.ai" style="color: #667eea;">documentation</a> 
          or reply to this email for support.
        </p>
      </div>
      
      <div class="footer">
        <p>© ${new Date().getFullYear()} Intelagent Platform. All rights reserved.</p>
        <p style="margin-top: 12px;">
          <a href="https://intelagent.ai/help">Help Center</a> • 
          <a href="https://intelagent.ai/docs">Documentation</a> • 
          <a href="https://intelagent.ai/support">Support</a>
        </p>
      </div>
    </div>
  `, 'Welcome to Intelagent! Your AI automation journey starts here.'),
  text: `
Welcome to Intelagent Platform!

Hi ${data.name || 'there'},

Your account has been successfully created and linked to your license.

License Key: ${data.licenseKey}

Your Products:
${data.products.map(p => `- ${p}`).join('\n')}

Next Steps:
1. Log into your dashboard: ${data.dashboardUrl}
2. Set up your first product
3. Install the widget on your website
4. Watch the magic happen!

Need help? Visit https://docs.intelagent.ai or reply to this email.

Best regards,
The Intelagent Team
  `
});

// Setup complete email
export const setupCompleteEmail = (data: { name: string; product: string; domain: string; siteKey: string }): EmailTemplate => ({
  subject: `✅ ${data.product} Setup Complete - Your AI is Live!`,
  html: baseTemplate(`
    <div class="container">
      <div class="header">
        <h1>Setup Complete! 🎊</h1>
      </div>
      
      <div class="content">
        <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 16px;">
          Congratulations, ${data.name}!
        </h2>
        
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 20px;">
          Your <strong>${data.product}</strong> is now live on <strong>${data.domain}</strong>! 
          Your AI assistant is ready to help your customers 24/7.
        </p>
        
        <div class="success-box">
          <strong>🚀 Your AI is Active!</strong><br>
          Domain: ${data.domain}<br>
          Site Key: <code style="font-size: 12px;">${data.siteKey}</code>
        </div>
        
        <h3 style="color: #1f2937; font-size: 18px; margin: 24px 0 16px;">
          What's Working Now:
        </h3>
        
        <ul class="feature-list">
          <li><span class="checkmark">✓</span> AI assistant responding to customer queries</li>
          <li><span class="checkmark">✓</span> 24/7 automated support coverage</li>
          <li><span class="checkmark">✓</span> Smart intent detection and routing</li>
          <li><span class="checkmark">✓</span> Analytics tracking all interactions</li>
        </ul>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://${data.domain}" class="button">
            View on Your Website
          </a>
        </div>
        
        <h3 style="color: #1f2937; font-size: 18px; margin: 24px 0 16px;">
          Pro Tips:
        </h3>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="color: #4b5563; margin-bottom: 12px;">
            <strong>📊 Monitor Performance:</strong> Check your dashboard regularly to see conversation analytics
          </p>
          <p style="color: #4b5563; margin-bottom: 12px;">
            <strong>🎨 Customize Responses:</strong> Train your AI with custom responses in the settings
          </p>
          <p style="color: #4b5563;">
            <strong>🔔 Set Up Alerts:</strong> Get notified when important conversations happen
          </p>
        </div>
        
        <div class="divider"></div>
        
        <p style="color: #6b7280; font-size: 14px;">
          Questions? Our support team is here to help at 
          <a href="mailto:support@intelagent.ai" style="color: #667eea;">support@intelagent.ai</a>
        </p>
      </div>
      
      <div class="footer">
        <p>© ${new Date().getFullYear()} Intelagent Platform. All rights reserved.</p>
        <p style="margin-top: 12px;">
          <a href="https://portal.intelagent.ai/dashboard">Dashboard</a> • 
          <a href="https://docs.intelagent.ai">Documentation</a> • 
          <a href="https://status.intelagent.ai">Status</a>
        </p>
      </div>
    </div>
  `, 'Your AI assistant is now live and ready to help your customers!')
});

// Purchase confirmation email (from Squarespace)
export const purchaseConfirmationEmail = (data: { email: string; licenseKey: string; products: string[]; plan: string }): EmailTemplate => ({
  subject: '🎯 Intelagent Platform - Your License Key & Welcome Instructions',
  html: baseTemplate(`
    <div class="container">
      <div class="header">
        <h1>Welcome to Intelagent!</h1>
      </div>
      
      <div class="content">
        <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 16px;">
          Thank You for Your Purchase! 🎉
        </h2>
        
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 20px;">
          Your Intelagent Platform purchase is confirmed. Save this email - it contains your license key!
        </p>
        
        <div class="code-block" style="text-align: center;">
          <div style="color: #9ca3af; font-size: 14px; margin-bottom: 12px; font-weight: 600;">YOUR LICENSE KEY</div>
          <div style="font-size: 24px; font-weight: bold; letter-spacing: 3px; font-family: 'Courier New', monospace; color: #667eea;">${data.licenseKey}</div>
          <div style="margin-top: 8px;">
            <button onclick="navigator.clipboard.writeText('${data.licenseKey}')" style="padding: 8px 16px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; font-size: 14px;">📋 Copy License Key</button>
          </div>
        </div>
        
        <div class="alert" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
          <strong>⚠️ Save This Email!</strong> You'll need this license key to create your account.
        </div>
        
        <h3 style="color: #1f2937; font-size: 18px; margin: 24px 0 16px;">
          What You've Purchased:
        </h3>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="color: #4b5563; margin-bottom: 12px;">
            <strong>Plan:</strong> ${data.plan}
          </p>
          <p style="color: #4b5563; margin-bottom: 8px;">
            <strong>Products Included:</strong>
          </p>
          <ul style="color: #4b5563; margin-left: 20px;">
            ${data.products.map(product => {
              const productNames: Record<string, string> = {
                'chatbot': '🤖 AI Chatbot - 24/7 Customer Support',
                'sales-agent': '📧 Sales Agent - Automated Lead Generation',
                'enrichment': '🔍 Data Enrichment - Customer Intelligence'
              };
              return `<li style="margin-bottom: 8px;">${productNames[product] || product}</li>`;
            }).join('')}
          </ul>
        </div>
        
        <h3 style="color: #1f2937; font-size: 18px; margin: 24px 0 16px;">
          How to Get Started:
        </h3>
        
        <ol style="color: #4b5563; padding-left: 20px; margin-bottom: 20px;">
          <li style="margin-bottom: 12px;">Click the button below to create your account</li>
          <li style="margin-bottom: 12px;">Enter your <strong>license key</strong> (copied from above)</li>
          <li style="margin-bottom: 12px;">Enter your <strong>email address</strong>: ${data.email}</li>
          <li style="margin-bottom: 12px;">Create a <strong>secure password</strong></li>
          <li style="margin-bottom: 12px;">Complete the quick setup wizard</li>
        </ol>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://portal.intelagent.ai/register" class="button">
            Create Your Account
          </a>
        </div>
        
        <div class="divider"></div>
        
        <p style="color: #6b7280; font-size: 14px;">
          Having trouble? Contact us at 
          <a href="mailto:support@intelagent.ai" style="color: #667eea;">support@intelagent.ai</a>
          with your license key.
        </p>
      </div>
      
      <div class="footer">
        <p>© ${new Date().getFullYear()} Intelagent Platform. All rights reserved.</p>
        <p style="margin-top: 12px;">
          This is your official purchase confirmation and license key.
        </p>
      </div>
    </div>
  `, 'Your Intelagent Platform purchase is confirmed. Here\'s your license key.')
});

// Password reset email
export const passwordResetEmail = (data: { name: string; resetLink: string }): EmailTemplate => ({
  subject: '🔐 Reset Your Intelagent Password',
  html: baseTemplate(`
    <div class="container">
      <div class="header">
        <h1>Password Reset Request</h1>
      </div>
      
      <div class="content">
        <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 16px;">
          Hi ${data.name || 'there'},
        </h2>
        
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 20px;">
          We received a request to reset your password. Click the button below to create a new password:
        </p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${data.resetLink}" class="button">
            Reset Password
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">
          Or copy and paste this link into your browser:<br>
          <a href="${data.resetLink}" style="color: #667eea; word-break: break-all;">${data.resetLink}</a>
        </p>
        
        <div class="alert">
          <strong>⏰ This link expires in 1 hour</strong><br>
          If you didn't request this, you can safely ignore this email.
        </p>
        
        <div class="divider"></div>
        
        <p style="color: #6b7280; font-size: 14px;">
          For security reasons, this link will expire in 1 hour. 
          If you need a new link, please request another password reset.
        </p>
      </div>
      
      <div class="footer">
        <p>© ${new Date().getFullYear()} Intelagent Platform. All rights reserved.</p>
        <p style="margin-top: 12px;">
          This is an automated security email. Please do not reply.
        </p>
      </div>
    </div>
  `)
});

// Usage alert email
export const usageAlertEmail = (data: { name: string; product: string; usage: number; limit: number; percentage: number }): EmailTemplate => ({
  subject: `⚠️ Usage Alert: ${data.product} at ${data.percentage}% capacity`,
  html: baseTemplate(`
    <div class="container">
      <div class="header">
        <h1>Usage Alert</h1>
      </div>
      
      <div class="content">
        <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 16px;">
          Hi ${data.name},
        </h2>
        
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 20px;">
          Your <strong>${data.product}</strong> usage has reached <strong>${data.percentage}%</strong> of your plan limit.
        </p>
        
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <div style="font-size: 14px; color: #92400e; margin-bottom: 8px;">CURRENT USAGE</div>
          <div style="font-size: 24px; font-weight: bold; color: #78350f;">
            ${data.usage.toLocaleString()} / ${data.limit.toLocaleString()}
          </div>
          <div style="margin-top: 12px;">
            <div style="background-color: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden;">
              <div style="background-color: ${data.percentage >= 90 ? '#ef4444' : '#f59e0b'}; height: 100%; width: ${data.percentage}%;"></div>
            </div>
          </div>
        </div>
        
        <h3 style="color: #1f2937; font-size: 18px; margin: 24px 0 16px;">
          Recommended Actions:
        </h3>
        
        <ul style="color: #4b5563; padding-left: 20px; margin-bottom: 20px;">
          <li style="margin-bottom: 8px;">Review your usage patterns in the dashboard</li>
          <li style="margin-bottom: 8px;">Consider upgrading to a higher plan</li>
          <li style="margin-bottom: 8px;">Optimize your configuration to reduce usage</li>
        </ul>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://portal.intelagent.ai/billing" class="button">
            Upgrade Plan
          </a>
          <a href="https://portal.intelagent.ai/analytics" class="button-outline" style="margin-left: 12px;">
            View Analytics
          </a>
        </div>
        
        <div class="divider"></div>
        
        <p style="color: #6b7280; font-size: 14px;">
          Need help optimizing your usage? Contact our support team at 
          <a href="mailto:support@intelagent.ai" style="color: #667eea;">support@intelagent.ai</a>
        </p>
      </div>
      
      <div class="footer">
        <p>© ${new Date().getFullYear()} Intelagent Platform. All rights reserved.</p>
        <p style="margin-top: 12px;">
          <a href="https://portal.intelagent.ai/settings/notifications">Manage Notifications</a>
        </p>
      </div>
    </div>
  `)
});

// Weekly summary email
export const weeklySummaryEmail = (data: { 
  name: string; 
  stats: { 
    totalConversations: number; 
    totalEmails: number; 
    totalEnrichments: number; 
    topIntent: string;
    satisfaction: number;
  } 
}): EmailTemplate => ({
  subject: '📊 Your Weekly Intelagent Summary',
  html: baseTemplate(`
    <div class="container">
      <div class="header">
        <h1>Weekly Summary</h1>
      </div>
      
      <div class="content">
        <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 16px;">
          Hi ${data.name},
        </h2>
        
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 20px;">
          Here's how your AI automation performed this week:
        </p>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 24px 0;">
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="color: #0369a1; font-size: 32px; font-weight: bold;">
              ${data.stats.totalConversations}
            </div>
            <div style="color: #0c4a6e; font-size: 14px; margin-top: 4px;">
              Chatbot Conversations
            </div>
          </div>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="color: #15803d; font-size: 32px; font-weight: bold;">
              ${data.stats.totalEmails}
            </div>
            <div style="color: #14532d; font-size: 14px; margin-top: 4px;">
              Emails Sent
            </div>
          </div>
          
          <div style="background-color: #faf5ff; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="color: #6b21a8; font-size: 32px; font-weight: bold;">
              ${data.stats.totalEnrichments}
            </div>
            <div style="color: #3b0764; font-size: 14px; margin-top: 4px;">
              Data Enrichments
            </div>
          </div>
          
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="color: #b45309; font-size: 32px; font-weight: bold;">
              ${data.stats.satisfaction}%
            </div>
            <div style="color: #78350f; font-size: 14px; margin-top: 4px;">
              Satisfaction Rate
            </div>
          </div>
        </div>
        
        <div class="success-box">
          <strong>🎯 Top Customer Intent:</strong> ${data.stats.topIntent}
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://portal.intelagent.ai/analytics" class="button">
            View Full Analytics
          </a>
        </div>
        
        <div class="divider"></div>
        
        <p style="color: #6b7280; font-size: 14px;">
          You're receiving this because you're subscribed to weekly summaries. 
          <a href="https://portal.intelagent.ai/settings/notifications" style="color: #667eea;">Manage preferences</a>
        </p>
      </div>
      
      <div class="footer">
        <p>© ${new Date().getFullYear()} Intelagent Platform. All rights reserved.</p>
      </div>
    </div>
  `, 'Your AI automation weekly performance summary')
});