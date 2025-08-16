// Platform-wide constants

export const PLATFORM_NAME = 'Intelagent Platform';
export const COMPANY_NAME = 'Intelagent Studios';

export const API_VERSION = 'v1';
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.intelagent.com';

export const PRODUCTS = {
  CHATBOT: 'chatbot',
  SALES: 'sales',
  SETUP: 'setup',
  ENRICHMENT: 'enrichment'
} as const;

export const PLANS = {
  BASIC: 'basic',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise'
} as const;

export const RATE_LIMITS = {
  API_CALLS_PER_MINUTE: 60,
  EMAILS_PER_DAY: 100,
  CONVERSATIONS_PER_DAY: 1000,
  ENRICHMENTS_PER_DAY: 500
};

export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
  WEEK: 604800 // 7 days
};

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_LICENSE: 'INVALID_LICENSE',
  EXPIRED_LICENSE: 'EXPIRED_LICENSE',
  RATE_LIMITED: 'RATE_LIMITED',
  PRODUCT_NOT_LICENSED: 'PRODUCT_NOT_LICENSED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};

export const WEBHOOK_EVENTS = {
  LICENSE_ACTIVATED: 'license.activated',
  PRODUCT_ENABLED: 'product.enabled',
  SUBSCRIPTION_UPDATED: 'subscription.updated',
  CONVERSATION_STARTED: 'conversation.started',
  LEAD_CREATED: 'lead.created',
  EMAIL_SENT: 'email.sent',
  INSIGHT_GENERATED: 'insight.generated'
};

export const DEFAULT_SETTINGS = {
  TIMEZONE: 'UTC',
  LANGUAGE: 'en',
  DATE_FORMAT: 'MM/DD/YYYY',
  CURRENCY: 'USD',
  THEME: 'light'
};