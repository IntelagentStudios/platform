'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ChartBarIcon,
  TableCellsIcon,
  ClockIcon,
  EnvelopeIcon,
  UserGroupIcon,
  CurrencyPoundIcon,
  DocumentChartBarIcon,
  BellIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  CogIcon,
  ServerStackIcon,
  CloudArrowUpIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  BeakerIcon,
  BoltIcon,
  SparklesIcon,
  PhoneIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  ChartPieIcon,
  InboxArrowDownIcon,
  PaperAirplaneIcon,
  UserIcon,
  BuildingOfficeIcon,
  BanknotesIcon,
  ClipboardDocumentCheckIcon,
  CommandLineIcon,
  PhotoIcon,
  MicrophoneIcon,
  SpeakerWaveIcon
} from '@heroicons/react/24/outline';

interface AgentConfig {
  name: string;
  description: string;
  skills: string[];
  features: string[];
  integrations: string[];
  agentType?: string;
  price?: number;
}

interface DashboardPreviewEnhancedProps {
  agentConfig: AgentConfig;
  versionInfo?: {
    current: number;
    total: number;
  };
}

// Map skills to UI components and features
const SKILL_UI_MAPPING: Record<string, any> = {
  // Communication Skills
  email_campaigns: {
    widgets: ['email-dashboard', 'campaign-metrics', 'email-composer'],
    tabs: ['Campaigns'],
    icon: EnvelopeIcon,
    primaryColor: 'blue'
  },
  voice_calls: {
    widgets: ['call-log', 'voip-dialer', 'call-analytics'],
    tabs: ['Communications'],
    icon: PhoneIcon,
    primaryColor: 'green'
  },
  video_conferencing: {
    widgets: ['meeting-scheduler', 'video-room', 'recording-library'],
    tabs: ['Meetings'],
    icon: VideoCameraIcon,
    primaryColor: 'purple'
  },
  chatbot: {
    widgets: ['chat-interface', 'conversation-history', 'bot-analytics'],
    tabs: ['Chat'],
    icon: ChatBubbleLeftRightIcon,
    primaryColor: 'indigo'
  },

  // Sales & CRM Skills
  lead_management: {
    widgets: ['lead-pipeline', 'lead-scoring', 'lead-activities'],
    tabs: ['Leads'],
    icon: UserGroupIcon,
    primaryColor: 'orange'
  },
  sales_pipeline: {
    widgets: ['deal-board', 'revenue-forecast', 'sales-activities'],
    tabs: ['Pipeline'],
    icon: ChartBarIcon,
    primaryColor: 'cyan'
  },
  contact_management: {
    widgets: ['contact-grid', 'contact-timeline', 'contact-insights'],
    tabs: ['Contacts'],
    icon: UserIcon,
    primaryColor: 'teal'
  },

  // Analytics Skills
  data_analytics: {
    widgets: ['metrics-dashboard', 'custom-reports', 'data-explorer'],
    tabs: ['Analytics'],
    icon: ChartPieIcon,
    primaryColor: 'yellow'
  },
  predictive_analytics: {
    widgets: ['prediction-models', 'trend-forecast', 'ai-insights'],
    tabs: ['Predictions'],
    icon: SparklesIcon,
    primaryColor: 'pink'
  },

  // Automation Skills
  workflow_automation: {
    widgets: ['workflow-builder', 'automation-log', 'trigger-manager'],
    tabs: ['Automations'],
    icon: BoltIcon,
    primaryColor: 'red'
  },
  ai_automation: {
    widgets: ['ai-tasks', 'model-performance', 'automation-insights'],
    tabs: ['AI Automation'],
    icon: CpuChipIcon,
    primaryColor: 'violet'
  },

  // Content Skills
  content_generator: {
    widgets: ['content-editor', 'content-library', 'content-calendar'],
    tabs: ['Content'],
    icon: DocumentTextIcon,
    primaryColor: 'amber'
  },
  image_generation: {
    widgets: ['image-gallery', 'ai-generator', 'image-editor'],
    tabs: ['Images'],
    icon: PhotoIcon,
    primaryColor: 'emerald'
  },

  // Integration Skills
  api_integrations: {
    widgets: ['api-monitor', 'webhook-manager', 'integration-status'],
    tabs: ['Integrations'],
    icon: ServerStackIcon,
    primaryColor: 'slate'
  },
  cloud_storage: {
    widgets: ['file-manager', 'storage-metrics', 'sync-status'],
    tabs: ['Storage'],
    icon: CloudArrowUpIcon,
    primaryColor: 'sky'
  }
};

// Map features to UI enhancements
const FEATURE_UI_ENHANCEMENTS: Record<string, any> = {
  ai_chatbot: {
    floatingAssistant: true,
    smartSuggestions: true,
    naturalLanguageCommands: true
  },
  voice_assistant: {
    voiceCommands: true,
    audioFeedback: true,
    speechToText: true
  },
  white_label: {
    customBranding: true,
    themePicker: true,
    logoUpload: true
  },
  multi_language: {
    languageSelector: true,
    autoTranslation: true,
    localization: true
  },
  advanced_security: {
    mfaEnabled: true,
    encryptionBadge: true,
    auditLog: true
  },
  api_access: {
    apiDocumentation: true,
    apiKeyManager: true,
    rateLimiting: true
  },
  custom_workflows: {
    workflowDesigner: true,
    conditionalLogic: true,
    customTriggers: true
  },
  unlimited_usage: {
    nolimits: true,
    priorityProcessing: true,
    dedicatedResources: true
  }
};

// Generate dynamic widgets based on configuration
const generateDynamicWidgets = (config: AgentConfig) => {
  const widgets: any[] = [];
  const tabs: Set<string> = new Set(['Overview']); // Always have Overview

  // Process skills
  config.skills.forEach(skillId => {
    const skillUI = SKILL_UI_MAPPING[skillId];
    if (skillUI) {
      skillUI.widgets.forEach((widgetId: string) => {
        widgets.push({
          id: widgetId,
          skillId,
          ...skillUI
        });
      });
      skillUI.tabs.forEach((tab: string) => tabs.add(tab));
    }
  });

  // Process features for UI enhancements
  const enhancements: any = {};
  config.features.forEach(featureId => {
    const featureUI = FEATURE_UI_ENHANCEMENTS[featureId];
    if (featureUI) {
      Object.assign(enhancements, featureUI);
    }
  });

  return { widgets, tabs: Array.from(tabs), enhancements };
};

export const DashboardPreviewEnhanced: React.FC<DashboardPreviewEnhancedProps> = ({
  agentConfig,
  versionInfo
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [previewData, setPreviewData] = useState<any>(null);

  // Generate UI configuration based on agent config
  const { widgets, tabs, enhancements } = useMemo(() =>
    generateDynamicWidgets(agentConfig), [agentConfig]
  );

  // Fetch AI-generated preview data
  useEffect(() => {
    const fetchPreviewData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/dashboard/preview-generator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agentConfig })
        });

        if (response.ok) {
          const data = await response.json();
          setPreviewData(data);
        }
      } catch (error) {
        console.error('Failed to fetch preview data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreviewData();
  }, [agentConfig]);

  const renderSkillWidget = (widget: any) => {
    const Icon = widget.icon || CogIcon;
    const color = widget.primaryColor || 'gray';

    return (
      <div
        className={`bg-white rounded-lg p-4 shadow-sm border-2 hover:shadow-lg transition-all cursor-pointer`}
        style={{ borderColor: `var(--color-${color}-200)` }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 text-${color}-500`} />
            <span className="font-semibold text-gray-900">
              {widget.id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </div>
          <span className={`text-xs px-2 py-1 bg-${color}-50 text-${color}-700 rounded-full`}>
            {widget.skillId.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Dynamic content based on widget type */}
        {widget.id.includes('pipeline') && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Active Deals</span>
              <span className="font-bold">24</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Value</span>
              <span className="font-bold">£450K</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div className={`bg-${color}-500 h-2 rounded-full`} style={{width: '65%'}}></div>
            </div>
          </div>
        )}

        {widget.id.includes('metrics') && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            {['Growth', 'Efficiency', 'Quality', 'Speed'].map(metric => (
              <div key={metric} className="text-center p-2 bg-gray-50 rounded">
                <div className="text-lg font-bold">{Math.floor(Math.random() * 100)}%</div>
                <div className="text-xs text-gray-500">{metric}</div>
              </div>
            ))}
          </div>
        )}

        {widget.id.includes('composer') || widget.id.includes('editor') && (
          <div className="mt-3 space-y-2">
            <div className="h-20 bg-gray-50 rounded p-2 text-sm text-gray-600">
              <div className="animate-pulse">
                <div className="h-2 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-2 bg-gray-300 rounded w-1/2 mb-2"></div>
                <div className="h-2 bg-gray-300 rounded w-2/3"></div>
              </div>
            </div>
            <button className={`w-full py-2 bg-${color}-500 text-white rounded hover:bg-${color}-600 transition text-sm`}>
              Create New
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'rgb(30, 33, 33)' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{agentConfig.name || 'AI Agent'} Dashboard</h1>
            <p className="text-sm opacity-90 mt-1">{agentConfig.description}</p>
          </div>
          <div className="flex items-center gap-3">
            {versionInfo && (
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                Version {versionInfo.current}/{versionInfo.total}
              </span>
            )}
            <span className="px-3 py-1 bg-green-400/30 rounded-full text-sm flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              Live Preview
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ backgroundColor: 'rgb(36, 40, 40)' }}>
        <div className="px-6 flex gap-1 pt-2">
          {tabs.map((tab, idx) => (
            <button
              key={tab}
              onClick={() => setActiveTab(idx)}
              className={`px-4 py-2 rounded-t-lg transition ${
                idx === activeTab
                  ? 'bg-gray-50 text-gray-900'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-gray-50 p-6 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <SparklesIcon className="w-12 h-12 text-gray-400 mx-auto mb-3 animate-pulse" />
              <p className="text-gray-600">Generating AI-powered preview...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {widgets
              .filter(w => tabs[activeTab] === 'Overview' || SKILL_UI_MAPPING[w.skillId]?.tabs.includes(tabs[activeTab]))
              .map(widget => (
                <div key={widget.id}>
                  {renderSkillWidget(widget)}
                </div>
              ))}
          </div>
        )}

        {/* Feature Enhancements */}
        {enhancements.floatingAssistant && (
          <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-xl p-4 w-80 border-2 border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-500" />
              <span className="font-semibold">AI Assistant</span>
              <div className="ml-auto w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div className="bg-blue-50 rounded p-3 text-sm text-blue-700 mb-3">
              I can help you manage {agentConfig.skills.length} skills across your dashboard!
            </div>
            {enhancements.voiceCommands && (
              <button className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition">
                <MicrophoneIcon className="w-4 h-4" />
                Voice Command Mode
              </button>
            )}
          </div>
        )}

        {enhancements.customBranding && (
          <div className="fixed top-20 right-6 bg-white rounded-lg shadow p-3">
            <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
              <PhotoIcon className="w-4 h-4" />
              Customize Branding
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPreviewEnhanced;