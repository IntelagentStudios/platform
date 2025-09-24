'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Database,
  Upload,
  Download,
  RefreshCw,
  Filter,
  Search,
  Eye,
  Brain,
  Lightbulb,
  Target,
  Users,
  DollarSign,
  Activity,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function DataInsightsDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState('datasets');
  const [datasets, setDatasets] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    fetch('/api/auth/me', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setIsAuthenticated(true);
          loadDashboardData();
        } else {
          setIsAuthenticated(false);
          window.location.href = '/login';
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        window.location.href = '/login';
      });
  }, []);

  const loadDashboardData = () => {
    // Mock data for datasets
    setDatasets([
      {
        id: 'ds_sales',
        name: 'Sales Data',
        source: 'CRM Export',
        rows: 45230,
        columns: 18,
        quality: 94,
        lastUpdated: '2 hours ago',
        status: 'active'
      },
      {
        id: 'ds_leads',
        name: 'Lead Pipeline',
        source: 'API Integration',
        rows: 8745,
        columns: 12,
        quality: 88,
        lastUpdated: 'Live',
        status: 'syncing'
      },
      {
        id: 'ds_customer',
        name: 'Customer Analytics',
        source: 'Google Sheets',
        rows: 15620,
        columns: 25,
        quality: 96,
        lastUpdated: '1 day ago',
        status: 'active'
      }
    ]);

    // Mock insights
    setInsights([
      {
        id: 'insight_1',
        type: 'opportunity',
        title: 'High-Intent Segment Discovered',
        description: '23% of leads from LinkedIn show 3x higher conversion rate',
        impact: 'high',
        confidence: 92,
        recommendation: 'Increase LinkedIn ad spend by 40%'
      },
      {
        id: 'insight_2',
        type: 'warning',
        title: 'Churn Risk Increasing',
        description: 'Enterprise customers showing 15% higher inactivity than usual',
        impact: 'medium',
        confidence: 78,
        recommendation: 'Launch re-engagement campaign this week'
      },
      {
        id: 'insight_3',
        type: 'trend',
        title: 'Revenue Growth Accelerating',
        description: 'Q4 trajectory exceeds projections by 12%',
        impact: 'high',
        confidence: 95,
        recommendation: 'Consider hiring 2 more sales reps'
      }
    ]);

    // Mock anomalies
    setAnomalies([
      {
        id: 'anomaly_1',
        dataset: 'Sales Data',
        metric: 'Daily Revenue',
        detected: '3 hours ago',
        severity: 'medium',
        description: 'Unexpected 40% spike in UK region'
      },
      {
        id: 'anomaly_2',
        dataset: 'Lead Pipeline',
        metric: 'Response Rate',
        detected: '1 day ago',
        severity: 'low',
        description: 'Email open rates dropped 15%'
      }
    ]);
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(48, 54, 54)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
             style={{ borderColor: 'rgb(169, 189, 203)' }}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="px-8 py-6 border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(33, 150, 243, 0.1)' }}>
              <BarChart3 className="h-6 w-6" style={{ color: '#2196F3' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                Data/Insights Agent
              </h1>
              <p className="text-sm" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>
                AI-powered data analysis and business intelligence
              </p>
            </div>
          </div>
          <button
            className="px-4 py-2 rounded-lg flex items-center space-x-2 transition hover:opacity-80"
            style={{
              backgroundColor: '#2196F3',
              color: 'white'
            }}
          >
            <Upload className="h-4 w-4" />
            <span>Import Data</span>
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="px-8 py-6 grid grid-cols-4 gap-4">
        <div className="rounded-lg p-4" style={{
          backgroundColor: 'rgba(58, 64, 64, 0.5)',
          border: '1px solid rgba(169, 189, 203, 0.1)'
        }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>Conversion Rate</p>
            <TrendingUp className="h-4 w-4" style={{ color: '#4CAF50' }} />
          </div>
          <p className="text-2xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>3.8%</p>
          <p className="text-xs" style={{ color: 'rgba(76, 175, 80, 0.8)' }}>↑ 0.5% from last month</p>
        </div>

        <div className="rounded-lg p-4" style={{
          backgroundColor: 'rgba(58, 64, 64, 0.5)',
          border: '1px solid rgba(169, 189, 203, 0.1)'
        }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>AOV</p>
            <DollarSign className="h-4 w-4" style={{ color: 'rgb(169, 189, 203)' }} />
          </div>
          <p className="text-2xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>£847</p>
          <p className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.8)' }}>↑ £52 from last month</p>
        </div>

        <div className="rounded-lg p-4" style={{
          backgroundColor: 'rgba(58, 64, 64, 0.5)',
          border: '1px solid rgba(169, 189, 203, 0.1)'
        }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>Active Segments</p>
            <Users className="h-4 w-4" style={{ color: '#2196F3' }} />
          </div>
          <p className="text-2xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>12</p>
          <p className="text-xs" style={{ color: 'rgba(33, 150, 243, 0.8)' }}>3 high-value</p>
        </div>

        <div className="rounded-lg p-4" style={{
          backgroundColor: 'rgba(58, 64, 64, 0.5)',
          border: '1px solid rgba(169, 189, 203, 0.1)'
        }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs" style={{ color: 'rgba(229, 227, 220, 0.6)' }}>Data Quality</p>
            <Activity className="h-4 w-4" style={{ color: '#4CAF50' }} />
          </div>
          <p className="text-2xl font-bold" style={{ color: 'rgb(229, 227, 220)' }}>93%</p>
          <p className="text-xs" style={{ color: 'rgba(76, 175, 80, 0.8)' }}>Above benchmark</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8">
        <div className="border-b" style={{ borderColor: 'rgba(169, 189, 203, 0.1)' }}>
          <div className="flex space-x-8">
            {['datasets', 'kpis', 'findings', 'explorer', 'anomalies'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-1 border-b-2 transition ${
                  activeTab === tab ? 'border-current' : 'border-transparent hover:border-gray-600'
                }`}
                style={{
                  color: activeTab === tab ? 'rgb(229, 227, 220)' : 'rgba(169, 189, 203, 0.7)'
                }}
              >
                {tab === 'kpis' ? 'KPIs' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {activeTab === 'datasets' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {datasets.map((dataset) => (
              <div
                key={dataset.id}
                className="rounded-lg p-6 cursor-pointer transition hover:shadow-lg"
                style={{
                  backgroundColor: 'rgba(58, 64, 64, 0.5)',
                  border: '1px solid rgba(169, 189, 203, 0.15)'
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                      {dataset.name}
                    </h3>
                    <p className="text-xs mt-1" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                      Source: {dataset.source}
                    </p>
                  </div>
                  {dataset.status === 'syncing' ? (
                    <RefreshCw className="h-4 w-4 animate-spin" style={{ color: '#2196F3' }} />
                  ) : (
                    <Database className="h-4 w-4" style={{ color: 'rgba(169, 189, 203, 0.5)' }} />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs" style={{ color: 'rgba(229, 227, 220, 0.5)' }}>Rows</p>
                    <p className="font-medium" style={{ color: 'rgb(229, 227, 220)' }}>
                      {dataset.rows.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'rgba(229, 227, 220, 0.5)' }}>Quality Score</p>
                    <p className="font-medium" style={{ color: dataset.quality > 90 ? '#4CAF50' : '#FFC107' }}>
                      {dataset.quality}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                    Updated: {dataset.lastUpdated}
                  </span>
                  <button className="text-sm font-medium" style={{ color: 'rgb(169, 189, 203)' }}>
                    Manage →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'findings' && (
          <div className="space-y-4">
            {/* AI Insights Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5" style={{ color: '#FFC107' }} />
                <h2 className="text-lg font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                  AI-Generated Insights
                </h2>
              </div>
              <button
                className="px-3 py-2 rounded-lg flex items-center space-x-2"
                style={{
                  backgroundColor: 'rgba(169, 189, 203, 0.1)',
                  color: 'rgb(169, 189, 203)'
                }}
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh Analysis</span>
              </button>
            </div>

            {/* Insights List */}
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="rounded-lg p-6"
                style={{
                  backgroundColor: 'rgba(58, 64, 64, 0.5)',
                  border: `1px solid ${
                    insight.type === 'opportunity' ? 'rgba(76, 175, 80, 0.3)' :
                    insight.type === 'warning' ? 'rgba(255, 193, 7, 0.3)' :
                    'rgba(33, 150, 243, 0.3)'
                  }`
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg" style={{
                      backgroundColor: insight.type === 'opportunity' ? 'rgba(76, 175, 80, 0.1)' :
                                      insight.type === 'warning' ? 'rgba(255, 193, 7, 0.1)' :
                                      'rgba(33, 150, 243, 0.1)'
                    }}>
                      {insight.type === 'opportunity' ? (
                        <Lightbulb className="h-5 w-5" style={{ color: '#4CAF50' }} />
                      ) : insight.type === 'warning' ? (
                        <AlertTriangle className="h-5 w-5" style={{ color: '#FFC107' }} />
                      ) : (
                        <TrendingUp className="h-5 w-5" style={{ color: '#2196F3' }} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                        {insight.title}
                      </h3>
                      <p className="text-sm mt-1" style={{ color: 'rgba(229, 227, 220, 0.7)' }}>
                        {insight.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>Confidence</p>
                    <p className="font-bold" style={{ color: insight.confidence > 80 ? '#4CAF50' : '#FFC107' }}>
                      {insight.confidence}%
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                  <p className="text-xs mb-1" style={{ color: 'rgba(229, 227, 220, 0.5)' }}>
                    Recommended Action:
                  </p>
                  <p className="text-sm" style={{ color: 'rgb(169, 189, 203)' }}>
                    {insight.recommendation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'explorer' && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Eye className="h-16 w-16 mx-auto mb-4" style={{ color: 'rgba(169, 189, 203, 0.3)' }} />
              <h3 className="text-xl font-bold mb-2" style={{ color: 'rgb(229, 227, 220)' }}>
                Data Explorer
              </h3>
              <p className="text-sm mb-6" style={{ color: 'rgba(169, 189, 203, 0.7)' }}>
                Pick any two dimensions to instantly visualize and save as a widget
              </p>
              <button
                className="px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: '#2196F3',
                  color: 'white'
                }}
              >
                Launch Explorer
              </button>
            </div>
          </div>
        )}

        {activeTab === 'anomalies' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: 'rgb(229, 227, 220)' }}>
                Detected Anomalies
              </h2>
              <span className="px-3 py-1 rounded-full text-xs" style={{
                backgroundColor: 'rgba(255, 193, 7, 0.2)',
                color: '#FFC107'
              }}>
                {anomalies.length} active
              </span>
            </div>

            {anomalies.map((anomaly) => (
              <div
                key={anomaly.id}
                className="rounded-lg p-4 flex items-center justify-between"
                style={{
                  backgroundColor: 'rgba(58, 64, 64, 0.5)',
                  border: '1px solid rgba(255, 193, 7, 0.2)'
                }}
              >
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <AlertTriangle className="h-4 w-4" style={{
                      color: anomaly.severity === 'high' ? '#FF5252' :
                            anomaly.severity === 'medium' ? '#FFC107' :
                            '#4CAF50'
                    }} />
                    <span className="font-medium" style={{ color: 'rgb(229, 227, 220)' }}>
                      {anomaly.metric}
                    </span>
                    <span className="text-xs" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                      in {anomaly.dataset}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: 'rgba(229, 227, 220, 0.7)' }}>
                    {anomaly.description}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(169, 189, 203, 0.6)' }}>
                    Detected: {anomaly.detected}
                  </p>
                </div>
                <button className="px-3 py-1.5 rounded text-sm" style={{
                  backgroundColor: 'rgba(169, 189, 203, 0.1)',
                  color: 'rgb(169, 189, 203)'
                }}>
                  Investigate →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}