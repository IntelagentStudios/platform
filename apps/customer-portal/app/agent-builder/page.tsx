'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  ChevronLeftIcon,
  ChevronRightIcon,
  BookmarkIcon,
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
import AgentBuilderAI from '../../components/AgentBuilderAI';
import DashboardPreview from '../../components/DashboardPreview';
import DashboardPreviewEnhanced from '../../components/DashboardPreviewEnhanced';
import DashboardPreviewComplete from '../../components/DashboardPreviewComplete';
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
    priceImpact: 50,
    category: 'communication'
  },
  {
    id: 'voice_assistant',
    name: 'Voice Commands',
    description: 'Control with voice',
    icon: MicrophoneIcon,
    priceImpact: 75,
    category: 'communication'
  },
  {
    id: 'multi_language',
    name: 'Multi-Language',
    description: '95+ languages',
    icon: DocumentChartBarIcon,
    priceImpact: 100,
    category: 'localization'
  },
  {
    id: 'white_label',
    name: 'White Label',
    description: 'Your branding',
    icon: PencilIcon,
    priceImpact: 150,
    category: 'customization'
  },
  {
    id: 'api_access',
    name: 'API Access',
    description: 'Full REST API',
    icon: CodeBracketIcon,
    priceImpact: 100,
    category: 'integration'
  },
  {
    id: 'custom_workflows',
    name: 'Custom Workflows',
    description: 'Workflow automation',
    icon: CogIcon,
    priceImpact: 125,
    category: 'automation'
  },
  {
    id: 'advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Deep insights & reports',
    icon: ChartBarIcon,
    priceImpact: 80,
    category: 'analytics'
  },
  {
    id: 'priority_support',
    name: 'Priority Support',
    description: '24/7 dedicated support',
    icon: ShieldCheckIcon,
    priceImpact: 200,
    category: 'support'
  },
  {
    id: 'unlimited_usage',
    name: 'Unlimited Usage',
    description: 'No usage limits',
    icon: BoltIcon,
    priceImpact: 300,
    category: 'capacity'
  },
  {
    id: 'advanced_security',
    name: 'Advanced Security',
    description: 'Enterprise security',
    icon: ShieldCheckIcon,
    priceImpact: 150,
    category: 'security'
  },
  {
    id: 'data_export',
    name: 'Data Export',
    description: 'Export all data',
    icon: CloudArrowUpIcon,
    priceImpact: 50,
    category: 'data'
  },
  {
    id: 'custom_integrations',
    name: 'Custom Integrations',
    description: 'Build custom connectors',
    icon: LinkIcon,
    priceImpact: 175,
    category: 'integration'
  },
  {
    id: 'sla_guarantee',
    name: 'SLA Guarantee',
    description: '99.9% uptime SLA',
    icon: ShieldCheckIcon,
    priceImpact: 100,
    category: 'reliability'
  },
  {
    id: 'dedicated_instance',
    name: 'Dedicated Instance',
    description: 'Private deployment',
    icon: ServerStackIcon,
    priceImpact: 500,
    category: 'infrastructure'
  },
  {
    id: 'audit_logs',
    name: 'Audit Logs',
    description: 'Complete audit trail',
    icon: DocumentChartBarIcon,
    priceImpact: 75,
    category: 'compliance'
  },
  {
    id: 'role_based_access',
    name: 'Role-Based Access',
    description: 'Team permissions',
    icon: ShieldCheckIcon,
    priceImpact: 60,
    category: 'security'
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    description: 'Real-time events',
    icon: BoltIcon,
    priceImpact: 40,
    category: 'integration'
  },
  {
    id: 'sandbox_environment',
    name: 'Sandbox Environment',
    description: 'Test environment',
    icon: WrenchIcon,
    priceImpact: 80,
    category: 'development'
  },
  {
    id: 'custom_reporting',
    name: 'Custom Reporting',
    description: 'Build custom reports',
    icon: DocumentChartBarIcon,
    priceImpact: 90,
    category: 'analytics'
  },
  {
    id: 'mobile_app',
    name: 'Mobile App',
    description: 'iOS & Android apps',
    icon: CubeIcon,
    priceImpact: 200,
    category: 'platform'
  }
];

// Suggested features based on agent type
const SUGGESTED_FEATURES: { [key: string]: string[] } = {
  sales: ['ai_chatbot', 'api_access'],
  support: ['ai_chatbot', 'multi_language'],
  marketing: ['multi_language', 'white_label'],
  operations: ['api_access', 'white_label'],
  data: ['multi_language', 'custom_workflows'],
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
    features: []
  });
  const [inputDescription, setInputDescription] = useState('');
  const [showChatbot, setShowChatbot] = useState(false);
  const [showSkillsBreakdown, setShowSkillsBreakdown] = useState(false);
  const [expandedIntegrationCategory, setExpandedIntegrationCategory] = useState<string | null>(null);
  const [chatStep, setChatStep] = useState(0);
  const [chatResponses, setChatResponses] = useState<{[key: string]: string}>({});
  const [hasInteracted, setHasInteracted] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [expandedSkillCategory, setExpandedSkillCategory] = useState<string | null>(null);
  const [suggestedFeatures, setSuggestedFeatures] = useState<string[]>([]);

  // Version control state
  const [configHistory, setConfigHistory] = useState<AgentConfig[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isVersionChange, setIsVersionChange] = useState(false);

  // Save configuration to history
  const saveToHistory = useCallback((config: AgentConfig, force: boolean = false) => {
    if (!isVersionChange || force) {
      // Check if config has actually changed (deep comparison)
      const lastConfig = configHistory[historyIndex];
      const hasChanged = !lastConfig ||
        JSON.stringify(config.skills) !== JSON.stringify(lastConfig.skills) ||
        JSON.stringify(config.features) !== JSON.stringify(lastConfig.features) ||
        JSON.stringify(config.integrations) !== JSON.stringify(lastConfig.integrations) ||
        config.name !== lastConfig.name ||
        config.description !== lastConfig.description;

      if (hasChanged || force) {
        const newHistory = configHistory.slice(0, historyIndex + 1);
        newHistory.push(JSON.parse(JSON.stringify(config))); // Deep clone
        setConfigHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    }
  }, [configHistory, historyIndex, isVersionChange]);

  // Navigate history
  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      setIsVersionChange(true);
      const prevConfig = configHistory[historyIndex - 1];
      setAgentConfig(prevConfig);
      setHistoryIndex(historyIndex - 1);
      setTimeout(() => setIsVersionChange(false), 100);
    }
  }, [configHistory, historyIndex]);

  const goForward = useCallback(() => {
    if (historyIndex < configHistory.length - 1) {
      setIsVersionChange(true);
      const nextConfig = configHistory[historyIndex + 1];
      setAgentConfig(nextConfig);
      setHistoryIndex(historyIndex + 1);
      setTimeout(() => setIsVersionChange(false), 100);
    }
  }, [configHistory, historyIndex]);

  // Only log config changes for debugging (no automatic version saves)
  useEffect(() => {
    console.log('AgentConfig updated:', {
      skills: agentConfig.skills.length,
      features: agentConfig.features.length,
      integrations: agentConfig.integrations.length
    });
    // Note: Version saves only happen on:
    // 1. AI agent updates (in onConfigUpdate)
    // 2. Manual save button click (saveVersion)
    // 3. Entering preview mode (handleContinue)
  }, [agentConfig.skills, agentConfig.features, agentConfig.integrations]);

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

    // Suggest features based on agent type (reduce voice assistant suggestions)
    let suggestedFeatures = SUGGESTED_FEATURES[detectedType] || [];
    // Remove voice assistant from most suggestions except support
    if (detectedType !== 'support') {
      suggestedFeatures = suggestedFeatures.filter(f => f !== 'voice_assistant');
    }

    setAgentConfig(prev => ({
      ...prev,
      description: desc,
      agentType: detectedType,
      skills: detectedSkills,
      features: suggestedFeatures,
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
    // Save a version checkpoint when entering preview
    saveToHistory(agentConfig, true);
    setPreviewMode(true);
  };

  // Manually save current configuration as a version
  const saveVersion = () => {
    saveToHistory(agentConfig, true);
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

      // Don't calculate price here - let getPricingBreakdown handle it
      return {
        ...prev,
        features
      };
    });
  };

  // Toggle skill selection
  const toggleSkill = (skillId: string) => {
    setAgentConfig(prev => {
      const skills = prev.skills.includes(skillId)
        ? prev.skills.filter(s => s !== skillId)
        : [...prev.skills, skillId];

      // Update suggested features based on skills
      updateSuggestedFeatures(skills);

      // Don't calculate price here - let getPricingBreakdown handle it
      return {
        ...prev,
        skills
      };
    });
  };

  // Toggle all skills in a category
  const toggleAllSkillsInCategory = (category: string) => {
    const categorySkills = SKILLS_CATALOG[category] || [];
    const categorySkillIds = categorySkills.map(s => s.id);

    setAgentConfig(prev => {
      // Check if all skills in this category are selected
      const allSelected = categorySkillIds.every(id => prev.skills.includes(id));

      let newSkills: string[];
      if (allSelected) {
        // Remove all category skills
        newSkills = prev.skills.filter(s => !categorySkillIds.includes(s));
      } else {
        // Add all category skills
        newSkills = [...new Set([...prev.skills, ...categorySkillIds])];
      }

      // Update suggested features
      updateSuggestedFeatures(newSkills);

      // Don't calculate price here - let getPricingBreakdown handle it
      return {
        ...prev,
        skills: newSkills
      };
    });
  };

  // Update suggested features based on selected skills
  const updateSuggestedFeatures = (skills: string[]) => {
    const features = new Set<string>();

    // Analyze skills to suggest features
    const skillCategories = new Set<string>();
    skills.forEach(skillId => {
      Object.entries(SKILLS_CATALOG).forEach(([category, categorySkills]) => {
        if (categorySkills.some(s => s.id === skillId)) {
          skillCategories.add(category);
        }
      });
    });

    // Suggest features based on skill categories
    if (skillCategories.has('Sales & CRM') || skillCategories.has('Customer Support')) {
      features.add('ai_chatbot');
      features.add('voice_assistant');
    }
    if (skillCategories.has('Marketing & Social') || skillCategories.has('Social & Content')) {
      features.add('multi_language');
      features.add('white_label');
    }
    if (skillCategories.has('Data & Analytics') || skillCategories.has('AI & Machine Learning')) {
      features.add('custom_workflows');
      features.add('api_access');
    }
    if (skillCategories.has('Finance & Accounting')) {
      features.add('advanced_security');
      features.add('priority_support');
    }
    if (skills.length > 20) {
      features.add('unlimited_usage');
    }

    setSuggestedFeatures(Array.from(features));
  };

  // Calculate total price (now uses getPricingBreakdown for consistency)
  const calculateTotalPrice = () => {
    const breakdown = getPricingBreakdown();
    return breakdown.total;
  };

  // Get pricing breakdown with volume discounts
  const getPricingBreakdown = () => {
    const basePrice = 299;
    const skillCount = agentConfig.skills.length;

    // Calculate skill price with volume discounts
    let pricePerSkill = 5;
    let discount = 0;

    if (skillCount >= 30) {
      pricePerSkill = 3.5; // 30% discount
      discount = 30;
    } else if (skillCount >= 20) {
      pricePerSkill = 4; // 20% discount
      discount = 20;
    } else if (skillCount >= 10) {
      pricePerSkill = 4.5; // 10% discount
      discount = 10;
    }

    const skillsPrice = skillCount * pricePerSkill;
    const skillsSaved = skillCount * 5 - skillsPrice;

    const featuresPrice = agentConfig.features.reduce((total, fid) => {
      const feature = POPULAR_FEATURES.find(f => f.id === fid);
      return total + (feature?.priceImpact || 0);
    }, 0);

    return {
      base: basePrice,
      skills: skillsPrice,
      skillCount: skillCount,
      pricePerSkill: pricePerSkill,
      discount: discount,
      saved: skillsSaved,
      features: featuresPrice,
      total: basePrice + skillsPrice + featuresPrice
    };
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
        skills: mapping.skills
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
          <DashboardPreviewComplete
            agentConfig={agentConfig}
            versionInfo={{
              current: historyIndex + 1,
              total: configHistory.length
            }}
          />
        ) : (
          <div className="p-8">
            {/* Top Section: Summary and Chatbot */}
            <div className="max-w-7xl mx-auto mb-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Summary & Pricing Column - Now on the left */}
                <div className="bg-gray-800/30 rounded-xl" style={{ border: '1px solid rgba(169, 189, 203, 0.15)', height: '400px', overflow: 'hidden' }}>
                  <div className="p-6 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold" style={{ color: 'rgb(229, 227, 220)' }}>
                          {agentConfig.name || 'Your AI Agent'}
                        </h3>
                        {/* Version control buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={goBack}
                            disabled={historyIndex <= 0}
                            className="p-1.5 rounded transition"
                            style={{
                              backgroundColor: historyIndex > 0 ? 'rgba(169, 189, 203, 0.1)' : 'transparent',
                              opacity: historyIndex > 0 ? 1 : 0.3,
                              cursor: historyIndex > 0 ? 'pointer' : 'not-allowed'
                            }}
                            title="Previous version"
                          >
                            <ChevronLeftIcon className="h-4 w-4" style={{ color: 'rgb(169, 189, 203)' }} />
                          </button>
                          <span className="text-xs px-2" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                            v{historyIndex + 1}/{configHistory.length}
                          </span>
                          <button
                            onClick={goForward}
                            disabled={historyIndex >= configHistory.length - 1}
                            className="p-1.5 rounded transition"
                            style={{
                              backgroundColor: historyIndex < configHistory.length - 1 ? 'rgba(169, 189, 203, 0.1)' : 'transparent',
                              opacity: historyIndex < configHistory.length - 1 ? 1 : 0.3,
                              cursor: historyIndex < configHistory.length - 1 ? 'pointer' : 'not-allowed'
                            }}
                            title="Next version"
                          >
                            <ChevronRightIcon className="h-4 w-4" style={{ color: 'rgb(169, 189, 203)' }} />
                          </button>
                          {/* Save Version Button */}
                          <div className="ml-2 pl-2" style={{ borderLeft: '1px solid rgba(169, 189, 203, 0.2)' }}>
                            <button
                              onClick={saveVersion}
                              className="px-3 py-1 rounded text-xs transition hover:opacity-80 flex items-center gap-1"
                              style={{
                                backgroundColor: 'rgba(169, 189, 203, 0.15)',
                                color: 'rgb(169, 189, 203)'
                              }}
                              title="Save current configuration as a version"
                            >
                              <BookmarkIcon className="h-3 w-3" />
                              Save Version
                            </button>
                          </div>
                        </div>
                      </div>
                      <span className="px-4 py-2 text-lg font-bold rounded-full" style={{
                        backgroundColor: 'rgba(169, 189, 203, 0.2)',
                        color: 'rgb(169, 189, 203)'
                      }}>
                        £{getPricingBreakdown().total}/mo
                      </span>
                    </div>

                    <p className="text-sm mb-4" style={{ color: 'rgba(169, 189, 203, 0.9)' }}>
                      {agentConfig.description || 'Configure your custom AI agent with the skills and integrations your business needs'}
                    </p>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center p-2 rounded-lg" style={{ backgroundColor: 'rgba(58, 64, 64, 0.5)' }}>
                        <div className="text-xl font-bold" style={{ color: 'rgb(169, 189, 203)' }}>
                          {agentConfig.skills.length}
                        </div>
                        <div className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>Skills</div>
                      </div>
                      <div className="text-center p-2 rounded-lg" style={{ backgroundColor: 'rgba(58, 64, 64, 0.5)' }}>
                        <div className="text-xl font-bold" style={{ color: 'rgb(169, 189, 203)' }}>
                          {agentConfig.integrations.length}
                        </div>
                        <div className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>Integrations</div>
                      </div>
                      <div className="text-center p-2 rounded-lg" style={{ backgroundColor: 'rgba(58, 64, 64, 0.5)' }}>
                        <div className="text-xl font-bold" style={{ color: 'rgb(169, 189, 203)' }}>
                          {agentConfig.features.length}
                        </div>
                        <div className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>Features</div>
                      </div>
                    </div>

                    {/* Pricing Breakdown */}
                    <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(58, 64, 64, 0.3)' }}>
                      <div className="text-xs font-medium mb-2" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>Pricing Breakdown</div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span style={{ color: 'rgba(229, 227, 220, 0.7)' }}>Base Platform</span>
                          <span style={{ color: 'rgba(229, 227, 220, 0.9)' }}>£{getPricingBreakdown().base}</span>
                        </div>
                        {agentConfig.skills.length > 0 && (
                          <div className="flex justify-between text-xs">
                            <span style={{ color: 'rgba(229, 227, 220, 0.7)' }}>
                              {agentConfig.skills.length} Skills @ £{getPricingBreakdown().pricePerSkill}/ea
                              {getPricingBreakdown().discount > 0 && (
                                <span style={{ color: 'rgb(34, 197, 94)' }}> ({getPricingBreakdown().discount}% off)</span>
                              )}
                            </span>
                            <span style={{ color: 'rgba(229, 227, 220, 0.9)' }}>£{getPricingBreakdown().skills.toFixed(0)}</span>
                          </div>
                        )}
                        {agentConfig.features.length > 0 && (
                          <div className="flex justify-between text-xs">
                            <span style={{ color: 'rgba(229, 227, 220, 0.7)' }}>{agentConfig.features.length} Premium Features</span>
                            <span style={{ color: 'rgba(229, 227, 220, 0.9)' }}>£{getPricingBreakdown().features}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-semibold pt-1 border-t" style={{ borderColor: 'rgba(169, 189, 203, 0.2)' }}>
                          <span style={{ color: 'rgb(169, 189, 203)' }}>Total</span>
                          <span style={{ color: 'rgb(169, 189, 203)' }}>£{getPricingBreakdown().total}/mo</span>
                        </div>
                      </div>
                    </div>

                    {/* Selected Items Preview */}
                    <div className="flex-1 space-y-2 overflow-y-auto" style={{ minHeight: '100px' }}>
                      {agentConfig.skills.length > 0 && (
                        <div>
                          <div className="text-xs font-medium mb-1" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>Selected Skills</div>
                          <div className="flex flex-wrap gap-1">
                            {agentConfig.skills.slice(0, 8).map(skill => (
                              <span key={skill} className="px-2 py-1 text-xs rounded" style={{
                                backgroundColor: 'rgba(169, 189, 203, 0.15)',
                                color: 'rgb(229, 227, 220)'
                              }}>
                                {skill.replace(/_/g, ' ')}
                              </span>
                            ))}
                            {agentConfig.skills.length > 8 && (
                              <span className="px-2 py-1 text-xs rounded" style={{
                                backgroundColor: 'rgba(169, 189, 203, 0.1)',
                                color: 'rgba(169, 189, 203, 0.7)'
                              }}>
                                +{agentConfig.skills.length - 8} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Preview Dashboard Button */}
                    <button
                      onClick={() => {
                        saveToHistory(agentConfig, true);
                        setPreviewMode(true);
                      }}
                      className="w-full mt-2 px-4 py-2 rounded-lg text-white font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: 'rgb(169, 189, 203)'
                      }}
                    >
                      <EyeIcon className="h-5 w-5" />
                      Preview Dashboard
                    </button>
                  </div>
                </div>

                {/* AI Expert Column - Now on the right */}
                <div style={{ height: '400px' }}>
                  <AgentBuilderAI
                    height="400px"
                    currentConfig={agentConfig}
                    availableSkills={Object.keys(SKILLS_CATALOG).reduce((acc, cat) => {
                      return acc.concat(SKILLS_CATALOG[cat].map(s => s.id));
                    }, [])}
                    availableFeatures={POPULAR_FEATURES.map(f => f.id)}
                    availableIntegrations={Object.values(INTEGRATIONS).flat().map(i => i.id)}
                    pricingInfo={getPricingBreakdown()}
                    versionInfo={{
                      current: historyIndex + 1,
                      total: configHistory.length,
                      canUndo: historyIndex > 0,
                      canRedo: historyIndex < configHistory.length - 1
                    }}
                    onConfigUpdate={(config) => {
                      console.log('Agent Builder received config update:', config);
                      // Handle different types of updates
                      if (config.action === 'set_skills' && config.skills) {
                        console.log('Setting skills from AI (replace):', config.skills);
                        console.log('Setting integrations from AI:', config.integrations);
                        console.log('Setting features from AI:', config.features);
                        // Clear existing and set new ones from AI
                        setAgentConfig(prev => {
                          const newConfig = {
                            ...prev,
                            skills: [...config.skills], // Create new array to force re-render
                            integrations: config.integrations ? [...config.integrations] : prev.integrations,
                            features: config.features ? [...config.features] : prev.features
                          };
                          console.log('New agent config:', newConfig);
                          // Save version for AI changes
                          setTimeout(() => saveToHistory(newConfig, true), 100);
                          return newConfig;
                        });
                        updateSuggestedFeatures(config.skills);
                        setHasInteracted(true);
                      } else if (config.action === 'add_skills' && config.skills) {
                        console.log('Adding skills from AI (cumulative):', config.skills);
                        console.log('Adding integrations from AI:', config.integrations);
                        console.log('Adding features from AI:', config.features);
                        // Add to existing configuration
                        setAgentConfig(prev => {
                          const combinedSkills = [...new Set([...prev.skills, ...config.skills])];
                          const combinedIntegrations = config.integrations ?
                            [...new Set([...prev.integrations, ...config.integrations])] :
                            prev.integrations;
                          const combinedFeatures = config.features ?
                            [...new Set([...prev.features, ...config.features])] :
                            prev.features;
                          const newConfig = {
                            ...prev,
                            skills: combinedSkills,
                            integrations: combinedIntegrations,
                            features: combinedFeatures
                          };
                          console.log('New agent config with additions:', newConfig);
                          // Save version for AI changes
                          setTimeout(() => saveToHistory(newConfig, true), 100);
                          return newConfig;
                        });
                        updateSuggestedFeatures(agentConfig.skills);
                        setHasInteracted(true);
                      } else if (config.action === 'toggle_skill' && config.skillId) {
                        toggleSkill(config.skillId);
                      } else if (config.action === 'toggle_feature' && config.featureId) {
                        toggleFeature(config.featureId);
                      } else if (config.action === 'toggle_integration' && config.integrationId) {
                        toggleIntegration(config.integrationId);
                      } else if (config.action === 'select_all_category' && config.category) {
                        toggleAllSkillsInCategory(config.category);
                      } else {
                        // Full config replacement (from AI)
                        setAgentConfig(prev => {
                          const newConfig = {
                            ...prev,
                            name: config.name || prev.name,
                            description: config.description || prev.description,
                            skills: config.skills || prev.skills,
                            features: config.features || prev.features,
                            integrations: config.integrations || prev.integrations
                          };
                          // Save version for AI-driven full config changes
                          if (config.skills || config.features || config.integrations) {
                            setTimeout(() => saveToHistory(newConfig, true), 100);
                          }
                          return newConfig;
                        });
                      }

                      // Update suggested features based on selected skills
                      if (config.skills && config.skills.length > 0) {
                        updateSuggestedFeatures(config.skills);
                      }

                      setHasInteracted(true);
                    }}
                  />
                </div>

              </div>
            </div>

            {/* Bottom Section: Configuration Grid */}
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Integrations Column (Left) */}
                <div className="bg-gray-800/30 rounded-xl p-6 flex flex-col" style={{ border: '1px solid rgba(169, 189, 203, 0.15)', height: '600px' }}>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'rgb(229, 227, 220)' }}>
                      <LinkIcon className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
                      Integrations
                    </h3>
                    <p className="text-xs mt-1" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                      Connect with your existing tools
                    </p>
                  </div>
                  <div className="flex-1 space-y-2">
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
                          style={{
                            backgroundColor: integrations.some(i => agentConfig.integrations.includes(i.id))
                              ? 'rgba(169, 189, 203, 0.05)'
                              : 'transparent'
                          }}
                        >
                          <span className="text-sm font-medium" style={{
                            color: integrations.some(i => agentConfig.integrations.includes(i.id))
                              ? 'rgb(169, 189, 203)'
                              : 'rgb(229, 227, 220)'
                          }}>
                            {category}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{
                              backgroundColor: integrations.some(i => agentConfig.integrations.includes(i.id))
                                ? 'rgba(169, 189, 203, 0.2)'
                                : 'rgba(169, 189, 203, 0.1)',
                              color: 'rgba(169, 189, 203, 0.8)'
                            }}>
                              {integrations.filter(i => agentConfig.integrations.includes(i.id)).length}/{integrations.length}
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
                                      ? 'rgba(169, 189, 203, 0.25)'
                                      : 'transparent',
                                    border: agentConfig.integrations.includes(integration.id)
                                      ? '1px solid rgba(169, 189, 203, 0.5)'
                                      : '1px solid transparent',
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

                {/* Features & Capabilities Column (Middle) */}
                <div className="bg-gray-800/30 rounded-xl p-6 flex flex-col" style={{ border: '1px solid rgba(169, 189, 203, 0.15)', height: '600px' }}>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'rgb(229, 227, 220)' }}>
                      <SparklesIcon className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
                      Features & Capabilities
                    </h3>
                    <p className="text-xs mt-1" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                      Enhance your agent with premium features
                    </p>
                    {suggestedFeatures.length > 0 && (
                      <div className="p-2 rounded-lg mb-3" style={{ backgroundColor: 'rgba(169, 189, 203, 0.05)', border: '1px solid rgba(169, 189, 203, 0.2)' }}>
                        <div className="text-xs font-medium mb-1" style={{ color: 'rgba(169, 189, 203, 0.9)' }}>
                          <LightBulbIcon className="h-3 w-3 inline mr-1" />
                          Suggested based on your skills:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {suggestedFeatures.map(featureId => {
                            const feature = POPULAR_FEATURES.find(f => f.id === featureId);
                            if (!feature) return null;
                            return (
                              <button
                                key={featureId}
                                onClick={() => toggleFeature(featureId)}
                                className="px-2 py-1 text-xs rounded transition hover:opacity-80"
                                style={{
                                  backgroundColor: agentConfig.features.includes(featureId)
                                    ? 'rgba(169, 189, 203, 0.2)'
                                    : 'rgba(169, 189, 203, 0.1)',
                                  color: 'rgb(229, 227, 220)',
                                  border: agentConfig.features.includes(featureId)
                                    ? '1px solid rgba(169, 189, 203, 0.5)'
                                    : '1px solid transparent'
                                }}
                              >
                                {feature.name}
                                {agentConfig.features.includes(featureId) && (
                                  <CheckIcon className="h-3 w-3 inline ml-1" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <style jsx>{`
                    .features-scrollbar::-webkit-scrollbar {
                      width: 8px;
                    }
                    .features-scrollbar::-webkit-scrollbar-track {
                      background: transparent;
                    }
                    .features-scrollbar::-webkit-scrollbar-thumb {
                      background-color: rgba(169, 189, 203, 0.3);
                      border-radius: 4px;
                    }
                    .features-scrollbar::-webkit-scrollbar-thumb:hover {
                      background-color: rgba(169, 189, 203, 0.5);
                    }
                  `}</style>
                  <div className="flex-1 space-y-2 overflow-y-auto features-scrollbar">
                    {POPULAR_FEATURES.map(feature => {
                      const Icon = feature.icon;
                      const isRecommended = suggestedFeatures.includes(feature.id);
                      return (
                        <button
                          key={feature.id}
                          onClick={() => toggleFeature(feature.id)}
                          className="w-full p-3 rounded-lg border transition hover:opacity-90 text-left relative"
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
                          {isRecommended && (
                            <div className="absolute -top-2 -right-2 px-1.5 py-0.5 text-xs rounded-full" style={{
                              backgroundColor: 'rgba(169, 189, 203, 0.2)',
                              color: 'rgb(169, 189, 203)',
                              fontSize: '10px'
                            }}>
                              Recommended
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Icon className="h-5 w-5" style={{ color: 'rgba(169, 189, 203, 0.8)' }} />
                              <div>
                                <div className="text-sm font-medium">{feature.name}</div>
                                <div className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                                  {feature.description}
                                </div>
                                <div className="text-xs mt-1" style={{ color: 'rgba(169, 189, 203, 0.5)' }}>
                                  +£{feature.priceImpact}/month
                                </div>
                              </div>
                            </div>
                            {agentConfig.features.includes(feature.id) && (
                              <CheckIcon className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Skills Matrix Column (Right) */}
                <div className="bg-gray-800/30 rounded-xl p-6 flex flex-col" style={{ border: '1px solid rgba(169, 189, 203, 0.15)', height: '600px' }}>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'rgb(229, 227, 220)' }}>
                        <CubeIcon className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
                        Skills Library
                      </h3>
                      <p className="text-xs mt-1" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                        {agentConfig.skills.length} of {TOTAL_SKILLS} skills selected
                      </p>
                    </div>
                    <style jsx>{`
                      .skills-scrollbar::-webkit-scrollbar {
                        width: 8px;
                      }
                      .skills-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                      }
                      .skills-scrollbar::-webkit-scrollbar-thumb {
                        background-color: rgba(169, 189, 203, 0.3);
                        border-radius: 4px;
                      }
                      .skills-scrollbar::-webkit-scrollbar-thumb:hover {
                        background-color: rgba(169, 189, 203, 0.5);
                      }
                    `}</style>
                    <div className="flex-1 space-y-2 overflow-y-auto skills-scrollbar">
                      {Object.entries(SKILLS_CATALOG).map(([category, skills]) => (
                        <div key={category} className="rounded-lg border" style={{
                          backgroundColor: 'rgba(58, 64, 64, 0.2)',
                          borderColor: 'rgba(169, 189, 203, 0.2)'
                        }}>
                          <button
                            onClick={() => setExpandedSkillCategory(
                              expandedSkillCategory === category ? null : category
                            )}
                            className="w-full px-3 py-2 flex items-center justify-between hover:bg-opacity-10 transition"
                            style={{
                              backgroundColor: skills.some(s => agentConfig.skills.includes(s.id))
                                ? 'rgba(169, 189, 203, 0.05)'
                                : 'transparent'
                            }}
                          >
                            <span className="text-sm font-medium" style={{
                              color: skills.some(s => agentConfig.skills.includes(s.id))
                                ? 'rgb(169, 189, 203)'
                                : 'rgb(229, 227, 220)'
                            }}>
                              {category}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{
                                backgroundColor: skills.some(s => agentConfig.skills.includes(s.id))
                                  ? 'rgba(169, 189, 203, 0.2)'
                                  : 'rgba(169, 189, 203, 0.1)',
                                color: 'rgba(169, 189, 203, 0.8)'
                              }}>
                                {skills.filter(s => agentConfig.skills.includes(s.id)).length}/{skills.length}
                              </span>
                              {expandedSkillCategory === category ? (
                                <ChevronUpIcon className="h-4 w-4" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
                              ) : (
                                <ChevronDownIcon className="h-4 w-4" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
                              )}
                            </div>
                          </button>
                          {expandedSkillCategory === category && (
                            <div className="p-2">
                              {/* Select All Button */}
                              <button
                                onClick={() => toggleAllSkillsInCategory(category)}
                                className="w-full px-2 py-1 mb-2 rounded text-xs transition hover:opacity-80 flex items-center justify-center gap-1"
                                style={{
                                  backgroundColor: skills.every(s => agentConfig.skills.includes(s.id))
                                    ? 'rgba(169, 189, 203, 0.2)'
                                    : 'rgba(169, 189, 203, 0.1)',
                                  border: '1px solid rgba(169, 189, 203, 0.3)',
                                  color: 'rgb(169, 189, 203)'
                                }}
                              >
                                {skills.every(s => agentConfig.skills.includes(s.id)) ? (
                                  <>
                                    <XMarkIcon className="h-3 w-3" />
                                    <span>Deselect All</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckIcon className="h-3 w-3" />
                                    <span>Select All ({skills.length})</span>
                                  </>
                                )}
                              </button>
                              {/* Skills List */}
                              <div className="grid grid-cols-1 gap-1">
                                {skills.map(skill => (
                                  <button
                                    key={skill.id}
                                    onClick={() => toggleSkill(skill.id)}
                                    className="px-2 py-1 rounded text-xs text-left hover:bg-opacity-10 transition flex items-center justify-between"
                                    style={{
                                      backgroundColor: (() => {
                                        const isSelected = agentConfig.skills.includes(skill.id);
                                        if (skill.id === 'email_campaigns' || skill.id === 'content_generator') {
                                          console.log(`Skill ${skill.id} selected:`, isSelected, 'in array:', agentConfig.skills);
                                        }
                                        return isSelected ? 'rgba(169, 189, 203, 0.25)' : 'transparent';
                                      })(),
                                      border: agentConfig.skills.includes(skill.id)
                                        ? '1px solid rgba(169, 189, 203, 0.5)'
                                        : '1px solid transparent',
                                      color: agentConfig.skills.includes(skill.id)
                                        ? 'rgb(229, 227, 220)'
                                        : 'rgba(229, 227, 220, 0.7)',
                                      fontWeight: agentConfig.skills.includes(skill.id)
                                        ? '600'
                                        : '400'
                                    }}
                                  >
                                    <span className="truncate">{skill.name}</span>
                                    {agentConfig.skills.includes(skill.id) && (
                                      <CheckIcon className="h-3 w-3 ml-1 flex-shrink-0" style={{ color: 'rgb(169, 189, 203)' }} />
                                    )}
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