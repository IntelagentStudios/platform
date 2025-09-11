/**
 * Skills Registry
 * Central registry for all skills with management capabilities
 */

import { SkillFactory, SkillDefinition } from './SkillFactory';
import { BaseSkill } from './BaseSkill';

interface SkillInstance {
  definition: SkillDefinition;
  implementation?: BaseSkill;
  status: 'available' | 'loading' | 'loaded' | 'error';
  error?: string;
  stats: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    totalDuration: number;
    lastExecuted?: Date;
  };
}

export class SkillsRegistry {
  private static instance: SkillsRegistry;
  private skills: Map<string, SkillInstance> = new Map();
  private enabledSkills: Set<string> = new Set();
  
  private constructor() {
    this.initialize();
  }
  
  static getInstance(): SkillsRegistry {
    if (!SkillsRegistry.instance) {
      SkillsRegistry.instance = new SkillsRegistry();
    }
    return SkillsRegistry.instance;
  }
  
  private initialize() {
    // Load all skill definitions from factory
    const definitions = SkillFactory.getAllSkills();
    
    definitions.forEach(definition => {
      this.skills.set(definition.id, {
        definition,
        status: 'available',
        stats: {
          totalExecutions: 0,
          successfulExecutions: 0,
          failedExecutions: 0,
          totalDuration: 0
        }
      });
      
      // Enable all skills by default (can be configured)
      this.enabledSkills.add(definition.id);
    });
    
    console.log(`[SkillsRegistry] Initialized with ${definitions.length} skills`);
  }
  
  /**
   * Get all registered skills
   */
  getAllSkills(): SkillInstance[] {
    return Array.from(this.skills.values());
  }
  
  /**
   * Get skill by ID
   */
  getSkill(id: string): SkillInstance | undefined {
    return this.skills.get(id);
  }
  
  /**
   * Get skills by category
   */
  getSkillsByCategory(category: string): SkillInstance[] {
    return this.getAllSkills().filter(
      skill => skill.definition.category === category
    );
  }
  
  /**
   * Get enabled skills
   */
  getEnabledSkills(): SkillInstance[] {
    return this.getAllSkills().filter(
      skill => this.enabledSkills.has(skill.definition.id)
    );
  }
  
  /**
   * Enable a skill
   */
  enableSkill(id: string): boolean {
    if (this.skills.has(id)) {
      this.enabledSkills.add(id);
      console.log(`[SkillsRegistry] Enabled skill: ${id}`);
      return true;
    }
    return false;
  }
  
  /**
   * Disable a skill
   */
  disableSkill(id: string): boolean {
    if (this.enabledSkills.delete(id)) {
      console.log(`[SkillsRegistry] Disabled skill: ${id}`);
      
      // Unload implementation if loaded
      const skill = this.skills.get(id);
      if (skill && skill.implementation) {
        skill.implementation = undefined;
        skill.status = 'available';
      }
      
      return true;
    }
    return false;
  }
  
  /**
   * Check if skill is enabled
   */
  isSkillEnabled(id: string): boolean {
    return this.enabledSkills.has(id);
  }
  
  /**
   * Load skill implementation
   */
  async loadSkill(id: string): Promise<BaseSkill | null> {
    const skillInstance = this.skills.get(id);
    
    if (!skillInstance) {
      console.error(`[SkillsRegistry] Skill not found: ${id}`);
      return null;
    }
    
    if (!this.isSkillEnabled(id)) {
      console.error(`[SkillsRegistry] Skill is disabled: ${id}`);
      return null;
    }
    
    if (skillInstance.implementation) {
      return skillInstance.implementation;
    }
    
    skillInstance.status = 'loading';
    
    try {
      // Dynamic import based on skill ID
      // In production, this would load actual implementations
      const implementation = await this.createSkillImplementation(id);
      
      if (implementation) {
        skillInstance.implementation = implementation;
        skillInstance.status = 'loaded';
        console.log(`[SkillsRegistry] Loaded skill: ${id}`);
        return implementation;
      } else {
        throw new Error('Implementation not found');
      }
    } catch (error: any) {
      skillInstance.status = 'error';
      skillInstance.error = error.message;
      console.error(`[SkillsRegistry] Failed to load skill ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Create skill implementation
   * In production, this would load actual skill classes
   */
  private async createSkillImplementation(id: string): Promise<BaseSkill | null> {
    // Import existing implementations
    switch (id) {
      // Communication skills
      case 'website_chatbot':
        const { WebsiteChatbotSkill } = await import('./impl/WebsiteChatbotSkill');
        return new WebsiteChatbotSkill();
      
      case 'email_composer':
        const { EmailComposerSkill } = await import('./impl/EmailComposerSkill');
        return new EmailComposerSkill();
      
      case 'text_summarizer':
        const { TextSummarizerSkill } = await import('./impl/TextSummarizerSkill');
        return new TextSummarizerSkill();
      
      case 'chatbot':
        const { ChatbotSkill } = await import('./impl/ChatbotSkill');
        return new ChatbotSkill();
      
      case 'template_engine':
        const { TemplateEngineSkill } = await import('./impl/TemplateEngineSkill');
        return new TemplateEngineSkill();
      
      // AI/ML skills
      case 'sentiment_analyzer':
        const { SentimentAnalyzerSkill } = await import('./impl/SentimentAnalyzerSkill');
        return new SentimentAnalyzerSkill();
      
      case 'language_detector':
        const { LanguageDetectorSkill } = await import('./impl/LanguageDetectorSkill');
        return new LanguageDetectorSkill();
      
      // Data Processing skills
      case 'data_enricher':
        const { DataEnricherSkill } = await import('./impl/DataEnricherSkill');
        return new DataEnricherSkill();
      
      case 'data_validator':
        const { DataValidatorSkill } = await import('./impl/DataValidatorSkill');
        return new DataValidatorSkill();
      
      case 'data_transformer':
        const { DataTransformerSkill } = await import('./impl/DataTransformerSkill');
        return new DataTransformerSkill();
      
      // Integration skills
      case 'webhook_sender':
        const { WebhookSenderSkill } = await import('./impl/WebhookSenderSkill');
        return new WebhookSenderSkill();
      
      // Automation skills
      case 'workflow_engine':
        const { WorkflowEngineSkill } = await import('./impl/WorkflowEngineSkill');
        return new WorkflowEngineSkill();
      
      // Analytics skills
      case 'report_generator':
        const { ReportGeneratorSkill } = await import('./impl/ReportGeneratorSkill');
        return new ReportGeneratorSkill();
      
      // Integration skills (continued)
      case 'api_connector':
        const { ApiConnectorSkill } = await import('./impl/ApiConnectorSkill');
        return new ApiConnectorSkill();
      
      case 'database_connector':
        const { DatabaseConnectorSkill } = await import('./impl/DatabaseConnectorSkill');
        return new DatabaseConnectorSkill();
      
      // AI/ML skills (continued)
      case 'image_analysis':
        const { ImageAnalysisSkill } = await import('./impl/ImageAnalysisSkill');
        return new ImageAnalysisSkill();
      
      case 'predictive_analytics':
        const { PredictiveAnalyticsSkill } = await import('./impl/PredictiveAnalyticsSkill');
        return new PredictiveAnalyticsSkill();
      
      // Productivity skills
      case 'task_manager':
        const { TaskManagerSkill } = await import('./impl/TaskManagerSkill');
        return new TaskManagerSkill();
      
      // Chatbot workflow skills
      case 'search_strategy':
        const { SearchStrategySkill } = await import('./impl/SearchStrategySkill');
        return new SearchStrategySkill();
      
      case 'response_creator':
        const { ResponseCreatorSkill } = await import('./impl/ResponseCreatorSkill');
        return new ResponseCreatorSkill();
      
      case 'web_scraper':
        const { WebScraperSkill } = await import('./impl/WebScraperSkill');
        return new WebScraperSkill();
      
      // Multilingual/SEO skills
      case 'translate-content_v1':
        const { TranslateContentSkill } = await import('./impl/TranslateContentSkill');
        return new TranslateContentSkill();
      
      case 'generate-sitemap_v1':
        const { GenerateSitemapSkill } = await import('./impl/GenerateSitemapSkill');
        return new GenerateSitemapSkill();
      
      case 'inject-hreflang_v1':
        const { InjectHreflangSkill } = await import('./impl/InjectHreflangSkill');
        return new InjectHreflangSkill();
      
      // Traditional SEO Skills
      case 'technical-seo-audit_v1':
        const { TechnicalSEOAuditSkill } = await import('./impl/seo/TechnicalSEOAuditSkill');
        return new TechnicalSEOAuditSkill();
      
      case 'keyword-research-pro_v1':
        const { KeywordResearchProSkill } = await import('./impl/seo/KeywordResearchProSkill');
        return new KeywordResearchProSkill();
      
      case 'backlink-analyzer_v1':
        const { BacklinkAnalyzerSkill } = await import('./impl/seo/BacklinkAnalyzerSkill');
        return new BacklinkAnalyzerSkill();
      
      case 'local-seo-optimizer_v1':
        const { LocalSEOOptimizerSkill } = await import('./impl/seo/LocalSEOOptimizerSkill');
        return new LocalSEOOptimizerSkill();
      
      // AI Search Optimization Skills
      case 'ai-search-optimizer_v1':
        const { AISearchOptimizerSkill } = await import('./impl/seo/AISearchOptimizerSkill');
        return new AISearchOptimizerSkill();
      
      case 'llm-training-optimizer_v1':
        const { LLMTrainingOptimizerSkill } = await import('./impl/seo/LLMTrainingOptimizerSkill');
        return new LLMTrainingOptimizerSkill();
      
      case 'rag-optimization_v1':
        const { RAGOptimizationSkill } = await import('./impl/seo/RAGOptimizationSkill');
        return new RAGOptimizationSkill();
      
      // Structured Data & Knowledge Graph Skills
      case 'schema-markup-generator_v1':
        const { SchemaMarkupGeneratorSkill } = await import('./impl/seo/SchemaMarkupGeneratorSkill');
        return new SchemaMarkupGeneratorSkill();
      
      case 'entity-extractor_v1':
        const { EntityExtractorSkill } = await import('./impl/seo/EntityExtractorSkill');
        return new EntityExtractorSkill();
      
      // Voice & Visual Search Skills
      case 'voice-search-optimizer_v1':
        const { VoiceSearchOptimizerSkill } = await import('./impl/seo/VoiceSearchOptimizerSkill');
        return new VoiceSearchOptimizerSkill();
      
      case 'visual-search-optimizer_v1':
        const { VisualSearchOptimizerSkill } = await import('./impl/seo/VisualSearchOptimizerSkill');
        return new VisualSearchOptimizerSkill();
      
      // E-E-A-T & Authority Skills
      case 'eeat-scorer_v1':
        const { EEATScorerSkill } = await import('./impl/seo/EEATScorerSkill');
        return new EEATScorerSkill();
      
      case 'author-authority-builder_v1':
        const { AuthorAuthorityBuilderSkill } = await import('./impl/seo/AuthorAuthorityBuilderSkill');
        return new AuthorAuthorityBuilderSkill();
      
      // Performance & Technical Skills
      case 'core-web-vitals-optimizer_v1':
        const { CoreWebVitalsOptimizerSkill } = await import('./impl/seo/CoreWebVitalsOptimizerSkill');
        return new CoreWebVitalsOptimizerSkill();
      
      case 'javascript-seo-analyzer_v1':
        const { JavaScriptSEOAnalyzerSkill } = await import('./impl/seo/JavaScriptSEOAnalyzerSkill');
        return new JavaScriptSEOAnalyzerSkill();
      
      // Content Intelligence Skills
      case 'content-gap-analyzer_v1':
        const { ContentGapAnalyzerSkill } = await import('./impl/seo/ContentGapAnalyzerSkill');
        return new ContentGapAnalyzerSkill();
      
      case 'content-optimizer-ai_v1':
        const { ContentOptimizerAISkill } = await import('./impl/seo/ContentOptimizerAISkill');
        return new ContentOptimizerAISkill();
      
      case 'content-cannibalization-detector_v1':
        const { ContentCannibalizationDetectorSkill } = await import('./impl/seo/ContentCannibalizationDetectorSkill');
        return new ContentCannibalizationDetectorSkill();
      
      // Monitoring & Analytics Skills
      case 'serp-monitor_v1':
        const { SERPMonitorSkill } = await import('./impl/seo/SERPMonitorSkill');
        return new SERPMonitorSkill();
      
      case 'ai-search-visibility-tracker_v1':
        const { AISearchVisibilityTrackerSkill } = await import('./impl/seo/AISearchVisibilityTrackerSkill');
        return new AISearchVisibilityTrackerSkill();
      
      case 'conversion-optimizer_v1':
        const { ConversionOptimizerSkill } = await import('./impl/seo/ConversionOptimizerSkill');
        return new ConversionOptimizerSkill();
      
      // Missing skills from first batch
      case 'abandoned_cart_recovery':
        const { AbandonedCartRecoverySkill } = await import('./impl/AbandonedCartRecoverySkill');
        return new AbandonedCartRecoverySkill();
      
      case 'ai_vision_document':
        const { AIVisionDocumentSkill } = await import('./impl/AIVisionDocumentSkill');
        return new AIVisionDocumentSkill();
      
      case 'anomaly_predictor':
        const { AnomalyPredictorSkill } = await import('./impl/AnomalyPredictorSkill');
        return new AnomalyPredictorSkill();
      
      case 'api_gateway':
        const { ApiGatewaySkill } = await import('./impl/ApiGatewaySkill');
        return new ApiGatewaySkill();
      
      case 'appointment_scheduler':
        const { AppointmentSchedulerSkill } = await import('./impl/AppointmentSchedulerSkill');
        return new AppointmentSchedulerSkill();
      
      // Education skills
      case 'assignment_grader':
        const { AssignmentGraderSkill } = await import('./impl/AssignmentGraderSkill');
        return new AssignmentGraderSkill();
      
      case 'attendance_manager':
        const { AttendanceManagerSkill } = await import('./impl/AttendanceManagerSkill');
        return new AttendanceManagerSkill();
      
      case 'course_creator':
        const { CourseCreatorSkill } = await import('./impl/CourseCreatorSkill');
        return new CourseCreatorSkill();
      
      // Media processing skills
      case 'audio_mixer':
        const { AudioMixerSkill } = await import('./impl/AudioMixerSkill');
        return new AudioMixerSkill();
      
      case 'audio_processor':
        const { AudioProcessorSkill } = await import('./impl/AudioProcessorSkill');
        return new AudioProcessorSkill();
      
      // Blockchain & crypto skills
      case 'blockchain_connector':
        const { BlockchainConnectorSkill } = await import('./impl/BlockchainConnectorSkill');
        return new BlockchainConnectorSkill();
      
      case 'blockchain_explorer':
        const { BlockchainExplorerSkill } = await import('./impl/BlockchainExplorerSkill');
        return new BlockchainExplorerSkill();
      
      case 'crypto_tracker':
        const { CryptoTrackerSkill } = await import('./impl/CryptoTrackerSkill');
        return new CryptoTrackerSkill();
      
      case 'crypto_trader':
        const { CryptoTraderSkill } = await import('./impl/CryptoTraderSkill');
        return new CryptoTraderSkill();
      
      // Financial skills
      case 'financial_analyzer':
        const { FinancialAnalyzerSkill } = await import('./impl/FinancialAnalyzerSkill');
        return new FinancialAnalyzerSkill();
      
      case 'budget_planner':
        const { BudgetPlannerSkill } = await import('./impl/BudgetPlannerSkill');
        return new BudgetPlannerSkill();
      
      case 'expense_tracker':
        const { ExpenseTrackerSkill } = await import('./impl/ExpenseTrackerSkill');
        return new ExpenseTrackerSkill();
      
      // Additional utility skills
      case 'file_converter':
        const { FileConverterSkill } = await import('./impl/FileConverterSkill');
        return new FileConverterSkill();
      
      case 'certificate_generator':
        const { CertificateGeneratorSkill } = await import('./impl/CertificateGeneratorSkill');
        return new CertificateGeneratorSkill();
      
      case 'cache_manager':
        const { CacheManagerSkill } = await import('./impl/CacheManagerSkill');
        return new CacheManagerSkill();
      
      case 'batch_processor':
        const { BatchProcessorSkill } = await import('./impl/BatchProcessorSkill');
        return new BatchProcessorSkill();
      
      // Additional automation skills
      case 'backup_manager':
        const { BackupManagerSkill } = await import('./impl/BackupManagerSkill');
        return new BackupManagerSkill();
      
      case 'browser_automation':
        const { BrowserAutomationSkill } = await import('./impl/BrowserAutomationSkill');
        return new BrowserAutomationSkill();
      
      case 'calendar_scheduler':
        const { CalendarSchedulerSkill } = await import('./impl/CalendarSchedulerSkill');
        return new CalendarSchedulerSkill();
      
      case 'ci_cd_pipeline':
        const { CiCdPipelineSkill } = await import('./impl/CiCdPipelineSkill');
        return new CiCdPipelineSkill();
      
      case 'code_generator':
        const { CodeGeneratorSkill } = await import('./impl/CodeGeneratorSkill');
        return new CodeGeneratorSkill();
      
      case 'compliance_checker':
        const { ComplianceCheckerSkill } = await import('./impl/ComplianceCheckerSkill');
        return new ComplianceCheckerSkill();
      
      // Business & E-commerce skills
      case 'billing_system':
        const { BillingSystemSkill } = await import('./impl/BillingSystemSkill');
        return new BillingSystemSkill();
      
      case 'checkout_processor':
        const { CheckoutProcessorSkill } = await import('./impl/CheckoutProcessorSkill');
        return new CheckoutProcessorSkill();
      
      // AI & Analytics skills
      case 'clustering_engine':
        const { ClusteringEngineSkill } = await import('./impl/ClusteringEngineSkill');
        return new ClusteringEngineSkill();
      
      // Chatbot & Communication skills
      case 'chatbot_analytics':
        const { ChatbotAnalyticsSkill } = await import('./impl/ChatbotAnalyticsSkill');
        return new ChatbotAnalyticsSkill();
      
      case 'chatbot_configuration':
        const { ChatbotConfigurationSkill } = await import('./impl/ChatbotConfigurationSkill');
        return new ChatbotConfigurationSkill();
      
      case 'chatbot_trainer':
        const { ChatbotTrainerSkill } = await import('./impl/ChatbotTrainerSkill');
        return new ChatbotTrainerSkill();
      
      // ============ NEW SKILLS FROM DATA PROCESSING BATCH ============
      case 'csv_processor':
        const { CsvParserSkill } = await import('./impl/CsvParserSkill');
        return new CsvParserSkill();
      
      case 'data_cleaner':
        const { DataCleanerSkill } = await import('./impl/DataCleanerSkill');
        return new DataCleanerSkill();
      
      case 'data_enricher_pro':
        const { DataEnricherProSkill } = await import('./impl/DataEnricherProSkill');
        return new DataEnricherProSkill();
      
      case 'data_exporter':
        const { DataExporterSkill } = await import('./impl/DataExporterSkill');
        return new DataExporterSkill();
      
      case 'data_importer':
        const { DataImporterSkill } = await import('./impl/DataImporterSkill');
        return new DataImporterSkill();
      
      case 'data_mapper':
        const { DataMapperSkill } = await import('./impl/DataMapperSkill');
        return new DataMapperSkill();
      
      case 'data_merger':
        const { DataMergerSkill } = await import('./impl/DataMergerSkill');
        return new DataMergerSkill();
      
      case 'data_transformer_pro':
        const { DataTransformerProSkill } = await import('./impl/DataTransformerProSkill');
        return new DataTransformerProSkill();
      
      case 'data_validator_pro':
        const { DataValidatorProSkill } = await import('./impl/DataValidatorProSkill');
        return new DataValidatorProSkill();
      
      case 'database_connector_pro':
        const { DatabaseConnectorProSkill } = await import('./impl/DatabaseConnectorProSkill');
        return new DatabaseConnectorProSkill();
      
      case 'database_migrator':
        const { DatabaseMigratorSkill } = await import('./impl/DatabaseMigratorSkill');
        return new DatabaseMigratorSkill();
      
      case 'database_optimizer':
        const { DatabaseOptimizerSkill } = await import('./impl/DatabaseOptimizerSkill');
        return new DatabaseOptimizerSkill();
      
      // ============ NEW SKILLS FROM E-COMMERCE & MARKETING BATCH ============
      case 'deal_finder':
        const { DealFinderSkill } = await import('./impl/DealFinderSkill');
        return new DealFinderSkill();
      
      case 'delivery_tracker':
        const { DeliveryTrackerSkill } = await import('./impl/DeliveryTrackerSkill');
        return new DeliveryTrackerSkill();
      
      case 'discount_calculator':
        const { DiscountCalculatorSkill } = await import('./impl/DiscountCalculatorSkill');
        return new DiscountCalculatorSkill();
      
      case 'domain_checker':
        const { DomainCheckerSkill } = await import('./impl/DomainCheckerSkill');
        return new DomainCheckerSkill();
      
      case 'dropshipping_manager':
        const { DropshippingManagerSkill } = await import('./impl/DropshippingManagerSkill');
        return new DropshippingManagerSkill();
      
      case 'dynamic_pricing':
        const { DynamicPricingSkill } = await import('./impl/DynamicPricingSkill');
        return new DynamicPricingSkill();
      
      case 'ecommerce_analytics':
        const { EcommerceAnalyticsSkill } = await import('./impl/EcommerceAnalyticsSkill');
        return new EcommerceAnalyticsSkill();
      
      case 'email_marketing':
        const { EmailMarketingSkill } = await import('./impl/EmailMarketingSkill');
        return new EmailMarketingSkill();
      
      case 'email_sender':
        const { EmailSenderSkill } = await import('./impl/EmailSenderSkill');
        return new EmailSenderSkill();
      
      case 'email_verifier':
        const { EmailVerifierSkill } = await import('./impl/EmailVerifierSkill');
        return new EmailVerifierSkill();
      
      // ============ NEW SKILLS FROM FILE & DOCUMENT BATCH ============
      case 'file_compressor':
        const { FileCompressorSkill } = await import('./impl/FileCompressorSkill');
        return new FileCompressorSkill();
      
      case 'file_converter_pro':
        const { FileConverterProSkill } = await import('./impl/FileConverterProSkill');
        return new FileConverterProSkill();
      
      case 'file_encryptor':
        const { FileEncryptorSkill } = await import('./impl/FileEncryptorSkill');
        return new FileEncryptorSkill();
      
      case 'file_manager':
        const { FileManagerSkill } = await import('./impl/FileManagerSkill');
        return new FileManagerSkill();
      
      case 'file_organizer':
        const { FileOrganizerSkill } = await import('./impl/FileOrganizerSkill');
        return new FileOrganizerSkill();
      
      case 'file_sync':
        const { FileSyncSkill } = await import('./impl/FileSyncSkill');
        return new FileSyncSkill();
      
      case 'file_uploader':
        const { FileUploaderSkill } = await import('./impl/FileUploaderSkill');
        return new FileUploaderSkill();
      
      case 'document_generator':
        const { DocumentGeneratorSkill } = await import('./impl/DocumentGeneratorSkill');
        return new DocumentGeneratorSkill();
      
      case 'document_processor':
        const { DocumentProcessorSkill } = await import('./impl/DocumentProcessorSkill');
        return new DocumentProcessorSkill();
      
      case 'document_scanner':
        const { DocumentScannerSkill } = await import('./impl/DocumentScannerSkill');
        return new DocumentScannerSkill();
      
      // ============ NEW SKILLS FROM INTEGRATION & API BATCH ============
      case 'graphql_client':
        const { GraphqlClientSkill } = await import('./impl/GraphqlClientSkill');
        return new GraphqlClientSkill();
      
      case 'grpc_client':
        const { GrpcClientSkill } = await import('./impl/GrpcClientSkill');
        return new GrpcClientSkill();
      
      case 'http_client':
        const { HttpClientSkill } = await import('./impl/HttpClientSkill');
        return new HttpClientSkill();
      
      case 'integration_hub':
        const { IntegrationHubSkill } = await import('./impl/IntegrationHubSkill');
        return new IntegrationHubSkill();
      
      case 'json_processor':
        const { JsonProcessorSkill } = await import('./impl/JsonProcessorSkill');
        return new JsonProcessorSkill();
      
      case 'jwt_generator':
        const { JwtGeneratorSkill } = await import('./impl/JwtGeneratorSkill');
        return new JwtGeneratorSkill();
      
      case 'kafka_connector':
        const { KafkaConnectorSkill } = await import('./impl/KafkaConnectorSkill');
        return new KafkaConnectorSkill();
      
      case 'mqtt_client':
        const { MqttClientSkill } = await import('./impl/MqttClientSkill');
        return new MqttClientSkill();
      
      // ============ NEW SKILLS FROM SECURITY & MONITORING BATCH ============
      case 'log_analyzer':
        const { LogAnalyzerSkill } = await import('./impl/LogAnalyzerSkill');
        return new LogAnalyzerSkill();
      
      case 'logger':
        const { LoggerSkill } = await import('./impl/LoggerSkill');
        return new LoggerSkill();
      
      case 'metrics_collector':
        const { MetricsCollectorSkill } = await import('./impl/MetricsCollectorSkill');
        return new MetricsCollectorSkill();
      
      case 'monitoring_dashboard':
        const { MonitoringDashboardSkill } = await import('./impl/MonitoringDashboardSkill');
        return new MonitoringDashboardSkill();
      
      case 'network_monitor':
        const { NetworkMonitorSkill } = await import('./impl/NetworkMonitorSkill');
        return new NetworkMonitorSkill();
      
      case 'notification_engine':
        const { NotificationEngineSkill } = await import('./impl/NotificationEngineSkill');
        return new NotificationEngineSkill();
      
      case 'password_generator_pro':
        const { PasswordGeneratorProSkill } = await import('./impl/PasswordGeneratorProSkill');
        return new PasswordGeneratorProSkill();
      
      case 'password_manager':
        const { PasswordManagerSkill } = await import('./impl/PasswordManagerSkill');
        return new PasswordManagerSkill();
      
      case 'performance_analyzer':
        const { PerformanceAnalyzerSkill } = await import('./impl/PerformanceAnalyzerSkill');
        return new PerformanceAnalyzerSkill();
      
      case 'permission_manager':
        const { PermissionManagerSkill } = await import('./impl/PermissionManagerSkill');
        return new PermissionManagerSkill();
      
      default:
        // For unimplemented skills, return a mock implementation
        return this.createMockSkill(id);
    }
  }
  
  /**
   * Create a mock skill for unimplemented skills
   */
  private createMockSkill(id: string): BaseSkill | null {
    const definition = SkillFactory.getSkillDefinition(id);
    if (!definition) return null;
    
    // Create a dynamic mock skill
    return {
      metadata: {
        id: definition.id,
        name: definition.name,
        description: definition.description,
        category: definition.category as any,
        version: '1.0.0',
        author: 'Intelagent',
        tags: definition.tags
      },
      
      async execute(params: any) {
        // Mock execution
        return {
          success: true,
          data: {
            message: `Mock execution of ${definition.name}`,
            params,
            timestamp: new Date()
          },
          metadata: {
            skillId: definition.id,
            skillName: definition.name,
            timestamp: new Date()
          }
        };
      },
      
      validate(params: any) {
        return true;
      },
      
      getConfig() {
        return {};
      }
    } as BaseSkill;
  }
  
  /**
   * Update skill statistics
   */
  updateSkillStats(
    id: string,
    success: boolean,
    duration: number
  ): void {
    const skill = this.skills.get(id);
    if (!skill) return;
    
    skill.stats.totalExecutions++;
    if (success) {
      skill.stats.successfulExecutions++;
    } else {
      skill.stats.failedExecutions++;
    }
    skill.stats.totalDuration += duration;
    skill.stats.lastExecuted = new Date();
  }
  
  /**
   * Get skill statistics
   */
  getSkillStats(id: string) {
    const skill = this.skills.get(id);
    if (!skill) return null;
    
    const stats = skill.stats;
    const successRate = stats.totalExecutions > 0
      ? (stats.successfulExecutions / stats.totalExecutions) * 100
      : 0;
    
    const avgDuration = stats.totalExecutions > 0
      ? stats.totalDuration / stats.totalExecutions
      : 0;
    
    return {
      ...stats,
      successRate,
      avgDuration
    };
  }
  
  /**
   * Get registry statistics
   */
  getRegistryStats() {
    const total = this.skills.size;
    const enabled = this.enabledSkills.size;
    const loaded = Array.from(this.skills.values()).filter(
      s => s.status === 'loaded'
    ).length;
    
    const totalExecutions = Array.from(this.skills.values()).reduce(
      (sum, skill) => sum + skill.stats.totalExecutions,
      0
    );
    
    const categories = new Map<string, number>();
    this.getAllSkills().forEach(skill => {
      const cat = skill.definition.category;
      categories.set(cat, (categories.get(cat) || 0) + 1);
    });
    
    return {
      totalSkills: total,
      enabledSkills: enabled,
      loadedSkills: loaded,
      totalExecutions,
      categoryCounts: Object.fromEntries(categories)
    };
  }
  
  /**
   * Search skills
   */
  searchSkills(query: string): SkillInstance[] {
    const definitions = SkillFactory.searchSkills(query);
    const ids = new Set(definitions.map(d => d.id));
    
    return this.getAllSkills().filter(
      skill => ids.has(skill.definition.id)
    );
  }
  
  /**
   * Export registry data
   */
  exportData() {
    return {
      skills: Array.from(this.skills.entries()).map(([id, skill]) => ({
        id,
        definition: skill.definition,
        status: skill.status,
        enabled: this.enabledSkills.has(id),
        stats: skill.stats
      })),
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Import registry data
   */
  importData(data: any) {
    if (!data.skills) return false;
    
    data.skills.forEach((skillData: any) => {
      const skill = this.skills.get(skillData.id);
      if (skill) {
        // Update stats
        if (skillData.stats) {
          skill.stats = {
            ...skill.stats,
            ...skillData.stats
          };
        }
        
        // Update enabled status
        if (skillData.enabled) {
          this.enabledSkills.add(skillData.id);
        } else {
          this.enabledSkills.delete(skillData.id);
        }
      }
    });
    
    console.log(`[SkillsRegistry] Imported data from ${data.timestamp}`);
    return true;
  }
}