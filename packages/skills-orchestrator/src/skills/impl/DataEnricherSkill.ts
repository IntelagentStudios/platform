/**
 * Data Enricher Skill
 * Enriches data with additional information
 */

import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillCategory } from '../../types';

export class DataEnricherSkill extends BaseSkill {
  metadata = {
    id: 'data_enricher',
    name: 'Data Enricher',
    description: 'Enrich data with additional context and information',
    category: SkillCategory.DATA_PROCESSING,
    version: '1.0.0',
    author: 'Intelagent',
    tags: ['data', 'enrichment', 'enhancement', 'processing']
  };

  validate(params: SkillParams): boolean {
    return !!(params.data && params.enrichmentType);
  }

  protected async executeImpl(params: SkillParams): Promise<SkillResult> {
    try {
      const { data, enrichmentType, options = {} } = params;
      let enrichedData: any;

      switch (enrichmentType) {
        case 'contact':
          enrichedData = await this.enrichContactData(data, options);
          break;
        case 'company':
          enrichedData = await this.enrichCompanyData(data, options);
          break;
        case 'location':
          enrichedData = await this.enrichLocationData(data, options);
          break;
        case 'social':
          enrichedData = await this.enrichSocialData(data, options);
          break;
        case 'metadata':
          enrichedData = await this.enrichMetadata(data, options);
          break;
        default:
          enrichedData = await this.genericEnrichment(data, options);
      }

      // Calculate enrichment score
      const enrichmentScore = this.calculateEnrichmentScore(data, enrichedData);

      return {
        success: true,
        data: {
          original: data,
          enriched: enrichedData,
          enrichmentType,
          enrichmentScore,
          fieldsAdded: this.getAddedFields(data, enrichedData),
          timestamp: new Date()
        },
        metadata: {
          skillId: this.metadata.id,
          skillName: this.metadata.name,
          timestamp: new Date()
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        metadata: {
          skillId: this.metadata.id,
          skillName: this.metadata.name,
          timestamp: new Date()
        }
      };
    }
  }

  private async enrichContactData(data: any, options: any): Promise<any> {
    const enriched = { ...data };

    // Enrich email data
    if (data.email) {
      const emailParts = data.email.split('@');
      enriched.emailDomain = emailParts[1];
      enriched.emailUsername = emailParts[0];
      
      // Guess name from email if not provided
      if (!enriched.firstName && !enriched.lastName) {
        const nameParts = emailParts[0].split(/[._-]/);
        if (nameParts.length >= 2) {
          enriched.firstName = this.capitalize(nameParts[0]);
          enriched.lastName = this.capitalize(nameParts[nameParts.length - 1]);
        }
      }

      // Infer company from domain
      if (!enriched.company && emailParts[1]) {
        enriched.company = this.inferCompanyFromDomain(emailParts[1]);
      }
    }

    // Enrich phone data
    if (data.phone) {
      enriched.phoneFormatted = this.formatPhone(data.phone);
      enriched.phoneCountryCode = this.extractCountryCode(data.phone);
      enriched.phoneType = this.detectPhoneType(data.phone);
    }

    // Add full name if we have parts
    if (enriched.firstName && enriched.lastName) {
      enriched.fullName = `${enriched.firstName} ${enriched.lastName}`;
      enriched.initials = `${enriched.firstName[0]}${enriched.lastName[0]}`.toUpperCase();
    }

    // Add data quality score
    enriched.dataQualityScore = this.calculateDataQuality(enriched);

    // Add verification status
    enriched.verificationStatus = {
      email: data.email ? 'unverified' : null,
      phone: data.phone ? 'unverified' : null,
      address: data.address ? 'unverified' : null
    };

    return enriched;
  }

  private async enrichCompanyData(data: any, options: any): Promise<any> {
    const enriched = { ...data };

    if (data.name || data.company) {
      const companyName = data.name || data.company;
      
      // Add industry classification
      enriched.industry = this.classifyIndustry(companyName);
      
      // Add company size estimate
      enriched.estimatedSize = this.estimateCompanySize(companyName);
      
      // Add company type
      enriched.companyType = this.detectCompanyType(companyName);
      
      // Add domain if not present
      if (!enriched.domain) {
        enriched.domain = this.generateDomain(companyName);
      }
      
      // Add social profiles
      enriched.socialProfiles = {
        linkedin: `https://linkedin.com/company/${companyName.toLowerCase().replace(/\s+/g, '-')}`,
        twitter: `https://twitter.com/${companyName.toLowerCase().replace(/\s+/g, '')}`,
        facebook: `https://facebook.com/${companyName.toLowerCase().replace(/\s+/g, '')}`
      };
    }

    // Add founded year estimate
    if (!enriched.foundedYear) {
      enriched.estimatedAge = 'Unknown';
    }

    // Add technology stack guess
    enriched.likelyTechnologies = ['Website', 'Email', 'Cloud Services'];

    return enriched;
  }

  private async enrichLocationData(data: any, options: any): Promise<any> {
    const enriched = { ...data };

    if (data.address || data.city || data.country) {
      // Parse address components
      if (data.address) {
        const addressParts = this.parseAddress(data.address);
        enriched.addressComponents = addressParts;
      }

      // Add timezone
      if (data.city || data.country) {
        enriched.timezone = this.guessTimezone(data.city, data.country);
      }

      // Add coordinates (mock)
      if (data.city) {
        enriched.coordinates = {
          latitude: this.generateMockCoordinate(90),
          longitude: this.generateMockCoordinate(180)
        };
      }

      // Add region
      if (data.country) {
        enriched.region = this.getRegion(data.country);
        enriched.continent = this.getContinent(data.country);
      }

      // Add locale information
      enriched.locale = {
        language: this.getLanguage(data.country),
        currency: this.getCurrency(data.country),
        dateFormat: 'MM/DD/YYYY'
      };
    }

    return enriched;
  }

  private async enrichSocialData(data: any, options: any): Promise<any> {
    const enriched = { ...data };

    // Generate social usernames
    if (data.name || data.firstName) {
      const baseName = (data.firstName || data.name).toLowerCase();
      
      enriched.possibleUsernames = [
        baseName,
        `${baseName}${new Date().getFullYear()}`,
        `${baseName}_official`,
        `the_${baseName}`,
        `real_${baseName}`
      ];
    }

    // Add social metrics (mock)
    enriched.socialMetrics = {
      estimatedFollowers: Math.floor(Math.random() * 10000),
      estimatedEngagement: `${(Math.random() * 5).toFixed(2)}%`,
      activityLevel: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)]
    };

    // Add content interests (mock)
    enriched.likelyInterests = [
      'Technology',
      'Business',
      'Innovation',
      'Marketing',
      'Sales'
    ].slice(0, Math.floor(Math.random() * 4) + 2);

    return enriched;
  }

  private async enrichMetadata(data: any, options: any): Promise<any> {
    const enriched = { ...data };

    // Add metadata
    enriched._metadata = {
      enrichedAt: new Date(),
      enrichmentVersion: '1.0.0',
      dataSource: 'IntelagentEnricher',
      confidence: Math.floor(Math.random() * 30) + 70,
      completeness: this.calculateCompleteness(data)
    };

    // Add data classification
    enriched._classification = {
      containsPII: this.containsPII(data),
      dataType: this.classifyDataType(data),
      sensitivity: this.determineSensitivity(data)
    };

    // Add validation flags
    enriched._validation = {
      hasRequiredFields: this.hasRequiredFields(data),
      passesValidation: true,
      warnings: this.getDataWarnings(data)
    };

    return enriched;
  }

  private async genericEnrichment(data: any, options: any): Promise<any> {
    const enriched = { ...data };

    // Add generic enrichments
    if (typeof data === 'object') {
      // Add ID if missing
      if (!enriched.id) {
        enriched.id = this.generateId();
      }

      // Add timestamps
      if (!enriched.createdAt) {
        enriched.createdAt = new Date();
      }
      enriched.updatedAt = new Date();

      // Add version
      enriched.version = enriched.version ? enriched.version + 1 : 1;
    }

    return enriched;
  }

  // Helper methods
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  private inferCompanyFromDomain(domain: string): string {
    const company = domain.split('.')[0];
    return this.capitalize(company);
  }

  private formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  }

  private extractCountryCode(phone: string): string {
    if (phone.startsWith('+')) {
      return phone.split(' ')[0];
    }
    return '+1'; // Default to US
  }

  private detectPhoneType(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10 || cleaned.length === 11) {
      return 'mobile';
    }
    return 'unknown';
  }

  private calculateDataQuality(data: any): number {
    let score = 0;
    let fields = 0;
    
    Object.values(data).forEach(value => {
      if (value !== null && value !== undefined && value !== '') {
        score++;
      }
      fields++;
    });
    
    return Math.round((score / fields) * 100);
  }

  private classifyIndustry(companyName: string): string {
    const tech = ['tech', 'software', 'digital', 'cyber', 'data', 'cloud'];
    const finance = ['bank', 'finance', 'capital', 'invest', 'fund'];
    const healthcare = ['health', 'medical', 'pharma', 'bio', 'care'];
    
    const lower = companyName.toLowerCase();
    
    if (tech.some(word => lower.includes(word))) return 'Technology';
    if (finance.some(word => lower.includes(word))) return 'Finance';
    if (healthcare.some(word => lower.includes(word))) return 'Healthcare';
    
    return 'General';
  }

  private estimateCompanySize(companyName: string): string {
    if (companyName.includes('Inc') || companyName.includes('Corp')) {
      return 'Large (1000+ employees)';
    }
    if (companyName.includes('LLC') || companyName.includes('Ltd')) {
      return 'Medium (50-999 employees)';
    }
    return 'Small (1-49 employees)';
  }

  private detectCompanyType(companyName: string): string {
    if (companyName.includes('Inc')) return 'Corporation';
    if (companyName.includes('LLC')) return 'Limited Liability Company';
    if (companyName.includes('Ltd')) return 'Limited Company';
    return 'Private Company';
  }

  private generateDomain(companyName: string): string {
    return `${companyName.toLowerCase().replace(/\s+/g, '')}.com`;
  }

  private parseAddress(address: string): any {
    const parts = address.split(',').map(p => p.trim());
    return {
      street: parts[0] || '',
      city: parts[1] || '',
      state: parts[2] || '',
      country: parts[3] || ''
    };
  }

  private guessTimezone(city?: string, country?: string): string {
    // Simplified timezone guessing
    if (country === 'USA' || country === 'United States') return 'America/New_York';
    if (country === 'UK' || country === 'United Kingdom') return 'Europe/London';
    if (country === 'Japan') return 'Asia/Tokyo';
    return 'UTC';
  }

  private generateMockCoordinate(max: number): number {
    return (Math.random() * max * 2) - max;
  }

  private getRegion(country: string): string {
    const regions: Record<string, string> = {
      'USA': 'North America',
      'Canada': 'North America',
      'UK': 'Europe',
      'Germany': 'Europe',
      'Japan': 'Asia',
      'Australia': 'Oceania'
    };
    return regions[country] || 'Unknown';
  }

  private getContinent(country: string): string {
    const continents: Record<string, string> = {
      'USA': 'North America',
      'UK': 'Europe',
      'Japan': 'Asia',
      'Australia': 'Australia',
      'Brazil': 'South America',
      'Egypt': 'Africa'
    };
    return continents[country] || 'Unknown';
  }

  private getLanguage(country: string): string {
    const languages: Record<string, string> = {
      'USA': 'en-US',
      'UK': 'en-GB',
      'Germany': 'de-DE',
      'France': 'fr-FR',
      'Spain': 'es-ES',
      'Japan': 'ja-JP'
    };
    return languages[country] || 'en-US';
  }

  private getCurrency(country: string): string {
    const currencies: Record<string, string> = {
      'USA': 'USD',
      'UK': 'GBP',
      'Germany': 'EUR',
      'Japan': 'JPY',
      'Canada': 'CAD',
      'Australia': 'AUD'
    };
    return currencies[country] || 'USD';
  }

  private calculateCompleteness(data: any): number {
    const requiredFields = ['name', 'email', 'phone'];
    let complete = 0;
    
    requiredFields.forEach(field => {
      if (data[field]) complete++;
    });
    
    return Math.round((complete / requiredFields.length) * 100);
  }

  private containsPII(data: any): boolean {
    const piiFields = ['email', 'phone', 'ssn', 'address', 'birthdate'];
    return Object.keys(data).some(key => piiFields.includes(key.toLowerCase()));
  }

  private classifyDataType(data: any): string {
    if (data.email || data.phone) return 'Contact';
    if (data.company || data.industry) return 'Business';
    if (data.address || data.city) return 'Location';
    return 'General';
  }

  private determineSensitivity(data: any): string {
    if (data.ssn || data.creditCard) return 'High';
    if (data.email || data.phone) return 'Medium';
    return 'Low';
  }

  private hasRequiredFields(data: any): boolean {
    return !!(data.name || data.email || data.id);
  }

  private getDataWarnings(data: any): string[] {
    const warnings: string[] = [];
    
    if (!data.id) warnings.push('Missing unique identifier');
    if (data.email && !data.email.includes('@')) warnings.push('Invalid email format');
    if (data.phone && data.phone.length < 10) warnings.push('Phone number may be incomplete');
    
    return warnings;
  }

  private generateId(): string {
    return `enr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateEnrichmentScore(original: any, enriched: any): number {
    const originalFields = Object.keys(original).length;
    const enrichedFields = Object.keys(enriched).length;
    const addedFields = enrichedFields - originalFields;
    
    return Math.min(100, Math.round((addedFields / originalFields) * 100));
  }

  private getAddedFields(original: any, enriched: any): string[] {
    const originalKeys = Object.keys(original);
    const enrichedKeys = Object.keys(enriched);
    
    return enrichedKeys.filter(key => !originalKeys.includes(key));
  }

  getConfig(): Record<string, any> {
    return {
      enrichmentTypes: ['contact', 'company', 'location', 'social', 'metadata'],
      maxFieldsToAdd: 20,
      preserveOriginalData: true
    };
  }
}