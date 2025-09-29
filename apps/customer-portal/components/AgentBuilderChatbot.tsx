'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  PaperAirplaneIcon,
  SparklesIcon,
  XMarkIcon,
  MinusIcon
} from '@heroicons/react/24/outline';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface AgentBuilderChatbotProps {
  onConfigUpdate?: (config: any) => void;
  agentContext?: any;
}

export default function AgentBuilderChatbot({ onConfigUpdate, agentContext }: AgentBuilderChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your AI Agent Builder assistant. I can help you design the perfect agent for your business. You can either describe what you need, or use the manual controls on the left to configure your agent. What would you like your agent to help with?",
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const analyzeRequest = async (text: string) => {
    // Analyze the text for agent configuration
    const lower = text.toLowerCase();
    const config: any = {
      agentType: 'general',
      skills: [],
      integrations: [],
      features: []
    };

    // Detect agent type
    if (lower.includes('sales') || lower.includes('lead') || lower.includes('outreach')) {
      config.agentType = 'sales';
      config.skills = ['Lead Generation', 'Email Outreach', 'CRM Sync', 'Pipeline Management'];
    } else if (lower.includes('support') || lower.includes('customer') || lower.includes('help')) {
      config.agentType = 'support';
      config.skills = ['Ticket Management', 'Auto Response', 'Knowledge Base', 'Chat Support'];
    } else if (lower.includes('marketing') || lower.includes('campaign') || lower.includes('social')) {
      config.agentType = 'marketing';
      config.skills = ['Content Creation', 'Social Media', 'Email Campaigns', 'Analytics'];
    } else if (lower.includes('data') || lower.includes('analytics') || lower.includes('report')) {
      config.agentType = 'data';
      config.skills = ['Data Collection', 'Data Visualization', 'Predictive Analytics', 'Reporting'];
    } else if (lower.includes('operations') || lower.includes('workflow') || lower.includes('process')) {
      config.agentType = 'operations';
      config.skills = ['Workflow Automation', 'Process Optimization', 'Task Management', 'Resource Planning'];
    }

    // Detect integrations
    if (lower.includes('salesforce')) config.integrations.push('salesforce');
    if (lower.includes('hubspot')) config.integrations.push('hubspot');
    if (lower.includes('slack')) config.integrations.push('slack');
    if (lower.includes('gmail') || lower.includes('email')) config.integrations.push('gmail');
    if (lower.includes('shopify') || lower.includes('ecommerce')) config.integrations.push('shopify');
    if (lower.includes('stripe') || lower.includes('payment')) config.integrations.push('stripe');

    // Detect features
    if (lower.includes('voice') || lower.includes('speech')) config.features.push('voice_assistant');
    if (lower.includes('multilingual') || lower.includes('language')) config.features.push('multi_language');
    if (lower.includes('white label') || lower.includes('brand')) config.features.push('white_label');
    if (lower.includes('chat') || lower.includes('conversation')) config.features.push('ai_chatbot');

    return config;
  };

  const generateResponse = (config: any) => {
    const agentTypeNames: { [key: string]: string } = {
      sales: 'Sales Outreach Agent',
      support: 'Customer Support Agent',
      marketing: 'Marketing Automation Agent',
      operations: 'Operations Management Agent',
      data: 'Data Analytics Agent',
      general: 'Custom AI Agent'
    };

    let response = `Perfect! Based on your requirements, I recommend a ${agentTypeNames[config.agentType] || 'Custom AI Agent'}`;

    if (config.skills.length > 0) {
      response += ` with capabilities including ${config.skills.slice(0, 3).join(', ')}`;
      if (config.skills.length > 3) {
        response += ` and ${config.skills.length - 3} more skills`;
      }
    }

    if (config.integrations.length > 0) {
      response += `. I can also integrate with ${config.integrations.join(', ')}`;
    }

    response += '. You can customize further using the controls on the left, or tell me more about your specific needs.';

    return response;
  };

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

    // Analyze the request
    const config = await analyzeRequest(input);

    // Update the parent component with the configuration
    if (onConfigUpdate) {
      onConfigUpdate(config);
    }

    // Generate and send response
    setTimeout(() => {
      const response = generateResponse(config);
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

  if (isMinimized) {
    return (
      <div
        className="fixed bottom-4 right-4 w-80 bg-gray-800 rounded-t-xl shadow-2xl cursor-pointer"
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
            Online
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-gray-800 rounded-xl shadow-2xl flex flex-col" style={{
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
          <button
            onClick={() => {/* Handle close */}}
            className="p-1 rounded hover:bg-gray-700 transition"
          >
            <XMarkIcon className="h-4 w-4" style={{ color: 'rgba(169, 189, 203, 0.6)' }} />
          </button>
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
              className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
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
              {message.text}
            </div>
          </div>
        ))}
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
            placeholder="Describe your agent needs..."
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
        <p className="text-xs mt-2 text-center" style={{ color: 'rgba(169, 189, 203, 0.5)' }}>
          Powered by Intelagent AI Platform
        </p>
      </div>
    </div>
  );
}