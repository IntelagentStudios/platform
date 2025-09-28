import { LLMProvider, LLMMessage, LLMResponse, LLMEmbedding, LLMConfig } from './LLMProvider';

/**
 * Custom LLM Provider for enterprise customers
 * Allows connection to any LLM API with custom format
 */
export class CustomLLMProvider extends LLMProvider {
  private endpoint: string;
  private headers: Record<string, string>;

  constructor(config: LLMConfig) {
    super(config);
    
    if (!config.apiEndpoint) {
      throw new Error('API endpoint is required for custom LLM provider');
    }
    
    this.endpoint = config.apiEndpoint;
    this.headers = {
      'Content-Type': 'application/json',
      ...config.customHeaders
    };
    
    if (config.apiKey) {
      this.headers['Authorization'] = `Bearer ${config.apiKey}`;
    }
  }

  async complete(messages: LLMMessage[], options?: Partial<LLMConfig>): Promise<LLMResponse> {
    // Build request in a flexible format
    const requestBody = this.buildRequestBody(messages, options);
    
    const response = await fetch(`${this.endpoint}/completions`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(this.config.timeout || 30000)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Custom LLM request failed: ${response.status} - ${error}`);
    }

    const data: any = await response.json();
    
    // Extract response based on common patterns
    const content = this.extractContent(data);
    
    // Apply security measures
    const processedContent = this.processContent(content);

    return {
      content: processedContent,
      tokenUsage: this.extractTokenUsage(data),
      model: options?.model || this.config.model || 'custom',
      finishReason: this.extractFinishReason(data),
      metadata: data.metadata || {}
    };
  }

  async embed(texts: string[]): Promise<LLMEmbedding[]> {
    const response = await fetch(`${this.endpoint}/embeddings`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        texts: texts.map(t => this.redactPII(t)),
        model: this.config.model
      }),
      signal: AbortSignal.timeout(this.config.timeout || 30000)
    });

    if (!response.ok) {
      throw new Error(`Custom embeddings failed: ${response.statusText}`);
    }

    const data: any = await response.json();
    
    // Handle various response formats
    if (Array.isArray(data.embeddings)) {
      return texts.map((text, i) => ({
        text,
        vector: data.embeddings[i],
        model: this.config.model
      }));
    } else if (data.data && Array.isArray(data.data)) {
      return texts.map((text, i) => ({
        text,
        vector: data.data[i].embedding || data.data[i].vector,
        model: this.config.model
      }));
    } else {
      throw new Error('Unexpected embedding response format');
    }
  }

  async stream(messages: LLMMessage[], onChunk: (chunk: string) => void): Promise<void> {
    const requestBody = this.buildRequestBody(messages, { stream: true });
    
    const response = await fetch(`${this.endpoint}/completions/stream`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Custom stream failed: ${response.statusText}`);
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
        // Handle SSE format
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            const content = this.extractStreamContent(parsed);
            if (content) {
              onChunk(this.redactPII(content));
            }
          } catch {
            // Try raw text
            onChunk(this.redactPII(data));
          }
        }
      }
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.endpoint}/health`, {
        method: 'GET',
        headers: this.headers,
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private buildRequestBody(messages: LLMMessage[], options?: any): any {
    // Support multiple request formats
    return {
      messages,
      model: options?.model || this.config.model,
      max_tokens: options?.maxTokens || this.config.maxTokens,
      temperature: options?.temperature || this.config.temperature,
      top_p: options?.topP || this.config.topP,
      stream: options?.stream || false,
      stop: options?.stopSequences || this.config.stopSequences,
      // Alternative field names
      prompt: messages.map(m => m.content).join('\n'),
      system: messages.find(m => m.role === 'system')?.content
    };
  }

  private extractContent(data: any): string {
    // Try common response patterns
    if (data.choices?.[0]?.message?.content) {
      return data.choices[0].message.content;
    }
    if (data.choices?.[0]?.text) {
      return data.choices[0].text;
    }
    if (data.completion) {
      return data.completion;
    }
    if (data.response) {
      return data.response;
    }
    if (data.text) {
      return data.text;
    }
    if (data.content) {
      return data.content;
    }
    
    throw new Error('Could not extract content from response');
  }

  private extractStreamContent(data: any): string | null {
    if (data.choices?.[0]?.delta?.content) {
      return data.choices[0].delta.content;
    }
    if (data.delta?.content) {
      return data.delta.content;
    }
    if (data.token) {
      return data.token;
    }
    if (data.text) {
      return data.text;
    }
    return null;
  }

  private extractTokenUsage(data: any): any {
    if (data.usage) {
      return {
        prompt: data.usage.prompt_tokens || 0,
        completion: data.usage.completion_tokens || 0,
        total: data.usage.total_tokens || 0
      };
    }
    return undefined;
  }

  private extractFinishReason(data: any): string {
    if (data.choices?.[0]?.finish_reason) {
      return data.choices[0].finish_reason;
    }
    if (data.stop_reason) {
      return data.stop_reason;
    }
    return 'stop';
  }

  private processContent(content: string): string {
    let processed = content;
    
    if (this.config.redactPII) {
      processed = this.redactPII(processed);
    }
    
    if (this.config.encryptResponses) {
      processed = this.encryptResponse(processed);
    }
    
    return processed;
  }
}