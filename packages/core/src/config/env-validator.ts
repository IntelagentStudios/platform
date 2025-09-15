/**
 * Production-grade Environment Variable Validator
 * Ensures all required environment variables are set before application starts
 */

import { z } from 'zod';

// Define the environment variable schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  DATABASE_POOL_MIN: z.string().optional().transform(val => val ? parseInt(val) : 2),
  DATABASE_POOL_MAX: z.string().optional().transform(val => val ? parseInt(val) : 10),

  // Redis
  REDIS_URL: z.string().url('REDIS_URL must be a valid URL').optional(),
  REDIS_PASSWORD: z.string().optional(),

  // Authentication
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters').optional(),

  // API Keys (Production)
  OPENAI_API_KEY: z.string().startsWith('sk-', 'OPENAI_API_KEY must start with sk-').optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_', 'STRIPE_SECRET_KEY must start with sk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_', 'Invalid STRIPE_WEBHOOK_SECRET format').optional(),
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),

  // Email Service
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional().transform(val => val ? parseInt(val) : 587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email('SMTP_FROM must be a valid email').optional(),

  // AWS (Optional)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),

  // Application
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.string().optional().transform(val => val ? parseInt(val) : 3000),
  APP_URL: z.string().url('APP_URL must be a valid URL').optional(),
  API_URL: z.string().url('API_URL must be a valid URL').optional(),

  // Security
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be at least 32 characters').optional(),
  RATE_LIMIT_MAX_REQUESTS: z.string().optional().transform(val => val ? parseInt(val) : 100),
  RATE_LIMIT_WINDOW_MS: z.string().optional().transform(val => val ? parseInt(val) : 60000),

  // Monitoring (Optional)
  SENTRY_DSN: z.string().url('SENTRY_DSN must be a valid URL').optional(),
  DATADOG_API_KEY: z.string().optional(),
  NEW_RELIC_LICENSE_KEY: z.string().optional(),

  // Feature Flags
  ENABLE_ANALYTICS: z.string().optional().transform(val => val === 'true'),
  ENABLE_SALES_AGENT: z.string().optional().transform(val => val === 'true'),
  ENABLE_AI_INSIGHTS: z.string().optional().transform(val => val === 'true'),
  ENABLE_MULTI_TENANT: z.string().optional().transform(val => val === 'true'),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),
});

// Type for validated environment variables
export type ValidatedEnv = z.infer<typeof envSchema>;

// Environment-specific required fields
const requiredByEnvironment = {
  production: [
    'DATABASE_URL',
    'REDIS_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'OPENAI_API_KEY',
    'STRIPE_SECRET_KEY',
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASSWORD',
    'ENCRYPTION_KEY',
    'APP_URL',
    'API_URL'
  ],
  staging: [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'OPENAI_API_KEY'
  ],
  development: [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET'
  ],
  test: [
    'DATABASE_URL'
  ]
};

/**
 * Validate environment variables
 */
export function validateEnv(): ValidatedEnv {
  const env = process.env.NODE_ENV || 'development';
  const required = requiredByEnvironment[env as keyof typeof requiredByEnvironment] || [];

  // Check for required environment variables
  const missing: string[] = [];
  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    const errorMessage = `Missing required environment variables for ${env} environment:\n${missing.map(k => `  - ${k}`).join('\n')}`;

    if (env === 'production' || env === 'staging') {
      // In production/staging, throw error to prevent startup
      throw new Error(errorMessage);
    } else {
      // In development/test, log warning but continue
      console.warn(`⚠️  ${errorMessage}`);
    }
  }

  // Validate all environment variables
  try {
    const validated = envSchema.parse(process.env);

    // Log successful validation in production
    if (env === 'production') {
      console.log('✅ Environment variables validated successfully');
    }

    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = `Environment variable validation failed:\n${error.errors.map(e => `  - ${e.path.join('.')}: ${e.message}`).join('\n')}`;

      if (env === 'production' || env === 'staging') {
        throw new Error(errorMessage);
      } else {
        console.warn(`⚠️  ${errorMessage}`);
      }
    }
    throw error;
  }
}

/**
 * Get validated environment variable with fallback
 */
export function getEnvVar<K extends keyof ValidatedEnv>(
  key: K,
  fallback?: ValidatedEnv[K]
): ValidatedEnv[K] {
  const validated = validateEnv();
  return validated[key] ?? fallback;
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: string): boolean {
  const featureKey = `ENABLE_${feature.toUpperCase().replace(/-/g, '_')}` as keyof ValidatedEnv;
  return getEnvVar(featureKey as any, false) as boolean;
}

/**
 * Get database configuration
 */
export function getDatabaseConfig() {
  const env = validateEnv();
  return {
    url: env.DATABASE_URL,
    pool: {
      min: env.DATABASE_POOL_MIN,
      max: env.DATABASE_POOL_MAX
    }
  };
}

/**
 * Get Redis configuration
 */
export function getRedisConfig() {
  const env = validateEnv();
  return {
    url: env.REDIS_URL,
    password: env.REDIS_PASSWORD
  };
}

/**
 * Get email configuration
 */
export function getEmailConfig() {
  const env = validateEnv();
  return {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD
    },
    from: env.SMTP_FROM
  };
}

/**
 * Initialize environment validation on module load
 */
if (process.env.NODE_ENV !== 'test') {
  validateEnv();
}