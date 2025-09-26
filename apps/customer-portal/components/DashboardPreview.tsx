'use client';

import React, { useMemo } from 'react';
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
  CogIcon
} from '@heroicons/react/24/outline';

interface Skill {
  id: string;
  name: string;
  category: string;
}

interface DashboardPreviewProps {
  selectedSkills: Skill[];
  agentName?: string;
  requirements?: {
    goal?: string;
    industry?: string;
  };
}

interface Widget {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'list' | 'calendar' | 'chat';
  title: string;
  icon: any;
  width: number;
  height: number;
  data?: any;
}

interface Tab {
  id: string;
  name: string;
  icon: any;
  widgets: Widget[];
}

export const DashboardPreview: React.FC<DashboardPreviewProps> = ({
  selectedSkills,
  agentName = 'Your Custom Agent',
  requirements
}) => {
  const [activeTab, setActiveTab] = React.useState(0);

  // Generate dashboard layout based on selected skills
  const dashboardTabs = useMemo(() => {
    const tabs: Tab[] = [];
    const skillCategories = new Set(selectedSkills.map(s => s.category));

    // Overview Tab (always present)
    const overviewWidgets: Widget[] = [
      {
        id: 'kpi-total',
        type: 'kpi',
        title: 'Total Activities',
        icon: ChartBarIcon,
        width: 3,
        height: 1,
        data: { value: '1,234', trend: '+12%' }
      },
      {
        id: 'kpi-success',
        type: 'kpi',
        title: 'Success Rate',
        icon: ArrowTrendingUpIcon,
        width: 3,
        height: 1,
        data: { value: '94%', trend: '+5%' }
      }
    ];

    // Add KPIs based on categories
    if (skillCategories.has('sales')) {
      overviewWidgets.push(
        {
          id: 'kpi-leads',
          type: 'kpi',
          title: 'Active Leads',
          icon: UserGroupIcon,
          width: 3,
          height: 1,
          data: { value: '456', trend: '+23%' }
        },
        {
          id: 'kpi-revenue',
          type: 'kpi',
          title: 'Pipeline Value',
          icon: CurrencyPoundIcon,
          width: 3,
          height: 1,
          data: { value: '£125K', trend: '+18%' }
        }
      );
    }

    if (skillCategories.has('communication')) {
      overviewWidgets.push({
        id: 'kpi-emails',
        type: 'kpi',
        title: 'Emails Sent',
        icon: EnvelopeIcon,
        width: 3,
        height: 1,
        data: { value: '892', trend: '+34%' }
      });
    }

    // Add main chart
    overviewWidgets.push({
      id: 'main-chart',
      type: 'chart',
      title: 'Performance Trend',
      icon: ChartBarIcon,
      width: 8,
      height: 2,
      data: { type: 'line' }
    });

    // Add activity list
    overviewWidgets.push({
      id: 'recent-activity',
      type: 'list',
      title: 'Recent Activity',
      icon: ClockIcon,
      width: 4,
      height: 2,
      data: {
        items: [
          'Lead qualified: John Smith (Company ABC)',
          'Email campaign sent: Q1 Product Launch',
          'Meeting scheduled: Demo call tomorrow',
          'Report generated: Weekly sales summary'
        ]
      }
    });

    tabs.push({
      id: 'overview',
      name: 'Overview',
      icon: ChartBarIcon,
      widgets: overviewWidgets
    });

    // Sales/Leads Tab
    if (skillCategories.has('sales') || selectedSkills.some(s => s.id.includes('lead'))) {
      tabs.push({
        id: 'leads',
        name: 'Leads & Contacts',
        icon: UserGroupIcon,
        widgets: [
          {
            id: 'leads-table',
            type: 'table',
            title: 'Lead Pipeline',
            icon: TableCellsIcon,
            width: 12,
            height: 3,
            data: {
              headers: ['Name', 'Company', 'Score', 'Stage', 'Value', 'Next Action'],
              rows: [
                ['Sarah Johnson', 'Tech Corp', '95', 'Qualified', '£45,000', 'Schedule Demo'],
                ['Michael Chen', 'StartupXYZ', '88', 'Contacted', '£30,000', 'Send Follow-up'],
                ['Emma Williams', 'BigCo Ltd', '92', 'Proposal', '£75,000', 'Review Contract'],
                ['David Brown', 'SMB Inc', '76', 'New', '£20,000', 'Initial Outreach']
              ]
            }
          },
          {
            id: 'lead-chart',
            type: 'chart',
            title: 'Lead Sources',
            icon: ChartBarIcon,
            width: 6,
            height: 2,
            data: { type: 'pie' }
          },
          {
            id: 'lead-conversion',
            type: 'chart',
            title: 'Conversion Funnel',
            icon: DocumentChartBarIcon,
            width: 6,
            height: 2,
            data: { type: 'funnel' }
          }
        ]
      });
    }

    // Campaigns Tab
    if (skillCategories.has('communication') || skillCategories.has('content')) {
      tabs.push({
        id: 'campaigns',
        name: 'Campaigns',
        icon: EnvelopeIcon,
        widgets: [
          {
            id: 'active-campaigns',
            type: 'table',
            title: 'Active Campaigns',
            icon: TableCellsIcon,
            width: 12,
            height: 2,
            data: {
              headers: ['Campaign', 'Status', 'Sent', 'Opens', 'Clicks', 'Conversions'],
              rows: [
                ['Q1 Product Launch', 'Active', '5,234', '68%', '12%', '3.4%'],
                ['Customer Retention', 'Scheduled', '0', '-', '-', '-'],
                ['Holiday Special', 'Draft', '0', '-', '-', '-']
              ]
            }
          },
          {
            id: 'email-performance',
            type: 'chart',
            title: 'Email Performance',
            icon: ChartBarIcon,
            width: 8,
            height: 2,
            data: { type: 'bar' }
          },
          {
            id: 'upcoming-sends',
            type: 'calendar',
            title: 'Scheduled Sends',
            icon: CalendarIcon,
            width: 4,
            height: 2,
            data: {
              events: [
                'Mon: Newsletter',
                'Wed: Follow-ups',
                'Fri: Weekly Report'
              ]
            }
          }
        ]
      });
    }

    // Analytics Tab
    if (skillCategories.has('analytics')) {
      tabs.push({
        id: 'analytics',
        name: 'Analytics',
        icon: DocumentChartBarIcon,
        widgets: [
          {
            id: 'metrics-grid',
            type: 'kpi',
            title: 'Key Metrics',
            icon: ChartBarIcon,
            width: 12,
            height: 1,
            data: { grid: true }
          },
          {
            id: 'trends',
            type: 'chart',
            title: 'Trend Analysis',
            icon: ArrowTrendingUpIcon,
            width: 8,
            height: 2,
            data: { type: 'multi-line' }
          },
          {
            id: 'insights',
            type: 'list',
            title: 'AI Insights',
            icon: MagnifyingGlassIcon,
            width: 4,
            height: 2,
            data: {
              items: [
                '📈 Lead conversion up 23% this week',
                '🎯 Best performing email subject: "Quick question"',
                '⚡ Optimal send time: Tuesday 10am',
                '💡 Recommendation: Focus on enterprise leads'
              ]
            }
          }
        ]
      });
    }

    // Automation Tab
    if (skillCategories.has('automation')) {
      tabs.push({
        id: 'automation',
        name: 'Automations',
        icon: CogIcon,
        widgets: [
          {
            id: 'workflow-status',
            type: 'table',
            title: 'Active Workflows',
            icon: TableCellsIcon,
            width: 12,
            height: 2,
            data: {
              headers: ['Workflow', 'Status', 'Executions Today', 'Success Rate', 'Next Run'],
              rows: [
                ['Lead Scoring', '🟢 Active', '145', '98%', 'In 5 min'],
                ['Email Sequences', '🟢 Active', '89', '100%', 'In 1 hour'],
                ['Data Sync', '🟡 Running', '12', '95%', 'Now'],
                ['Report Generation', '🟢 Active', '4', '100%', 'Tomorrow 9am']
              ]
            }
          }
        ]
      });
    }

    return tabs;
  }, [selectedSkills]);

  // Render a widget based on its type
  const renderWidget = (widget: Widget) => {
    const WidgetIcon = widget.icon;

    switch (widget.type) {
      case 'kpi':
        return (
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">{widget.title}</span>
              <WidgetIcon className="w-4 h-4 text-gray-400" />
            </div>
            {widget.data?.grid ? (
              <div className="grid grid-cols-4 gap-4">
                {['Revenue', 'Customers', 'Growth', 'Efficiency'].map(metric => (
                  <div key={metric} className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {Math.floor(Math.random() * 900 + 100)}
                    </div>
                    <div className="text-xs text-gray-500">{metric}</div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-900">{widget.data?.value || '0'}</div>
                {widget.data?.trend && (
                  <div className={`text-sm ${widget.data.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {widget.data.trend} from last period
                  </div>
                )}
              </>
            )}
          </div>
        );

      case 'chart':
        return (
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium text-gray-900">{widget.title}</span>
              <WidgetIcon className="w-4 h-4 text-gray-400" />
            </div>
            <div className="h-full flex items-center justify-center bg-gray-50 rounded">
              <div className="text-center">
                <ChartBarIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <span className="text-sm text-gray-500">
                  {widget.data?.type || 'Chart'} visualization
                </span>
              </div>
            </div>
          </div>
        );

      case 'table':
        return (
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium text-gray-900">{widget.title}</span>
              <WidgetIcon className="w-4 h-4 text-gray-400" />
            </div>
            {widget.data?.headers && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {widget.data.headers.map((header: string, idx: number) => (
                        <th key={idx} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {widget.data.rows?.slice(0, 4).map((row: string[], ridx: number) => (
                      <tr key={ridx}>
                        {row.map((cell: string, cidx: number) => (
                          <td key={cidx} className="px-3 py-2 text-sm text-gray-900">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      case 'list':
        return (
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium text-gray-900">{widget.title}</span>
              <WidgetIcon className="w-4 h-4 text-gray-400" />
            </div>
            <ul className="space-y-2">
              {widget.data?.items?.map((item: string, idx: number) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        );

      case 'calendar':
        return (
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium text-gray-900">{widget.title}</span>
              <WidgetIcon className="w-4 h-4 text-gray-400" />
            </div>
            <div className="space-y-2">
              {widget.data?.events?.map((event: string, idx: number) => (
                <div key={idx} className="text-sm text-gray-700 flex items-center">
                  <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
                  {event}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="text-center text-gray-500">
              <WidgetIcon className="w-8 h-8 mx-auto mb-2" />
              <span className="text-sm">{widget.title}</span>
            </div>
          </div>
        );
    }
  };

  const currentTab = dashboardTabs[activeTab] || dashboardTabs[0];

  return (
    <div className="h-full flex flex-col bg-gray-50 rounded-lg shadow-lg overflow-hidden">
      {/* Dashboard Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{agentName} Dashboard</h2>
            <p className="text-sm text-gray-500 mt-1">
              {requirements?.goal || 'Your custom AI-powered workspace'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              Live Preview
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              {selectedSkills.length} Skills Active
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="px-6">
          <nav className="flex space-x-8">
            {dashboardTabs.map((tab, idx) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(idx)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition flex items-center gap-2 ${
                    idx === activeTab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Quick Actions Bar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2">
              <PlusIcon className="w-4 h-4" />
              New {currentTab.name === 'Leads & Contacts' ? 'Lead' : 'Item'}
            </button>
            <button className="px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition">
              Export
            </button>
            <button className="px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition">
              Filter
            </button>
          </div>
          <div className="flex items-center gap-2">
            <BellIcon className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-500">Last updated: Just now</span>
          </div>
        </div>

        {/* Widget Grid */}
        <div className="grid grid-cols-12 gap-4">
          {currentTab.widgets.map(widget => (
            <div
              key={widget.id}
              className={`col-span-${widget.width}`}
              style={{ gridColumn: `span ${widget.width} / span ${widget.width}` }}
            >
              {renderWidget(widget)}
            </div>
          ))}
        </div>

        {/* AI Assistant Preview */}
        {selectedSkills.some(s => s.category === 'communication' || s.category === 'automation') && (
          <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg p-4 w-80 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-gray-900">AI Assistant</span>
              <span className="ml-auto w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
            <div className="space-y-2 text-sm">
              <div className="bg-gray-100 rounded-lg p-2 text-gray-700">
                👋 Hi! I'm your AI assistant. I can help you with:
              </div>
              <div className="bg-blue-50 rounded-lg p-2 text-blue-700">
                • Managing your {currentTab.name.toLowerCase()}<br/>
                • Analyzing performance metrics<br/>
                • Automating repetitive tasks<br/>
                • Generating reports and insights
              </div>
            </div>
            <input
              type="text"
              placeholder="Ask me anything..."
              className="w-full mt-3 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>
    </div>
  );
};



export default DashboardPreview;