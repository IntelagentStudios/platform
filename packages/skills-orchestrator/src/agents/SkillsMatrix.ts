/**
 * Skills Matrix
 * Maps skills to responsible agents and manages skill assignments
 */

export interface SkillAssignment {
  skillId: string;
  skillName: string;
  primaryAgent: string;
  secondaryAgents?: string[];
  category: string;
  complexity: 'low' | 'medium' | 'high';
  dependencies?: string[];
}

export class SkillsMatrix {
  private static instance: SkillsMatrix;
  private skillAssignments = new Map<string, SkillAssignment>();
  private agentCapabilities = new Map<string, Set<string>>();
  
  private constructor() {
    this.initializeMatrix();
  }
  
  public static getInstance(): SkillsMatrix {
    if (!SkillsMatrix.instance) {
      SkillsMatrix.instance = new SkillsMatrix();
    }
    return SkillsMatrix.instance;
  }
  
  /**
   * Initialize the skills matrix with all 310 skills
   */
  private initializeMatrix(): void {
    // Finance Agent Skills (30)
    this.assignSkillsToAgent('finance', [
      { id: 'invoice_generator', name: 'Invoice Generator', category: 'billing', complexity: 'medium' },
      { id: 'payment_processor', name: 'Payment Processor', category: 'payments', complexity: 'high' },
      { id: 'stripe_payment', name: 'Stripe Payment', category: 'payments', complexity: 'high' },
      { id: 'paypal_payment', name: 'PayPal Payment', category: 'payments', complexity: 'high' },
      { id: 'revenue_tracker', name: 'Revenue Tracker', category: 'analytics', complexity: 'medium' },
      { id: 'expense_monitor', name: 'Expense Monitor', category: 'accounting', complexity: 'medium' },
      { id: 'budget_planner', name: 'Budget Planner', category: 'planning', complexity: 'medium' },
      { id: 'tax_calculator', name: 'Tax Calculator', category: 'compliance', complexity: 'high' },
      { id: 'financial_reporter', name: 'Financial Reporter', category: 'reporting', complexity: 'medium' },
      { id: 'subscription_manager', name: 'Subscription Manager', category: 'billing', complexity: 'medium' },
      { id: 'refund_processor', name: 'Refund Processor', category: 'payments', complexity: 'medium' },
      { id: 'currency_converter', name: 'Currency Converter', category: 'utilities', complexity: 'low' },
      { id: 'pricing_optimizer', name: 'Pricing Optimizer', category: 'analytics', complexity: 'high' },
      { id: 'billing_automation', name: 'Billing Automation', category: 'automation', complexity: 'high' },
      { id: 'payment_gateway', name: 'Payment Gateway', category: 'integration', complexity: 'high' },
      { id: 'invoice_automation', name: 'Invoice Automation', category: 'automation', complexity: 'medium' },
      { id: 'financial_dashboard', name: 'Financial Dashboard', category: 'reporting', complexity: 'medium' },
      { id: 'cost_analyzer', name: 'Cost Analyzer', category: 'analytics', complexity: 'medium' },
      { id: 'profit_calculator', name: 'Profit Calculator', category: 'analytics', complexity: 'low' },
      { id: 'payment_reminder', name: 'Payment Reminder', category: 'notifications', complexity: 'low' },
      { id: 'credit_checker', name: 'Credit Checker', category: 'validation', complexity: 'medium' },
      { id: 'fraud_detector', name: 'Fraud Detector', category: 'security', complexity: 'high' },
      { id: 'chargeback_handler', name: 'Chargeback Handler', category: 'disputes', complexity: 'high' },
      { id: 'dunning_manager', name: 'Dunning Manager', category: 'collections', complexity: 'medium' },
      { id: 'revenue_recognition', name: 'Revenue Recognition', category: 'accounting', complexity: 'high' },
      { id: 'cashflow_forecaster', name: 'Cashflow Forecaster', category: 'planning', complexity: 'high' },
      { id: 'payment_reconciliation', name: 'Payment Reconciliation', category: 'accounting', complexity: 'medium' },
      { id: 'commission_calculator', name: 'Commission Calculator', category: 'payroll', complexity: 'medium' },
      { id: 'royalty_tracker', name: 'Royalty Tracker', category: 'payments', complexity: 'medium' },
      { id: 'financial_audit', name: 'Financial Audit', category: 'compliance', complexity: 'high' }
    ]);
    
    // Operations Agent Skills (80)
    this.assignSkillsToAgent('operations', [
      { id: 'task_scheduler', name: 'Task Scheduler', category: 'automation', complexity: 'medium' },
      { id: 'workflow_engine', name: 'Workflow Engine', category: 'automation', complexity: 'high' },
      { id: 'email_sender', name: 'Email Sender', category: 'communication', complexity: 'low' },
      { id: 'sms_sender', name: 'SMS Sender', category: 'communication', complexity: 'low' },
      { id: 'push_notification', name: 'Push Notification', category: 'communication', complexity: 'low' },
      { id: 'calendar_scheduler', name: 'Calendar Scheduler', category: 'scheduling', complexity: 'medium' },
      { id: 'approval_workflow', name: 'Approval Workflow', category: 'workflow', complexity: 'medium' },
      { id: 'data_aggregator', name: 'Data Aggregator', category: 'data', complexity: 'medium' },
      { id: 'report_generator', name: 'Report Generator', category: 'reporting', complexity: 'medium' },
      { id: 'pdf_generator', name: 'PDF Generator', category: 'documents', complexity: 'medium' },
      { id: 'excel_handler', name: 'Excel Handler', category: 'documents', complexity: 'medium' },
      { id: 'csv_parser', name: 'CSV Parser', category: 'data', complexity: 'low' },
      { id: 'json_transformer', name: 'JSON Transformer', category: 'data', complexity: 'low' },
      { id: 'xml_processor', name: 'XML Processor', category: 'data', complexity: 'medium' },
      { id: 'web_scraper', name: 'Web Scraper', category: 'data', complexity: 'medium' },
      { id: 'form_filler', name: 'Form Filler', category: 'automation', complexity: 'medium' },
      { id: 'browser_automation', name: 'Browser Automation', category: 'automation', complexity: 'high' },
      { id: 'testing_automation', name: 'Testing Automation', category: 'quality', complexity: 'high' },
      { id: 'deployment_automation', name: 'Deployment Automation', category: 'devops', complexity: 'high' },
      { id: 'backup_automation', name: 'Backup Automation', category: 'maintenance', complexity: 'medium' },
      { id: 'file_monitor', name: 'File Monitor', category: 'monitoring', complexity: 'low' },
      { id: 'alert_system', name: 'Alert System', category: 'monitoring', complexity: 'medium' },
      { id: 'notification_hub', name: 'Notification Hub', category: 'communication', complexity: 'medium' },
      { id: 'queue_manager', name: 'Queue Manager', category: 'infrastructure', complexity: 'medium' },
      { id: 'batch_processor', name: 'Batch Processor', category: 'processing', complexity: 'medium' },
      { id: 'data_pipeline', name: 'Data Pipeline', category: 'data', complexity: 'high' },
      { id: 'etl_processor', name: 'ETL Processor', category: 'data', complexity: 'high' },
      { id: 'data_cleaner', name: 'Data Cleaner', category: 'data', complexity: 'medium' },
      { id: 'data_validator', name: 'Data Validator', category: 'quality', complexity: 'medium' },
      { id: 'data_merger', name: 'Data Merger', category: 'data', complexity: 'medium' },
      { id: 'data_splitter', name: 'Data Splitter', category: 'data', complexity: 'low' },
      { id: 'deduplicator', name: 'Deduplicator', category: 'data', complexity: 'medium' },
      { id: 'content_generator', name: 'Content Generator', category: 'content', complexity: 'high' },
      { id: 'translation', name: 'Translation', category: 'localization', complexity: 'medium' },
      { id: 'text_classifier', name: 'Text Classifier', category: 'ml', complexity: 'high' },
      { id: 'sentiment_analyzer', name: 'Sentiment Analyzer', category: 'ml', complexity: 'high' },
      { id: 'entity_extractor', name: 'Entity Extractor', category: 'ml', complexity: 'high' },
      { id: 'keyword_extractor', name: 'Keyword Extractor', category: 'ml', complexity: 'medium' },
      { id: 'intent_classifier', name: 'Intent Classifier', category: 'ml', complexity: 'high' },
      { id: 'emotion_detector', name: 'Emotion Detector', category: 'ml', complexity: 'high' },
      { id: 'recommendation_engine', name: 'Recommendation Engine', category: 'ml', complexity: 'high' },
      { id: 'anomaly_detector', name: 'Anomaly Detector', category: 'ml', complexity: 'high' },
      { id: 'user_behavior', name: 'User Behavior', category: 'analytics', complexity: 'high' },
      { id: 'cohort_analyzer', name: 'Cohort Analyzer', category: 'analytics', complexity: 'high' },
      { id: 'funnel_analyzer', name: 'Funnel Analyzer', category: 'analytics', complexity: 'high' },
      { id: 'conversion_tracker', name: 'Conversion Tracker', category: 'analytics', complexity: 'medium' },
      { id: 'ab_testing', name: 'A/B Testing', category: 'optimization', complexity: 'high' },
      { id: 'custom_metrics', name: 'Custom Metrics', category: 'analytics', complexity: 'medium' },
      { id: 'performance_monitor', name: 'Performance Monitor', category: 'monitoring', complexity: 'medium' },
      { id: 'error_tracker', name: 'Error Tracker', category: 'monitoring', complexity: 'medium' },
      { id: 'onboarding_automation', name: 'Onboarding Automation', category: 'customer', complexity: 'high' },
      { id: 'survey_processor', name: 'Survey Processor', category: 'feedback', complexity: 'medium' },
      { id: 'feedback_analyzer', name: 'Feedback Analyzer', category: 'feedback', complexity: 'high' },
      { id: 'ticket_router', name: 'Ticket Router', category: 'support', complexity: 'medium' },
      { id: 'auto_responder', name: 'Auto Responder', category: 'support', complexity: 'low' },
      { id: 'chat_bot', name: 'Chat Bot', category: 'support', complexity: 'high' },
      { id: 'knowledge_base', name: 'Knowledge Base', category: 'support', complexity: 'medium' },
      { id: 'faq_generator', name: 'FAQ Generator', category: 'content', complexity: 'medium' },
      { id: 'documentation_builder', name: 'Documentation Builder', category: 'content', complexity: 'medium' },
      { id: 'changelog_generator', name: 'Changelog Generator', category: 'content', complexity: 'low' },
      { id: 'release_notes', name: 'Release Notes', category: 'content', complexity: 'low' },
      { id: 'project_tracker', name: 'Project Tracker', category: 'management', complexity: 'medium' },
      { id: 'milestone_tracker', name: 'Milestone Tracker', category: 'management', complexity: 'medium' },
      { id: 'resource_planner', name: 'Resource Planner', category: 'management', complexity: 'high' },
      { id: 'capacity_planner', name: 'Capacity Planner', category: 'management', complexity: 'high' },
      { id: 'team_coordinator', name: 'Team Coordinator', category: 'management', complexity: 'medium' },
      { id: 'meeting_scheduler', name: 'Meeting Scheduler', category: 'scheduling', complexity: 'medium' },
      { id: 'reminder_service', name: 'Reminder Service', category: 'notifications', complexity: 'low' },
      { id: 'deadline_tracker', name: 'Deadline Tracker', category: 'management', complexity: 'medium' },
      { id: 'priority_manager', name: 'Priority Manager', category: 'management', complexity: 'medium' },
      { id: 'workload_balancer', name: 'Workload Balancer', category: 'optimization', complexity: 'high' },
      { id: 'skill_matcher', name: 'Skill Matcher', category: 'hr', complexity: 'medium' },
      { id: 'training_tracker', name: 'Training Tracker', category: 'hr', complexity: 'medium' },
      { id: 'certification_manager', name: 'Certification Manager', category: 'hr', complexity: 'medium' },
      { id: 'compliance_checker', name: 'Compliance Checker', category: 'compliance', complexity: 'high' },
      { id: 'audit_logger', name: 'Audit Logger', category: 'compliance', complexity: 'medium' },
      { id: 'policy_enforcer', name: 'Policy Enforcer', category: 'compliance', complexity: 'high' },
      { id: 'rule_engine', name: 'Rule Engine', category: 'automation', complexity: 'high' },
      { id: 'decision_tree', name: 'Decision Tree', category: 'automation', complexity: 'high' },
      { id: 'state_machine', name: 'State Machine', category: 'automation', complexity: 'high' }
    ]);
    
    // Security Agent Skills (40)
    this.assignSkillsToAgent('security', [
      { id: 'encryptor', name: 'Encryptor', category: 'cryptography', complexity: 'high' },
      { id: 'decryptor', name: 'Decryptor', category: 'cryptography', complexity: 'high' },
      { id: 'hashing', name: 'Hashing', category: 'cryptography', complexity: 'medium' },
      { id: 'password_generator', name: 'Password Generator', category: 'authentication', complexity: 'low' },
      { id: 'two_factor_auth', name: 'Two Factor Auth', category: 'authentication', complexity: 'high' },
      { id: 'oauth_provider', name: 'OAuth Provider', category: 'authentication', complexity: 'high' },
      { id: 'jwt_manager', name: 'JWT Manager', category: 'authentication', complexity: 'medium' },
      { id: 'session_manager', name: 'Session Manager', category: 'authentication', complexity: 'medium' },
      { id: 'access_control', name: 'Access Control', category: 'authorization', complexity: 'high' },
      { id: 'permission_manager', name: 'Permission Manager', category: 'authorization', complexity: 'medium' },
      { id: 'role_manager', name: 'Role Manager', category: 'authorization', complexity: 'medium' },
      { id: 'security_scanner', name: 'Security Scanner', category: 'monitoring', complexity: 'high' },
      { id: 'vulnerability_scanner', name: 'Vulnerability Scanner', category: 'monitoring', complexity: 'high' },
      { id: 'intrusion_detector', name: 'Intrusion Detector', category: 'monitoring', complexity: 'high' },
      { id: 'threat_analyzer', name: 'Threat Analyzer', category: 'analysis', complexity: 'high' },
      { id: 'malware_scanner', name: 'Malware Scanner', category: 'protection', complexity: 'high' },
      { id: 'firewall_manager', name: 'Firewall Manager', category: 'protection', complexity: 'high' },
      { id: 'ddos_protection', name: 'DDoS Protection', category: 'protection', complexity: 'high' },
      { id: 'rate_limiter', name: 'Rate Limiter', category: 'protection', complexity: 'medium' },
      { id: 'ip_blocker', name: 'IP Blocker', category: 'protection', complexity: 'medium' },
      { id: 'geo_blocker', name: 'Geo Blocker', category: 'protection', complexity: 'medium' },
      { id: 'captcha_provider', name: 'Captcha Provider', category: 'validation', complexity: 'medium' },
      { id: 'bot_detector', name: 'Bot Detector', category: 'detection', complexity: 'high' },
      { id: 'fraud_detector_security', name: 'Fraud Detector', category: 'detection', complexity: 'high' },
      { id: 'anomaly_detector_security', name: 'Anomaly Detector', category: 'detection', complexity: 'high' },
      { id: 'data_masking', name: 'Data Masking', category: 'privacy', complexity: 'medium' },
      { id: 'data_anonymizer', name: 'Data Anonymizer', category: 'privacy', complexity: 'medium' },
      { id: 'pii_detector', name: 'PII Detector', category: 'privacy', complexity: 'high' },
      { id: 'gdpr_compliance', name: 'GDPR Compliance', category: 'compliance', complexity: 'high' },
      { id: 'ccpa_compliance', name: 'CCPA Compliance', category: 'compliance', complexity: 'high' },
      { id: 'hipaa_compliance', name: 'HIPAA Compliance', category: 'compliance', complexity: 'high' },
      { id: 'pci_compliance', name: 'PCI Compliance', category: 'compliance', complexity: 'high' },
      { id: 'audit_trail', name: 'Audit Trail', category: 'compliance', complexity: 'medium' },
      { id: 'activity_logger', name: 'Activity Logger', category: 'monitoring', complexity: 'low' },
      { id: 'security_reporter', name: 'Security Reporter', category: 'reporting', complexity: 'medium' },
      { id: 'incident_responder', name: 'Incident Responder', category: 'response', complexity: 'high' },
      { id: 'breach_detector', name: 'Breach Detector', category: 'detection', complexity: 'high' },
      { id: 'recovery_manager', name: 'Recovery Manager', category: 'response', complexity: 'high' },
      { id: 'backup_verifier', name: 'Backup Verifier', category: 'validation', complexity: 'medium' },
      { id: 'certificate_manager', name: 'Certificate Manager', category: 'cryptography', complexity: 'high' }
    ]);
    
    // Infrastructure Agent Skills (60)
    this.assignSkillsToAgent('infrastructure', [
      { id: 'database_connector', name: 'Database Connector', category: 'database', complexity: 'medium' },
      { id: 'cache_manager', name: 'Cache Manager', category: 'performance', complexity: 'medium' },
      { id: 'load_balancer', name: 'Load Balancer', category: 'scaling', complexity: 'high' },
      { id: 'auto_scaler', name: 'Auto Scaler', category: 'scaling', complexity: 'high' },
      { id: 'container_orchestrator', name: 'Container Orchestrator', category: 'deployment', complexity: 'high' },
      { id: 'kubernetes_manager', name: 'Kubernetes Manager', category: 'deployment', complexity: 'high' },
      { id: 'docker_manager', name: 'Docker Manager', category: 'deployment', complexity: 'medium' },
      { id: 'server_monitor', name: 'Server Monitor', category: 'monitoring', complexity: 'medium' },
      { id: 'resource_monitor', name: 'Resource Monitor', category: 'monitoring', complexity: 'medium' },
      { id: 'log_aggregator', name: 'Log Aggregator', category: 'logging', complexity: 'medium' },
      { id: 'log_analyzer', name: 'Log Analyzer', category: 'logging', complexity: 'high' },
      { id: 'metric_collector', name: 'Metric Collector', category: 'monitoring', complexity: 'medium' },
      { id: 'health_checker', name: 'Health Checker', category: 'monitoring', complexity: 'low' },
      { id: 'uptime_monitor', name: 'Uptime Monitor', category: 'monitoring', complexity: 'low' },
      { id: 'cdn_manager', name: 'CDN Manager', category: 'performance', complexity: 'medium' },
      { id: 'dns_manager', name: 'DNS Manager', category: 'networking', complexity: 'medium' },
      { id: 'ssl_manager', name: 'SSL Manager', category: 'security', complexity: 'medium' },
      { id: 'vpc_manager', name: 'VPC Manager', category: 'networking', complexity: 'high' },
      { id: 'subnet_manager', name: 'Subnet Manager', category: 'networking', complexity: 'medium' },
      { id: 'gateway_manager', name: 'Gateway Manager', category: 'networking', complexity: 'medium' },
      { id: 'proxy_manager', name: 'Proxy Manager', category: 'networking', complexity: 'medium' },
      { id: 'storage_manager', name: 'Storage Manager', category: 'storage', complexity: 'medium' },
      { id: 's3_manager', name: 'S3 Manager', category: 'storage', complexity: 'medium' },
      { id: 'blob_storage', name: 'Blob Storage', category: 'storage', complexity: 'medium' },
      { id: 'file_system', name: 'File System', category: 'storage', complexity: 'low' },
      { id: 'database_backup', name: 'Database Backup', category: 'backup', complexity: 'medium' },
      { id: 'snapshot_manager', name: 'Snapshot Manager', category: 'backup', complexity: 'medium' },
      { id: 'disaster_recovery', name: 'Disaster Recovery', category: 'backup', complexity: 'high' },
      { id: 'replication_manager', name: 'Replication Manager', category: 'database', complexity: 'high' },
      { id: 'migration_tool', name: 'Migration Tool', category: 'database', complexity: 'high' },
      { id: 'schema_manager', name: 'Schema Manager', category: 'database', complexity: 'medium' },
      { id: 'index_optimizer', name: 'Index Optimizer', category: 'database', complexity: 'high' },
      { id: 'query_optimizer', name: 'Query Optimizer', category: 'database', complexity: 'high' },
      { id: 'connection_pool', name: 'Connection Pool', category: 'database', complexity: 'medium' },
      { id: 'message_queue', name: 'Message Queue', category: 'messaging', complexity: 'medium' },
      { id: 'event_bus', name: 'Event Bus', category: 'messaging', complexity: 'medium' },
      { id: 'pub_sub', name: 'Pub/Sub', category: 'messaging', complexity: 'medium' },
      { id: 'stream_processor', name: 'Stream Processor', category: 'streaming', complexity: 'high' },
      { id: 'batch_scheduler', name: 'Batch Scheduler', category: 'scheduling', complexity: 'medium' },
      { id: 'cron_manager', name: 'Cron Manager', category: 'scheduling', complexity: 'low' },
      { id: 'service_mesh', name: 'Service Mesh', category: 'microservices', complexity: 'high' },
      { id: 'api_gateway', name: 'API Gateway', category: 'api', complexity: 'high' },
      { id: 'rate_limiter_infra', name: 'Rate Limiter', category: 'api', complexity: 'medium' },
      { id: 'circuit_breaker', name: 'Circuit Breaker', category: 'resilience', complexity: 'medium' },
      { id: 'retry_manager', name: 'Retry Manager', category: 'resilience', complexity: 'medium' },
      { id: 'timeout_manager', name: 'Timeout Manager', category: 'resilience', complexity: 'low' },
      { id: 'config_manager', name: 'Config Manager', category: 'configuration', complexity: 'medium' },
      { id: 'secret_manager', name: 'Secret Manager', category: 'security', complexity: 'high' },
      { id: 'env_manager', name: 'Environment Manager', category: 'configuration', complexity: 'low' },
      { id: 'feature_flags', name: 'Feature Flags', category: 'configuration', complexity: 'medium' },
      { id: 'blue_green_deploy', name: 'Blue/Green Deploy', category: 'deployment', complexity: 'high' },
      { id: 'canary_deploy', name: 'Canary Deploy', category: 'deployment', complexity: 'high' },
      { id: 'rolling_deploy', name: 'Rolling Deploy', category: 'deployment', complexity: 'medium' },
      { id: 'terraform_manager', name: 'Terraform Manager', category: 'iac', complexity: 'high' },
      { id: 'ansible_manager', name: 'Ansible Manager', category: 'iac', complexity: 'high' },
      { id: 'cloudformation', name: 'CloudFormation', category: 'iac', complexity: 'high' },
      { id: 'cost_optimizer', name: 'Cost Optimizer', category: 'optimization', complexity: 'high' },
      { id: 'resource_tagger', name: 'Resource Tagger', category: 'management', complexity: 'low' },
      { id: 'compliance_scanner', name: 'Compliance Scanner', category: 'compliance', complexity: 'high' },
      { id: 'infrastructure_audit', name: 'Infrastructure Audit', category: 'compliance', complexity: 'high' }
    ]);
    
    // Specialized Skills managed by multiple agents (100)
    const specializedSkills = [
      // Integration Skills (20)
      { id: 'slack_integration', name: 'Slack Integration', category: 'integration', complexity: 'medium' },
      { id: 'teams_integration', name: 'Teams Integration', category: 'integration', complexity: 'medium' },
      { id: 'discord_bot', name: 'Discord Bot', category: 'integration', complexity: 'medium' },
      { id: 'telegram_bot', name: 'Telegram Bot', category: 'integration', complexity: 'medium' },
      { id: 'whatsapp_sender', name: 'WhatsApp Sender', category: 'integration', complexity: 'high' },
      { id: 'github_integration', name: 'GitHub Integration', category: 'integration', complexity: 'medium' },
      { id: 'jira_connector', name: 'Jira Connector', category: 'integration', complexity: 'medium' },
      { id: 'asana_connector', name: 'Asana Connector', category: 'integration', complexity: 'medium' },
      { id: 'trello_connector', name: 'Trello Connector', category: 'integration', complexity: 'medium' },
      { id: 'salesforce_connector', name: 'Salesforce Connector', category: 'integration', complexity: 'high' },
      { id: 'hubspot_connector', name: 'HubSpot Connector', category: 'integration', complexity: 'high' },
      { id: 'mailchimp_connector', name: 'Mailchimp Connector', category: 'integration', complexity: 'medium' },
      { id: 'sendgrid_connector', name: 'SendGrid Connector', category: 'integration', complexity: 'medium' },
      { id: 'twilio_connector', name: 'Twilio Connector', category: 'integration', complexity: 'medium' },
      { id: 'google_drive', name: 'Google Drive', category: 'integration', complexity: 'medium' },
      { id: 'google_sheets', name: 'Google Sheets', category: 'integration', complexity: 'medium' },
      { id: 'dropbox_connector', name: 'Dropbox Connector', category: 'integration', complexity: 'medium' },
      { id: 'linkedin_connector', name: 'LinkedIn Connector', category: 'integration', complexity: 'high' },
      { id: 'twitter_connector', name: 'Twitter Connector', category: 'integration', complexity: 'medium' },
      { id: 'zoom_connector', name: 'Zoom Connector', category: 'integration', complexity: 'medium' },
      
      // E-commerce Skills (15)
      { id: 'shopify_connector', name: 'Shopify Connector', category: 'ecommerce', complexity: 'high' },
      { id: 'woocommerce_connector', name: 'WooCommerce Connector', category: 'ecommerce', complexity: 'high' },
      { id: 'inventory_manager', name: 'Inventory Manager', category: 'ecommerce', complexity: 'medium' },
      { id: 'order_processor', name: 'Order Processor', category: 'ecommerce', complexity: 'medium' },
      { id: 'shipping_calculator', name: 'Shipping Calculator', category: 'ecommerce', complexity: 'medium' },
      { id: 'product_recommender', name: 'Product Recommender', category: 'ecommerce', complexity: 'high' },
      { id: 'cart_abandonment', name: 'Cart Abandonment', category: 'ecommerce', complexity: 'medium' },
      { id: 'discount_engine', name: 'Discount Engine', category: 'ecommerce', complexity: 'medium' },
      { id: 'loyalty_program', name: 'Loyalty Program', category: 'ecommerce', complexity: 'high' },
      { id: 'review_collector', name: 'Review Collector', category: 'ecommerce', complexity: 'medium' },
      { id: 'rating_aggregator', name: 'Rating Aggregator', category: 'ecommerce', complexity: 'low' },
      { id: 'wishlist_manager', name: 'Wishlist Manager', category: 'ecommerce', complexity: 'low' },
      { id: 'cross_sell', name: 'Cross Sell', category: 'ecommerce', complexity: 'medium' },
      { id: 'upsell_engine', name: 'Upsell Engine', category: 'ecommerce', complexity: 'medium' },
      { id: 'return_processor', name: 'Return Processor', category: 'ecommerce', complexity: 'medium' },
      
      // Analytics Skills (15)
      { id: 'google_analytics', name: 'Google Analytics', category: 'analytics', complexity: 'medium' },
      { id: 'mixpanel_tracker', name: 'Mixpanel Tracker', category: 'analytics', complexity: 'medium' },
      { id: 'segment_tracker', name: 'Segment Tracker', category: 'analytics', complexity: 'medium' },
      { id: 'heatmap_generator', name: 'Heatmap Generator', category: 'analytics', complexity: 'high' },
      { id: 'session_recorder', name: 'Session Recorder', category: 'analytics', complexity: 'high' },
      { id: 'click_tracker', name: 'Click Tracker', category: 'analytics', complexity: 'low' },
      { id: 'scroll_tracker', name: 'Scroll Tracker', category: 'analytics', complexity: 'low' },
      { id: 'form_analytics', name: 'Form Analytics', category: 'analytics', complexity: 'medium' },
      { id: 'roi_calculator', name: 'ROI Calculator', category: 'analytics', complexity: 'medium' },
      { id: 'ltv_calculator', name: 'LTV Calculator', category: 'analytics', complexity: 'high' },
      { id: 'churn_predictor', name: 'Churn Predictor', category: 'analytics', complexity: 'high' },
      { id: 'retention_analyzer', name: 'Retention Analyzer', category: 'analytics', complexity: 'high' },
      { id: 'engagement_scorer', name: 'Engagement Scorer', category: 'analytics', complexity: 'medium' },
      { id: 'attribution_model', name: 'Attribution Model', category: 'analytics', complexity: 'high' },
      { id: 'dashboard_builder', name: 'Dashboard Builder', category: 'analytics', complexity: 'high' },
      
      // Media & Content Skills (20)
      { id: 'image_processor', name: 'Image Processor', category: 'media', complexity: 'medium' },
      { id: 'video_encoder', name: 'Video Encoder', category: 'media', complexity: 'high' },
      { id: 'audio_processor', name: 'Audio Processor', category: 'media', complexity: 'medium' },
      { id: 'thumbnail_generator', name: 'Thumbnail Generator', category: 'media', complexity: 'low' },
      { id: 'watermark_adder', name: 'Watermark Adder', category: 'media', complexity: 'low' },
      { id: 'image_classifier', name: 'Image Classifier', category: 'ml', complexity: 'high' },
      { id: 'face_recognizer', name: 'Face Recognizer', category: 'ml', complexity: 'high' },
      { id: 'object_detector', name: 'Object Detector', category: 'ml', complexity: 'high' },
      { id: 'ocr_processor', name: 'OCR Processor', category: 'ml', complexity: 'high' },
      { id: 'qr_generator', name: 'QR Generator', category: 'utility', complexity: 'low' },
      { id: 'barcode_generator', name: 'Barcode Generator', category: 'utility', complexity: 'low' },
      { id: 'barcode_scanner', name: 'Barcode Scanner', category: 'utility', complexity: 'medium' },
      { id: 'pdf_extractor', name: 'PDF Extractor', category: 'documents', complexity: 'medium' },
      { id: 'pdf_merger', name: 'PDF Merger', category: 'documents', complexity: 'low' },
      { id: 'pdf_splitter', name: 'PDF Splitter', category: 'documents', complexity: 'low' },
      { id: 'signature_generator', name: 'Signature Generator', category: 'documents', complexity: 'medium' },
      { id: 'template_engine', name: 'Template Engine', category: 'content', complexity: 'medium' },
      { id: 'markdown_processor', name: 'Markdown Processor', category: 'content', complexity: 'low' },
      { id: 'html_generator', name: 'HTML Generator', category: 'content', complexity: 'medium' },
      { id: 'rss_publisher', name: 'RSS Publisher', category: 'content', complexity: 'medium' },
      
      // Communication Skills (15)
      { id: 'email_composer', name: 'Email Composer', category: 'communication', complexity: 'medium' },
      { id: 'email_parser', name: 'Email Parser', category: 'communication', complexity: 'medium' },
      { id: 'voice_call', name: 'Voice Call', category: 'communication', complexity: 'high' },
      { id: 'video_conference', name: 'Video Conference', category: 'communication', complexity: 'high' },
      { id: 'screen_share', name: 'Screen Share', category: 'communication', complexity: 'high' },
      { id: 'transcription', name: 'Transcription', category: 'ml', complexity: 'high' },
      { id: 'text_to_speech', name: 'Text to Speech', category: 'ml', complexity: 'medium' },
      { id: 'speech_to_text', name: 'Speech to Text', category: 'ml', complexity: 'high' },
      { id: 'live_chat', name: 'Live Chat', category: 'support', complexity: 'medium' },
      { id: 'comment_moderator', name: 'Comment Moderator', category: 'moderation', complexity: 'high' },
      { id: 'spam_filter', name: 'Spam Filter', category: 'moderation', complexity: 'medium' },
      { id: 'profanity_filter', name: 'Profanity Filter', category: 'moderation', complexity: 'low' },
      { id: 'language_detector', name: 'Language Detector', category: 'localization', complexity: 'medium' },
      { id: 'auto_translator', name: 'Auto Translator', category: 'localization', complexity: 'high' },
      { id: 'social_poster', name: 'Social Poster', category: 'social', complexity: 'medium' },
      
      // Utility Skills (15)
      { id: 'url_shortener', name: 'URL Shortener', category: 'utility', complexity: 'low' },
      { id: 'uuid_generator', name: 'UUID Generator', category: 'utility', complexity: 'low' },
      { id: 'random_generator', name: 'Random Generator', category: 'utility', complexity: 'low' },
      { id: 'mock_data', name: 'Mock Data', category: 'testing', complexity: 'medium' },
      { id: 'regex_matcher', name: 'Regex Matcher', category: 'utility', complexity: 'medium' },
      { id: 'base64_encoder', name: 'Base64 Encoder', category: 'utility', complexity: 'low' },
      { id: 'compression', name: 'Compression', category: 'utility', complexity: 'medium' },
      { id: 'decompression', name: 'Decompression', category: 'utility', complexity: 'medium' },
      { id: 'color_converter', name: 'Color Converter', category: 'utility', complexity: 'low' },
      { id: 'unit_converter', name: 'Unit Converter', category: 'utility', complexity: 'low' },
      { id: 'timezone_converter', name: 'Timezone Converter', category: 'utility', complexity: 'medium' },
      { id: 'geocoder', name: 'Geocoder', category: 'location', complexity: 'medium' },
      { id: 'reverse_geocoder', name: 'Reverse Geocoder', category: 'location', complexity: 'medium' },
      { id: 'distance_calculator', name: 'Distance Calculator', category: 'location', complexity: 'low' },
      { id: 'weather_service', name: 'Weather Service', category: 'external', complexity: 'medium' }
    ];
    
    // Assign specialized skills to multiple agents based on category
    specializedSkills.forEach(skill => {
      const agents = this.determineAgentsForSkill(skill);
      agents.forEach(agent => {
        const skills = this.agentCapabilities.get(agent) || new Set();
        skills.add(skill.id);
        this.agentCapabilities.set(agent, skills);
        
        this.skillAssignments.set(skill.id, {
          ...skill,
          skillId: skill.id,
          skillName: skill.name,
          primaryAgent: agents[0],
          secondaryAgents: agents.slice(1)
        });
      });
    });
  }
  
  /**
   * Assign skills to an agent
   */
  private assignSkillsToAgent(agent: string, skills: any[]): void {
    const capabilities = this.agentCapabilities.get(agent) || new Set();
    
    skills.forEach(skill => {
      capabilities.add(skill.id);
      this.skillAssignments.set(skill.id, {
        skillId: skill.id,
        skillName: skill.name,
        primaryAgent: agent,
        category: skill.category,
        complexity: skill.complexity,
        dependencies: skill.dependencies
      });
    });
    
    this.agentCapabilities.set(agent, capabilities);
  }
  
  /**
   * Determine which agents should handle a specialized skill
   */
  private determineAgentsForSkill(skill: any): string[] {
    const agents: string[] = [];
    
    // Integration skills
    if (skill.category === 'integration') {
      agents.push('integration', 'operations');
    }
    // E-commerce skills
    else if (skill.category === 'ecommerce') {
      agents.push('operations', 'finance');
    }
    // Analytics skills
    else if (skill.category === 'analytics') {
      agents.push('analytics', 'operations');
    }
    // Media skills
    else if (skill.category === 'media' || skill.category === 'documents') {
      agents.push('operations', 'infrastructure');
    }
    // Communication skills
    else if (skill.category === 'communication' || skill.category === 'social') {
      agents.push('communications', 'operations');
    }
    // ML skills
    else if (skill.category === 'ml') {
      agents.push('analytics', 'operations');
    }
    // Utility skills
    else if (skill.category === 'utility' || skill.category === 'testing') {
      agents.push('operations', 'infrastructure');
    }
    // Location skills
    else if (skill.category === 'location' || skill.category === 'external') {
      agents.push('integration', 'operations');
    }
    // Moderation skills
    else if (skill.category === 'moderation') {
      agents.push('communications', 'security');
    }
    // Support skills
    else if (skill.category === 'support') {
      agents.push('communications', 'operations');
    }
    // Localization skills
    else if (skill.category === 'localization') {
      agents.push('communications', 'operations');
    }
    // Default
    else {
      agents.push('operations');
    }
    
    return agents;
  }
  
  /**
   * Get responsible agents for a request
   */
  public getResponsibleAgents(request: any): string[] {
    const { action, type } = request;
    const agents = new Set<string>();
    
    // Check if action matches a specific skill
    const skill = this.skillAssignments.get(action);
    if (skill) {
      agents.add(skill.primaryAgent);
      skill.secondaryAgents?.forEach(a => agents.add(a));
    }
    
    // Add agents based on request type
    if (type === 'payment' || action.includes('payment')) {
      agents.add('finance');
    }
    if (type === 'security' || action.includes('security')) {
      agents.add('security');
    }
    if (type === 'infrastructure' || action.includes('deploy')) {
      agents.add('infrastructure');
    }
    
    // Default to operations if no specific agent found
    if (agents.size === 0) {
      agents.add('operations');
    }
    
    return Array.from(agents);
  }
  
  /**
   * Get skills for an agent
   */
  public getAgentSkills(agent: string): string[] {
    const capabilities = this.agentCapabilities.get(agent);
    return capabilities ? Array.from(capabilities) : [];
  }
  
  /**
   * Get skill details
   */
  public getSkillDetails(skillId: string): SkillAssignment | undefined {
    return this.skillAssignments.get(skillId);
  }
  
  /**
   * Get all skills
   */
  public getAllSkills(): SkillAssignment[] {
    return Array.from(this.skillAssignments.values());
  }
  
  /**
   * Get skills by category
   */
  public getSkillsByCategory(category: string): SkillAssignment[] {
    return Array.from(this.skillAssignments.values())
      .filter(skill => skill.category === category);
  }
  
  /**
   * Get status
   */
  public getStatus(): any {
    return {
      totalSkills: this.skillAssignments.size,
      agents: Object.fromEntries(
        Array.from(this.agentCapabilities.entries())
          .map(([agent, skills]) => [agent, skills.size])
      ),
      categories: Array.from(new Set(
        Array.from(this.skillAssignments.values())
          .map(s => s.category)
      ))
    };
  }
}