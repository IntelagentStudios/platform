export interface UsageMetrics {
  id: string;
  organizationId: string;
  period: Date;
  metrics: {
    apiCalls: number;
    storageBytes: number;
    bandwidthBytes: number;
    activeUsers: number;
    customMetrics?: Record<string, number>;
  };
  createdAt: Date;
}

export interface UsageLimit {
  id: string;
  organizationId: string;
  resource: string;
  limit: number;
  used: number;
  resetAt: Date;
  alertThreshold?: number;
}

export interface UsageAlert {
  id: string;
  organizationId: string;
  type: 'LIMIT_EXCEEDED' | 'THRESHOLD_REACHED' | 'UNUSUAL_ACTIVITY';
  resource: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}