/**
 * Webhook Notifier
 * Sends notifications to configured webhooks when workflows complete
 * No third-party services - pure HTTP implementation
 */

import { EventEmitter } from 'events';
import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';

export interface WebhookConfig {
  id: string;
  licenseKey: string;
  url: string;
  events: WebhookEvent[];
  headers?: Record<string, string>;
  secret?: string;
  active: boolean;
  retryCount?: number;
  createdAt: Date;
  lastTriggered?: Date;
}

export enum WebhookEvent {
  WORKFLOW_COMPLETED = 'workflow.completed',
  WORKFLOW_FAILED = 'workflow.failed',
  TASK_COMPLETED = 'task.completed',
  TASK_FAILED = 'task.failed',
  SKILL_ERROR = 'skill.error',
  QUOTA_EXCEEDED = 'quota.exceeded',
  ALERT_TRIGGERED = 'alert.triggered'
}

export interface WebhookPayload {
  event: WebhookEvent;
  licenseKey: string;
  timestamp: Date;
  data: any;
  signature?: string;
}

export class WebhookNotifier extends EventEmitter {
  private static instance: WebhookNotifier;
  private webhooks = new Map<string, WebhookConfig[]>();
  private deliveryQueue: Array<{ webhook: WebhookConfig; payload: WebhookPayload }> = [];
  private processing = false;
  
  private constructor() {
    super();
    this.startProcessor();
  }
  
  public static getInstance(): WebhookNotifier {
    if (!WebhookNotifier.instance) {
      WebhookNotifier.instance = new WebhookNotifier();
    }
    return WebhookNotifier.instance;
  }
  
  /**
   * Register a webhook for a license key
   */
  public registerWebhook(config: Omit<WebhookConfig, 'id' | 'createdAt'>): WebhookConfig {
    const webhook: WebhookConfig = {
      ...config,
      id: `webhook_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      createdAt: new Date(),
      retryCount: config.retryCount || 3
    };
    
    const webhooks = this.webhooks.get(config.licenseKey) || [];
    webhooks.push(webhook);
    this.webhooks.set(config.licenseKey, webhooks);
    
    console.log(`[WebhookNotifier] Registered webhook for license ${config.licenseKey}`);
    
    return webhook;
  }
  
  /**
   * Remove a webhook
   */
  public removeWebhook(licenseKey: string, webhookId: string): boolean {
    const webhooks = this.webhooks.get(licenseKey);
    if (!webhooks) return false;
    
    const index = webhooks.findIndex(w => w.id === webhookId);
    if (index === -1) return false;
    
    webhooks.splice(index, 1);
    return true;
  }
  
  /**
   * Get webhooks for a license key
   */
  public getWebhooks(licenseKey: string): WebhookConfig[] {
    return this.webhooks.get(licenseKey) || [];
  }
  
  /**
   * Trigger webhooks for an event
   */
  public async trigger(event: WebhookEvent, licenseKey: string, data: any): Promise<void> {
    const webhooks = this.webhooks.get(licenseKey) || [];
    const relevantWebhooks = webhooks.filter(w => 
      w.active && w.events.includes(event)
    );
    
    for (const webhook of relevantWebhooks) {
      const payload: WebhookPayload = {
        event,
        licenseKey,
        timestamp: new Date(),
        data
      };
      
      // Generate signature if secret is configured
      if (webhook.secret) {
        payload.signature = this.generateSignature(payload, webhook.secret);
      }
      
      // Add to delivery queue
      this.deliveryQueue.push({ webhook, payload });
    }
    
    // Process queue if not already processing
    if (!this.processing) {
      this.processQueue();
    }
  }
  
  /**
   * Process webhook delivery queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.deliveryQueue.length === 0) return;
    
    this.processing = true;
    
    while (this.deliveryQueue.length > 0) {
      const item = this.deliveryQueue.shift();
      if (!item) continue;
      
      await this.deliverWebhook(item.webhook, item.payload);
    }
    
    this.processing = false;
  }
  
  /**
   * Deliver a webhook
   */
  private async deliverWebhook(
    webhook: WebhookConfig, 
    payload: WebhookPayload, 
    attempt = 1
  ): Promise<void> {
    try {
      const url = new URL(webhook.url);
      const isHttps = url.protocol === 'https:';
      
      const data = JSON.stringify(payload);
      
      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          'X-Webhook-Event': payload.event,
          'X-Webhook-Signature': payload.signature || '',
          ...webhook.headers
        }
      };
      
      const result = await this.makeRequest(isHttps, options, data);
      
      if (result.statusCode && result.statusCode >= 200 && result.statusCode < 300) {
        webhook.lastTriggered = new Date();
        this.emit('webhook:delivered', {
          webhookId: webhook.id,
          event: payload.event,
          statusCode: result.statusCode
        });
      } else {
        throw new Error(`HTTP ${result.statusCode}: ${result.body}`);
      }
      
    } catch (error: any) {
      console.error(`[WebhookNotifier] Delivery failed:`, error.message);
      
      // Retry with exponential backoff
      if (attempt < (webhook.retryCount || 3)) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        setTimeout(() => {
          this.deliverWebhook(webhook, payload, attempt + 1);
        }, delay);
      } else {
        this.emit('webhook:failed', {
          webhookId: webhook.id,
          event: payload.event,
          error: error.message,
          attempts: attempt
        });
      }
    }
  }
  
  /**
   * Make HTTP/HTTPS request
   */
  private makeRequest(
    isHttps: boolean, 
    options: any, 
    data: string
  ): Promise<{ statusCode?: number; body: string }> {
    return new Promise((resolve, reject) => {
      const module = isHttps ? https : http;
      
      const req = module.request(options, (res) => {
        let body = '';
        
        res.on('data', (chunk) => {
          body += chunk;
        });
        
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, body });
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      // Set timeout
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.write(data);
      req.end();
    });
  }
  
  /**
   * Generate signature for webhook payload
   */
  private generateSignature(payload: WebhookPayload, secret: string): string {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload.data));
    return hmac.digest('hex');
  }
  
  /**
   * Start background processor
   */
  private startProcessor(): void {
    setInterval(() => {
      if (!this.processing && this.deliveryQueue.length > 0) {
        this.processQueue();
      }
    }, 1000);
  }
}