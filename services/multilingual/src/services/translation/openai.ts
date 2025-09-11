import { TranslationProvider } from './base';
import { TranslationRequest } from '../../types';

export class OpenAITranslationProvider extends TranslationProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    super();
    this.apiKey = apiKey;
    this.model = model;
  }

  async translate(request: TranslationRequest): Promise<string> {
    const prompt = this.buildPrompt(request);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator. Translate the text accurately while preserving formatting, tone, and meaning. Return only the translated text without any explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json() as any;
    return data.choices[0].message.content.trim();
  }

  async translateBatch(requests: TranslationRequest[]): Promise<string[]> {
    const promises = requests.map(req => this.translate(req));
    return Promise.all(promises);
  }

  private buildPrompt(request: TranslationRequest): string {
    let prompt = `Translate from ${request.sourceLocale} to ${request.targetLocale}:\n\n${request.text}`;
    
    if (request.context) {
      prompt = `Context: ${request.context}\n\n${prompt}`;
    }
    
    return prompt;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  getName(): string {
    return 'OpenAI';
  }
}