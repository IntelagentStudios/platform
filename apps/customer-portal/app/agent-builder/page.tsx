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
import EmbeddedChatbot from '../../components/EmbeddedChatbot';
import DashboardPreview from '../../components/DashboardPreview';
import { SKILLS_CATALOG, getSkillsByAgentType, TOTAL_SKILLS } from '../../utils/skillsCatalog';

// Comprehensive integrations list organized by category (150+ integrations)
const INTEGRATIONS = {
  'CRM & Sales': [
    { id: 'salesforce', name: 'Salesforce', description: 'Enterprise CRM' },
    { id: 'hubspot', name: 'HubSpot', description: 'Marketing & Sales' },
    { id: 'pipedrive', name: 'Pipedrive', description: 'Sales pipeline' },
    { id: 'zoho_crm', name: 'Zoho CRM', description: 'Complete CRM' },
    { id: 'dynamics_365', name: 'Dynamics 365', description: 'Microsoft CRM' },
    { id: 'freshsales', name: 'Freshsales', description: 'AI CRM' },
    { id: 'copper', name: 'Copper', description: 'G Suite CRM' },
    { id: 'insightly', name: 'Insightly', description: 'CRM & Projects' },
    { id: 'sugar_crm', name: 'SugarCRM', description: 'Open CRM' },
    { id: 'close', name: 'Close', description: 'Inside sales' },
    { id: 'keap', name: 'Keap', description: 'Small business' },
    { id: 'monday_sales', name: 'Monday Sales', description: 'Visual CRM' },
    { id: 'nutshell', name: 'Nutshell', description: 'B2B CRM' },
    { id: 'agile_crm', name: 'Agile CRM', description: 'All-in-one' },
    { id: 'capsule', name: 'Capsule', description: 'Simple CRM' }
  ],
  'Communication': [
    { id: 'gmail', name: 'Gmail', description: 'Google email' },
    { id: 'outlook', name: 'Outlook', description: 'Microsoft email' },
    { id: 'slack', name: 'Slack', description: 'Team chat' },
    { id: 'teams', name: 'Microsoft Teams', description: 'Collaboration' },
    { id: 'discord', name: 'Discord', description: 'Community chat' },
    { id: 'telegram', name: 'Telegram', description: 'Messaging' },
    { id: 'whatsapp', name: 'WhatsApp Business', description: 'Business chat' },
    { id: 'twilio', name: 'Twilio', description: 'SMS & Voice' },
    { id: 'sendgrid', name: 'SendGrid', description: 'Email API' },
    { id: 'mailgun', name: 'Mailgun', description: 'Email service' },
    { id: 'zoom', name: 'Zoom', description: 'Video meetings' },
    { id: 'google_meet', name: 'Google Meet', description: 'Video calls' },
    { id: 'skype', name: 'Skype', description: 'Voice & video' },
    { id: 'ringcentral', name: 'RingCentral', description: 'Cloud phone' },
    { id: 'aircall', name: 'Aircall', description: 'Call center' },
    { id: 'intercom', name: 'Intercom', description: 'Customer messaging' },
    { id: 'drift', name: 'Drift', description: 'Conversational' },
    { id: 'crisp', name: 'Crisp', description: 'Live chat' },
    { id: 'front', name: 'Front', description: 'Team inbox' },
    { id: 'missive', name: 'Missive', description: 'Shared inbox' }
  ],
  'E-commerce': [
    { id: 'shopify', name: 'Shopify', description: 'E-commerce' },
    { id: 'woocommerce', name: 'WooCommerce', description: 'WordPress' },
    { id: 'bigcommerce', name: 'BigCommerce', description: 'SaaS commerce' },
    { id: 'magento', name: 'Magento', description: 'Open source' },
    { id: 'squarespace', name: 'Squarespace', description: 'Website builder' },
    { id: 'wix', name: 'Wix', description: 'Site & store' },
    { id: 'prestashop', name: 'PrestaShop', description: 'Open e-commerce' },
    { id: 'opencart', name: 'OpenCart', description: 'Free platform' },
    { id: 'ecwid', name: 'Ecwid', description: 'Add to site' },
    { id: 'square_online', name: 'Square Online', description: 'Online store' },
    { id: 'amazon', name: 'Amazon Seller', description: 'Marketplace' },
    { id: 'ebay', name: 'eBay', description: 'Auctions' },
    { id: 'etsy', name: 'Etsy', description: 'Handmade' },
    { id: 'walmart', name: 'Walmart', description: 'Marketplace' },
    { id: 'alibaba', name: 'Alibaba', description: 'B2B trade' },
    { id: 'wish', name: 'Wish', description: 'Mobile commerce' },
    { id: 'facebook_shop', name: 'Facebook Shop', description: 'Social commerce' },
    { id: 'instagram_shop', name: 'Instagram Shop', description: 'Visual commerce' },
    { id: 'pinterest_shop', name: 'Pinterest Shop', description: 'Discovery commerce' },
    { id: 'tiktok_shop', name: 'TikTok Shop', description: 'Video commerce' }
  ],
  'Payment & Finance': [
    { id: 'stripe', name: 'Stripe', description: 'Payments' },
    { id: 'paypal', name: 'PayPal', description: 'Online payments' },
    { id: 'square', name: 'Square', description: 'POS & payments' },
    { id: 'braintree', name: 'Braintree', description: 'Payment gateway' },
    { id: 'adyen', name: 'Adyen', description: 'Global payments' },
    { id: 'razorpay', name: 'Razorpay', description: 'Indian payments' },
    { id: 'mollie', name: 'Mollie', description: 'European payments' },
    { id: 'authorize_net', name: 'Authorize.Net', description: 'Payment gateway' },
    { id: '2checkout', name: '2Checkout', description: 'Digital commerce' },
    { id: 'worldpay', name: 'Worldpay', description: 'Payment processing' },
    { id: 'klarna', name: 'Klarna', description: 'Buy now pay later' },
    { id: 'afterpay', name: 'Afterpay', description: 'Installments' },
    { id: 'affirm', name: 'Affirm', description: 'Point of sale loans' },
    { id: 'quickbooks', name: 'QuickBooks', description: 'Accounting' },
    { id: 'xero', name: 'Xero', description: 'Cloud accounting' },
    { id: 'freshbooks', name: 'FreshBooks', description: 'Small business' },
    { id: 'sage', name: 'Sage', description: 'Business finance' },
    { id: 'wave', name: 'Wave', description: 'Free accounting' },
    { id: 'zoho_books', name: 'Zoho Books', description: 'Online accounting' },
    { id: 'netsuite', name: 'NetSuite', description: 'ERP' }
  ],
  'Marketing': [
    { id: 'mailchimp', name: 'Mailchimp', description: 'Email marketing' },
    { id: 'constant_contact', name: 'Constant Contact', description: 'Email campaigns' },
    { id: 'activecampaign', name: 'ActiveCampaign', description: 'Automation' },
    { id: 'klaviyo', name: 'Klaviyo', description: 'E-commerce email' },
    { id: 'convertkit', name: 'ConvertKit', description: 'Creator marketing' },
    { id: 'drip', name: 'Drip', description: 'E-commerce CRM' },
    { id: 'aweber', name: 'AWeber', description: 'Email automation' },
    { id: 'getresponse', name: 'GetResponse', description: 'Marketing platform' },
    { id: 'marketo', name: 'Marketo', description: 'Enterprise' },
    { id: 'pardot', name: 'Pardot', description: 'B2B marketing' },
    { id: 'eloqua', name: 'Eloqua', description: 'Oracle marketing' },
    { id: 'braze', name: 'Braze', description: 'Customer engagement' },
    { id: 'customer_io', name: 'Customer.io', description: 'Messaging' },
    { id: 'sendinblue', name: 'Sendinblue', description: 'Digital marketing' },
    { id: 'omnisend', name: 'Omnisend', description: 'Omnichannel' },
    { id: 'google_ads', name: 'Google Ads', description: 'PPC advertising' },
    { id: 'facebook_ads', name: 'Facebook Ads', description: 'Social ads' },
    { id: 'linkedin_ads', name: 'LinkedIn Ads', description: 'B2B ads' },
    { id: 'twitter_ads', name: 'Twitter Ads', description: 'Promoted tweets' },
    { id: 'tiktok_ads', name: 'TikTok Ads', description: 'Video ads' }
  ],
  'Analytics & Data': [
    { id: 'google_analytics', name: 'Google Analytics', description: 'Web analytics' },
    { id: 'mixpanel', name: 'Mixpanel', description: 'Product analytics' },
    { id: 'segment', name: 'Segment', description: 'Customer data' },
    { id: 'amplitude', name: 'Amplitude', description: 'Digital analytics' },
    { id: 'heap', name: 'Heap', description: 'Auto-capture' },
    { id: 'hotjar', name: 'Hotjar', description: 'Heatmaps' },
    { id: 'fullstory', name: 'FullStory', description: 'Session replay' },
    { id: 'pendo', name: 'Pendo', description: 'Product experience' },
    { id: 'looker', name: 'Looker', description: 'BI platform' },
    { id: 'tableau', name: 'Tableau', description: 'Data viz' },
    { id: 'power_bi', name: 'Power BI', description: 'Microsoft BI' },
    { id: 'datadog', name: 'Datadog', description: 'Monitoring' },
    { id: 'new_relic', name: 'New Relic', description: 'APM' },
    { id: 'sentry', name: 'Sentry', description: 'Error tracking' },
    { id: 'bugsnag', name: 'Bugsnag', description: 'Crash reporting' },
    { id: 'google_tag_manager', name: 'Google Tag Manager', description: 'Tag management' },
    { id: 'adobe_analytics', name: 'Adobe Analytics', description: 'Enterprise analytics' },
    { id: 'kissmetrics', name: 'Kissmetrics', description: 'Behavioral' },
    { id: 'crazy_egg', name: 'Crazy Egg', description: 'Visual analytics' },
    { id: 'chartio', name: 'Chartio', description: 'Cloud BI' }
  ],
  'Project Management': [
    { id: 'jira', name: 'Jira', description: 'Agile PM' },
    { id: 'asana', name: 'Asana', description: 'Work management' },
    { id: 'monday', name: 'Monday.com', description: 'Work OS' },
    { id: 'trello', name: 'Trello', description: 'Boards' },
    { id: 'clickup', name: 'ClickUp', description: 'All-in-one' },
    { id: 'notion', name: 'Notion', description: 'Workspace' },
    { id: 'basecamp', name: 'Basecamp', description: 'Team projects' },
    { id: 'airtable', name: 'Airtable', description: 'Database' },
    { id: 'smartsheet', name: 'Smartsheet', description: 'Work execution' },
    { id: 'wrike', name: 'Wrike', description: 'Collaborative' },
    { id: 'teamwork', name: 'Teamwork', description: 'Client work' },
    { id: 'todoist', name: 'Todoist', description: 'Task manager' },
    { id: 'microsoft_project', name: 'MS Project', description: 'Enterprise PM' },
    { id: 'linear', name: 'Linear', description: 'Issue tracking' },
    { id: 'height', name: 'Height', description: 'Autonomous PM' },
    { id: 'shortcut', name: 'Shortcut', description: 'Software teams' },
    { id: 'productboard', name: 'Productboard', description: 'Product mgmt' },
    { id: 'aha', name: 'Aha!', description: 'Roadmaps' },
    { id: 'azure_devops', name: 'Azure DevOps', description: 'Development' },
    { id: 'pivotal_tracker', name: 'Pivotal Tracker', description: 'Agile tracker' }
  ],
  'Support & Service': [
    { id: 'zendesk', name: 'Zendesk', description: 'Help desk' },
    { id: 'freshdesk', name: 'Freshdesk', description: 'Support desk' },
    { id: 'helpscout', name: 'Help Scout', description: 'Customer service' },
    { id: 'kayako', name: 'Kayako', description: 'Unified support' },
    { id: 'zoho_desk', name: 'Zoho Desk', description: 'Context support' },
    { id: 'happyfox', name: 'HappyFox', description: 'Help desk' },
    { id: 'groove', name: 'Groove', description: 'Simple support' },
    { id: 'helpshift', name: 'Helpshift', description: 'Mobile support' },
    { id: 'uservoice', name: 'UserVoice', description: 'Feedback' },
    { id: 'canny', name: 'Canny', description: 'Feature requests' },
    { id: 'livechat', name: 'LiveChat', description: 'Chat support' },
    { id: 'olark', name: 'Olark', description: 'Live chat' },
    { id: 'tawk', name: 'Tawk.to', description: 'Free chat' },
    { id: 'tidio', name: 'Tidio', description: 'Chat & bots' },
    { id: 'userlike', name: 'Userlike', description: 'Messaging' },
    { id: 'chatwoot', name: 'Chatwoot', description: 'Open source' },
    { id: 'helpcrunch', name: 'HelpCrunch', description: 'Multi-channel' },
    { id: 'gorgias', name: 'Gorgias', description: 'E-commerce support' },
    { id: 'kustomer', name: 'Kustomer', description: 'CRM support' },
    { id: 'gladly', name: 'Gladly', description: 'Radiant support' }
  ],
  'Development & IT': [
    { id: 'github', name: 'GitHub', description: 'Code hosting' },
    { id: 'gitlab', name: 'GitLab', description: 'DevOps' },
    { id: 'bitbucket', name: 'Bitbucket', description: 'Git repos' },
    { id: 'jenkins', name: 'Jenkins', description: 'CI/CD' },
    { id: 'circleci', name: 'CircleCI', description: 'Continuous' },
    { id: 'travis_ci', name: 'Travis CI', description: 'Build & test' },
    { id: 'docker', name: 'Docker', description: 'Containers' },
    { id: 'kubernetes', name: 'Kubernetes', description: 'Orchestration' },
    { id: 'terraform', name: 'Terraform', description: 'Infrastructure' },
    { id: 'ansible', name: 'Ansible', description: 'Automation' },
    { id: 'puppet', name: 'Puppet', description: 'Config mgmt' },
    { id: 'chef', name: 'Chef', description: 'Infrastructure' },
    { id: 'aws', name: 'AWS', description: 'Cloud platform' },
    { id: 'azure', name: 'Azure', description: 'Microsoft cloud' },
    { id: 'gcp', name: 'Google Cloud', description: 'Cloud services' },
    { id: 'heroku', name: 'Heroku', description: 'App platform' },
    { id: 'vercel', name: 'Vercel', description: 'Frontend' },
    { id: 'netlify', name: 'Netlify', description: 'Web hosting' },
    { id: 'digitalocean', name: 'DigitalOcean', description: 'Cloud infra' },
    { id: 'cloudflare', name: 'Cloudflare', description: 'CDN & security' }
  ],
  'HR & Recruiting': [
    { id: 'workday', name: 'Workday', description: 'HCM' },
    { id: 'bamboohr', name: 'BambooHR', description: 'HR software' },
    { id: 'greenhouse', name: 'Greenhouse', description: 'Recruiting' },
    { id: 'lever', name: 'Lever', description: 'Talent acquisition' },
    { id: 'gusto', name: 'Gusto', description: 'Payroll & HR' },
    { id: 'rippling', name: 'Rippling', description: 'All-in-one HR' },
    { id: 'namely', name: 'Namely', description: 'HR platform' },
    { id: 'adp', name: 'ADP', description: 'Workforce mgmt' },
    { id: 'paychex', name: 'Paychex', description: 'Payroll services' },
    { id: 'paycom', name: 'Paycom', description: 'HCM software' },
    { id: 'ultipro', name: 'UltiPro', description: 'HR & payroll' },
    { id: 'successfactors', name: 'SuccessFactors', description: 'SAP HR' },
    { id: 'oracle_hcm', name: 'Oracle HCM', description: 'HR cloud' },
    { id: 'cornerstone', name: 'Cornerstone', description: 'Talent mgmt' },
    { id: 'culture_amp', name: 'Culture Amp', description: 'Employee experience' },
    { id: '15five', name: '15Five', description: 'Performance' },
    { id: 'lattice', name: 'Lattice', description: 'People mgmt' },
    { id: 'linkedin_recruiter', name: 'LinkedIn Recruiter', description: 'Talent search' },
    { id: 'indeed', name: 'Indeed', description: 'Job posting' },
    { id: 'glassdoor', name: 'Glassdoor', description: 'Employer brand' }
  ],
  'Storage & Files': [
    { id: 'google_drive', name: 'Google Drive', description: 'Cloud storage' },
    { id: 'dropbox', name: 'Dropbox', description: 'File sync' },
    { id: 'onedrive', name: 'OneDrive', description: 'Microsoft storage' },
    { id: 'box', name: 'Box', description: 'Enterprise content' },
    { id: 'sharepoint', name: 'SharePoint', description: 'Collaboration' },
    { id: 'confluence', name: 'Confluence', description: 'Team wiki' },
    { id: 'google_workspace', name: 'Google Workspace', description: 'Productivity' },
    { id: 'microsoft_365', name: 'Microsoft 365', description: 'Office suite' },
    { id: 'evernote', name: 'Evernote', description: 'Notes' },
    { id: 'onenote', name: 'OneNote', description: 'Digital notebook' },
    { id: 'aws_s3', name: 'AWS S3', description: 'Object storage' },
    { id: 'backblaze', name: 'Backblaze', description: 'Backup' },
    { id: 'pcloud', name: 'pCloud', description: 'Secure storage' },
    { id: 'mega', name: 'MEGA', description: 'Encrypted storage' },
    { id: 'sync', name: 'Sync.com', description: 'Privacy storage' },
    { id: 'wetransfer', name: 'WeTransfer', description: 'File transfer' },
    { id: 'docusign', name: 'DocuSign', description: 'E-signature' },
    { id: 'adobe_sign', name: 'Adobe Sign', description: 'Digital signature' },
    { id: 'hellosign', name: 'HelloSign', description: 'Electronic signature' },
    { id: 'pandadoc', name: 'PandaDoc', description: 'Document automation' }
  ]
};

// Skill detection mappings - now using comprehensive catalog
const SKILL_MAPPINGS: { [key: string]: { name: string, skills: string[], price: number } } = {
  sales: {
    name: 'Sales Outreach Agent',
    skills: getSkillsByAgentType('sales').map(s => s.name),
    price: 649
  },
  support: {
    name: 'Customer Support Agent',
    skills: getSkillsByAgentType('support').map(s => s.name),
    price: 349
  },
  marketing: {
    name: 'Marketing Automation Agent',
    skills: getSkillsByAgentType('marketing').map(s => s.name),
    price: 449
  },
  operations: {
    name: 'Operations Agent',
    skills: getSkillsByAgentType('operations').map(s => s.name),
    price: 549
  },
  data: {
    name: 'Data Analytics Agent',
    skills: getSkillsByAgentType('data').map(s => s.name),
    price: 749
  },
  general: {
    name: 'Custom AI Agent',
    skills: getSkillsByAgentType('general').map(s => s.name),
    price: 299
  }
};

// Popular features with descriptions and price impact
const POPULAR_FEATURES = [
  {
    id: 'ai_chatbot',
    name: 'AI-Powered Chatbot',
    description: 'Natural language understanding',
    icon: ChatBubbleLeftRightIcon,
    priceImpact: 50
  },
  {
    id: 'voice_assistant',
    name: 'Voice Commands',
    description: 'Control with voice',
    icon: MicrophoneIcon,
    priceImpact: 75
  },
  {
    id: 'multi_language',
    name: 'Multi-Language',
    description: '95+ languages',
    icon: DocumentChartBarIcon,
    priceImpact: 100
  },
  {
    id: 'white_label',
    name: 'White Label',
    description: 'Your branding',
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
  general: ['ai_chatbot']
};

interface AgentConfig {
  name: string;
  description: string;
  agentType: string;
  type?: string;
  industry?: string;
  companySize?: string;
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
  const [hasInteracted, setHasInteracted] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

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

  // Handle initial input submission
  const handleInputSubmit = () => {
    if (inputDescription.trim()) {
      setHasInteracted(true);
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

  // Handle configuration updates from the chatbot
  const handleChatbotConfigUpdate = (config: any) => {
    // Update agent type if detected
    if (config.agentType && config.agentType !== 'general') {
      const mapping = SKILL_MAPPINGS[config.agentType] || SKILL_MAPPINGS.general;
      setAgentConfig(prev => ({
        ...prev,
        agentType: config.agentType,
        type: config.agentType,
        name: mapping.name,
        skills: mapping.skills,
        price: mapping.price
      }));
    }

    // Add integrations that were detected
    if (config.integrations && config.integrations.length > 0) {
      setAgentConfig(prev => {
        const newIntegrations = [...new Set([...prev.integrations, ...config.integrations])];
        return {
          ...prev,
          integrations: newIntegrations
        };
      });
    }

    // Add features that were detected
    if (config.features && config.features.length > 0) {
      setAgentConfig(prev => {
        const newFeatures = [...new Set([...prev.features, ...config.features])];

        // Calculate price impact
        const featurePrice = newFeatures.reduce((total, fid) => {
          const feature = POPULAR_FEATURES.find(f => f.id === fid);
          return total + (feature?.priceImpact || 0);
        }, 0);

        const basePrice = SKILL_MAPPINGS[prev.agentType]?.price || 299;

        return {
          ...prev,
          features: newFeatures,
          price: basePrice + featurePrice
        };
      });
    }

    // Set AI suggestions based on config
    if (config.suggestions) {
      setAiSuggestions(config.suggestions);
    }
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
                Build your custom AI agent from our library of {TOTAL_SKILLS}+ skills
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
              industry: 'Technology'
            }}
            agentConfig={{
              agentName: agentConfig.name,
              requirements: {
                goal: agentConfig.description,
                tools: agentConfig.features || [],
                outputs: [`Monthly £${agentConfig.price} value`],
                industry: 'Technology'
              },
              suggestedSkills: agentConfig.skills || []
            }}
          />
        ) : (
          <div className="p-8">
            {/* Top Section: Embedded Chatbot */}
            <div className="max-w-4xl mx-auto mb-8">
              <EmbeddedChatbot
                title="AI Agent Configuration Assistant"
                placeholder="Describe your business needs..."
                welcomeMessage="Hello! I'm here to help you build the perfect AI agent for your business. Tell me about your needs, and I'll configure the optimal solution with the right skills and integrations."
                height="400px"
                onSend={(message) => {
                  analyzeDescription(message);
                  setChatResponses({ 0: message });
                  setHasInteracted(true);
                }}
              />

            </div>

            {/* Bottom Section: Configuration Grid */}
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Configuration Column */}
                <div>
                  <div className="bg-gray-800/30 rounded-xl p-6" style={{ border: '1px solid rgba(169, 189, 203, 0.15)' }}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'rgb(229, 227, 220)' }}>
                      <CogIcon className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
                      Configuration
                    </h3>

                    <div className="space-y-4">
                      {/* Agent Type */}
                      <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: 'rgb(169, 189, 203)' }}>
                          Agent Type
                        </label>
                        <select
                          value={agentConfig.agentType}
                          onChange={(e) => {
                            const newType = e.target.value;
                            const mapping = SKILL_MAPPINGS[newType] || SKILL_MAPPINGS.general;
                            setAgentConfig(prev => ({
                              ...prev,
                              agentType: newType,
                              name: mapping.name,
                              skills: mapping.skills,
                              price: mapping.price
                            }));
                          }}
                          className="w-full px-3 py-2 rounded-lg border text-sm"
                          style={{
                            backgroundColor: 'rgba(48, 54, 54, 0.5)',
                            borderColor: 'rgba(169, 189, 203, 0.3)',
                            color: 'rgb(229, 227, 220)'
                          }}
                        >
                          <option value="sales">Sales Agent</option>
                          <option value="support">Support Agent</option>
                          <option value="marketing">Marketing Agent</option>
                          <option value="operations">Operations Agent</option>
                          <option value="data">Data Analytics Agent</option>
                          <option value="general">Custom AI Agent</option>
                        </select>
                      </div>

                      {/* Industry */}
                      <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: 'rgb(169, 189, 203)' }}>
                          Industry
                        </label>
                        <select
                          value={agentConfig.industry || 'Technology'}
                          onChange={(e) => setAgentConfig(prev => ({ ...prev, industry: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border text-sm"
                          style={{
                            backgroundColor: 'rgba(48, 54, 54, 0.5)',
                            borderColor: 'rgba(169, 189, 203, 0.3)',
                            color: 'rgb(229, 227, 220)'
                          }}
                        >
                          <option value="Technology">Technology</option>
                          <option value="E-commerce">E-commerce</option>
                          <option value="Healthcare">Healthcare</option>
                          <option value="Finance">Finance</option>
                          <option value="Education">Education</option>
                          <option value="Real Estate">Real Estate</option>
                        </select>
                      </div>

                      {/* Company Size */}
                      <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: 'rgb(169, 189, 203)' }}>
                          Company Size
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {['1-10', '11-50', '51-200', '200+'].map(size => (
                            <button
                              key={size}
                              onClick={() => setAgentConfig(prev => ({ ...prev, companySize: size }))}
                              className="px-3 py-2 rounded-lg border text-xs transition"
                              style={{
                                backgroundColor: agentConfig.companySize === size
                                  ? 'rgba(169, 189, 203, 0.1)'
                                  : 'rgba(48, 54, 54, 0.3)',
                                borderColor: agentConfig.companySize === size
                                  ? 'rgb(169, 189, 203)'
                                  : 'rgba(169, 189, 203, 0.2)',
                                color: 'rgb(229, 227, 220)'
                              }}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mt-6 bg-gray-800/30 rounded-xl p-6" style={{ border: '1px solid rgba(169, 189, 203, 0.15)' }}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'rgb(229, 227, 220)' }}>
                      <SparklesIcon className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
                      Features
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
                                : 'transparent',
                              borderColor: agentConfig.features.includes(feature.id)
                                ? 'rgb(169, 189, 203)'
                                : 'rgba(169, 189, 203, 0.2)',
                              color: 'rgb(229, 227, 220)'
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" style={{ color: 'rgba(169, 189, 203, 0.8)' }} />
                                <div>
                                  <div className="text-sm font-medium">{feature.name}</div>
                                  <div className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                                    +£{feature.priceImpact}/mo
                                  </div>
                                </div>
                              </div>
                              {agentConfig.features.includes(feature.id) && (
                                <CheckIcon className="h-4 w-4" style={{ color: 'rgb(169, 189, 203)' }} />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Integrations Column */}
                <div className="bg-gray-800/30 rounded-xl p-6" style={{ border: '1px solid rgba(169, 189, 203, 0.15)' }}>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'rgb(229, 227, 220)' }}>
                    <LinkIcon className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
                    Integrations
                  </h3>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
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
                            <div className="space-y-1">
                              {integrations.map(integration => (
                                <button
                                  key={integration.id}
                                  onClick={() => toggleIntegration(integration.id)}
                                  className="w-full px-3 py-2 rounded text-left text-xs transition hover:opacity-80"
                                  style={{
                                    backgroundColor: agentConfig.integrations.includes(integration.id)
                                      ? 'rgba(169, 189, 203, 0.1)'
                                      : 'transparent',
                                    color: 'rgb(229, 227, 220)'
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-medium">{integration.name}</div>
                                      <div style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                                        {integration.description}
                                      </div>
                                    </div>
                                    {agentConfig.integrations.includes(integration.id) && (
                                      <CheckIcon className="h-3 w-3 flex-shrink-0 ml-2" style={{ color: 'rgb(169, 189, 203)' }} />
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

                {/* Current Build Column (moved to middle) */}
                <div className="bg-gray-800/30 rounded-xl p-6" style={{ border: '1px solid rgba(169, 189, 203, 0.15)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold" style={{ color: 'rgb(229, 227, 220)' }}>
                      {agentConfig.name}
                    </h3>
                    <span className="px-3 py-1 text-sm font-bold rounded-full" style={{
                      backgroundColor: 'rgba(169, 189, 203, 0.2)',
                      color: 'rgb(169, 189, 203)'
                    }}>
                      £{calculateTotalPrice()}/mo
                    </span>
                  </div>

                  <p className="text-sm mb-4" style={{ color: 'rgba(169, 189, 203, 0.9)' }}>
                    {agentConfig.description || 'Your custom AI agent tailored to your needs'}
                  </p>

                  {/* Core Skills */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium" style={{ color: 'rgb(169, 189, 203)' }}>
                        Core Skills
                      </span>
                      <span className="px-2 py-0.5 text-xs font-bold rounded-full" style={{
                        backgroundColor: 'rgba(169, 189, 203, 0.2)',
                        color: 'rgb(169, 189, 203)'
                      }}>
                        {agentConfig.skills.length}/{TOTAL_SKILLS} Skills
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {agentConfig.skills.slice(0, 6).map(skill => (
                        <span key={skill} className="px-2 py-1 text-xs rounded" style={{
                          backgroundColor: 'rgba(169, 189, 203, 0.15)',
                          color: 'rgb(229, 227, 220)'
                        }}>
                          {skill}
                        </span>
                      ))}
                      {agentConfig.skills.length > 6 && (
                        <button
                          onClick={() => setShowSkillsBreakdown(true)}
                          className="px-2 py-1 text-xs rounded hover:opacity-80 transition"
                          style={{
                            backgroundColor: 'rgba(169, 189, 203, 0.2)',
                            color: 'rgb(169, 189, 203)',
                            border: '1px solid rgba(169, 189, 203, 0.3)'
                          }}
                        >
                          +{agentConfig.skills.length - 6} more
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Selected Integrations */}
                  {agentConfig.integrations.length > 0 && (
                    <div className="mb-4">
                      <span className="text-sm font-medium" style={{ color: 'rgb(169, 189, 203)' }}>
                        Integrations
                      </span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {agentConfig.integrations.map(int => (
                          <span key={int} className="px-2 py-1 text-xs rounded" style={{
                            backgroundColor: 'rgba(169, 189, 203, 0.15)',
                            color: 'rgb(169, 189, 203)'
                          }}>
                            {int}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setPreviewMode(true)}
                    className="w-full mt-4 px-4 py-3 rounded-lg text-white font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: 'rgb(169, 189, 203)'
                    }}
                  >
                    <EyeIcon className="h-5 w-5" />
                    Preview Dashboard
                  </button>
                </div>

                {/* Configuration and Features Column (moved to right) */}
              </div>
            </div>
          </div>
        )}

        {/* Skills Breakdown Modal */}
        {showSkillsBreakdown && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.2)' }}>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold" style={{ color: 'rgb(229, 227, 220)' }}>
                    {agentConfig.name} - Complete Skills Breakdown ({agentConfig.skills.length} Skills)
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

        {/* No floating widget needed - using embedded chatbot */}
      </div>
    </DashboardLayout>
  );
}