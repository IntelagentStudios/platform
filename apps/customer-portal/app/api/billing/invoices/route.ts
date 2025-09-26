import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

// Initialize Stripe lazily to avoid build-time errors
let stripe: Stripe | null = null;
const getStripe = () => {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
      apiVersion: '2025-08-27.basil',
    });
  }
  return stripe;
};

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get user from auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;

    // Get user and their license
    const user = await prisma.users.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ invoices: [] });
    }

    // Get the user's license to find their subscription
    const license = await prisma.licenses.findUnique({
      where: { license_key: user.license_key }
    });

    if (!license || !license.subscription_id) {
      return NextResponse.json({ invoices: [] });
    }

    // Get the subscription from Stripe to find the customer ID
    let customerId: string | null = null;
    try {
      const subscription = await getStripe().subscriptions.retrieve(license.subscription_id);
      customerId = subscription.customer as string;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return NextResponse.json({ invoices: [] });
    }

    // Get invoices from Stripe
    const invoices = await getStripe().invoices.list({
      customer: customerId,
      limit: 100,
    });

    // Format invoices for frontend
    const formattedInvoices = invoices.data.map(invoice => ({
      id: invoice.id,
      amount: invoice.amount_paid,
      status: invoice.status,
      date: new Date(invoice.created * 1000),
      invoiceUrl: invoice.hosted_invoice_url,
      pdfUrl: invoice.invoice_pdf,
      number: invoice.number,
      description: invoice.description,
      currency: invoice.currency,
      periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
      periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
    }));

    return NextResponse.json({ invoices: formattedInvoices });

  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}