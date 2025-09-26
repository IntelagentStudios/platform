'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
  options?: string[];
  metadata?: any;
}

interface AgentRequirements {
  goal?: string;
  tools?: string[];
  workflows?: string[];
  outputs?: string[];
  industry?: string;
  teamSize?: string;
  budget?: string;
}

interface AgentBuilderChatProps {
  onRequirementsComplete: (requirements: AgentRequirements, suggestedSkills: string[]) => void;
  onReset?: () => void;
}

const CONVERSATION_FLOW = {
  start: {
    message: "Hi! I'm here to help you build your perfect AI agent. Let's start with the basics. What's the main job you'd like your agent to handle?",
    examples: [
      "Send personalized sales emails",
      "Manage customer support",
      "Generate marketing content",
      "Analyze business data",
      "Automate workflows"
    ],
    next: 'tools'
  },
  tools: {
    message: "Great choice! Now, which tools and platforms do you currently use? This helps me understand your workflow.",
    options: [
      "Gmail",
      "Outlook",
      "Salesforce",
      "HubSpot",
      "Slack",
      "Microsoft Teams",
      "Google Sheets",
      "Excel",
      "Shopify",
      "WordPress",
      "Other"
    ],
    multiSelect: true,
    next: 'workflows'
  },
  workflows: {
    message: "Perfect! What are the key workflows you want to automate or improve?",
    examples: [
      "Lead qualification and scoring",
      "Email outreach sequences",
      "Meeting scheduling",
      "Data entry and updates",
      "Report generation",
      "Customer onboarding",
      "Task assignment",
      "Content creation"
    ],
    multiSelect: true,
    next: 'outputs'
  },
  outputs: {
    message: "What kind of outputs or results do you expect from your agent?",
    options: [
      "Daily/Weekly reports",
      "Real-time dashboards",
      "Email notifications",
      "Slack alerts",
      "CSV exports",
      "API webhooks",
      "Calendar events"
    ],
    multiSelect: true,
    next: 'industry'
  },
  industry: {
    message: "What industry are you in? This helps me customize the agent for your specific needs.",
    options: [
      "Technology/Software",
      "E-commerce/Retail",
      "Healthcare",
      "Finance/Banking",
      "Real Estate",
      "Education",
      "Marketing Agency",
      "Consulting",
      "Manufacturing",
      "Other"
    ],
    next: 'teamSize'
  },
  teamSize: {
    message: "How large is your team?",
    options: [
      "Just me",
      "2-5 people",
      "6-20 people",
      "21-50 people",
      "51-200 people",
      "200+ people"
    ],
    next: 'budget'
  },
  budget: {
    message: "Finally, what's your monthly budget for AI automation?",
    options: [
      "< £100/month",
      "£100-500/month",
      "£500-1000/month",
      "£1000-2500/month",
      "£2500-5000/month",
      "> £5000/month"
    ],
    next: 'complete'
  }
};

export const AgentBuilderChat: React.FC<AgentBuilderChatProps> = ({
  onRequirementsComplete,
  onReset
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState<keyof typeof CONVERSATION_FLOW>('start');
  const [requirements, setRequirements] = useState<AgentRequirements>({});
  const [inputValue, setInputValue] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const inputRef = useRef<null | HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize conversation
  useEffect(() => {
    const flow = CONVERSATION_FLOW[currentStep];
    if (flow && messages.length === 0) {
      const options = 'options' in flow ? flow.options : 'examples' in flow ? flow.examples : undefined;
      addBotMessage(flow.message, options);
    }
  }, []);

  // Add bot message
  const addBotMessage = (content: string, options?: string[]) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'bot',
        content,
        timestamp: new Date(),
        options
      }]);
      setIsTyping(false);
    }, 500 + Math.random() * 500); // Simulate typing delay
  };

  // Add user message
  const addUserMessage = (content: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    }]);
  };

  // Process user input
  const handleSubmit = (value?: string) => {
    const input = value || inputValue.trim();
    if (!input && selectedOptions.length === 0) return;

    // Add user message
    if (selectedOptions.length > 0) {
      addUserMessage(selectedOptions.join(', '));
    } else {
      addUserMessage(input);
    }

    // Store requirement
    const updatedRequirements = { ...requirements };
    switch (currentStep) {
      case 'start':
        updatedRequirements.goal = input;
        break;
      case 'tools':
        updatedRequirements.tools = selectedOptions.length > 0 ? selectedOptions : [input];
        break;
      case 'workflows':
        updatedRequirements.workflows = selectedOptions.length > 0 ? selectedOptions : input.split(',').map(s => s.trim());
        break;
      case 'outputs':
        updatedRequirements.outputs = selectedOptions.length > 0 ? selectedOptions : [input];
        break;
      case 'industry':
        updatedRequirements.industry = selectedOptions[0] || input;
        break;
      case 'teamSize':
        updatedRequirements.teamSize = selectedOptions[0] || input;
        break;
      case 'budget':
        updatedRequirements.budget = selectedOptions[0] || input;
        break;
    }
    setRequirements(updatedRequirements);

    // Clear input
    setInputValue('');
    setSelectedOptions([]);

    // Move to next step
    const flow = CONVERSATION_FLOW[currentStep];
    if (flow.next === 'complete') {
      // Generate skill recommendations
      const suggestedSkills = generateSkillRecommendations(updatedRequirements);

      // Add completion message
      setTimeout(() => {
        addBotMessage(
          `Excellent! Based on your requirements, I've designed a custom agent for you. Here's what I recommend:\n\n` +
          `🎯 **Goal**: ${updatedRequirements.goal}\n` +
          `🛠️ **Integrated Tools**: ${updatedRequirements.tools?.join(', ')}\n` +
          `📊 **Key Workflows**: ${updatedRequirements.workflows?.join(', ')}\n` +
          `📈 **Output Types**: ${updatedRequirements.outputs?.join(', ')}\n\n` +
          `I've selected ${suggestedSkills.length} skills that will power your agent. You can review and customize these in the next step!`
        );
      }, 1000);

      // Trigger completion callback
      setTimeout(() => {
        onRequirementsComplete(updatedRequirements, suggestedSkills);
      }, 3000);
    } else {
      setCurrentStep(flow.next as keyof typeof CONVERSATION_FLOW);
      const nextFlow = CONVERSATION_FLOW[flow.next as keyof typeof CONVERSATION_FLOW];
      setTimeout(() => {
        const nextOptions = 'options' in nextFlow ? nextFlow.options : 'examples' in nextFlow ? nextFlow.examples : undefined;
        addBotMessage(nextFlow.message, nextOptions);
      }, 1000);
    }
  };

  // Generate skill recommendations based on requirements
  const generateSkillRecommendations = (reqs: AgentRequirements): string[] => {
    const skills: string[] = [];

    // Based on goal
    if (reqs.goal?.toLowerCase().includes('email') || reqs.goal?.toLowerCase().includes('outreach')) {
      skills.push('email_composer', 'email_sender', 'lead_finder', 'email_validator');
    }
    if (reqs.goal?.toLowerCase().includes('support') || reqs.goal?.toLowerCase().includes('customer')) {
      skills.push('ticket_manager', 'auto_responder', 'sentiment_analysis', 'knowledge_base');
    }
    if (reqs.goal?.toLowerCase().includes('data') || reqs.goal?.toLowerCase().includes('analyz')) {
      skills.push('data_analyzer', 'report_generator', 'dashboard_builder', 'metric_tracker');
    }
    if (reqs.goal?.toLowerCase().includes('content') || reqs.goal?.toLowerCase().includes('marketing')) {
      skills.push('content_generator', 'seo_optimizer', 'social_media_poster', 'campaign_manager');
    }

    // Based on tools
    if (reqs.tools?.includes('Salesforce')) {
      skills.push('salesforce_sync', 'crm_updater');
    }
    if (reqs.tools?.includes('Gmail') || reqs.tools?.includes('Outlook')) {
      skills.push('email_integration', 'calendar_sync');
    }
    if (reqs.tools?.includes('Slack') || reqs.tools?.includes('Microsoft Teams')) {
      skills.push('chat_integration', 'notification_sender');
    }
    if (reqs.tools?.includes('Shopify')) {
      skills.push('ecommerce_tracker', 'inventory_manager');
    }

    // Based on workflows
    if (reqs.workflows?.some(w => w.toLowerCase().includes('lead'))) {
      skills.push('lead_scorer', 'lead_enrichment');
    }
    if (reqs.workflows?.some(w => w.toLowerCase().includes('report'))) {
      skills.push('report_scheduler', 'pdf_generator');
    }
    if (reqs.workflows?.some(w => w.toLowerCase().includes('meeting'))) {
      skills.push('meeting_scheduler', 'calendar_manager');
    }

    // Ensure unique skills
    return [...new Set(skills)];
  };

  // Toggle option selection
  const toggleOption = (option: string) => {
    const flow = CONVERSATION_FLOW[currentStep];
    if ('multiSelect' in flow && flow.multiSelect) {
      setSelectedOptions(prev =>
        prev.includes(option)
          ? prev.filter(o => o !== option)
          : [...prev, option]
      );
    } else {
      setSelectedOptions([option]);
      handleSubmit(option);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChatBubbleLeftRightIcon className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">Agent Builder Assistant</h3>
              <p className="text-xs opacity-90">I'll help you create your perfect AI agent</p>
            </div>
          </div>
          {onReset && (
            <button
              onClick={onReset}
              className="p-2 hover:bg-white/20 rounded-lg transition"
              title="Start over"
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-2 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>Progress</span>
          <span>{Object.keys(requirements).length} / 7</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
            style={{ width: `${(Object.keys(requirements).length / 7) * 100}%` }}
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-3 ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {message.type === 'bot' && (
                <div className="flex items-center gap-2 mb-1">
                  <SparklesIcon className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-medium text-purple-600">AI Assistant</span>
                </div>
              )}
              <p className="whitespace-pre-wrap">{message.content}</p>

              {/* Options */}
              {message.options && message.options.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => toggleOption(option)}
                      className={`block w-full text-left px-3 py-2 rounded border transition ${
                        selectedOptions.includes(option)
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{option}</span>
                        {selectedOptions.includes(option) && (
                          <CheckCircleIcon className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                    </button>
                  ))}
                  {'multiSelect' in CONVERSATION_FLOW[currentStep] && CONVERSATION_FLOW[currentStep].multiSelect && selectedOptions.length > 0 && (
                    <button
                      onClick={() => handleSubmit()}
                      className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                      Continue with {selectedOptions.length} selected
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Type your answer or select from options above..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => handleSubmit()}
            disabled={!inputValue.trim() && selectedOptions.length === 0}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentBuilderChat;