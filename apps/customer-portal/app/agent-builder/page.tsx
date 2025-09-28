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
  CircleStackIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../components/DashboardLayout';
import AgentBuilderChatV2 from '../../components/AgentBuilderChatV2';

// Tool options with categories
const TOOLS = [
  { id: 'gmail', name: 'Gmail', category: 'Communication' },
  { id: 'outlook', name: 'Outlook', category: 'Communication' },
  { id: 'slack', name: 'Slack', category: 'Communication' },
  { id: 'teams', name: 'Microsoft Teams', category: 'Communication' },
  { id: 'salesforce', name: 'Salesforce', category: 'CRM' },
  { id: 'hubspot', name: 'HubSpot', category: 'CRM' },
  { id: 'sheets', name: 'Google Sheets', category: 'Data' },
  { id: 'excel', name: 'Excel', category: 'Data' },
  { id: 'quickbooks', name: 'QuickBooks', category: 'Finance' },
  { id: 'stripe', name: 'Stripe', category: 'Payments' },
  { id: 'shopify', name: 'Shopify', category: 'E-commerce' },
  { id: 'wordpress', name: 'WordPress', category: 'Website' },
];

// Skill detection mappings
const SKILL_MAPPINGS: { [key: string]: { skills: string[], price: number } } = {
  sales: {
    skills: ['Lead Generation', 'Email Outreach', 'CRM Sync', 'Lead Scoring', 'Pipeline Management'],
    price: 649
  },
  support: {
    skills: ['Ticket Management', 'Auto Response', 'Knowledge Base', 'Chat Support', 'FAQ Builder'],
    price: 349
  },
  marketing: {
    skills: ['Content Creation', 'Social Media', 'Email Campaigns', 'Analytics', 'SEO Optimization'],
    price: 449
  },
  operations: {
    skills: ['Workflow Automation', 'Task Management', 'Reporting', 'Data Sync', 'Process Optimization'],
    price: 549
  },
  data: {
    skills: ['Data Processing', 'Analytics', 'Custom Reports', 'Dashboard Creation', 'Predictive Insights'],
    price: 449
  },
  construction: {
    skills: ['Project Tracking', 'Bid Generation', 'Safety Compliance', 'Resource Scheduling', 'Permit Tracking'],
    price: 599
  }
};

interface AgentConfig {
  name: string;
  description: string;
  tools: string[];
  skills: string[];
  price: number;
  agentType: string;
}

export default function AgentBuilderPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    name: 'Custom AI Agent',
    description: '',
    tools: [],
    skills: [],
    price: 299,
    agentType: 'general'
  });
  const [inputDescription, setInputDescription] = useState('');
  const [showChatbot, setShowChatbot] = useState(false);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session');
        setIsLoggedIn(response.ok);
        // Non-logged in users get chatbot by default for more guidance
        // Logged in users get direct form by default (less hand-holding)
        setShowChatbot(!response.ok);
      } catch {
        setIsLoggedIn(false);
        setShowChatbot(true); // Default to chatbot if auth check fails
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

    // Detect tools
    const detectedTools = TOOLS.filter(tool =>
      lower.includes(tool.name.toLowerCase())
    ).map(t => t.id);

    setAgentConfig(prev => ({
      ...prev,
      description: desc,
      agentType: detectedType,
      skills: detectedSkills,
      tools: detectedTools,
      price: basePrice,
      name: detectedType === 'general'
        ? 'Custom AI Agent'
        : `${detectedType.charAt(0).toUpperCase() + detectedType.slice(1)} Agent`
    }));
  };

  // Handle tool selection
  const toggleTool = (toolId: string) => {
    setAgentConfig(prev => ({
      ...prev,
      tools: prev.tools.includes(toolId)
        ? prev.tools.filter(t => t !== toolId)
        : [...prev.tools, toolId]
    }));
  };

  // Handle skill removal
  const removeSkill = (skill: string) => {
    setAgentConfig(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  // Handle chat completion
  const handleChatComplete = (config: any) => {
    setAgentConfig({
      name: config.agentName || 'Custom AI Agent',
      description: config.goal || '',
      tools: config.tools || [],
      skills: config.suggestedSkills || [],
      price: 299,
      agentType: config.industry?.toLowerCase() || 'general'
    });
  };

  // Continue to preview
  const handleContinue = () => {
    sessionStorage.setItem('agentConfig', JSON.stringify(agentConfig));
    router.push('/agent-builder/demo');
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="px-8 py-6 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
        <h1 className="text-3xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
          Build Your Custom AI Agent
        </h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
          Describe your needs and see what we'll build for you
        </p>
      </header>

      <div className="flex gap-6 p-8">
        {/* Left Panel - Input/Chat */}
        <div className="flex-1">
          <div className="rounded-xl shadow-sm border" style={{
            backgroundColor: 'rgba(58, 64, 64, 0.5)',
            borderColor: 'rgba(169, 189, 203, 0.15)',
            minHeight: '600px'
          }}>
            {showChatbot ? (
              /* Chatbot interface - available to everyone */
              <div style={{ height: '600px' }}>
                <AgentBuilderChatV2
                  onComplete={handleChatComplete}
                  isDemo={true}
                />
              </div>
            ) : (
              /* Direct input form - available to everyone */
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2"
                    style={{ color: 'rgb(229, 227, 220)' }}>
                    What's the main job you'd like your agent to do?
                  </label>
                  <textarea
                    value={inputDescription}
                    onChange={(e) => {
                      setInputDescription(e.target.value);
                      analyzeDescription(e.target.value);
                    }}
                    placeholder="E.g., I need an agent to handle customer support tickets, respond to common questions, and escalate complex issues. We use Slack and Gmail for communication..."
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[rgb(169,189,203)]"
                    rows={6}
                    style={{
                      backgroundColor: 'rgba(48, 54, 54, 0.5)',
                      borderColor: 'rgba(169, 189, 203, 0.3)',
                      color: 'rgb(229, 227, 220)'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3"
                    style={{ color: 'rgb(229, 227, 220)' }}>
                    Which tools do you already use? (optional)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {TOOLS.map(tool => (
                      <button
                        key={tool.id}
                        onClick={() => toggleTool(tool.id)}
                        className={`px-3 py-2 rounded-lg border text-sm transition flex items-center justify-between ${
                          agentConfig.tools.includes(tool.id) ? 'ring-2 ring-[rgb(169,189,203)]' : ''
                        }`}
                        style={{
                          backgroundColor: agentConfig.tools.includes(tool.id)
                            ? 'rgba(169, 189, 203, 0.2)'
                            : 'rgba(58, 64, 64, 0.3)',
                          borderColor: agentConfig.tools.includes(tool.id)
                            ? 'rgb(169, 189, 203)'
                            : 'rgba(169, 189, 203, 0.3)',
                          color: 'rgb(229, 227, 220)'
                        }}
                      >
                        <span>{tool.name}</span>
                        {agentConfig.tools.includes(tool.id) && (
                          <CheckIcon className="h-4 w-4" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setShowChatbot(!showChatbot)}
                  className="text-sm flex items-center gap-2 hover:opacity-80 transition"
                  style={{ color: 'rgb(169, 189, 203)' }}
                >
                  <SparklesIcon className="h-4 w-4" />
                  {showChatbot ? 'Switch to quick form' : 'Prefer guided help? Use AI assistant'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Live Preview */}
        <div className="w-[450px]">
          <div className="rounded-xl shadow-sm border p-6 sticky top-6" style={{
            backgroundColor: 'rgba(58, 64, 64, 0.5)',
            borderColor: 'rgba(169, 189, 203, 0.15)'
          }}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'rgb(229, 227, 220)' }}>
              <CogIcon className="h-6 w-6" style={{ color: 'rgb(169, 189, 203)' }} />
              What You're Building
            </h2>

            {/* Agent Name */}
            <div className="mb-4">
              <label className="text-xs font-medium uppercase tracking-wider"
                style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                Agent Name
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="text"
                  value={agentConfig.name}
                  onChange={(e) => setAgentConfig(prev => ({ ...prev, name: e.target.value }))}
                  className="flex-1 bg-transparent border-b text-lg font-semibold focus:outline-none"
                  style={{
                    borderColor: 'rgba(169, 189, 203, 0.3)',
                    color: 'rgb(229, 227, 220)'
                  }}
                />
                <PencilIcon className="h-4 w-4" style={{ color: 'rgba(169, 189, 203, 0.5)' }} />
              </div>
            </div>

            {/* Skills Detected */}
            <div className="mb-4">
              <label className="text-xs font-medium uppercase tracking-wider"
                style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                Skills Detected ({agentConfig.skills.length})
              </label>
              <div className="mt-2 flex flex-wrap gap-2 min-h-[60px]">
                {agentConfig.skills.length > 0 ? (
                  agentConfig.skills.map(skill => (
                    <span
                      key={skill}
                      className="px-3 py-1 rounded-full text-xs flex items-center gap-1"
                      style={{
                        backgroundColor: 'rgba(169, 189, 203, 0.1)',
                        color: 'rgb(169, 189, 203)',
                        border: '1px solid rgba(169, 189, 203, 0.3)'
                      }}
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="ml-1 hover:opacity-70"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-sm italic" style={{ color: 'rgba(169, 189, 203, 0.4)' }}>
                    Skills will appear as you describe your needs...
                  </span>
                )}
              </div>
            </div>

            {/* Tools/Integrations */}
            {agentConfig.tools.length > 0 && (
              <div className="mb-4">
                <label className="text-xs font-medium uppercase tracking-wider"
                  style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                  Integrations
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {agentConfig.tools.map(toolId => {
                    const tool = TOOLS.find(t => t.id === toolId);
                    return tool ? (
                      <span
                        key={toolId}
                        className="px-2 py-1 rounded text-xs"
                        style={{
                          backgroundColor: 'rgba(169, 189, 203, 0.1)',
                          color: 'rgba(229, 227, 220, 0.8)'
                        }}
                      >
                        {tool.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Price Estimate */}
            <div className="mb-6 p-4 rounded-lg" style={{
              backgroundColor: 'rgba(169, 189, 203, 0.1)',
              border: '1px solid rgba(169, 189, 203, 0.3)'
            }}>
              <div className="flex justify-between items-baseline">
                <span className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.7)' }}>
                  Basic Monthly Price
                </span>
                <div>
                  <span className="text-3xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                    £{agentConfig.price}
                  </span>
                  <span className="text-sm" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                    /month
                  </span>
                </div>
              </div>
              <p className="text-xs mt-2" style={{ color: 'rgba(169, 189, 203, 0.5)' }}>
                Final price depends on features selected
              </p>
            </div>

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              className="w-full px-6 py-3 rounded-lg transition hover:opacity-80 flex items-center justify-center gap-2"
              style={{
                backgroundColor: 'rgb(169, 189, 203)',
                color: 'white'
              }}
              disabled={!agentConfig.description && agentConfig.skills.length === 0}
            >
              <span>Continue to Full Preview</span>
              <ArrowRightIcon className="h-5 w-5" />
            </button>

            {!isLoggedIn && (
              <p className="text-xs text-center mt-3" style={{ color: 'rgba(169, 189, 203, 0.5)' }}>
                No account or payment required to preview
              </p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}