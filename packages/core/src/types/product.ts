export interface Product {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category: ProductCategory;
  base_price: number;
  tiers: ProductTierConfig[];
  features: Feature[];
  dependencies?: string[];
  compatible_with?: string[];
  setup_required: boolean;
  api_enabled: boolean;
}

export interface ProductTierConfig {
  tier: 'basic' | 'pro' | 'enterprise';
  name: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  limits: Record<string, number>;
  support_level: 'community' | 'email' | 'priority' | 'dedicated';
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  tier_required?: 'basic' | 'pro' | 'enterprise';
  usage_counted: boolean;
  api_accessible: boolean;
}

export type ProductCategory = 
  | 'communication'
  | 'sales'
  | 'automation'
  | 'analytics'
  | 'integration';

export interface ProductUsage {
  product_id: string;
  license_key: string;
  period_start: Date;
  period_end: Date;
  usage: Record<string, number>;
  cost?: number;
}

export interface ProductConfig {
  product_id: string;
  license_key: string;
  settings: Record<string, any>;
  webhooks?: WebhookConfig[];
  integrations?: IntegrationConfig[];
}

export interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
}

export interface IntegrationConfig {
  type: string;
  credentials?: Record<string, string>;
  settings: Record<string, any>;
  active: boolean;
}