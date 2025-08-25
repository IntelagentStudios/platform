import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@intelagent/database';
import { getAuthFromCookies } from '@/lib/auth';
import crypto from 'crypto';

// Generate a secure API key
function generateApiKey(): string {
  const prefix = 'sk_live_';
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return `${prefix}${randomBytes}`;
}

// Hash API key for storage
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// Get key preview (first and last 4 characters)
function getKeyPreview(key: string): string {
  if (key.length <= 20) return key;
  return `${key.substring(0, 12)}...${key.substring(key.length - 4)}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthFromCookies();
    if (!session?.license_key) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all API keys for the user's license
    const apiKeys = await prisma.api_keys.findMany({
      where: {
        license_key: session.license_key
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Format keys for response (never send actual keys)
    const formattedKeys = apiKeys.map(key => ({
      id: key.id,
      name: key.name,
      keyPreview: key.key ? `${key.key.substring(0, 8)}...${key.key.substring(key.key.length - 4)}` : '',
      createdAt: key.created_at,
      lastUsed: key.last_used_at,
      expiresAt: key.expires_at,
      permissions: key.scopes || ['read'],
      rateLimit: key.rate_limit || 100,
      status: key.status,
      usage: {
        requests: 0, // These fields don't exist in the schema
        errors: 0,
        lastRequest: key.last_used_at
      }
    }));

    return NextResponse.json({
      keys: formattedKeys
    });

  } catch (error) {
    console.error('Failed to fetch API keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthFromCookies();
    if (!session?.license_key) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, permissions, expiry } = await request.json();

    // Validate input
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'API key name is required' },
        { status: 400 }
      );
    }

    // Check API key limit (e.g., max 10 keys per license)
    const keyCount = await prisma.api_keys.count({
      where: {
        license_key: session.license_key,
        status: 'active'
      }
    });

    if (keyCount >= 10) {
      return NextResponse.json(
        { error: 'Maximum number of API keys reached. Please revoke unused keys.' },
        { status: 400 }
      );
    }

    // Generate new API key
    const apiKey = generateApiKey();
    const hashedKey = hashApiKey(apiKey);
    const keyPreview = getKeyPreview(apiKey);

    // Calculate expiration date
    let expiresAt = null;
    if (expiry && expiry !== 'never') {
      const now = new Date();
      switch (expiry) {
        case '7days':
          expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
        case '90days':
          expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
          break;
        case '1year':
          expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    // Create API key record
    const newKey = await prisma.api_keys.create({
      data: {
        license_key: session.license_key,
        name: name.trim(),
        key: hashedKey, // Store the hashed key
        scopes: permissions || ['read'],
        expires_at: expiresAt,
        status: 'active',
        rate_limit: 100, // Default rate limit
        created_at: new Date()
      }
    });

    // TODO: Log API key creation in audit_logs since events table doesn't exist
    await prisma.audit_logs.create({
      data: {
        license_key: session.license_key,
        user_id: session.license_key,
        action: 'api_key_created',
        resource_type: 'api_key',
        resource_id: newKey.id,
        changes: {
          name: newKey.name,
          permissions
        }
      }
    });

    return NextResponse.json({
      id: newKey.id,
      name: newKey.name,
      key: apiKey, // Only return the full key on creation
      keyPreview,
      createdAt: newKey.created_at,
      expiresAt: newKey.expires_at,
      permissions: newKey.scopes,
      message: 'API key created successfully. Make sure to copy it now.'
    });

  } catch (error) {
    console.error('Failed to create API key:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}