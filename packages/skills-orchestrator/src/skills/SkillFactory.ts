/**
 * Skill Factory
 * Defines and creates all 125+ skills in the system
 */

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  requiredParams?: string[];
  optionalParams?: string[];
  outputFormat?: string;
  examples?: any[];
  isPremium?: boolean;
}

export class SkillFactory {
  private static skillDefinitions: Map<string, SkillDefinition> = new Map();
  
  static {
    // Initialize all skill definitions
    SkillFactory.initializeSkills();
  }
  
  private static initializeSkills() {
    // ============ COMMUNICATION SKILLS (20) ============
    this.addSkill({
      id: 'email_composer',
      name: 'Email Composer',
      description: 'Compose professional emails with AI assistance',
      category: 'communication',
      tags: ['email', 'writing', 'ai'],
      requiredParams: ['recipient', 'subject'],
      optionalParams: ['tone', 'template', 'attachments']
    });
    
    this.addSkill({
      id: 'email_parser',
      name: 'Email Parser',
      description: 'Extract structured data from emails',
      category: 'communication',
      tags: ['email', 'parsing', 'extraction']
    });
    
    this.addSkill({
      id: 'sms_sender',
      name: 'SMS Sender',
      description: 'Send SMS messages via multiple providers',
      category: 'communication',
      tags: ['sms', 'messaging', 'notification']
    });
    
    this.addSkill({
      id: 'slack_integration',
      name: 'Slack Integration',
      description: 'Send messages and interact with Slack',
      category: 'communication',
      tags: ['slack', 'messaging', 'integration']
    });
    
    this.addSkill({
      id: 'teams_integration',
      name: 'Teams Integration',
      description: 'Microsoft Teams messaging and notifications',
      category: 'communication',
      tags: ['teams', 'microsoft', 'messaging']
    });
    
    this.addSkill({
      id: 'discord_bot',
      name: 'Discord Bot',
      description: 'Discord server automation and messaging',
      category: 'communication',
      tags: ['discord', 'bot', 'gaming']
    });
    
    this.addSkill({
      id: 'whatsapp_sender',
      name: 'WhatsApp Sender',
      description: 'Send WhatsApp messages via Business API',
      category: 'communication',
      tags: ['whatsapp', 'messaging', 'mobile']
    });
    
    this.addSkill({
      id: 'telegram_bot',
      name: 'Telegram Bot',
      description: 'Telegram bot interactions and automation',
      category: 'communication',
      tags: ['telegram', 'bot', 'messaging']
    });
    
    this.addSkill({
      id: 'voice_call',
      name: 'Voice Call',
      description: 'Initiate and manage voice calls',
      category: 'communication',
      tags: ['voice', 'call', 'telephony']
    });
    
    this.addSkill({
      id: 'video_conference',
      name: 'Video Conference',
      description: 'Create and manage video conferences',
      category: 'communication',
      tags: ['video', 'conference', 'meeting']
    });
    
    this.addSkill({
      id: 'calendar_scheduler',
      name: 'Calendar Scheduler',
      description: 'Schedule and manage calendar events',
      category: 'communication',
      tags: ['calendar', 'scheduling', 'events']
    });
    
    this.addSkill({
      id: 'push_notification',
      name: 'Push Notification',
      description: 'Send push notifications to mobile/web',
      category: 'communication',
      tags: ['push', 'notification', 'mobile']
    });
    
    this.addSkill({
      id: 'webhook_sender',
      name: 'Webhook Sender',
      description: 'Send data to webhooks',
      category: 'communication',
      tags: ['webhook', 'api', 'integration']
    });
    
    this.addSkill({
      id: 'rss_publisher',
      name: 'RSS Publisher',
      description: 'Publish content to RSS feeds',
      category: 'communication',
      tags: ['rss', 'feed', 'publishing']
    });
    
    this.addSkill({
      id: 'social_poster',
      name: 'Social Media Poster',
      description: 'Post to multiple social media platforms',
      category: 'communication',
      tags: ['social', 'media', 'posting']
    });
    
    this.addSkill({
      id: 'comment_moderator',
      name: 'Comment Moderator',
      description: 'Moderate comments with AI filtering',
      category: 'communication',
      tags: ['moderation', 'comments', 'ai']
    });
    
    // Chatbot workflow skills
    this.addSkill({
      id: 'search_strategy',
      name: 'Search Strategy',
      description: 'Intelligent search strategist that selects the best pages to scrape',
      category: 'ai_powered',
      tags: ['search', 'strategy', 'ai', 'chatbot']
    });
    
    this.addSkill({
      id: 'response_creator',
      name: 'Response Creator',
      description: 'Creates concise, helpful responses with hyperlinks',
      category: 'ai_powered',
      tags: ['response', 'ai', 'chatbot', 'conversation']
    });
    
    this.addSkill({
      id: 'translation',
      name: 'Language Translation',
      description: 'Translate text between languages',
      category: 'communication',
      tags: ['translation', 'language', 'i18n']
    });
    
    this.addSkill({
      id: 'transcription',
      name: 'Audio Transcription',
      description: 'Convert audio to text',
      category: 'communication',
      tags: ['transcription', 'audio', 'speech']
    });
    
    this.addSkill({
      id: 'text_to_speech',
      name: 'Text to Speech',
      description: 'Convert text to natural speech',
      category: 'communication',
      tags: ['tts', 'speech', 'audio']
    });
    
    // Multilingual/SEO skills
    this.addSkill({
      id: 'translate-content_v1',
      name: 'Translate Content',
      description: 'Translate web pages or HTML content with advanced caching and translation memory',
      category: 'communication',
      tags: ['translation', 'multilingual', 'i18n', 'localization', 'seo'],
      requiredParams: ['locale'],
      optionalParams: ['url', 'html'],
      isPremium: true
    });
    
    this.addSkill({
      id: 'generate-sitemap_v1',
      name: 'Generate Multilingual Sitemap',
      description: 'Generate localized sitemaps for SEO optimization across multiple languages',
      category: 'seo',
      tags: ['sitemap', 'seo', 'multilingual', 'localization', 'indexing'],
      requiredParams: ['locales'],
      optionalParams: ['baseUrl', 'urls'],
      isPremium: true
    });
    
    this.addSkill({
      id: 'inject-hreflang_v1',
      name: 'Inject Hreflang Tags',
      description: 'Generate and inject hreflang tags for multilingual SEO optimization',
      category: 'seo',
      tags: ['hreflang', 'seo', 'multilingual', 'localization', 'international'],
      requiredParams: ['url', 'locales'],
      optionalParams: ['currentLocale'],
      isPremium: true
    });
    
    this.addSkill({
      id: 'signature_generator',
      name: 'Email Signature Generator',
      description: 'Create professional email signatures',
      category: 'communication',
      tags: ['signature', 'email', 'branding']
    });

    // ============ DATA PROCESSING SKILLS (25) ============
    this.addSkill({
      id: 'csv_parser',
      name: 'CSV Parser',
      description: 'Parse and process CSV files',
      category: 'data_processing',
      tags: ['csv', 'parsing', 'data']
    });
    
    this.addSkill({
      id: 'json_transformer',
      name: 'JSON Transformer',
      description: 'Transform and manipulate JSON data',
      category: 'data_processing',
      tags: ['json', 'transformation', 'data']
    });
    
    this.addSkill({
      id: 'xml_processor',
      name: 'XML Processor',
      description: 'Process and validate XML documents',
      category: 'data_processing',
      tags: ['xml', 'parsing', 'validation']
    });
    
    this.addSkill({
      id: 'excel_handler',
      name: 'Excel Handler',
      description: 'Read and write Excel files',
      category: 'data_processing',
      tags: ['excel', 'spreadsheet', 'data']
    });
    
    this.addSkill({
      id: 'pdf_generator',
      name: 'PDF Generator',
      description: 'Generate PDF documents from data',
      category: 'data_processing',
      tags: ['pdf', 'document', 'generation']
    });
    
    this.addSkill({
      id: 'pdf_extractor',
      name: 'PDF Extractor',
      description: 'Extract text and data from PDFs',
      category: 'data_processing',
      tags: ['pdf', 'extraction', 'ocr']
    });
    
    this.addSkill({
      id: 'image_processor',
      name: 'Image Processor',
      description: 'Resize, crop, and transform images',
      category: 'data_processing',
      tags: ['image', 'processing', 'media']
    });
    
    this.addSkill({
      id: 'video_encoder',
      name: 'Video Encoder',
      description: 'Encode and compress videos',
      category: 'data_processing',
      tags: ['video', 'encoding', 'media']
    });
    
    this.addSkill({
      id: 'data_validator',
      name: 'Data Validator',
      description: 'Validate data against schemas',
      category: 'data_processing',
      tags: ['validation', 'schema', 'quality']
    });
    
    this.addSkill({
      id: 'data_cleaner',
      name: 'Data Cleaner',
      description: 'Clean and standardize data',
      category: 'data_processing',
      tags: ['cleaning', 'standardization', 'quality']
    });
    
    this.addSkill({
      id: 'deduplicator',
      name: 'Data Deduplicator',
      description: 'Remove duplicate records',
      category: 'data_processing',
      tags: ['deduplication', 'cleaning', 'optimization']
    });
    
    this.addSkill({
      id: 'data_merger',
      name: 'Data Merger',
      description: 'Merge multiple data sources',
      category: 'data_processing',
      tags: ['merge', 'integration', 'etl']
    });
    
    this.addSkill({
      id: 'data_splitter',
      name: 'Data Splitter',
      description: 'Split data into chunks',
      category: 'data_processing',
      tags: ['split', 'chunking', 'partition']
    });
    
    this.addSkill({
      id: 'data_aggregator',
      name: 'Data Aggregator',
      description: 'Aggregate and summarize data',
      category: 'data_processing',
      tags: ['aggregation', 'summary', 'analytics']
    });
    
    this.addSkill({
      id: 'data_enricher',
      name: 'Data Enricher',
      description: 'Enrich data with external sources',
      category: 'data_processing',
      tags: ['enrichment', 'augmentation', 'integration']
    });
    
    this.addSkill({
      id: 'geocoder',
      name: 'Geocoder',
      description: 'Convert addresses to coordinates',
      category: 'data_processing',
      tags: ['geocoding', 'location', 'maps']
    });
    
    this.addSkill({
      id: 'reverse_geocoder',
      name: 'Reverse Geocoder',
      description: 'Convert coordinates to addresses',
      category: 'data_processing',
      tags: ['geocoding', 'location', 'maps']
    });
    
    this.addSkill({
      id: 'barcode_generator',
      name: 'Barcode Generator',
      description: 'Generate various barcode formats',
      category: 'data_processing',
      tags: ['barcode', 'qr', 'generation']
    });
    
    this.addSkill({
      id: 'barcode_scanner',
      name: 'Barcode Scanner',
      description: 'Scan and decode barcodes',
      category: 'data_processing',
      tags: ['barcode', 'scanning', 'decoding']
    });
    
    this.addSkill({
      id: 'encryption',
      name: 'Data Encryption',
      description: 'Encrypt sensitive data',
      category: 'data_processing',
      tags: ['encryption', 'security', 'crypto']
    });
    
    this.addSkill({
      id: 'decryption',
      name: 'Data Decryption',
      description: 'Decrypt encrypted data',
      category: 'data_processing',
      tags: ['decryption', 'security', 'crypto']
    });
    
    this.addSkill({
      id: 'hashing',
      name: 'Data Hashing',
      description: 'Generate hash values for data',
      category: 'data_processing',
      tags: ['hash', 'security', 'checksum']
    });
    
    this.addSkill({
      id: 'compression',
      name: 'Data Compression',
      description: 'Compress data for storage',
      category: 'data_processing',
      tags: ['compression', 'zip', 'storage']
    });
    
    this.addSkill({
      id: 'base64_encoder',
      name: 'Base64 Encoder',
      description: 'Encode data to Base64',
      category: 'data_processing',
      tags: ['base64', 'encoding', 'conversion']
    });
    
    this.addSkill({
      id: 'regex_matcher',
      name: 'Regex Matcher',
      description: 'Match patterns with regex',
      category: 'data_processing',
      tags: ['regex', 'pattern', 'matching']
    });

    // ============ INTEGRATION SKILLS (20) ============
    this.addSkill({
      id: 'salesforce_connector',
      name: 'Salesforce Connector',
      description: 'Integrate with Salesforce CRM',
      category: 'integration',
      tags: ['salesforce', 'crm', 'enterprise'],
      isPremium: true
    });
    
    this.addSkill({
      id: 'hubspot_connector',
      name: 'HubSpot Connector',
      description: 'Connect to HubSpot CRM',
      category: 'integration',
      tags: ['hubspot', 'crm', 'marketing']
    });
    
    this.addSkill({
      id: 'stripe_payment',
      name: 'Stripe Payment',
      description: 'Process payments via Stripe',
      category: 'integration',
      tags: ['stripe', 'payment', 'billing']
    });
    
    this.addSkill({
      id: 'paypal_payment',
      name: 'PayPal Payment',
      description: 'Handle PayPal transactions',
      category: 'integration',
      tags: ['paypal', 'payment', 'ecommerce']
    });
    
    this.addSkill({
      id: 'shopify_connector',
      name: 'Shopify Connector',
      description: 'Integrate with Shopify stores',
      category: 'integration',
      tags: ['shopify', 'ecommerce', 'store']
    });
    
    this.addSkill({
      id: 'woocommerce_connector',
      name: 'WooCommerce Connector',
      description: 'Connect to WooCommerce shops',
      category: 'integration',
      tags: ['woocommerce', 'wordpress', 'ecommerce']
    });
    
    this.addSkill({
      id: 'google_sheets',
      name: 'Google Sheets',
      description: 'Read and write Google Sheets',
      category: 'integration',
      tags: ['google', 'sheets', 'spreadsheet']
    });
    
    this.addSkill({
      id: 'google_drive',
      name: 'Google Drive',
      description: 'Manage Google Drive files',
      category: 'integration',
      tags: ['google', 'drive', 'storage']
    });
    
    this.addSkill({
      id: 'dropbox_connector',
      name: 'Dropbox Connector',
      description: 'Access Dropbox files',
      category: 'integration',
      tags: ['dropbox', 'storage', 'files']
    });
    
    this.addSkill({
      id: 'aws_s3',
      name: 'AWS S3',
      description: 'Manage AWS S3 buckets',
      category: 'integration',
      tags: ['aws', 's3', 'storage']
    });
    
    this.addSkill({
      id: 'github_integration',
      name: 'GitHub Integration',
      description: 'Interact with GitHub repos',
      category: 'integration',
      tags: ['github', 'git', 'development']
    });
    
    this.addSkill({
      id: 'jira_connector',
      name: 'Jira Connector',
      description: 'Manage Jira issues',
      category: 'integration',
      tags: ['jira', 'atlassian', 'project']
    });
    
    this.addSkill({
      id: 'trello_connector',
      name: 'Trello Connector',
      description: 'Manage Trello boards',
      category: 'integration',
      tags: ['trello', 'kanban', 'project']
    });
    
    this.addSkill({
      id: 'asana_connector',
      name: 'Asana Connector',
      description: 'Connect to Asana projects',
      category: 'integration',
      tags: ['asana', 'project', 'task']
    });
    
    this.addSkill({
      id: 'mailchimp_connector',
      name: 'Mailchimp Connector',
      description: 'Manage email campaigns',
      category: 'integration',
      tags: ['mailchimp', 'email', 'marketing']
    });
    
    this.addSkill({
      id: 'sendgrid_connector',
      name: 'SendGrid Connector',
      description: 'Send emails via SendGrid',
      category: 'integration',
      tags: ['sendgrid', 'email', 'transactional']
    });
    
    this.addSkill({
      id: 'twilio_connector',
      name: 'Twilio Connector',
      description: 'SMS and voice via Twilio',
      category: 'integration',
      tags: ['twilio', 'sms', 'voice']
    });
    
    this.addSkill({
      id: 'zoom_connector',
      name: 'Zoom Connector',
      description: 'Create Zoom meetings',
      category: 'integration',
      tags: ['zoom', 'video', 'meeting']
    });
    
    this.addSkill({
      id: 'linkedin_connector',
      name: 'LinkedIn Connector',
      description: 'Post to LinkedIn',
      category: 'integration',
      tags: ['linkedin', 'social', 'professional']
    });
    
    this.addSkill({
      id: 'twitter_connector',
      name: 'Twitter/X Connector',
      description: 'Post and interact on Twitter/X',
      category: 'integration',
      tags: ['twitter', 'x', 'social']
    });

    // ============ AI & ML SKILLS (15) ============
    this.addSkill({
      id: 'text_classifier',
      name: 'Text Classifier',
      description: 'Classify text into categories',
      category: 'ai_ml',
      tags: ['ai', 'classification', 'nlp'],
      isPremium: true
    });
    
    this.addSkill({
      id: 'sentiment_analyzer',
      name: 'Sentiment Analyzer',
      description: 'Analyze text sentiment',
      category: 'ai_ml',
      tags: ['ai', 'sentiment', 'nlp']
    });
    
    this.addSkill({
      id: 'entity_extractor',
      name: 'Entity Extractor',
      description: 'Extract entities from text',
      category: 'ai_ml',
      tags: ['ai', 'ner', 'extraction']
    });
    
    this.addSkill({
      id: 'text_summarizer',
      name: 'Text Summarizer',
      description: 'Summarize long texts',
      category: 'ai_ml',
      tags: ['ai', 'summary', 'nlp']
    });
    
    this.addSkill({
      id: 'content_generator',
      name: 'Content Generator',
      description: 'Generate content with AI',
      category: 'ai_ml',
      tags: ['ai', 'generation', 'content'],
      isPremium: true
    });
    
    this.addSkill({
      id: 'image_classifier',
      name: 'Image Classifier',
      description: 'Classify images with AI',
      category: 'ai_ml',
      tags: ['ai', 'image', 'vision']
    });
    
    this.addSkill({
      id: 'object_detector',
      name: 'Object Detector',
      description: 'Detect objects in images',
      category: 'ai_ml',
      tags: ['ai', 'detection', 'vision']
    });
    
    this.addSkill({
      id: 'face_recognizer',
      name: 'Face Recognizer',
      description: 'Recognize faces in images',
      category: 'ai_ml',
      tags: ['ai', 'face', 'biometric']
    });
    
    this.addSkill({
      id: 'anomaly_detector',
      name: 'Anomaly Detector',
      description: 'Detect anomalies in data',
      category: 'ai_ml',
      tags: ['ai', 'anomaly', 'detection']
    });
    
    this.addSkill({
      id: 'predictive_analytics',
      name: 'Predictive Analytics',
      description: 'Predict future trends',
      category: 'ai_ml',
      tags: ['ai', 'prediction', 'analytics'],
      isPremium: true
    });
    
    this.addSkill({
      id: 'recommendation_engine',
      name: 'Recommendation Engine',
      description: 'Generate personalized recommendations',
      category: 'ai_ml',
      tags: ['ai', 'recommendation', 'personalization']
    });
    
    this.addSkill({
      id: 'language_detector',
      name: 'Language Detector',
      description: 'Detect text language',
      category: 'ai_ml',
      tags: ['ai', 'language', 'detection']
    });
    
    this.addSkill({
      id: 'keyword_extractor',
      name: 'Keyword Extractor',
      description: 'Extract keywords from text',
      category: 'ai_ml',
      tags: ['ai', 'keywords', 'extraction']
    });
    
    this.addSkill({
      id: 'intent_classifier',
      name: 'Intent Classifier',
      description: 'Classify user intent',
      category: 'ai_ml',
      tags: ['ai', 'intent', 'chatbot']
    });
    
    this.addSkill({
      id: 'emotion_detector',
      name: 'Emotion Detector',
      description: 'Detect emotions in text/speech',
      category: 'ai_ml',
      tags: ['ai', 'emotion', 'analysis']
    });

    // ============ AUTOMATION SKILLS (15) ============
    this.addSkill({
      id: 'web_scraper',
      name: 'Web Scraper',
      description: 'Extract data from websites',
      category: 'automation',
      tags: ['scraping', 'web', 'extraction']
    });
    
    this.addSkill({
      id: 'form_filler',
      name: 'Form Filler',
      description: 'Automatically fill web forms',
      category: 'automation',
      tags: ['automation', 'forms', 'web']
    });
    
    this.addSkill({
      id: 'browser_automation',
      name: 'Browser Automation',
      description: 'Automate browser actions',
      category: 'automation',
      tags: ['browser', 'automation', 'selenium']
    });
    
    this.addSkill({
      id: 'task_scheduler',
      name: 'Task Scheduler',
      description: 'Schedule recurring tasks',
      category: 'automation',
      tags: ['scheduler', 'cron', 'automation']
    });
    
    this.addSkill({
      id: 'workflow_engine',
      name: 'Workflow Engine',
      description: 'Execute complex workflows',
      category: 'automation',
      tags: ['workflow', 'automation', 'orchestration']
    });
    
    this.addSkill({
      id: 'file_monitor',
      name: 'File Monitor',
      description: 'Monitor file changes',
      category: 'automation',
      tags: ['monitor', 'files', 'watcher']
    });
    
    this.addSkill({
      id: 'backup_automation',
      name: 'Backup Automation',
      description: 'Automate data backups',
      category: 'automation',
      tags: ['backup', 'automation', 'safety']
    });
    
    this.addSkill({
      id: 'deployment_automation',
      name: 'Deployment Automation',
      description: 'Automate deployments',
      category: 'automation',
      tags: ['deployment', 'ci/cd', 'automation']
    });
    
    this.addSkill({
      id: 'testing_automation',
      name: 'Testing Automation',
      description: 'Automate testing processes',
      category: 'automation',
      tags: ['testing', 'qa', 'automation']
    });
    
    this.addSkill({
      id: 'report_generator',
      name: 'Report Generator',
      description: 'Generate automated reports',
      category: 'automation',
      tags: ['reports', 'automation', 'analytics']
    });
    
    this.addSkill({
      id: 'alert_system',
      name: 'Alert System',
      description: 'Automated alerting system',
      category: 'automation',
      tags: ['alerts', 'monitoring', 'notification']
    });
    
    this.addSkill({
      id: 'data_pipeline',
      name: 'Data Pipeline',
      description: 'Automated data pipelines',
      category: 'automation',
      tags: ['pipeline', 'etl', 'automation']
    });
    
    this.addSkill({
      id: 'invoice_automation',
      name: 'Invoice Automation',
      description: 'Automate invoice processing',
      category: 'automation',
      tags: ['invoice', 'billing', 'automation']
    });
    
    this.addSkill({
      id: 'approval_workflow',
      name: 'Approval Workflow',
      description: 'Automated approval processes',
      category: 'automation',
      tags: ['approval', 'workflow', 'process']
    });
    
    this.addSkill({
      id: 'onboarding_automation',
      name: 'Onboarding Automation',
      description: 'Automate user onboarding',
      category: 'automation',
      tags: ['onboarding', 'user', 'automation']
    });

    // ============ UTILITY SKILLS (15) ============
    this.addSkill({
      id: 'calculator',
      name: 'Calculator',
      description: 'Perform calculations',
      category: 'utility',
      tags: ['math', 'calculator', 'computation']
    });
    
    this.addSkill({
      id: 'weather',
      name: 'Weather Service',
      description: 'Get weather information',
      category: 'utility',
      tags: ['weather', 'forecast', 'api']
    });
    
    this.addSkill({
      id: 'datetime',
      name: 'DateTime Utils',
      description: 'Date and time utilities',
      category: 'utility',
      tags: ['date', 'time', 'timezone']
    });
    
    this.addSkill({
      id: 'url_shortener',
      name: 'URL Shortener',
      description: 'Shorten long URLs',
      category: 'utility',
      tags: ['url', 'shortener', 'links']
    });
    
    this.addSkill({
      id: 'qr_generator',
      name: 'QR Code Generator',
      description: 'Generate QR codes',
      category: 'utility',
      tags: ['qr', 'code', 'generator']
    });
    
    this.addSkill({
      id: 'password_generator',
      name: 'Password Generator',
      description: 'Generate secure passwords',
      category: 'utility',
      tags: ['password', 'security', 'generator']
    });
    
    this.addSkill({
      id: 'uuid_generator',
      name: 'UUID Generator',
      description: 'Generate unique IDs',
      category: 'utility',
      tags: ['uuid', 'id', 'generator']
    });
    
    this.addSkill({
      id: 'color_converter',
      name: 'Color Converter',
      description: 'Convert color formats',
      category: 'utility',
      tags: ['color', 'converter', 'design']
    });
    
    this.addSkill({
      id: 'unit_converter',
      name: 'Unit Converter',
      description: 'Convert between units',
      category: 'utility',
      tags: ['unit', 'converter', 'measurement']
    });
    
    this.addSkill({
      id: 'currency_converter',
      name: 'Currency Converter',
      description: 'Convert currencies',
      category: 'utility',
      tags: ['currency', 'exchange', 'finance']
    });
    
    this.addSkill({
      id: 'random_generator',
      name: 'Random Generator',
      description: 'Generate random data',
      category: 'utility',
      tags: ['random', 'generator', 'data']
    });
    
    this.addSkill({
      id: 'mock_data',
      name: 'Mock Data Generator',
      description: 'Generate test data',
      category: 'utility',
      tags: ['mock', 'test', 'data']
    });
    
    this.addSkill({
      id: 'ip_lookup',
      name: 'IP Lookup',
      description: 'Get IP information',
      category: 'utility',
      tags: ['ip', 'lookup', 'network']
    });
    
    this.addSkill({
      id: 'dns_lookup',
      name: 'DNS Lookup',
      description: 'DNS record lookup',
      category: 'utility',
      tags: ['dns', 'lookup', 'network']
    });
    
    this.addSkill({
      id: 'whois_lookup',
      name: 'WHOIS Lookup',
      description: 'Domain WHOIS information',
      category: 'utility',
      tags: ['whois', 'domain', 'lookup']
    });

    // ============ ANALYTICS SKILLS (15) ============
    this.addSkill({
      id: 'google_analytics',
      name: 'Google Analytics',
      description: 'Track website analytics',
      category: 'analytics',
      tags: ['google', 'analytics', 'tracking']
    });
    
    this.addSkill({
      id: 'mixpanel_tracker',
      name: 'Mixpanel Tracker',
      description: 'Event tracking with Mixpanel',
      category: 'analytics',
      tags: ['mixpanel', 'events', 'tracking']
    });
    
    this.addSkill({
      id: 'segment_tracker',
      name: 'Segment Tracker',
      description: 'Customer data platform',
      category: 'analytics',
      tags: ['segment', 'cdp', 'tracking']
    });
    
    this.addSkill({
      id: 'heatmap_generator',
      name: 'Heatmap Generator',
      description: 'Generate usage heatmaps',
      category: 'analytics',
      tags: ['heatmap', 'visualization', 'ux']
    });
    
    this.addSkill({
      id: 'ab_testing',
      name: 'A/B Testing',
      description: 'Run A/B tests',
      category: 'analytics',
      tags: ['testing', 'optimization', 'conversion']
    });
    
    this.addSkill({
      id: 'conversion_tracker',
      name: 'Conversion Tracker',
      description: 'Track conversions',
      category: 'analytics',
      tags: ['conversion', 'tracking', 'roi']
    });
    
    this.addSkill({
      id: 'funnel_analyzer',
      name: 'Funnel Analyzer',
      description: 'Analyze conversion funnels',
      category: 'analytics',
      tags: ['funnel', 'conversion', 'analytics']
    });
    
    this.addSkill({
      id: 'cohort_analyzer',
      name: 'Cohort Analyzer',
      description: 'Cohort analysis',
      category: 'analytics',
      tags: ['cohort', 'retention', 'analytics']
    });
    
    this.addSkill({
      id: 'revenue_tracker',
      name: 'Revenue Tracker',
      description: 'Track revenue metrics',
      category: 'analytics',
      tags: ['revenue', 'mrr', 'finance']
    });
    
    this.addSkill({
      id: 'user_behavior',
      name: 'User Behavior Tracker',
      description: 'Track user behavior',
      category: 'analytics',
      tags: ['behavior', 'user', 'tracking']
    });
    
    this.addSkill({
      id: 'performance_monitor',
      name: 'Performance Monitor',
      description: 'Monitor app performance',
      category: 'analytics',
      tags: ['performance', 'monitoring', 'speed']
    });
    
    this.addSkill({
      id: 'error_tracker',
      name: 'Error Tracker',
      description: 'Track application errors',
      category: 'analytics',
      tags: ['error', 'debugging', 'monitoring']
    });
    
    this.addSkill({
      id: 'seo_analyzer',
      name: 'SEO Analyzer',
      description: 'Analyze SEO performance',
      category: 'analytics',
      tags: ['seo', 'search', 'optimization']
    });
    
    this.addSkill({
      id: 'social_analytics',
      name: 'Social Media Analytics',
      description: 'Track social metrics',
      category: 'analytics',
      tags: ['social', 'metrics', 'engagement']
    });
    
    this.addSkill({
      id: 'custom_metrics',
      name: 'Custom Metrics',
      description: 'Track custom metrics',
      category: 'analytics',
      tags: ['custom', 'metrics', 'tracking']
    });
  }
  
  private static addSkill(definition: SkillDefinition) {
    this.skillDefinitions.set(definition.id, definition);
  }
  
  static getSkillDefinition(id: string): SkillDefinition | undefined {
    return this.skillDefinitions.get(id);
  }
  
  static getAllSkills(): SkillDefinition[] {
    return Array.from(this.skillDefinitions.values());
  }
  
  static getSkillsByCategory(category: string): SkillDefinition[] {
    return this.getAllSkills().filter(skill => skill.category === category);
  }
  
  static getSkillsByTag(tag: string): SkillDefinition[] {
    return this.getAllSkills().filter(skill => skill.tags.includes(tag));
  }
  
  static getPremiumSkills(): SkillDefinition[] {
    return this.getAllSkills().filter(skill => skill.isPremium);
  }
  
  static getSkillCount(): number {
    return this.skillDefinitions.size;
  }
  
  static getCategories(): string[] {
    const categories = new Set<string>();
    this.getAllSkills().forEach(skill => categories.add(skill.category));
    return Array.from(categories);
  }
  
  static searchSkills(query: string): SkillDefinition[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllSkills().filter(skill => 
      skill.name.toLowerCase().includes(lowerQuery) ||
      skill.description.toLowerCase().includes(lowerQuery) ||
      skill.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }
}