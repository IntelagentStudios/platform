import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { LayoutBuilder } from '@/packages/ui-system/src/LayoutSchema';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

// GET /api/ui/layout?product=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const product = searchParams.get('product');
    const version = searchParams.get('version');

    if (!product) {
      return NextResponse.json({ error: 'Product parameter is required' }, { status: 400 });
    }

    // Get user info from session
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    const userId = cookieStore.get('userId')?.value || 'default';
    const tenantId = cookieStore.get('licenseKey')?.value || 'default';

    // Try to fetch existing layout from database
    // For now, return generated default
    const defaultLayout = LayoutBuilder.generateDefault(product, []);

    // Add metadata
    defaultLayout.meta.created_by = userId;
    defaultLayout.meta.created_at = new Date().toISOString();

    return NextResponse.json(defaultLayout);
  } catch (error) {
    console.error('Error fetching layout:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/ui/layout:draft
export async function POST(request: NextRequest) {
  try {
    const { pathname } = new URL(request.url);
    const isDraft = pathname.includes(':draft');
    const isPublish = pathname.includes(':publish');

    const body = await request.json();
    const { product, layout, userId, tenantId } = body;

    if (!product || !layout) {
      return NextResponse.json({ error: 'Product and layout are required' }, { status: 400 });
    }

    // In production, save to database
    // For now, just validate and return success
    const status = isPublish ? 'published' : 'draft';

    console.log(`Saving layout as ${status} for product ${product}`);

    return NextResponse.json({
      success: true,
      layoutId: `layout-${Date.now()}`,
      status,
      message: `Layout ${status} successfully`
    });
  } catch (error) {
    console.error('Error saving layout:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/ui/layout?id=...
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const layoutId = searchParams.get('id');

    if (!layoutId) {
      return NextResponse.json({ error: 'Layout ID is required' }, { status: 400 });
    }

    // In production, delete from database
    console.log(`Deleting layout ${layoutId}`);

    return NextResponse.json({
      success: true,
      message: 'Layout deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting layout:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}