import { Env, CacheEntry } from '../types';

export class CacheManager {
  private kv: KVNamespace;
  private ttl: number;
  private staleWhileRevalidate: number;

  constructor(env: Env, ttl: number = 3600, staleWhileRevalidate: number = 86400) {
    this.kv = env.CACHE_STORE;
    this.ttl = ttl;
    this.staleWhileRevalidate = staleWhileRevalidate;
  }

  private generateKey(url: string, locale: string): string {
    return `cache:${locale}:${url}`;
  }

  async get(url: string, locale: string): Promise<{ html: string; stale: boolean } | null> {
    const key = this.generateKey(url, locale);
    const cached = await this.kv.get(key, 'json') as CacheEntry | null;
    
    if (!cached) {
      return null;
    }

    const age = Date.now() - cached.timestamp;
    const stale = age > this.ttl * 1000;
    const expired = age > this.staleWhileRevalidate * 1000;

    if (expired) {
      await this.delete(url, locale);
      return null;
    }

    return {
      html: cached.html,
      stale
    };
  }

  async set(url: string, locale: string, html: string): Promise<void> {
    const key = this.generateKey(url, locale);
    
    const entry: CacheEntry = {
      html,
      timestamp: Date.now(),
      locale,
      url
    };

    await this.kv.put(key, JSON.stringify(entry), {
      expirationTtl: this.staleWhileRevalidate
    });
  }

  async delete(url: string, locale: string): Promise<void> {
    const key = this.generateKey(url, locale);
    await this.kv.delete(key);
  }

  async purge(pattern?: string): Promise<void> {
    const prefix = pattern ? `cache:${pattern}` : 'cache:';
    const list = await this.kv.list({ prefix });
    
    const deletePromises = list.keys.map(key => this.kv.delete(key.name));
    await Promise.all(deletePromises);
  }

  async prewarm(urls: string[], locales: string[], fetchFn: (url: string, locale: string) => Promise<string>): Promise<void> {
    const tasks: Promise<void>[] = [];

    for (const url of urls) {
      for (const locale of locales) {
        tasks.push(
          fetchFn(url, locale)
            .then(html => this.set(url, locale, html))
            .catch(err => console.error(`Failed to prewarm ${url} for ${locale}:`, err))
        );
      }
    }

    await Promise.all(tasks);
  }

  async getStats(): Promise<{
    totalEntries: number;
    sizeEstimate: number;
    localeBreakdown: Record<string, number>;
  }> {
    const list = await this.kv.list({ prefix: 'cache:' });
    const localeBreakdown: Record<string, number> = {};
    let sizeEstimate = 0;

    for (const key of list.keys) {
      const parts = key.name.split(':');
      const locale = parts[1];
      
      localeBreakdown[locale] = (localeBreakdown[locale] || 0) + 1;
      
      const metadata = key.metadata as any;
      if (metadata?.size) {
        sizeEstimate += metadata.size;
      }
    }

    return {
      totalEntries: list.keys.length,
      sizeEstimate,
      localeBreakdown
    };
  }
}

export class EdgeCache {
  static async match(request: Request): Promise<Response | null> {
    const cache = caches.default;
    const cached = await cache.match(request);
    
    if (cached) {
      const age = Date.now() - Date.parse(cached.headers.get('date') || '0');
      const maxAge = parseInt(cached.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1] || '0') * 1000;
      
      if (age < maxAge) {
        return cached;
      }
    }
    
    return null;
  }

  static async put(request: Request, response: Response, ttl: number = 3600): Promise<void> {
    const cache = caches.default;
    
    const headers = new Headers(response.headers);
    headers.set('cache-control', `public, max-age=${ttl}`);
    headers.set('x-cache-status', 'HIT');
    
    const cachedResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
    
    await cache.put(request, cachedResponse);
  }

  static async purge(pattern?: string): Promise<void> {
    const cache = caches.default;
    
    if (pattern) {
      await cache.delete(pattern, { ignoreMethod: true });
    }
  }
}