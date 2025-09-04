'use client';

import React from 'react';
import { 
  Zap, 
  GitBranch, 
  Activity,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Cpu,
  Database,
  Shield,
  TrendingUp,
  Users,
  DollarSign,
  Link,
  MessageSquare,
  Settings
} from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'available' | 'coming_soon';
  agent?: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  skills: Skill[];
  category: string;
  icon: React.ElementType;
  color: string;
}

interface WorkflowDisplayProps {
  productId: string;
  activeWorkflows?: string[];
}

const WorkflowDisplay: React.FC<WorkflowDisplayProps> = ({ productId, activeWorkflows = [] }) => {
  // Define all workflows with their skills
  const workflows: Record<string, Workflow[]> = {
    chatbot: [
      {
        id: 'customer_engagement',
        name: 'Customer Engagement',
        description: 'Intelligent conversation handling with context awareness',
        category: 'Communication',
        icon: MessageSquare,
        color: '#667eea',
        skills: [
          { id: 'nlp_processor', name: 'NLP Processor', category: 'AI', status: 'active', agent: 'Analytics' },
          { id: 'sentiment_analyzer', name: 'Sentiment Analyzer', category: 'AI', status: 'active', agent: 'Analytics' },
          { id: 'response_generator', name: 'Response Generator', category: 'AI', status: 'active', agent: 'Communications' },
          { id: 'context_manager', name: 'Context Manager', category: 'Data', status: 'active', agent: 'Operations' },
          { id: 'entity_recognizer', name: 'Entity Recognizer', category: 'AI', status: 'active', agent: 'Analytics' }
        ]
      },
      {
        id: 'support_automation',
        name: 'Support Automation',
        description: 'Automated ticket management and issue resolution',
        category: 'Support',
        icon: Users,
        color: '#10b981',
        skills: [
          { id: 'ticket_manager', name: 'Ticket Manager', category: 'Support', status: 'active', agent: 'Operations' },
          { id: 'escalation_manager', name: 'Escalation Manager', category: 'Support', status: 'active', agent: 'Operations' },
          { id: 'knowledge_base', name: 'Knowledge Base', category: 'Data', status: 'active', agent: 'Operations' },
          { id: 'auto_responder', name: 'Auto Responder', category: 'Communication', status: 'active', agent: 'Communications' }
        ]
      },
      {
        id: 'analytics_reporting',
        name: 'Analytics & Insights',
        description: 'Conversation analytics and performance tracking',
        category: 'Analytics',
        icon: TrendingUp,
        color: '#f59e0b',
        skills: [
          { id: 'conversation_tracker', name: 'Conversation Tracker', category: 'Analytics', status: 'active', agent: 'Analytics' },
          { id: 'metrics_collector', name: 'Metrics Collector', category: 'Analytics', status: 'active', agent: 'Analytics' },
          { id: 'report_generator', name: 'Report Generator', category: 'Reporting', status: 'active', agent: 'Operations' },
          { id: 'dashboard_builder', name: 'Dashboard Builder', category: 'UI', status: 'active', agent: 'Operations' }
        ]
      }
    ],
    'sales-agent': [
      {
        id: 'lead_generation',
        name: 'Lead Generation',
        description: 'Automated lead discovery and qualification',
        category: 'Sales',
        icon: Users,
        color: '#8b5cf6',
        skills: [
          { id: 'web_scraper', name: 'Web Scraper', category: 'Data', status: 'active', agent: 'Operations' },
          { id: 'data_enricher', name: 'Data Enricher', category: 'Data', status: 'active', agent: 'Operations' },
          { id: 'lead_scorer', name: 'Lead Scorer', category: 'AI', status: 'active', agent: 'Analytics' },
          { id: 'contact_finder', name: 'Contact Finder', category: 'Data', status: 'active', agent: 'Operations' }
        ]
      },
      {
        id: 'email_campaigns',
        name: 'Email Campaigns',
        description: 'Automated email outreach and follow-ups',
        category: 'Marketing',
        icon: MessageSquare,
        color: '#ec4899',
        skills: [
          { id: 'email_composer', name: 'Email Composer', category: 'Communication', status: 'active', agent: 'Communications' },
          { id: 'campaign_manager', name: 'Campaign Manager', category: 'Marketing', status: 'active', agent: 'Operations' },
          { id: 'email_sender', name: 'Email Sender', category: 'Communication', status: 'active', agent: 'Communications' },
          { id: 'tracking_pixel', name: 'Tracking Pixel', category: 'Analytics', status: 'active', agent: 'Analytics' }
        ]
      },
      {
        id: 'crm_integration',
        name: 'CRM Integration',
        description: 'Sync with CRM systems for seamless data flow',
        category: 'Integration',
        icon: Link,
        color: '#06b6d4',
        skills: [
          { id: 'api_connector', name: 'API Connector', category: 'Integration', status: 'active', agent: 'Integration' },
          { id: 'data_sync', name: 'Data Sync', category: 'Data', status: 'active', agent: 'Operations' },
          { id: 'field_mapper', name: 'Field Mapper', category: 'Data', status: 'active', agent: 'Operations' },
          { id: 'webhook_handler', name: 'Webhook Handler', category: 'Integration', status: 'active', agent: 'Integration' }
        ]
      }
    ],
    'setup-agent': [
      {
        id: 'form_processing',
        name: 'Form Processing',
        description: 'Convert forms into conversational experiences',
        category: 'Automation',
        icon: Settings,
        color: '#667eea',
        skills: [
          { id: 'form_parser', name: 'Form Parser', category: 'Data', status: 'active', agent: 'Operations' },
          { id: 'field_validator', name: 'Field Validator', category: 'Validation', status: 'active', agent: 'Operations' },
          { id: 'conversation_flow', name: 'Conversation Flow', category: 'AI', status: 'active', agent: 'Communications' },
          { id: 'data_transformer', name: 'Data Transformer', category: 'Data', status: 'active', agent: 'Operations' }
        ]
      },
      {
        id: 'onboarding_workflow',
        name: 'Onboarding Workflow',
        description: 'Automated customer onboarding process',
        category: 'Customer Success',
        icon: Users,
        color: '#10b981',
        skills: [
          { id: 'step_manager', name: 'Step Manager', category: 'Workflow', status: 'active', agent: 'Operations' },
          { id: 'progress_tracker', name: 'Progress Tracker', category: 'Analytics', status: 'active', agent: 'Analytics' },
          { id: 'email_automation', name: 'Email Automation', category: 'Communication', status: 'active', agent: 'Communications' },
          { id: 'document_generator', name: 'Document Generator', category: 'Documents', status: 'active', agent: 'Operations' }
        ]
      }
    ],
    'data-enrichment': [
      {
        id: 'company_enrichment',
        name: 'Company Enrichment',
        description: 'Enhance company data with additional information',
        category: 'Data',
        icon: Database,
        color: '#06b6d4',
        skills: [
          { id: 'company_search', name: 'Company Search', category: 'Data', status: 'active', agent: 'Operations' },
          { id: 'data_aggregator', name: 'Data Aggregator', category: 'Data', status: 'active', agent: 'Operations' },
          { id: 'social_scraper', name: 'Social Scraper', category: 'Data', status: 'active', agent: 'Operations' },
          { id: 'validation_engine', name: 'Validation Engine', category: 'Validation', status: 'active', agent: 'Operations' }
        ]
      },
      {
        id: 'contact_enrichment',
        name: 'Contact Enrichment',
        description: 'Find and verify contact information',
        category: 'Data',
        icon: Users,
        color: '#8b5cf6',
        skills: [
          { id: 'email_finder', name: 'Email Finder', category: 'Data', status: 'active', agent: 'Operations' },
          { id: 'phone_lookup', name: 'Phone Lookup', category: 'Data', status: 'active', agent: 'Operations' },
          { id: 'social_profiles', name: 'Social Profiles', category: 'Data', status: 'active', agent: 'Operations' },
          { id: 'verification_api', name: 'Verification API', category: 'Validation', status: 'active', agent: 'Security' }
        ]
      }
    ]
  };

  const productWorkflows = workflows[productId] || [];
  const totalSkills = productWorkflows.reduce((acc, w) => acc + w.skills.length, 0);
  const activeSkills = productWorkflows.reduce((acc, w) => 
    acc + w.skills.filter(s => s.status === 'active').length, 0
  );

  // Count skills by agent
  const agentCounts: Record<string, number> = {};
  productWorkflows.forEach(workflow => {
    workflow.skills.forEach(skill => {
      if (skill.agent) {
        agentCounts[skill.agent] = (agentCounts[skill.agent] || 0) + 1;
      }
    });
  });

  const getAgentIcon = (agent: string) => {
    const icons: Record<string, React.ElementType> = {
      'Finance': DollarSign,
      'Operations': Settings,
      'Infrastructure': Database,
      'Security': Shield,
      'Analytics': TrendingUp,
      'Communications': MessageSquare,
      'Integration': Link,
      'Compliance': CheckCircle
    };
    return icons[agent] || Cpu;
  };

  const getAgentColor = (agent: string) => {
    const colors: Record<string, string> = {
      'Finance': '#10b981',
      'Operations': '#667eea',
      'Infrastructure': '#f59e0b',
      'Security': '#ef4444',
      'Analytics': '#8b5cf6',
      'Communications': '#06b6d4',
      'Integration': '#ec4899',
      'Compliance': '#6b7280'
    };
    return colors[agent] || '#9ca3af';
  };

  if (productWorkflows.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No workflows configured for this product yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Workflows</p>
              <p className="text-2xl font-bold">{productWorkflows.length}</p>
            </div>
            <GitBranch className="w-8 h-8 text-indigo-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Skills</p>
              <p className="text-2xl font-bold">{activeSkills} / {totalSkills}</p>
            </div>
            <Zap className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Management Agents</p>
              <p className="text-2xl font-bold">{Object.keys(agentCounts).length}</p>
            </div>
            <Cpu className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Agent Distribution */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Agent Distribution</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(agentCounts).map(([agent, count]) => {
            const Icon = getAgentIcon(agent);
            return (
              <div 
                key={agent}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                style={{ borderColor: getAgentColor(agent), backgroundColor: `${getAgentColor(agent)}10` }}
              >
                <Icon className="w-4 h-4" style={{ color: getAgentColor(agent) }} />
                <span className="text-sm font-medium">{agent}</span>
                <span className="text-xs bg-white px-2 py-1 rounded-full">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Workflows */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Active Workflows</h3>
        {productWorkflows.map((workflow) => {
          const Icon = workflow.icon;
          const isActive = activeWorkflows.includes(workflow.id);
          
          return (
            <div 
              key={workflow.id} 
              className={`bg-white rounded-lg border ${isActive ? 'border-green-400' : 'border-gray-200'} overflow-hidden`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${workflow.color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: workflow.color }} />
                    </div>
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        {workflow.name}
                        {isActive && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            Active
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
                      <span className="inline-block text-xs text-gray-500 mt-2 px-2 py-1 bg-gray-100 rounded">
                        {workflow.category}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Skills in workflow */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Skills Chain</span>
                    <span className="text-xs text-gray-500">{workflow.skills.length} skills</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {workflow.skills.map((skill, index) => (
                      <React.Fragment key={skill.id}>
                        <div className="group relative">
                          <div 
                            className={`
                              px-3 py-1.5 rounded-md text-xs font-medium transition-all
                              ${skill.status === 'active' 
                                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                : 'bg-gray-50 text-gray-500 border border-gray-200'}
                              hover:shadow-md cursor-pointer
                            `}
                          >
                            <div className="flex items-center gap-1">
                              {skill.status === 'active' && (
                                <CheckCircle className="w-3 h-3 text-green-500" />
                              )}
                              <span>{skill.name}</span>
                            </div>
                          </div>
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                            <div>Agent: {skill.agent}</div>
                            <div>Category: {skill.category}</div>
                          </div>
                        </div>
                        {index < workflow.skills.length - 1 && (
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Workflow status bar */}
              <div className={`h-2 ${isActive ? 'bg-green-400' : 'bg-gray-200'}`} />
            </div>
          );
        })}
      </div>

      {/* Footer info */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Activity className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900">Skills System Active</p>
            <p className="text-blue-700 mt-1">
              This product leverages {activeSkills} skills from the 310-skill infrastructure, 
              coordinated by {Object.keys(agentCounts).length} management agents for optimal performance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowDisplay;