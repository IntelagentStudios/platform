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
  PlusIcon,
  CubeIcon,
  LinkIcon,
  WrenchIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../components/DashboardLayout';
import AgentBuilderChatV2 from '../../components/AgentBuilderChatV2';
import DashboardPreview from '../../components/DashboardPreview';

// Comprehensive integrations list organized by category
const INTEGRATIONS = {
  'CRM & Sales': [
    { id: 'salesforce', name: 'Salesforce', description: 'Full CRM integration with custom objects' },
    { id: 'hubspot', name: 'HubSpot', description: 'Marketing and sales automation' },
    { id: 'pipedrive', name: 'Pipedrive', description: 'Sales pipeline management' },
    { id: 'zoho_crm', name: 'Zoho CRM', description: 'Complete CRM suite integration' },
    { id: 'microsoft_dynamics', name: 'Microsoft Dynamics', description: 'Enterprise CRM solution' },
    { id: 'freshsales', name: 'Freshsales', description: 'AI-powered CRM' },
    { id: 'copper', name: 'Copper', description: 'G Suite CRM integration' },
    { id: 'insightly', name: 'Insightly', description: 'CRM and project management' }
  ],
  'Communication': [
    { id: 'gmail', name: 'Gmail', description: 'Email automation and management' },
    { id: 'outlook', name: 'Outlook', description: 'Microsoft email and calendar' },
    { id: 'slack', name: 'Slack', description: 'Team messaging and workflows' },
    { id: 'teams', name: 'Microsoft Teams', description: 'Collaboration and communication' },
    { id: 'discord', name: 'Discord', description: 'Community messaging platform' },
    { id: 'telegram', name: 'Telegram', description: 'Instant messaging and bots' },
    { id: 'whatsapp', name: 'WhatsApp Business', description: 'Business messaging' },
    { id: 'twilio', name: 'Twilio', description: 'SMS and voice communication' }
  ],
  'E-commerce': [
    { id: 'shopify', name: 'Shopify', description: 'Complete e-commerce platform' },
    { id: 'woocommerce', name: 'WooCommerce', description: 'WordPress e-commerce' },
    { id: 'magento', name: 'Magento', description: 'Open-source e-commerce' },
    { id: 'bigcommerce', name: 'BigCommerce', description: 'SaaS e-commerce platform' },
    { id: 'amazon', name: 'Amazon Seller', description: 'Marketplace integration' },
    { id: 'ebay', name: 'eBay', description: 'Online marketplace' },
    { id: 'etsy', name: 'Etsy', description: 'Creative marketplace' },
    { id: 'square', name: 'Square', description: 'Payment and commerce' }
  ],
  'Marketing': [
    { id: 'mailchimp', name: 'Mailchimp', description: 'Email marketing automation' },
    { id: 'activecampaign', name: 'ActiveCampaign', description: 'Marketing automation' },
    { id: 'klaviyo', name: 'Klaviyo', description: 'E-commerce email marketing' },
    { id: 'sendgrid', name: 'SendGrid', description: 'Email delivery service' },
    { id: 'convertkit', name: 'ConvertKit', description: 'Creator marketing platform' },
    { id: 'drip', name: 'Drip', description: 'E-commerce CRM' },
    { id: 'marketo', name: 'Marketo', description: 'Enterprise marketing automation' },
    { id: 'pardot', name: 'Pardot', description: 'B2B marketing automation' }
  ],
  'Analytics': [
    { id: 'google_analytics', name: 'Google Analytics', description: 'Web analytics platform' },
    { id: 'mixpanel', name: 'Mixpanel', description: 'Product analytics' },
    { id: 'amplitude', name: 'Amplitude', description: 'Digital analytics platform' },
    { id: 'segment', name: 'Segment', description: 'Customer data platform' },
    { id: 'heap', name: 'Heap', description: 'Automatic analytics' },
    { id: 'hotjar', name: 'Hotjar', description: 'Behavior analytics' },
    { id: 'fullstory', name: 'FullStory', description: 'Digital experience analytics' },
    { id: 'tableau', name: 'Tableau', description: 'Business intelligence' }
  ],
  'Project Management': [
    { id: 'jira', name: 'Jira', description: 'Agile project management' },
    { id: 'asana', name: 'Asana', description: 'Work management platform' },
    { id: 'monday', name: 'Monday.com', description: 'Work OS platform' },
    { id: 'trello', name: 'Trello', description: 'Visual project boards' },
    { id: 'clickup', name: 'ClickUp', description: 'All-in-one productivity' },
    { id: 'notion', name: 'Notion', description: 'Workspace and notes' },
    { id: 'basecamp', name: 'Basecamp', description: 'Team collaboration' },
    { id: 'airtable', name: 'Airtable', description: 'Spreadsheet database' }
  ],
  'Payments': [
    { id: 'stripe', name: 'Stripe', description: 'Payment processing' },
    { id: 'paypal', name: 'PayPal', description: 'Online payments' },
    { id: 'square_payments', name: 'Square Payments', description: 'Payment solutions' },
    { id: 'braintree', name: 'Braintree', description: 'Payment gateway' },
    { id: 'razorpay', name: 'Razorpay', description: 'Payment solutions' },
    { id: 'adyen', name: 'Adyen', description: 'Payment platform' },
    { id: 'mollie', name: 'Mollie', description: 'European payments' },
    { id: 'authorize_net', name: 'Authorize.Net', description: 'Payment gateway' }
  ],
  'Cloud Storage': [
    { id: 'google_drive', name: 'Google Drive', description: 'Cloud file storage' },
    { id: 'dropbox', name: 'Dropbox', description: 'File sync and sharing' },
    { id: 'onedrive', name: 'OneDrive', description: 'Microsoft cloud storage' },
    { id: 'box', name: 'Box', description: 'Enterprise content management' },
    { id: 'aws_s3', name: 'AWS S3', description: 'Object storage service' },
    { id: 'azure_storage', name: 'Azure Storage', description: 'Microsoft cloud storage' },
    { id: 'google_cloud_storage', name: 'Google Cloud Storage', description: 'GCP storage' },
    { id: 'backblaze', name: 'Backblaze', description: 'Cloud backup' }
  ],
  'Accounting': [
    { id: 'quickbooks', name: 'QuickBooks', description: 'Small business accounting' },
    { id: 'xero', name: 'Xero', description: 'Online accounting software' },
    { id: 'freshbooks', name: 'FreshBooks', description: 'Invoice and accounting' },
    { id: 'sage', name: 'Sage', description: 'Business management' },
    { id: 'wave', name: 'Wave', description: 'Free accounting software' },
    { id: 'zoho_books', name: 'Zoho Books', description: 'Online accounting' },
    { id: 'netsuite', name: 'NetSuite', description: 'ERP and financials' },
    { id: 'intuit', name: 'Intuit', description: 'Financial software' }
  ],
  'Customer Support': [
    { id: 'zendesk', name: 'Zendesk', description: 'Customer service platform' },
    { id: 'intercom', name: 'Intercom', description: 'Customer messaging' },
    { id: 'freshdesk', name: 'Freshdesk', description: 'Help desk software' },
    { id: 'helpscout', name: 'Help Scout', description: 'Customer support' },
    { id: 'drift', name: 'Drift', description: 'Conversational marketing' },
    { id: 'crisp', name: 'Crisp', description: 'Customer messaging' },
    { id: 'livechat', name: 'LiveChat', description: 'Live chat software' },
    { id: 'uservoice', name: 'UserVoice', description: 'Customer feedback' }
  ],
  'Social Media': [
    { id: 'facebook', name: 'Facebook', description: 'Social media marketing' },
    { id: 'instagram', name: 'Instagram', description: 'Visual content platform' },
    { id: 'twitter', name: 'Twitter/X', description: 'Social networking' },
    { id: 'linkedin', name: 'LinkedIn', description: 'Professional networking' },
    { id: 'youtube', name: 'YouTube', description: 'Video platform' },
    { id: 'tiktok', name: 'TikTok', description: 'Short-form video' },
    { id: 'pinterest', name: 'Pinterest', description: 'Visual discovery' },
    { id: 'reddit', name: 'Reddit', description: 'Community platform' }
  ],
  'Development': [
    { id: 'github', name: 'GitHub', description: 'Code repository hosting' },
    { id: 'gitlab', name: 'GitLab', description: 'DevOps platform' },
    { id: 'bitbucket', name: 'Bitbucket', description: 'Git repository' },
    { id: 'jenkins', name: 'Jenkins', description: 'CI/CD automation' },
    { id: 'circleci', name: 'CircleCI', description: 'Continuous integration' },
    { id: 'docker', name: 'Docker', description: 'Containerization' },
    { id: 'kubernetes', name: 'Kubernetes', description: 'Container orchestration' },
    { id: 'terraform', name: 'Terraform', description: 'Infrastructure as code' }
  ]
};

// Skill detection mappings - expanded to include more skills per type
const SKILL_MAPPINGS: { [key: string]: { name: string, skills: string[], price: number } } = {
  sales: {
    name: 'Sales Outreach Agent',
    skills: [
      'Lead Generation', 'Email Outreach', 'CRM Sync', 'Lead Scoring', 'Pipeline Management',
      'Contact Management', 'Deal Tracking', 'Sales Forecasting', 'Quote Generation', 'Proposal Builder',
      'Follow-up Automation', 'Lead Nurturing', 'Sales Analytics', 'Commission Tracking', 'Territory Management',
      'Account Management', 'Opportunity Tracking', 'Revenue Forecasting', 'Sales Cadence', 'Email Sequences',
      'Meeting Scheduler', 'Calendar Sync', 'Video Meeting Integration', 'Call Recording', 'Conversation Intelligence',
      'Sales Enablement', 'Content Library', 'Battle Cards', 'Competitor Intelligence', 'Win/Loss Analysis',
      'Customer Segmentation', 'Personalization Engine', 'Dynamic Pricing', 'Contract Management', 'E-signature Integration',
      'Sales Coaching', 'Performance Metrics', 'Team Collaboration', 'Mobile CRM Access', 'Offline Sync'
    ],
    price: 649
  },
  support: {
    name: 'Customer Support Agent',
    skills: [
      'Ticket Management', 'Auto Response', 'Knowledge Base', 'Chat Support', 'FAQ Builder',
      'Customer Portal', 'SLA Management', 'Escalation Rules', 'Satisfaction Surveys', 'Help Desk',
      'Live Chat Widget', 'Email Support', 'Phone Support Integration', 'Social Media Support', 'Community Forum',
      'Sentiment Analysis', 'Priority Routing', 'Agent Assignment', 'Workload Balancing', 'Response Templates',
      'Macro Management', 'Canned Responses', 'Multi-language Support', 'Translation Services', 'Screen Sharing',
      'Co-browsing', 'Remote Desktop', 'File Sharing', 'Video Support', 'Voice Recognition',
      'Chatbot Integration', 'AI Suggestions', 'Smart Routing', 'Customer Journey Tracking', 'Issue Prediction',
      'Proactive Support', 'Customer Health Score', 'Retention Analytics', 'Churn Prevention', 'Feedback Loop'
    ],
    price: 349
  },
  marketing: {
    name: 'Marketing Automation Agent',
    skills: [
      'Content Creation', 'Social Media', 'Email Campaigns', 'Analytics', 'SEO Optimization',
      'Landing Page Builder', 'A/B Testing', 'Marketing Automation', 'Lead Capture Forms', 'Campaign Tracking',
      'Content Calendar', 'Social Media Scheduling', 'Influencer Outreach', 'Brand Monitoring', 'Competitor Analysis',
      'Marketing Attribution', 'ROI Tracking', 'Conversion Optimization', 'Funnel Analysis', 'Customer Segmentation',
      'Personalization', 'Dynamic Content', 'Behavioral Triggers', 'Drip Campaigns', 'Newsletter Management',
      'SMS Marketing', 'Push Notifications', 'In-app Messaging', 'Webinar Management', 'Event Marketing',
      'Referral Programs', 'Loyalty Programs', 'Affiliate Marketing', 'Content Syndication', 'PR Distribution',
      'Media Planning', 'Ad Campaign Management', 'Retargeting', 'Lookalike Audiences', 'Marketing Mix Modeling'
    ],
    price: 449
  },
  operations: {
    name: 'Operations Agent',
    skills: [
      'Workflow Automation', 'Process Optimization', 'Task Management', 'Resource Planning', 'Inventory Control',
      'Supply Chain Management', 'Quality Assurance', 'Performance Monitoring', 'Capacity Planning', 'Scheduling',
      'Document Management', 'Compliance Tracking', 'Audit Management', 'Risk Assessment', 'Vendor Management',
      'Purchase Order Processing', 'Invoice Processing', 'Expense Management', 'Budget Tracking', 'Cost Analysis',
      'Time Tracking', 'Employee Scheduling', 'Shift Management', 'Leave Management', 'Attendance Tracking',
      'Asset Management', 'Maintenance Scheduling', 'Equipment Tracking', 'Facility Management', 'Space Planning',
      'Project Coordination', 'Resource Allocation', 'Milestone Tracking', 'Dependency Management', 'Critical Path Analysis',
      'Business Intelligence', 'Operational Analytics', 'KPI Monitoring', 'Dashboard Reporting', 'Trend Analysis'
    ],
    price: 549
  },
  data: {
    name: 'Data Analytics Agent',
    skills: [
      'Data Collection', 'Data Cleaning', 'Data Transformation', 'ETL Pipelines', 'Data Warehousing',
      'Statistical Analysis', 'Predictive Analytics', 'Machine Learning', 'Deep Learning', 'Neural Networks',
      'Natural Language Processing', 'Computer Vision', 'Time Series Forecasting', 'Anomaly Detection', 'Pattern Recognition',
      'Data Visualization', 'Interactive Dashboards', 'Real-time Analytics', 'Streaming Analytics', 'Big Data Processing',
      'SQL Queries', 'NoSQL Databases', 'Graph Databases', 'Data Lakes', 'Cloud Data Platforms',
      'Business Intelligence', 'Executive Reporting', 'Ad-hoc Analysis', 'Self-service Analytics', 'Embedded Analytics',
      'Data Governance', 'Data Quality Management', 'Master Data Management', 'Metadata Management', 'Data Lineage',
      'Privacy Compliance', 'Data Security', 'Encryption', 'Access Control', 'Audit Trails'
    ],
    price: 749
  },
  construction: {
    name: 'Construction Management Agent',
    skills: [
      'Project Planning', 'Resource Scheduling', 'Cost Estimation', 'Bid Management', 'Contract Administration',
      'Subcontractor Management', 'Material Tracking', 'Equipment Management', 'Safety Compliance', 'Quality Control',
      'Document Control', 'Drawing Management', 'RFI Management', 'Change Order Processing', 'Progress Reporting',
      'Time Tracking', 'Labor Management', 'Payroll Integration', 'Union Compliance', 'Certification Tracking',
      'Inspection Management', 'Punch List Tracking', 'Warranty Management', 'Maintenance Scheduling', 'Asset Tracking',
      'BIM Integration', '3D Modeling', 'Clash Detection', 'Quantity Takeoff', 'Cost Analysis',
      'Risk Management', 'Issue Tracking', 'Daily Reporting', 'Photo Documentation', 'Weather Tracking',
      'Client Communication', 'Stakeholder Updates', 'Meeting Minutes', 'Action Items', 'Milestone Notifications'
    ],
    price: 849
  },
  general: {
    name: 'Custom AI Agent',
    skills: [
      'Task Automation', 'Data Processing', 'API Integration', 'Custom Workflows', 'Report Generation',
      'File Management', 'Email Integration', 'Calendar Management', 'Notification System', 'User Authentication',
      'Role-based Access', 'Activity Logging', 'Data Backup', 'Export/Import', 'Dashboard Creation',
      'Search Functionality', 'Filter & Sort', 'Bulk Operations', 'Template Management', 'Version Control'
    ],
    price: 299
  }
};

// Popular features with descriptions and price impact
const POPULAR_FEATURES = [
  {
    id: 'ai_chatbot',
    name: 'AI-Powered Chatbot',
    description: 'Natural language understanding for customer interactions',
    icon: ChatBubbleLeftRightIcon,
    priceImpact: 50
  },
  {
    id: 'voice_assistant',
    name: 'Voice Commands',
    description: 'Control your agent with voice instructions',
    icon: MicrophoneIcon,
    priceImpact: 75
  },
  {
    id: 'multi_language',
    name: 'Multi-Language Support',
    description: 'Operate in 95+ languages with automatic translation',
    icon: DocumentChartBarIcon,
    priceImpact: 100
  },
  {
    id: 'white_label',
    name: 'White Label Branding',
    description: 'Custom branding with your company identity',
    icon: PencilIcon,
    priceImpact: 150
  }
];

// Suggested features based on agent type
const SUGGESTED_FEATURES: { [key: string]: string[] } = {
  sales: ['ai_chatbot', 'voice_assistant'],
  support: ['ai_chatbot', 'multi_language'],
  marketing: ['multi_language', 'white_label'],
  operations: ['voice_assistant', 'white_label'],
  data: ['multi_language'],
  construction: ['voice_assistant', 'white_label'],
  general: ['ai_chatbot']
};

interface AgentConfig {
  name: string;
  description: string;
  agentType: string;
  skills: string[];
  integrations: string[];
  features: string[];
  price: number;
}

export default function AgentBuilderPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    name: '',
    description: '',
    agentType: 'general',
    skills: [],
    integrations: [],
    features: [],
    price: 299
  });
  const [inputDescription, setInputDescription] = useState('');
  const [showChatbot, setShowChatbot] = useState(false);
  const [showSkillsBreakdown, setShowSkillsBreakdown] = useState(false);
  const [expandedIntegrationCategory, setExpandedIntegrationCategory] = useState<string | null>(null);
  const [chatStep, setChatStep] = useState(0);
  const [chatResponses, setChatResponses] = useState<{[key: string]: string}>({});

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session');
        setIsLoggedIn(response.ok);
        setShowChatbot(!response.ok);
      } catch {
        setIsLoggedIn(false);
        setShowChatbot(true);
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

    // Suggest features based on agent type
    const suggestedFeatures = SUGGESTED_FEATURES[detectedType] || [];

    setAgentConfig(prev => ({
      ...prev,
      description: desc,
      agentType: detectedType,
      skills: detectedSkills,
      features: suggestedFeatures,
      price: basePrice,
      name: SKILL_MAPPINGS[detectedType]?.name || 'Custom AI Agent'
    }));
  };

  // Handle chat complete
  const handleChatComplete = (config: any) => {
    setAgentConfig({
      ...agentConfig,
      name: config.name || agentConfig.name,
      description: config.description || agentConfig.description,
      agentType: config.agentType || agentConfig.agentType,
      skills: config.skills || agentConfig.skills
    });
    setPreviewMode(true);
  };

  // Handle initial input submission
  const handleInputSubmit = () => {
    if (inputDescription.trim()) {
      analyzeDescription(inputDescription);
      setChatResponses({ 0: inputDescription });
      setChatStep(0);
    }
  };

  // Handle continue to preview
  const handleContinue = () => {
    setPreviewMode(true);
  };

  // Toggle integration selection
  const toggleIntegration = (integrationId: string) => {
    setAgentConfig(prev => ({
      ...prev,
      integrations: prev.integrations.includes(integrationId)
        ? prev.integrations.filter(i => i !== integrationId)
        : [...prev.integrations, integrationId]
    }));
  };

  // Toggle feature selection
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

  // Calculate total price
  const calculateTotalPrice = () => {
    const basePrice = agentConfig.price;
    const featuresPrice = agentConfig.features.reduce((total, fid) => {
      const feature = POPULAR_FEATURES.find(f => f.id === fid);
      return total + (feature?.priceImpact || 0);
    }, 0);
    return basePrice + featuresPrice;
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="px-8 py-6 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                AI Agent Builder
              </h1>
              <p className="text-sm mt-1" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                Build your custom AI agent with our conversational builder
              </p>
            </div>
            {previewMode && (
              <button
                onClick={() => setPreviewMode(false)}
                className="px-4 py-2 rounded-lg transition hover:opacity-80 flex items-center gap-2"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(169, 189, 203, 0.3)',
                  color: 'rgba(229, 227, 220, 0.9)'
                }}
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back to Builder
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        {previewMode ? (
          <DashboardPreview
            agentName={agentConfig.name}
            requirements={{
              goal: agentConfig.description,
              industry: 'Technology' // Default industry
            }}
            agentConfig={{
              agentName: agentConfig.name,
              requirements: {
                goal: agentConfig.description,
                tools: agentConfig.features || [],
                outputs: [`Monthly £${agentConfig.price} value`],
                industry: 'Technology' // Default industry
              },
              suggestedSkills: agentConfig.skills || []
            }}
          />
        ) : (
          <div className="flex">
            {/* Left: Chat Interface */}
            <div className="flex-1 border-r" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
              <div className="p-6 h-full flex flex-col">
                {/* Conversation History */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                  {/* Initial Question */}
                  <div className="flex gap-3">
                    <div className="p-2 rounded-full h-8 w-8 flex items-center justify-center" style={{
                      backgroundColor: 'rgba(169, 189, 203, 0.2)'
                    }}>
                      <SparklesIcon className="h-4 w-4" style={{ color: 'rgb(169, 189, 203)' }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1" style={{ color: 'rgb(169, 189, 203)' }}>AI Assistant</p>
                      <div className="p-3 rounded-lg" style={{
                        backgroundColor: 'rgba(169, 189, 203, 0.1)',
                        borderLeft: '3px solid rgb(169, 189, 203)'
                      }}>
                        <p style={{ color: 'rgb(229, 227, 220)' }}>
                          Tell me about your business and what you'd like your AI agent to help with. I'll analyze your needs and show you what we can build.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* User's Response */}
                  {chatResponses[0] && (
                    <>
                      <div className="flex gap-3">
                        <div className="p-2 rounded-full h-8 w-8 flex items-center justify-center" style={{
                          backgroundColor: 'rgba(229, 227, 220, 0.2)'
                        }}>
                          <span style={{ color: 'rgb(229, 227, 220)', fontSize: '12px' }}>You</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-1" style={{ color: 'rgb(229, 227, 220)' }}>You</p>
                          <div className="p-3 rounded-lg" style={{
                            backgroundColor: 'rgba(58, 64, 64, 0.5)',
                            border: '1px solid rgba(169, 189, 203, 0.2)'
                          }}>
                            <p style={{ color: 'rgb(229, 227, 220)' }}>{chatResponses[0]}</p>
                          </div>
                        </div>
                      </div>

                      {/* AI Analysis */}
                      <div className="flex gap-3">
                        <div className="p-2 rounded-full h-8 w-8 flex items-center justify-center" style={{
                          backgroundColor: 'rgba(169, 189, 203, 0.2)'
                        }}>
                          <SparklesIcon className="h-4 w-4" style={{ color: 'rgb(169, 189, 203)' }} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-1" style={{ color: 'rgb(169, 189, 203)' }}>AI Assistant</p>
                          <div className="p-4 rounded-lg space-y-4" style={{
                            backgroundColor: 'rgba(169, 189, 203, 0.1)',
                            borderLeft: '3px solid rgb(169, 189, 203)'
                          }}>
                            {/* What You're Building Section */}
                            <div>
                              <h3 className="font-semibold mb-3" style={{ color: 'rgb(229, 227, 220)' }}>
                                What You're Building
                              </h3>

                              <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(58, 64, 64, 0.5)' }}>
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-lg font-medium" style={{ color: 'rgb(229, 227, 220)' }}>
                                    {agentConfig.name}
                                  </h4>
                                  <span className="px-3 py-1 text-sm rounded-full" style={{
                                    backgroundColor: 'rgba(169, 189, 203, 0.2)',
                                    color: 'rgb(169, 189, 203)'
                                  }}>
                                    £{calculateTotalPrice()}/month
                                  </span>
                                </div>

                                <p className="text-sm mb-4" style={{ color: 'rgba(169, 189, 203, 0.9)' }}>
                                  {agentConfig.description || 'Your custom AI agent tailored to your needs'}
                                </p>

                                {/* Core Skills */}
                                <div className="mb-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium" style={{ color: 'rgb(169, 189, 203)' }}>
                                      Core Skills
                                    </span>
                                    <span className="px-2 py-0.5 text-xs font-bold rounded-full" style={{
                                      backgroundColor: 'rgba(169, 189, 203, 0.2)',
                                      color: 'rgb(169, 189, 203)'
                                    }}>
                                      {agentConfig.skills.length} Active
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {agentConfig.skills.slice(0, 8).map(skill => (
                                      <span key={skill} className="px-2 py-1 text-xs rounded" style={{
                                        backgroundColor: 'rgba(169, 189, 203, 0.15)',
                                        color: 'rgb(229, 227, 220)'
                                      }}>
                                        {skill}
                                      </span>
                                    ))}
                                    {agentConfig.skills.length > 8 && (
                                      <button
                                        onClick={() => setShowSkillsBreakdown(true)}
                                        className="px-2 py-1 text-xs rounded hover:opacity-80 transition"
                                        style={{
                                          backgroundColor: 'rgba(169, 189, 203, 0.2)',
                                          color: 'rgb(169, 189, 203)',
                                          border: '1px solid rgba(169, 189, 203, 0.3)'
                                        }}
                                      >
                                        +{agentConfig.skills.length - 8} more
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* View Full Breakdown Button */}
                                <button
                                  onClick={() => setShowSkillsBreakdown(true)}
                                  className="w-full mt-3 px-3 py-2 rounded-lg border transition hover:opacity-80 flex items-center justify-center gap-2"
                                  style={{
                                    borderColor: 'rgba(169, 189, 203, 0.3)',
                                    backgroundColor: 'transparent',
                                    color: 'rgb(169, 189, 203)'
                                  }}
                                >
                                  <EyeIcon className="h-4 w-4" />
                                  View Full Breakdown
                                </button>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                              <button
                                onClick={handleContinue}
                                className="px-4 py-2 rounded-lg transition hover:opacity-80 flex items-center gap-2"
                                style={{
                                  backgroundColor: 'rgb(169, 189, 203)',
                                  color: 'white'
                                }}
                              >
                                Continue to Preview
                                <ArrowRightIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setChatStep(1)}
                                className="px-4 py-2 rounded-lg border transition hover:opacity-80"
                                style={{
                                  borderColor: 'rgba(169, 189, 203, 0.3)',
                                  backgroundColor: 'transparent',
                                  color: 'rgba(229, 227, 220, 0.9)'
                                }}
                              >
                                Refine Further
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Input Area */}
                <div className="border-t pt-4" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={inputDescription}
                      onChange={(e) => setInputDescription(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleInputSubmit()}
                      placeholder="Describe your business needs..."
                      className="flex-1 px-4 py-3 rounded-lg border"
                      style={{
                        backgroundColor: 'rgba(48, 54, 54, 0.5)',
                        borderColor: 'rgba(169, 189, 203, 0.3)',
                        color: 'rgb(229, 227, 220)'
                      }}
                    />
                    <button
                      onClick={handleInputSubmit}
                      className="px-4 py-3 rounded-lg transition hover:opacity-80 flex items-center gap-2"
                      style={{
                        backgroundColor: 'rgb(169, 189, 203)',
                        color: 'white'
                      }}
                    >
                      <PaperAirplaneIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Features Panel - Below the chat area */}
            {chatResponses[0] && (
              <div className="w-96 p-6 overflow-y-auto">
                <div className="space-y-6">
                  {/* Popular Features */}
                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2" style={{ color: 'rgb(229, 227, 220)' }}>
                      <SparklesIcon className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
                      Popular Features
                    </h3>
                    <div className="space-y-2">
                      {POPULAR_FEATURES.map(feature => {
                        const Icon = feature.icon;
                        return (
                          <button
                            key={feature.id}
                            onClick={() => toggleFeature(feature.id)}
                            className="w-full p-3 rounded-lg border transition hover:opacity-90 text-left"
                            style={{
                              backgroundColor: agentConfig.features.includes(feature.id)
                                ? 'rgba(169, 189, 203, 0.1)'
                                : 'rgba(48, 54, 54, 0.3)',
                              borderColor: agentConfig.features.includes(feature.id)
                                ? 'rgb(169, 189, 203)'
                                : 'rgba(169, 189, 203, 0.2)',
                              color: 'rgb(229, 227, 220)'
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" style={{
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
                        );
                      })}
                    </div>
                  </div>

                  {/* Suggested Features */}
                  {SUGGESTED_FEATURES[agentConfig.agentType] && (
                    <div>
                      <h3 className="font-medium mb-3 flex items-center gap-2" style={{ color: 'rgb(229, 227, 220)' }}>
                        <LightBulbIcon className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
                        Suggested for {SKILL_MAPPINGS[agentConfig.agentType]?.name}
                      </h3>
                      <div className="p-3 rounded-lg" style={{
                        backgroundColor: 'rgba(169, 189, 203, 0.05)',
                        border: '1px solid rgba(169, 189, 203, 0.2)'
                      }}>
                        <p className="text-xs mb-2" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                          Based on your agent type, we recommend:
                        </p>
                        <div className="space-y-1">
                          {SUGGESTED_FEATURES[agentConfig.agentType].map(featureId => {
                            const feature = POPULAR_FEATURES.find(f => f.id === featureId);
                            return feature ? (
                              <div key={featureId} className="flex items-center gap-2">
                                <CheckIcon className="h-3 w-3" style={{ color: 'rgb(169, 189, 203)' }} />
                                <span className="text-sm" style={{ color: 'rgb(229, 227, 220)' }}>
                                  {feature.name}
                                </span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Integrations */}
                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2" style={{ color: 'rgb(229, 227, 220)' }}>
                      <LinkIcon className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
                      Integrations
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(INTEGRATIONS).map(([category, integrations]) => (
                        <div key={category} className="rounded-lg border" style={{
                          backgroundColor: 'rgba(58, 64, 64, 0.2)',
                          borderColor: 'rgba(169, 189, 203, 0.2)'
                        }}>
                          <button
                            onClick={() => setExpandedIntegrationCategory(
                              expandedIntegrationCategory === category ? null : category
                            )}
                            className="w-full px-3 py-2 flex items-center justify-between hover:bg-opacity-10 transition"
                          >
                            <span className="text-sm font-medium" style={{ color: 'rgb(229, 227, 220)' }}>
                              {category}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{
                                backgroundColor: 'rgba(169, 189, 203, 0.1)',
                                color: 'rgba(169, 189, 203, 0.8)'
                              }}>
                                {integrations.length}
                              </span>
                              {expandedIntegrationCategory === category ? (
                                <ChevronUpIcon className="h-4 w-4" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
                              ) : (
                                <ChevronDownIcon className="h-4 w-4" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
                              )}
                            </div>
                          </button>
                          {expandedIntegrationCategory === category && (
                            <div className="px-3 pb-3">
                              <div className="grid grid-cols-1 gap-1.5">
                                {integrations.map(integration => (
                                  <button
                                    key={integration.id}
                                    onClick={() => toggleIntegration(integration.id)}
                                    className="px-3 py-2 rounded text-left text-xs transition hover:opacity-80"
                                    style={{
                                      backgroundColor: agentConfig.integrations.includes(integration.id)
                                        ? 'rgba(169, 189, 203, 0.1)'
                                        : 'transparent',
                                      color: 'rgb(229, 227, 220)'
                                    }}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span>{integration.name}</span>
                                      {agentConfig.integrations.includes(integration.id) && (
                                        <CheckIcon className="h-3 w-3" style={{ color: 'rgb(169, 189, 203)' }} />
                                      )}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Skills Breakdown Modal */}
        {showSkillsBreakdown && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.2)' }}>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold" style={{ color: 'rgb(229, 227, 220)' }}>
                    {agentConfig.name} - Complete Skills Breakdown
                  </h2>
                  <button
                    onClick={() => setShowSkillsBreakdown(false)}
                    className="p-2 rounded-lg hover:bg-opacity-10 transition"
                    style={{ backgroundColor: 'rgba(169, 189, 203, 0.1)' }}
                  >
                    <XMarkIcon className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {agentConfig.skills.map(skill => (
                    <div
                      key={skill}
                      className="px-3 py-2 rounded-lg text-sm"
                      style={{
                        backgroundColor: 'rgba(169, 189, 203, 0.1)',
                        color: 'rgb(229, 227, 220)'
                      }}
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}