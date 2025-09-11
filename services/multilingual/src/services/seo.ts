import { Config } from '../types';

export class SEOManager {
  private config: Config;
  private baseUrl: string;

  constructor(config: Config, baseUrl: string) {
    this.config = config;
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  generateHreflangTags(currentPath: string, currentLocale: string): string {
    const tags: string[] = [];
    const supportedLocales = Object.keys(this.config.locales);

    for (const locale of supportedLocales) {
      const url = this.getLocalizedUrl(currentPath, locale);
      tags.push(`<link rel="alternate" hreflang="${locale}" href="${url}">`);
    }

    const defaultUrl = this.getLocalizedUrl(currentPath, this.config.defaultLocale);
    tags.push(`<link rel="alternate" hreflang="x-default" href="${defaultUrl}">`);

    return tags.join('\n');
  }

  generateCanonicalTag(currentPath: string, currentLocale: string): string {
    const url = this.getLocalizedUrl(currentPath, currentLocale);
    return `<link rel="canonical" href="${url}">`;
  }

  getLocalizedUrl(path: string, locale: string): string {
    path = path.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, '');
    
    if (locale === this.config.defaultLocale) {
      return `${this.baseUrl}${path}`;
    }
    
    return `${this.baseUrl}/${locale}${path}`;
  }

  generateStructuredData(locale: string, pageData?: any): string {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      inLanguage: locale,
      url: `${this.baseUrl}/${locale}`,
      isPartOf: {
        '@type': 'WebSite',
        url: this.baseUrl,
        name: pageData?.siteName || 'Website',
        alternateName: pageData?.siteAltName,
        availableLanguage: Object.keys(this.config.locales).map(loc => ({
          '@type': 'Language',
          name: this.config.locales[loc].name,
          alternateName: loc
        }))
      }
    };

    if (pageData?.title) {
      structuredData['name'] = pageData.title;
    }

    if (pageData?.description) {
      structuredData['description'] = pageData.description;
    }

    return `<script type="application/ld+json">${JSON.stringify(structuredData, null, 2)}</script>`;
  }

  generateSitemapIndex(): string {
    const supportedLocales = Object.keys(this.config.locales);
    
    const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${supportedLocales.map(locale => `  <sitemap>
    <loc>${this.baseUrl}/sitemap-${locale}.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;

    return sitemapIndex;
  }

  generateLocalizedSitemap(urls: string[], locale: string): string {
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map(url => this.generateSitemapUrl(url, locale)).join('\n')}
</urlset>`;

    return sitemap;
  }

  private generateSitemapUrl(path: string, currentLocale: string): string {
    const supportedLocales = Object.keys(this.config.locales);
    const url = this.getLocalizedUrl(path, currentLocale);
    
    const alternates = supportedLocales
      .filter(loc => loc !== currentLocale)
      .map(loc => `    <xhtml:link rel="alternate" hreflang="${loc}" href="${this.getLocalizedUrl(path, loc)}"/>`)
      .join('\n');

    return `  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
${alternates}
  </url>`;
  }

  injectMetaTags(html: string, locale: string, pageData?: any): string {
    const metaTags: string[] = [];

    metaTags.push(`<meta property="og:locale" content="${locale}">`);
    
    const alternateLocales = Object.keys(this.config.locales)
      .filter(loc => loc !== locale)
      .map(loc => `<meta property="og:locale:alternate" content="${loc}">`);
    
    metaTags.push(...alternateLocales);

    if (pageData?.title) {
      metaTags.push(`<meta property="og:title" content="${pageData.title}">`);
      metaTags.push(`<meta name="twitter:title" content="${pageData.title}">`);
    }

    if (pageData?.description) {
      metaTags.push(`<meta property="og:description" content="${pageData.description}">`);
      metaTags.push(`<meta name="twitter:description" content="${pageData.description}">`);
    }

    const headEndIndex = html.indexOf('</head>');
    if (headEndIndex !== -1) {
      const injection = metaTags.join('\n') + '\n';
      return html.slice(0, headEndIndex) + injection + html.slice(headEndIndex);
    }

    return html;
  }
}