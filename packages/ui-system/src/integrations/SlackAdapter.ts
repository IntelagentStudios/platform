import { IntegrationAdapter, IntegrationConfig, IntegrationMetadata, IntegrationData } from './IntegrationAdapter';

export class SlackAdapter extends IntegrationAdapter {
  metadata: IntegrationMetadata = {
    id: 'slack',
    name: 'Slack',
    description: 'Connect to Slack for team communication',
    icon: '💬',
    category: 'communication',
    requiredScopes: [
      'chat:write',
      'channels:read',
      'channels:history',
      'users:read',
      'files:write',
      'reactions:write'
    ],
    supportedActions: [
      'send_message',
      'send_dm',
      'create_channel',
      'invite_to_channel',
      'upload_file',
      'add_reaction',
      'set_topic',
      'pin_message'
    ],
    supportedTriggers: [
      'message_received',
      'mention_received',
      'reaction_added',
      'channel_created',
      'user_joined'
    ]
  };

  private baseUrl = 'https://slack.com/api';

  async initialize(): Promise<boolean> {
    if (!this.config.accessToken) {
      throw new Error('Slack requires an access token');
    }

    // Verify connection
    try {
      const response = await fetch(`${this.baseUrl}/auth.test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      return data.ok;
    } catch (error) {
      console.error('Slack initialization failed:', error);
      return false;
    }
  }

  async fetchData(endpoint: string, params?: Record<string, any>): Promise<IntegrationData> {
    const url = new URL(`${this.baseUrl}/${endpoint}`);
    
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: params ? JSON.stringify(params) : undefined
    });

    if (!response.ok) {
      throw new Error(`Slack fetch failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error}`);
    }
    
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
      throw new Error(`Slack push failed: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.ok) {
      throw new Error(`Slack API error: ${result.error}`);
    }
    
    return this.transformToCommon(result);
  }

  async getAvailableFields(): Promise<string[]> {
    return [
      'channel',
      'user',
      'text',
      'ts',
      'thread_ts',
      'type',
      'subtype',
      'username',
      'bot_id',
      'attachments',
      'blocks',
      'reactions'
    ];
  }

  // Slack-specific methods
  async sendMessage(channel: string, text: string, blocks?: any[]): Promise<IntegrationData> {
    const payload: any = {
      channel,
      text
    };

    if (blocks) {
      payload.blocks = blocks;
    }

    return this.pushData('chat.postMessage', payload);
  }

  async sendDirectMessage(userId: string, text: string): Promise<IntegrationData> {
    // First, open a conversation with the user
    const conversation = await this.pushData('conversations.open', {
      users: userId
    });

    // Then send the message
    return this.sendMessage(conversation.data.channel.id, text);
  }

  async getChannels(): Promise<IntegrationData> {
    return this.fetchData('conversations.list', {
      types: 'public_channel,private_channel'
    });
  }

  async getUsers(): Promise<IntegrationData> {
    return this.fetchData('users.list');
  }

  async createChannel(name: string, isPrivate: boolean = false): Promise<IntegrationData> {
    return this.pushData('conversations.create', {
      name,
      is_private: isPrivate
    });
  }

  async inviteToChannel(channel: string, users: string[]): Promise<IntegrationData> {
    return this.pushData('conversations.invite', {
      channel,
      users: users.join(',')
    });
  }

  async uploadFile(channels: string[], content: string, filename: string, title?: string): Promise<IntegrationData> {
    return this.pushData('files.upload', {
      channels: channels.join(','),
      content,
      filename,
      title: title || filename
    });
  }

  async addReaction(channel: string, timestamp: string, emoji: string): Promise<IntegrationData> {
    return this.pushData('reactions.add', {
      channel,
      timestamp,
      name: emoji
    });
  }

  async handleWebhook(payload: any): Promise<IntegrationData> {
    // Handle Slack events
    if (payload.type === 'url_verification') {
      return this.transformToCommon({ challenge: payload.challenge });
    }

    // Process event
    return this.transformToCommon({
      event: payload.event,
      team_id: payload.team_id,
      processed: true
    });
  }
}