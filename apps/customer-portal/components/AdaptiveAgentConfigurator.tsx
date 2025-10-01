'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  PaperAirplaneIcon,
  SparklesIcon,
  DocumentIcon,
  ArrowUpTrayIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  attachments?: string[];
}

interface BusinessContext {
  industry?: string;
  size?: string;
  role?: string;
  currentTools?: string[];
  painPoints?: string[];
  goals?: string[];
  budget?: string;
  timeline?: string;
  processes?: string[];
  techStack?: string[];
  customers?: string;
  revenue?: string;
  dataVolume?: string;
  compliance?: string[];
  integrationNeeds?: string[];
}

interface AdaptiveAgentConfiguratorProps {
  onConfigUpdate: (config: any) => void;
  height?: string;
}

export default function AdaptiveAgentConfigurator({
  onConfigUpdate,
  height = '450px'
}: AdaptiveAgentConfiguratorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "I'm your AI configuration assistant. I'll help you build the perfect agent by learning about your business needs. You can describe your requirements, upload documents, or answer my questions - I'll continuously refine your agent configuration based on what you share. What brings you here today?",
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [businessContext, setBusinessContext] = useState<BusinessContext>({});
  const [questionHistory, setQuestionHistory] = useState<string[]>([]);
  const [currentConfiguration, setCurrentConfiguration] = useState({
    skills: [] as string[],
    features: [] as string[],
    integrations: [] as string[]
  });
  const [previousConfiguration, setPreviousConfiguration] = useState({
    skills: [] as string[],
    features: [] as string[],
    integrations: [] as string[]
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Intelligent configuration builder
  const buildConfiguration = (context: BusinessContext) => {
    const skills = new Set<string>();
    const features = new Set<string>();
    const integrations = new Set<string>();

    // Industry-specific skills
    if (context.industry) {
      const industryLower = context.industry.toLowerCase();

      if (industryLower.includes('marketing') || industryLower.includes('agency')) {
        skills.add('campaign_management');
        skills.add('content_generator');
        skills.add('social_media_automation');
        skills.add('brand_monitoring');
        integrations.add('google_ads');
        integrations.add('facebook_ads');
        integrations.add('hootsuite');
      }

      if (industryLower.includes('consulting') || industryLower.includes('professional services')) {
        skills.add('proposal_generator');
        skills.add('project_tracker');
        skills.add('client_onboarding');
        skills.add('invoice_automation');
        integrations.add('calendly');
        integrations.add('docusign');
      }

      if (industryLower.includes('saas') || industryLower.includes('software')) {
        skills.add('customer_support_automation');
        skills.add('user_onboarding');
        skills.add('bug_tracking');
        skills.add('feature_request_management');
        integrations.add('intercom');
        integrations.add('jira');
        integrations.add('github');
      }

      if (industryLower.includes('ecommerce') || industryLower.includes('retail')) {
        skills.add('inventory_management');
        skills.add('order_processing');
        skills.add('customer_service_bot');
        skills.add('review_management');
        integrations.add('shopify');
        integrations.add('stripe');
        integrations.add('mailchimp');
      }

      if (industryLower.includes('finance') || industryLower.includes('accounting')) {
        skills.add('financial_reporting');
        skills.add('expense_tracking');
        skills.add('audit_automation');
        skills.add('compliance_monitoring');
        features.add('advanced_security');
        integrations.add('quickbooks');
        integrations.add('xero');
      }
    }

    // Size-based configurations
    if (context.size) {
      const sizeLower = context.size.toLowerCase();

      if (sizeLower.includes('solo') || sizeLower.includes('one') || sizeLower.includes('1')) {
        skills.add('task_prioritization');
        skills.add('time_tracking');
        skills.add('personal_assistant');
        features.add('mobile_app');
      }

      if (sizeLower.includes('small') || sizeLower.includes('2-10')) {
        skills.add('team_collaboration');
        skills.add('resource_allocation');
        features.add('role_based_access');
      }

      if (sizeLower.includes('medium') || sizeLower.includes('large') || sizeLower.includes('enterprise')) {
        skills.add('workflow_orchestration');
        skills.add('department_coordination');
        features.add('sla_guarantee');
        features.add('dedicated_instance');
        features.add('white_label');
      }
    }

    // Pain point based skills (including specific skill mentions)
    if (context.painPoints && context.painPoints.length > 0) {
      context.painPoints.forEach(pain => {
        const painLower = pain.toLowerCase();

        // Direct skill mentions
        if (painLower.includes('lead_gen') || painLower.includes('leads')) {
          skills.add('lead_generation');
          skills.add('lead_scoring');
          skills.add('lead_nurturing');
        }

        if (painLower.includes('customer_support') || painLower.includes('support_automation')) {
          skills.add('customer_support_automation');
          skills.add('ticket_management');
          skills.add('faq_automation');
        }

        if (painLower.includes('email_automation') || painLower.includes('email_marketing')) {
          skills.add('email_automation');
          skills.add('email_campaigns');
          skills.add('email_templates');
        }

        if (painLower.includes('social_media') || painLower.includes('social_automation')) {
          skills.add('social_media_automation');
          skills.add('social_posting');
          skills.add('social_monitoring');
        }

        if (painLower.includes('content_creation') || painLower.includes('content_generation')) {
          skills.add('content_generator');
          skills.add('blog_writer');
          skills.add('copywriting');
        }

        if (painLower.includes('invoice') || painLower.includes('billing')) {
          skills.add('invoice_automation');
          skills.add('payment_processing');
          skills.add('billing_management');
        }

        if (painLower.includes('project_management') || painLower.includes('task_management')) {
          skills.add('project_tracker');
          skills.add('task_automation');
          skills.add('milestone_tracking');
        }

        if (painLower.includes('workflow') || painLower.includes('workflows')) {
          skills.add('workflow_automation');
          skills.add('process_optimization');
          skills.add('approval_workflows');
        }

        if (painLower.includes('chatbot') || painLower.includes('chat_automation')) {
          skills.add('ai_chatbot');
          skills.add('conversational_ai');
          features.add('ai_chatbot');
        }

        if (painLower.includes('document_processing') || painLower.includes('document_automation')) {
          skills.add('document_analyzer');
          skills.add('document_generation');
          skills.add('ocr_processing');
        }

        // Original pain point mappings
        if (painLower.includes('time') || painLower.includes('efficiency')) {
          skills.add('process_automation');
          skills.add('batch_processing');
        }

        if (painLower.includes('scale') || painLower.includes('growth')) {
          skills.add('auto_scaling');
          skills.add('load_balancing');
          features.add('unlimited_usage');
        }

        if (painLower.includes('data') || painLower.includes('analytics') || painLower.includes('reporting')) {
          skills.add('data_visualization');
          skills.add('predictive_analytics');
          skills.add('report_generator');
          features.add('advanced_analytics');
        }

        if (painLower.includes('customer') || painLower.includes('client')) {
          skills.add('customer_insights');
          skills.add('satisfaction_tracking');
          skills.add('proactive_support');
          features.add('ai_chatbot');
        }

        if (painLower.includes('cost') || painLower.includes('budget')) {
          skills.add('cost_optimization');
          skills.add('resource_efficiency');
        }

        if (painLower.includes('quality') || painLower.includes('error')) {
          skills.add('quality_assurance');
          skills.add('error_detection');
          features.add('audit_logs');
        }

        if (painLower.includes('communication')) {
          skills.add('multichannel_communication');
          skills.add('notification_management');
          integrations.add('slack');
          integrations.add('microsoft_teams');
        }

        if (painLower.includes('sales') || painLower.includes('revenue')) {
          skills.add('lead_scoring');
          skills.add('sales_forecasting');
          skills.add('pipeline_management');
          integrations.add('salesforce');
          integrations.add('hubspot');
        }

        if (painLower.includes('compliance') || painLower.includes('regulation')) {
          skills.add('compliance_automation');
          skills.add('audit_trail');
          features.add('advanced_security');
        }
      });
    }

    // Goal-based features
    if (context.goals && context.goals.length > 0) {
      context.goals.forEach(goal => {
        const goalLower = goal.toLowerCase();

        if (goalLower.includes('automate')) {
          skills.add('workflow_automation');
          skills.add('trigger_based_actions');
          features.add('custom_workflows');
        }

        if (goalLower.includes('integrate')) {
          features.add('api_access');
          features.add('webhooks');
        }

        if (goalLower.includes('expand') || goalLower.includes('international')) {
          features.add('multi_language');
          skills.add('localization');
        }

        if (goalLower.includes('innovate') || goalLower.includes('ai')) {
          skills.add('machine_learning');
          skills.add('natural_language_processing');
          features.add('custom_integrations');
        }
      });
    }

    // Current tools integration
    if (context.currentTools && context.currentTools.length > 0) {
      context.currentTools.forEach(tool => {
        const toolLower = tool.toLowerCase();

        // Add relevant integrations based on mentioned tools
        if (toolLower.includes('google')) integrations.add('google_workspace');
        if (toolLower.includes('microsoft') || toolLower.includes('office')) integrations.add('microsoft_365');
        if (toolLower.includes('slack')) integrations.add('slack');
        if (toolLower.includes('zoom')) integrations.add('zoom');
        if (toolLower.includes('salesforce')) integrations.add('salesforce');
        if (toolLower.includes('hubspot')) integrations.add('hubspot');
        if (toolLower.includes('jira')) integrations.add('jira');
        if (toolLower.includes('asana')) integrations.add('asana');
        if (toolLower.includes('trello')) integrations.add('trello');
        if (toolLower.includes('notion')) integrations.add('notion');
      });
    }

    // Budget-based features
    if (context.budget) {
      const budgetLower = context.budget.toLowerCase();

      if (budgetLower.includes('enterprise') || budgetLower.includes('unlimited') || budgetLower.includes('1000')) {
        features.add('priority_support');
        features.add('dedicated_instance');
        features.add('sla_guarantee');
        skills.add('custom_skill_development');
      }
    }

    // Tech stack integrations
    if (context.techStack && context.techStack.length > 0) {
      context.techStack.forEach(tech => {
        const techLower = tech.toLowerCase();

        if (techLower.includes('aws')) integrations.add('aws');
        if (techLower.includes('azure')) integrations.add('azure');
        if (techLower.includes('google cloud')) integrations.add('gcp');
        if (techLower.includes('mongodb')) integrations.add('mongodb');
        if (techLower.includes('postgres')) integrations.add('postgresql');
        if (techLower.includes('redis')) integrations.add('redis');
      });
    }

    // Convert sets to arrays
    const finalConfig = {
      skills: Array.from(skills),
      features: Array.from(features),
      integrations: Array.from(integrations)
    };

    // Store previous configuration before updating
    setPreviousConfiguration(currentConfiguration);

    // Update current configuration
    setCurrentConfiguration(finalConfig);

    // Send update to parent
    onConfigUpdate(finalConfig);

    return finalConfig;
  };

  // Generate next intelligent question
  const generateNextQuestion = (context: BusinessContext, history: string[]): string => {
    // Questions in priority order
    const questionFlow = [
      {
        condition: !context.industry,
        question: "What industry or type of business are you in?"
      },
      {
        condition: !context.size,
        question: "How many people are in your organization?"
      },
      {
        condition: !context.painPoints || context.painPoints.length === 0,
        question: "What are your biggest operational challenges right now?"
      },
      {
        condition: !context.goals || context.goals.length === 0,
        question: "What are your main goals for implementing AI automation?"
      },
      {
        condition: !context.currentTools || context.currentTools.length === 0,
        question: "What tools and software do you currently use?"
      },
      {
        condition: !context.budget,
        question: "What's your monthly budget range for AI automation? (starter: £299-500, professional: £500-1000, enterprise: £1000+)"
      },
      {
        condition: !context.processes || context.processes.length === 0,
        question: "Which business processes take the most time or are most repetitive?"
      },
      {
        condition: !context.customers,
        question: "Who are your primary customers and how do you serve them?"
      },
      {
        condition: !context.dataVolume,
        question: "How much data do you typically handle? (documents, customer records, transactions)"
      },
      {
        condition: !context.compliance || context.compliance.length === 0,
        question: "Are there any compliance or regulatory requirements you need to meet?"
      },
      {
        condition: !context.timeline,
        question: "When do you need this solution implemented?"
      },
      {
        condition: !context.integrationNeeds || context.integrationNeeds.length === 0,
        question: "Are there specific systems you need to integrate with?"
      }
    ];

    // Find next unanswered question
    for (const item of questionFlow) {
      if (item.condition && !history.includes(item.question)) {
        return item.question;
      }
    }

    // If all basic questions answered, ask more specific ones based on context
    if (context.industry?.toLowerCase().includes('marketing')) {
      if (!history.includes("How many campaigns do you typically run per month?")) {
        return "How many campaigns do you typically run per month?";
      }
      if (!history.includes("What's your main channel for customer acquisition?")) {
        return "What's your main channel for customer acquisition?";
      }
    }

    if (context.industry?.toLowerCase().includes('consulting')) {
      if (!history.includes("How many clients do you typically manage simultaneously?")) {
        return "How many clients do you typically manage simultaneously?";
      }
      if (!history.includes("What's your average project duration?")) {
        return "What's your average project duration?";
      }
    }

    // Default follow-up
    return "Is there anything specific about your workflow or requirements I should know?";
  };

  // Analyze user message and extract context
  const analyzeMessage = (message: string): Partial<BusinessContext> => {
    const updates: Partial<BusinessContext> = {};
    const lowerMessage = message.toLowerCase();

    // Industry detection
    const industries = ['marketing', 'consulting', 'saas', 'software', 'ecommerce', 'retail',
                       'finance', 'healthcare', 'education', 'manufacturing', 'logistics',
                       'real estate', 'legal', 'nonprofit', 'agency'];

    for (const industry of industries) {
      if (lowerMessage.includes(industry)) {
        updates.industry = industry;
        break;
      }
    }

    // Size detection
    if (lowerMessage.includes('solo') || lowerMessage.includes('one person') ||
        lowerMessage.includes('just me') || lowerMessage.includes('1 person')) {
      updates.size = 'solo';
    } else if (lowerMessage.includes('small') || /\b[2-9]\b/.test(lowerMessage) ||
               lowerMessage.includes('few people')) {
      updates.size = 'small';
    } else if (lowerMessage.includes('medium') || /\b[1-9][0-9]\b/.test(lowerMessage)) {
      updates.size = 'medium';
    } else if (lowerMessage.includes('large') || lowerMessage.includes('enterprise') ||
               /\b[1-9][0-9]{2,}\b/.test(lowerMessage)) {
      updates.size = 'large';
    }

    // Pain points extraction
    const painKeywords = {
      'time': 'time management',
      'efficiency': 'operational efficiency',
      'scale': 'scaling challenges',
      'growth': 'growth limitations',
      'customer': 'customer management',
      'data': 'data management',
      'report': 'reporting burden',
      'manual': 'manual processes',
      'error': 'error prone processes',
      'communication': 'communication gaps',
      'cost': 'cost reduction',
      'quality': 'quality control',
      'compliance': 'compliance requirements',
      'integration': 'integration challenges'
    };

    const detectedPainPoints: string[] = [];
    for (const [keyword, painPoint] of Object.entries(painKeywords)) {
      if (lowerMessage.includes(keyword)) {
        detectedPainPoints.push(painPoint);
      }
    }
    if (detectedPainPoints.length > 0) {
      updates.painPoints = [...(updates.painPoints || []), ...detectedPainPoints];
    }

    // Check for specific skill mentions
    const skillMentions = [
      'lead generation', 'lead gen', 'leads',
      'customer support', 'support automation',
      'email automation', 'email marketing',
      'social media', 'social automation',
      'content creation', 'content generation',
      'analytics', 'reporting', 'reports',
      'invoicing', 'invoice', 'billing',
      'project management', 'task management',
      'crm', 'customer relationship',
      'sales automation', 'sales pipeline',
      'seo', 'search optimization',
      'data visualization', 'dashboards',
      'workflow automation', 'workflows',
      'chatbot', 'chat automation',
      'document processing', 'document automation'
    ];

    const mentionedSkills: string[] = [];
    for (const skill of skillMentions) {
      if (lowerMessage.includes(skill)) {
        mentionedSkills.push(skill.replace(/ /g, '_'));
      }
    }

    // Goals extraction
    const goalKeywords = {
      'automate': 'process automation',
      'save time': 'time savings',
      'reduce cost': 'cost reduction',
      'improve': 'quality improvement',
      'expand': 'business expansion',
      'scale': 'scalability',
      'integrate': 'system integration',
      'streamline': 'workflow optimization',
      'enhance': 'capability enhancement',
      'innovate': 'innovation'
    };

    const detectedGoals: string[] = [];
    for (const [keyword, goal] of Object.entries(goalKeywords)) {
      if (lowerMessage.includes(keyword)) {
        detectedGoals.push(goal);
      }
    }
    if (detectedGoals.length > 0) {
      updates.goals = [...(updates.goals || []), ...detectedGoals];
    }

    // Tools detection
    const tools = ['slack', 'teams', 'zoom', 'google', 'microsoft', 'office', 'salesforce',
                  'hubspot', 'jira', 'asana', 'trello', 'notion', 'airtable', 'monday',
                  'quickbooks', 'xero', 'stripe', 'paypal', 'shopify', 'wordpress'];

    const detectedTools: string[] = [];
    for (const tool of tools) {
      if (lowerMessage.includes(tool)) {
        detectedTools.push(tool);
      }
    }
    if (detectedTools.length > 0) {
      updates.currentTools = [...(updates.currentTools || []), ...detectedTools];
    }

    // Budget detection
    if (lowerMessage.includes('starter') || lowerMessage.includes('299') ||
        lowerMessage.includes('400') || lowerMessage.includes('500')) {
      updates.budget = 'starter';
    } else if (lowerMessage.includes('professional') || lowerMessage.includes('750') ||
               lowerMessage.includes('up to 1000')) {
      updates.budget = 'professional';
    } else if (lowerMessage.includes('enterprise') || lowerMessage.includes('unlimited') ||
               lowerMessage.includes('1000+') || lowerMessage.includes('1500')) {
      updates.budget = 'enterprise';
    }

    // Add mentioned skills to context
    if (mentionedSkills.length > 0) {
      updates.painPoints = [...(updates.painPoints || []), ...mentionedSkills];
    }

    return updates;
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

    // Analyze the message
    const contextUpdates = analyzeMessage(input);

    // Update business context
    const newContext = { ...businessContext, ...contextUpdates };
    setBusinessContext(newContext);

    // Build and update configuration based on new context
    buildConfiguration(newContext);

    // Generate next question
    const nextQuestion = generateNextQuestion(newContext, questionHistory);
    setQuestionHistory(prev => [...prev, nextQuestion]);

    // Create response
    setTimeout(() => {
      // Get the new configuration that was just built
      const newConfig = buildConfiguration(newContext);

      let response = '';

      // Calculate changes
      const addedSkills = newConfig.skills.filter(s => !previousConfiguration.skills.includes(s));
      const removedSkills = previousConfiguration.skills.filter(s => !newConfig.skills.includes(s));
      const addedFeatures = newConfig.features.filter(f => !previousConfiguration.features.includes(f));
      const removedFeatures = previousConfiguration.features.filter(f => !newConfig.features.includes(f));
      const addedIntegrations = newConfig.integrations.filter(i => !previousConfiguration.integrations.includes(i));
      const removedIntegrations = previousConfiguration.integrations.filter(i => !newConfig.integrations.includes(i));

      // Show what changed
      if (addedSkills.length > 0 || removedSkills.length > 0 ||
          addedFeatures.length > 0 || removedFeatures.length > 0 ||
          addedIntegrations.length > 0 || removedIntegrations.length > 0) {

        response = 'Configuration updated:\n\n';

        if (addedSkills.length > 0) {
          response += `Added skills:\n${addedSkills.map(s => `• ${s.replace(/_/g, ' ')}`).join('\n')}\n\n`;
        }
        if (removedSkills.length > 0) {
          response += `Removed skills:\n${removedSkills.map(s => `• ${s.replace(/_/g, ' ')}`).join('\n')}\n\n`;
        }
        if (addedFeatures.length > 0) {
          response += `Added features:\n${addedFeatures.map(f => `• ${f.replace(/_/g, ' ')}`).join('\n')}\n\n`;
        }
        if (addedIntegrations.length > 0) {
          response += `Added integrations:\n${addedIntegrations.map(i => `• ${i.replace(/_/g, ' ')}`).join('\n')}\n\n`;
        }
      } else if (messages.length === 1) {
        // First response
        response = 'Let me start building your configuration.\n\n';
      } else {
        response = 'Configuration remains optimal based on that information.\n\n';
      }

      // Ask next question
      response += nextQuestion;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;

        // Create message for file upload
        const fileMessage: Message = {
          id: Date.now().toString(),
          text: `Uploaded: ${file.name}`,
          sender: 'user',
          timestamp: new Date(),
          attachments: [file.name]
        };

        setMessages(prev => [...prev, fileMessage]);

        // Analyze file content
        const contextUpdates = analyzeMessage(content);
        const newContext = { ...businessContext, ...contextUpdates };
        setBusinessContext(newContext);
        buildConfiguration(newContext);

        // Respond to file upload
        setTimeout(() => {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: `I've analyzed ${file.name} and updated your configuration accordingly. ${generateNextQuestion(newContext, questionHistory)}`,
            sender: 'assistant',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, assistantMessage]);
        }, 1000);
      };

      reader.readAsText(file);
    });
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
              Adaptive Configuration Assistant
            </h3>
            <span className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
              Building your agent in real-time
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full" style={{
            backgroundColor: 'rgba(169, 189, 203, 0.1)',
            color: 'rgba(169, 189, 203, 0.9)'
          }}>
            {currentConfiguration.skills.length} skills active
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
              className={`max-w-[85%] px-4 py-3 rounded-lg text-sm`}
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
              {message.attachments && message.attachments.length > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  <DocumentIcon className="h-4 w-4" style={{ color: 'rgba(169, 189, 203, 0.7)' }} />
                  <span className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                    {message.attachments.join(', ')}
                  </span>
                </div>
              )}
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
                Updating configuration
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
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept=".txt,.pdf,.doc,.docx,.csv,.json"
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-lg transition hover:opacity-80"
            style={{
              backgroundColor: 'rgba(169, 189, 203, 0.1)',
              border: '1px solid rgba(169, 189, 203, 0.2)'
            }}
            title="Upload files"
          >
            <ArrowUpTrayIcon className="h-4 w-4" style={{ color: 'rgb(169, 189, 203)' }} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Describe your business or answer the question..."
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