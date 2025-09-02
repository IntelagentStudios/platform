/**
 * Skill Marketplace
 * Discovery API for available skills with search, filtering, and recommendations
 */

import { SkillDefinition, SkillCategory } from '../types';
import { SkillsRegistry } from '../skills/registry';

export interface MarketplaceSkill {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  tags: string[];
  version: string;
  author: string;
  popularity: number;
  rating: number;
  executionCount: number;
  averageExecutionTime: number;
  successRate: number;
  pricing: SkillPricing;
  requirements?: string[];
  examples?: SkillExample[];
  relatedSkills?: string[];
}

export interface SkillPricing {
  model: 'free' | 'perExecution' | 'monthly' | 'custom';
  price?: number;
  currency?: string;
  freeQuota?: number;
}

export interface SkillExample {
  title: string;
  description: string;
  input: any;
  output: any;
}

export interface SearchFilters {
  category?: SkillCategory;
  tags?: string[];
  priceRange?: { min: number; max: number };
  minRating?: number;
  searchText?: string;
  sortBy?: 'popularity' | 'rating' | 'name' | 'recent' | 'price';
  limit?: number;
  offset?: number;
}

export interface SkillBundle {
  id: string;
  name: string;
  description: string;
  skills: string[];
  discount: number;
  price: number;
}

export class SkillMarketplace {
  private static instance: SkillMarketplace;
  private registry: SkillsRegistry;
  private skillMetadata = new Map<string, MarketplaceSkill>();
  private bundles = new Map<string, SkillBundle>();
  private userRatings = new Map<string, Map<string, number>>(); // licenseKey -> skillId -> rating
  private recommendations = new Map<string, string[]>(); // skillId -> relatedSkillIds
  
  private constructor() {
    this.registry = SkillsRegistry.getInstance();
    this.initializeMarketplace();
  }
  
  public static getInstance(): SkillMarketplace {
    if (!SkillMarketplace.instance) {
      SkillMarketplace.instance = new SkillMarketplace();
    }
    return SkillMarketplace.instance;
  }
  
  /**
   * Initialize marketplace with all available skills
   */
  private initializeMarketplace(): void {
    const skills = this.registry.getAllSkills();
    
    skills.forEach(skill => {
      const metadata: MarketplaceSkill = {
        id: skill.id,
        name: skill.name,
        description: skill.description,
        category: skill.category,
        tags: this.generateTags(skill),
        version: skill.version || '1.0.0',
        author: skill.author || 'Intelagent',
        popularity: 0,
        rating: 0,
        executionCount: 0,
        averageExecutionTime: 0,
        successRate: 100,
        pricing: this.determineSkillPricing(skill),
        requirements: skill.requirements,
        examples: this.generateExamples(skill),
        relatedSkills: []
      };
      
      this.skillMetadata.set(skill.id, metadata);
    });
    
    // Generate relationships
    this.generateRelationships();
    
    // Create bundles
    this.createDefaultBundles();
  }
  
  /**
   * Search and filter skills
   */
  public searchSkills(filters?: SearchFilters): {
    skills: MarketplaceSkill[];
    total: number;
    facets: Record<string, any>;
  } {
    let skills = Array.from(this.skillMetadata.values());
    
    // Apply filters
    if (filters) {
      if (filters.category) {
        skills = skills.filter(s => s.category === filters.category);
      }
      
      if (filters.tags && filters.tags.length > 0) {
        skills = skills.filter(s => 
          filters.tags!.some(tag => s.tags.includes(tag))
        );
      }
      
      if (filters.priceRange) {
        skills = skills.filter(s => {
          const price = s.pricing.price || 0;
          return price >= filters.priceRange!.min && price <= filters.priceRange!.max;
        });
      }
      
      if (filters.minRating) {
        skills = skills.filter(s => s.rating >= filters.minRating!);
      }
      
      if (filters.searchText) {
        const search = filters.searchText.toLowerCase();
        skills = skills.filter(s =>
          s.name.toLowerCase().includes(search) ||
          s.description.toLowerCase().includes(search) ||
          s.tags.some(tag => tag.toLowerCase().includes(search))
        );
      }
      
      // Sort
      skills = this.sortSkills(skills, filters.sortBy || 'popularity');
      
      // Pagination
      const offset = filters.offset || 0;
      const limit = filters.limit || 20;
      const total = skills.length;
      skills = skills.slice(offset, offset + limit);
    }
    
    // Generate facets for filtering
    const facets = this.generateFacets(Array.from(this.skillMetadata.values()));
    
    return { skills, total: skills.length, facets };
  }
  
  /**
   * Get skill details
   */
  public getSkillDetails(skillId: string): MarketplaceSkill | null {
    return this.skillMetadata.get(skillId) || null;
  }
  
  /**
   * Get recommended skills based on usage
   */
  public getRecommendations(
    licenseKey: string, 
    currentSkillId?: string
  ): MarketplaceSkill[] {
    const recommendations: MarketplaceSkill[] = [];
    
    // If current skill provided, get related skills
    if (currentSkillId) {
      const skill = this.skillMetadata.get(currentSkillId);
      if (skill?.relatedSkills) {
        skill.relatedSkills.forEach(id => {
          const related = this.skillMetadata.get(id);
          if (related) recommendations.push(related);
        });
      }
    }
    
    // Add popular skills
    const popular = Array.from(this.skillMetadata.values())
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 5);
    
    recommendations.push(...popular);
    
    // Remove duplicates
    const unique = Array.from(new Set(recommendations.map(s => s.id)))
      .map(id => recommendations.find(s => s.id === id)!)
      .slice(0, 10);
    
    return unique;
  }
  
  /**
   * Get skill bundles
   */
  public getBundles(): SkillBundle[] {
    return Array.from(this.bundles.values());
  }
  
  /**
   * Get bundle details
   */
  public getBundleDetails(bundleId: string): {
    bundle: SkillBundle;
    skills: MarketplaceSkill[];
    totalPrice: number;
    savings: number;
  } | null {
    const bundle = this.bundles.get(bundleId);
    if (!bundle) return null;
    
    const skills = bundle.skills
      .map(id => this.skillMetadata.get(id))
      .filter(s => s !== undefined) as MarketplaceSkill[];
    
    const totalPrice = skills.reduce((sum, s) => sum + (s.pricing.price || 0), 0);
    const bundlePrice = bundle.price;
    const savings = totalPrice - bundlePrice;
    
    return { bundle, skills, totalPrice, savings };
  }
  
  /**
   * Rate a skill
   */
  public rateSkill(licenseKey: string, skillId: string, rating: number): void {
    if (rating < 1 || rating > 5) return;
    
    let userRatings = this.userRatings.get(licenseKey);
    if (!userRatings) {
      userRatings = new Map();
      this.userRatings.set(licenseKey, userRatings);
    }
    
    userRatings.set(skillId, rating);
    
    // Update skill rating
    this.updateSkillRating(skillId);
  }
  
  /**
   * Track skill execution for metrics
   */
  public trackExecution(
    skillId: string, 
    success: boolean, 
    executionTime: number
  ): void {
    const skill = this.skillMetadata.get(skillId);
    if (!skill) return;
    
    skill.executionCount++;
    skill.popularity = Math.log(skill.executionCount + 1) * 10; // Logarithmic popularity
    
    // Update average execution time
    skill.averageExecutionTime = 
      (skill.averageExecutionTime * (skill.executionCount - 1) + executionTime) / 
      skill.executionCount;
    
    // Update success rate
    if (!success) {
      skill.successRate = 
        ((skill.successRate * (skill.executionCount - 1)) / skill.executionCount) * 100;
    }
  }
  
  /**
   * Get trending skills
   */
  public getTrendingSkills(period: 'day' | 'week' | 'month' = 'week'): MarketplaceSkill[] {
    // Simple trending: most executed recently
    return Array.from(this.skillMetadata.values())
      .sort((a, b) => b.executionCount - a.executionCount)
      .slice(0, 10);
  }
  
  /**
   * Get skill categories
   */
  public getCategories(): Array<{
    category: SkillCategory;
    count: number;
    popularSkills: string[];
  }> {
    const categories = new Map<SkillCategory, MarketplaceSkill[]>();
    
    this.skillMetadata.forEach(skill => {
      const skills = categories.get(skill.category) || [];
      skills.push(skill);
      categories.set(skill.category, skills);
    });
    
    return Array.from(categories.entries()).map(([category, skills]) => ({
      category,
      count: skills.length,
      popularSkills: skills
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 3)
        .map(s => s.id)
    }));
  }
  
  /**
   * Generate tags for a skill
   */
  private generateTags(skill: SkillDefinition): string[] {
    const tags: string[] = [];
    
    // Category-based tags
    tags.push(skill.category.toLowerCase());
    
    // Name-based tags
    const words = skill.name.toLowerCase().split(/[\s_-]+/);
    tags.push(...words);
    
    // Capability tags
    if (skill.id.includes('email')) tags.push('email', 'communication');
    if (skill.id.includes('pdf')) tags.push('pdf', 'document');
    if (skill.id.includes('api')) tags.push('api', 'integration');
    if (skill.id.includes('data')) tags.push('data', 'processing');
    if (skill.id.includes('ai') || skill.id.includes('ml')) tags.push('ai', 'ml');
    
    return [...new Set(tags)];
  }
  
  /**
   * Determine skill pricing
   */
  private determineSkillPricing(skill: SkillDefinition): SkillPricing {
    // Simple pricing model based on category
    const pricingMap: Record<SkillCategory, SkillPricing> = {
      [SkillCategory.COMMUNICATION]: { model: 'perExecution', price: 0.001, currency: 'USD' },
      [SkillCategory.DATA_PROCESSING]: { model: 'perExecution', price: 0.002, currency: 'USD' },
      [SkillCategory.AI_ML]: { model: 'perExecution', price: 0.005, currency: 'USD' },
      [SkillCategory.INTEGRATION]: { model: 'perExecution', price: 0.003, currency: 'USD' },
      [SkillCategory.AUTOMATION]: { model: 'perExecution', price: 0.002, currency: 'USD' },
      [SkillCategory.ANALYTICS]: { model: 'perExecution', price: 0.003, currency: 'USD' },
      [SkillCategory.SECURITY]: { model: 'perExecution', price: 0.004, currency: 'USD' },
      [SkillCategory.UTILITY]: { model: 'free', freeQuota: 1000 },
      [SkillCategory.FINANCE]: { model: 'perExecution', price: 0.01, currency: 'USD' },
      [SkillCategory.MARKETING]: { model: 'perExecution', price: 0.003, currency: 'USD' },
      [SkillCategory.SALES]: { model: 'perExecution', price: 0.005, currency: 'USD' },
      [SkillCategory.CUSTOMER_SERVICE]: { model: 'perExecution', price: 0.002, currency: 'USD' },
      [SkillCategory.PRODUCTIVITY]: { model: 'perExecution', price: 0.001, currency: 'USD' },
      [SkillCategory.DEVELOPMENT]: { model: 'perExecution', price: 0.003, currency: 'USD' },
      [SkillCategory.CUSTOM]: { model: 'custom', price: 0, currency: 'USD' }
    };
    
    return pricingMap[skill.category] || { model: 'free' };
  }
  
  /**
   * Generate examples for a skill
   */
  private generateExamples(skill: SkillDefinition): SkillExample[] {
    // Generate basic examples based on skill type
    const examples: SkillExample[] = [];
    
    if (skill.id.includes('email')) {
      examples.push({
        title: 'Send Welcome Email',
        description: 'Send a welcome email to a new user',
        input: { to: 'user@example.com', subject: 'Welcome!', body: 'Welcome to our platform!' },
        output: { success: true, messageId: 'msg_123' }
      });
    }
    
    if (skill.id.includes('pdf')) {
      examples.push({
        title: 'Generate Invoice PDF',
        description: 'Create a PDF invoice from data',
        input: { invoiceNumber: 'INV-001', items: [{ name: 'Service', price: 100 }] },
        output: { success: true, pdfUrl: 'https://example.com/invoice.pdf' }
      });
    }
    
    return examples;
  }
  
  /**
   * Generate relationships between skills
   */
  private generateRelationships(): void {
    this.skillMetadata.forEach((skill, id) => {
      const related: string[] = [];
      
      // Find related skills by category
      this.skillMetadata.forEach((otherSkill, otherId) => {
        if (id !== otherId && skill.category === otherSkill.category) {
          related.push(otherId);
        }
      });
      
      // Find related by tags
      this.skillMetadata.forEach((otherSkill, otherId) => {
        if (id !== otherId) {
          const commonTags = skill.tags.filter(tag => otherSkill.tags.includes(tag));
          if (commonTags.length >= 2) {
            related.push(otherId);
          }
        }
      });
      
      // Limit to 5 related skills
      skill.relatedSkills = [...new Set(related)].slice(0, 5);
    });
  }
  
  /**
   * Create default bundles
   */
  private createDefaultBundles(): void {
    // Marketing bundle
    this.bundles.set('marketing_suite', {
      id: 'marketing_suite',
      name: 'Marketing Suite',
      description: 'Complete marketing automation toolkit',
      skills: ['email_sender', 'sms_sender', 'social_poster', 'content_generator', 'seo_analyzer'],
      discount: 20,
      price: 0.012
    });
    
    // Data processing bundle
    this.bundles.set('data_pipeline', {
      id: 'data_pipeline',
      name: 'Data Pipeline',
      description: 'End-to-end data processing solution',
      skills: ['data_aggregator', 'data_cleaner', 'data_validator', 'data_merger', 'csv_parser'],
      discount: 25,
      price: 0.008
    });
    
    // E-commerce bundle
    this.bundles.set('ecommerce_pack', {
      id: 'ecommerce_pack',
      name: 'E-commerce Pack',
      description: 'Everything you need for online selling',
      skills: ['shopify_connector', 'stripe_payment', 'invoice_generator', 'email_sender', 'inventory_tracker'],
      discount: 30,
      price: 0.02
    });
  }
  
  /**
   * Sort skills
   */
  private sortSkills(skills: MarketplaceSkill[], sortBy: string): MarketplaceSkill[] {
    switch (sortBy) {
      case 'popularity':
        return skills.sort((a, b) => b.popularity - a.popularity);
      case 'rating':
        return skills.sort((a, b) => b.rating - a.rating);
      case 'name':
        return skills.sort((a, b) => a.name.localeCompare(b.name));
      case 'recent':
        return skills.sort((a, b) => b.executionCount - a.executionCount);
      case 'price':
        return skills.sort((a, b) => (a.pricing.price || 0) - (b.pricing.price || 0));
      default:
        return skills;
    }
  }
  
  /**
   * Generate facets for filtering
   */
  private generateFacets(skills: MarketplaceSkill[]): Record<string, any> {
    const categories = new Map<SkillCategory, number>();
    const tags = new Map<string, number>();
    const priceRanges = { free: 0, under5: 0, under10: 0, over10: 0 };
    
    skills.forEach(skill => {
      // Categories
      categories.set(skill.category, (categories.get(skill.category) || 0) + 1);
      
      // Tags
      skill.tags.forEach(tag => {
        tags.set(tag, (tags.get(tag) || 0) + 1);
      });
      
      // Price ranges
      const price = skill.pricing.price || 0;
      if (price === 0) priceRanges.free++;
      else if (price < 0.005) priceRanges.under5++;
      else if (price < 0.01) priceRanges.under10++;
      else priceRanges.over10++;
    });
    
    return {
      categories: Object.fromEntries(categories),
      tags: Object.fromEntries(Array.from(tags).slice(0, 20)), // Top 20 tags
      priceRanges
    };
  }
  
  /**
   * Update skill rating based on user ratings
   */
  private updateSkillRating(skillId: string): void {
    const skill = this.skillMetadata.get(skillId);
    if (!skill) return;
    
    let totalRating = 0;
    let ratingCount = 0;
    
    this.userRatings.forEach(userRatings => {
      const rating = userRatings.get(skillId);
      if (rating) {
        totalRating += rating;
        ratingCount++;
      }
    });
    
    if (ratingCount > 0) {
      skill.rating = totalRating / ratingCount;
    }
  }
}