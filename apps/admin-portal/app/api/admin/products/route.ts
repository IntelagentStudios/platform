import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@intelagent/database';

// GET /api/admin/products - List all products
export async function GET(request: NextRequest) {
  try {
    const db = await getAdminDb();
    
    const products = await db.products.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        pricing_rules: {
          include: {
            pricing_rule: true
          }
        }
      }
    });

    // Convert pence to pounds for display
    const formattedProducts = products.map(product => ({
      ...product,
      base_price: product.base_price_pence / 100,
      formatted_price: `£${(product.base_price_pence / 100).toFixed(2)}`
    }));

    return NextResponse.json({ products: formattedProducts });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/admin/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const db = await getAdminDb();
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.slug || data.base_price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert pounds to pence for storage
    const base_price_pence = Math.round(data.base_price * 100);

    // Define default schema tables for each product type
    const defaultSchemaTables = {
      chatbot: ['chatbots', 'chatbot_conversations', 'chatbot_messages', 'chatbot_knowledge_base'],
      sales_agent: ['sales_agents', 'sales_leads', 'sales_interactions', 'sales_campaigns'],
      setup_agent: ['setup_projects', 'setup_tasks', 'setup_templates', 'setup_documentation'],
      enrichment: ['enrichment_requests', 'enrichment_results', 'enrichment_cache']
    };

    const product = await db.products.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        base_price_pence,
        currency: 'GBP',
        features: data.features || [],
        schema_tables: defaultSchemaTables[data.slug] || [],
        setup_required: data.setup_required ?? true,
        active: data.active ?? true
      }
    });

    return NextResponse.json({
      product: {
        ...product,
        base_price: product.base_price_pence / 100,
        formatted_price: `£${(product.base_price_pence / 100).toFixed(2)}`
      }
    });
  } catch (error) {
    console.error('Failed to create product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/products - Update product
export async function PUT(request: NextRequest) {
  try {
    const db = await getAdminDb();
    const data = await request.json();

    if (!data.id) {
      return NextResponse.json(
        { error: 'Product ID required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.base_price !== undefined) {
      updateData.base_price_pence = Math.round(data.base_price * 100);
    }
    if (data.features !== undefined) updateData.features = data.features;
    if (data.setup_required !== undefined) updateData.setup_required = data.setup_required;
    if (data.active !== undefined) updateData.active = data.active;

    const product = await db.products.update({
      where: { id: data.id },
      data: updateData
    });

    return NextResponse.json({
      product: {
        ...product,
        base_price: product.base_price_pence / 100,
        formatted_price: `£${(product.base_price_pence / 100).toFixed(2)}`
      }
    });
  } catch (error) {
    console.error('Failed to update product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products - Deactivate product
export async function DELETE(request: NextRequest) {
  try {
    const db = await getAdminDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID required' },
        { status: 400 }
      );
    }

    // Soft delete - just deactivate
    const product = await db.products.update({
      where: { id },
      data: { active: false }
    });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('Failed to deactivate product:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate product' },
      { status: 500 }
    );
  }
}