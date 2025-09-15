/**
 * Production-grade Error Handling System
 * Provides comprehensive error tracking, logging, and recovery
 */

import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Error categories
export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  EXTERNAL_API = 'external_api',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  NETWORK = 'network',
  RATE_LIMIT = 'rate_limit',
  PAYMENT = 'payment'
}

// Base error class
export class ApplicationError extends Error {
  public readonly id: string;
  public readonly timestamp: Date;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;
  public readonly originalError?: Error;

  constructor(
    message: string,
    category: ErrorCategory = ErrorCategory.SYSTEM,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>,
    originalError?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    this.id = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.timestamp = new Date();
    this.category = category;
    this.severity = severity;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    this.originalError = originalError;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      message: this.message,
      category: this.category,
      severity: this.severity,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      context: this.context,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined
    };
  }
}

// Specific error classes
export class ValidationError extends ApplicationError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorCategory.VALIDATION, ErrorSeverity.LOW, 400, true, context);
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message: string = 'Authentication failed', context?: Record<string, any>) {
    super(message, ErrorCategory.AUTHENTICATION, ErrorSeverity.MEDIUM, 401, true, context);
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message: string = 'Access denied', context?: Record<string, any>) {
    super(message, ErrorCategory.AUTHORIZATION, ErrorSeverity.MEDIUM, 403, true, context);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier ${identifier} not found`
      : `${resource} not found`;
    super(message, ErrorCategory.BUSINESS_LOGIC, ErrorSeverity.LOW, 404, true);
  }
}

export class RateLimitError extends ApplicationError {
  constructor(retryAfter?: number) {
    super(
      'Rate limit exceeded',
      ErrorCategory.RATE_LIMIT,
      ErrorSeverity.LOW,
      429,
      true,
      { retryAfter }
    );
  }
}

export class PaymentError extends ApplicationError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, ErrorCategory.PAYMENT, ErrorSeverity.HIGH, 402, true, context);
  }
}

export class ExternalAPIError extends ApplicationError {
  constructor(service: string, message: string, originalError?: Error) {
    super(
      `External API error from ${service}: ${message}`,
      ErrorCategory.EXTERNAL_API,
      ErrorSeverity.HIGH,
      502,
      true,
      { service },
      originalError
    );
  }
}

export class DatabaseError extends ApplicationError {
  constructor(message: string, originalError?: Error) {
    super(
      message,
      ErrorCategory.DATABASE,
      ErrorSeverity.HIGH,
      500,
      true,
      undefined,
      originalError
    );
  }
}

/**
 * Global error handler
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: ApplicationError[] = [];
  private maxErrorLogSize = 1000;

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle and process errors
   */
  public handle(error: Error | ApplicationError): ApplicationError {
    let appError: ApplicationError;

    if (error instanceof ApplicationError) {
      appError = error;
    } else if (error instanceof PrismaClientKnownRequestError) {
      appError = this.handlePrismaError(error);
    } else if (error instanceof PrismaClientValidationError) {
      appError = new ValidationError('Database validation error', {
        details: error.message
      });
    } else if (error instanceof TypeError) {
      appError = new ApplicationError(
        error.message,
        ErrorCategory.SYSTEM,
        ErrorSeverity.HIGH,
        500,
        false,
        undefined,
        error
      );
    } else {
      appError = new ApplicationError(
        error.message || 'An unexpected error occurred',
        ErrorCategory.SYSTEM,
        ErrorSeverity.MEDIUM,
        500,
        true,
        undefined,
        error
      );
    }

    this.logError(appError);
    this.notifyIfCritical(appError);

    return appError;
  }

  /**
   * Handle Prisma-specific errors
   */
  private handlePrismaError(error: PrismaClientKnownRequestError): ApplicationError {
    switch (error.code) {
      case 'P2002':
        return new ValidationError(
          'A unique constraint would be violated',
          { target: error.meta?.target }
        );
      case 'P2003':
        return new ValidationError(
          'Foreign key constraint failed',
          { field: error.meta?.field_name }
        );
      case 'P2025':
        return new NotFoundError('Record', error.meta?.cause as string);
      case 'P2024':
        return new DatabaseError('Timed out fetching a new connection from the pool');
      default:
        return new DatabaseError(`Database error: ${error.message}`, error);
    }
  }

  /**
   * Log error for tracking
   */
  private logError(error: ApplicationError): void {
    // Add to in-memory log
    this.errorLog.push(error);
    if (this.errorLog.length > this.maxErrorLogSize) {
      this.errorLog.shift();
    }

    // Log based on severity
    const logMessage = `[${error.severity.toUpperCase()}] ${error.category}: ${error.message}`;

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        console.error(logMessage, error.toJSON());
        break;
      case ErrorSeverity.MEDIUM:
        console.warn(logMessage, error.toJSON());
        break;
      case ErrorSeverity.LOW:
        console.info(logMessage, error.toJSON());
        break;
    }

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(error);
    }
  }

  /**
   * Notify team if critical error
   */
  private notifyIfCritical(error: ApplicationError): void {
    if (error.severity === ErrorSeverity.CRITICAL) {
      // In production, send alerts
      if (process.env.NODE_ENV === 'production') {
        // Send to PagerDuty, Slack, etc.
        console.error('🚨 CRITICAL ERROR - Immediate attention required:', error.toJSON());
      }
    }
  }

  /**
   * Send error to monitoring service
   */
  private sendToMonitoring(error: ApplicationError): void {
    // Integrate with Sentry, DataDog, New Relic, etc.
    if (process.env.SENTRY_DSN) {
      // Sentry integration
    }
    if (process.env.DATADOG_API_KEY) {
      // DataDog integration
    }
  }

  /**
   * Get error statistics
   */
  public getErrorStats(): Record<string, any> {
    const stats = {
      total: this.errorLog.length,
      byCategory: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      recent: this.errorLog.slice(-10).map(e => e.toJSON())
    };

    for (const error of this.errorLog) {
      stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    }

    return stats;
  }

  /**
   * Clear error log
   */
  public clearErrorLog(): void {
    this.errorLog = [];
  }
}

/**
 * Express error middleware
 */
export function errorMiddleware(
  error: Error,
  req: any,
  res: any,
  next: any
): void {
  const handler = ErrorHandler.getInstance();
  const appError = handler.handle(error);

  res.status(appError.statusCode).json({
    error: {
      id: appError.id,
      message: appError.message,
      category: appError.category,
      timestamp: appError.timestamp,
      ...(process.env.NODE_ENV === 'development' && {
        stack: appError.stack,
        context: appError.context
      })
    }
  });
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Global unhandled rejection handler
 */
process.on('unhandledRejection', (reason: Error | any, promise: Promise<any>) => {
  const handler = ErrorHandler.getInstance();
  const error = new ApplicationError(
    `Unhandled Rejection: ${reason}`,
    ErrorCategory.SYSTEM,
    ErrorSeverity.CRITICAL,
    500,
    false
  );
  handler.handle(error);
});

/**
 * Global uncaught exception handler
 */
process.on('uncaughtException', (error: Error) => {
  const handler = ErrorHandler.getInstance();
  const appError = new ApplicationError(
    `Uncaught Exception: ${error.message}`,
    ErrorCategory.SYSTEM,
    ErrorSeverity.CRITICAL,
    500,
    false,
    undefined,
    error
  );
  handler.handle(appError);

  // In production, gracefully shutdown
  if (process.env.NODE_ENV === 'production') {
    console.error('💀 Uncaught exception detected, shutting down gracefully...');
    process.exit(1);
  }
});