import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams } from '../types';

export class InjectHreflangSkill extends BaseSkill {
  metadata = {
    id: 'inject-hreflang_v1',
    name: 'Inject Hreflang Tags',
    description: 'Generate and inject hreflang tags for multilingual SEO optimization',
    category: 'seo' as const,
    version: '1.0.0',
    author: 'Intelagent',
    tags: ['hreflang', 'seo', 'multilingual', 'localization', 'international'],
    cost: {
      base: 2000,
      perToken: 0
    },
    tier: 'Custom' as const
  };

  protected async executeImpl(params: SkillParams): Promise<SkillResult> {
    const { url, locales, currentLocale, licenseKey, userId, tier, serviceUrl } = params;

    if (!url || !locales || !Array.isArray(locales)) {
      return {
        success: false,
        error: 'Missing required parameters: url and locales (array)',
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
        error: 'Hreflang injection requires Custom or Pro tier',
        metadata: {
          skillId: this.metadata.id,
          skillName: this.metadata.name,
          timestamp: new Date()
        }
      };
    }

    try {
      const endpoint = serviceUrl || process.env.MULTILINGUAL_SERVICE_URL || 'https://intelaglot.workers.dev';
      const response = await fetch(`${endpoint}/api/skills/inject-hreflang`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-License-Key': licenseKey || '',
          'X-User-Id': userId || '',
          'X-Tier': tier || 'Custom'
        },
        body: JSON.stringify({ 
          url, 
          locales,
          currentLocale: currentLocale || 'en'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      return {
        success: true,
        data: {
          headFragment: result.head_fragment,
          url: result.meta.url,
          currentLocale: result.meta.current_locale,
          localesCount: result.meta.locales_count,
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
    const { url, locales } = params;
    if (!url || !locales || !Array.isArray(locales)) {
      return false;
    }
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  getConfig() {
    return {
      supportedLocales: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh', 'ko', 'ru', 'ar'],
      hreflangFormats: ['standard', 'x-default'],
      canonicalSupport: true,
      autoDetectLanguage: true
    };
  }
}