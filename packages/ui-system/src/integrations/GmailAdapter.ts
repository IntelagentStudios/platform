import { IntegrationAdapter, IntegrationMetadata, IntegrationData } from './IntegrationAdapter';

export class GmailAdapter extends IntegrationAdapter {
  metadata: IntegrationMetadata = {
    id: 'gmail',
    name: 'Gmail',
    description: 'Connect to Gmail for email automation',
    icon: '📧',
    category: 'communication',
    requiredScopes: [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify'
    ],
    supportedActions: [
      'send_email',
      'reply_to_email',
      'forward_email',
      'create_draft',
      'add_label',
      'mark_as_read',
      'archive_email'
    ],
    supportedTriggers: [
      'email_received',
      'email_labeled',
      'email_starred'
    ]
  };

  private baseUrl = 'https://gmail.googleapis.com/gmail/v1';

  async initialize(): Promise<boolean> {
    if (!this.config.accessToken) {
      throw new Error('Gmail requires an access token');
    }

    // Verify connection
    try {
      const response = await fetch(`${this.baseUrl}/users/me/profile`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Gmail initialization failed:', error);
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
      throw new Error(`Gmail fetch failed: ${response.statusText}`);
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
      throw new Error(`Gmail push failed: ${response.statusText}`);
    }

    const result = await response.json();
    return this.transformToCommon(result);
  }

  async getAvailableFields(): Promise<string[]> {
    return [
      'id',
      'threadId',
      'labelIds',
      'snippet',
      'from',
      'to',
      'cc',
      'bcc',
      'subject',
      'date',
      'body',
      'attachments',
      'isRead',
      'isStarred'
    ];
  }

  // Gmail-specific methods
  async sendEmail(to: string, subject: string, body: string, cc?: string): Promise<IntegrationData> {
    const message = this.createMessage(to, subject, body, cc);
    const encodedMessage = Buffer.from(message).toString('base64url');
    
    return this.pushData('users/me/messages/send', {
      raw: encodedMessage
    });
  }

  private createMessage(to: string, subject: string, body: string, cc?: string): string {
    const headers = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8'
    ];

    if (cc) {
      headers.splice(1, 0, `Cc: ${cc}`);
    }

    return `${headers.join('\r\n')}\r\n\r\n${body}`;
  }

  async getEmails(query?: string, maxResults: number = 10): Promise<IntegrationData> {
    const params: Record<string, any> = { maxResults: maxResults.toString() };
    if (query) {
      params.q = query;
    }
    return this.fetchData('users/me/messages', params);
  }

  async getEmail(messageId: string): Promise<IntegrationData> {
    return this.fetchData(`users/me/messages/${messageId}`);
  }

  async createDraft(to: string, subject: string, body: string): Promise<IntegrationData> {
    const message = this.createMessage(to, subject, body);
    const encodedMessage = Buffer.from(message).toString('base64url');
    
    return this.pushData('users/me/drafts', {
      message: {
        raw: encodedMessage
      }
    });
  }

  async addLabel(messageId: string, labelIds: string[]): Promise<IntegrationData> {
    const response = await fetch(
      `${this.baseUrl}/users/me/messages/${messageId}/modify`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          addLabelIds: labelIds
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to add label: ${response.statusText}`);
    }

    const result = await response.json();
    return this.transformToCommon(result);
  }
}
