#!/usr/bin/env tsx

import { Config } from '../src/types';

interface CrawlOptions {
  originUrl: string;
  locales: string[];
  maxPages: number;
  kvNamespace: string;
  accountId: string;
  apiToken: string;
  workerUrl: string;
}

class SitemapCrawler {
  private visited = new Set<string>();
  private queue: string[] = [];
  private options: CrawlOptions;

  constructor(options: CrawlOptions) {
    this.options = options;
  }

  async crawl(): Promise<string[]> {
    console.log(`Starting crawl of ${this.options.originUrl}...`);
    
    try {
      await this.crawlSitemap();
    } catch (error) {
      console.log('No sitemap found, falling back to HTML crawling...');
      await this.crawlHTML(this.options.originUrl);
    }

    const urls = Array.from(this.visited);
    console.log(`Found ${urls.length} unique URLs`);
    
    return urls.slice(0, this.options.maxPages);
  }

  private async crawlSitemap(): Promise<void> {
    const sitemapUrls = [
      `${this.options.originUrl}/sitemap.xml`,
      `${this.options.originUrl}/sitemap_index.xml`,
      `${this.options.originUrl}/sitemap`
    ];

    for (const sitemapUrl of sitemapUrls) {
      try {
        const response = await fetch(sitemapUrl);
        if (response.ok) {
          const text = await response.text();
          const urls = this.extractUrlsFromSitemap(text);
          urls.forEach(url => this.visited.add(url));
          
          if (this.visited.size > 0) {
            console.log(`Found ${this.visited.size} URLs in sitemap`);
            return;
          }
        }
      } catch (error) {
        continue;
      }
    }

    throw new Error('No sitemap found');
  }

  private extractUrlsFromSitemap(xml: string): string[] {
    const urlRegex = /<loc>(.*?)<\/loc>/g;
    const urls: string[] = [];
    let match;

    while ((match = urlRegex.exec(xml)) !== null) {
      const url = match[1];
      if (url.startsWith(this.options.originUrl)) {
        urls.push(url.replace(this.options.originUrl, ''));
      }
    }

    return urls;
  }

  private async crawlHTML(startUrl: string): Promise<void> {
    this.queue.push(startUrl);

    while (this.queue.length > 0 && this.visited.size < this.options.maxPages) {
      const url = this.queue.shift()!;
      
      if (this.visited.has(url)) {
        continue;
      }

      this.visited.add(url);
      console.log(`Crawling: ${url} (${this.visited.size}/${this.options.maxPages})`);

      try {
        const response = await fetch(this.options.originUrl + url);
        if (response.ok) {
          const html = await response.text();
          const links = this.extractLinksFromHTML(html);
          
          for (const link of links) {
            if (!this.visited.has(link) && this.queue.length + this.visited.size < this.options.maxPages) {
              this.queue.push(link);
            }
          }
        }
      } catch (error) {
        console.error(`Failed to crawl ${url}:`, error);
      }
    }
  }

  private extractLinksFromHTML(html: string): string[] {
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/g;
    const links: string[] = [];
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      
      if (href.startsWith('/') && !href.startsWith('//')) {
        const cleanPath = href.split('#')[0].split('?')[0];
        if (cleanPath && !cleanPath.match(/\.(jpg|jpeg|png|gif|pdf|zip|doc|docx)$/i)) {
          links.push(cleanPath);
        }
      }
    }

    return [...new Set(links)];
  }
}

async function prewarmCache(urls: string[], options: CrawlOptions): Promise<void> {
  console.log(`\nPrewarming cache for ${urls.length} URLs across ${options.locales.length} locales...`);
  
  const totalRequests = urls.length * options.locales.length;
  let completed = 0;
  let failed = 0;

  const batchSize = 10;
  
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const promises: Promise<void>[] = [];

    for (const url of batch) {
      for (const locale of options.locales) {
        promises.push(
          fetch(`${options.workerUrl}/${locale}${url}`)
            .then(response => {
              if (response.ok) {
                completed++;
              } else {
                failed++;
              }
              
              if ((completed + failed) % 10 === 0) {
                const progress = ((completed + failed) / totalRequests * 100).toFixed(1);
                console.log(`  Progress: ${progress}% (${completed} success, ${failed} failed)`);
              }
            })
            .catch(err => {
              failed++;
              console.error(`Failed to prewarm ${locale}${url}:`, err.message);
            })
        );
      }
    }

    await Promise.all(promises);
  }

  console.log(`\nPrewarm complete:`);
  console.log(`  Success: ${completed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total: ${totalRequests}`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 6) {
    console.error('Usage: npm run crawl <origin-url> <worker-url> <locales> <max-pages> <account-id> <api-token> [kv-namespace]');
    console.error('Example: npm run crawl https://example.com https://translate.example.com fr,es,de 100 abc123 your-token namespace-id');
    process.exit(1);
  }

  const options: CrawlOptions = {
    originUrl: args[0].replace(/\/$/, ''),
    workerUrl: args[1].replace(/\/$/, ''),
    locales: args[2].split(','),
    maxPages: parseInt(args[3]),
    accountId: args[4],
    apiToken: args[5],
    kvNamespace: args[6] || ''
  };

  try {
    const crawler = new SitemapCrawler(options);
    const urls = await crawler.crawl();
    
    console.log(`\nTop ${Math.min(10, urls.length)} URLs found:`);
    urls.slice(0, 10).forEach(url => console.log(`  ${url}`));

    const confirm = process.argv.includes('--confirm');
    if (!confirm) {
      console.log('\nAdd --confirm to start prewarming cache');
      process.exit(0);
    }

    await prewarmCache(urls, options);

  } catch (error) {
    console.error('Crawl failed:', error);
    process.exit(1);
  }
}

main();