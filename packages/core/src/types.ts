// Shared types across the platform

export interface License {
  licenseKey: string;
  email?: string;
  createdAt?: Date;
  usedAt?: Date;
  domain?: string;
  siteKey?: string;
  status?: string;
  subscriptionId?: string;
  lastPaymentDate?: Date;
  nextBillingDate?: Date;
  subscriptionStatus?: string;
  customerName?: string;
  plan?: 'basic' | 'premium' | 'enterprise';
  products: Product[];
}

export type Product = 'chatbot' | 'sales' | 'setup' | 'enrichment';

export interface User {
  id: string;
  licenseKey: string;
  email: string;
  name?: string;
  domain: string;
  products: Product[];
  isPremium: boolean;
  isMaster: boolean;
}

export interface AuthToken {
  licenseKey: string;
  domain: string;
  isMaster: boolean;
  products: Product[];
  exp: number;
}

export interface SetupSession {
  sessionId: string;
  productId: Product;
  currentStep: string;
  collectedData: Record<string, any>;
  validated: boolean;
  completedAt?: Date;
}

export interface AIInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'recommendation' | 'prediction';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  product?: Product;
  metric?: string;
  value?: string;
  change?: number;
  actionable?: boolean;
  action?: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface DashboardStats {
  totalConversations?: number;
  activeUsers?: number;
  responseRate?: number;
  avgResponseTime?: number;
  totalLeads?: number;
  emailsSent?: number;
  campaignsActive?: number;
  conversionRate?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}