import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@intelagent/database';

interface SecurityConfig {
  requireApiKey?: boolean;
  requireAuth?: boolean;
  allowedOrigins?: string[];
  allowedMethods?: string[];
  validateSignature?: boolean;
  ipWhitelist?: string[];
  ipBlacklist?: string[];
}

// CORS configuration
export function corsHeaders(origin: string | null, config: SecurityConfig = {}) {
  const headers = new Headers();
  
  const allowedOrigins = config.allowedOrigins || [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'https://intelagent.ai',
    'https://app.intelagent.ai'
  ];

  if (origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin))) {
    headers.set('Access-Control-Allow-Origin', origin);
  }

  headers.set('Access-Control-Allow-Methods', (config.allowedMethods || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']).join(', '));
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Signature, X-License-Key');
  headers.set('Access-Control-Max-Age', '86400');
  
  return headers;
}

// API Key validation
export async function validateApiKey(apiKey: string): Promise<{ valid: boolean; licenseKey?: string; plan?: string }> {
  try {
    // Check if it's a system API key
    if (apiKey === process.env.MASTER_API_KEY) {
      return { valid: true, plan: 'master' };
    }

    // Check database for API key
    const apiKeyRecord = await prisma.api_keys.findUnique({
      where: { key: apiKey },
      include: {
        license: true
      }
    });

    if (!apiKeyRecord || apiKeyRecord.status !== 'active') {
      return { valid: false };
    }

    // Check if key is expired
    if (apiKeyRecord.expires_at && new Date(apiKeyRecord.expires_at) < new Date()) {
      return { valid: false };
    }

    // Update last used
    await prisma.api_keys.update({
      where: { key: apiKey },
      data: { last_used_at: new Date() }
    });

    return {
      valid: true,
      licenseKey: apiKeyRecord.license_key,
      plan: apiKeyRecord.license?.plan || 'starter'
    };
  } catch (error) {
    console.error('API key validation error:', error);
    return { valid: false };
  }
}

// Signature validation for webhooks
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// IP-based access control
export function validateIpAccess(
  ip: string,
  config: SecurityConfig
): boolean {
  // Check blacklist first
  if (config.ipBlacklist && config.ipBlacklist.includes(ip)) {
    return false;
  }

  // Check whitelist if configured
  if (config.ipWhitelist && config.ipWhitelist.length > 0) {
    return config.ipWhitelist.includes(ip);
  }

  return true;
}

// Main security middleware
export async function securityMiddleware(
  request: NextRequest,
  config: SecurityConfig = {}
): Promise<NextResponse | null> {
  // Get client IP
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';

  // Check IP access
  if (!validateIpAccess(ip, config)) {
    return new NextResponse(
      JSON.stringify({ error: 'Access denied' }),
      { status: 403 }
    );
  }

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: corsHeaders(request.headers.get('origin'), config)
    });
  }

  // Validate API key if required
  if (config.requireApiKey) {
    const apiKey = request.headers.get('x-api-key');
    
    if (!apiKey) {
      return new NextResponse(
        JSON.stringify({ error: 'API key required' }),
        { status: 401 }
      );
    }

    const validation = await validateApiKey(apiKey);
    if (!validation.valid) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401 }
      );
    }

    // Add validation info to request for downstream use
    (request as any).apiKeyInfo = validation;
  }

  // Validate webhook signature if required
  if (config.validateSignature) {
    const signature = request.headers.get('x-signature');
    const webhookSecret = process.env.WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401 }
      );
    }

    const body = await request.text();
    if (!validateWebhookSignature(body, signature, webhookSecret)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401 }
      );
    }
  }

  return null;
}

// Content Security Policy
export function getCSPHeader(): string {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.intelagent.ai",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.intelagent.ai wss://realtime.intelagent.ai",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ];

  return csp.join('; ');
}

// Security headers
export function securityHeaders(): Headers {
  const headers = new Headers();
  
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('Content-Security-Policy', getCSPHeader());
  
  if (process.env.NODE_ENV === 'production') {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  return headers;
}

// Sanitize user input
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Remove potential XSS vectors
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[sanitizeInput(key)] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

// SQL injection prevention helper
export function escapeSqlIdentifier(identifier: string): string {
  return identifier.replace(/[^a-zA-Z0-9_]/g, '');
}

// Generate secure tokens
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

// Hash sensitive data
export async function hashData(data: string): Promise<string> {
  return crypto
    .createHash('sha256')
    .update(data + (process.env.HASH_SALT || ''))
    .digest('hex');
}

// Encrypt/decrypt sensitive data
const algorithm = 'aes-256-gcm';
const secretKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

export function encrypt(text: string): { encrypted: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, 'hex'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

export function decrypt(encrypted: string, iv: string, tag: string): string {
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(secretKey, 'hex'),
    Buffer.from(iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

export default {
  corsHeaders,
  validateApiKey,
  validateWebhookSignature,
  validateIpAccess,
  securityMiddleware,
  securityHeaders,
  sanitizeInput,
  escapeSqlIdentifier,
  generateSecureToken,
  hashData,
  encrypt,
  decrypt
};