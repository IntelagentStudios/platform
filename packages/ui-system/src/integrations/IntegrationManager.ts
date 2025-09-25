import { IntegrationAdapter, IntegrationConfig } from './IntegrationAdapter';
import { SalesforceAdapter } from './SalesforceAdapter';
import { HubSpotAdapter } from './HubSpotAdapter';
import { ShopifyAdapter } from './ShopifyAdapter';
import { GmailAdapter } from './GmailAdapter';
import { SlackAdapter } from './SlackAdapter';
import { GoogleAnalyticsAdapter } from './GoogleAnalyticsAdapter';

export class IntegrationManager {
  private integrations: Map<string, IntegrationAdapter> = new Map();
  private configs: Map<string, IntegrationConfig> = new Map();

  constructor() {
    // Load saved configurations from database/storage
    this.loadConfigurations();
  }

  /**
   * Register a new integration
   */
  async addIntegration(
    type: string,
    config: IntegrationConfig,
    tenantId: string
  ): Promise<boolean> {
    try {
      const adapter = this.createAdapter(type, config);
      if (!adapter) {
        throw new Error(`Unknown integration type: ${type}`);
      }

      // Initialize and verify connection
      const initialized = await adapter.initialize();
      if (!initialized) {
        throw new Error(`Failed to initialize ${type} integration`);
      }

      // Store the integration
      const key = `${tenantId}:${type}`;
      this.integrations.set(key, adapter);
      this.configs.set(key, config);

      // Save configuration
      await this.saveConfiguration(key, type, config, tenantId);

      return true;
    } catch (error) {
      console.error(`Error adding integration ${type}:`, error);
      return false;
    }
  }

  /**
   * Get an integration adapter
   */
  getIntegration(type: string, tenantId: string): IntegrationAdapter | null {
    const key = `${tenantId}:${type}`;
    return this.integrations.get(key) || null;
  }

  /**
   * Remove an integration
   */
  async removeIntegration(type: string, tenantId: string): Promise<boolean> {
    const key = `${tenantId}:${type}`;
    this.integrations.delete(key);
    this.configs.delete(key);
    
    // Remove from database
    await this.deleteConfiguration(key);
    return true;
  }

  /**
   * List all integrations for a tenant
   */
  listIntegrations(tenantId: string): Array<{ type: string; metadata: any }> {
    const result: Array<{ type: string; metadata: any }> = [];
    
    this.integrations.forEach((adapter, key) => {
      if (key.startsWith(`${tenantId}:`)) {
        result.push({
          type: key.split(':')[1],
          metadata: adapter.metadata
        });
      }
    });

    return result;
  }

  /**
   * Get available integration types
   */
  getAvailableTypes(): string[] {
    return [
      'salesforce',
      'hubspot',
      'shopify',
      'gmail',
      'slack',
      'google-analytics'
    ];
  }

  /**
   * Create adapter instance
   */
  private createAdapter(type: string, config: IntegrationConfig): IntegrationAdapter | null {
    switch (type) {
      case 'salesforce':
        return new SalesforceAdapter(config);
      case 'hubspot':
        return new HubSpotAdapter(config);
      case 'shopify':
        return new ShopifyAdapter(config);
      case 'gmail':
        return new GmailAdapter(config);
      case 'slack':
        return new SlackAdapter(config);
      case 'google-analytics':
        return new GoogleAnalyticsAdapter(config);
      default:
        return null;
    }
  }

  /**
   * Load configurations from storage
   */
  private async loadConfigurations(): Promise<void> {
    // In production, load from database
    // For now, use mock data
    const mockConfigs = [
      {
        key: 'demo:salesforce',
        type: 'salesforce',
        config: {
          accessToken: 'mock-token',
          domain: 'demo'
        },
        tenantId: 'demo'
      }
    ];

    for (const item of mockConfigs) {
      const adapter = this.createAdapter(item.type, item.config);
      if (adapter) {
        this.integrations.set(item.key, adapter);
        this.configs.set(item.key, item.config);
      }
    }
  }

  /**
   * Save configuration to storage
   */
  private async saveConfiguration(
    key: string,
    type: string,
    config: IntegrationConfig,
    tenantId: string
  ): Promise<void> {
    // In production, save to database
    console.log(`Saving integration config: ${key}`);
    
    // Example database save:
    // await prisma.integrations.create({
    //   data: {
    //     key,
    //     type,
    //     config: JSON.stringify(config),
    //     tenantId,
    //     createdAt: new Date()
    //   }
    // });
  }

  /**
   * Delete configuration from storage
   */
  private async deleteConfiguration(key: string): Promise<void> {
    // In production, delete from database
    console.log(`Deleting integration config: ${key}`);
    
    // Example database delete:
    // await prisma.integrations.delete({
    //   where: { key }
    // });
  }

  /**
   * Handle webhook from integration
   */
  async handleWebhook(
    type: string,
    tenantId: string,
    payload: any
  ): Promise<any> {
    const adapter = this.getIntegration(type, tenantId);
    if (!adapter || !adapter.handleWebhook) {
      throw new Error(`Integration ${type} does not support webhooks`);
    }

    return adapter.handleWebhook(payload);
  }

  /**
   * Sync data from multiple integrations
   */
  async syncData(
    tenantId: string,
    integrationTypes?: string[]
  ): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    const types = integrationTypes || this.getAvailableTypes();

    for (const type of types) {
      const adapter = this.getIntegration(type, tenantId);
      if (adapter) {
        try {
          // Fetch latest data from each integration
          const data = await adapter.fetchData('sync', { limit: 100 });
          results.set(type, data);
        } catch (error) {
          console.error(`Error syncing ${type}:`, error);
          results.set(type, { error: error });
        }
      }
    }

    return results;
  }
}

// Singleton instance
export const integrationManager = new IntegrationManager();