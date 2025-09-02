/**
 * Get All Skills
 * Returns array of all skill classes
 */

// Import all skill classes
import { WebsiteChatbotSkill } from './WebsiteChatbotSkill';
import { EmailComposerSkill } from './EmailComposerSkill';
import { SentimentAnalyzerSkill } from './SentimentAnalyzerSkill';
import { DataEnricherSkill } from './DataEnricherSkill';
import { WebhookSenderSkill } from './WebhookSenderSkill';
import { TextSummarizerSkill } from './TextSummarizerSkill';
import { LanguageDetectorSkill } from './LanguageDetectorSkill';
import { DataValidatorSkill } from './DataValidatorSkill';
import { DataTransformerSkill } from './DataTransformerSkill';
import { WorkflowEngineSkill } from './WorkflowEngineSkill';
import { ChatbotSkill } from './ChatbotSkill';
import { TemplateEngineSkill } from './TemplateEngineSkill';
import { ReportGeneratorSkill } from './ReportGeneratorSkill';
import { ApiConnectorSkill } from './ApiConnectorSkill';
import { DatabaseConnectorSkill } from './DatabaseConnectorSkill';
import { ImageAnalysisSkill } from './ImageAnalysisSkill';
import { PredictiveAnalyticsSkill } from './PredictiveAnalyticsSkill';
import { TaskManagerSkill } from './TaskManagerSkill';

// Import all generated skills
import { EmailParserSkill } from './EmailParserSkill';
import { SmsSenderSkill } from './SmsSenderSkill';
import { SlackIntegrationSkill } from './SlackIntegrationSkill';
import { TeamsIntegrationSkill } from './TeamsIntegrationSkill';
import { DiscordBotSkill } from './DiscordBotSkill';
import { WhatsappSenderSkill } from './WhatsappSenderSkill';
import { TelegramBotSkill } from './TelegramBotSkill';
import { VoiceCallSkill } from './VoiceCallSkill';
import { VideoConferenceSkill } from './VideoConferenceSkill';
import { CalendarSchedulerSkill } from './CalendarSchedulerSkill';
import { PushNotificationSkill } from './PushNotificationSkill';
import { RssPublisherSkill } from './RssPublisherSkill';
import { SocialPosterSkill } from './SocialPosterSkill';
import { CommentModeratorSkill } from './CommentModeratorSkill';
import { TranslationSkill } from './TranslationSkill';
import { TranscriptionSkill } from './TranscriptionSkill';
import { TextToSpeechSkill } from './TextToSpeechSkill';
import { SignatureGeneratorSkill } from './SignatureGeneratorSkill';
import { CsvParserSkill } from './CsvParserSkill';
import { JsonTransformerSkill } from './JsonTransformerSkill';
import { XmlProcessorSkill } from './XmlProcessorSkill';
import { ExcelHandlerSkill } from './ExcelHandlerSkill';
import { PdfGeneratorSkill } from './PdfGeneratorSkill';
import { PdfExtractorSkill } from './PdfExtractorSkill';
import { ImageProcessorSkill } from './ImageProcessorSkill';
import { VideoEncoderSkill } from './VideoEncoderSkill';
import { DataCleanerSkill } from './DataCleanerSkill';
import { DeduplicatorSkill } from './DeduplicatorSkill';
import { DataMergerSkill } from './DataMergerSkill';
import { DataSplitterSkill } from './DataSplitterSkill';
import { DataAggregatorSkill } from './DataAggregatorSkill';
import { GeocoderSkill } from './GeocoderSkill';
import { ReverseGeocoderSkill } from './ReverseGeocoderSkill';
import { BarcodeGeneratorSkill } from './BarcodeGeneratorSkill';
import { BarcodeScannerSkill } from './BarcodeScannerSkill';
import { EncryptionSkill } from './EncryptionSkill';
import { DecryptionSkill } from './DecryptionSkill';
import { HashingSkill } from './HashingSkill';
import { CompressionSkill } from './CompressionSkill';
import { Base64EncoderSkill } from './Base64EncoderSkill';
import { RegexMatcherSkill } from './RegexMatcherSkill';
import { SalesforceConnectorSkill } from './SalesforceConnectorSkill';
import { HubspotConnectorSkill } from './HubspotConnectorSkill';
import { StripePaymentSkill } from './StripePaymentSkill';
import { PaypalPaymentSkill } from './PaypalPaymentSkill';
import { ShopifyConnectorSkill } from './ShopifyConnectorSkill';
import { WoocommerceConnectorSkill } from './WoocommerceConnectorSkill';
import { GoogleSheetsSkill } from './GoogleSheetsSkill';
import { GoogleDriveSkill } from './GoogleDriveSkill';
import { DropboxConnectorSkill } from './DropboxConnectorSkill';
import { AwsS3Skill } from './AwsS3Skill';
import { GithubIntegrationSkill } from './GithubIntegrationSkill';
import { JiraConnectorSkill } from './JiraConnectorSkill';
import { TrelloConnectorSkill } from './TrelloConnectorSkill';
import { AsanaConnectorSkill } from './AsanaConnectorSkill';
import { MailchimpConnectorSkill } from './MailchimpConnectorSkill';
import { SendgridConnectorSkill } from './SendgridConnectorSkill';
import { TwilioConnectorSkill } from './TwilioConnectorSkill';
import { ZoomConnectorSkill } from './ZoomConnectorSkill';
import { LinkedinConnectorSkill } from './LinkedinConnectorSkill';
import { TwitterConnectorSkill } from './TwitterConnectorSkill';
import { TextClassifierSkill } from './TextClassifierSkill';
import { EntityExtractorSkill } from './EntityExtractorSkill';
import { ContentGeneratorSkill } from './ContentGeneratorSkill';
import { ImageClassifierSkill } from './ImageClassifierSkill';
import { ObjectDetectorSkill } from './ObjectDetectorSkill';
import { FaceRecognizerSkill } from './FaceRecognizerSkill';
import { AnomalyDetectorSkill } from './AnomalyDetectorSkill';
import { RecommendationEngineSkill } from './RecommendationEngineSkill';
import { KeywordExtractorSkill } from './KeywordExtractorSkill';
import { IntentClassifierSkill } from './IntentClassifierSkill';
import { EmotionDetectorSkill } from './EmotionDetectorSkill';
import { WebScraperSkill } from './WebScraperSkill';
import { FormFillerSkill } from './FormFillerSkill';
import { BrowserAutomationSkill } from './BrowserAutomationSkill';
import { TaskSchedulerSkill } from './TaskSchedulerSkill';
import { FileMonitorSkill } from './FileMonitorSkill';
import { BackupAutomationSkill } from './BackupAutomationSkill';
import { DeploymentAutomationSkill } from './DeploymentAutomationSkill';
import { TestingAutomationSkill } from './TestingAutomationSkill';
import { AlertSystemSkill } from './AlertSystemSkill';
import { DataPipelineSkill } from './DataPipelineSkill';
import { InvoiceAutomationSkill } from './InvoiceAutomationSkill';
import { ApprovalWorkflowSkill } from './ApprovalWorkflowSkill';
import { OnboardingAutomationSkill } from './OnboardingAutomationSkill';
import { UrlShortenerSkill } from './UrlShortenerSkill';
import { QrGeneratorSkill } from './QrGeneratorSkill';
import { PasswordGeneratorSkill } from './PasswordGeneratorSkill';
import { UuidGeneratorSkill } from './UuidGeneratorSkill';
import { ColorConverterSkill } from './ColorConverterSkill';
import { UnitConverterSkill } from './UnitConverterSkill';
import { CurrencyConverterSkill } from './CurrencyConverterSkill';
import { RandomGeneratorSkill } from './RandomGeneratorSkill';
import { MockDataSkill } from './MockDataSkill';
import { IpLookupSkill } from './IpLookupSkill';
import { DnsLookupSkill } from './DnsLookupSkill';
import { WhoisLookupSkill } from './WhoisLookupSkill';
import { GoogleAnalyticsSkill } from './GoogleAnalyticsSkill';
import { MixpanelTrackerSkill } from './MixpanelTrackerSkill';
import { SegmentTrackerSkill } from './SegmentTrackerSkill';
import { HeatmapGeneratorSkill } from './HeatmapGeneratorSkill';
import { AbTestingSkill } from './AbTestingSkill';
import { ConversionTrackerSkill } from './ConversionTrackerSkill';
import { FunnelAnalyzerSkill } from './FunnelAnalyzerSkill';
import { CohortAnalyzerSkill } from './CohortAnalyzerSkill';
import { RevenueTrackerSkill } from './RevenueTrackerSkill';
import { UserBehaviorSkill } from './UserBehaviorSkill';
import { PerformanceMonitorSkill } from './PerformanceMonitorSkill';
import { ErrorTrackerSkill } from './ErrorTrackerSkill';
import { SeoAnalyzerSkill } from './SeoAnalyzerSkill';
import { SocialAnalyticsSkill } from './SocialAnalyticsSkill';
import { CustomMetricsSkill } from './CustomMetricsSkill';

// Export all skills as array
export const ALL_SKILLS = [
  // Core Skills
  WebsiteChatbotSkill,
  EmailComposerSkill,
  SentimentAnalyzerSkill,
  DataEnricherSkill,
  WebhookSenderSkill,
  TextSummarizerSkill,
  LanguageDetectorSkill,
  DataValidatorSkill,
  DataTransformerSkill,
  WorkflowEngineSkill,
  ChatbotSkill,
  TemplateEngineSkill,
  ReportGeneratorSkill,
  ApiConnectorSkill,
  DatabaseConnectorSkill,
  ImageAnalysisSkill,
  PredictiveAnalyticsSkill,
  TaskManagerSkill,
  
  // Communication Skills
  EmailParserSkill,
  SmsSenderSkill,
  SlackIntegrationSkill,
  TeamsIntegrationSkill,
  DiscordBotSkill,
  WhatsappSenderSkill,
  TelegramBotSkill,
  VoiceCallSkill,
  VideoConferenceSkill,
  CalendarSchedulerSkill,
  PushNotificationSkill,
  RssPublisherSkill,
  SocialPosterSkill,
  CommentModeratorSkill,
  TranslationSkill,
  TranscriptionSkill,
  TextToSpeechSkill,
  SignatureGeneratorSkill,
  
  // Data Processing Skills
  CsvParserSkill,
  JsonTransformerSkill,
  XmlProcessorSkill,
  ExcelHandlerSkill,
  PdfGeneratorSkill,
  PdfExtractorSkill,
  ImageProcessorSkill,
  VideoEncoderSkill,
  DataCleanerSkill,
  DeduplicatorSkill,
  DataMergerSkill,
  DataSplitterSkill,
  DataAggregatorSkill,
  GeocoderSkill,
  ReverseGeocoderSkill,
  BarcodeGeneratorSkill,
  BarcodeScannerSkill,
  EncryptionSkill,
  DecryptionSkill,
  HashingSkill,
  CompressionSkill,
  Base64EncoderSkill,
  RegexMatcherSkill,
  
  // Integration Skills
  SalesforceConnectorSkill,
  HubspotConnectorSkill,
  StripePaymentSkill,
  PaypalPaymentSkill,
  ShopifyConnectorSkill,
  WoocommerceConnectorSkill,
  GoogleSheetsSkill,
  GoogleDriveSkill,
  DropboxConnectorSkill,
  AwsS3Skill,
  GithubIntegrationSkill,
  JiraConnectorSkill,
  TrelloConnectorSkill,
  AsanaConnectorSkill,
  MailchimpConnectorSkill,
  SendgridConnectorSkill,
  TwilioConnectorSkill,
  ZoomConnectorSkill,
  LinkedinConnectorSkill,
  TwitterConnectorSkill,
  
  // AI Powered Skills
  TextClassifierSkill,
  EntityExtractorSkill,
  ContentGeneratorSkill,
  ImageClassifierSkill,
  ObjectDetectorSkill,
  FaceRecognizerSkill,
  AnomalyDetectorSkill,
  RecommendationEngineSkill,
  KeywordExtractorSkill,
  IntentClassifierSkill,
  EmotionDetectorSkill,
  
  // Automation Skills
  WebScraperSkill,
  FormFillerSkill,
  BrowserAutomationSkill,
  TaskSchedulerSkill,
  FileMonitorSkill,
  BackupAutomationSkill,
  DeploymentAutomationSkill,
  TestingAutomationSkill,
  AlertSystemSkill,
  DataPipelineSkill,
  InvoiceAutomationSkill,
  ApprovalWorkflowSkill,
  OnboardingAutomationSkill,
  
  // Utility Skills
  UrlShortenerSkill,
  QrGeneratorSkill,
  PasswordGeneratorSkill,
  UuidGeneratorSkill,
  ColorConverterSkill,
  UnitConverterSkill,
  CurrencyConverterSkill,
  RandomGeneratorSkill,
  MockDataSkill,
  IpLookupSkill,
  DnsLookupSkill,
  WhoisLookupSkill,
  
  // Analytics Skills
  GoogleAnalyticsSkill,
  MixpanelTrackerSkill,
  SegmentTrackerSkill,
  HeatmapGeneratorSkill,
  AbTestingSkill,
  ConversionTrackerSkill,
  FunnelAnalyzerSkill,
  CohortAnalyzerSkill,
  RevenueTrackerSkill,
  UserBehaviorSkill,
  PerformanceMonitorSkill,
  ErrorTrackerSkill,
  SeoAnalyzerSkill,
  SocialAnalyticsSkill,
  CustomMetricsSkill
];