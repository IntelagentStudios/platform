import { NextRequest, NextResponse } from 'next/server';
import { DataCatalog } from '@/packages/ui-system/src/DataCatalog';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const product = searchParams.get('product');

    if (!product) {
      return NextResponse.json({ error: 'Product parameter is required' }, { status: 400 });
    }

    const catalog = new DataCatalog();
    const namespace = mapProductToNamespace(product);
    const catalogData = catalog.getCatalog(namespace);

    if (!catalogData) {
      return NextResponse.json({ error: 'Catalog not found for product' }, { status: 404 });
    }

    return NextResponse.json(catalogData);
  } catch (error) {
    console.error('Error fetching catalog:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function mapProductToNamespace(product: string): string {
  const mappings: Record<string, string> = {
    'chatbot': 'chatbot',
    'ops-agent': 'ops-agent',
    'data-insights': 'data-insights',
    'outreach': 'outreach',
    'sales': 'outreach'
  };
  return mappings[product] || product;
}