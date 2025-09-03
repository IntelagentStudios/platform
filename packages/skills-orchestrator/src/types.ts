/**
 * Type definitions for the Skills System
 */

export interface SkillParams {
  [key: string]: any;
}

export interface SkillResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime?: number;
  metadata?: {
    skillId: string;
    skillName: string;
    timestamp: Date;
    [key: string]: any;
  };
}

export enum SkillCategory {
  UTILITY = 'utility',
  COMMUNICATION = 'communication',
  DATA_PROCESSING = 'data_processing',
  INTEGRATION = 'integration',
  AI_POWERED = 'ai_powered',
  AUTOMATION = 'automation',
  ANALYTICS = 'analytics',
  PRODUCTIVITY = 'productivity',
  AI_ANALYTICS = 'ai_analytics',
  AI_ML = 'ai_ml',
  BUSINESS = 'business',
  BLOCKCHAIN = 'blockchain',
  EDUCATION = 'education',
  ENTERTAINMENT = 'entertainment',
  FINANCE = 'finance',
  HEALTHCARE = 'healthcare',
  LEGAL = 'legal',
  MANUFACTURING = 'manufacturing',
  MEDIA = 'media',
  REALESTATE = 'realestate',
  SECURITY = 'security',
  ECOMMERCE = 'ecommerce',
  MARKETING = 'marketing',
  SALES = 'sales',
  CUSTOMER_SERVICE = 'customer_service',
  DEVELOPMENT = 'development',
  CUSTOM = 'custom'
}

export interface SkillConfig {
  enabled: boolean;
  rateLimit?: {
    requests: number;
    period: 'minute' | 'hour' | 'day';
  };
  requiredPermissions?: string[];
  customSettings?: {
    [key: string]: any;
  };
}

export interface SkillMetadata {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  version: string;
  author: string;
  tags?: string[];
  documentation?: string;
  examples?: SkillExample[];
}

export interface SkillExample {
  description: string;
  params: SkillParams;
  expectedResult?: any;
}

export interface SkillDefinition extends SkillMetadata {
  config?: SkillConfig;
  execute: (params: SkillParams) => Promise<SkillResult>;
  validate?: (params: SkillParams) => boolean;
}