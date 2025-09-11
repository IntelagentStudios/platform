import { BaseSkill } from '../BaseSkill';
import { SkillResult } from '../types';

export class TranslateContentSkill extends BaseSkill {
  metadata = {
    id: 'translate-content_v1',
    name: 'Translate Content',
    description: 'Translate web pages or HTML content with advanced caching and translation memory',
    category: 'communication' as const,
    version: '1.0.0',
    author: 'Intelagent',
    tags: ['translation', 'multilingual', 'i18n', 'localization', 'seo'],
    cost: {
      base: 5000,
      perToken: 0.01
    },
    tier: 'Custom' as const
  };

  async execute(params: any): Promise<SkillResult> {
    const { url, html, locale, licenseKey, userId, tier, serviceUrl } = params;

    if (!locale || (!url && !html)) {
      return {
        success: false,
        error: 'Missing required parameters: locale and either url or html',
        metadata: {
          skillId: this.metadata.id,
          skillName: this.metadata.name,
          timestamp: new Date()
        }
      };
    }

    if (tier === 'Base') {
      return {
        success: false,
        error: 'Translation skills require Custom or Pro tier',
        metadata: {
          skillId: this.metadata.id,
          skillName: this.metadata.name,
          timestamp: new Date()
        }
      };
    }

    try {
      const endpoint = serviceUrl || process.env.MULTILINGUAL_SERVICE_URL || 'https://intelaglot.workers.dev';
      const response = await fetch(`${endpoint}/api/skills/translate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-License-Key': licenseKey || '',
          'X-User-Id': userId || '',
          'X-Tier': tier || 'Custom'
        },
        body: JSON.stringify({ url, html, locale })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      return {
        success: true,
        data: {
          html: result.html,
          htmlHandle: result.html_handle,
          locale: result.meta.locale,
          provider: result.meta.provider,
          cacheHit: result.meta.cache_hit,
          latencyMs: result.meta.latency_ms
        },
        metadata: {
          skillId: this.metadata.id,
          skillName: this.metadata.name,
          timestamp: new Date(),
          executionTime: result.meta.latency_ms
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        metadata: {
          skillId: this.metadata.id,
          skillName: this.metadata.name,
          timestamp: new Date()
        }
      };
    }
  }

  validate(params: any): boolean {
    const { locale } = params;
    if (!locale) return false;
    if (!params.url && !params.html) return false;
    return true;
  }

  getConfig() {
    return {
      supportedLocales: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh', 'ko', 'ru', 'ar'],
      providers: ['openai', 'deepl', 'google'],
      cacheOptions: {
        ttl: 3600,
        staleWhileRevalidate: 86400
      }
    };
  }
}