import { Config } from '../types';
import { TranslationMemory } from './translation-memory';

export class HTMLTranslator {
  private tm: TranslationMemory;
  private config: Config;
  private sourceLocale: string;
  private targetLocale: string;
  private textNodesToTranslate: Map<string, Element | any> = new Map();
  private attributesToTranslate: Map<string, { element: Element; attr: string }> = new Map();

  constructor(
    tm: TranslationMemory,
    config: Config,
    sourceLocale: string,
    targetLocale: string
  ) {
    this.tm = tm;
    this.config = config;
    this.sourceLocale = sourceLocale;
    this.targetLocale = targetLocale;
  }

  shouldTranslateElement(element: Element): boolean {
    const tagName = element.tagName?.toLowerCase();
    
    if (!tagName) return false;
    
    const skipTags = ['script', 'style', 'code', 'pre', 'noscript'];
    if (skipTags.includes(tagName)) {
      return false;
    }

    for (const selector of this.config.doNotTranslate) {
      if (selector.startsWith('.')) {
        const className = selector.substring(1);
        if (element.hasAttribute('class')) {
          const classes = element.getAttribute('class')?.split(' ') || [];
          if (classes.includes(className)) return false;
        }
      } else if (selector.startsWith('#')) {
        const id = selector.substring(1);
        if (element.getAttribute('id') === id) return false;
      } else if (selector.startsWith('[')) {
        const attr = selector.slice(1, -1);
        if (element.hasAttribute(attr)) return false;
      }
    }

    if (element.hasAttribute('data-no-translate')) {
      return false;
    }

    if (element.hasAttribute('class')) {
      const classes = element.getAttribute('class')?.split(' ') || [];
      if (classes.includes('notranslate')) {
        return false;
      }
    }

    return true;
  }

  createRewriter(locale: string, currentUrl: URL): HTMLRewriter {
    const rewriter = new HTMLRewriter();
    const baseUrl = `${currentUrl.protocol}//${currentUrl.host}`;

    rewriter.on('html', {
      element: (element) => {
        element.setAttribute('lang', locale);
      }
    });

    rewriter.on('head', {
      element: (element) => {
        if (this.config.seo.injectHreflang) {
          const supportedLocales = Object.keys(this.config.locales);
          
          for (const loc of supportedLocales) {
            const hrefLangUrl = loc === this.config.defaultLocale
              ? baseUrl + currentUrl.pathname
              : `${baseUrl}/${loc}${currentUrl.pathname}`;
            
            element.append(
              `<link rel="alternate" hreflang="${loc}" href="${hrefLangUrl}">`,
              { html: true }
            );
          }
          
          element.append(
            `<link rel="alternate" hreflang="x-default" href="${baseUrl}${currentUrl.pathname}">`,
            { html: true }
          );
        }
      }
    });

    rewriter.on('title', {
      text: async (text) => {
        if (text.text && this.sourceLocale !== this.targetLocale) {
          const translated = await this.tm.translate(
            text.text,
            this.sourceLocale,
            this.targetLocale,
            'page-title'
          );
          text.replace(translated);
        }
      }
    });

    rewriter.on('meta[name="description"]', {
      element: async (element) => {
        const content = element.getAttribute('content');
        if (content && this.sourceLocale !== this.targetLocale) {
          const translated = await this.tm.translate(
            content,
            this.sourceLocale,
            this.targetLocale,
            'meta-description'
          );
          element.setAttribute('content', translated);
        }
      }
    });

    rewriter.on('*', {
      element: async (element) => {
        if (!this.shouldTranslateElement(element)) {
          return;
        }

        for (const attr of this.config.translateAttributes) {
          const value = element.getAttribute(attr);
          if (value && value.trim()) {
            const key = `${element.tagName}-${attr}-${value}`;
            this.attributesToTranslate.set(key, { element, attr });
          }
        }
      },
      text: async (text) => {
        const trimmed = text.text.trim();
        if (!trimmed || this.sourceLocale === this.targetLocale) {
          return;
        }

        const parent = text.lastInTextNode ? null : text;
        if (parent && this.shouldTranslateElement(parent as any)) {
          const key = `text-${trimmed}`;
          this.textNodesToTranslate.set(key, text as any);
        }
      }
    });

    rewriter.on('a', {
      element: (element) => {
        const href = element.getAttribute('href');
        if (href && href.startsWith('/') && !href.startsWith('//')) {
          if (this.targetLocale !== this.config.defaultLocale) {
            element.setAttribute('href', `/${this.targetLocale}${href}`);
          }
        }
      }
    });

    rewriter.on('form', {
      element: (element) => {
        const action = element.getAttribute('action');
        if (action && action.startsWith('/') && !action.startsWith('//')) {
          if (this.targetLocale !== this.config.defaultLocale) {
            element.setAttribute('action', `/${this.targetLocale}${action}`);
          }
        }
      }
    });

    return rewriter;
  }

  async processCollectedTranslations(): Promise<void> {
    const textValues = Array.from(this.textNodesToTranslate.keys()).map(k => k.replace('text-', ''));
    const attrValues = Array.from(this.attributesToTranslate.keys()).map(k => {
      const parts = k.split('-');
      return parts.slice(2).join('-');
    });

    const allTexts = [...textValues, ...attrValues];
    
    if (allTexts.length === 0) return;

    const translations = await this.tm.translateBatch(
      allTexts,
      this.sourceLocale,
      this.targetLocale
    );

    let textIndex = 0;
    for (const [key, node] of this.textNodesToTranslate) {
      // Check if node has a replace method (text nodes in Cloudflare Workers)
      if (node && typeof (node as any).replace === 'function') {
        (node as any).replace(translations[textIndex]);
      }
      textIndex++;
    }

    for (const [key, { element, attr }] of this.attributesToTranslate) {
      element.setAttribute(attr, translations[textIndex]);
      textIndex++;
    }
  }
}