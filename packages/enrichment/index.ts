/**
 * Data Enrichment Module
 * Used internally by other Intelagent products to enrich customer and lead data
 */

import { prisma } from '@intelagent/database';
import { RedisManager } from '@intelagent/redis';

interface EnrichmentRequest {
  email?: string;
  domain?: string;
  company?: string;
  phone?: string;
  linkedinUrl?: string;
  data?: Record<string, any>;
}

interface EnrichmentResult {
  success: boolean;
  data?: {
    // Personal Information
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email?: string;
    emailVerified?: boolean;
    phone?: string;
    phoneVerified?: boolean;
    
    // Professional Information
    jobTitle?: string;
    department?: string;
    seniority?: string;
    linkedinUrl?: string;
    twitterHandle?: string;
    
    // Company Information
    company?: {
      name?: string;
      domain?: string;
      industry?: string;
      size?: string;
      employeeCount?: number;
      revenue?: string;
      founded?: number;
      location?: {
        city?: string;
        state?: string;
        country?: string;
        timezone?: string;
      };
      technologies?: string[];
      socialProfiles?: {
        linkedin?: string;
        twitter?: string;
        facebook?: string;
      };
    };
    
    // Additional Metadata
    enrichedAt?: Date;
    confidence?: number;
    sources?: string[];
  };
  error?: string;
}

interface EnrichmentProvider {
  name: string;
  enrich: (request: EnrichmentRequest) => Promise<EnrichmentResult>;
  isConfigured: () => boolean;
}

class EnrichmentService {
  private providers: EnrichmentProvider[] = [];
  private cache: any = null;
  
  constructor() {
    this.initializeProviders();
    this.initializeCache();
  }
  
  private initializeCache() {
    try {
      this.cache = RedisManager.getClient('cache');
    } catch (error) {
      console.warn('Enrichment cache not available, using in-memory cache');
      this.cache = new Map();
    }
  }
  
  private initializeProviders() {
    // Initialize available providers based on environment variables
    
    // Clearbit Provider
    if (process.env.CLEARBIT_API_KEY) {
      this.providers.push({
        name: 'clearbit',
        isConfigured: () => !!process.env.CLEARBIT_API_KEY,
        enrich: async (request) => this.enrichWithClearbit(request)
      });
    }
    
    // Hunter.io Provider
    if (process.env.HUNTER_API_KEY) {
      this.providers.push({
        name: 'hunter',
        isConfigured: () => !!process.env.HUNTER_API_KEY,
        enrich: async (request) => this.enrichWithHunter(request)
      });
    }
    
    // Internal Database Provider (always available)
    this.providers.push({
      name: 'internal',
      isConfigured: () => true,
      enrich: async (request) => this.enrichFromDatabase(request)
    });
  }
  
  /**
   * Main enrichment method - combines data from all available sources
   */
  async enrich(request: EnrichmentRequest): Promise<EnrichmentResult> {
    // Check cache first
    const cacheKey = this.getCacheKey(request);
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Collect data from all providers
    const results: EnrichmentResult[] = [];
    const sources: string[] = [];
    
    for (const provider of this.providers) {
      if (provider.isConfigured()) {
        try {
          const result = await provider.enrich(request);
          if (result.success && result.data) {
            results.push(result);
            sources.push(provider.name);
          }
        } catch (error) {
          console.error(`Enrichment provider ${provider.name} failed:`, error);
        }
      }
    }
    
    // Merge results from all providers
    const mergedResult = this.mergeResults(results, sources);
    
    // Cache the result
    await this.saveToCache(cacheKey, mergedResult);
    
    // Store in database for future reference
    await this.saveToDatabase(request, mergedResult);
    
    return mergedResult;
  }
  
  /**
   * Find email addresses for a person at a company
   */
  async findEmail(firstName: string, lastName: string, domain: string): Promise<string | null> {
    // Common email patterns
    const patterns = [
      `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
      `${firstName.toLowerCase()}@${domain}`,
      `${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase()}@${domain}`,
      `${firstName.toLowerCase()}${lastName.charAt(0).toLowerCase()}@${domain}`,
    ];
    
    // Verify which pattern is valid
    for (const email of patterns) {
      const isValid = await this.verifyEmail(email);
      if (isValid) {
        return email;
      }
    }
    
    return null;
  }
  
  /**
   * Verify if an email address is valid and deliverable
   */
  async verifyEmail(email: string): Promise<boolean> {
    // Basic validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }
    
    // Check with external services if configured
    if (process.env.HUNTER_API_KEY) {
      try {
        const response = await fetch(
          `https://api.hunter.io/v2/email-verifier?email=${email}&api_key=${process.env.HUNTER_API_KEY}`
        );
        const data = await response.json();
        return data.data?.result === 'deliverable';
      } catch (error) {
        console.error('Email verification failed:', error);
      }
    }
    
    // Fallback to basic domain check
    const domain = email.split('@')[1];
    try {
      const response = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
      const data = await response.json();
      return data.Answer && data.Answer.length > 0;
    } catch {
      return false;
    }
  }
  
  /**
   * Get technology stack for a domain
   */
  async getTechStack(domain: string): Promise<string[]> {
    const techStack: string[] = [];
    
    // Check common technology indicators
    try {
      const response = await fetch(`https://${domain}`);
      const html = await response.text();
      
      // Check for common technologies
      if (html.includes('wp-content')) techStack.push('WordPress');
      if (html.includes('shopify')) techStack.push('Shopify');
      if (html.includes('react')) techStack.push('React');
      if (html.includes('angular')) techStack.push('Angular');
      if (html.includes('vue')) techStack.push('Vue.js');
      if (html.includes('gtag') || html.includes('google-analytics')) techStack.push('Google Analytics');
      if (html.includes('facebook-pixel')) techStack.push('Facebook Pixel');
      if (html.includes('hubspot')) techStack.push('HubSpot');
      if (html.includes('salesforce')) techStack.push('Salesforce');
    } catch (error) {
      console.error('Tech stack detection failed:', error);
    }
    
    return techStack;
  }
  
  // Provider-specific enrichment methods
  private async enrichWithClearbit(request: EnrichmentRequest): Promise<EnrichmentResult> {
    // Clearbit implementation
    // This is a placeholder - actual implementation would use Clearbit API
    return { success: false, error: 'Clearbit not implemented' };
  }
  
  private async enrichWithHunter(request: EnrichmentRequest): Promise<EnrichmentResult> {
    // Hunter.io implementation
    // This is a placeholder - actual implementation would use Hunter API
    return { success: false, error: 'Hunter not implemented' };
  }
  
  private async enrichFromDatabase(request: EnrichmentRequest): Promise<EnrichmentResult> {
    try {
      // Look for existing enriched data in our database
      const existing = await prisma.enriched_data.findFirst({
        where: {
          OR: [
            { email: request.email },
            { domain: request.domain },
            { company_name: request.company }
          ]
        }
      });
      
      if (existing) {
        return {
          success: true,
          data: existing.data as any
        };
      }
      
      return { success: false, error: 'No data found' };
    } catch (error) {
      return { success: false, error: 'Database query failed' };
    }
  }
  
  // Helper methods
  private getCacheKey(request: EnrichmentRequest): string {
    return `enrichment:${request.email || request.domain || request.company}`;
  }
  
  private async getFromCache(key: string): Promise<EnrichmentResult | null> {
    try {
      if (this.cache instanceof Map) {
        return this.cache.get(key) || null;
      }
      const cached = await this.cache.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }
  
  private async saveToCache(key: string, result: EnrichmentResult): Promise<void> {
    try {
      if (this.cache instanceof Map) {
        this.cache.set(key, result);
      } else {
        await this.cache.set(key, JSON.stringify(result), 'EX', 86400); // 24 hours
      }
    } catch (error) {
      console.error('Cache save failed:', error);
    }
  }
  
  private async saveToDatabase(request: EnrichmentRequest, result: EnrichmentResult): Promise<void> {
    if (!result.success || !result.data) return;
    
    try {
      await prisma.enriched_data.create({
        data: {
          email: request.email,
          domain: request.domain,
          company_name: request.company,
          data: result.data as any,
          confidence: result.data.confidence || 0,
          sources: result.data.sources || [],
          enriched_at: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to save enrichment to database:', error);
    }
  }
  
  private mergeResults(results: EnrichmentResult[], sources: string[]): EnrichmentResult {
    if (results.length === 0) {
      return { success: false, error: 'No enrichment data available' };
    }
    
    // Merge all data, prioritizing more complete/recent data
    const merged: any = {
      enrichedAt: new Date(),
      sources,
      confidence: Math.min(100, 60 + (sources.length * 10))
    };
    
    for (const result of results) {
      if (result.data) {
        Object.assign(merged, result.data);
      }
    }
    
    return {
      success: true,
      data: merged
    };
  }
}

// Singleton instance
const enrichmentService = new EnrichmentService();

// Public API
export async function enrichData(request: EnrichmentRequest): Promise<EnrichmentResult> {
  return enrichmentService.enrich(request);
}

export async function findEmail(firstName: string, lastName: string, domain: string): Promise<string | null> {
  return enrichmentService.findEmail(firstName, lastName, domain);
}

export async function verifyEmail(email: string): Promise<boolean> {
  return enrichmentService.verifyEmail(email);
}

export async function getTechStack(domain: string): Promise<string[]> {
  return enrichmentService.getTechStack(domain);
}

export { EnrichmentService, EnrichmentRequest, EnrichmentResult };