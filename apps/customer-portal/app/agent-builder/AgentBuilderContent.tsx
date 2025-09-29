'use client';

import React, { useState, useEffect } from 'react';
import { ChatBubbleLeftIcon, ArrowLeftIcon, CheckIcon, XMarkIcon, ArrowRightIcon, SparklesIcon, CpuChipIcon, ChartBarIcon, CloudArrowUpIcon, ShieldCheckIcon, UsersIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

// Import your existing components
// import { DashboardPreview } from './DashboardPreview';

// Types and interfaces
interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp?: Date;
}

interface AgentConfig {
  name: string;
  type: string;
  industry: string;
  objective: string;
  skills: string[];
  integrations: string[];
  customizations: {
    tone?: string;
    responseTime?: string;
    languages?: string[];
  };
  features: {
    multimodal?: boolean;
    voiceEnabled?: boolean;
    customKnowledge?: boolean;
  };
  estimatedPrice: number;
}

const SKILL_MAPPINGS: Record<string, { name: string; skills: string[] }> = {
  sales: {
    name: 'Sales Agent',
    skills: [
      'Lead Generation', 'Lead Qualification', 'Email Outreach', 'Cold Calling',
      'Follow-up Automation', 'CRM Integration', 'Pipeline Management', 'Deal Tracking',
      'Proposal Generation', 'Contract Management', 'Revenue Forecasting', 'Customer Segmentation',
      'Social Selling', 'LinkedIn Outreach', 'Email Personalization', 'Meeting Scheduling',
      'Objection Handling', 'Price Negotiation', 'Upselling & Cross-selling', 'Referral Generation',
      'Sales Analytics', 'Performance Tracking', 'Commission Calculation', 'Territory Management',
      'Account Mapping', 'Opportunity Scoring', 'Competitive Analysis', 'Sales Enablement',
      'Demo Automation', 'Quote Generation', 'Discount Approval', 'Sales Forecasting',
      'Customer Research', 'Intent Detection', 'Buying Signal Recognition', 'Risk Assessment',
      'Relationship Building', 'Stakeholder Mapping', 'Executive Briefing', 'ROI Calculation',
      'Sales Coaching', 'Team Collaboration', 'Knowledge Sharing', 'Best Practice Implementation'
    ]
  },
  support: {
    name: 'Customer Support Agent',
    skills: [
      'Ticket Management', 'Issue Diagnosis', 'Troubleshooting', 'Knowledge Base Search',
      'FAQ Automation', 'Response Templates', 'Escalation Handling', 'Priority Classification',
      'Customer Sentiment Analysis', 'Response Time Optimization', 'Multi-channel Support', 'Live Chat',
      'Email Support', 'Phone Support Integration', 'Social Media Monitoring', 'Community Management',
      'Bug Reporting', 'Feature Request Logging', 'Customer Feedback Collection', 'Survey Management',
      'SLA Compliance', 'Quality Assurance', 'Performance Metrics', 'Customer Satisfaction Tracking',
      'Language Translation', 'Cultural Adaptation', '24/7 Availability', 'Auto-Response',
      'Canned Responses', 'Macro Management', 'Tag Management', 'Workflow Automation',
      'Customer History Tracking', 'Interaction Logging', 'Case Resolution', 'Follow-up Scheduling',
      'Product Knowledge', 'Technical Documentation', 'Video Support', 'Screen Sharing',
      'Remote Assistance', 'Diagnostic Tools', 'System Integration', 'API Troubleshooting'
    ]
  },
  marketing: {
    name: 'Marketing Agent',
    skills: [
      'Content Creation', 'SEO Optimization', 'Keyword Research', 'Blog Writing',
      'Social Media Management', 'Campaign Planning', 'Email Marketing', 'Newsletter Creation',
      'A/B Testing', 'Conversion Optimization', 'Landing Page Design', 'Call-to-Action Optimization',
      'Marketing Automation', 'Lead Nurturing', 'Drip Campaigns', 'Segmentation Strategy',
      'Analytics Reporting', 'ROI Tracking', 'Attribution Modeling', 'Customer Journey Mapping',
      'Competitor Analysis', 'Market Research', 'Trend Analysis', 'Audience Insights',
      'Brand Management', 'Voice & Tone Consistency', 'Visual Asset Management', 'Brand Guidelines',
      'Influencer Outreach', 'Partnership Development', 'Affiliate Management', 'PR Coordination',
      'Event Planning', 'Webinar Management', 'Product Launch', 'Go-to-Market Strategy',
      'PPC Management', 'Ad Copy Writing', 'Bid Optimization', 'Retargeting Campaigns',
      'Video Marketing', 'Podcast Management', 'Content Calendar', 'Editorial Planning',
      'Marketing Compliance', 'GDPR Management', 'Data Privacy', 'Consent Management'
    ]
  },
  operations: {
    name: 'Operations Agent',
    skills: [
      'Process Automation', 'Workflow Optimization', 'Task Scheduling', 'Resource Allocation',
      'Inventory Management', 'Supply Chain Monitoring', 'Vendor Management', 'Purchase Orders',
      'Quality Control', 'Compliance Monitoring', 'Risk Management', 'Audit Trail',
      'Performance Monitoring', 'KPI Tracking', 'Dashboard Reporting', 'Real-time Analytics',
      'Capacity Planning', 'Demand Forecasting', 'Load Balancing', 'Queue Management',
      'Incident Management', 'Alert Handling', 'Escalation Procedures', 'Root Cause Analysis',
      'Change Management', 'Version Control', 'Release Management', 'Deployment Automation',
      'Documentation Management', 'SOP Creation', 'Policy Enforcement', 'Training Materials',
      'Cost Optimization', 'Budget Tracking', 'Expense Management', 'ROI Analysis',
      'Project Management', 'Milestone Tracking', 'Dependency Management', 'Resource Planning',
      'Data Integration', 'ETL Processing', 'Data Validation', 'Error Handling',
      'System Monitoring', 'Health Checks', 'Performance Tuning', 'Backup Management'
    ]
  },
  data: {
    name: 'Data Analytics Agent',
    skills: [
      'Data Collection', 'Data Cleaning', 'Data Transformation', 'Data Validation',
      'Statistical Analysis', 'Predictive Modeling', 'Machine Learning', 'Deep Learning',
      'Time Series Analysis', 'Regression Analysis', 'Classification', 'Clustering',
      'Natural Language Processing', 'Sentiment Analysis', 'Text Mining', 'Entity Recognition',
      'Data Visualization', 'Dashboard Creation', 'Report Generation', 'Interactive Charts',
      'SQL Queries', 'Database Management', 'Data Warehousing', 'Big Data Processing',
      'Real-time Analytics', 'Stream Processing', 'Event Detection', 'Anomaly Detection',
      'A/B Testing Analysis', 'Hypothesis Testing', 'Confidence Intervals', 'Statistical Significance',
      'Customer Analytics', 'Cohort Analysis', 'Retention Analysis', 'Churn Prediction',
      'Revenue Analytics', 'Pricing Optimization', 'Market Basket Analysis', 'Cross-sell Analysis',
      'Performance Metrics', 'KPI Monitoring', 'Goal Tracking', 'Benchmark Analysis',
      'Data Governance', 'Data Quality', 'Metadata Management', 'Data Lineage',
      'API Integration', 'Web Scraping', 'Data Pipeline', 'ETL/ELT Processes'
    ]
  },
  general: {
    name: 'General Assistant',
    skills: [
      'Task Management', 'Calendar Management', 'Email Management', 'Document Creation',
      'Research Assistance', 'Information Retrieval', 'Summarization', 'Translation',
      'Meeting Notes', 'Action Items Tracking', 'Reminder Setting', 'Scheduling',
      'Data Entry', 'Form Processing', 'Report Writing', 'Presentation Creation'
    ]
  }
};

const INTEGRATIONS = [
  { id: 'salesforce', name: 'Salesforce', icon: '☁️' },
  { id: 'hubspot', name: 'HubSpot', icon: '🔧' },
  { id: 'shopify', name: 'Shopify', icon: '🛒' },
  { id: 'stripe', name: 'Stripe', icon: '💳' },
  { id: 'mailchimp', name: 'Mailchimp', icon: '✉️' },
  { id: 'zapier', name: 'Zapier', icon: '⚡' },
  { id: 'gmail', name: 'Gmail', icon: '📧' },
  { id: 'gcalendar', name: 'Google Calendar', icon: '📅' },
  { id: 'teams', name: 'Microsoft Teams', icon: '👥' },
  { id: 'jira', name: 'Jira', icon: '🎯' }
];

export function AgentBuilderContent() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi! I'm here to help you build your perfect AI agent. Let's start with the basics - what type of agent are you looking to create? For example: Sales, Customer Support, Marketing, Operations, or Data Analytics?",
      sender: 'ai'
    }
  ]);

  const [inputValue, setInputValue] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    name: '',
    type: '',
    industry: '',
    objective: '',
    skills: [],
    integrations: [],
    customizations: {},
    features: {},
    estimatedPrice: 0
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([]);
  const [detectedSkills, setDetectedSkills] = useState<string[]>([]);
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [showSkillsBreakdown, setShowSkillsBreakdown] = useState(false);

  useEffect(() => {
    const lowerType = agentConfig.type.toLowerCase();
    let skills: string[] = [];

    Object.entries(SKILL_MAPPINGS).forEach(([key, mapping]) => {
      if (lowerType.includes(key)) {
        skills = [...skills, ...mapping.skills];
      }
    });

    if (skills.length === 0 && agentConfig.type) {
      skills = SKILL_MAPPINGS.general.skills;
    }

    const uniqueSkills = Array.from(new Set(skills));
    setDetectedSkills(uniqueSkills);
    setAgentConfig(prev => ({ ...prev, skills: uniqueSkills }));
  }, [agentConfig.type]);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      const newMessage: Message = {
        id: messages.length + 1,
        text: inputValue,
        sender: 'user',
        timestamp: new Date()
      };
      setMessages([...messages, newMessage]);
      setInputValue('');

      processUserInput(inputValue, currentStep);
    }
  };

  const processUserInput = (input: string, step: number) => {
    setIsTyping(true);

    setTimeout(() => {
      let aiResponse = '';
      const updatedConfig = { ...agentConfig };

      switch (step) {
        case 1:
          updatedConfig.type = input;
          aiResponse = `Great! A ${input} agent. What industry or domain will this agent operate in? (e.g., E-commerce, SaaS, Healthcare, Finance, etc.)`;
          setCurrentStep(2);
          break;
        case 2:
          updatedConfig.industry = input;
          aiResponse = `Perfect! ${input} it is. Now, what's the main objective or goal for this agent? What specific problem should it solve?`;
          setCurrentStep(3);
          break;
        case 3:
          updatedConfig.objective = input;
          aiResponse = `Excellent! I'll configure an agent focused on ${input}. Which integrations would you like to connect? You can select from the options below or type additional ones:`;
          setCurrentStep(4);
          break;
        case 4:
          updatedConfig.integrations = selectedIntegrations;
          aiResponse = `Great choices! What should we name your agent? Choose something memorable that reflects its purpose.`;
          setCurrentStep(5);
          break;
        case 5:
          updatedConfig.name = input;
          const basePrice = calculatePrice(updatedConfig);
          updatedConfig.estimatedPrice = basePrice;
          aiResponse = `Perfect! "${input}" is ready to preview. I've detected ${detectedSkills.length} relevant skills for your ${updatedConfig.type} agent. Click "View Agent Dashboard" to see your customized interface!`;
          setCurrentStep(6);
          break;
        default:
          aiResponse = "Your agent is configured! Feel free to review the preview or make any adjustments.";
      }

      setAgentConfig(updatedConfig);

      const aiMessage: Message = {
        id: messages.length + 2,
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const calculatePrice = (config: AgentConfig): number => {
    let basePrice = 299;
    basePrice += config.skills.length * 5;
    basePrice += config.integrations.length * 50;
    const featuresPrice = Object.values(config.features || {}).reduce((total, feature) => {
      return total + (feature ? 100 : 0);
    }, 0);
    return basePrice + featuresPrice;
  };

  if (previewMode) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="px-8 py-6 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                {agentConfig.name} Dashboard
              </h1>
              <p className="text-sm mt-1" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                Preview of your custom agent interface
              </p>
            </div>
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
          </div>
        </div>
        <div className="p-8">
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
              Dashboard Preview
            </h2>
            <p style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
              Your {agentConfig.name} dashboard with {agentConfig.skills.length} skills and {agentConfig.integrations.length} integrations is ready!
            </p>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="font-semibold" style={{ color: 'rgb(229, 227, 220)' }}>Active Tasks</h3>
                <p className="text-2xl font-bold text-blue-400">24</p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="font-semibold" style={{ color: 'rgb(229, 227, 220)' }}>Completed</h3>
                <p className="text-2xl font-bold text-green-400">156</p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="font-semibold" style={{ color: 'rgb(229, 227, 220)' }}>Efficiency</h3>
                <p className="text-2xl font-bold text-purple-400">94%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
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
        </div>
      </div>

      <div className="flex gap-6 p-8 h-[calc(100vh-100px)]">
        {/* Left side - Main content area */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Configuration Display */}
          {agentConfig.type && (
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
                Agent Configuration
              </h2>

              <div className="grid grid-cols-3 gap-4">
                {agentConfig.type && (
                  <div>
                    <span className="text-sm" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>Type</span>
                    <p className="font-medium" style={{ color: 'rgb(229, 227, 220)' }}>{agentConfig.type}</p>
                  </div>
                )}
                {agentConfig.industry && (
                  <div>
                    <span className="text-sm" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>Industry</span>
                    <p className="font-medium" style={{ color: 'rgb(229, 227, 220)' }}>{agentConfig.industry}</p>
                  </div>
                )}
                {agentConfig.name && (
                  <div>
                    <span className="text-sm" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>Name</span>
                    <p className="font-medium" style={{ color: 'rgb(229, 227, 220)' }}>{agentConfig.name}</p>
                  </div>
                )}
              </div>

              {agentConfig.objective && (
                <div className="mt-4">
                  <span className="text-sm" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>Objective</span>
                  <p className="font-medium" style={{ color: 'rgb(229, 227, 220)' }}>{agentConfig.objective}</p>
                </div>
              )}
            </div>
          )}

          {/* Skills Detection */}
          {detectedSkills.length > 0 && (
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold" style={{ color: 'rgb(229, 227, 220)' }}>
                    Detected Skills
                  </h2>
                  <span
                    className="px-3 py-1 rounded-full text-sm font-medium animate-pulse"
                    style={{
                      backgroundColor: 'rgba(34, 197, 94, 0.2)',
                      color: 'rgb(34, 197, 94)'
                    }}
                  >
                    {detectedSkills.length} Skills Activated
                  </span>
                </div>
                <button
                  onClick={() => setShowSkillsBreakdown(true)}
                  className="text-sm px-3 py-1 rounded-lg transition hover:opacity-80"
                  style={{
                    backgroundColor: 'rgba(169, 189, 203, 0.1)',
                    color: 'rgba(169, 189, 203, 0.9)'
                  }}
                >
                  View All Skills
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {detectedSkills.slice(0, showAllSkills ? detectedSkills.length : 12).map((skill, index) => (
                  <div
                    key={index}
                    className="px-3 py-1.5 rounded-lg text-sm animate-pulse"
                    style={{
                      backgroundColor: 'rgba(169, 189, 203, 0.1)',
                      color: 'rgb(169, 189, 203)',
                      animationDelay: `${index * 50}ms`
                    }}
                  >
                    {skill}
                  </div>
                ))}
                {detectedSkills.length > 12 && !showAllSkills && (
                  <button
                    onClick={() => setShowAllSkills(true)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium"
                    style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      color: 'rgb(59, 130, 246)'
                    }}
                  >
                    +{detectedSkills.length - 12} more skills
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Integrations Selection */}
          {currentStep >= 4 && (
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
                Available Integrations
              </h2>
              <div className="grid grid-cols-5 gap-3">
                {INTEGRATIONS.map((integration) => (
                  <button
                    key={integration.id}
                    onClick={() => {
                      setSelectedIntegrations(prev =>
                        prev.includes(integration.id)
                          ? prev.filter(id => id !== integration.id)
                          : [...prev, integration.id]
                      );
                    }}
                    className={`p-3 rounded-lg border transition ${
                      selectedIntegrations.includes(integration.id)
                        ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="text-2xl mb-1">{integration.icon}</div>
                    <div className="text-xs" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
                      {integration.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {currentStep >= 6 && (
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex gap-4">
                <button
                  onClick={() => setPreviewMode(true)}
                  className="flex-1 py-3 rounded-lg font-semibold transition hover:opacity-80"
                  style={{
                    backgroundColor: 'rgb(59, 130, 246)',
                    color: 'white'
                  }}
                >
                  View Agent Dashboard
                </button>
                <button
                  className="flex-1 py-3 rounded-lg font-semibold transition hover:opacity-80"
                  style={{
                    backgroundColor: 'rgba(169, 189, 203, 0.1)',
                    color: 'rgb(229, 227, 220)',
                    border: '1px solid rgba(169, 189, 203, 0.3)'
                  }}
                >
                  Deploy Agent - ${agentConfig.estimatedPrice}/mo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right side - Compact Chat */}
        <div className="w-96 bg-gray-800 rounded-xl flex flex-col shadow-lg">
          <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
            <div className="flex items-center gap-2">
              <ChatBubbleLeftIcon className="h-5 w-5" style={{ color: 'rgb(59, 130, 246)' }} />
              <h3 className="font-semibold" style={{ color: 'rgb(229, 227, 220)' }}>
                Agent Builder Assistant
              </h3>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700'
                  }`}
                  style={{
                    color: message.sender === 'user' ? 'white' : 'rgb(229, 227, 220)'
                  }}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-700 px-3 py-2 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={currentStep === 4 ? "Type additional integrations or press Enter" : "Type your response..."}
                className="flex-1 px-3 py-2 bg-gray-700 rounded-lg text-sm outline-none"
                style={{
                  color: 'rgb(229, 227, 220)',
                  borderColor: 'rgba(169, 189, 203, 0.3)'
                }}
              />
              <button
                onClick={handleSendMessage}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

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
  );
}