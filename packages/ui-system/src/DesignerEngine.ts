/**
 * Designer Engine with AI
 * Generates and modifies layouts using AI assistance
 */

import { LayoutSchema, LayoutBuilder } from './LayoutSchema';
import { DataCatalog } from './DataCatalog';

export interface DesignerRequest {
  description: string;
  product: string;
  skills?: string[];
  integrations?: string[];
  currentLayout?: LayoutSchema;
}

export interface DesignerResponse {
  draftLayout: LayoutSchema;
  rationale: string;
  diff?: any;
  suggestions?: string[];
}

export class DesignerEngine {
  private catalog: DataCatalog;

  constructor() {
    this.catalog = new DataCatalog();
  }

  /**
   * Generate a layout from description and available resources
   */
  async propose(request: DesignerRequest): Promise<DesignerResponse> {
    const { description, product, skills = [], integrations = [], currentLayout } = request;

    // Parse the natural language description
    const intent = this.parseIntent(description);

    if (currentLayout) {
      // Modify existing layout
      return this.modifyLayout(currentLayout, intent, description);
    } else {
      // Generate new layout
      return this.generateLayout(product, skills, integrations, intent);
    }
  }

  /**
   * Parse user intent from natural language
   */
  private parseIntent(description: string): any {
    const intent: any = {
      action: 'unknown',
      targets: [],
      widgets: [],
      metrics: []
    };

    // Detect action types
    if (description.match(/add|create|new/i)) {
      intent.action = 'add';
    } else if (description.match(/remove|delete/i)) {
      intent.action = 'remove';
    } else if (description.match(/move|reorder/i)) {
      intent.action = 'move';
    } else if (description.match(/pin|fix|lock/i)) {
      intent.action = 'pin';
    }

    // Detect widget types
    if (description.match(/tab/i)) {
      intent.targets.push('tab');
    }
    if (description.match(/kpi|metric/i)) {
      intent.widgets.push('kpi');
    }
    if (description.match(/chart|graph/i)) {
      intent.widgets.push('chart');
    }
    if (description.match(/table|list/i)) {
      intent.widgets.push('table');
    }
    if (description.match(/button|action/i)) {
      intent.widgets.push('action');
    }

    // Extract specific metrics
    const metricMatches = description.match(/(reply rate|conversion|revenue|leads|campaigns|workflows)/gi);
    if (metricMatches) {
      intent.metrics = metricMatches.map(m => m.toLowerCase());
    }

    // Detect visualization preferences
    if (description.match(/bar chart/i)) {
      intent.viz = 'bar';
    } else if (description.match(/line chart|trend/i)) {
      intent.viz = 'line';
    } else if (description.match(/pie chart|distribution/i)) {
      intent.viz = 'pie';
    }

    // Detect position preferences
    if (description.match(/top|first/i)) {
      intent.position = 'top';
    } else if (description.match(/bottom|last/i)) {
      intent.position = 'bottom';
    } else if (description.match(/left/i)) {
      intent.position = 'left';
    } else if (description.match(/right/i)) {
      intent.position = 'right';
    }

    return intent;
  }

  /**
   * Generate a new layout based on product and requirements
   */
  private async generateLayout(
    product: string,
    skills: string[],
    integrations: string[],
    intent: any
  ): Promise<DesignerResponse> {
    // Get available widgets from catalog
    const catalogNamespace = this.mapProductToNamespace(product);
    const availableWidgets = this.catalog.getAvailableWidgets(catalogNamespace);

    // Use default generator as base
    const defaultLayout = LayoutBuilder.generateDefault(product, skills);

    // Enhance based on intent
    if (intent.action === 'add' && intent.metrics.length > 0) {
      this.addRequestedMetrics(defaultLayout, intent.metrics, catalogNamespace);
    }

    // Add integration-specific widgets if integrations are present
    if (integrations.length > 0) {
      this.addIntegrationWidgets(defaultLayout, integrations, catalogNamespace);
    }

    return {
      draftLayout: defaultLayout,
      rationale: this.generateRationale(product, skills, integrations, intent),
      suggestions: this.generateSuggestions(product, availableWidgets)
    };
  }

  /**
   * Modify an existing layout based on user intent
   */
  private modifyLayout(
    currentLayout: LayoutSchema,
    intent: any,
    description: string
  ): DesignerResponse {
    const modifiedLayout = JSON.parse(JSON.stringify(currentLayout)); // Deep clone

    let rationale = '';

    switch (intent.action) {
      case 'add':
        if (intent.targets.includes('tab') && intent.metrics.length > 0) {
          // Add a new tab with specified content
          const newTab = {
            id: `tab-${Date.now()}`,
            title: intent.metrics[0] || 'New Tab',
            rows: [{
              columns: [{
                width: 12,
                widgets: this.createWidgetsForMetrics(intent.metrics, intent.widgets)
              }]
            }]
          };
          modifiedLayout.tabs.push(newTab);
          rationale = `Added new tab "${newTab.title}" with requested widgets`;
        } else if (intent.widgets.includes('kpi') && intent.metrics.length > 0) {
          // Add KPI to first tab
          const kpiWidget = {
            type: 'kpi' as const,
            title: this.formatMetricName(intent.metrics[0]),
            bind: `metrics.${intent.metrics[0].replace(/\s+/g, '_')}`
          };

          if (modifiedLayout.tabs[0] && modifiedLayout.tabs[0].rows[0]) {
            // Add new column for KPI
            modifiedLayout.tabs[0].rows[0].columns.push({
              width: 3,
              widgets: [kpiWidget]
            });
            rationale = `Added ${kpiWidget.title} KPI to overview`;
          }
        }
        break;

      case 'remove':
        // Remove widgets matching the description
        if (intent.metrics.length > 0) {
          modifiedLayout.tabs.forEach((tab: any) => {
            tab.rows.forEach((row: any) => {
              row.columns.forEach((col: any) => {
                col.widgets = col.widgets.filter((w: any) =>
                  !intent.metrics.some((m: string) => w.bind?.includes(m))
                );
              });
            });
          });
          rationale = `Removed widgets related to: ${intent.metrics.join(', ')}`;
        }
        break;

      case 'pin':
        // Move widget to prominent position
        if (intent.metrics.length > 0 && intent.position) {
          // Find the widget
          let targetWidget: any = null;
          modifiedLayout.tabs.forEach((tab: any) => {
            tab.rows.forEach((row: any) => {
              row.columns.forEach((col: any) => {
                const widget = col.widgets.find((w: any) =>
                  intent.metrics.some((m: string) => w.bind?.includes(m))
                );
                if (widget) {
                  targetWidget = widget;
                  col.widgets = col.widgets.filter((w: any) => w !== widget);
                }
              });
            });
          });

          // Place at requested position
          if (targetWidget && modifiedLayout.tabs[0] && modifiedLayout.tabs[0].rows[0]) {
            const position = intent.position === 'left' ? 0 :
                           intent.position === 'right' ? modifiedLayout.tabs[0].rows[0].columns.length : 0;

            if (modifiedLayout.tabs[0].rows[0].columns[position]) {
              modifiedLayout.tabs[0].rows[0].columns[position].widgets.unshift(targetWidget);
            }
            rationale = `Pinned ${targetWidget.title} to ${intent.position}`;
          }
        }
        break;
    }

    const diff = LayoutBuilder.diff(currentLayout, modifiedLayout);

    return {
      draftLayout: modifiedLayout,
      rationale: rationale || `Applied changes based on: "${description}"`,
      diff
    };
  }

  /**
   * Generate proactive suggestions based on telemetry
   */
  async generateProactiveSuggestions(
    currentLayout: LayoutSchema,
    telemetry: any
  ): Promise<DesignerResponse[]> {
    const suggestions: DesignerResponse[] = [];

    // Analyze widget usage
    const lowUsageWidgets = telemetry.widgets.filter((w: any) => w.views < 10 && w.age > 7);
    const highActionWidgets = telemetry.widgets.filter((w: any) => w.actionClicks > 50);

    // Suggest removing low-usage widgets
    if (lowUsageWidgets.length > 0) {
      const modifiedLayout = JSON.parse(JSON.stringify(currentLayout));
      // Remove low usage widgets
      modifiedLayout.tabs.forEach((tab: any) => {
        tab.rows.forEach((row: any) => {
          row.columns.forEach((col: any) => {
            col.widgets = col.widgets.filter((w: any) =>
              !lowUsageWidgets.some((lw: any) => lw.id === w.id)
            );
          });
        });
      });

      suggestions.push({
        draftLayout: modifiedLayout,
        rationale: `These widgets are rarely viewed: ${lowUsageWidgets.map((w: any) => w.title).join(', ')}. Consider removing them or moving to a separate analytics tab.`,
        diff: LayoutBuilder.diff(currentLayout, modifiedLayout)
      });
    }

    // Suggest adding actions near high-interaction widgets
    highActionWidgets.forEach((widget: any) => {
      const modifiedLayout = JSON.parse(JSON.stringify(currentLayout));
      // Find the widget and add related actions
      modifiedLayout.tabs.forEach((tab: any) => {
        tab.rows.forEach((row: any) => {
          row.columns.forEach((col: any) => {
            const w = col.widgets.find((w: any) => w.id === widget.id);
            if (w && !w.actions) {
              w.actions = this.suggestActionsForWidget(w);
            }
          });
        });
      });

      suggestions.push({
        draftLayout: modifiedLayout,
        rationale: `Widget "${widget.title}" has high interaction. Added quick action buttons for common tasks.`,
        diff: LayoutBuilder.diff(currentLayout, modifiedLayout)
      });
    });

    return suggestions;
  }

  // Helper methods
  private mapProductToNamespace(product: string): string {
    const mappings: Record<string, string> = {
      'chatbot': 'chatbot',
      'outreach': 'outreach',
      'ops': 'ops-agent',
      'ops-agent': 'ops-agent',
      'insights': 'data-insights',
      'data-insights': 'data-insights'
    };
    return mappings[product] || product;
  }

  private createWidgetsForMetrics(metrics: string[], widgetTypes: string[]): any[] {
    const widgets: any[] = [];

    metrics.forEach(metric => {
      const type = widgetTypes[0] || 'kpi';
      widgets.push({
        type,
        title: this.formatMetricName(metric),
        bind: `metrics.${metric.replace(/\s+/g, '_')}`,
        viz: type === 'chart' ? 'line' : undefined
      });
    });

    return widgets;
  }

  private formatMetricName(metric: string): string {
    return metric
      .split(/[\s_]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private addRequestedMetrics(layout: LayoutSchema, metrics: string[], namespace: string) {
    // Add requested metrics to the first tab
    if (layout.tabs[0] && layout.tabs[0].rows[0]) {
      metrics.forEach(metric => {
        const widget = {
          type: 'kpi' as const,
          title: this.formatMetricName(metric),
          bind: `metrics.${metric.replace(/\s+/g, '_')}`
        };

        // Find or create a column for the widget
        let added = false;
        layout.tabs[0].rows[0].columns.forEach(col => {
          if (!added && col.widgets.length < 2) {
            col.widgets.push(widget);
            added = true;
          }
        });

        if (!added) {
          layout.tabs[0].rows[0].columns.push({
            width: 3,
            widgets: [widget]
          });
        }
      });
    }
  }

  private addIntegrationWidgets(layout: LayoutSchema, integrations: string[], namespace: string) {
    // Add a tab for each integration
    integrations.forEach(integration => {
      const tab = {
        id: integration,
        title: this.formatMetricName(integration),
        rows: [{
          columns: [{
            width: 12,
            widgets: [{
              type: 'table' as const,
              title: `${this.formatMetricName(integration)} Data`,
              bind: `${integration}.data`,
              actions: [{
                title: 'Sync',
                bind: `actions.sync_${integration}`
              }]
            }]
          }]
        }]
      };
      layout.tabs.push(tab);
    });
  }

  private suggestActionsForWidget(widget: any): any[] {
    const actions: any[] = [];

    // Suggest actions based on widget type and bind
    if (widget.bind?.includes('campaigns')) {
      actions.push({ title: 'Send Follow-ups', bind: 'actions.send_followups' });
    }
    if (widget.bind?.includes('workflows')) {
      actions.push({ title: 'Restart', bind: 'actions.restart_workflow' });
    }
    if (widget.bind?.includes('insights')) {
      actions.push({ title: 'Export', bind: 'actions.export_report' });
    }

    return actions;
  }

  private generateRationale(product: string, skills: string[], integrations: string[], intent: any): string {
    const parts: string[] = [];

    parts.push(`Created dashboard for ${product} with ${skills.length} skills.`);

    if (intent.metrics.length > 0) {
      parts.push(`Added requested metrics: ${intent.metrics.join(', ')}.`);
    }

    if (integrations.length > 0) {
      parts.push(`Integrated with: ${integrations.join(', ')}.`);
    }

    parts.push(`Layout includes overview KPIs, trend charts, and action buttons for common tasks.`);

    return parts.join(' ');
  }

  private generateSuggestions(product: string, availableWidgets: string[]): string[] {
    const suggestions: string[] = [];

    suggestions.push(`You can add any of ${availableWidgets.length} available widgets.`);
    suggestions.push(`Try: "Add a chart showing weekly trends"`);
    suggestions.push(`Try: "Pin conversion rate to the top"`);
    suggestions.push(`Try: "Add a new tab for analytics"`);

    return suggestions;
  }
}

export const designerEngine = new DesignerEngine();