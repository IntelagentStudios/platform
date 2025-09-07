import crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

interface WelcomeEmailData {
  email: string;
  name?: string;
  licenseKey: string;
  tier: string;
  temporaryPassword?: string;
  resetToken?: string;
}

// Simple email sender (you can replace with your preferred email service)
export async function sendWelcomeEmail(data: WelcomeEmailData) {
  const { email, name, licenseKey, tier, temporaryPassword, resetToken } = data;
  
  // Generate password reset link
  const resetLink = resetToken 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`
    : `${process.env.NEXT_PUBLIC_APP_URL}/auth/forgot-password`;

  const emailContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #303636; color: #E5E3DC; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #A9BDCB; color: #303636; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .license-box { background-color: #fff; border: 2px solid #A9BDCB; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        code { background-color: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Intelagent Platform!</h1>
        </div>
        <div class="content">
          <h2>Hi ${name || 'there'},</h2>
          
          <p>Thank you for subscribing to the <strong>${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan</strong>! Your account has been created and your subscription is now active.</p>
          
          <div class="license-box">
            <h3>Your Account Details</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>License Key:</strong> <code>${licenseKey}</code></p>
            <p><strong>Plan:</strong> ${tier.charAt(0).toUpperCase() + tier.slice(1)}</p>
            ${temporaryPassword ? `<p><strong>Temporary Password:</strong> <code>${temporaryPassword}</code></p>` : ''}
          </div>
          
          <p><strong>Important:</strong> Please set up your password to secure your account:</p>
          
          <div style="text-align: center;">
            <a href="${resetLink}" class="button">Set Your Password</a>
          </div>
          
          <h3>What's Next?</h3>
          <ol>
            <li>Click the button above to set your password</li>
            <li>Log in to your dashboard at <a href="${process.env.NEXT_PUBLIC_APP_URL}">${process.env.NEXT_PUBLIC_APP_URL}</a></li>
            <li>Configure your first AI chatbot</li>
            <li>Explore the platform features</li>
          </ol>
          
          <h3>Need Help?</h3>
          <p>Our support team is here to help you get started:</p>
          <ul>
            <li>Email: support@intelagentstudios.com</li>
            <li>Documentation: <a href="https://docs.intelagentstudios.com">docs.intelagentstudios.com</a></li>
          </ul>
          
          <div class="footer">
            <p>This email was sent to ${email} because you signed up for Intelagent Platform.</p>
            <p>© 2025 Intelagent Studios. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  // For now, we'll just log the email (replace with actual email service)
  console.log('📧 Sending welcome email to:', email);
  
  // TODO: Integrate with your email service (SendGrid, Resend, AWS SES, etc.)
  // Example with fetch to an email API:
  /*
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Intelagent Platform <noreply@intelagentstudios.com>',
        to: email,
        subject: 'Welcome to Intelagent Platform - Set Your Password',
        html: emailContent,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send email');
    }
    
    console.log('✅ Welcome email sent successfully');
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
  }
  */

  // For development, save to a file
  if (process.env.NODE_ENV === 'development') {
    const emailDir = path.join(process.cwd(), 'emails-sent');
    
    try {
      await fs.mkdir(emailDir, { recursive: true });
      const filename = `welcome-${email.replace('@', '-')}-${Date.now()}.html`;
      await fs.writeFile(path.join(emailDir, filename), emailContent);
      console.log(`📧 Email saved to: emails-sent/${filename}`);
    } catch (error) {
      console.error('Failed to save email:', error);
    }
  }

  return true;
}

// Generate a secure password reset token
export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Generate a temporary password
export function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}