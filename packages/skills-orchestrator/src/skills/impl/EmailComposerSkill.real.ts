/**
 * Email Composer Skill - Production Implementation
 * Sends real emails using SendGrid, Nodemailer, or SMTP
 */

import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillCategory } from '../../types';
import { SkillConfigManager } from '../../config/SkillConfig';
import * as nodemailer from 'nodemailer';

// SendGrid import (optional)
let sgMail: any;
try {
  sgMail = require('@sendgrid/mail');
} catch (e) {
  console.log('SendGrid not installed, using nodemailer');
}

interface EmailParams extends SkillParams {
  to: string | string[];
  subject: string;
  body?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
  }>;
  template?: string;
  templateData?: Record<string, any>;
  replyTo?: string;
  priority?: 'high' | 'normal' | 'low';
  headers?: Record<string, string>;
}

export class EmailComposerSkill extends BaseSkill {
  metadata = {
    id: 'email_composer',
    name: 'Email Composer',
    description: 'Compose and send professional emails with templates and tracking',
    category: SkillCategory.COMMUNICATION,
    version: '2.0.0',
    author: 'Intelagent',
    tags: ['email', 'communication', 'sendgrid', 'smtp', 'templates']
  };

  private configManager = SkillConfigManager.getInstance();
  private transporter?: nodemailer.Transporter;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    const sendgridConfig = this.configManager.getConfig('sendgrid');
    
    if (sendgridConfig && sgMail) {
      // Use SendGrid if available
      sgMail.setApiKey(sendgridConfig.apiKey);
      console.log('EmailComposer: Using SendGrid');
    } else {
      // Fallback to SMTP/Nodemailer
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      console.log('EmailComposer: Using SMTP');
    }
  }

  validate(params: SkillParams): boolean {
    const emailParams = params as EmailParams;
    
    // Validate required fields
    if (!emailParams.to || !emailParams.subject) {
      return false;
    }

    // Validate email addresses
    const emails = Array.isArray(emailParams.to) ? emailParams.to : [emailParams.to];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    return emails.every(email => emailRegex.test(email));
  }

  protected async executeImpl(params: SkillParams): Promise<SkillResult> {
    try {
      const emailParams = params as EmailParams;
      
      // Prepare email data
      const emailData = await this.prepareEmailData(emailParams);
      
      // Send email
      const result = await this.sendEmail(emailData);
      
      // Track metrics
      await this.trackEmailMetrics(emailData, result);
      
      return {
        success: true,
        data: {
          messageId: result.messageId,
          accepted: result.accepted,
          rejected: result.rejected,
          envelope: result.envelope,
          response: result.response,
          timestamp: new Date(),
          provider: result.provider
        },
        metadata: {
          skillId: this.metadata.id,
          skillName: this.metadata.name,
          timestamp: new Date()
        }
      };
    } catch (error: any) {
      console.error('Email sending failed:', error);
      
      return {
        success: false,
        error: error.message,
        metadata: {
          skillId: this.metadata.id,
          skillName: this.metadata.name,
          timestamp: new Date(),
          errorDetails: error.stack
        }
      };
    }
  }

  private async prepareEmailData(params: EmailParams): Promise<any> {
    const sendgridConfig = this.configManager.getConfig('sendgrid');
    
    // Process template if specified
    let htmlContent = params.html;
    let textContent = params.body;
    
    if (params.template) {
      const processed = await this.processTemplate(
        params.template,
        params.templateData || {}
      );
      htmlContent = processed.html;
      textContent = processed.text;
    }

    // Prepare email object
    const emailData: any = {
      to: params.to,
      subject: params.subject,
      text: textContent || this.stripHtml(htmlContent || ''),
      html: htmlContent || this.textToHtml(textContent || ''),
      from: sendgridConfig?.fromEmail || process.env.SMTP_FROM || 'noreply@example.com',
      replyTo: params.replyTo
    };

    // Add optional fields
    if (params.cc) emailData.cc = params.cc;
    if (params.bcc) emailData.bcc = params.bcc;
    if (params.attachments) emailData.attachments = params.attachments;
    if (params.headers) emailData.headers = params.headers;
    
    // Set priority
    if (params.priority) {
      emailData.priority = params.priority;
      if (params.priority === 'high') {
        emailData.headers = {
          ...emailData.headers,
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high'
        };
      }
    }

    return emailData;
  }

  private async sendEmail(emailData: any): Promise<any> {
    const sendgridConfig = this.configManager.getConfig('sendgrid');
    
    if (sendgridConfig && sgMail) {
      // Send via SendGrid
      try {
        const result = await sgMail.send(emailData);
        return {
          messageId: result[0].headers['x-message-id'],
          accepted: [emailData.to].flat(),
          rejected: [],
          envelope: { from: emailData.from, to: [emailData.to].flat() },
          response: result[0].statusCode,
          provider: 'sendgrid'
        };
      } catch (error: any) {
        console.error('SendGrid error:', error);
        throw new Error(`SendGrid failed: ${error.message}`);
      }
    } else if (this.transporter) {
      // Send via SMTP
      try {
        const result = await this.transporter.sendMail(emailData);
        return {
          ...result,
          provider: 'smtp'
        };
      } catch (error: any) {
        console.error('SMTP error:', error);
        throw new Error(`SMTP failed: ${error.message}`);
      }
    } else {
      // No email service configured - return mock for development
      if (process.env.NODE_ENV === 'development') {
        console.log('Email (mock):', emailData);
        return {
          messageId: `mock-${Date.now()}`,
          accepted: [emailData.to].flat(),
          rejected: [],
          envelope: { from: emailData.from, to: [emailData.to].flat() },
          response: '250 OK',
          provider: 'mock'
        };
      }
      
      throw new Error('No email service configured. Please set up SendGrid or SMTP.');
    }
  }

  private async processTemplate(
    templateName: string,
    data: Record<string, any>
  ): Promise<{ html: string; text: string }> {
    // Load template from database or file system
    const templates: Record<string, string> = {
      welcome: `
        <h1>Welcome {{name}}!</h1>
        <p>Thank you for joining Intelagent. Your account is now active.</p>
        <p>License Key: {{licenseKey}}</p>
        <a href="{{loginUrl}}">Login to your account</a>
      `,
      invoice: `
        <h2>Invoice #{{invoiceNumber}}</h2>
        <p>Amount: ${{amount}}</p>
        <p>Due Date: {{dueDate}}</p>
        <table>{{items}}</table>
      `,
      notification: `
        <h3>{{title}}</h3>
        <p>{{message}}</p>
        <p>Time: {{timestamp}}</p>
      `
    };

    let html = templates[templateName] || templateName;
    
    // Replace template variables
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, data[key]);
    });

    return {
      html,
      text: this.stripHtml(html)
    };
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  private textToHtml(text: string): string {
    return text
      .split('\n')
      .map(line => `<p>${line}</p>`)
      .join('\n');
  }

  private async trackEmailMetrics(emailData: any, result: any): Promise<void> {
    // Track email metrics for analytics
    const metrics = {
      provider: result.provider,
      recipients: [emailData.to].flat().length,
      accepted: result.accepted?.length || 0,
      rejected: result.rejected?.length || 0,
      hasAttachments: !!emailData.attachments?.length,
      timestamp: new Date()
    };

    console.log('Email metrics:', metrics);
    // TODO: Save to database or analytics service
  }

  getConfig(): Record<string, any> {
    const sendgridConfig = this.configManager.getConfig('sendgrid');
    
    return {
      enabled: true,
      provider: sendgridConfig ? 'sendgrid' : this.transporter ? 'smtp' : 'mock',
      features: {
        templates: true,
        attachments: true,
        tracking: !!sendgridConfig,
        scheduling: false,
        bulkSending: true
      },
      limits: {
        maxRecipients: 100,
        maxAttachmentSize: 25 * 1024 * 1024, // 25MB
        dailyLimit: sendgridConfig ? 100000 : 500
      }
    };
  }
}