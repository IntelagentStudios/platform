/**
 * Webhook Sender Skill
 * Sends data to external webhooks and APIs
 */

import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillCategory } from '../../types';

export class WebhookSenderSkill extends BaseSkill {
  metadata = {
    id: 'webhook_sender',
    name: 'Webhook Sender',
    description: 'Send data to webhooks and external APIs',
    category: SkillCategory.INTEGRATION,
    version: '1.0.0',
    author: 'Intelagent',
    tags: ['webhook', 'api', 'integration', 'http']
  };

  validate(params: SkillParams): boolean {
    return !!(params.url && params.method);
  }

  async execute(params: SkillParams): Promise<SkillResult> {
    try {
      const { 
        url, 
        method = 'POST', 
        headers = {}, 
        data = {}, 
        timeout = 30000,
        retries = 3,
        auth = null 
      } = params;

      // Validate URL
      if (!this.isValidUrl(url)) {
        throw new Error('Invalid URL provided');
      }

      // Prepare headers
      const requestHeaders = this.prepareHeaders(headers, auth);

      // Prepare request data
      const requestBody = this.prepareRequestBody(data, method);

      // Simulate webhook call (in production, this would use fetch or axios)
      const response = await this.simulateWebhookCall(
        url,
        method,
        requestHeaders,
        requestBody,
        timeout,
        retries
      );

      // Process response
      const processedResponse = this.processResponse(response);

      return {
        success: true,
        data: {
          request: {
            url,
            method,
            headers: this.sanitizeHeaders(requestHeaders),
            body: requestBody,
            timestamp: new Date()
          },
          response: processedResponse,
          metrics: {
            responseTime: response.responseTime,
            statusCode: response.statusCode,
            retryCount: response.retryCount
          }
        },
        metadata: {
          skillId: this.metadata.id,
          skillName: this.metadata.name,
          timestamp: new Date()
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        data: {
          url: params.url,
          method: params.method,
          errorDetails: {
            message: error.message,
            code: error.code || 'UNKNOWN_ERROR',
            timestamp: new Date()
          }
        },
        metadata: {
          skillId: this.metadata.id,
          skillName: this.metadata.name,
          timestamp: new Date()
        }
      };
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private prepareHeaders(headers: any, auth: any): Record<string, string> {
    const preparedHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Intelagent-Webhook-Sender/1.0',
      ...headers
    };

    // Add authentication if provided
    if (auth) {
      if (auth.type === 'bearer') {
        preparedHeaders['Authorization'] = `Bearer ${auth.token}`;
      } else if (auth.type === 'basic') {
        const encoded = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
        preparedHeaders['Authorization'] = `Basic ${encoded}`;
      } else if (auth.type === 'apikey') {
        preparedHeaders[auth.headerName || 'X-API-Key'] = auth.key;
      }
    }

    return preparedHeaders;
  }

  private prepareRequestBody(data: any, method: string): any {
    // Don't send body for GET requests
    if (method === 'GET' || method === 'HEAD') {
      return undefined;
    }

    // Add metadata to request
    const enrichedData = {
      ...data,
      _metadata: {
        source: 'Intelagent Platform',
        timestamp: new Date(),
        requestId: this.generateRequestId()
      }
    };

    return enrichedData;
  }

  private async simulateWebhookCall(
    url: string,
    method: string,
    headers: Record<string, string>,
    body: any,
    timeout: number,
    maxRetries: number
  ): Promise<any> {
    // Simulate network call (in production, replace with actual HTTP client)
    const startTime = Date.now();
    let retryCount = 0;
    let lastError = null;

    while (retryCount < maxRetries) {
      try {
        // Simulate different response scenarios
        const scenario = this.determineScenario(url);
        
        if (scenario === 'success') {
          const responseTime = Math.floor(Math.random() * 500) + 100;
          
          // Simulate network delay
          await this.delay(Math.min(responseTime, 1000));
          
          return {
            statusCode: 200,
            body: {
              success: true,
              message: 'Webhook received successfully',
              data: {
                received: body,
                processedAt: new Date(),
                webhookId: this.generateWebhookId()
              }
            },
            headers: {
              'Content-Type': 'application/json',
              'X-Response-Time': responseTime.toString()
            },
            responseTime: Date.now() - startTime,
            retryCount
          };
        } else if (scenario === 'retry') {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw new Error('Max retries exceeded');
          }
          // Wait before retry with exponential backoff
          await this.delay(Math.pow(2, retryCount) * 1000);
          continue;
        } else {
          throw new Error('Webhook endpoint returned an error');
        }
      } catch (error) {
        lastError = error;
        retryCount++;
        
        if (retryCount >= maxRetries) {
          throw lastError;
        }
        
        // Exponential backoff
        await this.delay(Math.pow(2, retryCount) * 1000);
      }
    }

    throw lastError || new Error('Webhook call failed');
  }

  private determineScenario(url: string): string {
    // Simulate different scenarios based on URL patterns
    if (url.includes('test') || url.includes('sandbox')) {
      return 'success';
    }
    if (url.includes('retry')) {
      return 'retry';
    }
    if (url.includes('error') || url.includes('fail')) {
      return 'error';
    }
    
    // 90% success rate for general URLs
    return Math.random() > 0.1 ? 'success' : 'retry';
  }

  private processResponse(response: any): any {
    return {
      statusCode: response.statusCode,
      success: response.statusCode >= 200 && response.statusCode < 300,
      body: response.body,
      headers: response.headers,
      metrics: {
        responseTime: response.responseTime,
        retryCount: response.retryCount
      }
    };
  }

  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    
    Object.entries(headers).forEach(([key, value]) => {
      // Hide sensitive headers
      if (key.toLowerCase().includes('authorization') || 
          key.toLowerCase().includes('api-key') ||
          key.toLowerCase().includes('secret')) {
        sanitized[key] = '***REDACTED***';
      } else {
        sanitized[key] = value;
      }
    });
    
    return sanitized;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateWebhookId(): string {
    return `whk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getConfig(): Record<string, any> {
    return {
      supportedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      maxTimeout: 60000,
      maxRetries: 5,
      supportedAuthTypes: ['bearer', 'basic', 'apikey'],
      defaultHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
  }
}