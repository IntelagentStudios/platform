/**
 * UI System Package - Export all components
 */

// Core Components
export { DataCatalog } from './DataCatalog';
export { LayoutSchema, LayoutBuilder, Tab, Row, Column, Widget } from './LayoutSchema';
export { WidgetRuntime, WidgetGateway } from './WidgetRuntime';
export { DesignerEngine } from './DesignerEngine';

// Integration Adapters
export { IntegrationAdapter, IntegrationConfig, IntegrationMetadata, IntegrationData } from './integrations/IntegrationAdapter';
export { SalesforceAdapter } from './integrations/SalesforceAdapter';
export { HubSpotAdapter } from './integrations/HubSpotAdapter';
export { ShopifyAdapter } from './integrations/ShopifyAdapter';
export { GmailAdapter } from './integrations/GmailAdapter';
export { SlackAdapter } from './integrations/SlackAdapter';
export { GoogleAnalyticsAdapter } from './integrations/GoogleAnalyticsAdapter';
export { IntegrationManager, integrationManager } from './integrations/IntegrationManager';

// Telemetry
export {
  TelemetryCollector,
  TelemetryEvent,
  TelemetryMetrics,
  WidgetMetric,
  EngagementMetric,
  telemetryManager
} from './telemetry/TelemetryCollector';

// Types
export interface UISystemConfig {
  enableTelemetry?: boolean;
  enableCaching?: boolean;
  cacheTimeout?: number;
  apiEndpoint?: string;
  defaultTheme?: any;
}

export interface WidgetConfig {
  id?: string;
  type: string;
  title?: string;
  bind?: string;
  viz?: string;
  config?: Record<string, any>;
  permissions?: string[];
}

export interface LayoutVersion {
  version: string;
  createdAt: Date;
  createdBy: string;
  changes?: string;
  isDraft?: boolean;
  isPublished?: boolean;
}

export interface DesignerRequest {
  description: string;
  product: string;
  skills: string[];
  integrations?: string[];
  currentLayout?: any;
}

export interface DesignerResponse {
  success: boolean;
  draftLayout?: any;
  changes?: string[];
  suggestions?: string[];
  error?: string;
}

// Version
export const VERSION = '1.0.0';

// Default configuration
export const defaultConfig: UISystemConfig = {
  enableTelemetry: true,
  enableCaching: true,
  cacheTimeout: 300000, // 5 minutes
  apiEndpoint: '/api/ui',
  defaultTheme: {
    primaryColor: '#3b82f6',
    backgroundColor: '#ffffff',
    textColor: '#111827',
    borderColor: '#e5e7eb'
  }
};