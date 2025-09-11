import { TranslationProvider } from './base';
import { OpenAITranslationProvider } from './openai';
import { DeepLTranslationProvider } from './deepl';
import { Env, TranslationRequest } from '../../types';

export class TranslationService {
  private provider: TranslationProvider;

  constructor(env: Env, providerName?: string) {
    const selectedProvider = providerName || 'openai';
    
    switch (selectedProvider) {
      case 'deepl':
        if (!env.DEEPL_API_KEY) {
          throw new Error('DeepL API key not configured');
        }
        this.provider = new DeepLTranslationProvider(env.DEEPL_API_KEY);
        break;
      case 'openai':
      default:
        if (!env.OPENAI_API_KEY) {
          throw new Error('OpenAI API key not configured');
        }
        this.provider = new OpenAITranslationProvider(env.OPENAI_API_KEY);
        break;
    }
  }

  async translate(request: TranslationRequest): Promise<string> {
    return this.provider.translate(request);
  }

  async translateBatch(requests: TranslationRequest[]): Promise<string[]> {
    return this.provider.translateBatch(requests);
  }

  getProviderName(): string {
    return this.provider.getName();
  }
}

export { TranslationProvider, OpenAITranslationProvider, DeepLTranslationProvider };