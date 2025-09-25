/**
 * Telemetry Collector for UI System
 * Tracks widget usage, performance, and user interactions
 */

export interface TelemetryEvent {
  eventType: 'view' | 'action' | 'error' | 'performance' | 'interaction';
  widgetId?: string;
  widgetType?: string;
  action?: string;
  userId: string;
  tenantId: string;
  sessionId: string;
  timestamp: Date;
  duration?: number;
  metadata?: Record<string, any>;
  error?: Error;
}

export interface TelemetryMetrics {
  totalViews: number;
  uniqueUsers: number;
  totalActions: number;
  errorRate: number;
  avgResponseTime: number;
  topWidgets: WidgetMetric[];
  userEngagement: EngagementMetric[];
}

export interface WidgetMetric {
  widgetId: string;
  widgetType: string;
  views: number;
  actions: number;
  errors: number;
  avgDuration: number;
  lastUsed: Date;
}

export interface EngagementMetric {
  userId: string;
  sessionsCount: number;
  totalDuration: number;
  widgetsUsed: number;
  lastActive: Date;
}

export class TelemetryCollector {
  private events: TelemetryEvent[] = [];
  private batchSize = 100;
  private flushInterval = 30000; // 30 seconds
  private flushTimer: NodeJS.Timeout | null = null;
  private endpoint = '/api/ui/telemetry';
  private sessionId: string;
  private userId: string;
  private tenantId: string;

  constructor(userId: string, tenantId: string) {
    this.userId = userId;
    this.tenantId = tenantId;
    this.sessionId = this.generateSessionId();
    this.startAutoFlush();
  }

  /**
   * Track a view event
   */
  trackView(widgetId: string, widgetType: string, metadata?: Record<string, any>): void {
    this.addEvent({
      eventType: 'view',
      widgetId,
      widgetType,
      userId: this.userId,
      tenantId: this.tenantId,
      sessionId: this.sessionId,
      timestamp: new Date(),
      metadata
    });
  }

  /**
   * Track an action event
   */
  trackAction(
    widgetId: string,
    widgetType: string,
    action: string,
    metadata?: Record<string, any>
  ): void {
    this.addEvent({
      eventType: 'action',
      widgetId,
      widgetType,
      action,
      userId: this.userId,
      tenantId: this.tenantId,
      sessionId: this.sessionId,
      timestamp: new Date(),
      metadata
    });
  }

  /**
   * Track an error event
   */
  trackError(
    widgetId: string,
    widgetType: string,
    error: Error,
    metadata?: Record<string, any>
  ): void {
    this.addEvent({
      eventType: 'error',
      widgetId,
      widgetType,
      userId: this.userId,
      tenantId: this.tenantId,
      sessionId: this.sessionId,
      timestamp: new Date(),
      error,
      metadata: {
        ...metadata,
        errorMessage: error.message,
        errorStack: error.stack
      }
    });

    // Immediately flush errors
    this.flush();
  }

  /**
   * Track performance metrics
   */
  trackPerformance(
    widgetId: string,
    widgetType: string,
    duration: number,
    metadata?: Record<string, any>
  ): void {
    this.addEvent({
      eventType: 'performance',
      widgetId,
      widgetType,
      userId: this.userId,
      tenantId: this.tenantId,
      sessionId: this.sessionId,
      timestamp: new Date(),
      duration,
      metadata
    });
  }

  /**
   * Track user interactions
   */
  trackInteraction(
    widgetId: string,
    widgetType: string,
    interactionType: string,
    metadata?: Record<string, any>
  ): void {
    this.addEvent({
      eventType: 'interaction',
      widgetId,
      widgetType,
      action: interactionType,
      userId: this.userId,
      tenantId: this.tenantId,
      sessionId: this.sessionId,
      timestamp: new Date(),
      metadata
    });
  }

  /**
   * Add event to queue
   */
  private addEvent(event: TelemetryEvent): void {
    this.events.push(event);

    // Flush if batch size reached
    if (this.events.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * Flush events to server
   */
  async flush(): Promise<void> {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          events: eventsToSend,
          sessionId: this.sessionId,
          userId: this.userId,
          tenantId: this.tenantId
        })
      });
    } catch (error) {
      console.error('Failed to send telemetry:', error);
      // Re-add events to queue for retry
      this.events.unshift(...eventsToSend);
    }
  }

  /**
   * Start auto-flush timer
   */
  private startAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Stop telemetry collection
   */
  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current session metrics
   */
  getSessionMetrics(): Record<string, any> {
    const widgetCounts = new Map<string, number>();
    const actionCounts = new Map<string, number>();
    let errorCount = 0;

    this.events.forEach(event => {
      if (event.widgetId) {
        widgetCounts.set(
          event.widgetId,
          (widgetCounts.get(event.widgetId) || 0) + 1
        );
      }

      if (event.eventType === 'action' && event.action) {
        actionCounts.set(
          event.action,
          (actionCounts.get(event.action) || 0) + 1
        );
      }

      if (event.eventType === 'error') {
        errorCount++;
      }
    });

    return {
      sessionId: this.sessionId,
      userId: this.userId,
      tenantId: this.tenantId,
      eventCount: this.events.length,
      uniqueWidgets: widgetCounts.size,
      topWidgets: Array.from(widgetCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
      topActions: Array.from(actionCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
      errorCount
    };
  }

  /**
   * Calculate engagement score
   */
  calculateEngagementScore(): number {
    const metrics = this.getSessionMetrics();
    const viewWeight = 1;
    const actionWeight = 5;
    const errorPenalty = -10;

    let score = 0;
    
    this.events.forEach(event => {
      switch (event.eventType) {
        case 'view':
          score += viewWeight;
          break;
        case 'action':
        case 'interaction':
          score += actionWeight;
          break;
        case 'error':
          score += errorPenalty;
          break;
      }
    });

    // Normalize score (0-100)
    return Math.max(0, Math.min(100, score / this.events.length * 10));
  }
}

// Global telemetry instance manager
class TelemetryManager {
  private collectors: Map<string, TelemetryCollector> = new Map();

  getCollector(userId: string, tenantId: string): TelemetryCollector {
    const key = `${userId}:${tenantId}`;
    
    if (!this.collectors.has(key)) {
      this.collectors.set(key, new TelemetryCollector(userId, tenantId));
    }
    
    return this.collectors.get(key)!;
  }

  stopAll(): void {
    this.collectors.forEach(collector => collector.stop());
    this.collectors.clear();
  }
}

export const telemetryManager = new TelemetryManager();