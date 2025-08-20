import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import crypto from 'crypto';

// Schema for n8n validation request
const ValidateN8nSchema = z.object({
  license_key: z.string(),
  product_id: z.enum(['chatbot', 'sales_agent', 'setup_agent', 'enrichment', 'ai_insights']),
  domain: z.string().optional(),
  action: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

// Cache validated licenses for 5 minutes to reduce DB hits
const validationCache = new Map<string, { data: any; expires: number }>();

// POST /api/licenses/validate-n8n - Validate license for n8n workflows
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const validation = ValidateN8nSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'Invalid request data', 
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { license_key, product_id, domain, action, metadata } = validation.data;

    // Check cache first
    const cacheKey = `${license_key}:${product_id}`;
    const cached = validationCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return NextResponse.json(cached.data);
    }

    // Fetch license from database
    const license = await prisma.licenses.findUnique({
      where: { license_key },
      select: {
        license_key: true,
        email: true,
        customer_name: true,
        plan: true,
        products: true,
        status: true,
        domain: true,
        created_at: true,
        used_at: true,
        subscription_status: true,
        site_key: true
      }
    });

    if (!license) {
      return NextResponse.json({
        valid: false,
        error: 'License not found',
        message: 'The provided license key does not exist'
      }, { status: 404 });
    }

    // Check if license is active
    if (license.status !== 'active') {
      return NextResponse.json({
        valid: false,
        error: 'License inactive',
        message: `License status is: ${license.status}`,
        status: license.status
      }, { status: 403 });
    }

    // Check if product is included in license
    if (!license.products.includes(product_id)) {
      return NextResponse.json({
        valid: false,
        error: 'Product not licensed',
        message: `This license does not include access to ${product_id}`,
        available_products: license.products
      }, { status: 403 });
    }

    // Domain validation (if provided)
    if (domain && license.domain) {
      const licenseDomains = Array.isArray(license.domain) 
        ? license.domain 
        : [license.domain];
      
      const domainMatch = licenseDomains.some(d => {
        // Allow exact match or subdomain match
        return domain === d || domain.endsWith(`.${d}`);
      });

      if (!domainMatch) {
        return NextResponse.json({
          valid: false,
          error: 'Domain mismatch',
          message: 'This license is not authorized for the specified domain',
          allowed_domains: licenseDomains
        }, { status: 403 });
      }
    }

    // Track usage if action is provided
    if (action) {
      await trackUsage(license_key, product_id, action, metadata);
    }

    // Update last used timestamp
    await prisma.licenses.update({
      where: { license_key },
      data: { used_at: new Date() }
    });

    // Get product configuration
    const productConfig = await getProductConfig(license_key, product_id);

    // Prepare response
    const response = {
      valid: true,
      license: {
        key: license.license_key,
        customer: {
          email: license.email,
          name: license.customer_name
        },
        plan: license.plan,
        products: license.products,
        status: license.status
      },
      product: {
        id: product_id,
        enabled: true,
        config: productConfig,
        site_key: license.site_key // For chatbot integration
      },
      usage: await getUsageForProduct(license_key, product_id),
      features: getFeaturesByPlan(license.plan || 'starter', product_id),
      webhooks: await getWebhooks(license_key, product_id)
    };

    // Cache the response
    validationCache.set(cacheKey, {
      data: response,
      expires: Date.now() + 5 * 60 * 1000 // 5 minutes
    });

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('License validation error:', error);
    return NextResponse.json(
      { 
        valid: false,
        error: 'Validation failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// GET /api/licenses/validate-n8n - Simple GET validation for n8n HTTP Request node
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const license_key = searchParams.get('license_key');
    const product_id = searchParams.get('product_id');

    if (!license_key || !product_id) {
      return NextResponse.json({
        valid: false,
        error: 'Missing required parameters',
        message: 'Both license_key and product_id are required'
      }, { status: 400 });
    }

    // Use the same validation logic as POST
    return POST(new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify({
        license_key,
        product_id,
        domain: searchParams.get('domain'),
        action: searchParams.get('action')
      })
    }));

  } catch (error: any) {
    console.error('License validation error:', error);
    return NextResponse.json(
      { 
        valid: false,
        error: 'Validation failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Helper functions
async function trackUsage(licenseKey: string, productId: string, action: string, metadata?: any) {
  try {
    await prisma.$executeRaw`
      INSERT INTO license_usage (
        license_key,
        product_id,
        action,
        count,
        metadata,
        created_at
      ) VALUES (
        ${licenseKey},
        ${productId},
        ${action},
        1,
        ${JSON.stringify(metadata || {})},
        NOW()
      )
    `;
  } catch (error) {
    console.error('Usage tracking error:', error);
  }
}

async function getProductConfig(licenseKey: string, productId: string) {
  // Fetch product-specific configuration
  // This would come from a product_configs table
  return {
    api_endpoint: `${process.env.NEXT_PUBLIC_API_URL}/api/${productId}`,
    webhook_url: `${process.env.NEXT_PUBLIC_API_URL}/api/webhooks/${productId}`,
    settings: {}
  };
}

async function getUsageForProduct(licenseKey: string, productId: string) {
  // Fetch usage statistics for the specific product
  try {
    const result = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_usage,
        DATE(created_at) as date,
        action
      FROM license_usage
      WHERE license_key = ${licenseKey}
        AND product_id = ${productId}
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at), action
    `;
    
    return {
      last_30_days: result,
      current_month: 0, // Calculate based on result
      limit: getUsageLimit(licenseKey, productId)
    };
  } catch {
    return {
      last_30_days: [],
      current_month: 0,
      limit: null
    };
  }
}

function getUsageLimit(licenseKey: string, productId: string): number | null {
  // Get usage limits based on plan and product
  const limits: Record<string, Record<string, number>> = {
    starter: {
      chatbot: 1000,
      sales_agent: 100,
      setup_agent: 50,
      enrichment: 500,
      ai_insights: 10
    },
    professional: {
      chatbot: 10000,
      sales_agent: 1000,
      setup_agent: 500,
      enrichment: 5000,
      ai_insights: 100
    },
    enterprise: {
      chatbot: -1, // Unlimited
      sales_agent: -1,
      setup_agent: -1,
      enrichment: -1,
      ai_insights: -1
    }
  };
  
  // This would actually look up the plan from the license
  return limits.professional[productId] || null;
}

function getFeaturesByPlan(plan: string, productId: string): string[] {
  const features: Record<string, Record<string, string[]>> = {
    chatbot: {
      starter: ['basic_responses', 'simple_routing', 'email_notifications'],
      professional: ['ai_responses', 'advanced_routing', 'integrations', 'analytics'],
      enterprise: ['custom_ai_model', 'white_label', 'sla', 'dedicated_support']
    },
    sales_agent: {
      starter: ['lead_discovery', 'basic_outreach', 'email_templates'],
      professional: ['ai_personalization', 'campaign_automation', 'crm_integration'],
      enterprise: ['custom_workflows', 'api_access', 'bulk_operations', 'priority_queue']
    },
    setup_agent: {
      starter: ['basic_forms', 'simple_logic', 'email_delivery'],
      professional: ['conditional_logic', 'multi_step_forms', 'integrations'],
      enterprise: ['custom_ui', 'white_label', 'api_access', 'analytics']
    },
    ai_insights: {
      starter: ['basic_analytics', 'simple_reports'],
      professional: ['ai_predictions', 'pattern_detection', 'custom_queries'],
      enterprise: ['real_time_analysis', 'custom_models', 'api_access', 'white_label']
    },
    enrichment: {
      starter: ['basic_lookups', 'email_finder'],
      professional: ['company_data', 'social_profiles', 'bulk_enrichment'],
      enterprise: ['custom_sources', 'api_access', 'real_time_updates']
    }
  };

  return features[productId]?.[plan] || [];
}

async function getWebhooks(licenseKey: string, productId: string) {
  // Fetch configured webhooks for the product
  return [];
}