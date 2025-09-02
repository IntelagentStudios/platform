/**
 * Chatbot Service Isolation Configuration
 * Ensures the commercial website chatbot remains independent from skills system
 */

export const CHATBOT_ISOLATION_CONFIG = {
  // Service identification
  service: {
    id: 'website-chatbot-service',
    name: 'Commercial Website Chatbot',
    version: '2.0.0',
    isolated: true,
    priority: 'critical'
  },

  // Isolation settings
  isolation: {
    enabled: true,
    preventSkillsIntegration: true,
    useIndependentDatabase: false, // Set to true if using separate DB
    useIndependentCache: true,
    useIndependentQueue: true,
    bypassSkillsMiddleware: true
  },

  // Security settings
  security: {
    requireProductKey: true,
    allowedOrigins: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://intelagent.com',
      'https://www.intelagent.com',
      'https://*.intelagent.com'
    ],
    rateLimiting: {
      enabled: true,
      maxRequestsPerMinute: 60,
      maxRequestsPerHour: 1000
    }
  },

  // Feature flags
  features: {
    streaming: true,
    markdown: true,
    codeHighlighting: true,
    fileUpload: false,
    voiceInput: false,
    skillsIntegration: false, // CRITICAL: Keep this false
    advancedAnalytics: true,
    conversationHistory: true
  },

  // Fallback configuration
  fallback: {
    enabled: true,
    responses: {
      error: 'I apologize, but I\'m having trouble processing your request. Please try again.',
      maintenance: 'The chatbot is currently undergoing maintenance. Please check back soon.',
      rateLimit: 'You\'ve reached the message limit. Please wait a moment before continuing.'
    }
  },

  // Monitoring and alerting
  monitoring: {
    enabled: true,
    healthCheckInterval: 60000, // 1 minute
    alertOnError: true,
    alertChannels: ['email', 'slack'],
    metrics: {
      trackResponseTime: true,
      trackErrorRate: true,
      trackUsage: true
    }
  },

  // Resource allocation
  resources: {
    dedicatedWorkers: 2,
    maxConcurrentSessions: 1000,
    sessionTimeout: 1800000, // 30 minutes
    memoryLimit: '512MB',
    cpuLimit: '50%'
  },

  // API configuration
  api: {
    basePath: '/api/chatbot',
    publicEndpoints: [
      '/api/chatbot/widget',
      '/api/chatbot/session',
      '/api/chatbot/message'
    ],
    protectedEndpoints: [
      '/api/chatbot/admin',
      '/api/chatbot/analytics',
      '/api/chatbot/config'
    ]
  },

  // Widget configuration
  widget: {
    scriptUrl: '/chatbot-widget.js',
    styleUrl: '/chatbot-widget.css',
    autoLoad: true,
    position: 'bottom-right',
    theme: 'light'
  },

  // System prompts (isolated from skills system)
  prompts: {
    system: `You are a helpful customer service assistant for Intelagent. 
             You help website visitors with questions about our products and services.
             Be professional, friendly, and concise.
             Focus on providing accurate information about Intelagent's offerings.`,
    welcome: 'Welcome to Intelagent! How can I help you today?',
    fallback: 'I understand you\'re asking about that. Let me help you find the right information.'
  }
};

// Validation function to ensure isolation
export function validateIsolation(): boolean {
  const config = CHATBOT_ISOLATION_CONFIG;
  
  // Critical checks
  if (!config.isolation.enabled) {
    console.error('CRITICAL: Chatbot isolation is disabled!');
    return false;
  }
  
  if (!config.isolation.preventSkillsIntegration) {
    console.error('CRITICAL: Skills integration is not prevented!');
    return false;
  }
  
  if (config.features.skillsIntegration) {
    console.error('CRITICAL: Skills integration feature is enabled!');
    return false;
  }
  
  console.log('✓ Chatbot isolation validated successfully');
  return true;
}

// Export helper functions
export function isIsolated(): boolean {
  return CHATBOT_ISOLATION_CONFIG.isolation.enabled;
}

export function getServiceId(): string {
  return CHATBOT_ISOLATION_CONFIG.service.id;
}

export function getAllowedOrigins(): string[] {
  return CHATBOT_ISOLATION_CONFIG.security.allowedOrigins;
}

export function getSystemPrompt(): string {
  return CHATBOT_ISOLATION_CONFIG.prompts.system;
}