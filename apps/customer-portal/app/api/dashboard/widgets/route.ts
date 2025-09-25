import { NextRequest, NextResponse } from 'next/server';

const widgetLibrary = {
  'ops-agent': [
    { id: 'w1', type: 'metric', name: 'Active Workflows', config: { refreshInterval: 30 } },
    { id: 'w2', type: 'metric', name: 'SLA Compliance', config: { format: 'percentage' } },
    { id: 'w3', type: 'metric', name: 'Success Rate', config: { format: 'percentage' } },
    { id: 'w4', type: 'metric', name: 'Total Runs Today', config: { timeRange: 'today' } },
    { id: 'w5', type: 'chart', name: 'Workflow Timeline', config: { chartType: 'timeline' } },
    { id: 'w6', type: 'chart', name: 'Exception Trends', config: { chartType: 'line' } },
    { id: 'w7', type: 'chart', name: 'Performance Metrics', config: { chartType: 'bar' } },
    { id: 'w8', type: 'table', name: 'Recent Runs', config: { pageSize: 10 } },
    { id: 'w9', type: 'table', name: 'Exception Log', config: { severity: 'all' } },
    { id: 'w10', type: 'timeline', name: 'Process Flow', config: { zoom: 'fit' } }
  ],
  'data-insights': [
    { id: 'd1', type: 'metric', name: 'Conversion Rate', config: { format: 'percentage' } },
    { id: 'd2', type: 'metric', name: 'Average Order Value', config: { format: 'currency' } },
    { id: 'd3', type: 'metric', name: 'Active Segments', config: { format: 'number' } },
    { id: 'd4', type: 'metric', name: 'Data Quality Score', config: { format: 'percentage' } },
    { id: 'd5', type: 'chart', name: 'KPI Trends', config: { chartType: 'multiLine' } },
    { id: 'd6', type: 'chart', name: 'Revenue Analysis', config: { chartType: 'area' } },
    { id: 'd7', type: 'chart', name: 'Customer Segments', config: { chartType: 'pie' } },
    { id: 'd8', type: 'chart', name: 'Anomaly Detection', config: { chartType: 'scatter' } },
    { id: 'd9', type: 'table', name: 'AI Insights', config: { confidenceThreshold: 0.7 } },
    { id: 'd10', type: 'table', name: 'Data Issues', config: { showResolutions: true } }
  ],
  'chatbot': [
    { id: 'c1', type: 'metric', name: 'Total Conversations', config: { timeRange: 'all' } },
    { id: 'c2', type: 'metric', name: 'Active Sessions', config: { realTime: true } },
    { id: 'c3', type: 'metric', name: 'Response Time', config: { format: 'duration' } },
    { id: 'c4', type: 'metric', name: 'Satisfaction Score', config: { format: 'rating' } },
    { id: 'c5', type: 'chart', name: 'Conversation Trends', config: { chartType: 'area' } },
    { id: 'c6', type: 'chart', name: 'Topic Distribution', config: { chartType: 'pie' } },
    { id: 'c7', type: 'chart', name: 'Peak Hours', config: { chartType: 'heatmap' } },
    { id: 'c8', type: 'table', name: 'Recent Conversations', config: { pageSize: 20 } },
    { id: 'c9', type: 'table', name: 'Top Questions', config: { limit: 10 } },
    { id: 'c10', type: 'timeline', name: 'Conversation Flow', config: { showSentiment: true } }
  ]
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productType = searchParams.get('productType');

    if (!productType) {
      return NextResponse.json({ error: 'Missing product type' }, { status: 400 });
    }

    const widgets = widgetLibrary[productType as keyof typeof widgetLibrary] || [];

    return NextResponse.json({
      widgets,
      categories: ['metric', 'chart', 'table', 'timeline'],
      totalCount: widgets.length
    });
  } catch (error) {
    console.error('Error fetching widgets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}