import { IntegrationAdapter, IntegrationMetadata, IntegrationData } from './IntegrationAdapter';

export class SalesforceAdapter extends IntegrationAdapter {
  metadata: IntegrationMetadata = {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Connect to Salesforce CRM for leads, opportunities, and accounts',
    icon: '☁️',
    category: 'crm',
    requiredScopes: ['api', 'refresh_token', 'offline_access'],
    supportedActions: [
      'create_lead',
      'update_lead',
      'create_opportunity',
      'update_opportunity',
      'create_account',
      'update_account',
      'create_contact',
      'update_contact'
    ],
    supportedTriggers: [
      'lead_created',
      'lead_updated',
      'opportunity_created',
      'opportunity_updated',
      'opportunity_won',
      'opportunity_lost'
    ]
  };

  private apiVersion = 'v58.0';
  private instanceUrl: string = '';

  async initialize(): Promise<boolean> {
    if (!this.config.accessToken || !this.config.domain) {
      throw new Error('Salesforce requires accessToken and domain');
    }

    this.instanceUrl = `https://${this.config.domain}.my.salesforce.com`;

    // Verify connection
    try {
      const response = await fetch(`${this.instanceUrl}/services/data/${this.apiVersion}/`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Salesforce initialization failed:', error);
      return false;
    }
  }

  async fetchData(endpoint: string, params?: Record<string, any>): Promise<IntegrationData> {
    const url = new URL(`${this.instanceUrl}/services/data/${this.apiVersion}/${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Salesforce fetch failed: ${response.statusText}`);
    }

    const data = await response.json();
    return this.transformToCommon(data);
  }

  async pushData(endpoint: string, data: any): Promise<IntegrationData> {
    const response = await fetch(`${this.instanceUrl}/services/data/${this.apiVersion}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Salesforce push failed: ${response.statusText}`);
    }

    const result = await response.json();
    return this.transformToCommon(result);
  }

  async getAvailableFields(): Promise<string[]> {
    // Return common Salesforce fields
    return [
      'Id',
      'Name',
      'Email',
      'Phone',
      'Company',
      'Title',
      'Industry',
      'LeadSource',
      'Status',
      'Rating',
      'Amount',
      'CloseDate',
      'StageName',
      'Probability',
      'AccountId',
      'ContactId',
      'OwnerId',
      'CreatedDate',
      'LastModifiedDate'
    ];
  }

  // Salesforce-specific methods
  async createLead(leadData: any): Promise<IntegrationData> {
    return this.pushData('sobjects/Lead', leadData);
  }

  async updateLead(leadId: string, leadData: any): Promise<IntegrationData> {
    const response = await fetch(`${this.instanceUrl}/services/data/${this.apiVersion}/sobjects/Lead/${leadId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(leadData)
    });

    if (!response.ok) {
      throw new Error(`Failed to update lead: ${response.statusText}`);
    }

    return this.transformToCommon({ success: true, id: leadId });
  }

  async createOpportunity(oppData: any): Promise<IntegrationData> {
    return this.pushData('sobjects/Opportunity', oppData);
  }

  async runSOQL(query: string): Promise<IntegrationData> {
    const encodedQuery = encodeURIComponent(query);
    return this.fetchData(`query?q=${encodedQuery}`);
  }
}