# Intelaglot - Production-Grade Multilingual Website Proxy

A self-hosted alternative to Weglot that acts as a reverse proxy to serve localized versions of websites at static URLs. Built for Cloudflare Workers with enterprise-grade features.

## Features

### Core Functionality
- **Reverse Proxy**: Sits in front of your website (Squarespace, WordPress, etc.) and serves localized versions
- **Multiple Translation Providers**: DeepL, OpenAI GPT-4, Google Translate
- **Translation Memory**: KV-based caching with automatic reuse of previous translations
- **Glossary Support**: Maintain brand terms and fixed phrases that shouldn't be translated
- **Smart Exclusions**: Skip code blocks, scripts, and designated elements

### SEO & Performance
- **Full SEO Support**: Automatic hreflang tags, localized sitemaps, structured data
- **Edge Caching**: Cloudflare Cache API integration with stale-while-revalidate
- **Streaming HTML Parser**: Efficient processing without loading entire DOM
- **Prewarm Support**: Crawl and pre-translate pages for instant loading

### User Experience
- **Language Switcher**: Elegant UI component with cookie-based preference memory
- **Clean URLs**: Serve at `/fr`, `/es`, `/de` etc.
- **Automatic Locale Detection**: Based on Accept-Language headers

### Admin Tools
- **Export/Import**: CSV and JSON formats for human review workflow
- **Batch Operations**: Crawl sitemaps and prewarm cache
- **Translation Analytics**: Track provider usage and review status

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment

Edit `wrangler.toml`:
```toml
[vars]
ORIGIN_URL = "https://your-site.squarespace.com"
DEFAULT_LOCALE = "en"
SUPPORTED_LOCALES = "en,fr,es,de"

[secrets]
OPENAI_API_KEY = "your-key"
DEEPL_API_KEY = "your-key"
```

### 3. Create KV Namespaces
```bash
wrangler kv:namespace create TRANSLATION_MEMORY
wrangler kv:namespace create CACHE_STORE
wrangler kv:namespace create CONFIG_STORE
```

Update the IDs in `wrangler.toml` with the created namespace IDs.

### 4. Configure Translation Settings

Edit `config.json`:
```json
{
  "locales": {
    "en": { "name": "English", "flag": "🇬🇧" },
    "fr": { "name": "Français", "flag": "🇫🇷" }
  },
  "translationProvider": "openai",
  "glossary": {
    "YourBrand": "YourBrand"
  }
}
```

### 5. Deploy
```bash
npm run deploy
```

## Usage

### Access Localized Versions
- English (default): `https://your-domain.com/`
- French: `https://your-domain.com/fr/`
- Spanish: `https://your-domain.com/es/`
- German: `https://your-domain.com/de/`

### Export Translations for Review
```bash
npm run export-tm fr json translations-fr.json <kv-namespace-id> <account-id> <api-token>
```

### Import Reviewed Translations
```bash
npm run import-tm json reviewed-fr.json <kv-namespace-id> <account-id> <api-token> --overwrite
```

### Prewarm Cache
```bash
npm run crawl https://origin.com https://your-domain.com fr,es,de 100 <account-id> <api-token> --confirm
```

## Configuration

### Glossary Terms
Add brand names and technical terms that shouldn't be translated:
```json
{
  "glossary": {
    "Acme Corp": "Acme Corp",
    "API": "API"
  }
}
```

### Exclusion Rules
Skip translation for specific elements:
```json
{
  "doNotTranslate": [
    "code",
    ".notranslate",
    "#footer-credits",
    "[data-no-translate]"
  ]
}
```

### Cache Settings
```json
{
  "cache": {
    "ttl": 3600,
    "staleWhileRevalidate": 86400
  }
}
```

## API Endpoints

### Admin Export
```
GET /api/admin/export?locale=fr&format=json
Authorization: Bearer <token>
```

### Admin Import
```
POST /api/admin/import
Authorization: Bearer <token>
Content-Type: application/json

{
  "entries": [...]
}
```

### Sitemaps
- `/sitemap.xml` - Sitemap index
- `/sitemap-fr.xml` - French sitemap
- `/sitemap-es.xml` - Spanish sitemap

## Architecture

### Components
1. **Translation Service**: Wrapper for multiple MT providers
2. **Translation Memory**: KV-based storage with hash-based keys
3. **HTML Rewriter**: Streaming parser using Cloudflare HTMLRewriter API
4. **Cache Manager**: Two-tier caching (KV + Edge Cache)
5. **SEO Manager**: Hreflang, sitemaps, structured data injection
6. **Language Switcher**: Client-side UI with cookie persistence

### Data Flow
1. Request arrives at Worker
2. Parse locale from URL path
3. Check Edge Cache → KV Cache → Origin
4. Stream HTML through rewriter
5. Translate text nodes and attributes
6. Inject SEO tags and language switcher
7. Cache response and serve

## Performance

- **First Load**: ~500-1000ms (with translation)
- **Cached**: ~50-100ms (edge cache)
- **Translation Memory Hit**: ~100-200ms
- **Supports**: 1000s of pages, millions of requests

## Development

### Local Development
```bash
npm run dev
```

### Run Tests
```bash
npm test
```

### Type Checking
```bash
npm run build
```

## Deployment

### Cloudflare Workers
```bash
wrangler deploy
```

### Environment Variables
Set via `wrangler secret`:
```bash
wrangler secret put OPENAI_API_KEY
wrangler secret put DEEPL_API_KEY
```

## License

MIT

## Support

For issues and feature requests, please open a GitHub issue.