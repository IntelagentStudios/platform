/**
 * Internal Email Service
 * Our own email implementation using SMTP without third-party APIs
 */

import nodemailer from 'nodemailer';
import { EventEmitter } from 'events';
import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

export interface EmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  licenseKey?: string;
  taskId?: string;
}

export interface EmailResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
  response: string;
  timestamp: Date;
  provider: 'internal';
}

export class InternalEmailService extends EventEmitter {
  private static instance: InternalEmailService;
  private transporter: any;
  private emailQueue: EmailOptions[] = [];
  private processing: boolean = false;
  
  // Default SMTP configuration for internal mail server
  private config = {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '25'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    } : undefined,
    // For development/testing - can use ethereal email
    tls: {
      rejectUnauthorized: false
    }
  };
  
  private constructor() {
    super();
    this.initializeTransporter();
  }
  
  public static getInstance(): InternalEmailService {
    if (!InternalEmailService.instance) {
      InternalEmailService.instance = new InternalEmailService();
    }
    return InternalEmailService.instance;
  }
  
  private async initializeTransporter() {
    try {
      // Create transporter with our config
      this.transporter = nodemailer.createTransport(this.config);
      
      // Verify connection
      await this.transporter.verify();
      console.log('[InternalEmailService] SMTP connection verified');
      
    } catch (error) {
      console.log('[InternalEmailService] SMTP not configured, using direct delivery');
      // Fall back to direct delivery (no SMTP server required)
      this.setupDirectDelivery();
    }
    
    // Start processing queue
    this.startQueueProcessor();
  }
  
  private setupDirectDelivery() {
    // This creates a transporter that connects directly to recipient's mail server
    // Useful for development or when no SMTP server is available
    this.transporter = nodemailer.createTransport({
      direct: true,
      logger: false,
      debug: false
    });
  }
  
  /**
   * Send an email
   */
  public async send(options: EmailOptions): Promise<EmailResult> {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Prepare email
      const mailOptions = {
        from: options.from || `"Intelagent Platform" <noreply@${this.getDefaultDomain()}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html || this.generateHtmlFromText(options.text || ''),
        messageId: messageId,
        headers: {
          'X-License-Key': options.licenseKey || 'unknown',
          'X-Task-ID': options.taskId || 'unknown',
          'X-Mailer': 'Intelagent Internal Mail Service'
        },
        attachments: options.attachments
      };
      
      // Send email
      const info = await this.transporter.sendMail(mailOptions);
      
      // Log successful send
      this.emit('email:sent', {
        messageId: info.messageId,
        to: options.to,
        subject: options.subject,
        licenseKey: options.licenseKey
      });
      
      return {
        messageId: info.messageId || messageId,
        accepted: info.accepted || [options.to].flat(),
        rejected: info.rejected || [],
        response: info.response || 'Email sent successfully',
        timestamp: new Date(),
        provider: 'internal'
      };
      
    } catch (error: any) {
      console.error('[InternalEmailService] Send error:', error);
      
      // Add to retry queue
      this.emailQueue.push(options);
      
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
  
  /**
   * Send bulk emails efficiently
   */
  public async sendBulk(
    recipients: string[],
    template: {
      subject: string;
      text?: string;
      html?: string;
    },
    options?: {
      batchSize?: number;
      delayBetweenBatches?: number;
      licenseKey?: string;
    }
  ): Promise<{ sent: number; failed: number; results: EmailResult[] }> {
    const batchSize = options?.batchSize || 10;
    const delay = options?.delayBetweenBatches || 1000;
    const results: EmailResult[] = [];
    let sent = 0;
    let failed = 0;
    
    // Process in batches to avoid overwhelming the server
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(recipient =>
        this.send({
          to: recipient,
          subject: template.subject,
          text: template.text,
          html: template.html,
          licenseKey: options?.licenseKey
        }).then(result => {
          sent++;
          results.push(result);
          return result;
        }).catch(error => {
          failed++;
          console.error(`Failed to send to ${recipient}:`, error);
          return null;
        })
      );
      
      await Promise.all(batchPromises);
      
      // Delay between batches
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return { sent, failed, results };
  }
  
  /**
   * Create an email template
   */
  public createTemplate(
    name: string,
    content: {
      subject: string;
      html: string;
      variables?: string[];
    }
  ): string {
    // Store template for reuse
    const templateId = `tpl_${Date.now()}`;
    
    // In production, store in database
    console.log(`[InternalEmailService] Template created: ${templateId}`);
    
    return templateId;
  }
  
  /**
   * Queue processor for failed emails
   */
  private async startQueueProcessor() {
    setInterval(async () => {
      if (this.processing || this.emailQueue.length === 0) return;
      
      this.processing = true;
      const email = this.emailQueue.shift();
      
      if (email) {
        try {
          await this.send(email);
          console.log('[InternalEmailService] Retry successful');
        } catch (error) {
          console.error('[InternalEmailService] Retry failed:', error);
          // Add back to queue with backoff
          setTimeout(() => this.emailQueue.push(email), 60000);
        }
      }
      
      this.processing = false;
    }, 5000); // Process queue every 5 seconds
  }
  
  /**
   * Generate HTML from plain text
   */
  private generateHtmlFromText(text: string): string {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br>');
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #495a58; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { text-align: center; padding: 10px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Intelagent Platform</h2>
            </div>
            <div class="content">
              ${escaped}
            </div>
            <div class="footer">
              Sent by Intelagent Internal Mail Service
            </div>
          </div>
        </body>
      </html>
    `;
  }
  
  /**
   * Get default domain for sender
   */
  private getDefaultDomain(): string {
    return process.env.EMAIL_DOMAIN || 'intelagent.local';
  }
  
  /**
   * Validate email address
   */
  public async validateEmail(email: string): Promise<boolean> {
    // Basic format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;
    
    // Check MX records for domain
    const domain = email.split('@')[1];
    try {
      const mxRecords = await resolveMx(domain);
      return mxRecords && mxRecords.length > 0;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get service status
   */
  public getStatus(): {
    connected: boolean;
    queueSize: number;
    config: any;
  } {
    return {
      connected: this.transporter !== null,
      queueSize: this.emailQueue.length,
      config: {
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure
      }
    };
  }
}