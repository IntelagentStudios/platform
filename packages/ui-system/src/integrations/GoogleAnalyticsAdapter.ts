import { IntegrationAdapter, IntegrationConfig, IntegrationMetadata, IntegrationData } from './IntegrationAdapter';

export class GoogleAnalyticsAdapter extends IntegrationAdapter {
  metadata: IntegrationMetadata = {
    id: 'google-analytics',
    name: 'Google Analytics 4',
    description: 'Connect to Google Analytics for web analytics data',
    icon: '📊',
    category: 'analytics',
    requiredScopes: [
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/analytics.edit'
    ],
    supportedActions: [
      'create_event',
      'update_user_property',
      'create_audience',
      'export_data'
    ],
    supportedTriggers: [
      'threshold_reached',
      'anomaly_detected',
      'goal_completed',
      'conversion_event'
    ]
  };

  private baseUrl = 'https://analyticsdata.googleapis.com/v1beta';
  private propertyId: string = '';

  async initialize(): Promise<boolean> {
    if (!this.config.accessToken) {
      throw new Error('Google Analytics requires an access token');
    }

    if (!this.config.customFields?.propertyId) {
      throw new Error('Google Analytics requires a property ID');
    }

    this.propertyId = this.config.customFields.propertyId;

    // Verify connection
    try {
      const response = await fetch(
        `${this.baseUrl}/properties/${this.propertyId}/metadata`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.ok;
    } catch (error) {
      console.error('Google Analytics initialization failed:', error);
      return false;
    }
  }

  async fetchData(endpoint: string, params?: Record<string, any>): Promise<IntegrationData> {
    const url = `${this.baseUrl}/properties/${this.propertyId}/${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: params ? JSON.stringify(params) : undefined
    });

    if (!response.ok) {
      throw new Error(`Google Analytics fetch failed: ${response.statusText}`);
    }

    const data = await response.json();
    return this.transformToCommon(data);
  }

  async pushData(endpoint: string, data: any): Promise<IntegrationData> {
    const url = `${this.baseUrl}/properties/${this.propertyId}/${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Google Analytics push failed: ${response.statusText}`);
    }

    const result = await response.json();
    return this.transformToCommon(result);
  }

  async getAvailableFields(): Promise<string[]> {
    // Common GA4 dimensions and metrics
    return [
      // Dimensions
      'date',
      'dateHour',
      'country',
      'city',
      'deviceCategory',
      'platform',
      'browser',
      'sourceMedium',
      'campaign',
      'pagePath',
      'eventName',
      'customEvent',
      // Metrics
      'activeUsers',
      'sessions',
      'bounceRate',
      'engagementRate',
      'screenPageViews',
      'conversions',
      'totalRevenue',
      'averageSessionDuration',
      'eventsPerSession',
      'newUsers',
      'totalUsers'
    ];
  }

  // GA4-specific methods
  async runReport(request: {
    dimensions?: string[];
    metrics?: string[];
    dateRanges?: Array<{ startDate: string; endDate: string }>;
    dimensionFilter?: any;
    metricFilter?: any;
    orderBys?: any[];
    limit?: number;
  }): Promise<IntegrationData> {
    const reportRequest = {
      dimensions: request.dimensions?.map(d => ({ name: d })),
      metrics: request.metrics?.map(m => ({ name: m })),
      dateRanges: request.dateRanges || [
        {
          startDate: '7daysAgo',
          endDate: 'today'
        }
      ],
      dimensionFilter: request.dimensionFilter,
      metricFilter: request.metricFilter,
      orderBys: request.orderBys,
      limit: request.limit || 10000
    };

    return this.fetchData('reports:runReport', reportRequest);
  }

  async runRealtimeReport(request: {
    dimensions?: string[];
    metrics?: string[];
    dimensionFilter?: any;
    metricFilter?: any;
    limit?: number;
  }): Promise<IntegrationData> {
    const reportRequest = {
      dimensions: request.dimensions?.map(d => ({ name: d })),
      metrics: request.metrics?.map(m => ({ name: m })),
      dimensionFilter: request.dimensionFilter,
      metricFilter: request.metricFilter,
      limit: request.limit || 100
    };

    return this.fetchData('reports:runRealtimeReport', reportRequest);
  }

  async getTopPages(limit: number = 10): Promise<IntegrationData> {
    return this.runReport({
      dimensions: ['pagePath', 'pageTitle'],
      metrics: ['screenPageViews', 'activeUsers', 'averageSessionDuration'],
      orderBys: [
        {
          metric: {
            metricName: 'screenPageViews'
          },
          desc: true
        }
      ],
      limit
    });
  }

  async getTrafficSources(): Promise<IntegrationData> {
    return this.runReport({
      dimensions: ['sourceMedium', 'campaign'],
      metrics: ['activeUsers', 'sessions', 'conversions'],
      orderBys: [
        {
          metric: {
            metricName: 'activeUsers'
          },
          desc: true
        }
      ]
    });
  }

  async getConversions(): Promise<IntegrationData> {
    return this.runReport({
      dimensions: ['eventName'],
      metrics: ['conversions', 'totalRevenue'],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            matchType: 'CONTAINS',
            value: 'conversion'
          }
        }
      }
    });
  }

  async getAudienceSegments(): Promise<IntegrationData> {
    return this.runReport({
      dimensions: ['customUser:segment'],
      metrics: ['activeUsers', 'sessions', 'engagementRate'],
      orderBys: [
        {
          metric: {
            metricName: 'activeUsers'
          },
          desc: true
        }
      ]
    });
  }
}