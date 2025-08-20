import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { getAuthFromCookies } from '@/lib/auth';
import crypto from 'crypto';

// Schema for creating a unified license
const CreateUnifiedLicenseSchema = z.object({
  customer_email: z.string().email(),
  customer_name: z.string().min(1),
  company_name: z.string().optional(),
  products: z.array(z.object({
    product_id: z.enum(['chatbot', 'sales_agent', 'setup_agent', 'enrichment', 'ai_insights']),
    tier: z.enum(['basic', 'pro', 'enterprise']),
    features: z.array(z.string()),
    usage_limit: z.number()
  })),
  plan_tier: z.enum(['trial', 'starter', 'professional', 'enterprise', 'custom']),
  allowed_domains: z.array(z.string()),
  expiration_date: z.string().optional(),
  stripe_customer_id: z.string().optional(),
  stripe_subscription_id: z.string().optional(),
  squarespace_order_id: z.string().optional()
});

// Generate a secure license key
function generateLicenseKey(): string {
  const segments = [];
  for (let i = 0; i < 4; i++) {
    const segment = crypto.randomBytes(2).toString('hex').toUpperCase();
    segments.push(segment);
  }
  return segments.join('-');
}

// POST /api/licenses/unified - Create new unified license
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    
    if (!auth || !auth.isMaster) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = CreateUnifiedLicenseSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Generate unique license key
    let licenseKey: string;
    let attempts = 0;
    do {
      licenseKey = generateLicenseKey();
      const existing = await prisma.licenses.findUnique({
        where: { license_key: licenseKey }
      });
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    // Calculate usage limits
    const usage_limits = {
      chatbot_conversations: 0,
      sales_leads: 0,
      api_calls: 0,
      setup_forms: 0,
      ai_insights_queries: 0,
      enrichment_lookups: 0
    };

    data.products.forEach(product => {
      switch (product.product_id) {
        case 'chatbot':
          usage_limits.chatbot_conversations = product.usage_limit;
          break;
        case 'sales_agent':
          usage_limits.sales_leads = product.usage_limit;
          break;
        case 'setup_agent':
          usage_limits.setup_forms = product.usage_limit;
          break;
        case 'ai_insights':
          usage_limits.ai_insights_queries = product.usage_limit;
          break;
        case 'enrichment':
          usage_limits.enrichment_lookups = product.usage_limit;
          break;
      }
    });

    // Create the license
    const license = await prisma.licenses.create({
      data: {
        license_key: licenseKey,
        email: data.customer_email,
        customer_name: data.customer_name,
        plan: data.plan_tier,
        products: data.products.map(p => p.product_id),
        status: 'active',
        created_at: new Date(),
        domain: data.allowed_domains[0] || null,
        subscription_id: data.stripe_subscription_id,
        // Store additional data in JSON fields if needed
      }
    });

    // Create usage tracking record
    await prisma.$executeRaw`
      INSERT INTO license_usage_tracking (
        license_key,
        usage_limits,
        usage_current,
        created_at
      ) VALUES (
        ${licenseKey},
        ${JSON.stringify(usage_limits)},
        ${JSON.stringify({})},
        NOW()
      )
    `;

    // Send welcome email (implement email service)
    await sendWelcomeEmail({
      email: data.customer_email,
      name: data.customer_name,
      licenseKey,
      products: data.products
    });

    return NextResponse.json({
      success: true,
      license: {
        license_key: licenseKey,
        customer_email: data.customer_email,
        customer_name: data.customer_name,
        products: data.products,
        plan_tier: data.plan_tier,
        status: 'active',
        activation_url: `${process.env.NEXT_PUBLIC_APP_URL}/activate?key=${licenseKey}`
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('License creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create license', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/licenses/unified - Get all licenses with filtering
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    
    if (!auth || !auth.isMaster) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const product = searchParams.get('product');
    const plan = searchParams.get('plan');
    const search = searchParams.get('search');

    let where: any = {};

    if (status) where.status = status;
    if (plan) where.plan = plan;
    if (product) {
      where.products = {
        has: product
      };
    }
    if (search) {
      where.OR = [
        { license_key: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { customer_name: { contains: search, mode: 'insensitive' } }
      ];
    }

    const licenses = await prisma.licenses.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 100
    });

    // Enrich with usage data
    const enrichedLicenses = await Promise.all(
      licenses.map(async (license) => {
        const usage = await getUsageData(license.license_key);
        return {
          ...license,
          usage_current: usage.current,
          usage_limits: usage.limits,
          usage_percentage: calculateUsagePercentage(usage.current, usage.limits)
        };
      })
    );

    return NextResponse.json({
      licenses: enrichedLicenses,
      total: enrichedLicenses.length
    });

  } catch (error: any) {
    console.error('License fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch licenses', details: error.message },
      { status: 500 }
    );
  }
}

// Helper functions
async function sendWelcomeEmail(data: any) {
  // Implement email sending logic
  console.log('Sending welcome email to:', data.email);
}

async function getUsageData(licenseKey: string) {
  // Fetch from usage tracking table
  return {
    current: {},
    limits: {}
  };
}

function calculateUsagePercentage(current: any, limits: any) {
  // Calculate overall usage percentage
  return 0;
}