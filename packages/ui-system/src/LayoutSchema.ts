/**
 * Layout Schema Definition
 * Versioned JSON structure for UI layouts
 */

export interface WidgetAction {
  title: string;
  bind: string;
  icon?: string;
  confirmation?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface Widget {
  id?: string;
  type: 'kpi' | 'table' | 'chart' | 'form' | 'text' | 'log' | 'timeline' |
        'iframe' | 'action' | 'segment_picker' | 'data_explorer';
  title: string;
  bind: string;
  viz?: 'line' | 'bar' | 'area' | 'pie' | 'scatter' | 'heatmap';
  actions?: WidgetAction[];
  config?: Record<string, any>;
  refresh_interval?: number;
  height?: number;
  permissions?: string[];
}

export interface Column {
  width: number; // 1-12 grid system
  widgets: Widget[];
}

export interface Row {
  columns: Column[];
  height?: string;
}

export interface Tab {
  id: string;
  title: string;
  icon?: string;
  rows: Row[];
  permissions?: string[];
}

export interface LayoutMeta {
  title: string;
  product: string;
  description?: string;
  created_by?: string;
  created_at?: string;
  published_by?: string;
  published_at?: string;
  tags?: string[];
}

export interface LayoutSchema {
  version: string;
  meta: LayoutMeta;
  tabs: Tab[];
  theme?: {
    primary_color?: string;
    background?: string;
    text_color?: string;
    border_color?: string;
  };
  settings?: {
    auto_refresh?: boolean;
    refresh_interval?: number;
    enable_export?: boolean;
    enable_fullscreen?: boolean;
  };
}

export class LayoutBuilder {
  private layout: LayoutSchema;

  constructor(product: string, title: string) {
    this.layout = {
      version: '1.0',
      meta: {
        title,
        product,
        created_at: new Date().toISOString()
      },
      tabs: []
    };
  }

  addTab(id: string, title: string, icon?: string): this {
    this.layout.tabs.push({
      id,
      title,
      icon,
      rows: []
    });
    return this;
  }

  addRow(tabId: string): this {
    const tab = this.layout.tabs.find(t => t.id === tabId);
    if (tab) {
      tab.rows.push({ columns: [] });
    }
    return this;
  }

  addColumn(tabId: string, rowIndex: number, width: number): this {
    const tab = this.layout.tabs.find(t => t.id === tabId);
    if (tab && tab.rows[rowIndex]) {
      tab.rows[rowIndex].columns.push({
        width,
        widgets: []
      });
    }
    return this;
  }

  addWidget(
    tabId: string,
    rowIndex: number,
    columnIndex: number,
    widget: Widget
  ): this {
    const tab = this.layout.tabs.find(t => t.id === tabId);
    if (tab && tab.rows[rowIndex] && tab.rows[rowIndex].columns[columnIndex]) {
      // Generate ID if not provided
      if (!widget.id) {
        widget.id = `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      tab.rows[rowIndex].columns[columnIndex].widgets.push(widget);
    }
    return this;
  }

  setTheme(theme: LayoutSchema['theme']): this {
    this.layout.theme = theme;
    return this;
  }

  setSettings(settings: LayoutSchema['settings']): this {
    this.layout.settings = settings;
    return this;
  }

  build(): LayoutSchema {
    return this.layout;
  }

  static fromJSON(json: string): LayoutSchema {
    return JSON.parse(json);
  }

  static toJSON(layout: LayoutSchema): string {
    return JSON.stringify(layout, null, 2);
  }

  // Generate default layouts for each product
  static generateDefault(product: string): LayoutSchema {
    const builder = new LayoutBuilder(product, `${product} Dashboard`);

    switch (product) {
      case 'chatbot':
        return builder
          .addTab('overview', 'Overview', 'chart-bar')
          .addRow('overview')
          .addColumn('overview', 0, 3)
          .addColumn('overview', 0, 3)
          .addColumn('overview', 0, 3)
          .addColumn('overview', 0, 3)
          .addWidget('overview', 0, 0, {
            type: 'kpi',
            title: 'Total Conversations',
            bind: 'metrics.total_conversations'
          })
          .addWidget('overview', 0, 1, {
            type: 'kpi',
            title: 'Active Sessions',
            bind: 'metrics.active_sessions'
          })
          .addWidget('overview', 0, 2, {
            type: 'kpi',
            title: 'Avg Response Time',
            bind: 'metrics.response_time'
          })
          .addWidget('overview', 0, 3, {
            type: 'kpi',
            title: 'Satisfaction',
            bind: 'metrics.satisfaction_score'
          })
          .addRow('overview')
          .addColumn('overview', 1, 8)
          .addColumn('overview', 1, 4)
          .addWidget('overview', 1, 0, {
            type: 'chart',
            title: 'Conversation Trends',
            bind: 'charts.conversation_trends',
            viz: 'line'
          })
          .addWidget('overview', 1, 1, {
            type: 'chart',
            title: 'Topics',
            bind: 'charts.topic_distribution',
            viz: 'pie'
          })
          .addTab('conversations', 'Conversations', 'message-square')
          .addRow('conversations')
          .addColumn('conversations', 0, 12)
          .addWidget('conversations', 0, 0, {
            type: 'table',
            title: 'Recent Conversations',
            bind: 'tables.conversations',
            actions: [
              {
                title: 'Export',
                bind: 'actions.export_conversations'
              }
            ]
          })
          .build();

      case 'ops-agent':
        return builder
          .addTab('overview', 'Overview', 'activity')
          .addRow('overview')
          .addColumn('overview', 0, 3)
          .addColumn('overview', 0, 3)
          .addColumn('overview', 0, 3)
          .addColumn('overview', 0, 3)
          .addWidget('overview', 0, 0, {
            type: 'kpi',
            title: 'Active Workflows',
            bind: 'metrics.active_workflows',
            refresh_interval: 5
          })
          .addWidget('overview', 0, 1, {
            type: 'kpi',
            title: 'SLA Compliance',
            bind: 'metrics.sla_compliance'
          })
          .addWidget('overview', 0, 2, {
            type: 'kpi',
            title: 'Success Rate',
            bind: 'metrics.success_rate'
          })
          .addWidget('overview', 0, 3, {
            type: 'action',
            title: 'Emergency Stop',
            bind: 'actions.pause_all',
            config: { variant: 'danger', confirmation: true }
          })
          .addRow('overview')
          .addColumn('overview', 1, 12)
          .addWidget('overview', 1, 0, {
            type: 'timeline',
            title: 'Workflow Timeline',
            bind: 'charts.workflow_timeline'
          })
          .addTab('workflows', 'Workflows', 'layers')
          .addRow('workflows')
          .addColumn('workflows', 0, 12)
          .addWidget('workflows', 0, 0, {
            type: 'table',
            title: 'Workflow Runs',
            bind: 'tables.workflows',
            actions: [
              {
                title: 'Restart',
                bind: 'actions.restart_workflow',
                confirmation: true
              },
              {
                title: 'Create New',
                bind: 'actions.create_workflow',
                variant: 'primary'
              }
            ]
          })
          .build();

      case 'data-insights':
        return builder
          .addTab('overview', 'Overview', 'trending-up')
          .addRow('overview')
          .addColumn('overview', 0, 3)
          .addColumn('overview', 0, 3)
          .addColumn('overview', 0, 3)
          .addColumn('overview', 0, 3)
          .addWidget('overview', 0, 0, {
            type: 'kpi',
            title: 'Conversion Rate',
            bind: 'metrics.conversion_rate'
          })
          .addWidget('overview', 0, 1, {
            type: 'kpi',
            title: 'AOV',
            bind: 'metrics.average_order_value'
          })
          .addWidget('overview', 0, 2, {
            type: 'kpi',
            title: 'Data Quality',
            bind: 'metrics.data_quality'
          })
          .addWidget('overview', 0, 3, {
            type: 'action',
            title: 'Generate Insights',
            bind: 'actions.generate_insights',
            config: { variant: 'primary' }
          })
          .addRow('overview')
          .addColumn('overview', 1, 8)
          .addColumn('overview', 1, 4)
          .addWidget('overview', 1, 0, {
            type: 'chart',
            title: 'KPI Trends',
            bind: 'charts.kpi_trends',
            viz: 'line'
          })
          .addWidget('overview', 1, 1, {
            type: 'chart',
            title: 'Anomalies',
            bind: 'charts.anomaly_detection',
            viz: 'scatter'
          })
          .addTab('insights', 'AI Insights', 'sparkles')
          .addRow('insights')
          .addColumn('insights', 0, 12)
          .addWidget('insights', 0, 0, {
            type: 'table',
            title: 'AI-Generated Insights',
            bind: 'tables.ai_insights',
            actions: [
              {
                title: 'Refresh',
                bind: 'actions.generate_insights'
              },
              {
                title: 'Export Report',
                bind: 'actions.export_report'
              }
            ]
          })
          .addTab('explorer', 'Data Explorer', 'search')
          .addRow('explorer')
          .addColumn('explorer', 0, 12)
          .addWidget('explorer', 0, 0, {
            type: 'data_explorer',
            title: 'Explore Your Data',
            bind: 'explorer.main'
          })
          .build();

      default:
        // Generic default layout
        return builder
          .addTab('overview', 'Overview')
          .addRow('overview')
          .addColumn('overview', 0, 12)
          .addWidget('overview', 0, 0, {
            type: 'text',
            title: 'Welcome',
            bind: 'static.welcome',
            config: {
              content: `Welcome to ${product}. Customize your dashboard to get started.`
            }
          })
          .build();
    }
  }

  // Calculate diff between two layouts
  static diff(oldLayout: LayoutSchema, newLayout: LayoutSchema): any {
    // Simple diff for now - would use a proper diff library in production
    return {
      version: oldLayout.version !== newLayout.version,
      tabs_added: newLayout.tabs.filter(t => !oldLayout.tabs.find(ot => ot.id === t.id)),
      tabs_removed: oldLayout.tabs.filter(t => !newLayout.tabs.find(nt => nt.id === t.id)),
      tabs_modified: newLayout.tabs.filter(t => {
        const oldTab = oldLayout.tabs.find(ot => ot.id === t.id);
        return oldTab && JSON.stringify(oldTab) !== JSON.stringify(t);
      })
    };
  }
}

export default LayoutSchema;