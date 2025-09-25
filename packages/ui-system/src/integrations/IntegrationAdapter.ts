/**
 * Base Integration Adapter for third-party services
 * Provides a common interface for all integrations
 */

export interface IntegrationConfig {
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  domain?: string;
  webhookUrl?: string;
  customFields?: Record<string, any>;
}

export interface IntegrationMetadata {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'crm' | 'marketing' | 'analytics' | 'communication' | 'ecommerce';
  requiredScopes?: string[];
  supportedActions: string[];
  supportedTriggers?: string[];
}

export interface IntegrationData {
  type: string;
  data: any;
  metadata?: Record<string, any>;
}

export abstract class IntegrationAdapter {
  protected config: IntegrationConfig;
  abstract metadata: IntegrationMetadata;

  constructor(config: IntegrationConfig) {
    this.config = config;
  }

  /**
   * Initialize the integration (e.g., verify credentials)
   */
  abstract async initialize(): Promise<boolean>;

  /**
   * Fetch data from the integration
   */
  abstract async fetchData(endpoint: string, params?: Record<string, any>): Promise<IntegrationData>;

  /**
   * Push data to the integration
   */
  abstract async pushData(endpoint: string, data: any): Promise<IntegrationData>;

  /**
   * Subscribe to webhooks
   */
  async subscribeWebhook?(event: string, callbackUrl: string): Promise<boolean>;

  /**
   * Handle incoming webhook
   */
  async handleWebhook?(payload: any): Promise<IntegrationData>;

  /**
   * Get available fields for mapping
   */
  abstract async getAvailableFields(): Promise<string[]>;

  /**
   * Validate configuration
   */
  protected validateConfig(): boolean {
    // Override in subclasses for specific validation
    return true;
  }

  /**
   * Transform data to common format
   */
  protected transformToCommon(data: any): IntegrationData {
    return {
      type: 'generic',
      data,
      metadata: {
        source: this.metadata.id,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Transform from common format
   */
  protected transformFromCommon(data: IntegrationData): any {
    return data.data;
  }
}