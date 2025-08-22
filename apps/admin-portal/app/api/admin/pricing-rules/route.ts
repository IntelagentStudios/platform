import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@intelagent/database';

// GET /api/admin/pricing-rules - List all pricing rules
export async function GET(request: NextRequest) {
  try {
    const db = await getAdminDb();
    
    const rules = await db.pricing_rules.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        products: {
          include: {
            product: true
          }
        },
        applied_discounts: {
          select: {
            id: true,
            license_key: true,
            applied_at: true
          }
        }
      }
    });

    // Format for display
    const formattedRules = rules.map(rule => ({
      ...rule,
      discount_display: rule.discount_type === 'percentage' 
        ? `${rule.discount_value}%`
        : `£${(rule.discount_value / 100).toFixed(2)}`,
      usage_percentage: rule.usage_limit 
        ? Math.round((rule.used_count / rule.usage_limit) * 100)
        : null,
      products: rule.products.map(p => p.product)
    }));

    return NextResponse.json({ rules: formattedRules });
  } catch (error) {
    console.error('Failed to fetch pricing rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing rules' },
      { status: 500 }
    );
  }
}

// POST /api/admin/pricing-rules - Create new pricing rule
export async function POST(request: NextRequest) {
  try {
    const db = await getAdminDb();
    const data = await request.json();

    // Validate required fields
    if (!data.type || !data.name || !data.discount_type || data.discount_value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert discount value if needed
    let discount_value = data.discount_value;
    if (data.discount_type === 'fixed_amount') {
      // Convert pounds to pence
      discount_value = Math.round(data.discount_value * 100);
    }

    // Create the pricing rule
    const rule = await db.pricing_rules.create({
      data: {
        type: data.type,
        name: data.name,
        description: data.description,
        min_products: data.min_products,
        promo_code: data.promo_code,
        valid_from: data.valid_from ? new Date(data.valid_from) : null,
        valid_until: data.valid_until ? new Date(data.valid_until) : null,
        usage_limit: data.usage_limit,
        discount_type: data.discount_type,
        discount_value,
        active: data.active ?? true
      }
    });

    // Link products if provided
    if (data.product_ids && data.product_ids.length > 0) {
      await db.pricing_rule_products.createMany({
        data: data.product_ids.map((product_id: string) => ({
          pricing_rule_id: rule.id,
          product_id
        }))
      });
    }

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Failed to create pricing rule:', error);
    return NextResponse.json(
      { error: 'Failed to create pricing rule' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/pricing-rules - Update pricing rule
export async function PUT(request: NextRequest) {
  try {
    const db = await getAdminDb();
    const data = await request.json();

    if (!data.id) {
      return NextResponse.json(
        { error: 'Rule ID required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.min_products !== undefined) updateData.min_products = data.min_products;
    if (data.promo_code !== undefined) updateData.promo_code = data.promo_code;
    if (data.valid_from !== undefined) {
      updateData.valid_from = data.valid_from ? new Date(data.valid_from) : null;
    }
    if (data.valid_until !== undefined) {
      updateData.valid_until = data.valid_until ? new Date(data.valid_until) : null;
    }
    if (data.usage_limit !== undefined) updateData.usage_limit = data.usage_limit;
    if (data.active !== undefined) updateData.active = data.active;

    if (data.discount_type !== undefined) {
      updateData.discount_type = data.discount_type;
    }
    if (data.discount_value !== undefined) {
      updateData.discount_value = data.discount_type === 'fixed_amount'
        ? Math.round(data.discount_value * 100)
        : data.discount_value;
    }

    const rule = await db.pricing_rules.update({
      where: { id: data.id },
      data: updateData
    });

    // Update product associations if provided
    if (data.product_ids !== undefined) {
      // Remove existing associations
      await db.pricing_rule_products.deleteMany({
        where: { pricing_rule_id: data.id }
      });

      // Add new associations
      if (data.product_ids.length > 0) {
        await db.pricing_rule_products.createMany({
          data: data.product_ids.map((product_id: string) => ({
            pricing_rule_id: data.id,
            product_id
          }))
        });
      }
    }

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Failed to update pricing rule:', error);
    return NextResponse.json(
      { error: 'Failed to update pricing rule' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/pricing-rules - Deactivate pricing rule
export async function DELETE(request: NextRequest) {
  try {
    const db = await getAdminDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Rule ID required' },
        { status: 400 }
      );
    }

    // Soft delete - just deactivate
    const rule = await db.pricing_rules.update({
      where: { id },
      data: { active: false }
    });

    return NextResponse.json({ success: true, rule });
  } catch (error) {
    console.error('Failed to deactivate pricing rule:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate pricing rule' },
      { status: 500 }
    );
  }
}