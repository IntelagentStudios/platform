import { NextRequest, NextResponse } from 'next/server';
import { DesignerEngine } from '@/packages/ui-system/src/DesignerEngine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, product, skills = [], integrations = [], currentLayout } = body;

    if (!description || !product) {
      return NextResponse.json({
        error: 'Description and product are required'
      }, { status: 400 });
    }

    const designer = new DesignerEngine();
    const response = await designer.propose({
      description,
      product,
      skills,
      integrations,
      currentLayout
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in designer propose:', error);
    return NextResponse.json({
      error: 'Failed to generate layout proposal'
    }, { status: 500 });
  }
}