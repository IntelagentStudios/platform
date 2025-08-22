import { NextRequest, NextResponse } from 'next/server';
import { getTenantDb } from '@intelagent/database';
import stripeService from '@intelagent/billing';

// GET /api/billing/invoices - List customer invoices
export async function GET(request: NextRequest) {
  try {
    const db = await getTenantDb();
    
    // Get customer ID
    const result = await db.$queryRaw`
      SELECT u.stripe_customer_id 
      FROM public.users u
      WHERE u.license_key = current_setting('app.current_license')
        AND u.role = 'owner'
      LIMIT 1
    `;

    if (!result || result.length === 0 || !result[0].stripe_customer_id) {
      // Return empty list if no Stripe customer
      return NextResponse.json({ invoices: [] });
    }

    const invoices = await stripeService.listInvoices(
      result[0].stripe_customer_id,
      20
    );

    // Format invoices for display
    const formattedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      number: invoice.number,
      amount: invoice.amount_paid / 100,
      formatted_amount: `£${(invoice.amount_paid / 100).toFixed(2)}`,
      status: invoice.status,
      paid: invoice.paid,
      created: new Date(invoice.created * 1000),
      due_date: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
      pdf_url: invoice.invoice_pdf,
      hosted_url: invoice.hosted_invoice_url
    }));

    return NextResponse.json({ invoices: formattedInvoices });
  } catch (error) {
    console.error('Failed to list invoices:', error);
    return NextResponse.json(
      { error: 'Failed to list invoices' },
      { status: 500 }
    );
  }
}