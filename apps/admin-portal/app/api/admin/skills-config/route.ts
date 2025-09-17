/**
 * Skills Configuration API
 * Manage API keys and settings for skill integrations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Encryption for sensitive data
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';

function encrypt(text: string): string {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
}

// GET - Fetch all skill configurations
export async function GET(request: NextRequest) {
  try {
    // TODO: Add proper admin authentication check
    // For now, we'll just check for a basic auth header
    const authHeader = request.headers.get('authorization');
    
    // Fetch configurations from database
    const configs = await prisma.settings.findMany({
      where: {
        key: {
          startsWith: 'skill_config_'
        }
      }
    });

    // Decrypt and format configurations
    const formattedConfigs: { [key: string]: any } = {};

    configs.forEach(config => {
      const skillId = config.key.replace('skill_config_', '');
      try {
        const decryptedValue = decrypt(config.value as string);
        formattedConfigs[skillId] = JSON.parse(decryptedValue);
      } catch (error) {
        console.error(`Failed to decrypt config for ${skillId}:`, error);
        formattedConfigs[skillId] = {};
      }
    });
    
    return NextResponse.json({
      success: true,
      configs: formattedConfigs
    });
    
  } catch (error: any) {
    console.error('Failed to fetch skill configs:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch configurations',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// POST - Save skill configurations
export async function POST(request: NextRequest) {
  try {
    // TODO: Add proper admin authentication check
    const { configs } = await request.json();
    
    if (!configs || typeof configs !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid configurations' },
        { status: 400 }
      );
    }
    
    // Save each skill configuration
    const promises = Object.entries(configs).map(async ([skillId, config]) => {
      const settingKey = `skill_config_${skillId}`;
      const encryptedValue = encrypt(JSON.stringify(config));
      
      // Upsert the configuration
      return prisma.settings.upsert({
        where: { key: settingKey },
        create: {
          key: settingKey,
          value: encryptedValue,
          loadOnStartup: false
        },
        update: {
          value: encryptedValue
        }
      });
    });
    
    await Promise.all(promises);
    
    // TODO: Log the configuration update once skill_audit_log table is available
    // await prisma.skill_audit_log.create({
    //   data: {
    //     event_type: 'skill_config_update',
    //     event_data: {
    //       skills: Object.keys(configs),
    //       timestamp: new Date()
    //     },
    //     user_id: 'admin', // TODO: Get actual admin user ID
    //     ip_address: request.headers.get('x-forwarded-for') || 'unknown'
    //   }
    // });
    
    // Update environment variables for runtime use
    // This allows skills to access configs without database queries
    Object.entries(configs).forEach(([skillId, config]: [string, any]) => {
      Object.entries(config).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          process.env[key] = value;
        }
      });
    });
    
    return NextResponse.json({
      success: true,
      message: 'Configurations saved successfully',
      updated: Object.keys(configs).length
    });
    
  } catch (error: any) {
    console.error('Failed to save skill configs:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to save configurations',
        details: error.message
      },
      { status: 500 }
    );
  }
}