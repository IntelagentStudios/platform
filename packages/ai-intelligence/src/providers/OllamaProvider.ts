import { LLMProvider, LLMMessage, LLMResponse, LLMEmbedding, LLMConfig } from './LLMProvider';

/**
 * Ollama Provider for fully local LLM models
 * Perfect for on-premise deployments with complete data privacy
 */
export class OllamaProvider extends LLMProvider {
  private baseUrl: string;

  constructor(config: LLMConfig) {
    super(config);
    this.baseUrl = config.apiEndpoint || 'http://localhost:11434';
  }

  async complete(messages: LLMMessage[], options?: Partial<LLMConfig>): Promise<LLMResponse> {
    const model = options?.model || this.config.model || 'llama2';
    
    // Convert messages to Ollama format
    const prompt = this.messagesToPrompt(messages);
    
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.customHeaders
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: options?.temperature || this.config.temperature || 0.7,
          top_p: options?.topP || this.config.topP || 1,
          num_predict: options?.maxTokens || this.config.maxTokens || 2048,
          stop: options?.stopSequences || this.config.stopSequences
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Apply PII redaction if enabled
    const content = this.redactPII(data.response);
    
    // Encrypt if enabled
    const finalContent = this.encryptResponse(content);

    return {
      content: finalContent,
      tokenUsage: {
        prompt: data.prompt_eval_count || 0,
        completion: data.eval_count || 0,
        total: (data.prompt_eval_count || 0) + (data.eval_count || 0)
      },
      model,
      finishReason: data.done ? 'stop' : 'length',
      metadata: {
        totalDuration: data.total_duration,
        loadDuration: data.load_duration,
        evalDuration: data.eval_duration
      }
    };
  }

  async embed(texts: string[]): Promise<LLMEmbedding[]> {
    const model = this.config.model || 'nomic-embed-text';
    const embeddings: LLMEmbedding[] = [];

    for (const text of texts) {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.customHeaders
        },
        body: JSON.stringify({
          model,
          prompt: this.redactPII(text)
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama embeddings failed: ${response.statusText}`);
      }

      const data = await response.json();
      embeddings.push({
        text,
        vector: data.embedding,
        model
      });
    }

    return embeddings;
  }

  async stream(messages: LLMMessage[], onChunk: (chunk: string) => void): Promise<void> {
    const model = this.config.model || 'llama2';
    const prompt = this.messagesToPrompt(messages);

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.customHeaders
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: true,
        options: {
          temperature: this.config.temperature || 0.7,
          top_p: this.config.topP || 1,
          num_predict: this.config.maxTokens || 2048
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama stream failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.response) {
            onChunk(this.redactPII(data.response));
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  private messagesToPrompt(messages: LLMMessage[]): string {
    return messages.map(msg => {
      if (msg.role === 'system') {
        return `System: ${msg.content}`;
      } else if (msg.role === 'user') {
        return `User: ${msg.content}`;
      } else {
        return `Assistant: ${msg.content}`;
      }
    }).join('\n\n');
  }

  getCapabilities() {
    return {
      maxTokens: 4096,
      supportsFunctions: false,
      supportsVision: true, // Llava models support vision
      supportsStreaming: true,
      supportsEmbeddings: true
    };
  }
}