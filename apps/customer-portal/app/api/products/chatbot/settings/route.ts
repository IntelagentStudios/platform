import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS';

export async function GET(request: NextRequest) {
  // Check for JWT auth token
  const authToken = cookies().get('auth_token');
  
  if (!authToken) {
    // Fall back to old auth
    const oldAuth = cookies().get('auth');
    if (!oldAuth) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    
    let licenseKey = '';
    if (oldAuth.value === 'authenticated-user-harry') {
      licenseKey = 'INTL-AGNT-BOSS-MODE';
    } else if (oldAuth.value === 'authenticated-test-friend') {
      licenseKey = 'INTL-NW1S-QANW-2025';
    } else {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    
    return fetchSettings(licenseKey);
  }

  try {
    const decoded = jwt.verify(authToken.value, JWT_SECRET) as any;
    const licenseKey = decoded.licenseKey;
    
    if (!licenseKey) {
      return NextResponse.json({ error: 'No license key found' }, { status: 403 });
    }
    
    return fetchSettings(licenseKey);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  // Check for JWT auth token
  const authToken = cookies().get('auth_token');
  
  if (!authToken) {
    // Fall back to old auth
    const oldAuth = cookies().get('auth');
    if (!oldAuth) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    
    let licenseKey = '';
    if (oldAuth.value === 'authenticated-user-harry') {
      licenseKey = 'INTL-AGNT-BOSS-MODE';
    } else if (oldAuth.value === 'authenticated-test-friend') {
      licenseKey = 'INTL-NW1S-QANW-2025';
    } else {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    
    const body = await request.json();
    return saveSettings(licenseKey, body);
  }

  try {
    const decoded = jwt.verify(authToken.value, JWT_SECRET) as any;
    const licenseKey = decoded.licenseKey;
    
    if (!licenseKey) {
      return NextResponse.json({ error: 'No license key found' }, { status: 403 });
    }
    
    const body = await request.json();
    return saveSettings(licenseKey, body);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

async function fetchSettings(licenseKey: string) {
  try {
    // Get product key for this license
    const productKey = await prisma.product_keys.findFirst({
      where: {
        license_key: licenseKey,
        product: 'chatbot',
        status: 'active'
      }
    });
    
    if (!productKey) {
      return NextResponse.json({ 
        settings: getDefaultSettings(),
        message: 'No chatbot configured yet'
      });
    }
    
    // Get settings from metadata or return defaults
    const settings = productKey.metadata?.settings || getDefaultSettings();
    
    return NextResponse.json({ 
      settings,
      product_key: productKey.product_key
    });
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch settings',
      settings: getDefaultSettings()
    }, { status: 500 });
  }
}

async function saveSettings(licenseKey: string, settings: any) {
  try {
    // Get product key for this license
    const productKey = await prisma.product_keys.findFirst({
      where: {
        license_key: licenseKey,
        product: 'chatbot',
        status: 'active'
      }
    });
    
    if (!productKey) {
      return NextResponse.json({ 
        error: 'No chatbot configured yet'
      }, { status: 404 });
    }
    
    // Update settings in metadata
    const updatedProductKey = await prisma.product_keys.update({
      where: {
        product_key: productKey.product_key
      },
      data: {
        metadata: {
          ...productKey.metadata,
          settings: {
            ...getDefaultSettings(),
            ...settings
          },
          updated_at: new Date().toISOString()
        }
      }
    });
    
    // Trigger n8n webhook to update the actual chatbot widget
    if (process.env.CHATBOT_WEBHOOK_URL) {
      try {
        await fetch(process.env.CHATBOT_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'update_settings',
            product_key: productKey.product_key,
            settings: {
              ...getDefaultSettings(),
              ...settings
            }
          })
        });
      } catch (webhookError) {
        console.error('Failed to trigger webhook:', webhookError);
        // Continue even if webhook fails
      }
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Settings saved successfully',
      settings: updatedProductKey.metadata?.settings
    });
  } catch (error) {
    console.error('Failed to save settings:', error);
    return NextResponse.json({ 
      error: 'Failed to save settings'
    }, { status: 500 });
  }
}

function getDefaultSettings() {
  return {
    welcomeMessage: "Hello! How can I help you today?",
    primaryColor: "#0070f3",
    position: "bottom-right",
    playNotificationSound: true,
    showTypingIndicator: true,
    autoOpen: false,
    autoOpenDelay: 5
  };
}