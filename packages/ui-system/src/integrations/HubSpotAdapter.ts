import { IntegrationAdapter, IntegrationConfig, IntegrationMetadata, IntegrationData } from './IntegrationAdapter';

export class HubSpotAdapter extends IntegrationAdapter {
  metadata: IntegrationMetadata = {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Connect to HubSpot for marketing automation and CRM',
    icon: '🟠',
    category: 'marketing',
    requiredScopes: [
      'crm.objects.contacts.read',
      'crm.objects.contacts.write',
      'crm.objects.companies.read',
      'crm.objects.companies.write',
      'crm.objects.deals.read',
      'crm.objects.deals.write'
    ],
    supportedActions: [
      'create_contact',
      'update_contact',
      'create_company',
      'update_company',
      'create_deal',
      'update_deal',
      'add_to_list',
      'send_email'
    ],
    supportedTriggers: [
      'contact_created',
      'contact_updated',
      'deal_created',
      'deal_updated',
      'form_submitted',
      'email_opened'
    ]
  };

  private baseUrl = 'https://api.hubapi.com';

  async initialize(): Promise<boolean> {
    if (!this.config.accessToken) {
      throw new Error('HubSpot requires an access token');
    }

    // Verify connection
    try {
      const response = await fetch(`${this.baseUrl}/crm/v3/objects/contacts?limit=1`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch (error) {
      console.error('HubSpot initialization failed:', error);
      return false;
    }
  }

  async fetchData(endpoint: string, params?: Record<string, any>): Promise<IntegrationData> {
    const url = new URL(`${this.baseUrl}/${endpoint}`);
    
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
      throw new Error(`HubSpot fetch failed: ${response.statusText}`);
    }

    const data = await response.json();
    return this.transformToCommon(data);
  }

  async pushData(endpoint: string, data: any): Promise<IntegrationData> {
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HubSpot push failed: ${response.statusText}`);
    }

    const result = await response.json();
    return this.transformToCommon(result);
  }

  async getAvailableFields(): Promise<string[]> {
    // Return common HubSpot fields
    return [
      'email',
      'firstname',
      'lastname',
      'company',
      'phone',
      'website',
      'lifecyclestage',
      'hs_lead_status',
      'hubspot_owner_id',
      'deal_amount',
      'dealname',
      'dealstage',
      'closedate',
      'pipeline',
      'hs_object_id',
      'createdate',
      'lastmodifieddate'
    ];
  }

  // HubSpot-specific methods
  async createContact(contactData: any): Promise<IntegrationData> {
    return this.pushData('crm/v3/objects/contacts', {
      properties: contactData
    });
  }

  async updateContact(contactId: string, contactData: any): Promise<IntegrationData> {
    const response = await fetch(`${this.baseUrl}/crm/v3/objects/contacts/${contactId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ properties: contactData })
    });

    if (!response.ok) {
      throw new Error(`Failed to update contact: ${response.statusText}`);
    }

    const result = await response.json();
    return this.transformToCommon(result);
  }

  async createDeal(dealData: any): Promise<IntegrationData> {
    return this.pushData('crm/v3/objects/deals', {
      properties: dealData
    });
  }

  async getContactLists(): Promise<IntegrationData> {
    return this.fetchData('contacts/v1/lists');
  }

  async addContactToList(contactId: string, listId: string): Promise<IntegrationData> {
    return this.pushData(`contacts/v1/lists/${listId}/add`, {
      vids: [contactId]
    });
  }
}