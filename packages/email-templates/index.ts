export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export function welcomeEmail(data: {
  name: string;
  licenseKey: string;
  products: string[];
  dashboardUrl: string;
}): EmailTemplate {
  const productList = data.products.join(', ');
  
  return {
    subject: `Welcome to Intelagent - Your AI Platform is Ready`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Welcome to Intelagent, ${data.name}!</h1>
        <p>Your AI platform is now active and ready to use.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Your License Details:</h3>
          <p><strong>License Key:</strong> ${data.licenseKey}</p>
          <p><strong>Products:</strong> ${productList}</p>
        </div>
        
        <p>Get started by accessing your dashboard:</p>
        <a href="${data.dashboardUrl}" style="display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
          Access Dashboard
        </a>
        
        <p style="margin-top: 30px; color: #666;">
          If you have any questions, please don't hesitate to contact our support team.
        </p>
      </div>
    `,
    text: `Welcome to Intelagent, ${data.name}!\n\nYour AI platform is now active and ready to use.\n\nLicense Key: ${data.licenseKey}\nProducts: ${productList}\n\nAccess your dashboard: ${data.dashboardUrl}\n\nIf you have any questions, please contact our support team.`
  };
}

export function setupCompleteEmail(data: {
  name: string;
  product: string;
  domain: string;
  siteKey: string;
}): EmailTemplate {
  return {
    subject: `${data.product} Setup Complete - ${data.domain}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Setup Complete!</h1>
        <p>Hi ${data.name},</p>
        <p>Your ${data.product} has been successfully configured for ${data.domain}.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Configuration Details:</h3>
          <p><strong>Product:</strong> ${data.product}</p>
          <p><strong>Domain:</strong> ${data.domain}</p>
          <p><strong>Site Key:</strong> ${data.siteKey}</p>
        </div>
        
        <p>Your ${data.product} is now live and ready to use!</p>
        
        <p style="margin-top: 30px; color: #666;">
          Need help? Check our documentation or contact support.
        </p>
      </div>
    `,
    text: `Setup Complete!\n\nHi ${data.name},\n\nYour ${data.product} has been successfully configured for ${data.domain}.\n\nProduct: ${data.product}\nDomain: ${data.domain}\nSite Key: ${data.siteKey}\n\nYour ${data.product} is now live and ready to use!`
  };
}

export function purchaseConfirmationEmail(data: {
  email: string;
  licenseKey: string;
  products: string[];
  plan: string;
}): EmailTemplate {
  const productList = data.products.join(', ');
  
  return {
    subject: 'Purchase Confirmation - Intelagent Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Purchase Confirmed!</h1>
        <p>Thank you for your purchase. Your Intelagent Platform is now active.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Order Details:</h3>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>License Key:</strong> ${data.licenseKey}</p>
          <p><strong>Plan:</strong> ${data.plan}</p>
          <p><strong>Products:</strong> ${productList}</p>
        </div>
        
        <p>You can now access all features included in your plan.</p>
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://portal.intelagent.ai'}/dashboard" style="display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
          Go to Dashboard
        </a>
        
        <p style="margin-top: 30px; color: #666;">
          This email serves as your receipt. Please keep it for your records.
        </p>
      </div>
    `,
    text: `Purchase Confirmed!\n\nThank you for your purchase. Your Intelagent Platform is now active.\n\nEmail: ${data.email}\nLicense Key: ${data.licenseKey}\nPlan: ${data.plan}\nProducts: ${productList}\n\nYou can now access all features included in your plan.`
  };
}

export function usageAlertEmail(data: {
  name: string;
  product: string;
  usage: number;
  limit: number;
  percentage: number;
}): EmailTemplate {
  const isHighUsage = data.percentage >= 90;
  const isCritical = data.percentage >= 95;
  
  return {
    subject: `${isCritical ? '⚠️ Critical' : ''} Usage Alert: ${data.product} at ${data.percentage}%`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: ${isCritical ? '#dc3545' : '#ffc107'};">Usage Alert</h1>
        <p>Hi ${data.name},</p>
        <p>Your ${data.product} usage has reached <strong>${data.percentage}%</strong> of your plan limit.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Usage Details:</h3>
          <p><strong>Current Usage:</strong> ${data.usage.toLocaleString()}</p>
          <p><strong>Plan Limit:</strong> ${data.limit.toLocaleString()}</p>
          <p><strong>Percentage Used:</strong> ${data.percentage}%</p>
        </div>
        
        ${isHighUsage ? `
        <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <strong>⚠️ Action Required:</strong> Consider upgrading your plan to avoid service interruption.
        </div>
        ` : ''}
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://portal.intelagent.ai'}/upgrade" style="display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
          Upgrade Plan
        </a>
        
        <p style="margin-top: 30px; color: #666;">
          Need help choosing the right plan? Contact our sales team.
        </p>
      </div>
    `,
    text: `Usage Alert\n\nHi ${data.name},\n\nYour ${data.product} usage has reached ${data.percentage}% of your plan limit.\n\nCurrent Usage: ${data.usage.toLocaleString()}\nPlan Limit: ${data.limit.toLocaleString()}\nPercentage Used: ${data.percentage}%\n\n${isHighUsage ? 'Action Required: Consider upgrading your plan to avoid service interruption.\n\n' : ''}Visit ${process.env.NEXT_PUBLIC_APP_URL || 'https://portal.intelagent.ai'}/upgrade to upgrade your plan.`
  };
}