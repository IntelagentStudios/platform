/**
 * API Connector Skill
 * Connect and interact with external APIs
 */

import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillCategory } from '../../types';

export class ApiConnectorSkill extends BaseSkill {
  metadata = {
    id: 'api_connector',
    name: 'API Connector',
    description: 'Connect and interact with external APIs',
    category: SkillCategory.INTEGRATION,
    version: '1.0.0',
    author: 'Intelagent',
    tags: ['api', 'integration', 'rest', 'graphql', 'connector']
  };

  private apiConfigs: Map<string, any> = new Map();

  validate(params: SkillParams): boolean {
    return !!(params.endpoint || params.apiName);
  }

  protected async executeImpl(params: SkillParams): Promise<SkillResult> {
    try {
      const { 
        endpoint,
        method = 'GET',
        headers = {},
        body,
        apiName,
        auth,
        timeout = 30000,
        retryPolicy = { maxRetries: 3, backoff: 'exponential' }
      } = params;

      // Configure API connection
      const config = this.buildApiConfig(endpoint, apiName, auth, headers);
      
      // Execute API call with retry logic
      const response = await this.executeWithRetry(
        config,
        method,
        body,
        retryPolicy,
        timeout
      );

      // Process and transform response
      const processedData = this.processResponse(response);

      return {
        success: true,
        data: {
          response: processedData,
          metadata: {
            endpoint: config.endpoint,
            method,
            statusCode: response.statusCode || 200,
            responseTime: response.responseTime,
            headers: response.headers,
            retries: response.retryCount || 0
          },
          cached: response.cached || false
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
        metadata: {
          skillId: this.metadata.id,
          skillName: this.metadata.name,
          timestamp: new Date()
        }
      };
    }
  }

  private buildApiConfig(endpoint?: string, apiName?: string, auth?: any, headers?: any): any {
    if (apiName && this.apiConfigs.has(apiName)) {
      return this.apiConfigs.get(apiName);
    }

    const config: any = {
      endpoint: endpoint || '',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers
      }
    };

    // Add authentication
    if (auth) {
      switch (auth.type) {
        case 'bearer':
          config.headers['Authorization'] = `Bearer ${auth.token}`;
          break;
        case 'apikey':
          config.headers[auth.headerName || 'X-API-Key'] = auth.key;
          break;
        case 'oauth2':
          config.headers['Authorization'] = `Bearer ${auth.accessToken}`;
          break;
        case 'basic':
          const encoded = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
          config.headers['Authorization'] = `Basic ${encoded}`;
          break;
      }
    }

    return config;
  }

  private async executeWithRetry(
    config: any,
    method: string,
    body: any,
    retryPolicy: any,
    timeout: number
  ): Promise<any> {
    let lastError: any;
    let retryCount = 0;
    const maxRetries = retryPolicy.maxRetries || 3;

    while (retryCount <= maxRetries) {
      try {
        const response = await this.makeApiCall(config, method, body, timeout);
        response.retryCount = retryCount;
        return response;
      } catch (error: any) {
        lastError = error;
        retryCount++;
        
        if (retryCount > maxRetries) {
          throw lastError;
        }

        // Calculate backoff delay
        const delay = this.calculateBackoff(retryCount, retryPolicy.backoff);
        await this.delay(delay);
      }
    }

    throw lastError;
  }

  private async makeApiCall(config: any, method: string, body: any, timeout: number): Promise<any> {
    const startTime = Date.now();
    
    // Simulate API call
    await this.delay(Math.random() * 500 + 100);
    
    // Mock response based on endpoint
    const mockResponse = this.generateMockResponse(config.endpoint, method, body);
    
    return {
      ...mockResponse,
      responseTime: Date.now() - startTime,
      headers: {
        'content-type': 'application/json',
        'x-request-id': `req_${Date.now()}`
      }
    };
  }

  private generateMockResponse(endpoint: string, method: string, body: any): any {
    // Generate realistic mock responses based on endpoint patterns
    if (endpoint.includes('/users')) {
      return {
        statusCode: 200,
        data: method === 'GET' ? 
          [{ id: 1, name: 'John Doe', email: 'john@example.com' }] :
          { id: Date.now(), ...body, created: new Date() }
      };
    }
    
    if (endpoint.includes('/products')) {
      return {
        statusCode: 200,
        data: {
          products: [
            { id: 1, name: 'Product A', price: 99.99 },
            { id: 2, name: 'Product B', price: 149.99 }
          ],
          total: 2
        }
      };
    }

    if (endpoint.includes('/analytics')) {
      return {
        statusCode: 200,
        data: {
          metrics: {
            views: Math.floor(Math.random() * 10000),
            clicks: Math.floor(Math.random() * 1000),
            conversions: Math.floor(Math.random() * 100)
          }
        }
      };
    }

    // Generic response
    return {
      statusCode: 200,
      data: {
        success: true,
        message: `${method} request processed`,
        timestamp: new Date()
      }
    };
  }

  private processResponse(response: any): any {
    // Transform and normalize response data
    const processed: any = {
      success: response.statusCode >= 200 && response.statusCode < 300,
      statusCode: response.statusCode,
      data: response.data
    };

    // Add pagination info if present
    if (response.data && response.data.page) {
      processed.pagination = {
        page: response.data.page,
        totalPages: response.data.totalPages,
        totalItems: response.data.totalItems
      };
    }

    // Add rate limit info if present
    if (response.headers) {
      if (response.headers['x-ratelimit-remaining']) {
        processed.rateLimit = {
          remaining: response.headers['x-ratelimit-remaining'],
          reset: response.headers['x-ratelimit-reset']
        };
      }
    }

    return processed;
  }

  private calculateBackoff(retryCount: number, backoffType: string): number {
    switch (backoffType) {
      case 'exponential':
        return Math.pow(2, retryCount) * 1000;
      case 'linear':
        return retryCount * 1000;
      case 'constant':
        return 1000;
      default:
        return Math.pow(2, retryCount) * 1000;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public registerApi(name: string, config: any): void {
    this.apiConfigs.set(name, config);
  }

  getConfig(): Record<string, any> {
    return {
      supportedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      supportedAuthTypes: ['bearer', 'apikey', 'oauth2', 'basic'],
      defaultTimeout: 30000,
      maxRetries: 5,
      registeredApis: Array.from(this.apiConfigs.keys())
    };
  }
}