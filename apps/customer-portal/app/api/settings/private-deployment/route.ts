import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Encryption helper for sensitive data
function encrypt(text: string, key: string): string {
  const algorithm = 'aes-256-cbc';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv);
  
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string, key: string): string {
  const algorithm = 'aes-256-cbc';
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'hex'), iv);
  
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString();
}

export async function GET(request: NextRequest) {
  try {
    // Get user's license key from session/cookies
    const licenseKey = request.cookies.get('licenseKey')?.value;
    
    if (!licenseKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch configuration from database
    const config = await prisma.product_configurations.findFirst({
      where: {
        product_key: licenseKey,
        config_key: 'private_deployment'
      }
    });

    if (!config) {
      return NextResponse.json({
        database: null,
        llm: null,
        security: null
      });
    }

    const savedConfig = JSON.parse(config.config_value as string);
    
    // Don't send sensitive data back to client
    if (savedConfig.database) {
      savedConfig.database.password = savedConfig.database.password ? '••••••••' : '';
    }
    if (savedConfig.llm) {
      savedConfig.llm.apiKey = savedConfig.llm.apiKey ? '••••••••' : '';
    }
    if (savedConfig.security) {
      savedConfig.security.encryptionKey = savedConfig.security.encryptionKey ? '••••••••' : '';
    }

    return NextResponse.json(savedConfig);
  } catch (error) {
    console.error('Error fetching configuration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { database, llm, security } = body;

    // Get user's license key from session/cookies
    const licenseKey = request.cookies.get('licenseKey')?.value;
    const userId = request.cookies.get('userId')?.value;
    
    if (!licenseKey || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate or get encryption key for this tenant
    let encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      // Generate a new key if not set
      encryptionKey = crypto.randomBytes(32).toString('hex');
      console.warn('No ENCRYPTION_KEY set, using generated key. Set this in production!');
    }

    // Encrypt sensitive fields
    const configToSave = {
      database: {
        ...database,
        password: database.password && database.password !== '••••••••' 
          ? encrypt(database.password, encryptionKey) 
          : undefined,
        apiKey: database.apiKey && database.apiKey !== '••••••••'
          ? encrypt(database.apiKey, encryptionKey)
          : undefined
      },
      llm: {
        ...llm,
        apiKey: llm.apiKey && llm.apiKey !== '••••••••'
          ? encrypt(llm.apiKey, encryptionKey)
          : undefined
      },
      security: {
        ...security,
        encryptionKey: security.encryptionKey && security.encryptionKey !== '••••••••'
          ? encrypt(security.encryptionKey, encryptionKey)
          : undefined
      },
      metadata: {
        updatedAt: new Date().toISOString(),
        updatedBy: userId,
        version: '1.0'
      }
    };

    // Save to database
    await prisma.product_configurations.upsert({
      where: {
        product_key_config_key: {
          product_key: licenseKey,
          config_key: 'private_deployment'
        }
      },
      update: {
        config_value: JSON.stringify(configToSave),
        updated_at: new Date()
      },
      create: {
        product_key: licenseKey,
        config_key: 'private_deployment',
        config_value: JSON.stringify(configToSave),
        created_at: new Date()
      }
    });

    // Log audit event
    await prisma.skill_audit_log.create({
      data: {
        event_type: 'configuration_change',
        skill_id: 'private_deployment',
        user_id: userId,
        license_key: licenseKey,
        event_data: {
          action: 'updated_private_deployment',
          database_type: database.type,
          llm_provider: llm.provider,
          compliance_mode: security.complianceMode
        },
        created_at: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Configuration saved successfully'
    });
  } catch (error) {
    console.error('Error saving configuration:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}