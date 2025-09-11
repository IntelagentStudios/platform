import { Env, Config } from './types';
import { TranslationMemory } from './services/translation-memory';
import { HTMLTranslator } from './services/html-rewriter';
import { CacheManager, EdgeCache } from './services/cache';
import { SEOManager } from './services/seo';
import { LanguageSwitcher } from './services/language-switcher';
import { GlossaryProcessor } from './services/glossary';
import configData from '../config.json';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const config = configData as Config;
    
    if (url.pathname === '/api/admin/export' || url.pathname === '/api/admin/import') {
      return handleAdminAPI(request, env, url.pathname);
    }

    if (url.pathname.startsWith('/sitemap') && url.pathname.endsWith('.xml')) {
      return handleSitemap(request, env, config);
    }

    const { locale, cleanPath } = parseLocaleFromPath(url.pathname, config);
    
    const cachedResponse = await EdgeCache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const cacheManager = new CacheManager(env, config.cache.ttl, config.cache.staleWhileRevalidate);
    const cached = await cacheManager.get(cleanPath, locale);
    
    if (cached && !cached.stale) {
      return new Response(cached.html, {
        headers: {
          'content-type': 'text/html;charset=UTF-8',
          'x-cache-status': 'HIT',
          'x-locale': locale
        }
      });
    }

    const originUrl = `${env.ORIGIN_URL}${cleanPath}`;
    const originResponse = await fetch(originUrl, {
      headers: {
        ...request.headers,
        'host': new URL(env.ORIGIN_URL).host
      }
    });

    if (!originResponse.ok || !originResponse.headers.get('content-type')?.includes('text/html')) {
      return originResponse;
    }

    const tm = new TranslationMemory(env, config.glossary);
    const glossary = new GlossaryProcessor(config.glossary);
    const translator = new HTMLTranslator(tm, config, config.defaultLocale, locale);
    const seoManager = new SEOManager(config, url.origin);
    const langSwitcher = new LanguageSwitcher(config, locale, cleanPath);

    let rewriter = translator.createRewriter(locale, url);

    rewriter.on('body', {
      element(element) {
        const switcherHTML = langSwitcher.generateHTML();
        element.append(switcherHTML, { html: true });
      }
    });

    rewriter.on('head', {
      element(element) {
        if (config.seo.injectHreflang) {
          const hreflangTags = seoManager.generateHreflangTags(cleanPath, locale);
          element.append(hreflangTags, { html: true });
        }
        
        const canonicalTag = seoManager.generateCanonicalTag(cleanPath, locale);
        element.append(canonicalTag, { html: true });
      }
    });

    const transformedResponse = rewriter.transform(originResponse);
    const html = await transformedResponse.text();

    await cacheManager.set(cleanPath, locale, html);
    
    const response = new Response(html, {
      headers: {
        'content-type': 'text/html;charset=UTF-8',
        'x-cache-status': 'MISS',
        'x-locale': locale,
        'cache-control': `public, max-age=${config.cache.ttl}, stale-while-revalidate=${config.cache.staleWhileRevalidate}`
      }
    });

    ctx.waitUntil(EdgeCache.put(request, response.clone(), config.cache.ttl));

    return response;
  },
};

function parseLocaleFromPath(pathname: string, config: Config): { locale: string; cleanPath: string } {
  const supportedLocales = Object.keys(config.locales);
  const pathParts = pathname.split('/').filter(Boolean);
  
  if (pathParts.length > 0 && supportedLocales.includes(pathParts[0])) {
    return {
      locale: pathParts[0],
      cleanPath: '/' + pathParts.slice(1).join('/')
    };
  }

  const cookieLocale = getCookieLocale();
  if (cookieLocale && supportedLocales.includes(cookieLocale)) {
    return {
      locale: cookieLocale,
      cleanPath: pathname
    };
  }

  const acceptLanguage = parseAcceptLanguage();
  for (const lang of acceptLanguage) {
    const shortLang = lang.split('-')[0];
    if (supportedLocales.includes(shortLang)) {
      return {
        locale: shortLang,
        cleanPath: pathname
      };
    }
  }

  return {
    locale: config.defaultLocale,
    cleanPath: pathname
  };
}

function getCookieLocale(): string | null {
  return null;
}

function parseAcceptLanguage(): string[] {
  return [];
}

async function handleAdminAPI(request: Request, env: Env, pathname: string): Promise<Response> {
  const auth = request.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (pathname === '/api/admin/export') {
    const url = new URL(request.url);
    const locale = url.searchParams.get('locale') || 'en';
    const format = url.searchParams.get('format') || 'json';

    const tm = new TranslationMemory(env);
    const entries = await tm.exportAll(locale);

    if (format === 'csv') {
      const csv = convertToCSV(entries);
      return new Response(csv, {
        headers: {
          'content-type': 'text/csv',
          'content-disposition': `attachment; filename="translations-${locale}.csv"`
        }
      });
    }

    return new Response(JSON.stringify(entries, null, 2), {
      headers: {
        'content-type': 'application/json',
        'content-disposition': `attachment; filename="translations-${locale}.json"`
      }
    });
  }

  if (pathname === '/api/admin/import' && request.method === 'POST') {
    const data = await request.json() as any;
    const tm = new TranslationMemory(env);
    await tm.importEntries(data.entries);
    
    return new Response(JSON.stringify({ success: true, imported: data.entries.length }), {
      headers: { 'content-type': 'application/json' }
    });
  }

  return new Response('Not Found', { status: 404 });
}

async function handleSitemap(request: Request, env: Env, config: Config): Promise<Response> {
  const url = new URL(request.url);
  const seoManager = new SEOManager(config, url.origin);

  if (url.pathname === '/sitemap.xml' || url.pathname === '/sitemap_index.xml') {
    const sitemapIndex = seoManager.generateSitemapIndex();
    return new Response(sitemapIndex, {
      headers: {
        'content-type': 'application/xml',
        'cache-control': 'public, max-age=86400'
      }
    });
  }

  const match = url.pathname.match(/\/sitemap-([a-z]{2})\.xml/);
  if (match) {
    const locale = match[1];
    const urls = ['/'];
    const sitemap = seoManager.generateLocalizedSitemap(urls, locale);
    
    return new Response(sitemap, {
      headers: {
        'content-type': 'application/xml',
        'cache-control': 'public, max-age=86400'
      }
    });
  }

  return new Response('Not Found', { status: 404 });
}

function convertToCSV(entries: any[]): string {
  const headers = ['Original', 'Translated', 'Locale', 'Provider', 'Reviewed'];
  const rows = entries.map(e => [
    e.original,
    e.translated,
    e.locale,
    e.provider,
    e.reviewed ? 'Yes' : 'No'
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
  ].join('\n');
}