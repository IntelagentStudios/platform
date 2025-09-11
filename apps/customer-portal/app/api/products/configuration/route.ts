import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  // Check for simple auth first
  const simpleAuth = cookies().get('auth');
  if (simpleAuth && simpleAuth.value === 'authenticated-user-harry') {
    // Use Harry's actual product key
    const realProductKey = 'chat_9b3f7e8a2c5d1f0e';
    return NextResponse.json({
      chatbot: {
        configured: true,
        product_key: realProductKey,
        site_key: realProductKey
      }
    });
  } else if (simpleAuth && simpleAuth.value === 'authenticated-test-friend') {
    // Return James's configuration with his actual product key
    const jamesProductKey = 'chat_test_3f8a2c5d';
    return NextResponse.json({
      chatbot: {
        configured: true,
        product_key: jamesProductKey,
        site_key: jamesProductKey
      }
    });
  }

  // Check JWT auth token
  const authToken = cookies().get('auth_token') || cookies().get('auth-token');
  let licenseKey = '';
  
  if (authToken) {
    try {
      const decoded = jwt.verify(authToken.value, process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS') as any;
      licenseKey = decoded.licenseKey;
    } catch (e) {
      console.error('JWT verification failed:', e);
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
  } else {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    
    let license = null;
    let productConfigs: any[] = [];
    
    try {
      // TODO: Fetch product configurations from audit_logs since product_configs table doesn't exist
      const configLogs = await prisma.audit_logs.findMany({
        where: { 
          license_key: licenseKey,
          action: 'product_configured'
        },
        orderBy: { created_at: 'desc' }
      });
      
      // Transform audit logs to product config format
      productConfigs = configLogs.map(log => ({
        license_key: log.license_key,
        product: log.resource_id || '',
        config: log.changes || {},
        enabled: true,
        created_at: log.created_at
      }));
    } catch (e) {
      console.error('Failed to fetch product_configs:', e);
    }

    try {
      // Also check for site_key in licenses table for chatbot
      license = await prisma.licenses.findUnique({
        where: { license_key: licenseKey }
      });
    } catch (e) {
      console.error('Failed to fetch license:', e);
    }

    let configurations = {
      chatbot: {
        configured: false,
        site_key: null,
        product_key: null,
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

    // Check for product keys (new system)
    const productKeys = await prisma.product_keys.findMany({
      where: {
        license_key: licenseKey,
        status: 'active'
      }
    });

    // Check each product for configuration
    for (const pk of productKeys) {
      if (pk.product === 'chatbot') {
        configurations.chatbot = {
          configured: true,
          site_key: license?.site_key, // Keep for backwards compatibility
          product_key: pk.product_key,
          domain: (pk.metadata as any)?.domain || license?.domain || '',
          created_at: pk.created_at?.toISOString() || null,
          embed_code: `<script src="https://dashboard.intelagentstudios.com/chatbot-widget.js" data-product-key="${pk.product_key}"></script>`
        };
      } else if (pk.product === 'sales_agent') {
        configurations.sales_agent = {
          configured: true
        };
      } else if (pk.product === 'data_enrichment') {
        configurations.data_enrichment = {
          configured: true
        };
      } else if (pk.product === 'setup_agent') {
        configurations.setup_agent = {
          configured: true
        };
      }
    }

    // Fall back to checking site_key if no product key found for chatbot
    if (!configurations.chatbot.configured && license?.site_key) {
      configurations.chatbot = {
        configured: true,
        site_key: license.site_key,
        product_key: null,
        domain: license.domain || '',
        created_at: license.created_at?.toISOString() || null,
        embed_code: `<script src="https://dashboard.intelagentstudios.com/chatbot-widget.js" data-site-key="${license.site_key}"></script>`
      };
    }
    
    // Log for debugging
    console.log('License found:', !!license);
    console.log('Product keys found:', productKeys.length);
    console.log('Site key:', license?.site_key);
    console.log('Chatbot configured:', configurations.chatbot.configured);
    console.log('Chatbot product key:', configurations.chatbot.product_key);

    // Override with product_configs if available
    productConfigs.forEach(config => {
      if (config.product === 'chatbot' && config.config) {
        const configData = config.config as any;
        configurations.chatbot = {
          configured: true,
          site_key: configData.site_key || license?.site_key,
          product_key: configData.product_key || null,
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
        product_keys_found: productKeys.length,
        site_key_found: license?.site_key || 'none',
        product_key_found: configurations.chatbot?.product_key || 'none',
        domain_found: configurations.chatbot?.domain || license?.domain || 'none',
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
  // Check JWT auth first
  const authToken = cookies().get('auth_token') || cookies().get('auth-token');
  let licenseKey = '';
  
  if (authToken) {
    try {
      const decoded = jwt.verify(authToken.value, process.env.JWT_SECRET || 'xK8mP3nQ7rT5vY2wA9bC4dF6gH1jL0oS') as any;
      licenseKey = decoded.licenseKey;
    } catch (e) {
      // Fall back to old auth
    }
  }
  
  // Fall back to old auth if JWT not found
  if (!licenseKey) {
    const authCookie = cookies().get('auth');
    if (authCookie?.value === 'authenticated-user-harry') {
      licenseKey = 'INTL-AGNT-BOSS-MODE';
    } else if (authCookie?.value === 'authenticated-test-friend') {
      licenseKey = 'INTL-NW1S-QANW-2025';
    } else {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
  }

  try {
    const body = await request.json();
    const { product, configuration } = body;

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

    // TODO: Save product configuration in audit_logs since product_configs table doesn't exist
    await prisma.audit_logs.create({
      data: {
        license_key: licenseKey,
        user_id: licenseKey,
        action: 'product_configured',
        resource_type: 'product_config',
        resource_id: product,
        changes: {
          config: configuration,
          enabled: true,
          updated_at: new Date()
        }
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