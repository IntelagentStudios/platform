'use client';

import { useEffect, useState } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  Users, 
  DollarSign,
  Shield,
  Activity,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw,
  Send,
  Eye,
  FileSpreadsheet,
  FilePieChart,
  FileBarChart,
  Sparkles
} from 'lucide-react';

interface Report {
  id: string;
  name: string;
  type: 'financial' | 'operational' | 'compliance' | 'analytics' | 'security' | 'executive';
  status: 'ready' | 'generating' | 'scheduled' | 'failed';
  lastGenerated?: string;
  size?: string;
  agent: string;
  frequency?: string;
}

interface AgentInsight {
  agent: string;
  type: 'info' | 'warning' | 'success';
  title: string;
  description: string;
  timestamp: string;
  relevance: number;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [insights, setInsights] = useState<AgentInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [scheduledReports, setScheduledReports] = useState<any[]>([]);

  useEffect(() => {
    fetchReportsData();
    const interval = setInterval(fetchInsights, 30000); // Refresh insights every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchReportsData = async () => {
    try {
      // Simulate fetching reports from various agents
      const mockReports: Report[] = [
        {
          id: 'fin-monthly-001',
          name: 'Monthly Financial Report',
          type: 'financial',
          status: 'ready',
          lastGenerated: new Date(Date.now() - 86400000).toISOString(),
          size: '2.4 MB',
          agent: 'Finance Agent',
          frequency: 'Monthly'
        },
        {
          id: 'ops-weekly-023',
          name: 'Weekly Operations Summary',
          type: 'operational',
          status: 'ready',
          lastGenerated: new Date(Date.now() - 172800000).toISOString(),
          size: '1.8 MB',
          agent: 'Operations Agent',
          frequency: 'Weekly'
        },
        {
          id: 'comp-quarterly-004',
          name: 'Quarterly Compliance Audit',
          type: 'compliance',
          status: 'scheduled',
          agent: 'Compliance Agent',
          frequency: 'Quarterly'
        },
        {
          id: 'analytics-daily-156',
          name: 'Daily Analytics Dashboard',
          type: 'analytics',
          status: 'ready',
          lastGenerated: new Date(Date.now() - 3600000).toISOString(),
          size: '945 KB',
          agent: 'Analytics Agent',
          frequency: 'Daily'
        },
        {
          id: 'sec-monthly-012',
          name: 'Security Assessment Report',
          type: 'security',
          status: 'ready',
          lastGenerated: new Date(Date.now() - 259200000).toISOString(),
          size: '3.1 MB',
          agent: 'Security Agent',
          frequency: 'Monthly'
        },
        {
          id: 'exec-summary-045',
          name: 'Executive Summary',
          type: 'executive',
          status: 'ready',
          lastGenerated: new Date(Date.now() - 604800000).toISOString(),
          size: '567 KB',
          agent: 'Communications Agent',
          frequency: 'Weekly'
        }
      ];

      setReports(mockReports);
      
      // Fetch scheduled reports
      const scheduled = [
        { name: 'Q4 Financial Report', date: '2024-01-15', type: 'financial' },
        { name: 'Annual Compliance Review', date: '2024-01-31', type: 'compliance' },
        { name: 'Year-End Analytics', date: '2024-01-01', type: 'analytics' }
      ];
      setScheduledReports(scheduled);
      
      await fetchInsights();
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInsights = async () => {
    try {
      // Fetch insights from management agents
      const response = await fetch('/api/admin/agent-insights');
      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights || []);
      }
    } catch (error) {
      // Use mock insights if API fails
      const mockInsights: AgentInsight[] = [
        {
          agent: 'Analytics Agent',
          type: 'info',
          title: 'Usage Trend Detected',
          description: 'API usage increased by 45% this week',
          timestamp: new Date().toISOString(),
          relevance: 0.85
        },
        {
          agent: 'Finance Agent',
          type: 'success',
          title: 'Revenue Target Met',
          description: 'Monthly revenue target achieved 5 days early',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          relevance: 0.95
        },
        {
          agent: 'Security Agent',
          type: 'warning',
          title: 'Security Update Required',
          description: '3 dependencies need security updates',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          relevance: 0.9
        },
        {
          agent: 'Compliance Agent',
          type: 'info',
          title: 'Audit Scheduled',
          description: 'Quarterly compliance audit scheduled for next week',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          relevance: 0.7
        }
      ];
      setInsights(mockInsights);
    }
  };

  const generateReport = async (reportId: string) => {
    setGeneratingReport(reportId);
    
    // Simulate report generation
    setTimeout(() => {
      setReports(prev => prev.map(r => 
        r.id === reportId 
          ? { ...r, status: 'ready', lastGenerated: new Date().toISOString(), size: '1.2 MB' }
          : r
      ));
      setGeneratingReport(null);
    }, 3000);
  };

  const downloadReport = (report: Report) => {
    // Simulate download
    console.log('Downloading report:', report.name);
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'financial': return DollarSign;
      case 'operational': return Activity;
      case 'compliance': return Shield;
      case 'analytics': return TrendingUp;
      case 'security': return Shield;
      case 'executive': return FileText;
      default: return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return '#4CAF50';
      case 'generating': return '#FF9800';
      case 'scheduled': return '#2196F3';
      case 'failed': return '#f44336';
      default: return 'rgba(48, 54, 54, 0.5)';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertCircle;
      default: return Sparkles;
    }
  };

  const filteredReports = selectedType === 'all' 
    ? reports 
    : reports.filter(r => r.type === selectedType);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" style={{ color: 'rgb(48, 54, 54)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold" style={{ color: 'rgb(48, 54, 54)' }}>
            Reports & Insights
          </h2>
          <p className="mt-1" style={{ color: 'rgba(48, 54, 54, 0.8)' }}>
            Generate reports and view insights from management agents
          </p>
        </div>
        <button
          onClick={fetchReportsData}
          className="px-4 py-2 rounded-lg flex items-center gap-2"
          style={{ 
            backgroundColor: 'rgb(48, 54, 54)',
            color: 'white'
          }}
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Agent Insights */}
      <div className="rounded-lg p-6 border" style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: 'rgba(48, 54, 54, 0.15)'
      }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(48, 54, 54)' }}>
          Latest Agent Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, index) => {
            const Icon = getInsightIcon(insight.type);
            return (
              <div 
                key={index}
                className="flex gap-3 p-4 rounded-lg border"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  borderColor: 'rgba(48, 54, 54, 0.1)'
                }}
              >
                <Icon 
                  className="w-5 h-5 mt-0.5 flex-shrink-0" 
                  style={{ 
                    color: insight.type === 'success' ? '#4CAF50' : 
                           insight.type === 'warning' ? '#FF9800' : 
                           'rgb(48, 54, 54)'
                  }} 
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-medium" style={{ color: 'rgb(48, 54, 54)' }}>
                      {insight.title}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full" style={{ 
                      backgroundColor: 'rgba(48, 54, 54, 0.1)',
                      color: 'rgba(48, 54, 54, 0.7)'
                    }}>
                      {insight.agent}
                    </span>
                  </div>
                  <p className="text-sm mb-2" style={{ color: 'rgba(48, 54, 54, 0.7)' }}>
                    {insight.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'rgba(48, 54, 54, 0.5)' }}>
                      {new Date(insight.timestamp).toLocaleTimeString()}
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="text-xs" style={{ color: 'rgba(48, 54, 54, 0.5)' }}>
                        Relevance:
                      </div>
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            width: `${insight.relevance * 100}%`,
                            backgroundColor: insight.relevance > 0.8 ? '#4CAF50' : 
                                           insight.relevance > 0.5 ? '#FF9800' : 
                                           '#f44336'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Report Filters */}
      <div className="flex gap-2">
        {['all', 'financial', 'operational', 'compliance', 'analytics', 'security', 'executive'].map(type => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className="px-3 py-1.5 rounded-lg text-sm capitalize transition-all"
            style={{ 
              backgroundColor: selectedType === type ? 'rgb(48, 54, 54)' : 'white',
              color: selectedType === type ? 'white' : 'rgb(48, 54, 54)',
              border: '1px solid rgba(48, 54, 54, 0.2)'
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReports.map(report => {
          const Icon = getReportIcon(report.type);
          const isGenerating = generatingReport === report.id;
          
          return (
            <div 
              key={report.id}
              className="rounded-lg p-5 border"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderColor: 'rgba(48, 54, 54, 0.15)'
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <Icon className="w-5 h-5" style={{ color: 'rgb(48, 54, 54)' }} />
                <span 
                  className="text-xs px-2 py-1 rounded-full"
                  style={{ 
                    backgroundColor: `${getStatusColor(report.status)}20`,
                    color: getStatusColor(report.status)
                  }}
                >
                  {report.status}
                </span>
              </div>
              
              <h4 className="font-semibold mb-1" style={{ color: 'rgb(48, 54, 54)' }}>
                {report.name}
              </h4>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                  <Users className="w-3 h-3" />
                  {report.agent}
                </div>
                {report.frequency && (
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                    <Calendar className="w-3 h-3" />
                    {report.frequency}
                  </div>
                )}
                {report.lastGenerated && (
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                    <Clock className="w-3 h-3" />
                    {new Date(report.lastGenerated).toLocaleDateString()}
                  </div>
                )}
                {report.size && (
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                    <FileText className="w-3 h-3" />
                    {report.size}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                {report.status === 'ready' ? (
                  <>
                    <button
                      onClick={() => downloadReport(report)}
                      className="flex-1 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2"
                      style={{ 
                        backgroundColor: 'rgb(48, 54, 54)',
                        color: 'white'
                      }}
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button
                      className="px-3 py-2 rounded-lg border"
                      style={{ 
                        borderColor: 'rgba(48, 54, 54, 0.2)',
                        color: 'rgb(48, 54, 54)'
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </>
                ) : report.status === 'scheduled' ? (
                  <button
                    onClick={() => generateReport(report.id)}
                    disabled={isGenerating}
                    className="flex-1 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2 border"
                    style={{ 
                      borderColor: 'rgba(48, 54, 54, 0.2)',
                      color: 'rgb(48, 54, 54)',
                      opacity: isGenerating ? 0.5 : 1
                    }}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Generate Now
                      </>
                    )}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scheduled Reports */}
      <div className="rounded-lg p-6 border" style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: 'rgba(48, 54, 54, 0.15)'
      }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(48, 54, 54)' }}>
          Upcoming Scheduled Reports
        </h3>
        <div className="space-y-3">
          {scheduledReports.map((scheduled, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 rounded-lg"
              style={{ backgroundColor: 'rgba(48, 54, 54, 0.05)' }}
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4" style={{ color: 'rgba(48, 54, 54, 0.5)' }} />
                <div>
                  <span className="font-medium" style={{ color: 'rgb(48, 54, 54)' }}>
                    {scheduled.name}
                  </span>
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ 
                    backgroundColor: 'rgba(48, 54, 54, 0.1)',
                    color: 'rgba(48, 54, 54, 0.7)'
                  }}>
                    {scheduled.type}
                  </span>
                </div>
              </div>
              <span className="text-sm" style={{ color: 'rgba(48, 54, 54, 0.6)' }}>
                {scheduled.date}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          className="p-4 rounded-lg border flex items-center gap-3"
          style={{ 
            backgroundColor: 'white',
            borderColor: 'rgba(48, 54, 54, 0.15)',
            color: 'rgb(48, 54, 54)'
          }}
        >
          <FileSpreadsheet className="w-5 h-5" />
          <span>Create Custom Report</span>
        </button>
        <button 
          className="p-4 rounded-lg border flex items-center gap-3"
          style={{ 
            backgroundColor: 'white',
            borderColor: 'rgba(48, 54, 54, 0.15)',
            color: 'rgb(48, 54, 54)'
          }}
        >
          <FilePieChart className="w-5 h-5" />
          <span>Schedule Report</span>
        </button>
        <button 
          className="p-4 rounded-lg border flex items-center gap-3"
          style={{ 
            backgroundColor: 'white',
            borderColor: 'rgba(48, 54, 54, 0.15)',
            color: 'rgb(48, 54, 54)'
          }}
        >
          <FileBarChart className="w-5 h-5" />
          <span>Export All Reports</span>
        </button>
      </div>
    </div>
  );
}