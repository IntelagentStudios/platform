/**
 * Widget Runtime and Gateway
 * Secure rendering and data fetching for widgets
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DataCatalog } from './DataCatalog';
import { Widget, WidgetAction } from './LayoutSchema';
import {
  ChartBarIcon,
  TableCellsIcon,
  ClockIcon,
  DocumentTextIcon,
  PlayIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface WidgetRuntimeProps {
  widget: Widget;
  namespace: string;
  tenantId: string;
  userId: string;
  onAction?: (action: string, params: any) => void;
  theme?: any;
}

interface WidgetData {
  loading: boolean;
  data: any;
  error?: string;
  lastFetch?: Date;
}

export const WidgetGateway = {
  cache: new Map<string, { data: any; expires: number }>(),

  async fetchData(
    namespace: string,
    bind: string,
    params: Record<string, any>,
    cacheTtl: number = 60
  ): Promise<any> {
    const cacheKey = `${namespace}:${bind}:${JSON.stringify(params)}`;
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    try {
      const catalog = new DataCatalog();
      const data = await catalog.executeRead(namespace, bind, params);

      // Cache the result
      this.cache.set(cacheKey, {
        data,
        expires: Date.now() + cacheTtl * 1000
      });

      return data;
    } catch (error) {
      console.error(`Error fetching data for ${bind}:`, error);
      throw error;
    }
  },

  async executeAction(
    namespace: string,
    action: string,
    params: Record<string, any>,
    userId: string
  ): Promise<any> {
    const catalog = new DataCatalog();
    return await catalog.executeAction(namespace, action, params, userId);
  },

  clearCache(namespace?: string) {
    if (namespace) {
      for (const [key] of this.cache) {
        if (key.startsWith(`${namespace}:`)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
};

export const WidgetRuntime: React.FC<WidgetRuntimeProps> = ({
  widget,
  namespace,
  tenantId,
  userId,
  onAction,
  theme = {}
}) => {
  const [data, setData] = useState<WidgetData>({
    loading: true,
    data: null
  });

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch widget data
  const fetchWidgetData = useCallback(async () => {
    if (widget.bind.startsWith('static.')) {
      // Static content, no need to fetch
      setData({
        loading: false,
        data: widget.config?.content || '',
        lastFetch: new Date()
      });
      return;
    }

    setData(prev => ({ ...prev, loading: true }));

    try {
      const result = await WidgetGateway.fetchData(
        namespace,
        widget.bind,
        { tenantId, userId },
        widget.config?.cache_ttl || 60
      );

      setData({
        loading: false,
        data: result,
        lastFetch: new Date()
      });
    } catch (error) {
      setData({
        loading: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch data'
      });
    }
  }, [widget, namespace, tenantId, userId]);

  useEffect(() => {
    fetchWidgetData();

    // Set up refresh interval if specified
    if (widget.refresh_interval) {
      const interval = setInterval(fetchWidgetData, widget.refresh_interval * 1000);
      return () => clearInterval(interval);
    }
  }, [widget, fetchWidgetData]);

  // Handle widget actions
  const handleAction = async (action: WidgetAction) => {
    if (action.confirmation) {
      const confirmed = window.confirm(`Are you sure you want to ${action.title}?`);
      if (!confirmed) return;
    }

    setActionLoading(action.bind);

    try {
      const result = await WidgetGateway.executeAction(
        namespace,
        action.bind,
        { tenantId, widgetId: widget.id },
        userId
      );

      // Refresh widget data after action
      await fetchWidgetData();

      onAction?.(action.bind, result);
    } catch (error) {
      console.error(`Action ${action.bind} failed:`, error);
      alert(`Failed to ${action.title}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Render different widget types
  const renderContent = () => {
    if (data.loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current" />
        </div>
      );
    }

    if (data.error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-red-500">
          <ExclamationTriangleIcon className="w-8 h-8 mb-2" />
          <p className="text-sm">{data.error}</p>
        </div>
      );
    }

    switch (widget.type) {
      case 'kpi':
        return <KPIWidget data={data.data} config={widget.config} />;

      case 'chart':
        return <ChartWidget data={data.data} viz={widget.viz} config={widget.config} />;

      case 'table':
        return <TableWidget data={data.data} config={widget.config} />;

      case 'timeline':
        return <TimelineWidget data={data.data} config={widget.config} />;

      case 'text':
        return <TextWidget data={data.data} config={widget.config} />;

      case 'action':
        return (
          <ActionWidget
            action={{
              title: widget.title,
              bind: widget.bind,
              ...widget.config
            }}
            loading={actionLoading === widget.bind}
            onExecute={() => handleAction({ title: widget.title, bind: widget.bind })}
          />
        );

      case 'data_explorer':
        return <DataExplorerWidget namespace={namespace} tenantId={tenantId} />;

      default:
        return <div>Unsupported widget type: {widget.type}</div>;
    }
  };

  const widgetStyle = {
    backgroundColor: theme.backgroundColor || '#fff',
    border: `1px solid ${theme.borderColor || '#e5e7eb'}`,
    borderRadius: '8px',
    padding: '16px',
    height: widget.height || 'auto',
    minHeight: '200px',
    display: 'flex',
    flexDirection: 'column' as const
  };

  return (
    <div style={widgetStyle} className="widget-container">
      {/* Widget Header */}
      <div className="widget-header flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold" style={{ color: theme.textColor }}>
          {widget.title}
        </h3>

        {/* Action Buttons */}
        {widget.actions && (
          <div className="flex gap-2">
            {widget.actions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleAction(action)}
                disabled={actionLoading === action.bind}
                className={`px-3 py-1 text-sm rounded ${
                  action.variant === 'danger'
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : action.variant === 'primary'
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } ${actionLoading === action.bind ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {actionLoading === action.bind ? 'Loading...' : action.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Widget Content */}
      <div className="widget-content flex-1 overflow-auto">
        {renderContent()}
      </div>

      {/* Widget Footer */}
      {data.lastFetch && (
        <div className="widget-footer mt-4 text-xs text-gray-500">
          Last updated: {data.lastFetch.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

// Individual widget component implementations
const KPIWidget: React.FC<{ data: any; config?: any }> = ({ data, config }) => {
  return (
    <div className="text-center">
      <div className="text-4xl font-bold mb-2">
        {config?.format === 'currency' && '£'}
        {data?.value || '0'}
        {config?.format === 'percentage' && '%'}
      </div>
      {data?.label && <div className="text-sm text-gray-600">{data.label}</div>}
      {data?.change && (
        <div className={`text-sm mt-2 ${data.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
          {data.change > 0 ? '↑' : '↓'} {Math.abs(data.change)}%
        </div>
      )}
    </div>
  );
};

const ChartWidget: React.FC<{ data: any; viz?: string; config?: any }> = ({ data, viz }) => {
  // Placeholder - would integrate with a charting library like Recharts
  return (
    <div className="flex items-center justify-center h-full">
      <ChartBarIcon className="w-12 h-12 text-gray-400" />
      <span className="ml-2 text-gray-500">Chart: {viz}</span>
    </div>
  );
};

const TableWidget: React.FC<{ data: any; config?: any }> = ({ data, config }) => {
  const rows = data?.data || data?.rows || [];
  const columns = data?.columns || (rows[0] ? Object.keys(rows[0]) : []);

  return (
    <div className="overflow-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col: string) => (
              <th key={col} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.slice(0, config?.pageSize || 10).map((row: any, idx: number) => (
            <tr key={idx}>
              {columns.map((col: string) => (
                <td key={col} className="px-4 py-2 text-sm text-gray-900">
                  {row[col]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const TimelineWidget: React.FC<{ data: any; config?: any }> = ({ data }) => {
  return (
    <div className="flex items-center justify-center h-full">
      <ClockIcon className="w-12 h-12 text-gray-400" />
      <span className="ml-2 text-gray-500">Timeline</span>
    </div>
  );
};

const TextWidget: React.FC<{ data: any; config?: any }> = ({ data, config }) => {
  return (
    <div className="prose">
      {config?.content || data || 'No content'}
    </div>
  );
};

const ActionWidget: React.FC<{
  action: WidgetAction & any;
  loading: boolean;
  onExecute: () => void;
}> = ({ action, loading, onExecute }) => {
  return (
    <button
      onClick={onExecute}
      disabled={loading}
      className={`w-full py-4 rounded-lg font-semibold flex items-center justify-center gap-2 ${
        action.variant === 'danger'
          ? 'bg-red-500 text-white hover:bg-red-600'
          : action.variant === 'primary'
          ? 'bg-blue-500 text-white hover:bg-blue-600'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {!loading && <PlayIcon className="w-5 h-5" />}
      {loading ? 'Executing...' : action.title}
    </button>
  );
};

const DataExplorerWidget: React.FC<{ namespace: string; tenantId: string }> = ({ namespace, tenantId }) => {
  // Placeholder for data explorer
  return (
    <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
      <h4 className="text-lg font-semibold mb-2">Data Explorer</h4>
      <p className="text-sm text-gray-600">
        Select datasets and metrics to explore your data interactively.
      </p>
    </div>
  );
};

export default WidgetRuntime;