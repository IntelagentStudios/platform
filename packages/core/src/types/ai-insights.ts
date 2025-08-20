export interface AIInsight {
  id: string;
  license_key: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  description: string;
  data: any;
  recommendations: Recommendation[];
  affected_products: string[];
  potential_impact: {
    metric: string;
    current_value: number;
    potential_value: number;
    improvement_percentage: number;
  }[];
  created_at: Date;
  expires_at?: Date;
  actioned?: boolean;
  actioned_at?: Date;
}

export interface Recommendation {
  id: string;
  action: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimated_time: string;
  automated: boolean;
  requires_approval: boolean;
  implementation_steps?: string[];
}

export type InsightType = 
  | 'performance'
  | 'opportunity'
  | 'anomaly'
  | 'trend'
  | 'prediction'
  | 'optimization'
  | 'risk'
  | 'compliance';

export type InsightSeverity = 
  | 'info'
  | 'suggestion'
  | 'warning'
  | 'critical';

export interface InsightQuery {
  query: string;
  context?: {
    products?: string[];
    time_range?: {
      start: Date;
      end: Date;
    };
    focus_area?: string;
  };
  license_key: string;
}

export interface InsightResponse {
  insights: AIInsight[];
  summary: string;
  visualizations?: Visualization[];
  next_check?: Date;
}

export interface Visualization {
  type: 'chart' | 'table' | 'metric' | 'heatmap';
  title: string;
  data: any;
  config: any;
}

export interface Pattern {
  id: string;
  name: string;
  description: string;
  occurrences: number;
  first_seen: Date;
  last_seen: Date;
  affected_metrics: string[];
  correlation_strength: number;
}

export interface Prediction {
  metric: string;
  current_value: number;
  predicted_values: {
    date: Date;
    value: number;
    confidence: number;
  }[];
  factors: string[];
  accuracy_score: number;
}