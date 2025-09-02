/**
 * Skill Configuration System
 * Centralized configuration for all skill API keys and settings
 */

export interface SkillApiConfig {
  // Communication APIs
  sendgrid?: {
    apiKey: string;
    fromEmail: string;
    fromName?: string;
  };
  twilio?: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
  slack?: {
    botToken: string;
    signingSecret: string;
  };
  discord?: {
    botToken: string;
    clientId: string;
  };
  telegram?: {
    botToken: string;
  };

  // Payment APIs
  stripe?: {
    secretKey: string;
    webhookSecret?: string;
  };
  paypal?: {
    clientId: string;
    clientSecret: string;
    mode: 'sandbox' | 'production';
  };

  // CRM APIs
  salesforce?: {
    clientId: string;
    clientSecret: string;
    username: string;
    password: string;
    securityToken: string;
  };
  hubspot?: {
    apiKey: string;
  };

  // AI/ML APIs
  openai?: {
    apiKey: string;
    organization?: string;
    model?: string;
  };
  anthropic?: {
    apiKey: string;
  };
  googleCloud?: {
    projectId: string;
    keyFile: string;
  };
  aws?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
  };

  // Database Connections
  databases?: {
    postgresql?: {
      host: string;
      port: number;
      database: string;
      user: string;
      password: string;
      ssl?: boolean;
    };
    mongodb?: {
      uri: string;
      database: string;
    };
    mysql?: {
      host: string;
      port: number;
      database: string;
      user: string;
      password: string;
    };
    redis?: {
      host: string;
      port: number;
      password?: string;
    };
  };

  // Storage Services
  s3?: {
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    region: string;
  };
  googleDrive?: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
  };
  dropbox?: {
    accessToken: string;
  };

  // Analytics Services
  googleAnalytics?: {
    trackingId: string;
    viewId?: string;
  };
  mixpanel?: {
    token: string;
    apiSecret?: string;
  };
  segment?: {
    writeKey: string;
  };

  // Other Services
  github?: {
    token: string;
  };
  jira?: {
    host: string;
    email: string;
    apiToken: string;
  };
  zoom?: {
    apiKey: string;
    apiSecret: string;
  };
}

export class SkillConfigManager {
  private static instance: SkillConfigManager;
  private config: SkillApiConfig = {};
  private encryptionKey?: string;

  private constructor() {
    this.loadFromEnvironment();
  }

  public static getInstance(): SkillConfigManager {
    if (!SkillConfigManager.instance) {
      SkillConfigManager.instance = new SkillConfigManager();
    }
    return SkillConfigManager.instance;
  }

  /**
   * Load configuration from environment variables
   */
  private loadFromEnvironment(): void {
    this.config = {
      sendgrid: process.env.SENDGRID_API_KEY ? {
        apiKey: process.env.SENDGRID_API_KEY,
        fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@intelagent.ai',
        fromName: process.env.SENDGRID_FROM_NAME || 'Intelagent'
      } : undefined,

      twilio: process.env.TWILIO_ACCOUNT_SID ? {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN!,
        fromNumber: process.env.TWILIO_FROM_NUMBER!
      } : undefined,

      slack: process.env.SLACK_BOT_TOKEN ? {
        botToken: process.env.SLACK_BOT_TOKEN,
        signingSecret: process.env.SLACK_SIGNING_SECRET!
      } : undefined,

      stripe: process.env.STRIPE_SECRET_KEY ? {
        secretKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
      } : undefined,

      paypal: process.env.PAYPAL_CLIENT_ID ? {
        clientId: process.env.PAYPAL_CLIENT_ID,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET!,
        mode: (process.env.PAYPAL_MODE as 'sandbox' | 'production') || 'sandbox'
      } : undefined,

      openai: process.env.OPENAI_API_KEY ? {
        apiKey: process.env.OPENAI_API_KEY,
        organization: process.env.OPENAI_ORGANIZATION,
        model: process.env.OPENAI_MODEL || 'gpt-4'
      } : undefined,

      aws: process.env.AWS_ACCESS_KEY_ID ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        region: process.env.AWS_REGION || 'us-east-1'
      } : undefined,

      databases: {
        postgresql: process.env.POSTGRES_HOST ? {
          host: process.env.POSTGRES_HOST,
          port: parseInt(process.env.POSTGRES_PORT || '5432'),
          database: process.env.POSTGRES_DATABASE!,
          user: process.env.POSTGRES_USER!,
          password: process.env.POSTGRES_PASSWORD!,
          ssl: process.env.POSTGRES_SSL === 'true'
        } : undefined,

        mongodb: process.env.MONGODB_URI ? {
          uri: process.env.MONGODB_URI,
          database: process.env.MONGODB_DATABASE || 'intelagent'
        } : undefined,

        redis: process.env.REDIS_HOST ? {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD
        } : undefined
      }
    };
  }

  /**
   * Get configuration for a specific service
   */
  public getConfig<K extends keyof SkillApiConfig>(service: K): SkillApiConfig[K] {
    return this.config[service];
  }

  /**
   * Set configuration for a specific service
   */
  public setConfig<K extends keyof SkillApiConfig>(
    service: K,
    config: SkillApiConfig[K]
  ): void {
    this.config[service] = config;
  }

  /**
   * Update configuration from database (for user-specific API keys)
   */
  public async loadUserConfig(licenseKey: string): Promise<void> {
    // This would load user-specific API configurations from database
    // For now, using environment variables
    console.log(`Loading config for license: ${licenseKey}`);
  }

  /**
   * Validate that required config exists for a skill
   */
  public hasConfig(service: keyof SkillApiConfig): boolean {
    return !!this.config[service];
  }

  /**
   * Get all configured services
   */
  public getConfiguredServices(): string[] {
    return Object.keys(this.config).filter(key => 
      this.config[key as keyof SkillApiConfig] !== undefined
    );
  }

  /**
   * Check if skill can be used (has required config)
   */
  public canUseSkill(skillId: string): boolean {
    const configMap: Record<string, keyof SkillApiConfig> = {
      'email_composer': 'sendgrid',
      'sms_sender': 'twilio',
      'slack_integration': 'slack',
      'stripe_payment': 'stripe',
      'paypal_payment': 'paypal',
      'salesforce_connector': 'salesforce',
      'hubspot_connector': 'hubspot',
      'text_classifier': 'openai',
      'content_generator': 'openai',
      'aws_s3': 's3',
      'google_drive': 'googleDrive',
      'dropbox_connector': 'dropbox'
    };

    const requiredConfig = configMap[skillId];
    return !requiredConfig || this.hasConfig(requiredConfig);
  }
}