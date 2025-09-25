'use client';

import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ChartPieIcon,
  ArrowPathIcon,
  FunnelIcon,
  PlusIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';

interface DataExplorerProps {
  namespace: string;
  tenantId: string;
  onSaveAsWidget?: (widget: any) => void;
  theme?: any;
}

interface Dataset {
  id: string;
  name: string;
  fields: string[];
  metrics: string[];
}

export default function DataExplorer({
  namespace,
  tenantId,
  onSaveAsWidget,
  theme = {}
}: DataExplorerProps) {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [xMetric, setXMetric] = useState<string>('');
  const [yMetric, setYMetric] = useState<string>('');
  const [groupBy, setGroupBy] = useState<string>('');
  const [filter, setFilter] = useState<string>('');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'scatter' | 'pie'>('bar');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDatasets();
  }, [namespace]);

  const loadDatasets = async () => {
    // Fetch available datasets from catalog
    const mockDatasets: Dataset[] = [
      {
        id: 'workflows',
        name: 'Workflow Runs',
        fields: ['id', 'name', 'status', 'start_time', 'end_time', 'duration'],
        metrics: ['count', 'avg_duration', 'success_rate', 'error_count']
      },
      {
        id: 'steps',
        name: 'Workflow Steps',
        fields: ['workflow_id', 'step_name', 'step_type', 'latency'],
        metrics: ['step_count', 'avg_latency', 'failure_rate']
      },
      {
        id: 'sla',
        name: 'SLA Metrics',
        fields: ['workflow_name', 'sla_target', 'actual_time'],
        metrics: ['compliance_rate', 'breach_count', 'avg_margin']
      }
    ];
    setDatasets(mockDatasets);
  };

  const handleExplore = async () => {
    if (!selectedDataset || !xMetric || !yMetric) return;

    setLoading(true);
    try {
      // Simulate data exploration
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate mock data based on selections
      const mockData = generateMockData(xMetric, yMetric, chartType);
      setData(mockData);
    } catch (error) {
      console.error('Error exploring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (x: string, y: string, type: string) => {
    const points = [];
    const categories = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    if (type === 'pie') {
      return {
        labels: ['Success', 'Failed', 'Pending', 'Cancelled'],
        values: [65, 15, 15, 5]
      };
    }

    for (let i = 0; i < 7; i++) {
      points.push({
        x: categories[i],
        y: Math.floor(Math.random() * 100) + 20
      });
    }

    return { points, xLabel: x, yLabel: y };
  };

  const handleSaveAsWidget = () => {
    if (!data || !onSaveAsWidget) return;

    const widget = {
      type: 'chart',
      title: `${yMetric} by ${xMetric}`,
      bind: `explorer.custom.${Date.now()}`,
      viz: chartType,
      config: {
        dataset: selectedDataset,
        xMetric,
        yMetric,
        groupBy,
        filter
      }
    };

    onSaveAsWidget(widget);
  };

  const currentDataset = datasets.find(d => d.id === selectedDataset);

  return (
    <div style={{
      padding: '20px',
      backgroundColor: theme.backgroundColor || '#fff',
      border: `1px solid ${theme.borderColor || '#e5e7eb'}`,
      borderRadius: '8px'
    }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: 'bold',
        color: theme.textColor || '#111',
        marginBottom: '20px'
      }}>
        Data Explorer
      </h3>

      {/* Controls */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
      }}>
        {/* Dataset Selection */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            color: theme.textColor || '#111',
            marginBottom: '4px'
          }}>
            Dataset
          </label>
          <select
            value={selectedDataset}
            onChange={(e) => setSelectedDataset(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: theme.backgroundColor || '#fff',
              color: theme.textColor || '#111',
              border: `1px solid ${theme.borderColor || '#e5e7eb'}`,
              borderRadius: '4px'
            }}
          >
            <option value="">Select dataset...</option>
            {datasets.map(ds => (
              <option key={ds.id} value={ds.id}>{ds.name}</option>
            ))}
          </select>
        </div>

        {/* X Metric */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            color: theme.textColor || '#111',
            marginBottom: '4px'
          }}>
            X Axis
          </label>
          <select
            value={xMetric}
            onChange={(e) => setXMetric(e.target.value)}
            disabled={!currentDataset}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: theme.backgroundColor || '#fff',
              color: theme.textColor || '#111',
              border: `1px solid ${theme.borderColor || '#e5e7eb'}`,
              borderRadius: '4px'
            }}
          >
            <option value="">Select metric...</option>
            {currentDataset?.fields.map(field => (
              <option key={field} value={field}>{field}</option>
            ))}
          </select>
        </div>

        {/* Y Metric */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            color: theme.textColor || '#111',
            marginBottom: '4px'
          }}>
            Y Axis
          </label>
          <select
            value={yMetric}
            onChange={(e) => setYMetric(e.target.value)}
            disabled={!currentDataset}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: theme.backgroundColor || '#fff',
              color: theme.textColor || '#111',
              border: `1px solid ${theme.borderColor || '#e5e7eb'}`,
              borderRadius: '4px'
            }}
          >
            <option value="">Select metric...</option>
            {currentDataset?.metrics.map(metric => (
              <option key={metric} value={metric}>{metric}</option>
            ))}
          </select>
        </div>

        {/* Group By */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            color: theme.textColor || '#111',
            marginBottom: '4px'
          }}>
            Group By (Optional)
          </label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            disabled={!currentDataset}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: theme.backgroundColor || '#fff',
              color: theme.textColor || '#111',
              border: `1px solid ${theme.borderColor || '#e5e7eb'}`,
              borderRadius: '4px'
            }}
          >
            <option value="">None</option>
            {currentDataset?.fields.map(field => (
              <option key={field} value={field}>{field}</option>
            ))}
          </select>
        </div>

        {/* Chart Type */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            color: theme.textColor || '#111',
            marginBottom: '4px'
          }}>
            Chart Type
          </label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as any)}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: theme.backgroundColor || '#fff',
              color: theme.textColor || '#111',
              border: `1px solid ${theme.borderColor || '#e5e7eb'}`,
              borderRadius: '4px'
            }}
          >
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
            <option value="scatter">Scatter Plot</option>
            <option value="pie">Pie Chart</option>
          </select>
        </div>

        {/* Filter */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            color: theme.textColor || '#111',
            marginBottom: '4px'
          }}>
            Filter (Optional)
          </label>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="e.g., status=success"
            disabled={!currentDataset}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: theme.backgroundColor || '#fff',
              color: theme.textColor || '#111',
              border: `1px solid ${theme.borderColor || '#e5e7eb'}`,
              borderRadius: '4px'
            }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <button
          onClick={handleExplore}
          disabled={!selectedDataset || !xMetric || !yMetric || loading}
          style={{
            padding: '8px 16px',
            backgroundColor: theme.primaryColor || '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: (!selectedDataset || !xMetric || !yMetric || loading) ? 'not-allowed' : 'pointer',
            opacity: (!selectedDataset || !xMetric || !yMetric || loading) ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {loading ? (
            <ArrowPathIcon style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
          ) : (
            <ChartBarIcon style={{ width: '16px', height: '16px' }} />
          )}
          {loading ? 'Exploring...' : 'Explore'}
        </button>

        {data && onSaveAsWidget && (
          <button
            onClick={handleSaveAsWidget}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: theme.primaryColor || '#3b82f6',
              border: `1px solid ${theme.primaryColor || '#3b82f6'}`,
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <BookmarkIcon style={{ width: '16px', height: '16px' }} />
            Save as Widget
          </button>
        )}
      </div>

      {/* Visualization Area */}
      {data && (
        <div style={{
          padding: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          borderRadius: '8px',
          minHeight: '300px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {chartType === 'pie' ? (
            <div style={{ textAlign: 'center' }}>
              <ChartPieIcon style={{ width: '64px', height: '64px', color: theme.primaryColor, margin: '0 auto' }} />
              <div style={{ marginTop: '20px' }}>
                {data.labels.map((label: string, idx: number) => (
                  <div key={idx} style={{ marginBottom: '8px', color: theme.textColor }}>
                    <span style={{ fontWeight: 'bold' }}>{label}:</span> {data.values[idx]}%
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ width: '100%' }}>
              <ChartBarIcon style={{ width: '64px', height: '64px', color: theme.primaryColor, margin: '0 auto', display: 'block' }} />
              <div style={{ marginTop: '20px', textAlign: 'center', color: theme.textColor }}>
                <p style={{ fontWeight: 'bold', marginBottom: '12px' }}>
                  {data.yLabel} by {data.xLabel}
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                  {data.points.map((point: any, idx: number) => (
                    <div key={idx} style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          height: `${point.y * 2}px`,
                          width: '40px',
                          backgroundColor: theme.primaryColor || '#3b82f6',
                          borderRadius: '4px 4px 0 0',
                          marginBottom: '8px'
                        }}
                      />
                      <div style={{ fontSize: '12px' }}>{point.x}</div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{point.y}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Suggestions */}
      {data && (
        <div style={{
          marginTop: '20px',
          padding: '12px',
          backgroundColor: 'rgba(169, 189, 203, 0.1)',
          borderRadius: '4px',
          fontSize: '14px',
          color: theme.textColor
        }}>
          💡 <strong>Tip:</strong> Try different combinations or add filters to discover insights.
          You can save any visualization as a widget to your dashboard.
        </div>
      )}
    </div>
  );
}