/**
 * LLM Provider Interface
 * Allows customers to use their own LLM models for complete data privacy
 */

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'ollama' | 'azure' | 'huggingface' | 'custom' | 'self-hosted';
  apiKey?: string;
  apiEndpoint?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
  systemPrompt?: string;
  customHeaders?: Record<string, string>;
  timeout?: number;
  retryAttempts?: number;
  // For self-hosted models
  localModelPath?: string;
  gpuEnabled?: boolean;
  quantization?: '4bit' | '8bit' | 'none';
  // Security
  encryptResponses?: boolean;
  redactPII?: boolean;
  dataResidency?: 'us' | 'eu' | 'asia' | 'local';
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

export interface LLMResponse {
  content: string;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  model?: string;
  finishReason?: string;
  metadata?: Record<string, any>;
}

export interface LLMEmbedding {
  text: string;
  vector: number[];
  model?: string;
}

export abstract class LLMProvider {
  protected config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  /**
   * Generate text completion
   */
  abstract complete(messages: LLMMessage[], options?: Partial<LLMConfig>): Promise<LLMResponse>;

  /**
   * Generate embeddings for text
   */
  abstract embed(texts: string[]): Promise<LLMEmbedding[]>;

  /**
   * Stream text completion
   */
  abstract stream(messages: LLMMessage[], onChunk: (chunk: string) => void): Promise<void>;

  /**
   * Check if provider is available
   */
  abstract healthCheck(): Promise<boolean>;

  /**
   * Get model capabilities
   */
  getCapabilities(): {
    maxTokens: number;
    supportsFunctions: boolean;
    supportsVision: boolean;
    supportsStreaming: boolean;
    supportsEmbeddings: boolean;
  } {
    return {
      maxTokens: this.config.maxTokens || 4096,
      supportsFunctions: false,
      supportsVision: false,
      supportsStreaming: true,
      supportsEmbeddings: true
    };
  }

  /**
   * Redact PII from text if enabled
   */
  protected redactPII(text: string): string {
    if (!this.config.redactPII) return text;

    // Basic PII redaction
    let redacted = text;
    
    // Email addresses
    redacted = redacted.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
    
    // Phone numbers
    redacted = redacted.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]');
    
    // SSN
    redacted = redacted.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]');
    
    // Credit card numbers
    redacted = redacted.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CREDIT_CARD]');
    
    return redacted;
  }

  /**
   * Encrypt response if enabled
   */
  protected encryptResponse(response: string): string {
    if (!this.config.encryptResponses) return response;
    
    // Implement encryption logic here
    // For now, just base64 encode as placeholder
    return Buffer.from(response).toString('base64');
  }
}