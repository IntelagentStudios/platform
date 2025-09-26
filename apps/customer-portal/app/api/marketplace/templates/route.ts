import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const industry = searchParams.get('industry');
    
    // Get user context
    const licenseKey = request.cookies.get('licenseKey')?.value;
    
    // Industry-specific templates
    const templates = [
      {
        id: 'ecommerce-starter',
        name: 'E-commerce Starter Pack',
        description: 'Everything you need to automate your online store',
        industry: 'ecommerce',
        agents: ['customer-support', 'marketing-genius', 'data-wizard'],
        totalPrice: 647,
        discountedPrice: 549,
        savings: 98,
        features: [
          'Customer support automation',
          'Marketing campaign management',
          'Sales analytics dashboard',
          'Inventory management'
        ]
      },
      {
        id: 'saas-growth',
        name: 'SaaS Growth Suite',
        description: 'Scale your SaaS business with AI-powered automation',
        industry: 'saas',
        agents: ['sales-pro', 'customer-support', 'data-wizard'],
        totalPrice: 897,
        discountedPrice: 749,
        savings: 148,
        features: [
          'Lead generation & nurturing',
          'Customer success automation',
          'Churn prediction',
          'Usage analytics'
        ]
      },
      {
        id: 'agency-powerhouse',
        name: 'Agency Powerhouse',
        description: 'Complete toolkit for digital agencies',
        industry: 'agency',
        agents: ['marketing-genius', 'sales-pro', 'finance-bot'],
        totalPrice: 877,
        discountedPrice: 699,
        savings: 178,
        features: [
          'Multi-client management',
          'Campaign automation',
          'Proposal generation',
          'Client reporting'
        ]
      },
      {
        id: 'startup-essentials',
        name: 'Startup Essentials',
        description: 'Launch and scale with essential AI agents',
        industry: 'startup',
        agents: ['hr-assistant', 'sales-pro', 'customer-support'],
        totalPrice: 677,
        discountedPrice: 499,
        savings: 178,
        features: [
          'Team building automation',
          'Customer acquisition',
          'Product feedback loops',
          'Growth tracking'
        ]
      },
      {
        id: 'enterprise-suite',
        name: 'Enterprise Suite',
        description: 'Enterprise-grade automation across all departments',
        industry: 'enterprise',
        agents: ['data-wizard', 'hr-assistant', 'finance-bot', 'customer-support'],
        totalPrice: 1106,
        discountedPrice: 899,
        savings: 207,
        features: [
          'Department integration',
          'Compliance automation',
          'Advanced analytics',
          'Custom workflows'
        ]
      },
      {
        id: 'healthcare-compliance',
        name: 'Healthcare Compliance Pack',
        description: 'HIPAA-compliant automation for healthcare providers',
        industry: 'healthcare',
        agents: ['customer-support', 'data-wizard', 'hr-assistant'],
        totalPrice: 777,
        discountedPrice: 649,
        savings: 128,
        features: [
          'Patient communication',
          'Appointment scheduling',
          'Data privacy controls',
          'Staff management'
        ]
      }
    ];

    // Filter by category or industry if provided
    let filteredTemplates = templates;
    if (industry) {
      filteredTemplates = templates.filter(t => t.industry === industry);
    }

    // Log view event if user is logged in
    if (licenseKey) {
      await prisma.skill_audit_log.create({
        data: {
          event_type: 'marketplace_templates_viewed',
          skill_id: 'marketplace',
          user_id: licenseKey,
          license_key: licenseKey,
          event_data: {
            industry,
            category,
            templates_shown: filteredTemplates.length
          },
          created_at: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      templates: filteredTemplates,
      totalTemplates: filteredTemplates.length
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId } = body;
    
    const licenseKey = request.cookies.get('licenseKey')?.value;
    const userId = request.cookies.get('userId')?.value;
    
    if (!licenseKey || !userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Log template selection
    await prisma.skill_audit_log.create({
      data: {
        event_type: 'marketplace_template_selected',
        skill_id: templateId,
        user_id: userId,
        license_key: licenseKey,
        event_data: {
          template_id: templateId,
          timestamp: new Date()
        },
        created_at: new Date()
      }
    });

    // Return customization URL
    return NextResponse.json({
      success: true,
      customizeUrl: `/marketplace/customize/${templateId}`
    });
  } catch (error) {
    console.error('Error selecting template:', error);
    return NextResponse.json(
      { error: 'Failed to process template selection' },
      { status: 500 }
    );
  }
}