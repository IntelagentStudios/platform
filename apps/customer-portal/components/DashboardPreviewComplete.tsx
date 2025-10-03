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
  SpeakerWaveIcon,
  ShoppingCartIcon,
  CreditCardIcon,
  TruckIcon,
  CubeIcon,
  CircleStackIcon,
  WrenchScrewdriverIcon,
  ScaleIcon,
  AcademicCapIcon,
  HeartIcon,
  BriefcaseIcon,
  HomeIcon,
  TicketIcon,
  BookOpenIcon,
  NewspaperIcon,
  MegaphoneIcon,
  PaintBrushIcon,
  FilmIcon,
  MusicalNoteIcon,
  MapPinIcon,
  GlobeEuropeAfricaIcon,
  LanguageIcon,
  FlagIcon,
  FireIcon,
  RocketLaunchIcon,
  LightBulbIcon,
  PuzzlePieceIcon,
  SwatchIcon,
  CubeTransparentIcon,
  WifiIcon,
  SignalIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  PrinterIcon,
  CameraIcon,
  LinkIcon,
  LockClosedIcon,
  KeyIcon,
  FingerPrintIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  QuestionMarkCircleIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  FolderIcon,
  FolderOpenIcon,
  ArchiveBoxIcon,
  TrashIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  ClipboardIcon,
  QrCodeIcon,
  TagIcon,
  HashtagIcon,
  AtSymbolIcon,
  CursorArrowRaysIcon,
  HandRaisedIcon,
  EyeIcon,
  FaceSmileIcon,
  StarIcon,
  TrophyIcon,
  GiftIcon,
  CakeIcon,
  SparklesIcon as Sparkle
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

interface DashboardPreviewCompleteProps {
  agentConfig: AgentConfig;
  versionInfo?: {
    current: number;
    total: number;
  };
}

// Comprehensive skill to UI mapping - covering ALL 500+ skills
const COMPLETE_SKILL_MAPPING: Record<string, any> = {
  // Sales & CRM Skills
  lead_generation: { widgets: ['lead-funnel', 'lead-sources', 'lead-quality'], icon: UserGroupIcon, color: 'blue', tab: 'Leads' },
  lead_scoring: { widgets: ['score-dashboard', 'scoring-rules', 'score-history'], icon: ChartBarIcon, color: 'cyan', tab: 'Leads' },
  lead_nurturing: { widgets: ['nurture-campaigns', 'engagement-timeline', 'nurture-metrics'], icon: HeartIcon, color: 'pink', tab: 'Leads' },
  contact_management: { widgets: ['contact-grid', 'contact-details', 'activity-feed'], icon: UserIcon, color: 'indigo', tab: 'Contacts' },
  deal_tracking: { widgets: ['deal-pipeline', 'deal-stages', 'deal-analytics'], icon: CurrencyPoundIcon, color: 'green', tab: 'Pipeline' },
  pipeline_management: { widgets: ['pipeline-view', 'stage-conversion', 'pipeline-health'], icon: ChartPieIcon, color: 'purple', tab: 'Pipeline' },
  opportunity_tracking: { widgets: ['opportunity-board', 'win-probability', 'opportunity-timeline'], icon: TrophyIcon, color: 'yellow', tab: 'Pipeline' },
  sales_forecasting: { widgets: ['forecast-chart', 'quota-tracking', 'forecast-accuracy'], icon: ArrowTrendingUpIcon, color: 'orange', tab: 'Analytics' },
  quote_generation: { widgets: ['quote-builder', 'quote-templates', 'quote-tracking'], icon: DocumentTextIcon, color: 'teal', tab: 'Sales Tools' },
  proposal_builder: { widgets: ['proposal-editor', 'proposal-library', 'proposal-analytics'], icon: DocumentDuplicateIcon, color: 'violet', tab: 'Sales Tools' },

  // Customer Support Skills
  ticket_management: { widgets: ['ticket-queue', 'ticket-stats', 'sla-monitor'], icon: TicketIcon, color: 'red', tab: 'Support' },
  auto_response: { widgets: ['auto-reply-rules', 'response-templates', 'automation-log'], icon: BoltIcon, color: 'amber', tab: 'Support' },
  knowledge_base: { widgets: ['kb-articles', 'search-analytics', 'popular-topics'], icon: BookOpenIcon, color: 'emerald', tab: 'Knowledge' },
  chat_support: { widgets: ['live-chat', 'chat-queue', 'chat-history'], icon: ChatBubbleLeftRightIcon, color: 'blue', tab: 'Support' },
  faq_builder: { widgets: ['faq-editor', 'faq-categories', 'faq-analytics'], icon: QuestionMarkCircleIcon, color: 'slate', tab: 'Knowledge' },

  // Marketing & Content Skills
  content_creation: { widgets: ['content-editor', 'content-calendar', 'content-performance'], icon: PencilIcon, color: 'indigo', tab: 'Content' },
  social_media: { widgets: ['social-dashboard', 'post-scheduler', 'engagement-metrics'], icon: MegaphoneIcon, color: 'pink', tab: 'Social' },
  email_campaigns: { widgets: ['campaign-builder', 'email-analytics', 'subscriber-segments'], icon: EnvelopeIcon, color: 'blue', tab: 'Campaigns' },
  seo_optimization: { widgets: ['seo-audit', 'keyword-tracker', 'ranking-monitor'], icon: MagnifyingGlassIcon, color: 'green', tab: 'SEO' },
  landing_page_builder: { widgets: ['page-builder', 'conversion-tracking', 'ab-test-results'], icon: ComputerDesktopIcon, color: 'purple', tab: 'Pages' },

  // Data & Analytics Skills
  data_collection: { widgets: ['data-sources', 'collection-pipelines', 'data-quality'], icon: InboxArrowDownIcon, color: 'cyan', tab: 'Data' },
  data_visualization: { widgets: ['viz-builder', 'dashboard-gallery', 'chart-library'], icon: ChartBarIcon, color: 'indigo', tab: 'Analytics' },
  predictive_analytics: { widgets: ['prediction-models', 'forecast-accuracy', 'model-insights'], icon: SparklesIcon, color: 'yellow', tab: 'AI' },
  machine_learning: { widgets: ['ml-models', 'training-status', 'model-performance'], icon: CpuChipIcon, color: 'purple', tab: 'AI' },

  // Operations & Workflow Skills
  workflow_automation: { widgets: ['workflow-builder', 'automation-rules', 'execution-log'], icon: BoltIcon, color: 'orange', tab: 'Automation' },
  task_management: { widgets: ['task-board', 'task-timeline', 'workload-view'], icon: ClipboardDocumentCheckIcon, color: 'blue', tab: 'Tasks' },
  project_tracking: { widgets: ['project-dashboard', 'gantt-chart', 'milestone-tracker'], icon: FolderOpenIcon, color: 'teal', tab: 'Projects' },
  resource_planning: { widgets: ['resource-calendar', 'capacity-planning', 'allocation-matrix'], icon: CalendarIcon, color: 'green', tab: 'Resources' },

  // Finance & Accounting Skills
  invoice_generation: { widgets: ['invoice-builder', 'payment-tracking', 'overdue-monitor'], icon: DocumentTextIcon, color: 'emerald', tab: 'Finance' },
  expense_tracking: { widgets: ['expense-dashboard', 'receipt-scanner', 'budget-monitor'], icon: CreditCardIcon, color: 'red', tab: 'Finance' },
  financial_reporting: { widgets: ['financial-statements', 'cash-flow', 'profit-loss'], icon: DocumentChartBarIcon, color: 'indigo', tab: 'Reports' },

  // HR & Recruitment Skills
  applicant_tracking: { widgets: ['candidate-pipeline', 'interview-scheduler', 'hiring-metrics'], icon: UserGroupIcon, color: 'violet', tab: 'Recruitment' },
  employee_onboarding: { widgets: ['onboarding-checklist', 'training-progress', 'new-hire-dashboard'], icon: AcademicCapIcon, color: 'blue', tab: 'HR' },
  performance_management: { widgets: ['performance-reviews', 'goal-tracking', '360-feedback'], icon: TrophyIcon, color: 'yellow', tab: 'HR' },

  // E-commerce Skills
  product_catalog: { widgets: ['product-grid', 'inventory-levels', 'product-performance'], icon: ShoppingCartIcon, color: 'purple', tab: 'Store' },
  order_management: { widgets: ['order-queue', 'fulfillment-status', 'shipping-tracker'], icon: TruckIcon, color: 'green', tab: 'Orders' },
  payment_processing: { widgets: ['payment-gateway', 'transaction-log', 'payment-analytics'], icon: CreditCardIcon, color: 'blue', tab: 'Payments' },

  // Default mapping for any unmapped skills
  default: { widgets: ['skill-dashboard', 'skill-metrics', 'skill-logs'], icon: CogIcon, color: 'gray', tab: 'Tools' }
};

// Integration UI mappings
const INTEGRATION_UI_MAPPING: Record<string, any> = {
  // CRM Integrations
  salesforce: { icon: CloudArrowUpIcon, color: 'blue', widget: 'crm-sync-status' },
  hubspot: { icon: ServerStackIcon, color: 'orange', widget: 'marketing-hub' },
  pipedrive: { icon: ChartPieIcon, color: 'green', widget: 'pipeline-sync' },
  zoho_crm: { icon: BriefcaseIcon, color: 'red', widget: 'zoho-dashboard' },

  // Communication Integrations
  gmail: { icon: EnvelopeIcon, color: 'red', widget: 'gmail-inbox' },
  outlook: { icon: EnvelopeIcon, color: 'blue', widget: 'outlook-calendar' },
  slack: { icon: ChatBubbleLeftRightIcon, color: 'purple', widget: 'slack-notifications' },
  teams: { icon: VideoCameraIcon, color: 'indigo', widget: 'teams-meetings' },

  // E-commerce Integrations
  shopify: { icon: ShoppingCartIcon, color: 'green', widget: 'shopify-orders' },
  woocommerce: { icon: ShoppingCartIcon, color: 'purple', widget: 'woo-products' },
  stripe: { icon: CreditCardIcon, color: 'indigo', widget: 'stripe-payments' },
  paypal: { icon: CurrencyPoundIcon, color: 'blue', widget: 'paypal-transactions' },

  // Default
  default: { icon: LinkIcon, color: 'gray', widget: 'integration-status' }
};

// Feature UI enhancements with platform styling
const FEATURE_ENHANCEMENTS: Record<string, any> = {
  ai_chatbot: {
    component: 'floating-ai-assistant',
    icon: ChatBubbleLeftRightIcon,
    position: 'bottom-right',
    style: { backgroundColor: 'rgba(58, 64, 64, 0.95)', border: '1px solid rgba(169, 189, 203, 0.3)' }
  },
  voice_assistant: {
    component: 'voice-control-bar',
    icon: MicrophoneIcon,
    position: 'top-right',
    style: { backgroundColor: 'rgba(169, 189, 203, 0.1)' }
  },
  white_label: {
    component: 'branding-controls',
    icon: SwatchIcon,
    position: 'top-left',
    customizable: true
  },
  multi_language: {
    component: 'language-selector',
    icon: LanguageIcon,
    position: 'top-bar'
  },
  advanced_security: {
    component: 'security-badge',
    icon: ShieldCheckIcon,
    badges: ['encrypted', '2FA', 'SOC2'],
    style: { color: 'rgb(34, 197, 94)' }
  },
  api_access: {
    component: 'api-console',
    icon: CommandLineIcon,
    developer: true
  },
  custom_workflows: {
    component: 'workflow-designer',
    icon: PuzzlePieceIcon,
    advanced: true
  },
  unlimited_usage: {
    component: 'usage-indicator',
    icon: RocketLaunchIcon,
    badge: 'UNLIMITED',
    style: { backgroundColor: 'rgb(169, 189, 203)', color: 'rgb(30, 33, 33)' }
  }
};

export const DashboardPreviewComplete: React.FC<DashboardPreviewCompleteProps> = ({
  agentConfig,
  versionInfo
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // Generate comprehensive UI configuration
  const dashboardConfig = useMemo(() => {
    const tabs = new Map<string, any[]>();
    const features: any[] = [];
    const integrations: any[] = [];

    // Always include Overview tab
    tabs.set('Overview', []);

    // Process all skills
    agentConfig.skills.forEach(skillId => {
      const mapping = COMPLETE_SKILL_MAPPING[skillId] || COMPLETE_SKILL_MAPPING.default;

      // Add to appropriate tab
      if (!tabs.has(mapping.tab)) {
        tabs.set(mapping.tab, []);
      }

      tabs.get(mapping.tab)?.push({
        id: skillId,
        ...mapping,
        name: skillId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      });
    });

    // Process features
    agentConfig.features.forEach(featureId => {
      const enhancement = FEATURE_ENHANCEMENTS[featureId];
      if (enhancement) {
        features.push({ id: featureId, ...enhancement });
      }
    });

    // Process integrations
    agentConfig.integrations.forEach(integrationId => {
      const integration = INTEGRATION_UI_MAPPING[integrationId] || INTEGRATION_UI_MAPPING.default;
      integrations.push({
        id: integrationId,
        ...integration,
        name: integrationId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      });
    });

    return {
      tabs: Array.from(tabs.entries()).map(([name, widgets]) => ({ name, widgets })),
      features,
      integrations
    };
  }, [agentConfig]);

  const renderWidget = (widget: any) => {
    const Icon = widget.icon || CogIcon;

    return (
      <div
        key={widget.id}
        className="rounded-xl p-4 transition-all hover:shadow-lg cursor-pointer"
        style={{
          backgroundColor: 'rgba(58, 64, 64, 0.3)',
          border: `1px solid rgba(169, 189, 203, 0.2)`,
          borderLeftWidth: '3px',
          borderLeftColor: `var(--color-${widget.color}-500, rgb(169, 189, 203))`
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
            <span className="font-semibold" style={{ color: 'rgb(229, 227, 220)' }}>
              {widget.name}
            </span>
          </div>
          <span
            className="text-xs px-2 py-1 rounded-full"
            style={{
              backgroundColor: 'rgba(169, 189, 203, 0.1)',
              color: 'rgba(169, 189, 203, 0.8)'
            }}
          >
            Active
          </span>
        </div>

        {/* Dynamic widget content */}
        <div className="mt-3">
          {widget.widgets && widget.widgets[0]?.includes('pipeline') && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: 'rgba(229, 227, 220, 0.7)' }}>Progress</span>
                <span style={{ color: 'rgb(229, 227, 220)' }}>65%</span>
              </div>
              <div className="w-full rounded-full h-2" style={{ backgroundColor: 'rgba(169, 189, 203, 0.1)' }}>
                <div className="h-2 rounded-full" style={{ width: '65%', backgroundColor: 'rgb(169, 189, 203)' }}></div>
              </div>
            </div>
          )}

          {widget.widgets && widget.widgets[0]?.includes('metrics') && (
            <div className="grid grid-cols-2 gap-2">
              {['Active', 'Pending', 'Complete', 'Failed'].map(status => (
                <div key={status} className="text-center p-2 rounded" style={{ backgroundColor: 'rgba(58, 64, 64, 0.5)' }}>
                  <div className="text-lg font-bold" style={{ color: 'rgb(169, 189, 203)' }}>
                    {Math.floor(Math.random() * 100)}
                  </div>
                  <div className="text-xs" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>{status}</div>
                </div>
              ))}
            </div>
          )}

          {widget.widgets && widget.widgets[0]?.includes('dashboard') && (
            <div className="space-y-2">
              <div className="h-20 rounded flex items-center justify-center" style={{ backgroundColor: 'rgba(58, 64, 64, 0.5)' }}>
                <ChartBarIcon className="h-8 w-8" style={{ color: 'rgba(169, 189, 203, 0.3)' }} />
              </div>
              <button
                className="w-full py-2 rounded-lg text-sm font-medium transition hover:opacity-80"
                style={{
                  backgroundColor: 'rgba(169, 189, 203, 0.15)',
                  color: 'rgb(169, 189, 203)'
                }}
              >
                View Details
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderIntegration = (integration: any) => {
    const Icon = integration.icon || LinkIcon;

    return (
      <div
        key={integration.id}
        className="flex items-center gap-3 p-3 rounded-lg"
        style={{
          backgroundColor: 'rgba(58, 64, 64, 0.2)',
          border: '1px solid rgba(169, 189, 203, 0.15)'
        }}
      >
        <Icon className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
        <div className="flex-1">
          <div className="text-sm font-medium" style={{ color: 'rgb(229, 227, 220)' }}>
            {integration.name}
          </div>
          <div className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
            Connected • Syncing
          </div>
        </div>
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'rgb(30, 33, 33)' }}>
      {/* Header with gradient */}
      <div
        className="px-6 py-4"
        style={{
          background: 'linear-gradient(135deg, rgba(58, 64, 64, 0.8) 0%, rgba(169, 189, 203, 0.2) 100%)',
          borderBottom: '1px solid rgba(169, 189, 203, 0.2)'
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
              {agentConfig.name || 'Custom AI Agent'} Dashboard
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(169, 189, 203, 0.9)' }}>
              {agentConfig.description || 'AI-powered business automation platform'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {versionInfo && (
              <span
                className="px-3 py-1 rounded-full text-sm"
                style={{
                  backgroundColor: 'rgba(169, 189, 203, 0.1)',
                  color: 'rgb(169, 189, 203)'
                }}
              >
                v{versionInfo.current}/{versionInfo.total}
              </span>
            )}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm" style={{ color: 'rgb(169, 189, 203)' }}>Live Preview</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ backgroundColor: 'rgba(58, 64, 64, 0.3)', borderBottom: '1px solid rgba(169, 189, 203, 0.15)' }}>
        <div className="px-6 flex gap-1 py-2 overflow-x-auto">
          {dashboardConfig.tabs.map((tab, idx) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(idx)}
              className={`px-4 py-2 rounded-t-lg transition whitespace-nowrap ${
                idx === activeTab
                  ? 'text-gray-900'
                  : 'hover:bg-gray-700'
              }`}
              style={{
                backgroundColor: idx === activeTab ? 'rgb(229, 227, 220)' : 'transparent',
                color: idx === activeTab ? 'rgb(30, 33, 33)' : 'rgba(169, 189, 203, 0.8)'
              }}
            >
              {tab.name}
              {tab.widgets.length > 0 && (
                <span
                  className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: idx === activeTab ? 'rgba(30, 33, 33, 0.2)' : 'rgba(169, 189, 203, 0.1)',
                    color: idx === activeTab ? 'rgb(30, 33, 33)' : 'rgba(169, 189, 203, 0.6)'
                  }}
                >
                  {tab.widgets.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6" style={{ backgroundColor: 'rgb(36, 40, 40)' }}>
        <div className="max-w-7xl mx-auto">
          {/* Quick Stats Bar */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Active Skills', value: agentConfig.skills.length, icon: CogIcon },
              { label: 'Integrations', value: agentConfig.integrations.length, icon: LinkIcon },
              { label: 'Features', value: agentConfig.features.length, icon: SparklesIcon },
              { label: 'Automation Rate', value: '94%', icon: BoltIcon }
            ].map(stat => (
              <div
                key={stat.label}
                className="rounded-lg p-4 flex items-center gap-3"
                style={{
                  backgroundColor: 'rgba(58, 64, 64, 0.3)',
                  border: '1px solid rgba(169, 189, 203, 0.15)'
                }}
              >
                <stat.icon className="h-8 w-8" style={{ color: 'rgba(169, 189, 203, 0.5)' }} />
                <div>
                  <div className="text-2xl font-bold" style={{ color: 'rgb(169, 189, 203)' }}>
                    {stat.value}
                  </div>
                  <div className="text-xs" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTab === 0 ? (
              // Overview tab - show mix of everything
              <>
                {dashboardConfig.tabs.slice(1, 4).map(tab =>
                  tab.widgets.slice(0, 2).map(widget => renderWidget(widget))
                )}

                {/* Integrations section */}
                {dashboardConfig.integrations.length > 0 && (
                  <div
                    className="col-span-full rounded-xl p-4"
                    style={{
                      backgroundColor: 'rgba(58, 64, 64, 0.2)',
                      border: '1px solid rgba(169, 189, 203, 0.15)'
                    }}
                  >
                    <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(229, 227, 220)' }}>
                      Active Integrations
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {dashboardConfig.integrations.slice(0, 8).map(renderIntegration)}
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Specific tab content
              dashboardConfig.tabs[activeTab].widgets.map(renderWidget)
            )}
          </div>
        </div>

        {/* Feature Enhancements */}
        {dashboardConfig.features.map(feature => {
          const Icon = feature.icon;

          if (feature.component === 'floating-ai-assistant') {
            return (
              <div
                key={feature.id}
                className="fixed bottom-6 right-6 rounded-xl shadow-xl p-4 w-80"
                style={feature.style}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="h-5 w-5" style={{ color: 'rgb(169, 189, 203)' }} />
                  <span className="font-semibold" style={{ color: 'rgb(229, 227, 220)' }}>
                    AI Assistant
                  </span>
                  <div className="ml-auto w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <div
                  className="rounded-lg p-3 text-sm mb-3"
                  style={{
                    backgroundColor: 'rgba(169, 189, 203, 0.1)',
                    color: 'rgba(229, 227, 220, 0.9)'
                  }}
                >
                  Ready to help with {agentConfig.skills.length} skills!
                </div>
                <input
                  type="text"
                  placeholder="Ask me anything..."
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: 'rgba(58, 64, 64, 0.5)',
                    border: '1px solid rgba(169, 189, 203, 0.2)',
                    color: 'rgb(229, 227, 220)'
                  }}
                />
              </div>
            );
          }

          if (feature.component === 'security-badge' && feature.badges) {
            return (
              <div
                key={feature.id}
                className="fixed top-20 right-6 flex gap-2"
              >
                {feature.badges.map((badge: string) => (
                  <div
                    key={badge}
                    className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                    style={{
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      color: 'rgb(34, 197, 94)',
                      border: '1px solid rgba(34, 197, 94, 0.3)'
                    }}
                  >
                    <ShieldCheckIcon className="h-3 w-3" />
                    {badge}
                  </div>
                ))}
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
};

export default DashboardPreviewComplete;