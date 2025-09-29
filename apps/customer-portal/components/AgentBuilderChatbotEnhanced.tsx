'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  PaperAirplaneIcon,
  SparklesIcon,
  XMarkIcon,
  MinusIcon,
  LightBulbIcon,
  QuestionMarkCircleIcon,
  CheckCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  suggestions?: string[];
  actionButtons?: ActionButton[];
}

interface ActionButton {
  label: string;
  action: string;
  data?: any;
}

interface AgentBuilderChatbotProps {
  onConfigUpdate?: (config: any) => void;
  agentContext?: any;
}

// Conversation flow states
enum ConversationState {
  INITIAL = 'initial',
  GATHERING_REQUIREMENTS = 'gathering',
  REFINING = 'refining',
  SUGGESTING = 'suggesting',
  COMPLETE = 'complete'
}

// Question templates for different stages
const QUESTION_TEMPLATES = {
  initial: [
    "Tell me about your business and what challenges you're looking to solve with AI.",
    "What's your main goal for implementing an AI agent?",
    "Describe your ideal AI assistant - what would it do for you?"
  ],
  industry: [
    "What industry does your business operate in?",
    "What's your primary business model (B2B, B2C, SaaS, etc.)?",
    "How large is your team?"
  ],
  workflow: [
    "What are your most time-consuming daily tasks?",
    "Which processes would you like to automate first?",
    "How do you currently handle {process}?"
  ],
  integrations: [
    "What tools and platforms do you currently use?",
    "Do you use any CRM systems like Salesforce or HubSpot?",
    "How do you manage your customer communications?"
  ],
  refinement: [
    "Would you like your agent to handle {task} as well?",
    "How important is {feature} for your workflow?",
    "Should the agent integrate with {platform}?"
  ]
};

export default function AgentBuilderChatbotEnhanced({ onConfigUpdate, agentContext }: AgentBuilderChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversationState, setConversationState] = useState<ConversationState>(ConversationState.INITIAL);
  const [userProfile, setUserProfile] = useState<any>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        text: "👋 Hi! I'm your AI Agent Builder assistant. I'll help you design the perfect AI solution for your business through a quick conversation. Let's start!",
        sender: 'assistant',
        timestamp: new Date(),
        suggestions: [
          "I need help with sales",
          "Customer support automation",
          "Data analysis and reporting",
          "General workflow automation"
        ]
      }]);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Comprehensive analysis function
  const analyzeUserInput = async (text: string, context: any = {}) => {
    const lower = text.toLowerCase();
    const config: any = {
      agentType: 'general',
      skills: [],
      integrations: [],
      features: [],
      suggestions: []
    };

    // Industry detection
    const industries = {
      'ecommerce': ['shop', 'store', 'product', 'inventory', 'order', 'shipping'],
      'saas': ['software', 'subscription', 'platform', 'users', 'accounts'],
      'healthcare': ['patient', 'medical', 'health', 'clinic', 'doctor'],
      'finance': ['financial', 'banking', 'investment', 'accounting', 'invoice'],
      'education': ['student', 'course', 'training', 'learning', 'education'],
      'realestate': ['property', 'real estate', 'listing', 'tenant', 'rental'],
      'manufacturing': ['production', 'manufacturing', 'supply chain', 'inventory'],
      'retail': ['retail', 'pos', 'store', 'customer', 'sales'],
      'construction': ['construction', 'project', 'contractor', 'building', 'site']
    };

    let detectedIndustry = null;
    for (const [industry, keywords] of Object.entries(industries)) {
      if (keywords.some(keyword => lower.includes(keyword))) {
        detectedIndustry = industry;
        break;
      }
    }

    // Enhanced agent type detection with context
    const agentTypePatterns = {
      sales: {
        keywords: ['sales', 'lead', 'prospect', 'outreach', 'pipeline', 'deal', 'revenue', 'quota'],
        skills: ['Lead Generation', 'Email Outreach', 'CRM Sync', 'Pipeline Management', 'Lead Scoring',
                 'Contact Management', 'Deal Tracking', 'Sales Forecasting', 'Quote Generation'],
        suggestedIntegrations: ['salesforce', 'hubspot', 'pipedrive'],
        suggestedFeatures: ['ai_chatbot', 'voice_assistant']
      },
      support: {
        keywords: ['support', 'customer', 'help', 'ticket', 'issue', 'complaint', 'service'],
        skills: ['Ticket Management', 'Auto Response', 'Knowledge Base', 'Chat Support', 'FAQ Builder',
                 'Customer Portal', 'SLA Management', 'Satisfaction Surveys'],
        suggestedIntegrations: ['zendesk', 'intercom', 'freshdesk'],
        suggestedFeatures: ['ai_chatbot', 'multi_language']
      },
      marketing: {
        keywords: ['marketing', 'campaign', 'social', 'content', 'brand', 'seo', 'advertising'],
        skills: ['Content Creation', 'Social Media', 'Email Campaigns', 'Analytics', 'SEO Optimization',
                 'Landing Page Builder', 'A/B Testing', 'Campaign Tracking'],
        suggestedIntegrations: ['mailchimp', 'hubspot', 'google_analytics'],
        suggestedFeatures: ['multi_language', 'white_label']
      },
      data: {
        keywords: ['data', 'analytics', 'report', 'insight', 'metrics', 'dashboard', 'visualization'],
        skills: ['Data Collection', 'Data Visualization', 'Predictive Analytics', 'Reporting',
                 'Statistical Analysis', 'Real-time Analytics', 'Business Intelligence'],
        suggestedIntegrations: ['google_analytics', 'tableau', 'segment'],
        suggestedFeatures: ['multi_language']
      },
      operations: {
        keywords: ['operations', 'workflow', 'process', 'automation', 'efficiency', 'task', 'manage'],
        skills: ['Workflow Automation', 'Process Optimization', 'Task Management', 'Resource Planning',
                 'Document Management', 'Project Coordination', 'Performance Monitoring'],
        suggestedIntegrations: ['jira', 'asana', 'monday'],
        suggestedFeatures: ['voice_assistant', 'white_label']
      }
    };

    // Detect primary agent type
    let bestMatch = { type: 'general', score: 0, data: null };
    for (const [type, pattern] of Object.entries(agentTypePatterns)) {
      const score = pattern.keywords.filter(keyword => lower.includes(keyword)).length;
      if (score > bestMatch.score) {
        bestMatch = { type, score, data: pattern };
      }
    }

    if (bestMatch.data) {
      config.agentType = bestMatch.type;
      config.skills = bestMatch.data.skills;
      config.suggestions = bestMatch.data.suggestedIntegrations;

      // Auto-suggest features based on context
      if (detectedIndustry === 'ecommerce' || detectedIndustry === 'retail') {
        config.features.push('ai_chatbot');
      }
      if (detectedIndustry === 'saas' || detectedIndustry === 'finance') {
        config.features.push('white_label');
      }
    }

    // Specific integration detection
    const integrationPatterns = {
      'salesforce': ['salesforce', 'sfdc'],
      'hubspot': ['hubspot'],
      'slack': ['slack'],
      'teams': ['teams', 'microsoft teams'],
      'gmail': ['gmail', 'google mail', 'email'],
      'outlook': ['outlook', 'office 365'],
      'shopify': ['shopify', 'ecommerce', 'online store'],
      'stripe': ['stripe', 'payment', 'billing'],
      'quickbooks': ['quickbooks', 'accounting'],
      'zendesk': ['zendesk'],
      'jira': ['jira', 'atlassian'],
      'github': ['github', 'git', 'repository']
    };

    for (const [integration, patterns] of Object.entries(integrationPatterns)) {
      if (patterns.some(pattern => lower.includes(pattern))) {
        config.integrations.push(integration);
      }
    }

    // Feature detection
    if (lower.includes('voice') || lower.includes('speech')) {
      config.features.push('voice_assistant');
    }
    if (lower.includes('language') || lower.includes('translation') || lower.includes('international')) {
      config.features.push('multi_language');
    }
    if (lower.includes('brand') || lower.includes('white label') || lower.includes('custom')) {
      config.features.push('white_label');
    }

    // Add industry-specific suggestions
    if (detectedIndustry) {
      config.industry = detectedIndustry;
      config.suggestions.push(`Optimize for ${detectedIndustry} workflows`);
    }

    return config;
  };

  // Generate intelligent response based on analysis
  const generateIntelligentResponse = (config: any, userInput: string): string => {
    const agentTypeNames: { [key: string]: string } = {
      sales: 'Sales Outreach Agent',
      support: 'Customer Support Agent',
      marketing: 'Marketing Automation Agent',
      operations: 'Operations Management Agent',
      data: 'Data Analytics Agent',
      general: 'Custom AI Agent'
    };

    let response = `Excellent! Based on your requirements, I'm building a **${agentTypeNames[config.agentType]}** `;

    if (config.industry) {
      response += `optimized for the ${config.industry} industry. `;
    }

    response += `\n\n📊 **Here's what I've configured:**\n`;

    if (config.skills.length > 0) {
      response += `\n✅ **Core Capabilities:** ${config.skills.slice(0, 5).join(', ')}`;
      if (config.skills.length > 5) {
        response += ` (+ ${config.skills.length - 5} more)`;
      }
    }

    if (config.integrations.length > 0) {
      response += `\n\n🔗 **Integrations:** ${config.integrations.map(i => i.charAt(0).toUpperCase() + i.slice(1)).join(', ')}`;
    }

    if (config.features.length > 0) {
      const featureNames: { [key: string]: string } = {
        'ai_chatbot': 'AI-Powered Chatbot',
        'voice_assistant': 'Voice Commands',
        'multi_language': 'Multi-Language Support',
        'white_label': 'White Label Branding'
      };
      response += `\n\n✨ **Premium Features:** ${config.features.map(f => featureNames[f] || f).join(', ')}`;
    }

    response += '\n\nYou can customize this further using the controls on the right, or tell me more about your specific needs!';

    return response;
  };

  // Handle sending messages
  const handleSend = async () => {
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

    // Analyze the input
    const config = await analyzeUserInput(input, userProfile);

    // Update user profile
    setUserProfile(prev => ({ ...prev, ...config }));

    // Update parent component
    if (onConfigUpdate) {
      onConfigUpdate(config);
    }

    // Generate response
    setTimeout(() => {
      const responseText = generateIntelligentResponse(config, input);

      // Determine next suggestions based on state
      let suggestions: string[] = [];
      if (conversationState === ConversationState.INITIAL) {
        suggestions = [
          "Add more integrations",
          "Show me pricing details",
          "I need custom features",
          "Preview my dashboard"
        ];
        setConversationState(ConversationState.GATHERING_REQUIREMENTS);
      } else if (conversationState === ConversationState.GATHERING_REQUIREMENTS) {
        suggestions = [
          "Add team collaboration",
          "Include reporting features",
          "I need API access",
          "That's perfect, continue"
        ];
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'assistant',
        timestamp: new Date(),
        suggestions,
        actionButtons: [
          { label: '👀 Preview Dashboard', action: 'preview' },
          { label: '💡 Get Recommendations', action: 'recommend' }
        ]
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    handleSend();
  };

  // Handle action button click
  const handleActionClick = (action: string) => {
    if (action === 'preview') {
      // Trigger preview mode
      if (onConfigUpdate) {
        onConfigUpdate({ showPreview: true });
      }
    } else if (action === 'recommend') {
      // Show recommendations
      const recommendationMessage: Message = {
        id: Date.now().toString(),
        text: "Based on your profile, here are my top recommendations:\n\n1. **Enable AI Chatbot** - Handle 70% of customer queries automatically\n2. **Add CRM Integration** - Sync all customer data seamlessly\n3. **Multi-Language Support** - Expand to international markets\n\nWould you like me to add any of these?",
        sender: 'assistant',
        timestamp: new Date(),
        suggestions: ["Add all recommendations", "Just the chatbot", "Tell me more", "Skip for now"]
      };
      setMessages(prev => [...prev, recommendationMessage]);
    }
  };

  if (isMinimized) {
    return (
      <div
        className="fixed bottom-4 right-4 w-80 bg-gray-800 rounded-t-xl shadow-2xl cursor-pointer animate-pulse"
        onClick={() => setIsMinimized(false)}
        style={{ borderColor: 'rgba(169, 189, 203, 0.2)' }}
      >
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
            <h3 className="font-semibold text-sm" style={{ color: 'rgb(229, 227, 220)' }}>
              AI Assistant
            </h3>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full animate-pulse" style={{
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            color: 'rgb(34, 197, 94)'
          }}>
            {isTyping ? 'Typing...' : 'Online'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-gray-800 rounded-xl shadow-2xl flex flex-col" style={{
      borderColor: 'rgba(169, 189, 203, 0.2)',
      border: '1px solid rgba(169, 189, 203, 0.2)'
    }}>
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
          <h3 className="font-semibold text-sm" style={{ color: 'rgb(229, 227, 220)' }}>
            AI Agent Builder Assistant
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 rounded hover:bg-gray-700 transition"
          >
            <MinusIcon className="h-4 w-4" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
          </button>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="px-4 py-2 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
        <div className="flex items-center justify-between text-xs" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
          <span>Configuration Progress</span>
          <span>{Math.round((Object.keys(userProfile).length / 5) * 100)}%</span>
        </div>
        <div className="mt-1 h-1 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${Math.round((Object.keys(userProfile).length / 5) * 100)}%` }}
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div key={message.id}>
            <div
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : ''
                }`}
                style={{
                  backgroundColor: message.sender === 'assistant' ? 'rgba(169, 189, 203, 0.1)' : undefined,
                  color: message.sender === 'assistant' ? 'rgb(229, 227, 220)' : undefined,
                  borderLeft: message.sender === 'assistant' ? '3px solid rgb(169, 189, 203)' : undefined
                }}
              >
                <div style={{ whiteSpace: 'pre-wrap' }}>{message.text}</div>
              </div>
            </div>

            {/* Suggestions */}
            {message.suggestions && message.suggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2 px-2">
                {message.suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-3 py-1 text-xs rounded-full border hover:bg-gray-700 transition"
                    style={{
                      borderColor: 'rgba(169, 189, 203, 0.3)',
                      color: 'rgba(229, 227, 220, 0.9)'
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            {message.actionButtons && message.actionButtons.length > 0 && (
              <div className="mt-2 flex gap-2 px-2">
                {message.actionButtons.map((button, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleActionClick(button.action)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 transition"
                  >
                    {button.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-lg" style={{
              backgroundColor: 'rgba(169, 189, 203, 0.1)'
            }}>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Describe your needs..."
            className="flex-1 px-3 py-2 bg-gray-700 rounded-lg text-sm outline-none"
            style={{
              color: 'rgb(229, 227, 220)',
              borderColor: 'rgba(169, 189, 203, 0.3)'
            }}
          />
          <button
            onClick={handleSend}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-center gap-4 text-xs" style={{ color: 'rgba(169, 189, 203, 0.5)' }}>
          <button className="hover:text-blue-400 transition flex items-center gap-1">
            <QuestionMarkCircleIcon className="h-3 w-3" />
            Help
          </button>
          <span>•</span>
          <span>Powered by Intelagent AI</span>
        </div>
      </div>
    </div>
  );
}