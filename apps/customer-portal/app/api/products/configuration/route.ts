import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const authCookie = cookies().get('auth');
  
  if (!authCookie || authCookie.value !== 'authenticated-user-harry') {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    // Get the user's license key (hardcoded for now since we're using simple auth)
    const licenseKey = 'INTL-AGNT-BOSS-MODE';
    
    // Fetch product configurations from database
    const productConfigs = await prisma.product_configs.findMany({
      where: { license_key: licenseKey }
    });

    // Also check for site_key in licenses table for chatbot
    const license = await prisma.licenses.findUnique({
      where: { license_key: licenseKey }
    });

    let configurations = {
      chatbot: {
        configured: false,
        site_key: null,
        domain: null,
        created_at: null,
        embed_code: null
      },
      sales_agent: {
        configured: false
      },
      data_enrichment: {
        configured: false
      },
      setup_agent: {
        configured: false
      }
    };

    // Check if chatbot is configured via licenses table
    if (license?.site_key) {
      configurations.chatbot = {
        configured: true,
        site_key: license.site_key,
        domain: license.domain || '',
        created_at: license.created_at?.toISOString() || null,
        embed_code: `<script src="https://dashboard.intelagentstudios.com/chatbot-widget.js" data-site-key="${license.site_key}"></script>`
      };
    }
    
    // Log for debugging
    console.log('License found:', !!license);
    console.log('Site key:', license?.site_key);
    console.log('Chatbot configured:', configurations.chatbot.configured);

    // Override with product_configs if available
    productConfigs.forEach(config => {
      if (config.product === 'chatbot' && config.config) {
        const configData = config.config as any;
        configurations.chatbot = {
          configured: true,
          site_key: configData.site_key || license?.site_key,
          domain: configData.domain || license?.domain,
          created_at: config.created_at.toISOString(),
          embed_code: configData.embed_code || configurations.chatbot.embed_code
        };
      }
      // Add other products as needed
    });

    return NextResponse.json({
      ...configurations,
      _debug: {
        license_key_used: licenseKey,
        site_key_found: license?.site_key || 'none',
        domain_found: license?.domain || 'none',
        chatbot_configured: configurations.chatbot?.configured || false
      }
    });
  } catch (error) {
    console.error('Failed to fetch configurations:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch configurations' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authCookie = cookies().get('auth');
  
  if (!authCookie || authCookie.value !== 'authenticated-user-harry') {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { product, configuration } = body;
    const licenseKey = 'INTL-AGNT-BOSS-MODE';

    // Update licenses table for chatbot
    if (product === 'chatbot' && configuration.site_key) {
      await prisma.licenses.update({
        where: { license_key: licenseKey },
        data: {
          site_key: configuration.site_key,
          domain: configuration.domain
        }
      });
    }

    // Upsert product configuration
    await prisma.product_configs.upsert({
      where: {
        license_key_product: {
          license_key: licenseKey,
          product: product
        }
      },
      update: {
        config: configuration,
        enabled: true,
        updated_at: new Date()
      },
      create: {
        license_key: licenseKey,
        product: product,
        config: configuration,
        enabled: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Configuration saved successfully' 
    });
  } catch (error) {
    console.error('Failed to save configuration:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to save configuration' 
    }, { status: 500 });
  }
}