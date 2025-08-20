// Chat API Configuration
export interface ChatConfig {
  mode: 'openai' | 'n8n' | 'hybrid';
  n8nWebhookUrl?: string;
  n8nSetupUrl?: string;
  openaiApiKey?: string;
  fallbackToOpenAI?: boolean;
}

// Get configuration from environment or database
export function getChatConfig(siteKey?: string): ChatConfig {
  // You can customize this based on site key or other factors
  const mode = process.env.CHAT_MODE || 'hybrid';
  
  return {
    mode: mode as ChatConfig['mode'],
    n8nWebhookUrl: process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/chatbot',
    n8nSetupUrl: process.env.N8N_SETUP_WEBHOOK || 'http://localhost:5678/webhook/setup-agent',
    openaiApiKey: process.env.OPENAI_API_KEY,
    fallbackToOpenAI: true
  };
}

// Site key validation and extraction
export interface SiteConfig {
  domain: string;
  features: string[];
  useN8n: boolean;
  indexed: boolean;
}

export function getSiteConfig(siteKey: string): SiteConfig | null {
  // In production, this would query your database
  // For now, we'll parse the site key format
  
  if (!siteKey || !siteKey.startsWith('ik_')) {
    return null;
  }
  
  // Parse site key format: ik_[domain]_[features]_[id]
  // Example: ik_example.com_n8n_indexed_abc123
  const parts = siteKey.split('_');
  
  return {
    domain: parts[1] || 'unknown',
    features: parts.slice(2, -1),
    useN8n: parts.includes('n8n'),
    indexed: parts.includes('indexed')
  };
}