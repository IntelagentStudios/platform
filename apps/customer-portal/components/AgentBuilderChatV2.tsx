'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  SparklesIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  PencilIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
  detectedConfig?: AgentConfig;
}

interface AgentConfig {
  goal: string;
  tools: string[];
  workflows: string[];
  outputs: string[];
  industry: string;
  teamSize: string;
  budget: string;
  suggestedSkills: string[];
  completeness: number; // 0-100% completeness of information gathering
  conversationStage: 'initial' | 'gathering' | 'confirming' | 'ready';
}

interface AgentBuilderChatV2Props {
  onComplete?: (config: any) => void;
  isDemo?: boolean;
  onReset?: () => void;
}

// Intelligence patterns for parsing user descriptions
const TOOL_PATTERNS = {
  gmail: /gmail|google mail|g-mail/i,
  outlook: /outlook|microsoft mail|office 365/i,
  salesforce: /salesforce|sfdc/i,
  hubspot: /hubspot/i,
  slack: /slack/i,
  teams: /microsoft teams|ms teams/i,
  sheets: /google sheets|spreadsheet/i,
  excel: /excel|xlsx/i,
  shopify: /shopify|e-commerce|online store/i,
  wordpress: /wordpress|blog|website/i,
  stripe: /stripe|payments|billing/i,
  quickbooks: /quickbooks|accounting/i,
  zoom: /zoom|video calls|meetings/i,
  calendly: /calendly|scheduling/i,
  mailchimp: /mailchimp|email marketing/i,
  twitter: /twitter|x\.com/i,
  linkedin: /linkedin/i,
  instagram: /instagram/i,
  facebook: /facebook|meta/i
};

const WORKFLOW_PATTERNS = {
  lead_generation: /lead gen|find leads|prospect|new customers/i,
  email_outreach: /email campaign|outreach|cold email|email sequence/i,
  scheduling: /schedule|booking|appointments|calendar/i,
  data_entry: /data entry|data input|update records/i,
  reporting: /reports|analytics|dashboard|metrics/i,
  onboarding: /onboarding|new customer|welcome/i,
  support: /customer support|help desk|tickets/i,
  content: /content creation|blog|social media posts/i,
  invoicing: /invoice|billing|payments/i,
  followup: /follow up|follow-up|nurture/i
};

const INDUSTRY_PATTERNS = {
  construction: /construction|building|contractor|architecture|engineering|renovation|civil/i,
  technology: /tech|software|saas|startup|app/i,
  ecommerce: /e-commerce|online store|retail|shop/i,
  healthcare: /health|medical|clinic|doctor|patient/i,
  finance: /finance|banking|investment|insurance/i,
  realestate: /real estate|property|realtor|housing/i,
  education: /education|school|university|teaching|course/i,
  marketing: /marketing|agency|advertising|digital/i,
  consulting: /consulting|consultant|advisory/i,
  manufacturing: /manufacturing|production|factory/i,
  legal: /legal|law|attorney|lawyer/i,
  nonprofit: /non-profit|nonprofit|charity|ngo/i,
  hospitality: /hotel|restaurant|hospitality|tourism/i
};

const BUDGET_PATTERNS = {
  '<100': /under \$?100|less than \$?100|\$?50|\$?75/i,
  '100-500': /\$?100-\$?500|\$?200|\$?300|\$?400/i,
  '500-1000': /\$?500-\$?1000|\$?600|\$?700|\$?800|\$?900/i,
  '1000-2500': /\$?1000-\$?2500|\$?1500|\$?2000/i,
  '2500-5000': /\$?2500-\$?5000|\$?3000|\$?4000/i,
  '>5000': /over \$?5000|more than \$?5000|\$?10000/i
};

const TEAM_SIZE_PATTERNS = {
  'Just me': /just me|solo|alone|individual|freelance|1 person/i,
  '2-5 people': /2-5|two|three|four|five|small team/i,
  '6-20 people': /6-20|ten|fifteen|medium team/i,
  '21-50 people': /21-50|thirty|forty|growing team/i,
  '51-200 people': /51-200|hundred|large team/i,
  '200+ people': /200\+|enterprise|corporation|hundreds/i
};

export const AgentBuilderChatV2: React.FC<AgentBuilderChatV2Props> = ({
  onComplete,
  isDemo,
  onReset
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [detectedConfig, setDetectedConfig] = useState<AgentConfig | null>(null);
  const [showConfigEditor, setShowConfigEditor] = useState(false);
  const [editableConfig, setEditableConfig] = useState<AgentConfig | null>(null);
  const [conversationContext, setConversationContext] = useState<{
    hasAskedAboutBusiness?: boolean;
    hasAskedAboutChallenges?: boolean;
    hasAskedAboutTeamSize?: boolean;
    hasAskedAboutBudget?: boolean;
    hasAskedAboutTools?: boolean;
    isGatheringInfo: boolean;
  }>({ isGatheringInfo: true });
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize conversation
  useEffect(() => {
    if (messages.length === 0) {
      addBotMessage(
        "I'm here to help you explore AI solutions for your business. Let's have a conversation to understand your needs better.\n\n" +
        "Tell me about your business - what industry are you in and what challenges are you facing?"
      );
    }
  }, []);

  // Add bot message
  const addBotMessage = (content: string, config?: AgentConfig) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'bot',
        content,
        timestamp: new Date(),
        detectedConfig: config
      }]);
      setIsTyping(false);
    }, 500);
  };

  // Parse user description and extract configuration
  const parseUserDescription = (description: string, previousConfig?: AgentConfig): AgentConfig => {
    const baseConfig = previousConfig || {
      goal: '',
      tools: [],
      workflows: [],
      outputs: [],
      industry: '',
      teamSize: '',
      budget: '',
      suggestedSkills: [],
      completeness: 0,
      conversationStage: 'initial'
    };

    // Extract tools
    const detectedTools: string[] = [...baseConfig.tools];
    Object.entries(TOOL_PATTERNS).forEach(([tool, pattern]) => {
      if (pattern.test(description) && !detectedTools.includes(tool.charAt(0).toUpperCase() + tool.slice(1))) {
        detectedTools.push(tool.charAt(0).toUpperCase() + tool.slice(1));
      }
    });

    // Extract workflows
    const detectedWorkflows: string[] = [...baseConfig.workflows];
    Object.entries(WORKFLOW_PATTERNS).forEach(([workflow, pattern]) => {
      if (pattern.test(description)) {
        const formatted = workflow.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        if (!detectedWorkflows.includes(formatted)) {
          detectedWorkflows.push(formatted);
        }
      }
    });

    // Extract industry
    let detectedIndustry = baseConfig.industry;
    Object.entries(INDUSTRY_PATTERNS).forEach(([industry, pattern]) => {
      if (pattern.test(description)) {
        detectedIndustry = industry.charAt(0).toUpperCase() + industry.slice(1);
      }
    });

    // Extract budget
    let detectedBudget = baseConfig.budget;
    Object.entries(BUDGET_PATTERNS).forEach(([budget, pattern]) => {
      if (pattern.test(description)) {
        detectedBudget = budget === '<100' ? '< £100/month' :
                        budget === '>5000' ? '> £5000/month' :
                        `£${budget}/month`;
      }
    });

    // Extract team size
    let detectedTeamSize = baseConfig.teamSize;
    Object.entries(TEAM_SIZE_PATTERNS).forEach(([size, pattern]) => {
      if (pattern.test(description)) {
        detectedTeamSize = size;
      }
    });

    // Determine outputs based on description
    const detectedOutputs: string[] = [...baseConfig.outputs];
    if (/report|analytics|metrics|dashboard/i.test(description)) {
      if (!detectedOutputs.includes('Daily/Weekly reports')) detectedOutputs.push('Daily/Weekly reports');
      if (!detectedOutputs.includes('Real-time dashboards')) detectedOutputs.push('Real-time dashboards');
    }
    if (/email|notify|alert/i.test(description)) {
      if (!detectedOutputs.includes('Email notifications')) detectedOutputs.push('Email notifications');
    }
    if (/slack|teams|chat/i.test(description)) {
      if (!detectedOutputs.includes('Slack alerts')) detectedOutputs.push('Slack alerts');
    }
    if (/export|csv|excel/i.test(description)) {
      if (!detectedOutputs.includes('CSV exports')) detectedOutputs.push('CSV exports');
    }
    if (/calendar|schedule/i.test(description)) {
      if (!detectedOutputs.includes('Calendar events')) detectedOutputs.push('Calendar events');
    }

    // Calculate completeness
    let completeness = 0;
    if (detectedIndustry) completeness += 20;
    if (detectedTeamSize) completeness += 20;
    if (detectedBudget) completeness += 20;
    if (detectedTools.length > 0) completeness += 20;
    if (detectedWorkflows.length > 0 || baseConfig.goal) completeness += 20;

    // Determine conversation stage
    let conversationStage: 'initial' | 'gathering' | 'confirming' | 'ready' = 'initial';
    if (completeness >= 80) conversationStage = 'ready';
    else if (completeness >= 60) conversationStage = 'confirming';
    else if (completeness >= 20) conversationStage = 'gathering';

    // Update goal
    const goal = baseConfig.goal || description;

    // Generate suggested skills based on the configuration
    const suggestedSkills = generateSkillRecommendations(
      goal,
      detectedTools,
      detectedWorkflows
    );

    return {
      goal,
      tools: detectedTools,
      workflows: detectedWorkflows,
      outputs: detectedOutputs,
      industry: detectedIndustry,
      teamSize: detectedTeamSize,
      budget: detectedBudget,
      suggestedSkills,
      completeness,
      conversationStage
    };
  };

  // Generate skill recommendations
  const generateSkillRecommendations = (goal: string, tools: string[], workflows: string[]): string[] => {
    const skills: string[] = [];

    // Construction-specific skills
    if (/construction|building|contractor/i.test(goal)) {
      skills.push('project_tracker', 'bid_generator', 'safety_compliance', 'resource_scheduler');
      skills.push('document_manager', 'permit_tracker', 'subcontractor_manager', 'equipment_tracker');
    }
    if (/estimate|quote|bid|proposal/i.test(goal)) {
      skills.push('cost_estimator', 'bid_generator', 'proposal_builder', 'quote_tracker');
    }
    if (/project|timeline|schedule|deadline/i.test(goal)) {
      skills.push('project_scheduler', 'gantt_chart_builder', 'milestone_tracker', 'delay_alerter');
    }
    if (/safety|compliance|regulation|osha/i.test(goal)) {
      skills.push('safety_compliance', 'incident_reporter', 'inspection_scheduler', 'certification_tracker');
    }
    if (/inventory|materials|supplies|equipment/i.test(goal)) {
      skills.push('inventory_manager', 'material_tracker', 'equipment_scheduler', 'purchase_order_generator');
    }
    if (/subcontractor|crew|team|worker/i.test(goal)) {
      skills.push('crew_scheduler', 'timesheet_tracker', 'subcontractor_manager', 'payroll_assistant');
    }

    // Based on goal keywords
    if (/email|outreach|campaign/i.test(goal)) {
      skills.push('email_composer', 'email_sender', 'email_tracker', 'email_validator');
    }
    if (/lead|prospect|customer acquisition/i.test(goal)) {
      skills.push('lead_finder', 'lead_enrichment', 'lead_scorer', 'contact_validator');
    }
    if (/support|help|ticket/i.test(goal)) {
      skills.push('ticket_manager', 'auto_responder', 'sentiment_analysis', 'knowledge_base');
    }
    if (/data|analyz|report/i.test(goal)) {
      skills.push('data_analyzer', 'report_generator', 'dashboard_builder', 'metric_tracker');
    }
    if (/content|blog|social/i.test(goal)) {
      skills.push('content_generator', 'seo_optimizer', 'social_media_poster', 'content_scheduler');
    }
    if (/schedule|calendar|meeting/i.test(goal)) {
      skills.push('meeting_scheduler', 'calendar_manager', 'availability_checker', 'reminder_sender');
    }
    if (/invoice|billing|payment/i.test(goal)) {
      skills.push('invoice_generator', 'payment_tracker', 'expense_manager', 'receipt_processor');
    }

    // Based on tools
    tools.forEach(tool => {
      const toolLower = tool.toLowerCase();
      if (toolLower.includes('salesforce')) {
        skills.push('salesforce_sync', 'crm_updater');
      }
      if (toolLower.includes('gmail') || toolLower.includes('outlook')) {
        skills.push('email_integration', 'calendar_sync');
      }
      if (toolLower.includes('slack') || toolLower.includes('teams')) {
        skills.push('chat_integration', 'notification_sender');
      }
      if (toolLower.includes('shopify')) {
        skills.push('ecommerce_tracker', 'inventory_manager', 'order_processor');
      }
      if (toolLower.includes('stripe')) {
        skills.push('payment_processor', 'subscription_manager');
      }
    });

    // Ensure unique skills
    return [...new Set(skills)];
  };

  // Generate appropriate bot response based on conversation stage
  const generateBotResponse = (input: string, config: AgentConfig): string => {
    const lowerInput = input.toLowerCase();

    // Check if construction industry was mentioned
    if (/construction|building|contractor|architecture|engineering|renovation/i.test(input)) {
      if (!conversationContext.hasAskedAboutChallenges) {
        setConversationContext(prev => ({ ...prev, hasAskedAboutChallenges: true }));
        return "Great! I understand you're in the construction industry. AI can really transform how construction businesses operate.\n\n" +
               "What are the biggest challenges you're facing in your business right now?\n\n" +
               "For example:\n" +
               "• Managing multiple projects and deadlines\n" +
               "• Tracking equipment and materials\n" +
               "• Coordinating with subcontractors\n" +
               "• Generating accurate estimates and proposals\n" +
               "• Safety compliance and documentation\n" +
               "• Finding new clients and projects";
      }
    }

    // Check for team size information
    if (!conversationContext.hasAskedAboutTeamSize && config.teamSize && config.completeness < 60) {
      setConversationContext(prev => ({ ...prev, hasAskedAboutTeamSize: true }));
      return "I see you have a team of " + config.teamSize + ". That's helpful to know.\n\n" +
             "What tools or software are you currently using to manage your construction business?\n\n" +
             "For example:\n" +
             "• Project management tools (Procore, Buildertrend, etc.)\n" +
             "• Accounting software (QuickBooks, Xero, etc.)\n" +
             "• Communication tools (Email, Slack, Teams, etc.)\n" +
             "• Document management systems";
    }

    // Check for budget information
    if (!conversationContext.hasAskedAboutBudget && !config.budget && config.completeness >= 40) {
      setConversationContext(prev => ({ ...prev, hasAskedAboutBudget: true }));
      return "Based on what you've told me, I'm starting to see some great AI opportunities for your business.\n\n" +
             "To recommend the best solution that fits your needs, what's your monthly budget for AI tools?\n\n" +
             "Most construction companies find value in the £300-£1000 range, but we have options from under £100 to enterprise solutions.";
    }

    // If we have enough information (>60% complete), start showing what we can do
    if (config.completeness >= 60) {
      return "Excellent! Based on what you've shared, I can see several AI solutions that would benefit your construction business:\n\n" +
             "✓ **Project Management AI** - Automatically track project timelines, predict delays, and optimize resource allocation\n" +
             "✓ **Smart Estimating** - Generate accurate quotes and proposals based on historical data\n" +
             "✓ **Safety Compliance Assistant** - Monitor safety requirements and automate documentation\n" +
             "✓ **Client Communication Bot** - Handle inquiries and provide project updates 24/7\n\n" +
             "I've prepared a preview of your custom dashboard. Would you like to see what this would look like for your business?";
    }

    // Default response for continuing the conversation
    return "That's helpful information. Let me understand better - what specific tasks take up most of your time that you'd like to automate?";
  };

  // Handle user input submission
  const handleSubmit = () => {
    const input = inputValue.trim();
    if (!input) return;

    // Add user message
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    }]);

    setInputValue('');

    // Parse the user's description, building on previous config
    const config = parseUserDescription(input, detectedConfig || undefined);
    setDetectedConfig(config);
    setEditableConfig({ ...config });

    // Generate conversational response based on what we know
    const response = generateBotResponse(input, config);

    // Add bot response
    setTimeout(() => {
      if (config.completeness >= 60) {
        // Show configuration summary when we have enough info
        addBotMessage(response, config);
      } else {
        // Continue conversation to gather more info
        addBotMessage(response);
      }
    }, 1500);
  };

  // Handle configuration confirmation
  const handleConfirmConfig = () => {
    if (onComplete && editableConfig) {
      onComplete({
        agentName: `${editableConfig.industry} AI Agent`,
        requirements: editableConfig,
        suggestedSkills: editableConfig.suggestedSkills,
        configuration: editableConfig
      });
    }
  };

  // Update editable config
  const updateConfig = (field: keyof AgentConfig, value: any) => {
    if (editableConfig) {
      setEditableConfig({ ...editableConfig, [field]: value });
    }
  };

  return (
    <div className="flex flex-col h-full rounded-lg shadow-lg" style={{ backgroundColor: 'rgb(48, 54, 54)' }}>
      {/* Header */}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-3`}
              style={{
                backgroundColor: message.type === 'user' ? 'rgb(169, 189, 203)' : 'rgba(58, 64, 64, 0.8)',
                color: message.type === 'user' ? 'white' : 'rgb(229, 227, 220)'
              }}
            >
              {message.type === 'bot' && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium" style={{ color: 'rgb(169, 189, 203)' }}>Assistant</span>
                </div>
              )}
              <p className="whitespace-pre-wrap">{message.content}</p>

              {/* Configuration Editor */}
              {message.detectedConfig && (
                <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: 'rgba(48, 54, 54, 0.5)' }}>
                  {/* Progress Indicator */}
                  {message.detectedConfig.completeness < 100 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium" style={{ color: 'rgba(229, 227, 220, 0.7)' }}>
                          Configuration Progress
                        </span>
                        <span className="text-xs" style={{ color: 'rgb(169, 189, 203)' }}>
                          {message.detectedConfig.completeness}% Complete
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${message.detectedConfig.completeness}%`,
                            backgroundColor: 'rgb(169, 189, 203)'
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5" style={{ color: 'rgb(169, 189, 203)' }} />
                      {message.detectedConfig.completeness >= 60 ? 'Your Configuration' : 'Building Your Configuration'}
                    </h4>
                    <button
                      onClick={() => setShowConfigEditor(!showConfigEditor)}
                      className="flex items-center gap-1 text-sm px-2 py-1 rounded hover:bg-white/10 transition"
                      style={{ color: 'rgb(169, 189, 203)' }}
                    >
                      <PencilIcon className="w-4 h-4" />
                      {showConfigEditor ? 'Hide' : 'Edit'}
                      {showConfigEditor ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                    </button>
                  </div>

                  {showConfigEditor && editableConfig ? (
                    <div className="space-y-3">
                      {/* Tools */}
                      <div>
                        <label className="text-xs font-medium" style={{ color: 'rgba(229, 227, 220, 0.7)' }}>Tools & Integrations</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {['Gmail', 'Outlook', 'Salesforce', 'HubSpot', 'Slack', 'Teams', 'Shopify', 'Stripe'].map(tool => (
                            <button
                              key={tool}
                              onClick={() => {
                                const tools = editableConfig.tools.includes(tool)
                                  ? editableConfig.tools.filter(t => t !== tool)
                                  : [...editableConfig.tools, tool];
                                updateConfig('tools', tools);
                              }}
                              className={`px-3 py-1 text-xs rounded-full transition ${
                                editableConfig.tools.includes(tool) ? '' : ''
                              }`}
                              style={{
                                backgroundColor: editableConfig.tools.includes(tool) ? 'rgba(169, 189, 203, 0.2)' : 'rgba(58, 64, 64, 0.5)',
                                borderColor: editableConfig.tools.includes(tool) ? 'rgb(169, 189, 203)' : 'rgba(169, 189, 203, 0.3)',
                                color: editableConfig.tools.includes(tool) ? 'rgb(169, 189, 203)' : 'rgba(229, 227, 220, 0.8)',
                                border: '1px solid'
                              }}
                            >
                              {tool}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Industry */}
                      <div>
                        <label className="text-xs font-medium" style={{ color: 'rgba(229, 227, 220, 0.7)' }}>Industry</label>
                        <select
                          value={editableConfig.industry}
                          onChange={(e) => updateConfig('industry', e.target.value)}
                          className="w-full mt-1 px-3 py-2 text-sm rounded border"
                          style={{
                            backgroundColor: 'rgba(58, 64, 64, 0.5)',
                            borderColor: 'rgba(169, 189, 203, 0.3)',
                            color: 'rgb(229, 227, 220)'
                          }}
                        >
                          <option value="Construction">Construction/Engineering</option>
                          <option value="Technology/Software">Technology/Software</option>
                          <option value="E-commerce">E-commerce/Retail</option>
                          <option value="Healthcare">Healthcare</option>
                          <option value="Finance">Finance/Banking</option>
                          <option value="Real Estate">Real Estate</option>
                          <option value="Education">Education</option>
                          <option value="Marketing">Marketing Agency</option>
                          <option value="Consulting">Consulting</option>
                          <option value="Manufacturing">Manufacturing</option>
                          <option value="Legal">Legal Services</option>
                          <option value="Hospitality">Hospitality/Tourism</option>
                        </select>
                      </div>

                      {/* Budget */}
                      <div>
                        <label className="text-xs font-medium" style={{ color: 'rgba(229, 227, 220, 0.7)' }}>Budget</label>
                        <select
                          value={editableConfig.budget}
                          onChange={(e) => updateConfig('budget', e.target.value)}
                          className="w-full mt-1 px-3 py-2 text-sm rounded border"
                          style={{
                            backgroundColor: 'rgba(58, 64, 64, 0.5)',
                            borderColor: 'rgba(169, 189, 203, 0.3)',
                            color: 'rgb(229, 227, 220)'
                          }}
                        >
                          <option value="< £100/month">Less than £100/month</option>
                          <option value="£100-500/month">£100-500/month</option>
                          <option value="£500-1000/month">£500-1000/month</option>
                          <option value="£1000-2500/month">£1000-2500/month</option>
                          <option value="£2500-5000/month">£2500-5000/month</option>
                          <option value="> £5000/month">More than £5000/month</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm space-y-1" style={{ color: 'rgba(229, 227, 220, 0.8)' }}>
                      <p><strong>Tools:</strong> {message.detectedConfig.tools.join(', ')}</p>
                      <p><strong>Industry:</strong> {message.detectedConfig.industry}</p>
                      <p><strong>Budget:</strong> {message.detectedConfig.budget}</p>
                    </div>
                  )}

                  <button
                    onClick={handleConfirmConfig}
                    className="w-full mt-4 px-4 py-2 text-white rounded-lg transition hover:opacity-80"
                    style={{ backgroundColor: 'rgb(169, 189, 203)' }}
                  >
                    Continue with this configuration →
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="rounded-lg px-4 py-3" style={{ backgroundColor: 'rgba(58, 64, 64, 0.8)' }}>
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'rgb(169, 189, 203)', animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'rgb(169, 189, 203)', animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'rgb(169, 189, 203)', animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t" style={{ borderColor: 'rgba(169, 189, 203, 0.15)' }}>
        <div className="flex gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Describe what you want your AI agent to do..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-none"
            style={{
              backgroundColor: 'rgba(58, 64, 64, 0.5)',
              borderColor: 'rgba(169, 189, 203, 0.3)',
              color: 'rgb(229, 227, 220)',
              minHeight: '60px'
            }}
            rows={2}
          />
          <button
            onClick={handleSubmit}
            disabled={!inputValue.trim()}
            className="px-4 py-2 text-white rounded-lg transition hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ backgroundColor: 'rgb(169, 189, 203)' }}
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs mt-2" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
          Tip: Describe your needs naturally. I'll automatically detect your tools, workflows, and requirements.
        </p>
      </div>
    </div>
  );
};

export default AgentBuilderChatV2;