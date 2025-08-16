// Custom error classes for the platform

export class PlatformError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'PlatformError';
  }
}

export class AuthenticationError extends PlatformError {
  constructor(message: string = 'Authentication failed', details?: any) {
    super(message, 'AUTHENTICATION_ERROR', 401, details);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends PlatformError {
  constructor(message: string = 'Access denied', details?: any) {
    super(message, 'AUTHORIZATION_ERROR', 403, details);
    this.name = 'AuthorizationError';
  }
}

export class ValidationError extends PlatformError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends PlatformError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(message, 'NOT_FOUND', 404, details);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends PlatformError {
  constructor(message: string = 'Rate limit exceeded', details?: any) {
    super(message, 'RATE_LIMITED', 429, details);
    this.name = 'RateLimitError';
  }
}

export class LicenseError extends PlatformError {
  constructor(message: string = 'License error', details?: any) {
    super(message, 'LICENSE_ERROR', 403, details);
    this.name = 'LicenseError';
  }
}

export class ProductNotLicensedError extends PlatformError {
  constructor(product: string, details?: any) {
    super(`Product '${product}' is not licensed`, 'PRODUCT_NOT_LICENSED', 403, details);
    this.name = 'ProductNotLicensedError';
  }
}

export class IntegrationError extends PlatformError {
  constructor(message: string = 'Integration error', details?: any) {
    super(message, 'INTEGRATION_ERROR', 500, details);
    this.name = 'IntegrationError';
  }
}

export function isPlatformError(error: any): error is PlatformError {
  return error instanceof PlatformError;
}

export function handleError(error: any): { message: string; code: string; statusCode: number } {
  if (isPlatformError(error)) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode
    };
  }
  
  return {
    message: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    statusCode: 500
  };
}