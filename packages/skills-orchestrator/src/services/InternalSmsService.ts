/**
 * Internal SMS Gateway Service
 * Our own SMS implementation using direct carrier connections
 */

import { EventEmitter } from 'events';
import net from 'net';
import crypto from 'crypto';

export interface SmsOptions {
  to: string;
  from?: string;
  message: string;
  priority?: 'normal' | 'high';
  licenseKey?: string;
  taskId?: string;
}

export interface SmsResult {
  messageId: string;
  to: string;
  from: string;
  status: 'sent' | 'queued' | 'failed';
  timestamp: Date;
  carrier?: string;
  provider: 'internal';
}

export class InternalSmsService extends EventEmitter {
  private static instance: InternalSmsService;
  private messageQueue: SmsOptions[] = [];
  private processing: boolean = false;
  private carriers: Map<string, CarrierGateway> = new Map();
  
  // SMS gateway configuration
  private config = {
    defaultFrom: process.env.SMS_FROM_NUMBER || '+1234567890',
    smppHost: process.env.SMPP_HOST || 'localhost',
    smppPort: parseInt(process.env.SMPP_PORT || '2775'),
    smppUser: process.env.SMPP_USER || '',
    smppPass: process.env.SMPP_PASS || '',
    maxRetries: 3,
    retryDelay: 5000
  };
  
  private constructor() {
    super();
    this.initializeCarriers();
    this.startQueueProcessor();
  }
  
  public static getInstance(): InternalSmsService {
    if (!InternalSmsService.instance) {
      InternalSmsService.instance = new InternalSmsService();
    }
    return InternalSmsService.instance;
  }
  
  private initializeCarriers() {
    // Initialize carrier gateways for direct SMS delivery
    this.carriers.set('verizon', new CarrierGateway('vtext.com', 'smtp.verizon.net'));
    this.carriers.set('att', new CarrierGateway('txt.att.net', 'smtp.att.net'));
    this.carriers.set('tmobile', new CarrierGateway('tmomail.net', 'smtp.t-mobile.com'));
    this.carriers.set('sprint', new CarrierGateway('messaging.sprintpcs.com', 'smtp.sprint.com'));
    
    console.log('[InternalSmsService] Carrier gateways initialized');
  }
  
  /**
   * Send an SMS message
   */
  public async send(options: SmsOptions): Promise<SmsResult> {
    const messageId = `sms_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    try {
      // Validate phone number
      const cleanedNumber = this.cleanPhoneNumber(options.to);
      if (!this.validatePhoneNumber(cleanedNumber)) {
        throw new Error('Invalid phone number format');
      }
      
      // Detect carrier
      const carrier = await this.detectCarrier(cleanedNumber);
      
      // Prepare message
      const smsMessage = {
        id: messageId,
        to: cleanedNumber,
        from: options.from || this.config.defaultFrom,
        text: this.truncateMessage(options.message),
        carrier,
        timestamp: new Date(),
        licenseKey: options.licenseKey,
        taskId: options.taskId
      };
      
      // Try to send via SMPP protocol first
      let sent = false;
      if (this.config.smppUser) {
        sent = await this.sendViaSmpp(smsMessage).catch(() => false);
      }
      
      // Fallback to carrier email gateway
      if (!sent && carrier) {
        sent = await this.sendViaCarrierGateway(smsMessage, carrier).catch(() => false);
      }
      
      // If still not sent, add to retry queue
      if (!sent) {
        this.messageQueue.push(options);
        console.log('[InternalSmsService] Message queued for retry');
      }
      
      // Log the message
      this.emit('sms:sent', {
        messageId,
        to: options.to,
        licenseKey: options.licenseKey,
        taskId: options.taskId
      });
      
      return {
        messageId,
        to: cleanedNumber,
        from: smsMessage.from,
        status: sent ? 'sent' : 'queued',
        timestamp: smsMessage.timestamp,
        carrier: carrier?.name,
        provider: 'internal'
      };
      
    } catch (error: any) {
      console.error('[InternalSmsService] Send error:', error);
      
      // Add to retry queue
      this.messageQueue.push(options);
      
      return {
        messageId,
        to: options.to,
        from: options.from || this.config.defaultFrom,
        status: 'failed',
        timestamp: new Date(),
        provider: 'internal'
      };
    }
  }
  
  /**
   * Send bulk SMS messages
   */
  public async sendBulk(
    recipients: string[],
    message: string,
    options?: {
      batchSize?: number;
      delayBetweenBatches?: number;
      licenseKey?: string;
    }
  ): Promise<{ sent: number; failed: number; results: SmsResult[] }> {
    const batchSize = options?.batchSize || 10;
    const delay = options?.delayBetweenBatches || 1000;
    const results: SmsResult[] = [];
    let sent = 0;
    let failed = 0;
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(recipient =>
        this.send({
          to: recipient,
          message,
          licenseKey: options?.licenseKey
        }).then(result => {
          if (result.status === 'sent') sent++;
          else failed++;
          results.push(result);
          return result;
        }).catch(() => {
          failed++;
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
   * Send via SMPP protocol
   */
  private async sendViaSmpp(message: any): Promise<boolean> {
    return new Promise((resolve) => {
      const client = net.createConnection(this.config.smppPort, this.config.smppHost);
      
      client.on('connect', () => {
        // Simple SMPP implementation
        const pdu = this.buildSmppPdu(message);
        client.write(pdu);
        
        setTimeout(() => {
          client.end();
          resolve(true);
        }, 1000);
      });
      
      client.on('error', (error) => {
        console.error('[InternalSmsService] SMPP error:', error);
        resolve(false);
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        client.destroy();
        resolve(false);
      }, 5000);
    });
  }
  
  /**
   * Send via carrier email gateway
   */
  private async sendViaCarrierGateway(message: any, carrier: CarrierGateway): Promise<boolean> {
    // Use email-to-SMS gateway
    const emailAddress = `${message.to}@${carrier.emailDomain}`;
    
    // Import our internal email service
    const { InternalEmailService } = await import('./InternalEmailService');
    const emailService = InternalEmailService.getInstance();
    
    try {
      await emailService.send({
        to: emailAddress,
        subject: '',
        text: message.text,
        licenseKey: message.licenseKey,
        taskId: message.taskId
      });
      
      return true;
    } catch (error) {
      console.error('[InternalSmsService] Carrier gateway error:', error);
      return false;
    }
  }
  
  /**
   * Build SMPP PDU
   */
  private buildSmppPdu(message: any): Buffer {
    // Simplified SMPP PDU construction
    const commandId = 0x00000004; // submit_sm
    const commandStatus = 0x00000000;
    const sequenceNumber = Date.now() & 0xFFFFFFFF;
    
    const pdu = Buffer.alloc(256);
    let offset = 0;
    
    // Header
    pdu.writeUInt32BE(0, offset); offset += 4; // Length (will update)
    pdu.writeUInt32BE(commandId, offset); offset += 4;
    pdu.writeUInt32BE(commandStatus, offset); offset += 4;
    pdu.writeUInt32BE(sequenceNumber, offset); offset += 4;
    
    // Body
    offset += pdu.write('', offset, 'ascii') + 1; // service_type
    pdu.writeUInt8(1, offset++); // source_addr_ton
    pdu.writeUInt8(1, offset++); // source_addr_npi
    offset += pdu.write(message.from, offset, 'ascii') + 1;
    pdu.writeUInt8(1, offset++); // dest_addr_ton
    pdu.writeUInt8(1, offset++); // dest_addr_npi
    offset += pdu.write(message.to, offset, 'ascii') + 1;
    pdu.writeUInt8(0, offset++); // esm_class
    pdu.writeUInt8(0, offset++); // protocol_id
    pdu.writeUInt8(0, offset++); // priority_flag
    offset += pdu.write('', offset, 'ascii') + 1; // schedule_delivery_time
    offset += pdu.write('', offset, 'ascii') + 1; // validity_period
    pdu.writeUInt8(0, offset++); // registered_delivery
    pdu.writeUInt8(0, offset++); // replace_if_present_flag
    pdu.writeUInt8(0, offset++); // data_coding
    pdu.writeUInt8(0, offset++); // sm_default_msg_id
    pdu.writeUInt8(message.text.length, offset++); // sm_length
    offset += pdu.write(message.text, offset, 'ascii');
    
    // Update length
    pdu.writeUInt32BE(offset, 0);
    
    return pdu.slice(0, offset);
  }
  
  /**
   * Detect carrier from phone number
   */
  private async detectCarrier(phoneNumber: string): Promise<CarrierGateway | null> {
    // In production, this would use number portability lookup
    // For now, use simple prefix matching
    const prefix = phoneNumber.substring(0, 6);
    
    // Mock carrier detection based on prefix
    if (prefix.startsWith('1555')) return this.carriers.get('verizon') || null;
    if (prefix.startsWith('1556')) return this.carriers.get('att') || null;
    if (prefix.startsWith('1557')) return this.carriers.get('tmobile') || null;
    if (prefix.startsWith('1558')) return this.carriers.get('sprint') || null;
    
    // Default to first available carrier
    return this.carriers.values().next().value || null;
  }
  
  /**
   * Clean phone number
   */
  private cleanPhoneNumber(phone: string): string {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');
    
    // Add country code if missing
    if (cleaned.length === 10) {
      cleaned = '1' + cleaned;
    }
    
    return cleaned;
  }
  
  /**
   * Validate phone number
   */
  private validatePhoneNumber(phone: string): boolean {
    // Basic validation for North American numbers
    return /^1[2-9]\d{9}$/.test(phone);
  }
  
  /**
   * Truncate message to SMS limit
   */
  private truncateMessage(message: string): string {
    const maxLength = 160;
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength - 3) + '...';
  }
  
  /**
   * Queue processor
   */
  private async startQueueProcessor() {
    setInterval(async () => {
      if (this.processing || this.messageQueue.length === 0) return;
      
      this.processing = true;
      const message = this.messageQueue.shift();
      
      if (message) {
        try {
          await this.send(message);
          console.log('[InternalSmsService] Retry successful');
        } catch (error) {
          console.error('[InternalSmsService] Retry failed:', error);
          // Add back with exponential backoff
          setTimeout(() => this.messageQueue.push(message), 60000);
        }
      }
      
      this.processing = false;
    }, 5000);
  }
  
  /**
   * Get service status
   */
  public getStatus(): {
    connected: boolean;
    queueSize: number;
    carriers: string[];
  } {
    return {
      connected: true,
      queueSize: this.messageQueue.length,
      carriers: Array.from(this.carriers.keys())
    };
  }
}

/**
 * Carrier Gateway definition
 */
class CarrierGateway {
  constructor(
    public emailDomain: string,
    public smtpServer: string,
    public name?: string
  ) {
    this.name = name || emailDomain.split('.')[0];
  }
}