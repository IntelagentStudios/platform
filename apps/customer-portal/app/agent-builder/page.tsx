'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  SparklesIcon,
  CheckIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  PencilIcon,
  ArrowRightIcon,
  CogIcon,
  CircleStackIcon,
  ChatBubbleLeftRightIcon,
  CloudArrowUpIcon,
  DocumentChartBarIcon,
  EnvelopeIcon,
  CalendarIcon,
  MicrophoneIcon,
  BoltIcon,
  ChartBarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  CodeBracketIcon,
  ServerStackIcon,
  EyeIcon,
  CreditCardIcon,
  ArrowLeftIcon,
  ShieldCheckIcon,
  LightBulbIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../components/DashboardLayout';
import AgentBuilderChatV2 from '../../components/AgentBuilderChatV2';
import DashboardPreview from '../../components/DashboardPreview';

// Tool options with categories
const TOOLS = [
  { id: 'gmail', name: 'Gmail', category: 'Communication' },
  { id: 'outlook', name: 'Outlook', category: 'Communication' },
  { id: 'slack', name: 'Slack', category: 'Communication' },
  { id: 'teams', name: 'Microsoft Teams', category: 'Communication' },
  { id: 'salesforce', name: 'Salesforce', category: 'CRM' },
  { id: 'hubspot', name: 'HubSpot', category: 'CRM' },
  { id: 'sheets', name: 'Google Sheets', category: 'Data' },
  { id: 'excel', name: 'Excel', category: 'Data' },
  { id: 'quickbooks', name: 'QuickBooks', category: 'Finance' },
  { id: 'stripe', name: 'Stripe', category: 'Payments' },
  { id: 'shopify', name: 'Shopify', category: 'E-commerce' },
  { id: 'wordpress', name: 'WordPress', category: 'Website' },
];

// Skill detection mappings
const SKILL_MAPPINGS: { [key: string]: { skills: string[], price: number } } = {
  sales: {
    skills: ['Lead Generation', 'Email Outreach', 'CRM Sync', 'Lead Scoring', 'Pipeline Management'],
    price: 649
  },
  support: {
    skills: ['Ticket Management', 'Auto Response', 'Knowledge Base', 'Chat Support', 'FAQ Builder'],
    price: 349
  },
  marketing: {
    skills: ['Content Creation', 'Social Media', 'Email Campaigns', 'Analytics', 'SEO Optimization'],
    price: 449
  },
  operations: {
    skills: ['Workflow Automation', 'Task Management', 'Reporting', 'Data Sync', 'Process Optimization'],
    price: 549
  },
  data: {
    skills: ['Data Processing', 'Analytics', 'Custom Reports', 'Dashboard Creation', 'Predictive Insights'],
    price: 449
  },
  construction: {
    skills: ['Project Tracking', 'Bid Generation', 'Safety Compliance', 'Resource Scheduling', 'Permit Tracking'],
    price: 599
  }
};

// Skill Categories with icons and counts
const SKILL_CATEGORIES = [
  { name: 'Communication', count: 50, icon: EnvelopeIcon },
  { name: 'Data Processing', count: 60, icon: ServerStackIcon },
  { name: 'AI/ML', count: 70, icon: SparklesIcon },
  { name: 'Integration', count: 80, icon: CloudArrowUpIcon },
  { name: 'Automation', count: 50, icon: BoltIcon },
  { name: 'Analytics', count: 40, icon: ChartBarIcon },
  { name: 'Security', count: 30, icon: ShieldCheckIcon },
  { name: 'Utility', count: 15, icon: CogIcon }
];

// Skill suggestions based on selected skills
const SKILL_SUGGESTIONS: { [key: string]: string[] } = {
  'email_sender': ['email_automation', 'email_templates', 'email_tracking', 'spam_filter'],
  'sms_sender': ['sms_automation', 'sms_templates', 'two_factor_auth'],
  'slack_integration': ['slack_bot', 'slack_notifications', 'slack_workflow'],
  'csv_processor': ['data_cleaner', 'data_validator', 'data_transformer'],
  'text_classification': ['sentiment_analysis', 'intent_recognition', 'nlp_entity_extraction'],
  'salesforce_sync': ['salesforce_automation', 'salesforce_reporting', 'salesforce_custom_objects'],
  'task_scheduler': ['workflow_builder', 'event_trigger', 'batch_processor'],
  'dashboard_builder': ['report_generator', 'kpi_tracker', 'custom_metrics'],
  'access_control': ['authentication', 'authorization', 'encryption_service']
};

// Popular features with their descriptions and impact on price
const POPULAR_FEATURES = [
  {
    id: 'ai_chatbot',
    name: 'AI Chatbot Interface',
    description: 'Interactive chat to communicate with your agent',
    icon: ChatBubbleLeftRightIcon,
    priceImpact: 50,
    category: 'interaction'
  },
  {
    id: 'data_enrichment',
    name: 'Data Enrichment',
    description: 'Automatically enhance your data with AI insights',
    icon: SparklesIcon,
    priceImpact: 75,
    category: 'data'
  },
  {
    id: 'file_upload',
    name: 'File Upload & Processing',
    description: 'Upload CSVs, PDFs, docs for processing',
    icon: CloudArrowUpIcon,
    priceImpact: 45,
    category: 'data'
  },
  {
    id: 'report_generation',
    name: 'Report Generation',
    description: 'Automated reports and presentations',
    icon: DocumentChartBarIcon,
    priceImpact: 65,
    category: 'output'
  },
  {
    id: 'email_automation',
    name: 'Email Automation',
    description: 'Send and respond to emails automatically',
    icon: EnvelopeIcon,
    priceImpact: 55,
    category: 'communication'
  },
  {
    id: 'calendar_integration',
    name: 'Calendar Integration',
    description: 'Schedule and manage meetings',
    icon: CalendarIcon,
    priceImpact: 40,
    category: 'productivity'
  },
  {
    id: 'voice_assistant',
    name: 'Voice Assistant',
    description: 'Interact with your agent via voice',
    icon: MicrophoneIcon,
    priceImpact: 85,
    category: 'interaction'
  },
  {
    id: 'api_access',
    name: 'API Access',
    description: 'Integrate with external systems',
    icon: CodeBracketIcon,
    priceImpact: 95,
    category: 'integration'
  },
  {
    id: 'realtime_monitoring',
    name: 'Real-time Monitoring',
    description: 'Live dashboards and instant alerts',
    icon: ChartBarIcon,
    priceImpact: 70,
    category: 'monitoring'
  },
  {
    id: 'custom_workflows',
    name: 'Custom Workflows',
    description: 'Build automated multi-step processes',
    icon: BoltIcon,
    priceImpact: 80,
    category: 'automation'
  }
];

// Full skills list with proper categorization (395+ skills)
const ALL_SKILLS = [
  // Communication Skills (50+ skills)
  { id: 'email_sender', name: 'Email Sender', category: 'Communication' },
  { id: 'sms_sender', name: 'SMS Sender', category: 'Communication' },
  { id: 'slack_integration', name: 'Slack Integration', category: 'Communication' },
  { id: 'teams_integration', name: 'Teams Integration', category: 'Communication' },
  { id: 'whatsapp_api', name: 'WhatsApp API', category: 'Communication' },
  { id: 'telegram_bot', name: 'Telegram Bot', category: 'Communication' },
  { id: 'discord_webhook', name: 'Discord Webhook', category: 'Communication' },
  { id: 'twilio_voice', name: 'Twilio Voice', category: 'Communication' },
  { id: 'zoom_integration', name: 'Zoom Integration', category: 'Communication' },
  { id: 'webex_connector', name: 'Webex Connector', category: 'Communication' },
  { id: 'signal_api', name: 'Signal API', category: 'Communication' },
  { id: 'facebook_messenger', name: 'Facebook Messenger', category: 'Communication' },
  { id: 'instagram_dm', name: 'Instagram DM', category: 'Communication' },
  { id: 'twitter_dm', name: 'Twitter DM', category: 'Communication' },
  { id: 'linkedin_messaging', name: 'LinkedIn Messaging', category: 'Communication' },
  { id: 'push_notifications', name: 'Push Notifications', category: 'Communication' },
  { id: 'in_app_messaging', name: 'In-App Messaging', category: 'Communication' },
  { id: 'voice_broadcast', name: 'Voice Broadcast', category: 'Communication' },
  { id: 'video_messaging', name: 'Video Messaging', category: 'Communication' },
  { id: 'live_chat', name: 'Live Chat', category: 'Communication' },

  // Data Processing (60+ skills)
  { id: 'csv_processor', name: 'CSV Processor', category: 'Data Processing' },
  { id: 'json_transformer', name: 'JSON Transformer', category: 'Data Processing' },
  { id: 'xml_parser', name: 'XML Parser', category: 'Data Processing' },
  { id: 'data_cleaner', name: 'Data Cleaner', category: 'Data Processing' },
  { id: 'data_validator', name: 'Data Validator', category: 'Data Processing' },
  { id: 'etl_pipeline', name: 'ETL Pipeline', category: 'Data Processing' },
  { id: 'data_deduplication', name: 'Data Deduplication', category: 'Data Processing' },
  { id: 'data_normalization', name: 'Data Normalization', category: 'Data Processing' },
  { id: 'data_aggregation', name: 'Data Aggregation', category: 'Data Processing' },
  { id: 'data_migration', name: 'Data Migration', category: 'Data Processing' },
  { id: 'data_backup', name: 'Data Backup', category: 'Data Processing' },
  { id: 'data_recovery', name: 'Data Recovery', category: 'Data Processing' },
  { id: 'data_compression', name: 'Data Compression', category: 'Data Processing' },
  { id: 'data_encryption', name: 'Data Encryption', category: 'Data Processing' },
  { id: 'data_masking', name: 'Data Masking', category: 'Data Processing' },
  { id: 'stream_processing', name: 'Stream Processing', category: 'Data Processing' },
  { id: 'batch_processing', name: 'Batch Processing', category: 'Data Processing' },
  { id: 'real_time_sync', name: 'Real-time Sync', category: 'Data Processing' },
  { id: 'data_pipeline', name: 'Data Pipeline', category: 'Data Processing' },
  { id: 'data_warehouse', name: 'Data Warehouse', category: 'Data Processing' },

  // AI/ML Skills (70+ skills)
  { id: 'text_classification', name: 'Text Classification', category: 'AI/ML' },
  { id: 'sentiment_analysis', name: 'Sentiment Analysis', category: 'AI/ML' },
  { id: 'image_recognition', name: 'Image Recognition', category: 'AI/ML' },
  { id: 'nlp_entity_extraction', name: 'NLP Entity Extraction', category: 'AI/ML' },
  { id: 'predictive_analytics', name: 'Predictive Analytics', category: 'AI/ML' },
  { id: 'anomaly_detection', name: 'Anomaly Detection', category: 'AI/ML' },
  { id: 'chatbot_training', name: 'Chatbot Training', category: 'AI/ML' },
  { id: 'voice_recognition', name: 'Voice Recognition', category: 'AI/ML' },
  { id: 'language_translation', name: 'Language Translation', category: 'AI/ML' },
  { id: 'text_summarization', name: 'Text Summarization', category: 'AI/ML' },
  { id: 'question_answering', name: 'Question Answering', category: 'AI/ML' },
  { id: 'recommendation_engine', name: 'Recommendation Engine', category: 'AI/ML' },
  { id: 'fraud_detection', name: 'Fraud Detection', category: 'AI/ML' },
  { id: 'customer_segmentation', name: 'Customer Segmentation', category: 'AI/ML' },
  { id: 'churn_prediction', name: 'Churn Prediction', category: 'AI/ML' },
  { id: 'demand_forecasting', name: 'Demand Forecasting', category: 'AI/ML' },
  { id: 'price_optimization', name: 'Price Optimization', category: 'AI/ML' },
  { id: 'content_generation', name: 'Content Generation', category: 'AI/ML' },
  { id: 'intent_recognition', name: 'Intent Recognition', category: 'AI/ML' },
  { id: 'computer_vision', name: 'Computer Vision', category: 'AI/ML' },

  // Integration Skills (80+ skills)
  { id: 'salesforce_sync', name: 'Salesforce Sync', category: 'Integration' },
  { id: 'hubspot_connector', name: 'HubSpot Connector', category: 'Integration' },
  { id: 'stripe_payments', name: 'Stripe Payments', category: 'Integration' },
  { id: 'paypal_integration', name: 'PayPal Integration', category: 'Integration' },
  { id: 'shopify_api', name: 'Shopify API', category: 'Integration' },
  { id: 'wordpress_plugin', name: 'WordPress Plugin', category: 'Integration' },
  { id: 'zendesk_sync', name: 'Zendesk Sync', category: 'Integration' },
  { id: 'jira_integration', name: 'Jira Integration', category: 'Integration' },
  { id: 'github_connector', name: 'GitHub Connector', category: 'Integration' },
  { id: 'gitlab_api', name: 'GitLab API', category: 'Integration' },
  { id: 'dropbox_sync', name: 'Dropbox Sync', category: 'Integration' },
  { id: 'google_drive', name: 'Google Drive', category: 'Integration' },
  { id: 'onedrive_connector', name: 'OneDrive Connector', category: 'Integration' },
  { id: 'aws_integration', name: 'AWS Integration', category: 'Integration' },
  { id: 'azure_connector', name: 'Azure Connector', category: 'Integration' },
  { id: 'gcp_integration', name: 'GCP Integration', category: 'Integration' },
  { id: 'mailchimp_sync', name: 'Mailchimp Sync', category: 'Integration' },
  { id: 'sendgrid_api', name: 'SendGrid API', category: 'Integration' },
  { id: 'twilio_integration', name: 'Twilio Integration', category: 'Integration' },
  { id: 'zapier_connector', name: 'Zapier Connector', category: 'Integration' },

  // Automation Skills (50+ skills)
  { id: 'task_scheduler', name: 'Task Scheduler', category: 'Automation' },
  { id: 'workflow_builder', name: 'Workflow Builder', category: 'Automation' },
  { id: 'rule_engine', name: 'Rule Engine', category: 'Automation' },
  { id: 'batch_processor', name: 'Batch Processor', category: 'Automation' },
  { id: 'event_trigger', name: 'Event Trigger', category: 'Automation' },
  { id: 'process_automation', name: 'Process Automation', category: 'Automation' },
  { id: 'robotic_automation', name: 'Robotic Automation', category: 'Automation' },
  { id: 'test_automation', name: 'Test Automation', category: 'Automation' },
  { id: 'deployment_automation', name: 'Deployment Automation', category: 'Automation' },
  { id: 'backup_automation', name: 'Backup Automation', category: 'Automation' },
  { id: 'alert_automation', name: 'Alert Automation', category: 'Automation' },
  { id: 'response_automation', name: 'Response Automation', category: 'Automation' },
  { id: 'invoice_automation', name: 'Invoice Automation', category: 'Automation' },
  { id: 'order_processing', name: 'Order Processing', category: 'Automation' },
  { id: 'inventory_management', name: 'Inventory Management', category: 'Automation' },

  // Analytics Skills (40+ skills)
  { id: 'dashboard_builder', name: 'Dashboard Builder', category: 'Analytics' },
  { id: 'report_generator', name: 'Report Generator', category: 'Analytics' },
  { id: 'kpi_tracker', name: 'KPI Tracker', category: 'Analytics' },
  { id: 'trend_analyzer', name: 'Trend Analyzer', category: 'Analytics' },
  { id: 'performance_metrics', name: 'Performance Metrics', category: 'Analytics' },
  { id: 'user_analytics', name: 'User Analytics', category: 'Analytics' },
  { id: 'conversion_tracking', name: 'Conversion Tracking', category: 'Analytics' },
  { id: 'funnel_analysis', name: 'Funnel Analysis', category: 'Analytics' },
  { id: 'cohort_analysis', name: 'Cohort Analysis', category: 'Analytics' },
  { id: 'ab_testing', name: 'A/B Testing', category: 'Analytics' },
  { id: 'heatmap_generation', name: 'Heatmap Generation', category: 'Analytics' },
  { id: 'session_recording', name: 'Session Recording', category: 'Analytics' },
  { id: 'custom_metrics', name: 'Custom Metrics', category: 'Analytics' },
  { id: 'roi_calculator', name: 'ROI Calculator', category: 'Analytics' },
  { id: 'cost_analysis', name: 'Cost Analysis', category: 'Analytics' },

  // Security Skills (30+ skills)
  { id: 'access_control', name: 'Access Control', category: 'Security' },
  { id: 'authentication', name: 'Authentication', category: 'Security' },
  { id: 'authorization', name: 'Authorization', category: 'Security' },
  { id: 'encryption_service', name: 'Encryption Service', category: 'Security' },
  { id: 'security_audit', name: 'Security Audit', category: 'Security' },
  { id: 'vulnerability_scan', name: 'Vulnerability Scan', category: 'Security' },
  { id: 'threat_detection', name: 'Threat Detection', category: 'Security' },
  { id: 'incident_response', name: 'Incident Response', category: 'Security' },
  { id: 'compliance_checker', name: 'Compliance Checker', category: 'Security' },
  { id: 'ssl_management', name: 'SSL Management', category: 'Security' },
  { id: 'firewall_config', name: 'Firewall Config', category: 'Security' },
  { id: 'ddos_protection', name: 'DDoS Protection', category: 'Security' },
  { id: 'password_manager', name: 'Password Manager', category: 'Security' },
  { id: 'two_factor_auth', name: 'Two Factor Auth', category: 'Security' },
  { id: 'biometric_auth', name: 'Biometric Auth', category: 'Security' },

  // Utility Skills (45+ skills)
  { id: 'web_scraper', name: 'Web Scraper', category: 'Utility' },
  { id: 'pdf_generator', name: 'PDF Generator', category: 'Utility' },
  { id: 'qr_code_generator', name: 'QR Code Generator', category: 'Utility' },
  { id: 'barcode_scanner', name: 'Barcode Scanner', category: 'Utility' },
  { id: 'ocr_processor', name: 'OCR Processor', category: 'Utility' },
  { id: 'translation_api', name: 'Translation API', category: 'Utility' },
  { id: 'currency_converter', name: 'Currency Converter', category: 'Utility' },
  { id: 'weather_api', name: 'Weather API', category: 'Utility' },
  { id: 'geocoding_service', name: 'Geocoding Service', category: 'Utility' },
  { id: 'url_shortener', name: 'URL Shortener', category: 'Utility' },
  { id: 'file_converter', name: 'File Converter', category: 'Utility' },
  { id: 'image_optimizer', name: 'Image Optimizer', category: 'Utility' },
  { id: 'video_processor', name: 'Video Processor', category: 'Utility' },
  { id: 'audio_converter', name: 'Audio Converter', category: 'Utility' },
  { id: 'zip_extractor', name: 'Zip Extractor', category: 'Utility' },
  { id: 'calendar_sync', name: 'Calendar Sync', category: 'Utility' },
  { id: 'time_tracker', name: 'Time Tracker', category: 'Utility' },
  { id: 'code_formatter', name: 'Code Formatter', category: 'Utility' },
  { id: 'markdown_parser', name: 'Markdown Parser', category: 'Utility' },
  { id: 'regex_tester', name: 'Regex Tester', category: 'Utility' }
];

interface AgentConfig {
  name: string;
  description: string;
  tools: string[];
  skills: string[];
  price: number;
  agentType: string;
  features: string[];
  customSkills: string[];
}

type ViewMode = 'configure' | 'preview' | 'payment';

export default function AgentBuilderPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('configure');
  const [previewReady, setPreviewReady] = useState(false);
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    name: 'Custom AI Agent',
    description: '',
    tools: [],
    skills: [],
    price: 299,
    agentType: 'general',
    features: [],
    customSkills: []
  });
  const [inputDescription, setInputDescription] = useState('');
  const [showChatbot, setShowChatbot] = useState(false);
  const [showSkillsBreakdown, setShowSkillsBreakdown] = useState(false);
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [selectedSkillCategory, setSelectedSkillCategory] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [chatStep, setChatStep] = useState(0);
  const [chatResponses, setChatResponses] = useState<{[key: string]: string}>({});
  const [suggestedEnhancements, setSuggestedEnhancements] = useState<string[]>([]);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session');
        setIsLoggedIn(response.ok);
        // Non-logged in users get chatbot by default for more guidance
        // Logged in users get direct form by default (less hand-holding)
        setShowChatbot(!response.ok);
      } catch {
        setIsLoggedIn(false);
        setShowChatbot(true); // Default to chatbot if auth check fails
      }
    };
    checkAuth();
  }, []);

  // Detect agent type and skills from description
  const analyzeDescription = (desc: string) => {
    const lower = desc.toLowerCase();
    let detectedType = 'general';
    let detectedSkills: string[] = [];
    let basePrice = 299;

    // Detect agent type
    Object.entries(SKILL_MAPPINGS).forEach(([type, config]) => {
      if (lower.includes(type) ||
          (type === 'support' && (lower.includes('customer') || lower.includes('help'))) ||
          (type === 'operations' && lower.includes('workflow')) ||
          (type === 'data' && lower.includes('analytics'))) {
        detectedType = type;
        detectedSkills = config.skills;
        basePrice = config.price;
      }
    });

    // Detect tools
    const detectedTools = TOOLS.filter(tool =>
      lower.includes(tool.name.toLowerCase())
    ).map(t => t.id);

    setAgentConfig(prev => ({
      ...prev,
      description: desc,
      agentType: detectedType,
      skills: detectedSkills,
      tools: detectedTools,
      price: basePrice,
      name: detectedType === 'general'
        ? 'Custom AI Agent'
        : `${detectedType.charAt(0).toUpperCase() + detectedType.slice(1)} Agent`
    }));
  };

  // Handle tool selection
  const toggleTool = (toolId: string) => {
    setAgentConfig(prev => ({
      ...prev,
      tools: prev.tools.includes(toolId)
        ? prev.tools.filter(t => t !== toolId)
        : [...prev.tools, toolId]
    }));
  };

  // Handle skill removal
  const removeSkill = (skill: string) => {
    setAgentConfig(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  // Handle feature toggle
  const toggleFeature = (featureId: string) => {
    setAgentConfig(prev => {
      const features = prev.features.includes(featureId)
        ? prev.features.filter(f => f !== featureId)
        : [...prev.features, featureId];

      // Calculate price impact
      const featurePrice = features.reduce((total, fid) => {
        const feature = POPULAR_FEATURES.find(f => f.id === fid);
        return total + (feature?.priceImpact || 0);
      }, 0);

      const basePrice = SKILL_MAPPINGS[prev.agentType]?.price || 299;

      return {
        ...prev,
        features,
        price: basePrice + featurePrice
      };
    });
  };

  // Handle custom skill toggle
  const toggleCustomSkill = (skillId: string) => {
    setAgentConfig(prev => {
      const newSkills = prev.customSkills.includes(skillId)
        ? prev.customSkills.filter(s => s !== skillId)
        : [...prev.customSkills, skillId];

      // Update suggested enhancements based on selected skills
      const suggestions = new Set<string>();
      newSkills.forEach(skill => {
        const skillSuggestions = SKILL_SUGGESTIONS[skill] || [];
        skillSuggestions.forEach(s => suggestions.add(s));
      });
      setSuggestedEnhancements(Array.from(suggestions).filter(s => !newSkills.includes(s)));

      return {
        ...prev,
        customSkills: newSkills
      };
    });
  };

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Calculate total price including features
  const calculateTotalPrice = () => {
    const basePrice = agentConfig.price;
    const featuresPrice = agentConfig.features.reduce((total, fid) => {
      const feature = POPULAR_FEATURES.find(f => f.id === fid);
      return total + (feature?.priceImpact || 0);
    }, 0);
    return basePrice + featuresPrice;
  };

  // Handle chat completion
  const handleChatComplete = (config: any) => {
    setAgentConfig({
      name: config.agentName || 'Custom AI Agent',
      description: config.goal || '',
      tools: config.tools || [],
      skills: config.suggestedSkills || [],
      price: 299,
      agentType: config.industry?.toLowerCase() || 'general',
      features: [],
      customSkills: []
    });
  };

  // Continue to preview
  const handleContinue = () => {
    setViewMode('preview');
    setPreviewReady(false);
    setTimeout(() => setPreviewReady(true), 1000);
  };

  // Handle payment
  const handleProceedToPayment = () => {
    setViewMode('payment');
  };

  // Handle back navigation
  const handleBackToConfigure = () => {
    setViewMode('configure');
  };

  // Handle try another
  const handleTryAnother = () => {
    setViewMode('configure');
    setAgentConfig({
      name: 'Custom AI Agent',
      description: '',
      tools: [],
      skills: [],
      price: 299,
      agentType: 'general',
      features: [],
      customSkills: []
    });
    setInputDescription('');
  };

  // Handle login to purchase
  const handleLoginToPurchase = () => {
    sessionStorage.setItem('pendingAgentConfig', JSON.stringify(agentConfig));
    router.push('/login?redirect=/agent-builder');
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="px-8 py-6 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
              {viewMode === 'configure' ? 'Build Your Custom AI Agent' :
               viewMode === 'preview' ? 'Preview Your AI Dashboard' :
               'Activate Your Agent'}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
              {viewMode === 'configure' ? 'Describe your needs and see what we\'ll build for you' :
               viewMode === 'preview' ? 'Explore the features and capabilities of your custom dashboard' :
               'Choose your plan to activate your agent'}
            </p>
          </div>
          {viewMode !== 'configure' && (
            <button
              onClick={handleBackToConfigure}
              className="px-4 py-2 rounded-lg border transition hover:opacity-80 flex items-center gap-2"
              style={{
                borderColor: 'rgba(169, 189, 203, 0.3)',
                backgroundColor: 'transparent',
                color: 'rgba(229, 227, 220, 0.9)'
              }}
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Configure
            </button>
          )}
        </div>
      </header>

      {/* Configuration View */}
      {viewMode === 'configure' && (
        <div className="flex gap-6 p-8">
          {/* Left Panel - Input/Chat */}
          <div className="flex-1">
          <div className="rounded-xl shadow-sm border" style={{
            backgroundColor: 'rgba(58, 64, 64, 0.5)',
            borderColor: 'rgba(169, 189, 203, 0.15)',
            minHeight: '600px'
          }}>
            {showChatbot ? (
              /* Chatbot interface - available to everyone */
              <div style={{ height: '600px' }}>
                <AgentBuilderChatV2
                  onComplete={handleChatComplete}
                  isDemo={true}
                />
              </div>
            ) : (
              /* Direct input form - available to everyone */
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2"
                    style={{ color: 'rgb(229, 227, 220)' }}>
                    What's the main job you'd like your agent to do?
                  </label>
                  <textarea
                    value={inputDescription}
                    onChange={(e) => {
                      setInputDescription(e.target.value);
                      analyzeDescription(e.target.value);
                    }}
                    placeholder="E.g., I need an agent to handle customer support tickets, respond to common questions, and escalate complex issues. We use Slack and Gmail for communication..."
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[rgb(169,189,203)]"
                    rows={6}
                    style={{
                      backgroundColor: 'rgba(48, 54, 54, 0.5)',
                      borderColor: 'rgba(169, 189, 203, 0.3)',
                      color: 'rgb(229, 227, 220)'
                    }}
                  />
                </div>

                {/* Popular Features Section */}
                <div>
                  <label className="block text-sm font-medium mb-3"
                    style={{ color: 'rgb(229, 227, 220)' }}>
                    Popular Features
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {POPULAR_FEATURES.map(feature => (
                      <button
                        key={feature.id}
                        onClick={() => toggleFeature(feature.id)}
                        className={`px-4 py-3 rounded-lg border text-left transition hover:shadow-md ${
                          agentConfig.features.includes(feature.id) ? 'ring-2 ring-[rgb(169,189,203)]' : ''
                        }`}
                        style={{
                          backgroundColor: agentConfig.features.includes(feature.id)
                            ? 'rgba(169, 189, 203, 0.15)'
                            : 'rgba(48, 54, 54, 0.3)',
                          borderColor: agentConfig.features.includes(feature.id)
                            ? 'rgb(169, 189, 203)'
                            : 'rgba(169, 189, 203, 0.2)',
                          color: 'rgb(229, 227, 220)'
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <feature.icon className="h-5 w-5 mt-0.5" style={{
                            color: agentConfig.features.includes(feature.id)
                              ? 'rgb(169, 189, 203)'
                              : 'rgba(169, 189, 203, 0.6)'
                          }} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{feature.name}</span>
                              {agentConfig.features.includes(feature.id) && (
                                <CheckIcon className="h-4 w-4" style={{ color: 'rgb(169, 189, 203)' }} />
                              )}
                            </div>
                            <p className="text-xs mt-1" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                              {feature.description}
                            </p>
                            <span className="text-xs font-medium" style={{ color: 'rgba(169, 189, 203, 0.5)' }}>
                              +£{feature.priceImpact}/mo
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Expandable Skills Breakdown */}
                <div>
                  <button
                    onClick={() => setShowSkillsBreakdown(!showSkillsBreakdown)}
                    className="w-full px-4 py-3 rounded-lg border transition hover:opacity-80 flex items-center justify-between"
                    style={{
                      backgroundColor: 'rgba(48, 54, 54, 0.3)',
                      borderColor: 'rgba(169, 189, 203, 0.3)',
                      color: 'rgb(229, 227, 220)'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <ServerStackIcon className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
                      <span className="font-medium">Advanced: Choose from 395+ Skills</span>
                      {agentConfig.customSkills.length > 0 && (
                        <span className="px-2 py-0.5 text-xs rounded-full" style={{
                          backgroundColor: 'rgba(169, 189, 203, 0.2)',
                          color: 'rgb(169, 189, 203)'
                        }}>
                          {agentConfig.customSkills.length} selected
                        </span>
                      )}
                    </div>
                    {showSkillsBreakdown ? (
                      <ChevronUpIcon className="h-5 w-5" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
                    )}
                  </button>

                  {showSkillsBreakdown && (
                    <div className="mt-3 p-4 rounded-lg border" style={{
                      backgroundColor: 'rgba(48, 54, 54, 0.2)',
                      borderColor: 'rgba(169, 189, 203, 0.2)'
                    }}>
                      {/* Search bar */}
                      <div className="mb-4 relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5"
                          style={{ color: 'rgba(169, 189, 203, 0.5)' }} />
                        <input
                          type="text"
                          placeholder="Search skills..."
                          value={skillSearchQuery}
                          onChange={(e) => setSkillSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 rounded-lg border"
                          style={{
                            backgroundColor: 'rgba(48, 54, 54, 0.5)',
                            borderColor: 'rgba(169, 189, 203, 0.3)',
                            color: 'rgb(229, 227, 220)'
                          }}
                        />
                      </div>

                      {/* Suggested Enhancements */}
                      {suggestedEnhancements.length > 0 && (
                        <div className="mb-4 p-3 rounded-lg" style={{
                          backgroundColor: 'rgba(169, 189, 203, 0.05)',
                          borderLeft: '3px solid rgb(169, 189, 203)'
                        }}>
                          <div className="flex items-start gap-2 mb-2">
                            <LightBulbIcon className="h-5 w-5 mt-0.5" style={{ color: 'rgb(169, 189, 203)' }} />
                            <div className="flex-1">
                              <p className="text-sm font-medium mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                                Suggested Enhancements
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {suggestedEnhancements.slice(0, 5).map(skillId => {
                                  const skill = ALL_SKILLS.find(s => s.id === skillId);
                                  return skill ? (
                                    <button
                                      key={skillId}
                                      onClick={() => toggleCustomSkill(skillId)}
                                      className="px-2 py-1 rounded-lg border text-xs hover:opacity-80 transition flex items-center gap-1"
                                      style={{
                                        backgroundColor: 'rgba(169, 189, 203, 0.1)',
                                        borderColor: 'rgba(169, 189, 203, 0.3)',
                                        color: 'rgb(169, 189, 203)'
                                      }}
                                    >
                                      <PlusIcon className="h-3 w-3" />
                                      {skill.name}
                                    </button>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Skills by Category */}
                      <div className="max-h-64 overflow-y-auto">
                        <div className="space-y-2">
                          {SKILL_CATEGORIES.map(category => {
                            const categorySkills = ALL_SKILLS.filter(skill =>
                              skill.category === category.name &&
                              (skillSearchQuery === '' ||
                               skill.name.toLowerCase().includes(skillSearchQuery.toLowerCase()) ||
                               skill.category.toLowerCase().includes(skillSearchQuery.toLowerCase()))
                            );

                            if (categorySkills.length === 0 && skillSearchQuery !== '') {
                              return null;
                            }

                            const Icon = category.icon;
                            const isExpanded = expandedCategories.has(category.name);
                            const selectedCount = categorySkills.filter(s =>
                              agentConfig.customSkills.includes(s.id)
                            ).length;

                            return (
                              <div key={category.name} className="rounded-lg border" style={{
                                backgroundColor: 'rgba(58, 64, 64, 0.2)',
                                borderColor: 'rgba(169, 189, 203, 0.2)'
                              }}>
                                <button
                                  onClick={() => toggleCategory(category.name)}
                                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-opacity-10 transition"
                                  style={{
                                    backgroundColor: selectedCount > 0 ? 'rgba(169, 189, 203, 0.05)' : 'transparent'
                                  }}
                                >
                                  <div className="flex items-center gap-3">
                                    <Icon className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
                                    <span className="font-medium" style={{ color: 'rgb(229, 227, 220)' }}>
                                      {category.name}
                                    </span>
                                    <span className="text-xs px-2 py-0.5 rounded-full" style={{
                                      backgroundColor: 'rgba(169, 189, 203, 0.1)',
                                      color: 'rgba(169, 189, 203, 0.8)'
                                    }}>
                                      {categorySkills.length}
                                    </span>
                                    {selectedCount > 0 && (
                                      <span className="text-xs px-2 py-0.5 rounded-full" style={{
                                        backgroundColor: 'rgba(169, 189, 203, 0.2)',
                                        color: 'rgb(169, 189, 203)'
                                      }}>
                                        {selectedCount} selected
                                      </span>
                                    )}
                                  </div>
                                  {isExpanded ? (
                                    <ChevronUpIcon className="h-5 w-5" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
                                  ) : (
                                    <ChevronDownIcon className="h-5 w-5" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
                                  )}
                                </button>

                                {isExpanded && (
                                  <div className="px-4 pb-3 pt-1">
                                    <div className="grid grid-cols-2 gap-2">
                                      {categorySkills.map(skill => (
                                        <button
                                          key={skill.id}
                                          onClick={() => toggleCustomSkill(skill.id)}
                                          className="px-3 py-2 rounded-lg border text-sm text-left transition flex items-center justify-between"
                                          style={{
                                            backgroundColor: agentConfig.customSkills.includes(skill.id)
                                              ? 'rgba(169, 189, 203, 0.1)'
                                              : 'rgba(58, 64, 64, 0.3)',
                                            borderColor: agentConfig.customSkills.includes(skill.id)
                                              ? 'rgb(169, 189, 203)'
                                              : 'rgba(169, 189, 203, 0.2)',
                                            color: 'rgb(229, 227, 220)'
                                          }}
                                        >
                                          <span className="text-xs">{skill.name}</span>
                                          {agentConfig.customSkills.includes(skill.id) && (
                                            <CheckIcon className="h-3 w-3 flex-shrink-0" style={{ color: 'rgb(169, 189, 203)' }} />
                                          )}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {SKILL_CATEGORIES.every(category =>
                          ALL_SKILLS.filter(skill =>
                            skill.category === category.name &&
                            (skill.name.toLowerCase().includes(skillSearchQuery.toLowerCase()) ||
                             skill.category.toLowerCase().includes(skillSearchQuery.toLowerCase()))
                          ).length === 0
                        ) && skillSearchQuery !== '' && (
                          <p className="text-sm text-center py-4" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                            No skills found matching your search
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3"
                    style={{ color: 'rgb(229, 227, 220)' }}>
                    Which tools do you already use? (optional)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {TOOLS.map(tool => (
                      <button
                        key={tool.id}
                        onClick={() => toggleTool(tool.id)}
                        className={`px-3 py-2 rounded-lg border text-sm transition flex items-center justify-between ${
                          agentConfig.tools.includes(tool.id) ? 'ring-2 ring-[rgb(169,189,203)]' : ''
                        }`}
                        style={{
                          backgroundColor: agentConfig.tools.includes(tool.id)
                            ? 'rgba(169, 189, 203, 0.2)'
                            : 'rgba(58, 64, 64, 0.3)',
                          borderColor: agentConfig.tools.includes(tool.id)
                            ? 'rgb(169, 189, 203)'
                            : 'rgba(169, 189, 203, 0.3)',
                          color: 'rgb(229, 227, 220)'
                        }}
                      >
                        <span>{tool.name}</span>
                        {agentConfig.tools.includes(tool.id) && (
                          <CheckIcon className="h-4 w-4" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setShowChatbot(!showChatbot)}
                  className="text-sm flex items-center gap-2 hover:opacity-80 transition"
                  style={{ color: 'rgb(169, 189, 203)' }}
                >
                  <SparklesIcon className="h-4 w-4" />
                  {showChatbot ? 'Switch to quick form' : 'Prefer guided help? Use AI assistant'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Live Preview */}
        <div className="w-[450px]">
          <div className="rounded-xl shadow-sm border p-6 sticky top-6" style={{
            backgroundColor: 'rgba(58, 64, 64, 0.5)',
            borderColor: 'rgba(169, 189, 203, 0.15)'
          }}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'rgb(229, 227, 220)' }}>
              <CogIcon className="h-6 w-6" style={{ color: 'rgb(169, 189, 203)' }} />
              What You're Building
            </h2>

            {/* Agent Name */}
            <div className="mb-4">
              <label className="text-xs font-medium uppercase tracking-wider"
                style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                Agent Name
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="text"
                  value={agentConfig.name}
                  onChange={(e) => setAgentConfig(prev => ({ ...prev, name: e.target.value }))}
                  className="flex-1 bg-transparent border-b text-lg font-semibold focus:outline-none"
                  style={{
                    borderColor: 'rgba(169, 189, 203, 0.3)',
                    color: 'rgb(229, 227, 220)'
                  }}
                />
                <PencilIcon className="h-4 w-4" style={{ color: 'rgba(169, 189, 203, 0.5)' }} />
              </div>
            </div>

            {/* Skills Detected */}
            <div className="mb-4">
              <label className="text-xs font-medium uppercase tracking-wider"
                style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                Skills Detected ({agentConfig.skills.length})
              </label>
              <div className="mt-2 flex flex-wrap gap-2 min-h-[60px]">
                {agentConfig.skills.length > 0 ? (
                  agentConfig.skills.map(skill => (
                    <span
                      key={skill}
                      className="px-3 py-1 rounded-full text-xs flex items-center gap-1"
                      style={{
                        backgroundColor: 'rgba(169, 189, 203, 0.1)',
                        color: 'rgb(169, 189, 203)',
                        border: '1px solid rgba(169, 189, 203, 0.3)'
                      }}
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="ml-1 hover:opacity-70"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-sm italic" style={{ color: 'rgba(169, 189, 203, 0.4)' }}>
                    Skills will appear as you describe your needs...
                  </span>
                )}
              </div>
            </div>

            {/* Features */}
            {agentConfig.features.length > 0 && (
              <div className="mb-4">
                <label className="text-xs font-medium uppercase tracking-wider"
                  style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                  Features ({agentConfig.features.length})
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {agentConfig.features.map(featureId => {
                    const feature = POPULAR_FEATURES.find(f => f.id === featureId);
                    return feature ? (
                      <span
                        key={featureId}
                        className="px-2 py-1 rounded text-xs flex items-center gap-1"
                        style={{
                          backgroundColor: 'rgba(169, 189, 203, 0.15)',
                          color: 'rgba(229, 227, 220, 0.9)',
                          border: '1px solid rgba(169, 189, 203, 0.3)'
                        }}
                      >
                        <feature.icon className="h-3 w-3" />
                        {feature.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Custom Skills */}
            {agentConfig.customSkills.length > 0 && (
              <div className="mb-4">
                <label className="text-xs font-medium uppercase tracking-wider"
                  style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                  Custom Skills ({agentConfig.customSkills.length})
                </label>
                <div className="mt-2 max-h-24 overflow-y-auto">
                  <div className="flex flex-wrap gap-1">
                    {agentConfig.customSkills.slice(0, 10).map(skillId => {
                      const skill = ALL_SKILLS.find(s => s.id === skillId);
                      return skill ? (
                        <span
                          key={skillId}
                          className="px-2 py-1 rounded text-xs"
                          style={{
                            backgroundColor: 'rgba(169, 189, 203, 0.1)',
                            color: 'rgba(229, 227, 220, 0.8)'
                          }}
                        >
                          {skill.name}
                        </span>
                      ) : null;
                    })}
                    {agentConfig.customSkills.length > 10 && (
                      <span className="px-2 py-1 rounded text-xs"
                        style={{
                          backgroundColor: 'rgba(169, 189, 203, 0.05)',
                          color: 'rgba(169, 189, 203, 0.7)'
                        }}>
                        +{agentConfig.customSkills.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Suggested Enhancements in Right Panel */}
            {suggestedEnhancements.length > 0 && (
              <div className="mb-4">
                <label className="text-xs font-medium uppercase tracking-wider flex items-center gap-2"
                  style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                  <LightBulbIcon className="h-3 w-3" />
                  Suggested Enhancements
                </label>
                <div className="mt-2">
                  <div className="flex flex-wrap gap-1">
                    {suggestedEnhancements.slice(0, 3).map(skillId => {
                      const skill = ALL_SKILLS.find(s => s.id === skillId);
                      return skill ? (
                        <span
                          key={skillId}
                          className="px-2 py-1 rounded text-xs animate-pulse"
                          style={{
                            backgroundColor: 'rgba(169, 189, 203, 0.15)',
                            color: 'rgb(169, 189, 203)'
                          }}
                        >
                          {skill.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Tools/Integrations */}
            {agentConfig.tools.length > 0 && (
              <div className="mb-4">
                <label className="text-xs font-medium uppercase tracking-wider"
                  style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                  Integrations
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {agentConfig.tools.map(toolId => {
                    const tool = TOOLS.find(t => t.id === toolId);
                    return tool ? (
                      <span
                        key={toolId}
                        className="px-2 py-1 rounded text-xs"
                        style={{
                          backgroundColor: 'rgba(169, 189, 203, 0.1)',
                          color: 'rgba(229, 227, 220, 0.8)'
                        }}
                      >
                        {tool.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Price Estimate */}
            <div className="mb-6 p-4 rounded-lg" style={{
              backgroundColor: 'rgba(169, 189, 203, 0.1)',
              border: '1px solid rgba(169, 189, 203, 0.3)'
            }}>
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-medium" style={{ color: 'rgba(229, 227, 220, 0.7)' }}>
                  Estimated Monthly Price
                </span>
                <div>
                  <span className="text-3xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                    £{calculateTotalPrice()}
                  </span>
                  <span className="text-sm" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                    /month
                  </span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="mt-3 pt-3 border-t text-xs space-y-1" style={{
                borderColor: 'rgba(169, 189, 203, 0.2)',
                color: 'rgba(169, 189, 203, 0.7)'
              }}>
                <div className="flex justify-between">
                  <span>Base Agent ({agentConfig.agentType}):</span>
                  <span className="font-medium">£{agentConfig.price}</span>
                </div>
                {agentConfig.features.length > 0 && (
                  <>
                    {agentConfig.features.map(fid => {
                      const feature = POPULAR_FEATURES.find(f => f.id === fid);
                      return feature ? (
                        <div key={fid} className="flex justify-between">
                          <span className="pl-2">+ {feature.name}:</span>
                          <span>£{feature.priceImpact}</span>
                        </div>
                      ) : null;
                    })}
                  </>
                )}
                {agentConfig.customSkills.length > 0 && (
                  <div className="pt-2 mt-2 border-t text-xs italic" style={{
                    borderColor: 'rgba(169, 189, 203, 0.1)',
                    color: 'rgba(169, 189, 203, 0.5)'
                  }}>
                    * {agentConfig.customSkills.length} skills included at no extra cost
                  </div>
                )}
              </div>
            </div>

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              className="w-full px-6 py-3 rounded-lg transition hover:opacity-80 flex items-center justify-center gap-2"
              style={{
                backgroundColor: 'rgb(169, 189, 203)',
                color: 'white'
              }}
              disabled={!agentConfig.description && agentConfig.skills.length === 0}
            >
              <span>Continue to Full Preview</span>
              <ArrowRightIcon className="h-5 w-5" />
            </button>

            {!isLoggedIn && (
              <p className="text-xs text-center mt-3" style={{ color: 'rgba(169, 189, 203, 0.5)' }}>
                No account or payment required to preview
              </p>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Preview View */}
      {viewMode === 'preview' && (
        <div className="p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                Your AI Agent Dashboard
              </h2>
              <p style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                This is how your custom dashboard will look once activated
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleTryAnother}
                className="px-4 py-2 rounded-lg border transition hover:opacity-80"
                style={{
                  borderColor: 'rgba(169, 189, 203, 0.3)',
                  backgroundColor: 'transparent',
                  color: 'rgba(229, 227, 220, 0.9)'
                }}
              >
                Build Another
              </button>
              <button
                onClick={handleProceedToPayment}
                className="px-6 py-2 rounded-lg transition hover:opacity-80 flex items-center gap-2"
                style={{
                  backgroundColor: 'rgb(169, 189, 203)',
                  color: 'white'
                }}
              >
                <span>Activate This Agent</span>
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Dashboard Preview */}
          {!previewReady ? (
            <div className="rounded-xl border p-32 text-center" style={{
              backgroundColor: 'rgba(58, 64, 64, 0.3)',
              borderColor: 'rgba(169, 189, 203, 0.15)'
            }}>
              <div className="animate-pulse space-y-4">
                <div className="h-4 rounded w-3/4 mx-auto" style={{ backgroundColor: 'rgba(169, 189, 203, 0.2)' }}></div>
                <div className="h-4 rounded w-1/2 mx-auto" style={{ backgroundColor: 'rgba(169, 189, 203, 0.2)' }}></div>
              </div>
              <p className="mt-6" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                Generating your dashboard preview...
              </p>
            </div>
          ) : (
            <DashboardPreview
              selectedSkills={(agentConfig.skills || []).concat(
                agentConfig.customSkills.map(sid => {
                  const skill = ALL_SKILLS.find(s => s.id === sid);
                  return skill?.name || sid;
                })
              ).map((skill: string, index: number) => ({
                id: `skill-${index}`,
                name: skill,
                category: 'automation'
              }))}
              agentName={agentConfig.name || 'Custom AI Agent'}
              requirements={{
                goal: agentConfig.description || '',
                industry: agentConfig.agentType || 'general'
              }}
            />
          )}
        </div>
      )}

      {/* Payment View */}
      {viewMode === 'payment' && (
        <div className="p-8">
          <div className="max-w-2xl mx-auto">
            <div className="rounded-xl shadow-sm border overflow-hidden" style={{
              backgroundColor: 'rgba(58, 64, 64, 0.5)',
              borderColor: 'rgba(169, 189, 203, 0.15)'
            }}>
              <div className="p-8 text-center">
                <CreditCardIcon className="h-16 w-16 mx-auto mb-4" style={{ color: 'rgb(169, 189, 203)' }} />
                <h2 className="text-2xl font-bold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
                  Ready to Activate Your Agent?
                </h2>

                <div className="rounded-lg p-6 mb-6" style={{
                  backgroundColor: 'rgba(58, 64, 64, 0.3)',
                  border: '1px solid rgba(169, 189, 203, 0.15)'
                }}>
                  <h3 className="text-lg font-semibold mb-3" style={{ color: 'rgb(229, 227, 220)' }}>
                    {agentConfig.name}
                  </h3>
                  <div className="text-3xl font-bold mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                    £{calculateTotalPrice()}<span className="text-lg font-normal">/month</span>
                  </div>

                  {/* Features Summary */}
                  <div className="mt-4 space-y-2">
                    {agentConfig.features.length > 0 && (
                      <div className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
                        <strong>Features:</strong> {agentConfig.features.map(fid =>
                          POPULAR_FEATURES.find(f => f.id === fid)?.name
                        ).filter(Boolean).join(', ')}
                      </div>
                    )}
                    {agentConfig.skills.length > 0 && (
                      <div className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
                        <strong>Skills:</strong> {agentConfig.skills.length} pre-configured
                      </div>
                    )}
                    {agentConfig.customSkills.length > 0 && (
                      <div className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
                        <strong>Custom Skills:</strong> {agentConfig.customSkills.length} selected
                      </div>
                    )}
                  </div>

                  <ul className="space-y-2 mt-6 text-left max-w-sm mx-auto">
                    <li className="flex items-start gap-2">
                      <CheckIcon className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: 'rgb(169, 189, 203)' }} />
                      <span style={{ color: 'rgba(229, 227, 220, 0.9)' }}>Full agent activation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckIcon className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: 'rgb(169, 189, 203)' }} />
                      <span style={{ color: 'rgba(229, 227, 220, 0.9)' }}>Unlimited operations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckIcon className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: 'rgb(169, 189, 203)' }} />
                      <span style={{ color: 'rgba(229, 227, 220, 0.9)' }}>24/7 support</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  {isLoggedIn ? (
                    <button
                      onClick={() => router.push('/billing?product=custom-agent')}
                      className="w-full px-6 py-3 rounded-lg transition hover:opacity-80"
                      style={{
                        backgroundColor: 'rgb(169, 189, 203)',
                        color: 'white'
                      }}
                    >
                      Proceed to Payment
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleLoginToPurchase}
                        className="w-full px-6 py-3 rounded-lg transition hover:opacity-80"
                        style={{
                          backgroundColor: 'rgb(169, 189, 203)',
                          color: 'white'
                        }}
                      >
                        Sign In to Purchase
                      </button>

                      <button
                        onClick={() => router.push('/signup?plan=agent')}
                        className="w-full px-6 py-3 rounded-lg border transition hover:opacity-80"
                        style={{
                          borderColor: 'rgba(169, 189, 203, 0.3)',
                          backgroundColor: 'transparent',
                          color: 'rgba(229, 227, 220, 0.9)'
                        }}
                      >
                        Create Account & Purchase
                      </button>
                    </>
                  )}

                  <button
                    onClick={handleTryAnother}
                    className="w-full px-6 py-3 rounded-lg transition hover:opacity-80"
                    style={{
                      backgroundColor: 'transparent',
                      color: 'rgba(169, 189, 203, 0.8)'
                    }}
                  >
                    Build Another Agent
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}