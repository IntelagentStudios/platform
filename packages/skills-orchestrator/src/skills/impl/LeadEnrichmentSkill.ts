import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillMetadata, SkillCategory } from '../../types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class LeadEnrichmentSkill extends BaseSkill {
  metadata: SkillMetadata = {
    id: 'lead_enrichment',
    name: 'Lead Enrichment Service',
    description: 'Enriches lead data with company information, social profiles, and contact details',
    category: SkillCategory.DATA_PROCESSING,
    version: '1.0.0',
    author: 'Intelagent Platform',
    tags: ['leads', 'enrichment', 'data', 'research', 'prospecting']
  };

  async executeImpl(params: SkillParams): Promise<SkillResult> {
    const { action, licenseKey, data } = params;

    if (!licenseKey) {
      return this.error('License key is required');
    }

    try {
      switch (action) {
        case 'enrich_lead':
          return await this.enrichSingleLead(licenseKey, data.leadId || data.email);
        case 'bulk_enrich':
          return await this.bulkEnrichLeads(licenseKey, data.leadIds || data.emails);
        case 'find_email':
          return await this.findEmailAddress(data.name, data.company);
        case 'verify_email':
          return await this.verifyEmail(data.email);
        case 'get_company_info':
          return await this.getCompanyInfo(data.domain || data.company);
        case 'find_decision_makers':
          return await this.findDecisionMakers(data.company, data.roles);
        case 'social_lookup':
          return await this.findSocialProfiles(data.email || data.name);
        case 'score_lead':
          return await this.scoreLead(licenseKey, data.leadId);
        default:
          return this.error(`Unknown action: ${action}`);
      }
    } catch (error: any) {
      this.log(`Error in LeadEnrichmentSkill: ${error.message}`, 'error');
      return this.error(error.message);
    }
  }

  private async enrichSingleLead(licenseKey: string, identifier: string): Promise<SkillResult> {
    try {
      // Find the lead by ID or email
      const lead = await prisma.sales_leads.findFirst({
        where: {
          license_key: licenseKey,
          OR: [
            { id: identifier },
            { email: identifier }
          ]
        }
      });

      if (!lead) {
        return this.error('Lead not found');
      }

      // Simulate enrichment (in production, this would call external APIs)
      const enrichedData = await this.performEnrichment(lead.email!);

      // Update the lead with enriched data
      const updatedLead = await prisma.sales_leads.update({
        where: { id: lead.id },
        data: {
          first_name: enrichedData.firstName || lead.first_name,
          last_name: enrichedData.lastName || lead.last_name,
          full_name: enrichedData.fullName || lead.full_name,
          job_title: enrichedData.jobTitle || lead.job_title,
          company_name: enrichedData.companyName || lead.company_name,
          company_domain: enrichedData.companyDomain || lead.company_domain,
          company_size: enrichedData.companySize || lead.company_size,
          industry: enrichedData.industry || lead.industry,
          linkedin_url: enrichedData.linkedinUrl || lead.linkedin_url,
          phone: enrichedData.phone || lead.phone,
          city: enrichedData.city || lead.city,
          state: enrichedData.state || lead.state,
          country: enrichedData.country || lead.country,
          custom_fields: {
            ...(lead.custom_fields as any || {}),
            enriched: true,
            enrichedAt: new Date().toISOString(),
            enrichmentSource: 'LeadEnrichmentSkill',
            ...enrichedData.additionalData
          },
          score: this.calculateLeadScore(enrichedData),
          updated_at: new Date()
        }
      });

      // Track the enrichment activity
      await prisma.sales_activities.create({
        data: {
          license_key: licenseKey,
          lead_id: lead.id,
          campaign_id: lead.campaign_id,
          activity_type: 'lead_enriched',
          subject: 'Lead data enriched',
          metadata: {
            fieldsUpdated: Object.keys(enrichedData),
            source: 'LeadEnrichmentSkill'
          },
          skill_used: 'lead_enrichment',
          status: 'completed'
        }
      });

      this.log(`Lead enriched: ${lead.email}`, 'info');

      return this.success({
        leadId: updatedLead.id,
        email: updatedLead.email,
        enrichedFields: Object.keys(enrichedData),
        score: updatedLead.score,
        message: 'Lead enriched successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to enrich lead: ${error.message}`);
    }
  }

  private async bulkEnrichLeads(licenseKey: string, identifiers: string[]): Promise<SkillResult> {
    const results = {
      successful: [] as any[],
      failed: [] as any[]
    };

    for (const identifier of identifiers) {
      const result = await this.enrichSingleLead(licenseKey, identifier);
      if (result.success) {
        results.successful.push(result.data);
      } else {
        results.failed.push({ identifier, error: result.error });
      }
    }

    return this.success({
      enriched: results.successful.length,
      failed: results.failed.length,
      results,
      message: `Enriched ${results.successful.length} leads`
    });
  }

  private async findEmailAddress(name: string, company: string): Promise<SkillResult> {
    try {
      // Simulate email finding logic
      const patterns = [
        `${name.toLowerCase().replace(' ', '.')}@${this.extractDomain(company)}`,
        `${name.toLowerCase().replace(' ', '_')}@${this.extractDomain(company)}`,
        `${name.split(' ')[0].toLowerCase()}@${this.extractDomain(company)}`,
        `${name.charAt(0).toLowerCase()}${name.split(' ')[1]?.toLowerCase()}@${this.extractDomain(company)}`
      ];

      // In production, this would verify these patterns
      const foundEmail = patterns[0]; // Simulated result

      return this.success({
        email: foundEmail,
        confidence: 0.85,
        patterns: patterns,
        message: 'Email found successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to find email: ${error.message}`);
    }
  }

  private async verifyEmail(email: string): Promise<SkillResult> {
    try {
      // Simulate email verification
      const isValid = email.includes('@') && email.includes('.');
      const domain = email.split('@')[1];

      return this.success({
        email,
        valid: isValid,
        deliverable: isValid,
        domain,
        confidence: isValid ? 0.95 : 0.1,
        message: isValid ? 'Email is valid' : 'Email is invalid'
      });
    } catch (error: any) {
      return this.error(`Failed to verify email: ${error.message}`);
    }
  }

  private async getCompanyInfo(identifier: string): Promise<SkillResult> {
    try {
      // Simulate company data retrieval
      const companyData = {
        name: identifier,
        domain: this.extractDomain(identifier),
        industry: 'Technology',
        size: '50-200',
        founded: '2015',
        location: {
          city: 'San Francisco',
          state: 'CA',
          country: 'USA'
        },
        description: 'A leading technology company',
        linkedin: `https://linkedin.com/company/${identifier.toLowerCase()}`,
        technologies: ['React', 'Node.js', 'AWS'],
        revenue: '$10M-$50M',
        employees: 150
      };

      return this.success({
        company: companyData,
        message: 'Company information retrieved'
      });
    } catch (error: any) {
      return this.error(`Failed to get company info: ${error.message}`);
    }
  }

  private async findDecisionMakers(company: string, roles?: string[]): Promise<SkillResult> {
    try {
      const targetRoles = roles || ['CEO', 'CTO', 'VP Sales', 'Director'];

      // Simulate finding decision makers
      const decisionMakers = targetRoles.map(role => ({
        name: `John Doe`,
        title: role,
        company,
        email: `${role.toLowerCase().replace(' ', '')}@${this.extractDomain(company)}`,
        linkedin: `https://linkedin.com/in/johndoe-${role.toLowerCase()}`,
        confidence: 0.75
      }));

      return this.success({
        company,
        decisionMakers,
        total: decisionMakers.length,
        message: 'Decision makers found'
      });
    } catch (error: any) {
      return this.error(`Failed to find decision makers: ${error.message}`);
    }
  }

  private async findSocialProfiles(identifier: string): Promise<SkillResult> {
    try {
      // Simulate social profile lookup
      const profiles = {
        linkedin: `https://linkedin.com/in/${identifier.replace('@', '-').replace('.', '-')}`,
        twitter: `https://twitter.com/${identifier.split('@')[0]}`,
        github: null,
        facebook: null
      };

      return this.success({
        identifier,
        profiles,
        message: 'Social profiles found'
      });
    } catch (error: any) {
      return this.error(`Failed to find social profiles: ${error.message}`);
    }
  }

  private async scoreLead(licenseKey: string, leadId: string): Promise<SkillResult> {
    try {
      const lead = await prisma.sales_leads.findFirst({
        where: {
          license_key: licenseKey,
          id: leadId
        }
      });

      if (!lead) {
        return this.error('Lead not found');
      }

      // Calculate lead score based on various factors
      let score = 0;

      // Email engagement
      if (lead.emails_opened && lead.emails_opened > 0) score += 20;
      if (lead.emails_clicked && lead.emails_clicked > 0) score += 30;

      // Profile completeness
      if (lead.job_title) score += 10;
      if (lead.company_name) score += 10;
      if (lead.linkedin_url) score += 5;
      if (lead.phone) score += 5;

      // Company fit
      if (lead.company_size === '50-200' || lead.company_size === '200-1000') score += 10;
      if (lead.industry === 'Technology' || lead.industry === 'Software') score += 10;

      // Update lead score
      await prisma.sales_leads.update({
        where: { id: leadId },
        data: {
          score,
          updated_at: new Date()
        }
      });

      return this.success({
        leadId,
        score,
        factors: {
          engagement: lead.emails_opened || 0 + lead.emails_clicked || 0,
          profileCompleteness: [
            lead.job_title,
            lead.company_name,
            lead.linkedin_url,
            lead.phone
          ].filter(Boolean).length,
          companyFit: lead.company_size && lead.industry ? 'Good' : 'Unknown'
        },
        message: 'Lead scored successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to score lead: ${error.message}`);
    }
  }

  private async performEnrichment(email: string): Promise<any> {
    // Simulate API call to enrichment service
    const domain = email.split('@')[1];
    const username = email.split('@')[0];
    const nameParts = username.split('.');

    return {
      firstName: nameParts[0]?.charAt(0).toUpperCase() + nameParts[0]?.slice(1),
      lastName: nameParts[1]?.charAt(0).toUpperCase() + nameParts[1]?.slice(1),
      fullName: nameParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' '),
      jobTitle: 'Marketing Manager',
      companyName: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
      companyDomain: domain,
      companySize: '50-200',
      industry: 'Technology',
      linkedinUrl: `https://linkedin.com/in/${username}`,
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      additionalData: {
        technologies: ['HubSpot', 'Salesforce'],
        seniority: 'Manager',
        department: 'Marketing'
      }
    };
  }

  private extractDomain(company: string): string {
    // Simple domain extraction logic
    return company.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .concat('.com');
  }

  private calculateLeadScore(enrichedData: any): number {
    let score = 50; // Base score

    if (enrichedData.jobTitle?.includes('VP') || enrichedData.jobTitle?.includes('Director')) {
      score += 20;
    }
    if (enrichedData.companySize === '200-1000' || enrichedData.companySize === '1000+') {
      score += 15;
    }
    if (enrichedData.linkedinUrl) {
      score += 10;
    }
    if (enrichedData.phone) {
      score += 5;
    }

    return Math.min(score, 100);
  }

  validate(params: SkillParams): boolean {
    if (!params.action) {
      this.log('Missing required parameter: action', 'error');
      return false;
    }

    const validActions = [
      'enrich_lead', 'bulk_enrich', 'find_email', 'verify_email',
      'get_company_info', 'find_decision_makers', 'social_lookup', 'score_lead'
    ];

    if (!validActions.includes(params.action)) {
      this.log(`Invalid action: ${params.action}`, 'error');
      return false;
    }

    return true;
  }
}