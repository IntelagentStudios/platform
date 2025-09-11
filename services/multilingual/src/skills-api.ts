import { Env, Config } from './types';
import { TranslationMemory } from './services/translation-memory';
import { HTMLTranslator } from './services/html-rewriter';
import { CacheManager } from './services/cache';
import { SEOManager } from './services/seo';
import { GlossaryProcessor } from './services/glossary';
import configData from '../config.json';

export interface SkillExecutionLog {
  run_id: string;
  user_id: string;
  license_key: string;
  skill_name: string;
  inputs_hash: string;
  outputs_handle: string;
  latency_ms: number;
  provider_used?: string;
  cache_hit?: 'edge' | 'kv' | 'miss';
}

export interface SkillAuthContext {
  licenseKey: string;
  userId: string;
  tier: 'Base' | 'Custom' | 'Pro';
}

async function validateAuth(request: Request): Promise<SkillAuthContext | null> {
  const licenseKey = request.headers.get('X-License-Key');
  const userId = request.headers.get('X-User-Id');
  const tier = request.headers.get('X-Tier') as 'Base' | 'Custom' | 'Pro' | null;

  if (!licenseKey || !userId || !tier) {
    return null;
  }

  if (!['Base', 'Custom', 'Pro'].includes(tier)) {
    return null;
  }

  return {
    licenseKey,
    userId,
    tier
  };
}

async function logExecution(
  env: Env,
  log: SkillExecutionLog
): Promise<void> {
  try {
    const logKey = `execution:${log.run_id}`;
    await env.CONFIG_STORE.put(logKey, JSON.stringify(log), {
      expirationTtl: 86400 * 30
    });
  } catch (error) {
    console.error('Failed to log execution:', error);
  }
}

function hashInputs(inputs: any): string {
  const str = JSON.stringify(inputs);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export async function handleTranslateContent(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  const startTime = Date.now();
  const config = configData as Config;
  
  const auth = await validateAuth(request);
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' }
    });
  }

  if (auth.tier === 'Base') {
    return new Response(JSON.stringify({ error: 'Translation skills require Custom or Pro tier' }), {
      status: 403,
      headers: { 'content-type': 'application/json' }
    });
  }

  const body = await request.json() as any;
  const { url, html, locale } = body;

  if (!locale || (!url && !html)) {
    return new Response(JSON.stringify({ error: 'Invalid parameters' }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    });
  }

  try {
    let contentToTranslate = html;
    let cacheHit: 'edge' | 'kv' | 'miss' = 'miss';
    
    if (url && !html) {
      const cacheManager = new CacheManager(env, config.cache.ttl, config.cache.staleWhileRevalidate);
      const cached = await cacheManager.get(url, locale);
      
      if (cached && !cached.stale) {
        contentToTranslate = cached.html;
        cacheHit = 'kv';
      } else {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch URL: ${response.status}`);
        }
        contentToTranslate = await response.text();
      }
    }

    const tm = new TranslationMemory(env, config.glossary);
    const translator = new HTMLTranslator(tm, config, config.defaultLocale, locale);
    
    const dummyResponse = new Response(contentToTranslate, {
      headers: { 'content-type': 'text/html' }
    });
    
    const rewriter = translator.createRewriter(locale, new URL(url || 'https://example.com'));
    const transformedResponse = rewriter.transform(dummyResponse);
    const translatedHtml = await transformedResponse.text();

    const outputHandle = `translated:${hashInputs({ url, html: html?.substring(0, 100), locale })}:${Date.now()}`;
    
    if (url) {
      const cacheManager = new CacheManager(env, config.cache.ttl, config.cache.staleWhileRevalidate);
      await cacheManager.set(url, locale, translatedHtml);
    }

    const executionLog: SkillExecutionLog = {
      run_id: crypto.randomUUID(),
      user_id: auth.userId,
      license_key: auth.licenseKey,
      skill_name: 'translate-content_v1',
      inputs_hash: hashInputs({ url, html: html?.substring(0, 100), locale }),
      outputs_handle: outputHandle,
      latency_ms: Date.now() - startTime,
      provider_used: config.translationProvider,
      cache_hit: cacheHit
    };

    ctx.waitUntil(logExecution(env, executionLog));

    return new Response(JSON.stringify({
      html_handle: outputHandle,
      html: translatedHtml,
      meta: {
        locale,
        provider: config.translationProvider,
        cache_hit: cacheHit,
        latency_ms: executionLog.latency_ms
      }
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
}

export async function handleGenerateSitemap(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  const startTime = Date.now();
  const config = configData as Config;
  
  const auth = await validateAuth(request);
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' }
    });
  }

  if (auth.tier !== 'Pro') {
    return new Response(JSON.stringify({ error: 'Sitemap generation requires Pro tier' }), {
      status: 403,
      headers: { 'content-type': 'application/json' }
    });
  }

  const body = await request.json() as any;
  const { locales, baseUrl = env.ORIGIN_URL, urls = ['/'] } = body;

  if (!locales || !Array.isArray(locales) || locales.length === 0) {
    return new Response(JSON.stringify({ error: 'Invalid locales parameter' }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    });
  }

  try {
    const seoManager = new SEOManager(config, baseUrl);
    
    const sitemaps: Record<string, string> = {};
    for (const locale of locales) {
      if (config.locales[locale]) {
        sitemaps[locale] = seoManager.generateLocalizedSitemap(urls, locale);
      }
    }

    const sitemapIndex = seoManager.generateSitemapIndex();
    const outputHandle = `sitemap:${hashInputs({ locales, urls })}:${Date.now()}`;

    const executionLog: SkillExecutionLog = {
      run_id: crypto.randomUUID(),
      user_id: auth.userId,
      license_key: auth.licenseKey,
      skill_name: 'generate-sitemap_v1',
      inputs_hash: hashInputs({ locales, urls }),
      outputs_handle: outputHandle,
      latency_ms: Date.now() - startTime,
      cache_hit: 'miss'
    };

    ctx.waitUntil(logExecution(env, executionLog));

    return new Response(JSON.stringify({
      sitemap_handle: outputHandle,
      sitemap_index: sitemapIndex,
      localized_sitemaps: sitemaps,
      meta: {
        locales_processed: locales.length,
        urls_count: urls.length,
        latency_ms: executionLog.latency_ms
      }
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
}

export async function handleInjectHreflang(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  const startTime = Date.now();
  const config = configData as Config;
  
  const auth = await validateAuth(request);
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' }
    });
  }

  if (auth.tier === 'Base') {
    return new Response(JSON.stringify({ error: 'Hreflang injection requires Custom or Pro tier' }), {
      status: 403,
      headers: { 'content-type': 'application/json' }
    });
  }

  const body = await request.json() as any;
  const { url, locales, currentLocale = config.defaultLocale } = body;

  if (!url || !locales || !Array.isArray(locales)) {
    return new Response(JSON.stringify({ error: 'Invalid parameters' }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    });
  }

  try {
    const urlObj = new URL(url);
    const seoManager = new SEOManager(config, urlObj.origin);
    
    const hreflangTags = seoManager.generateHreflangTags(urlObj.pathname, currentLocale);
    const canonicalTag = seoManager.generateCanonicalTag(urlObj.pathname, currentLocale);
    
    const headFragment = `${hreflangTags}\n${canonicalTag}`;
    const outputHandle = `hreflang:${hashInputs({ url, locales, currentLocale })}:${Date.now()}`;

    const executionLog: SkillExecutionLog = {
      run_id: crypto.randomUUID(),
      user_id: auth.userId,
      license_key: auth.licenseKey,
      skill_name: 'inject-hreflang_v1',
      inputs_hash: hashInputs({ url, locales, currentLocale }),
      outputs_handle: outputHandle,
      latency_ms: Date.now() - startTime,
      cache_hit: 'miss'
    };

    ctx.waitUntil(logExecution(env, executionLog));

    return new Response(JSON.stringify({
      head_fragment: headFragment,
      meta: {
        url,
        current_locale: currentLocale,
        locales_count: locales.length,
        latency_ms: executionLog.latency_ms
      }
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
}