import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { PeriodicExportingMetricReader, ConsoleMetricExporter } from '@opentelemetry/sdk-metrics';
import pino from 'pino';
import * as Sentry from '@sentry/nextjs';

const environment = process.env.NODE_ENV || 'development';
const serviceName = process.env.SERVICE_NAME || 'admin-portal';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: environment === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'UTC:yyyy-mm-dd HH:MM:ss.l',
      ignore: 'pid,hostname',
    }
  } : undefined,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
});

export const initMonitoring = () => {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment,
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
      profilesSampleRate: 0.1,
      integrations: [
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      beforeSend(event, hint) {
        if (environment === 'development') {
          console.log('Sentry Event:', event);
        }
        return event;
      },
    });
  }

  const sdk = new NodeSDK({
    serviceName: serviceName,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': {
          enabled: false,
        },
      }),
    ],
    metricReader: new PeriodicExportingMetricReader({
      exporter: new ConsoleMetricExporter(),
      exportIntervalMillis: 10000,
    }),
  });

  sdk.start();

  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.log('Error terminating tracing', error))
      .finally(() => process.exit(0));
  });

  return sdk;
};

export class PerformanceMonitor {
  private static timers = new Map<string, number>();

  static startTimer(label: string) {
    this.timers.set(label, performance.now());
  }

  static endTimer(label: string): number {
    const start = this.timers.get(label);
    if (!start) {
      logger.warn(`Timer ${label} was not started`);
      return 0;
    }
    const duration = performance.now() - start;
    this.timers.delete(label);
    logger.info({ label, duration }, 'Performance metric');
    return duration;
  }

  static async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.startTimer(label);
    try {
      const result = await fn();
      return result;
    } finally {
      this.endTimer(label);
    }
  }
}

export class HealthChecker {
  private static checks = new Map<string, () => Promise<boolean>>();

  static register(name: string, check: () => Promise<boolean>) {
    this.checks.set(name, check);
  }

  static async checkAll() {
    const results: Record<string, { status: string; message?: string }> = {};
    
    for (const [name, check] of this.checks) {
      try {
        const isHealthy = await check();
        results[name] = { status: isHealthy ? 'healthy' : 'unhealthy' };
      } catch (error) {
        results[name] = { 
          status: 'error', 
          message: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    }

    return results;
  }

  static async isHealthy(): Promise<boolean> {
    const results = await this.checkAll();
    return Object.values(results).every(r => r.status === 'healthy');
  }
}

export const auditLog = {
  async log(event: {
    userId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    metadata?: Record<string, any>;
    ip?: string;
    userAgent?: string;
  }) {
    const entry = {
      timestamp: new Date().toISOString(),
      ...event,
    };

    logger.info({ audit: entry }, 'Audit log');
    
    // Store in database for permanent record
    if (global.prisma) {
      try {
        await (global as any).prisma.auditLog.create({
          data: {
            userId: event.userId,
            action: event.action,
            resource: event.resource,
            resourceId: event.resourceId,
            metadata: event.metadata || {},
            ip: event.ip,
            userAgent: event.userAgent,
          },
        });
      } catch (error) {
        logger.error({ error }, 'Failed to write audit log to database');
      }
    }
  },
};

export const errorReporter = {
  report(error: Error, context?: Record<string, any>) {
    logger.error({ error, context }, 'Error reported');
    
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error, {
        extra: context,
      });
    }
  },

  reportWarning(message: string, context?: Record<string, any>) {
    logger.warn({ message, context }, 'Warning reported');
    
    if (process.env.SENTRY_DSN) {
      Sentry.captureMessage(message, 'warning');
    }
  },
};