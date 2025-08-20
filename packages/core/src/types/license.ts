export interface License {
  // Core Identity
  license_key: string;
  organization_id?: string;
  
  // Customer Information
  customer_email: string;
  customer_name: string;
  company_name?: string;
  
  // Product Access
  products: ProductAccess[];
  plan_tier: PlanTier;
  
  // Activation & Status
  status: LicenseStatus;
  activation_date?: Date;
  expiration_date?: Date;
  
  // Usage Limits
  usage_limits: UsageLimits;
  usage_current: UsageLimits;
  
  // Integration Keys
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  squarespace_order_id?: string;
  
  // Domain & Security
  allowed_domains: string[];
  ip_whitelist?: string[];
  api_keys?: APIKey[];
  
  // Metadata
  created_at: Date;
  updated_at: Date;
  last_verified?: Date;
  notes?: string;
}

export interface ProductAccess {
  product_id: ProductId;
  enabled: boolean;
  tier: ProductTier;
  features: string[];
  usage_current: number;
  usage_limit: number;
  config?: Record<string, any>;
  activated_at?: Date;
}

export interface UsageLimits {
  chatbot_conversations?: number;
  sales_leads?: number;
  api_calls?: number;
  setup_forms?: number;
  ai_insights_queries?: number;
  enrichment_lookups?: number;
  team_members?: number;
  custom?: Record<string, number>;
}

export interface APIKey {
  key: string;
  name: string;
  product_id?: ProductId;
  permissions: string[];
  created_at: Date;
  last_used?: Date;
  expires_at?: Date;
}

export type ProductId = 
  | 'chatbot' 
  | 'sales_agent' 
  | 'setup_agent' 
  | 'enrichment' 
  | 'ai_insights'
  | 'custom';

export type PlanTier = 
  | 'trial'
  | 'starter' 
  | 'professional' 
  | 'enterprise' 
  | 'custom';

export type ProductTier = 
  | 'basic' 
  | 'pro' 
  | 'enterprise';

export type LicenseStatus = 
  | 'pending'
  | 'active' 
  | 'suspended' 
  | 'expired' 
  | 'revoked';

export interface LicenseValidation {
  valid: boolean;
  license?: License;
  error?: string;
  remaining_usage?: UsageLimits;
  features?: string[];
}