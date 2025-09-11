import { Env, TranslationEntry, TranslationRequest } from '../types';
import { TranslationService } from './translation';

export class TranslationMemory {
  private kv: KVNamespace;
  private translationService: TranslationService;
  private glossary: Map<string, string>;

  constructor(env: Env, glossary: Record<string, string> = {}) {
    this.kv = env.TRANSLATION_MEMORY;
    this.translationService = new TranslationService(env);
    this.glossary = new Map(Object.entries(glossary));
  }

  private generateKey(text: string, targetLocale: string): string {
    const hash = this.simpleHash(text);
    return `tm:${targetLocale}:${hash}`;
  }

  private simpleHash(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  async get(text: string, targetLocale: string): Promise<TranslationEntry | null> {
    const key = this.generateKey(text, targetLocale);
    const cached = await this.kv.get(key, 'json') as TranslationEntry | null;
    return cached;
  }

  async set(entry: TranslationEntry): Promise<void> {
    const key = this.generateKey(entry.original, entry.locale);
    await this.kv.put(key, JSON.stringify(entry), {
      expirationTtl: 60 * 60 * 24 * 365
    });
  }

  async translate(text: string, sourceLocale: string, targetLocale: string, context?: string): Promise<string> {
    if (sourceLocale === targetLocale) {
      return text;
    }

    text = text.trim();
    if (!text) return '';

    if (this.glossary.has(text)) {
      return this.glossary.get(text)!;
    }

    const cached = await this.get(text, targetLocale);
    if (cached && cached.translated) {
      return cached.translated;
    }

    const request: TranslationRequest = {
      text,
      sourceLocale,
      targetLocale,
      context
    };

    try {
      const translated = await this.translationService.translate(request);
      
      const entry: TranslationEntry = {
        original: text,
        translated,
        locale: targetLocale,
        provider: 'openai',
        timestamp: Date.now(),
        context
      };

      await this.set(entry);
      return translated;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }

  async translateBatch(
    texts: string[],
    sourceLocale: string,
    targetLocale: string
  ): Promise<string[]> {
    if (sourceLocale === targetLocale) {
      return texts;
    }

    const results: string[] = [];
    const toTranslate: { index: number; text: string }[] = [];

    for (let i = 0; i < texts.length; i++) {
      const text = texts[i].trim();
      
      if (!text) {
        results[i] = '';
        continue;
      }

      if (this.glossary.has(text)) {
        results[i] = this.glossary.get(text)!;
        continue;
      }

      const cached = await this.get(text, targetLocale);
      if (cached && cached.translated) {
        results[i] = cached.translated;
      } else {
        toTranslate.push({ index: i, text });
      }
    }

    if (toTranslate.length > 0) {
      const requests = toTranslate.map(item => ({
        text: item.text,
        sourceLocale,
        targetLocale
      }));

      try {
        const translations = await this.translationService.translateBatch(requests);
        
        for (let i = 0; i < toTranslate.length; i++) {
          const { index, text } = toTranslate[i];
          const translated = translations[i];
          
          results[index] = translated;

          const entry: TranslationEntry = {
            original: text,
            translated,
            locale: targetLocale,
            provider: 'openai',
            timestamp: Date.now()
          };

          await this.set(entry);
        }
      } catch (error) {
        console.error('Batch translation error:', error);
        for (const item of toTranslate) {
          results[item.index] = item.text;
        }
      }
    }

    return results;
  }

  async exportAll(locale: string): Promise<TranslationEntry[]> {
    const prefix = `tm:${locale}:`;
    const list = await this.kv.list({ prefix });
    
    const entries: TranslationEntry[] = [];
    for (const key of list.keys) {
      const entry = await this.kv.get(key.name, 'json') as TranslationEntry | null;
      if (entry) {
        entries.push(entry);
      }
    }
    
    return entries;
  }

  async importEntries(entries: TranslationEntry[]): Promise<void> {
    for (const entry of entries) {
      entry.reviewed = true;
      await this.set(entry);
    }
  }

  async clearCache(locale?: string): Promise<void> {
    const prefix = locale ? `tm:${locale}:` : 'tm:';
    const list = await this.kv.list({ prefix });
    
    for (const key of list.keys) {
      await this.kv.delete(key.name);
    }
  }
}