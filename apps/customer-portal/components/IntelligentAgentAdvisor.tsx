'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  PaperAirplaneIcon,
  SparklesIcon,
  LightBulbIcon,
  ChartBarIcon,
  CurrencyPoundIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  recommendations?: string[];
  analysis?: {
    businessType?: string;
    teamSize?: string;
    painPoints?: string[];
    goals?: string[];
    budget?: string;
  };
}

interface ConversationState {
  stage: 'greeting' | 'discovery' | 'analysis' | 'recommendation' | 'customization' | 'closing';
  businessProfile: {
    type?: string;
    industry?: string;
    size?: string;
    challenges?: string[];
    currentTools?: string[];
    goals?: string[];
    budget?: string;
    timeline?: string;
  };
  recommendedSkills: string[];
  recommendedFeatures: string[];
  recommendedIntegrations: string[];
  estimatedROI?: number;
  monthlyPrice?: number;
}

interface IntelligentAgentAdvisorProps {
  onConfigUpdate: (config: any) => void;
  height?: string;
}

export default function IntelligentAgentAdvisor({
  onConfigUpdate,
  height = '450px'
}: IntelligentAgentAdvisorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your AI Solutions Advisor. I'm here to help you build the perfect AI agent for your business. To create the most valuable solution for you, I'd like to understand your business better. What type of business do you run?",
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationState, setConversationState] = useState<ConversationState>({
    stage: 'greeting',
    businessProfile: {},
    recommendedSkills: [],
    recommendedFeatures: [],
    recommendedIntegrations: []
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    // Only scroll in the chat window, not the entire page
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Intelligent response generation based on conversation stage
  const generateIntelligentResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    switch (conversationState.stage) {
      case 'greeting':
        // Analyze business type
        if (lowerMessage.includes('consulting') || lowerMessage.includes('consultant')) {
          updateBusinessProfile({ type: 'consulting', industry: 'professional services' });
          setConversationState(prev => ({ ...prev, stage: 'discovery' }));
          return `Consulting firm - understood. As a solo consultant, you're managing everything from client work to business development. What are your top 2-3 pain points: admin tasks, scaling challenges, client communication, lead generation, or something else?`;
        } else if (lowerMessage.includes('agency') || lowerMessage.includes('marketing')) {
          updateBusinessProfile({ type: 'agency', industry: 'marketing' });
          setConversationState(prev => ({ ...prev, stage: 'discovery' }));
          return `Marketing agency - understood. Running solo means you're managing client work, business development, and operations. What are your top 2-3 pain points: client reporting, project management, lead generation, content creation, or something else?`;
        } else if (lowerMessage.includes('saas') || lowerMessage.includes('software')) {
          updateBusinessProfile({ type: 'saas', industry: 'technology' });
          setConversationState(prev => ({ ...prev, stage: 'discovery' }));
          return `A SaaS business - great! Are you looking to automate customer support, improve onboarding, or enhance your product with AI features?`;
        }
        return `Interesting! Tell me more about your ${userMessage} business. What services or products do you offer, and what does a typical day look like for you?`;

      case 'discovery':
        // Analyze pain points and challenges
        const painPoints: string[] = [];
        const recommendations: string[] = [];

        if (lowerMessage.includes('admin') || lowerMessage.includes('paperwork') || lowerMessage.includes('repetitive')) {
          painPoints.push('administrative_burden');
          recommendations.push('document_automation', 'invoice_generator', 'contract_manager');
        }
        if (lowerMessage.includes('client') || lowerMessage.includes('customer') || lowerMessage.includes('communication')) {
          painPoints.push('client_management');
          recommendations.push('crm_integration', 'email_automation', 'chatbot_support');
        }
        if (lowerMessage.includes('scale') || lowerMessage.includes('grow') || lowerMessage.includes('capacity')) {
          painPoints.push('scaling_challenges');
          recommendations.push('workflow_automation', 'task_delegation', 'ai_assistant');
        }
        if (lowerMessage.includes('sales') || lowerMessage.includes('leads') || lowerMessage.includes('acquisition')) {
          painPoints.push('sales_pipeline');
          recommendations.push('lead_scoring', 'sales_automation', 'outreach_campaigns');
        }
        if (lowerMessage.includes('report') || lowerMessage.includes('analytics') || lowerMessage.includes('insights')) {
          painPoints.push('reporting');
          recommendations.push('analytics_dashboard', 'report_generator', 'data_visualization');
        }
        if (lowerMessage.includes('management') || lowerMessage.includes('managing')) {
          painPoints.push('management');
          recommendations.push('project_tracker', 'task_automation', 'team_collaboration');
        }
        if (lowerMessage.includes('finding') || lowerMessage.includes('new customers') || lowerMessage.includes('new clients')) {
          painPoints.push('sales_pipeline');
          recommendations.push('lead_generation', 'sales_automation', 'outreach_campaigns');
        }

        updateBusinessProfile({ challenges: painPoints });
        setConversationState(prev => ({
          ...prev,
          stage: 'analysis',
          recommendedSkills: recommendations
        }));

        return `Based on your needs, I'll configure an agent that handles:\n\n${painPoints.includes('administrative_burden') ? '- Administrative automation (10+ hours/week saved)\n' : ''}${painPoints.includes('client_management') ? '- Client communication and support automation\n' : ''}${painPoints.includes('scaling_challenges') ? '- Scaling operations without hiring\n' : ''}${painPoints.includes('sales_pipeline') ? '- Lead generation and sales automation\n' : ''}${painPoints.includes('reporting') ? '- Automated reporting and analytics\n' : ''}\nWhat's your monthly budget for AI automation?\n- Starter (£299-500)\n- Professional (£500-1000)\n- Enterprise (£1000+)`;

      case 'analysis':
        // Budget analysis and recommendation building
        let budget = 'professional';
        let monthlyBudget = 750;

        if (lowerMessage.includes('starter') || lowerMessage.includes('299') || lowerMessage.includes('500') || lowerMessage.includes('400')) {
          budget = 'starter';
          monthlyBudget = 400;
        } else if (lowerMessage.includes('up to 1000') || lowerMessage.includes('up to £1000') || lowerMessage.includes('anything up to')) {
          budget = 'professional';
          monthlyBudget = 850;
        } else if (lowerMessage.includes('enterprise') || lowerMessage.includes('unlimited') || (lowerMessage.includes('1000') && !lowerMessage.includes('up to'))) {
          budget = 'enterprise';
          monthlyBudget = 1500;
        }

        updateBusinessProfile({ budget });
        setConversationState(prev => ({ ...prev, stage: 'recommendation', monthlyPrice: monthlyBudget }));

        // Generate specific recommendations based on budget and needs
        const generatedRecommendations = generateRecommendations(conversationState.businessProfile, budget);

        // Update the configuration
        onConfigUpdate({
          skills: generatedRecommendations.skills,
          features: generatedRecommendations.features,
          integrations: generatedRecommendations.integrations,
          price: monthlyBudget
        });

        const businessType = conversationState.businessProfile.type === 'agency' ? 'marketing agency' : conversationState.businessProfile.type || 'business';
        return `Based on your ${businessType} and ${budget} budget (£${monthlyBudget}/month), here's your optimized configuration:

Core Capabilities:
${generatedRecommendations.skills.slice(0, 5).map(skill => `• ${formatSkillName(skill)}`).join('\n')}

Advanced Features:
${generatedRecommendations.features.slice(0, 3).map(feature => `• ${formatFeatureName(feature)}`).join('\n')}

Integrations:
${generatedRecommendations.integrations.slice(0, 4).map(int => `• ${formatIntegrationName(int)}`).join('\n')}

Expected ROI:
• 15+ hours saved weekly
• 3x client capacity
• 40% faster delivery

Total: £${monthlyBudget}/month

Would you like to adjust any skills or shall I explain how these work together?`;

      case 'recommendation':
        // Handle feedback about price
        if (lowerMessage.includes('not up to') || lowerMessage.includes('too expensive') || lowerMessage.includes('too much')) {
          // Recalculate with lower budget
          const newBudget = conversationState.monthlyPrice && conversationState.monthlyPrice > 1000 ? 850 : 400;
          const newRecommendations = generateRecommendations(conversationState.businessProfile, newBudget > 500 ? 'professional' : 'starter');

          // Update configuration with new budget
          onConfigUpdate({
            skills: newRecommendations.skills.slice(0, 8),
            features: newRecommendations.features.slice(0, 2),
            integrations: newRecommendations.integrations.slice(0, 3),
            price: newBudget
          });

          setConversationState(prev => ({ ...prev, monthlyPrice: newBudget }));

          return `Adjusted to fit your budget (£${newBudget}/month):\n\nCore Skills:\n${newRecommendations.skills.slice(0, 8).map(s => `• ${formatSkillName(s)}`).join('\n')}\n\nThis optimized package still delivers strong ROI while staying within budget. Ready to proceed?`;
        }

        // Handle customization requests
        if (lowerMessage.includes('explain') || lowerMessage.includes('how') || lowerMessage.includes('tell me more')) {
          return `Here's how these components work together:

**Client Acquisition System:**
The AI agent automatically identifies and qualifies leads from multiple sources, creates personalized outreach campaigns, and manages follow-ups. You just review and approve high-quality opportunities.

**Project Management Automation:**
Automatically creates project plans from client requirements, tracks progress, sends updates, and flags risks. Your AI handles all the coordination while you focus on strategic work.

**Knowledge Management:**
Your AI learns from every project, building a searchable knowledge base. It can instantly answer client questions, generate proposals based on past work, and suggest solutions from your experience.

**Financial Operations:**
Automated invoicing, expense tracking, and financial reporting. The AI even sends payment reminders and can forecast cash flow based on your pipeline.

**24/7 Client Support:**
Your clients get instant, intelligent responses any time. The AI handles routine questions, schedules meetings, and escalates complex issues to you with full context.

Would you like to add any specific capabilities or shall we proceed with this configuration?`;
        }

        if (lowerMessage.includes('yes') || lowerMessage.includes('proceed') || lowerMessage.includes('looks good') || lowerMessage.includes('perfect')) {
          setConversationState(prev => ({ ...prev, stage: 'closing' }));
          return `Excellent! I've configured your AI agent with all these capabilities.

**Next Steps:**
1. Review the configuration in the builder interface
2. Customize any skills or integrations as needed
3. Click "Preview Dashboard" to see your AI agent in action
4. When ready, click "Deploy Agent" to get started

Your AI agent will be ready to transform your consulting business immediately. The system will learn and adapt to your specific needs over the first few days.

Is there anything else you'd like to adjust before we finalize?`;
        }

        // Handle specific feature requests
        return `I can definitely help with that. What specific capability would you like to add or modify?`;

      case 'closing':
        return `Great question! ${userMessage}. Your configuration has been saved and you can modify it anytime in the builder. Feel free to ask me anything else about optimizing your AI agent!`;

      default:
        return `Interesting point about ${userMessage}. Let me help you configure the best solution for that.`;
    }
  };

  const updateBusinessProfile = (updates: Partial<ConversationState['businessProfile']>) => {
    setConversationState(prev => ({
      ...prev,
      businessProfile: { ...prev.businessProfile, ...updates }
    }));
  };

  const generateRecommendations = (profile: ConversationState['businessProfile'], budgetTier: string) => {
    const skills: string[] = [];
    const features: string[] = [];
    const integrations: string[] = [];

    // Core skills for marketing agency
    if (profile.type === 'agency' || profile.type === 'marketing') {
      skills.push(
        'campaign_management',
        'content_generator',
        'social_media_automation',
        'client_reporting',
        'lead_generation',
        'email_marketing',
        'seo_optimization',
        'analytics_dashboard',
        'proposal_generator',
        'project_tracker'
      );

      if (budgetTier === 'professional' || budgetTier === 'enterprise') {
        skills.push(
          'competitive_analysis',
          'market_research',
          'brand_monitoring',
          'influencer_outreach',
          'ad_optimization',
          'conversion_tracking'
        );
      }

      features.push('ai_chatbot', 'custom_workflows', 'api_access');
      if (budgetTier !== 'starter') {
        features.push('white_label', 'advanced_analytics');
      }

      integrations.push('google_ads', 'facebook_ads', 'mailchimp', 'hootsuite', 'canva');
      if (profile.challenges?.includes('reporting')) {
        integrations.push('google_analytics', 'data_studio');
      }
    }
    // Core skills for consulting
    else if (profile.type === 'consulting') {
      skills.push(
        'client_onboarding_automation',
        'proposal_generator',
        'project_tracker',
        'invoice_automation',
        'meeting_scheduler',
        'document_analyzer',
        'report_generator',
        'email_automation',
        'knowledge_base_builder',
        'task_prioritization'
      );

      if (budgetTier === 'professional' || budgetTier === 'enterprise') {
        skills.push(
          'lead_scoring',
          'sales_outreach',
          'contract_analysis',
          'risk_assessment',
          'competitive_analysis',
          'market_research',
          'content_generation'
        );
      }

      if (budgetTier === 'enterprise') {
        skills.push(
          'predictive_analytics',
          'resource_optimization',
          'strategic_planning',
          'financial_forecasting',
          'team_collaboration',
          'compliance_monitoring'
        );
      }

      features.push('ai_chatbot', 'voice_assistant', 'api_access', 'custom_workflows');
      if (budgetTier !== 'starter') {
        features.push('white_label', 'priority_support', 'advanced_analytics');
      }

      integrations.push('slack', 'microsoft_teams', 'google_workspace', 'zoom', 'calendly');
      if (profile.challenges?.includes('client_management')) {
        integrations.push('hubspot', 'salesforce', 'pipedrive');
      }
      if (profile.challenges?.includes('administrative_burden')) {
        integrations.push('quickbooks', 'xero', 'stripe');
      }
    }

    // Default skills if no specific profile matched
    if (skills.length === 0) {
      skills.push(
        'task_automation',
        'email_automation',
        'document_analyzer',
        'report_generator',
        'workflow_automation'
      );
      features.push('ai_chatbot', 'api_access');
      integrations.push('slack', 'google_workspace', 'zoom');
    }

    return { skills, features, integrations };
  };

  const formatSkillName = (skill: string): string => {
    return skill.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatFeatureName = (feature: string): string => {
    return feature.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatIntegrationName = (integration: string): string => {
    const names: Record<string, string> = {
      'slack': 'Slack',
      'microsoft_teams': 'Microsoft Teams',
      'google_workspace': 'Google Workspace',
      'zoom': 'Zoom',
      'calendly': 'Calendly',
      'hubspot': 'HubSpot',
      'salesforce': 'Salesforce',
      'pipedrive': 'Pipedrive',
      'quickbooks': 'QuickBooks',
      'xero': 'Xero',
      'stripe': 'Stripe'
    };
    return names[integration] || integration;
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Generate intelligent response
    setTimeout(() => {
      const response = generateIntelligentResponse(input);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col" style={{
      height,
      backgroundColor: 'rgba(48, 54, 54, 0.3)',
      border: '1px solid rgba(169, 189, 203, 0.15)',
      borderRadius: '0.75rem'
    }}>
      {/* Header */}
      <div
        className="px-4 py-3 border-b flex items-center justify-between"
        style={{
          borderColor: 'rgba(169, 189, 203, 0.1)',
          backgroundColor: 'rgba(58, 64, 64, 0.3)'
        }}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'rgba(169, 189, 203, 0.2)' }}>
            <SparklesIcon className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
          </div>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'rgb(229, 227, 220)' }}>
              AI Solutions Advisor
            </h3>
            <span className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
              Your intelligent configuration assistant
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {conversationState.stage !== 'greeting' && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{
              backgroundColor: 'rgba(169, 189, 203, 0.1)',
              color: 'rgba(169, 189, 203, 0.9)'
            }}>
              {conversationState.stage === 'discovery' && 'Analyzing needs...'}
              {conversationState.stage === 'analysis' && 'Building solution...'}
              {conversationState.stage === 'recommendation' && 'Solution ready'}
              {conversationState.stage === 'closing' && 'Configured'}
            </span>
          )}
          <span className="text-xs px-2 py-0.5 rounded-full" style={{
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            color: 'rgb(34, 197, 94)'
          }}>
            Online
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-4 py-3 rounded-lg text-sm ${
                message.sender === 'user' ? '' : ''
              }`}
              style={{
                backgroundColor: message.sender === 'user'
                  ? 'rgba(169, 189, 203, 0.2)'
                  : 'rgba(58, 64, 64, 0.5)',
                color: 'rgb(229, 227, 220)',
                border: message.sender === 'assistant'
                  ? '1px solid rgba(169, 189, 203, 0.15)'
                  : 'none',
                whiteSpace: 'pre-wrap'
              }}
            >
              {message.text}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div
              className="px-3 py-2 rounded-lg flex items-center gap-2"
              style={{
                backgroundColor: 'rgba(58, 64, 64, 0.5)',
                border: '1px solid rgba(169, 189, 203, 0.15)'
              }}
            >
              <span className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                Analyzing your requirements
              </span>
              <div className="flex gap-1">
                <div
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{
                    backgroundColor: 'rgba(169, 189, 203, 0.5)',
                    animationDelay: '0ms'
                  }}
                />
                <div
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{
                    backgroundColor: 'rgba(169, 189, 203, 0.5)',
                    animationDelay: '150ms'
                  }}
                />
                <div
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{
                    backgroundColor: 'rgba(169, 189, 203, 0.5)',
                    animationDelay: '300ms'
                  }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="p-3 border-t"
        style={{
          borderColor: 'rgba(169, 189, 203, 0.1)',
          backgroundColor: 'rgba(48, 54, 54, 0.3)'
        }}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
              conversationState.stage === 'greeting' ? "Describe your business..." :
              conversationState.stage === 'discovery' ? "Tell me about your challenges..." :
              conversationState.stage === 'analysis' ? "What's your budget range?" :
              "Ask me anything..."
            }
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: 'rgba(58, 64, 64, 0.5)',
              border: '1px solid rgba(169, 189, 203, 0.2)',
              color: 'rgb(229, 227, 220)'
            }}
          />
          <button
            onClick={handleSend}
            className="px-3 py-2 rounded-lg transition hover:opacity-80 flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(169, 189, 203, 0.2)',
              border: '1px solid rgba(169, 189, 203, 0.3)'
            }}
          >
            <PaperAirplaneIcon className="h-4 w-4" style={{ color: 'rgb(169, 189, 203)' }} />
          </button>
        </div>
      </div>
    </div>
  );
}