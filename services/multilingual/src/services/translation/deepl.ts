import { TranslationProvider } from './base';
import { TranslationRequest } from '../../types';

export class DeepLTranslationProvider extends TranslationProvider {
  private apiKey: string;
  private apiUrl: string;

  constructor(apiKey: string, useFreeApi: boolean = false) {
    super();
    this.apiKey = apiKey;
    this.apiUrl = useFreeApi 
      ? 'https://api-free.deepl.com/v2'
      : 'https://api.deepl.com/v2';
  }

  async translate(request: TranslationRequest): Promise<string> {
    const params = new URLSearchParams({
      auth_key: this.apiKey,
      text: request.text,
      source_lang: request.sourceLocale.toUpperCase(),
      target_lang: this.mapTargetLocale(request.targetLocale),
      preserve_formatting: '1'
    });

    const response = await fetch(`${this.apiUrl}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    if (!response.ok) {
      throw new Error(`DeepL API error: ${response.status}`);
    }

    const data = await response.json() as any;
    return data.translations[0].text;
  }

  async translateBatch(requests: TranslationRequest[]): Promise<string[]> {
    const texts = requests.map(r => r.text);
    const targetLocale = requests[0].targetLocale;
    const sourceLocale = requests[0].sourceLocale;

    const params = new URLSearchParams({
      auth_key: this.apiKey,
      source_lang: sourceLocale.toUpperCase(),
      target_lang: this.mapTargetLocale(targetLocale),
      preserve_formatting: '1'
    });

    texts.forEach(text => params.append('text', text));

    const response = await fetch(`${this.apiUrl}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    if (!response.ok) {
      throw new Error(`DeepL API error: ${response.status}`);
    }

    const data = await response.json() as any;
    return data.translations.map((t: any) => t.text);
  }

  private mapTargetLocale(locale: string): string {
    const mapping: Record<string, string> = {
      'pt': 'PT-PT',
      'en': 'EN-US',
      'zh': 'ZH'
    };
    return mapping[locale] || locale.toUpperCase();
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  getName(): string {
    return 'DeepL';
  }
}