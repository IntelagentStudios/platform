export interface Env {
  TRANSLATION_MEMORY: KVNamespace;
  CACHE_STORE: KVNamespace;
  CONFIG_STORE: KVNamespace;
  ORIGIN_URL: string;
  DEFAULT_LOCALE: string;
  SUPPORTED_LOCALES: string;
  DEEPL_API_KEY?: string;
  OPENAI_API_KEY?: string;
  GOOGLE_TRANSLATE_API_KEY?: string;
}

export interface TranslationEntry {
  original: string;
  translated: string;
  locale: string;
  provider: 'deepl' | 'openai' | 'google' | 'manual';
  timestamp: number;
  reviewed?: boolean;
  context?: string;
}

export interface LocaleConfig {
  name: string;
  flag: string;
}

export interface Config {
  locales: Record<string, LocaleConfig>;
  defaultLocale: string;
  translationProvider: 'deepl' | 'openai' | 'google';
  glossary: Record<string, string>;
  doNotTranslate: string[];
  translateAttributes: string[];
  cache: {
    ttl: number;
    staleWhileRevalidate: number;
  };
  seo: {
    generateSitemaps: boolean;
    injectHreflang: boolean;
    localizeMetaTags: boolean;
  };
}

export interface TranslationRequest {
  text: string;
  sourceLocale: string;
  targetLocale: string;
  context?: string;
}

export interface CacheEntry {
  html: string;
  timestamp: number;
  locale: string;
  url: string;
}