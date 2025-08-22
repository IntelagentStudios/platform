import { WebScraper } from './webScraper.js';
import { indexWebsite, getIndexingStatus } from '@intelagent/vector-store';
import { prisma } from '@intelagent/database';
import { RedisQueue } from '@intelagent/redis';
import winston from 'winston';
import * as cheerio from 'cheerio';
import { URL } from 'url';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class WebsiteIndexer {
  constructor() {
    this.scraper = new WebScraper({
      respectRobots: true,
      maxPages: 50,
      timeout: 30000
    });
    this.queue = new RedisQueue('indexing-jobs');
    this.processingJobs = new Map();
  }

  /**
   * Start indexing a website for a chatbot
   */
  async startIndexing(licenseKey, siteKey, domain, options = {}) {
    const jobId = `index_${siteKey}_${Date.now()}`;
    
    try {
      // Check if already indexing
      const existingJob = this.processingJobs.get(siteKey);
      if (existingJob) {
        return {
          jobId: existingJob.jobId,
          status: 'already_processing',
          message: 'Website is already being indexed'
        };
      }
      
      // Add to processing map
      this.processingJobs.set(siteKey, {
        jobId,
        startTime: Date.now(),
        status: 'starting'
      });
      
      // Queue the job
      await this.queue.push({
        jobId,
        siteKey,
        domain,
        options,
        timestamp: new Date().toISOString()
      });
      
      // Start processing in background
      this.processIndexingJob(jobId, licenseKey, siteKey, domain, options);
      
      return {
        jobId,
        status: 'queued',
        message: 'Website indexing has been queued'
      };
      
    } catch (error) {
      logger.error('Failed to start indexing:', error);
      this.processingJobs.delete(siteKey);
      throw error;
    }
  }

  /**
   * Process indexing job
   */
  async processIndexingJob(jobId, licenseKey, siteKey, domain, options) {
    try {
      logger.info(`Starting indexing job ${jobId} for ${domain}`);
      
      // Update job status
      this.processingJobs.set(siteKey, {
        jobId,
        startTime: Date.now(),
        status: 'scraping'
      });
      
      // Scrape website
      const pages = await this.scrapeWebsite(domain, options);
      
      if (!pages || pages.length === 0) {
        throw new Error('No pages found to index');
      }
      
      logger.info(`Scraped ${pages.length} pages from ${domain}`);
      
      // Update job status
      this.processingJobs.set(siteKey, {
        jobId,
        startTime: Date.now(),
        status: 'indexing',
        pagesFound: pages.length
      });
      
      // Process pages for indexing
      const processedPages = await this.processPages(pages, domain);
      
      // Index to Pinecone with license key for namespace isolation
      const indexingResult = await indexWebsite(licenseKey, siteKey, domain, processedPages);
      
      // Store indexing metadata
      await prisma.indexing_jobs.create({
        data: {
          job_id: jobId,
          license_key: licenseKey,
          site_key: siteKey,
          domain,
          status: 'completed',
          pages_indexed: indexingResult.processed,
          pages_failed: indexingResult.failed,
          started_at: new Date(this.processingJobs.get(siteKey).startTime),
          completed_at: new Date(),
          metadata: {
            total_pages: pages.length,
            processed_pages: processedPages.length,
            indexing_result: indexingResult
          }
        }
      });
      
      // Update product setup
      await prisma.product_setups.update({
        where: {
          site_key: siteKey
        },
        data: {
          indexing_completed: true,
          indexing_completed_at: new Date(),
          setup_data: {
            indexed_pages: indexingResult.processed,
            last_indexed: new Date().toISOString()
          }
        }
      });
      
      logger.info(`Completed indexing job ${jobId}: ${indexingResult.processed} pages indexed`);
      
      // Clean up
      this.processingJobs.delete(siteKey);
      
      return indexingResult;
      
    } catch (error) {
      logger.error(`Indexing job ${jobId} failed:`, error);
      
      // Store failure
      await prisma.indexing_jobs.create({
        data: {
          job_id: jobId,
          license_key: licenseKey,
          site_key: siteKey,
          domain,
          status: 'failed',
          error_message: error.message,
          started_at: new Date(this.processingJobs.get(siteKey)?.startTime || Date.now()),
          completed_at: new Date()
        }
      });
      
      // Clean up
      this.processingJobs.delete(siteKey);
      
      throw error;
    }
  }

  /**
   * Scrape website pages
   */
  async scrapeWebsite(domain, options = {}) {
    const pages = [];
    const visited = new Set();
    const toVisit = [domain.startsWith('http') ? domain : `https://${domain}`];
    const baseUrl = new URL(toVisit[0]);
    const maxPages = options.maxPages || 50;
    
    await this.scraper.initialize();
    
    try {
      while (toVisit.length > 0 && pages.length < maxPages) {
        const url = toVisit.shift();
        
        if (visited.has(url)) continue;
        visited.add(url);
        
        try {
          const page = await this.scrapePage(url);
          
          if (page) {
            pages.push(page);
            
            // Extract and queue internal links
            const links = this.extractInternalLinks(page.html, baseUrl);
            links.forEach(link => {
              if (!visited.has(link) && !toVisit.includes(link)) {
                toVisit.push(link);
              }
            });
          }
        } catch (pageError) {
          logger.warn(`Failed to scrape ${url}:`, pageError.message);
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } finally {
      await this.scraper.close();
    }
    
    return pages;
  }

  /**
   * Scrape a single page
   */
  async scrapePage(url) {
    const browser = await this.scraper.browser;
    const page = await browser.newPage();
    
    try {
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Get page content
      const html = await page.content();
      const title = await page.title();
      
      // Extract text content
      const textContent = await page.evaluate(() => {
        // Remove script and style elements
        const scripts = document.querySelectorAll('script, style');
        scripts.forEach(el => el.remove());
        
        // Get text content
        return document.body ? document.body.innerText : '';
      });
      
      // Extract metadata
      const metadata = await page.evaluate(() => {
        const getMeta = (name) => {
          const element = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
          return element ? element.getAttribute('content') : null;
        };
        
        return {
          description: getMeta('description') || getMeta('og:description'),
          keywords: getMeta('keywords'),
          author: getMeta('author'),
          ogTitle: getMeta('og:title'),
          ogImage: getMeta('og:image')
        };
      });
      
      return {
        url,
        title,
        html,
        text: textContent,
        description: metadata.description,
        metadata,
        scrapedAt: new Date().toISOString()
      };
      
    } finally {
      await page.close();
    }
  }

  /**
   * Extract internal links from HTML
   */
  extractInternalLinks(html, baseUrl) {
    const $ = cheerio.load(html);
    const links = [];
    
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      
      try {
        const linkUrl = new URL(href, baseUrl);
        
        // Only include internal links
        if (linkUrl.hostname === baseUrl.hostname) {
          // Normalize URL
          linkUrl.hash = '';
          linkUrl.search = '';
          
          const normalizedUrl = linkUrl.toString();
          
          // Skip certain file types and patterns
          if (!this.shouldSkipUrl(normalizedUrl)) {
            links.push(normalizedUrl);
          }
        }
      } catch (error) {
        // Invalid URL, skip
      }
    });
    
    return [...new Set(links)]; // Remove duplicates
  }

  /**
   * Check if URL should be skipped
   */
  shouldSkipUrl(url) {
    const skipPatterns = [
      /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|tar|gz)$/i,
      /\/(api|admin|login|logout|signin|signout|register)\//i,
      /\#/,
      /mailto:/i,
      /tel:/i,
      /javascript:/i
    ];
    
    return skipPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Process pages for vector indexing
   */
  async processPages(pages, domain) {
    const processed = [];
    
    for (const page of pages) {
      try {
        // Clean and prepare content
        const content = this.cleanContent(page.text || '');
        
        if (content.length < 100) {
          logger.warn(`Skipping ${page.url} - content too short`);
          continue;
        }
        
        // Determine page type
        const pageType = this.determinePageType(page.url, page.title, content);
        
        // Split large content into chunks if needed
        const chunks = this.chunkContent(content, 2000);
        
        if (chunks.length > 1) {
          // Create multiple documents for large pages
          chunks.forEach((chunk, index) => {
            processed.push({
              url: page.url,
              title: `${page.title} (Part ${index + 1})`,
              content: chunk,
              description: page.description,
              type: pageType,
              metadata: {
                ...page.metadata,
                chunk: index,
                totalChunks: chunks.length
              }
            });
          });
        } else {
          processed.push({
            url: page.url,
            title: page.title,
            content,
            description: page.description,
            type: pageType,
            metadata: page.metadata
          });
        }
        
      } catch (error) {
        logger.error(`Failed to process page ${page.url}:`, error);
      }
    }
    
    return processed;
  }

  /**
   * Clean content for indexing
   */
  cleanContent(text) {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s\-.,!?;:'"]/g, '') // Remove special characters
      .trim();
  }

  /**
   * Determine page type based on URL and content
   */
  determinePageType(url, title, content) {
    const urlLower = url.toLowerCase();
    const titleLower = (title || '').toLowerCase();
    const contentLower = content.toLowerCase();
    
    if (urlLower.includes('/faq') || titleLower.includes('faq') || 
        titleLower.includes('frequently asked')) {
      return 'faq';
    }
    
    if (urlLower.includes('/product') || urlLower.includes('/service') ||
        titleLower.includes('product') || titleLower.includes('service')) {
      return 'product';
    }
    
    if (urlLower.includes('/blog') || urlLower.includes('/article') ||
        urlLower.includes('/news')) {
      return 'article';
    }
    
    return 'webpage';
  }

  /**
   * Split content into chunks
   */
  chunkContent(content, maxLength = 2000) {
    if (content.length <= maxLength) {
      return [content];
    }
    
    const chunks = [];
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxLength && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += ' ' + sentence;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  /**
   * Get indexing status
   */
  async getStatus(licenseKey, siteKey) {
    // Check if currently processing
    const processingJob = this.processingJobs.get(siteKey);
    if (processingJob) {
      return {
        status: 'processing',
        ...processingJob
      };
    }
    
    // Check Pinecone indexing status
    const pineconeStatus = await getIndexingStatus(licenseKey, siteKey);
    if (pineconeStatus) {
      return pineconeStatus;
    }
    
    // Check database for last job
    const lastJob = await prisma.indexing_jobs.findFirst({
      where: { 
        license_key: licenseKey,
        site_key: siteKey 
      },
      orderBy: { created_at: 'desc' }
    });
    
    if (lastJob) {
      return {
        status: lastJob.status,
        jobId: lastJob.job_id,
        pagesIndexed: lastJob.pages_indexed,
        pagesFailed: lastJob.pages_failed,
        completedAt: lastJob.completed_at
      };
    }
    
    return {
      status: 'not_indexed',
      message: 'Website has not been indexed yet'
    };
  }

  /**
   * Re-index a website
   */
  async reindex(licenseKey, siteKey) {
    // Get domain from product setup
    const setup = await prisma.product_setups.findFirst({
      where: { 
        site_key: siteKey 
      },
      select: { domain: true }
    });
    
    if (!setup || !setup.domain) {
      throw new Error('Product setup not found');
    }
    
    // Delete existing vectors
    const { deleteKnowledgeBase } = await import('@intelagent/vector-store');
    await deleteKnowledgeBase(licenseKey, siteKey);
    
    // Start new indexing
    return await this.startIndexing(licenseKey, siteKey, setup.domain, { reindex: true });
  }
}

// Singleton instance
const websiteIndexer = new WebsiteIndexer();

export { websiteIndexer, WebsiteIndexer };