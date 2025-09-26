import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const licenseKey = request.cookies.get('licenseKey')?.value;
    const userId = request.cookies.get('userId')?.value;
    
    // Custom product builders catalog
    const builders = [
      {
        id: 'chatbot-builder',
        name: 'Custom Chatbot Builder',
        description: 'Build intelligent chatbots with natural language understanding',
        category: 'communication',
        basePrice: 149,
        features: [
          'Drag-and-drop interface',
          'NLP training',
          'Multi-channel deployment',
          'Analytics dashboard'
        ],
        customizationOptions: [
          'Custom intents',
          'Brand voice training',
          'API integrations',
          'Custom workflows'
        ],
        estimatedTime: '2-3 hours',
        difficulty: 'beginner'
      },
      {
        id: 'workflow-builder',
        name: 'Workflow Automation Builder',
        description: 'Create complex automation workflows without code',
        category: 'automation',
        basePrice: 199,
        features: [
          'Visual workflow designer',
          'Conditional logic',
          'Multi-app integration',
          'Schedule triggers'
        ],
        customizationOptions: [
          'Custom triggers',
          'API webhooks',
          'Data transformations',
          'Error handling'
        ],
        estimatedTime: '1-2 hours',
        difficulty: 'intermediate'
      },
      {
        id: 'dashboard-builder',
        name: 'Analytics Dashboard Builder',
        description: 'Design custom analytics dashboards for your business metrics',
        category: 'analytics',
        basePrice: 249,
        features: [
          'Drag-and-drop widgets',
          'Real-time data',
          'Custom visualizations',
          'Export capabilities'
        ],
        customizationOptions: [
          'Custom metrics',
          'Data sources',
          'Visualization types',
          'Sharing permissions'
        ],
        estimatedTime: '3-4 hours',
        difficulty: 'intermediate'
      },
      {
        id: 'api-builder',
        name: 'API Integration Builder',
        description: 'Connect and integrate with any API or service',
        category: 'integration',
        basePrice: 299,
        features: [
          'REST & GraphQL support',
          'Authentication handling',
          'Rate limiting',
          'Data mapping'
        ],
        customizationOptions: [
          'Custom endpoints',
          'Data transformations',
          'Error recovery',
          'Monitoring alerts'
        ],
        estimatedTime: '2-3 hours',
        difficulty: 'advanced'
      },
      {
        id: 'form-builder',
        name: 'Smart Form Builder',
        description: 'Create intelligent forms with conditional logic and validation',
        category: 'data-collection',
        basePrice: 99,
        features: [
          'Drag-and-drop fields',
          'Conditional logic',
          'Custom validation',
          'Submission workflows'
        ],
        customizationOptions: [
          'Custom fields',
          'Validation rules',
          'Submission actions',
          'Email notifications'
        ],
        estimatedTime: '30-60 minutes',
        difficulty: 'beginner'
      },
      {
        id: 'report-builder',
        name: 'Report Generator Builder',
        description: 'Automate report generation with custom templates',
        category: 'reporting',
        basePrice: 179,
        features: [
          'Template designer',
          'Data aggregation',
          'Schedule delivery',
          'Multiple formats'
        ],
        customizationOptions: [
          'Custom templates',
          'Data sources',
          'Calculation formulas',
          'Distribution lists'
        ],
        estimatedTime: '1-2 hours',
        difficulty: 'intermediate'
      }
    ];

    // Get user's previous builds if logged in
    let userBuilds = [];
    if (licenseKey) {
      const configurations = await prisma.product_configurations.findMany({
        where: {
          license_key: licenseKey,
          customization_type: 'custom_builder'
        },
        select: {
          custom_name: true,
          product_name: true,
          created_at: true
        },
        orderBy: {
          created_at: 'desc'
        },
        take: 5
      });
      
      userBuilds = configurations.map(config => ({
        name: config.product_name,
        builderId: config.custom_name,
        createdAt: config.created_at
      }));
    }

    return NextResponse.json({
      success: true,
      builders,
      userBuilds,
      isLoggedIn: !!licenseKey
    });
  } catch (error) {
    console.error('Error fetching builders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch builders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { builderId, configuration } = body;
    
    const licenseKey = request.cookies.get('licenseKey')?.value;
    const userId = request.cookies.get('userId')?.value;
    
    if (!licenseKey || !userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Save builder configuration
    const savedConfig = await prisma.product_configurations.create({
      data: {
        product_key: licenseKey,
        license_key: licenseKey,
        customization_type: 'custom_builder',
        custom_name: builderId,
        product_name: configuration.name || `Custom ${builderId}`,
        description: configuration.description,
        configuration: JSON.stringify(configuration),
        created_at: new Date()
      }
    });

    // Log the event
    await prisma.skill_audit_log.create({
      data: {
        event_type: 'custom_builder_created',
        skill_id: builderId,
        user_id: userId,
        license_key: licenseKey,
        event_data: {
          builder_id: builderId,
          configuration_id: savedConfig.id
        },
        created_at: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      configurationId: savedConfig.id,
      message: 'Builder configuration saved successfully'
    });
  } catch (error) {
    console.error('Error saving builder configuration:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}