import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillCategory } from '../../types';

export class GenerateSitemapSkill extends BaseSkill {
  metadata = {
    id: 'generate-sitemap_v1',
    name: 'Generate Multilingual Sitemap',
    description: 'Generate localized sitemaps for SEO optimization across multiple languages',
    category: SkillCategory.MARKETING,
    version: '1.0.0',
    author: 'Intelagent',
    tags: ['sitemap', 'seo', 'multilingual', 'localization', 'indexing'],
    cost: {
      base: 3000,
      perToken: 0
    },
    tier: 'Pro' as const
  };

  protected async executeImpl(params: SkillParams): Promise<SkillResult> {
    const { locales, baseUrl, urls, licenseKey, userId, tier, serviceUrl } = params;

    if (!locales || !Array.isArray(locales) || locales.length === 0) {
      return {
        success: false,
        error: 'Missing required parameter: locales (array)',
        metadata: {
          skillId: this.metadata.id,
          skillName: this.metadata.name,
          timestamp: new Date()
        }
      };
    }

    if (tier !== 'Pro') {
      return {
        success: false,
        error: 'Sitemap generation requires Pro tier',
        metadata: {
          skillId: this.metadata.id,
          skillName: this.metadata.name,
          timestamp: new Date()
        }
      };
    }

    try {
      const endpoint = serviceUrl || process.env.MULTILINGUAL_SERVICE_URL || 'https://intelaglot.workers.dev';
      const response = await fetch(`${endpoint}/api/skills/generate-sitemap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-License-Key': licenseKey || '',
          'X-User-Id': userId || '',
          'X-Tier': tier || 'Pro'
        },
        body: JSON.stringify({ 
          locales, 
          baseUrl: baseUrl || process.env.SITE_BASE_URL,
          urls: urls || ['/']
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
          sitemapIndex: result.sitemap_index,
          localizedSitemaps: result.localized_sitemaps,
          sitemapHandle: result.sitemap_handle,
          localesProcessed: result.meta.locales_processed,
          urlsCount: result.meta.urls_count,
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
    const { locales } = params;
    if (!locales || !Array.isArray(locales) || locales.length === 0) {
      return false;
    }
    return true;
  }

  getConfig() {
    return {
      supportedLocales: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh', 'ko', 'ru', 'ar'],
      maxUrlsPerSitemap: 50000,
      sitemapFormats: ['xml', 'txt'],
      compressionSupported: true
    };
  }
}