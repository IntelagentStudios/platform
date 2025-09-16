import { BaseSkill } from '../../BaseSkill';
import { SkillResult, SkillCategory } from '../../../types';

interface TechnicalSEOAuditInput {
  url: string;
  crawlDepth?: number;
  includeSubdomains?: boolean;
  checkRedirects?: boolean;
  analyzeJavaScript?: boolean;
}

export class TechnicalSEOAuditSkill extends BaseSkill {
  metadata = {
    id: 'technical-seo-audit_v1',
    name: 'Technical SEO Audit',
    description: 'Comprehensive technical SEO analysis including crawlability, indexability, performance, and security',
    category: SkillCategory.MARKETING,
    version: '1.0.0',
    author: 'Intelagent',
    tags: ['seo', 'technical', 'audit', 'crawlability', 'performance', 'core-web-vitals'],
    cost: {
      base: 10000,
      perToken: 0
    },
    tier: 'Custom' as const
  };

  protected async executeImpl(params: TechnicalSEOAuditInput): Promise<SkillResult> {
    const { url, crawlDepth = 50, includeSubdomains = false, checkRedirects = true, analyzeJavaScript = true } = params;

    if (!url) {
      return this.createError('URL is required for technical SEO audit');
    }

    try {
      // Validate URL
      const urlObj = new URL(url);
      
      // Perform parallel checks for efficiency
      const [
        crawlabilityCheck,
        indexabilityCheck,
        performanceCheck,
        securityCheck,
        structuredDataCheck
      ] = await Promise.all([
        this.checkCrawlability(urlObj, crawlDepth),
        this.checkIndexability(urlObj),
        this.checkPerformance(urlObj),
        this.checkSecurity(urlObj),
        this.checkStructuredData(urlObj)
      ]);

      const auditResults = {
        url,
        timestamp: new Date().toISOString(),
        crawlability: crawlabilityCheck,
        indexability: indexabilityCheck,
        performance: performanceCheck,
        security: securityCheck,
        structuredData: structuredDataCheck,
        score: this.calculateOverallScore({
          crawlabilityCheck,
          indexabilityCheck,
          performanceCheck,
          securityCheck,
          structuredDataCheck
        }),
        recommendations: this.generateRecommendations({
          crawlabilityCheck,
          indexabilityCheck,
          performanceCheck,
          securityCheck,
          structuredDataCheck
        })
      };

      return {
        success: true,
        data: auditResults,
        metadata: {
          skillId: this.metadata.id,
          skillName: this.metadata.name,
          timestamp: new Date(),
          executionTime: Date.now()
        }
      };
    } catch (error: any) {
      return this.createError(error.message);
    }
  }

  private async checkCrawlability(url: URL, depth: number) {
    const results = {
      robotsTxt: { status: 'checking', issues: [] as string[] },
      sitemaps: { found: [] as string[], issues: [] as string[] },
      orphanPages: [] as string[],
      crawlErrors: [] as Array<{ url: string; error: string }>
    };

    try {
      // Check robots.txt
      const robotsResponse = await fetch(`${url.origin}/robots.txt`);
      if (robotsResponse.ok) {
        const robotsContent = await robotsResponse.text();
        results.robotsTxt.status = 'found';
        
        // Parse for issues
        if (robotsContent.includes('Disallow: /')) {
          results.robotsTxt.issues.push('Root directory blocked');
        }
        
        // Extract sitemap references
        const sitemapMatches = robotsContent.match(/Sitemap:\s*(.*)/gi);
        if (sitemapMatches) {
          results.sitemaps.found = sitemapMatches.map(m => m.replace(/Sitemap:\s*/i, '').trim());
        }
      } else {
        results.robotsTxt.status = 'missing';
        results.robotsTxt.issues.push('robots.txt not found');
      }

      // Check XML sitemaps
      const defaultSitemaps = ['/sitemap.xml', '/sitemap_index.xml', '/sitemap-index.xml'];
      for (const sitemapPath of defaultSitemaps) {
        try {
          const sitemapResponse = await fetch(`${url.origin}${sitemapPath}`);
          if (sitemapResponse.ok) {
            results.sitemaps.found.push(`${url.origin}${sitemapPath}`);
          }
        } catch (e) {
          // Sitemap not found
        }
      }

      if (results.sitemaps.found.length === 0) {
        results.sitemaps.issues.push('No sitemaps found');
      }

    } catch (error: any) {
      results.crawlErrors.push({ url: url.toString(), error: error.message });
    }

    return results;
  }

  private async checkIndexability(url: URL) {
    const results = {
      indexedPages: 0,
      blockedPages: [] as string[],
      duplicateContent: [] as Array<{ pages: string[]; similarity: number }>,
      canonicalization: { issues: [] as string[], suggestions: [] as string[] }
    };

    try {
      const response = await fetch(url.toString());
      if (response.ok) {
        const html = await response.text();
        
        // Check for noindex
        if (html.includes('noindex')) {
          results.blockedPages.push(url.toString());
          results.canonicalization.issues.push('Page has noindex directive');
        }
        
        // Check for canonical
        const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
        if (!canonicalMatch) {
          results.canonicalization.issues.push('Missing canonical tag');
          results.canonicalization.suggestions.push(`Add <link rel="canonical" href="${url.toString()}" />`);
        }
        
        // Check meta robots
        const metaRobotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["']/i);
        if (metaRobotsMatch && metaRobotsMatch[1].includes('noindex')) {
          results.blockedPages.push(url.toString());
        }
      }
    } catch (error: any) {
      results.canonicalization.issues.push(`Error checking indexability: ${error.message}`);
    }

    return results;
  }

  private async checkPerformance(url: URL) {
    const results = {
      coreWebVitals: {
        lcp: 0,
        fid: 0,
        cls: 0,
        ttfb: 0
      },
      pageSpeed: { mobile: 0, desktop: 0 },
      renderBlocking: [] as string[]
    };

    try {
      // Measure TTFB
      const startTime = Date.now();
      const response = await fetch(url.toString());
      results.coreWebVitals.ttfb = Date.now() - startTime;

      if (response.ok) {
        const html = await response.text();
        
        // Identify render-blocking resources
        const scriptMatches: string[] = html.match(/<script[^>]*src=["']([^"']+)["'][^>]*>/gi) || [];
        const styleMatches: string[] = html.match(/<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi) || [];

        scriptMatches.forEach((script: string) => {
          if (!script.includes('async') && !script.includes('defer')) {
            results.renderBlocking.push('Script: ' + script);
          }
        });

        styleMatches.forEach((style: string) => {
          results.renderBlocking.push('Stylesheet: ' + style);
        });
        
        // Simulate Core Web Vitals (in production, use real CrUX data or Lighthouse)
        results.coreWebVitals.lcp = results.coreWebVitals.ttfb + 1500;
        results.coreWebVitals.fid = 50;
        results.coreWebVitals.cls = 0.05;
        
        // Simulate PageSpeed scores
        results.pageSpeed.mobile = Math.max(0, 100 - results.renderBlocking.length * 5);
        results.pageSpeed.desktop = Math.max(0, 100 - results.renderBlocking.length * 3);
      }
    } catch (error: any) {
      // Performance check failed
    }

    return results;
  }

  private async checkSecurity(url: URL) {
    const results = {
      https: false,
      mixedContent: [] as string[],
      securityHeaders: {} as Record<string, boolean>
    };

    results.https = url.protocol === 'https:';

    try {
      const response = await fetch(url.toString());
      
      // Check security headers
      const headers = response.headers;
      results.securityHeaders['strict-transport-security'] = headers.has('strict-transport-security');
      results.securityHeaders['x-content-type-options'] = headers.has('x-content-type-options');
      results.securityHeaders['x-frame-options'] = headers.has('x-frame-options');
      results.securityHeaders['x-xss-protection'] = headers.has('x-xss-protection');
      results.securityHeaders['content-security-policy'] = headers.has('content-security-policy');
      
      if (response.ok && results.https) {
        const html = await response.text();
        
        // Check for mixed content
        const httpResources = html.match(/(?:src|href)=["']http:\/\/[^"']+["']/gi) || [];
        results.mixedContent = httpResources.map(r => r.replace(/(?:src|href)=["']/, '').replace(/["']$/, ''));
      }
    } catch (error: any) {
      // Security check failed
    }

    return results;
  }

  private async checkStructuredData(url: URL) {
    const results = {
      schemaMarkup: [] as Array<{ type: string; valid: boolean }>,
      openGraph: {} as Record<string, string>,
      twitterCards: {} as Record<string, string>
    };

    try {
      const response = await fetch(url.toString());
      if (response.ok) {
        const html = await response.text();
        
        // Check for JSON-LD
        const jsonLdMatches: string[] = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
        jsonLdMatches.forEach((match: string) => {
          try {
            const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '');
            const data = JSON.parse(jsonContent);
            results.schemaMarkup.push({
              type: data['@type'] || 'Unknown',
              valid: true
            });
          } catch {
            results.schemaMarkup.push({
              type: 'Invalid JSON-LD',
              valid: false
            });
          }
        });
        
        // Check Open Graph tags
        const ogMatches: string[] = html.match(/<meta[^>]*property=["']og:([^"']+)["'][^>]*content=["']([^"']+)["']/gi) || [];
        ogMatches.forEach((match: string) => {
          const propertyMatch = match.match(/property=["']og:([^"']+)["']/i);
          const contentMatch = match.match(/content=["']([^"']+)["']/i);
          if (propertyMatch && contentMatch) {
            results.openGraph[propertyMatch[1]] = contentMatch[1];
          }
        });

        // Check Twitter Cards
        const twitterMatches: string[] = html.match(/<meta[^>]*name=["']twitter:([^"']+)["'][^>]*content=["']([^"']+)["']/gi) || [];
        twitterMatches.forEach((match: string) => {
          const nameMatch = match.match(/name=["']twitter:([^"']+)["']/i);
          const contentMatch = match.match(/content=["']([^"']+)["']/i);
          if (nameMatch && contentMatch) {
            results.twitterCards[nameMatch[1]] = contentMatch[1];
          }
        });
      }
    } catch (error: any) {
      // Structured data check failed
    }

    return results;
  }

  private calculateOverallScore(checks: any): number {
    let score = 100;
    
    // Deduct points for issues
    if (checks.crawlabilityCheck.robotsTxt.issues.length > 0) score -= 10;
    if (checks.crawlabilityCheck.sitemaps.issues.length > 0) score -= 5;
    if (checks.indexabilityCheck.blockedPages.length > 0) score -= 15;
    if (checks.indexabilityCheck.canonicalization.issues.length > 0) score -= 10;
    if (checks.performanceCheck.coreWebVitals.lcp > 2500) score -= 10;
    if (checks.performanceCheck.renderBlocking.length > 5) score -= 10;
    if (!checks.securityCheck.https) score -= 20;
    if (checks.securityCheck.mixedContent.length > 0) score -= 10;
    if (checks.structuredDataCheck.schemaMarkup.length === 0) score -= 5;
    
    return Math.max(0, score);
  }

  private generateRecommendations(checks: any): string[] {
    const recommendations = [];
    
    if (checks.crawlabilityCheck.robotsTxt.issues.length > 0) {
      recommendations.push('Fix robots.txt issues to improve crawlability');
    }
    if (checks.crawlabilityCheck.sitemaps.found.length === 0) {
      recommendations.push('Create and submit XML sitemaps');
    }
    if (checks.indexabilityCheck.canonicalization.issues.length > 0) {
      recommendations.push('Implement proper canonical tags');
    }
    if (checks.performanceCheck.coreWebVitals.lcp > 2500) {
      recommendations.push('Optimize Largest Contentful Paint (LCP)');
    }
    if (checks.performanceCheck.renderBlocking.length > 0) {
      recommendations.push('Eliminate render-blocking resources');
    }
    if (!checks.securityCheck.https) {
      recommendations.push('Migrate to HTTPS immediately');
    }
    if (Object.values(checks.securityCheck.securityHeaders).filter(v => !v).length > 0) {
      recommendations.push('Implement missing security headers');
    }
    if (checks.structuredDataCheck.schemaMarkup.length === 0) {
      recommendations.push('Add structured data markup');
    }
    
    return recommendations;
  }

  validate(params: any): boolean {
    if (!params.url) return false;
    try {
      new URL(params.url);
      return true;
    } catch {
      return false;
    }
  }

  getConfig() {
    return {
      maxCrawlDepth: 100,
      supportedProtocols: ['http', 'https'],
      checkTypes: ['crawlability', 'indexability', 'performance', 'security', 'structured-data'],
      coreWebVitalsThresholds: {
        lcp: { good: 2500, needsImprovement: 4000 },
        fid: { good: 100, needsImprovement: 300 },
        cls: { good: 0.1, needsImprovement: 0.25 }
      }
    };
  }

  private createError(message: string): SkillResult {
    return {
      success: false,
      error: message,
      metadata: {
        skillId: this.metadata.id,
        skillName: this.metadata.name,
        timestamp: new Date()
      }
    };
  }
}