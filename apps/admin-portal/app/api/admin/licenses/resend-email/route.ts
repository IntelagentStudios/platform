import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromCookies();
    
    if (!auth || !auth.isMaster) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { license_key } = await request.json();

    if (!license_key) {
      return NextResponse.json(
        { error: 'License key is required' },
        { status: 400 }
      );
    }

    // Fetch license details
    const license = await prisma.licenses.findUnique({
      where: { license_key },
      select: {
        license_key: true,
        email: true,
        customer_name: true,
        products: true,
        plan: true,
        domain: true,
        status: true
      }
    });

    if (!license) {
      return NextResponse.json(
        { error: 'License not found' },
        { status: 404 }
      );
    }

    // Send welcome email (integrate with your email service)
    // For now, we'll simulate it
    console.log('Sending welcome email to:', {
      email: license.email,
      name: license.customer_name,
      licenseKey: license.license_key,
      products: license.products,
      setupUrl: `${process.env.NEXT_PUBLIC_APP_URL}/setup?key=${license.license_key}`
    });

    // If you have an email service configured, use it here:
    /*
    await fetch(process.env.EMAIL_SERVICE_URL + '/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EMAIL_SERVICE_API_KEY}`
      },
      body: JSON.stringify({
        to: license.email,
        subject: 'Your Intelagent Platform License Key',
        template: 'license-welcome',
        data: {
          name: license.customer_name,
          licenseKey: license.license_key,
          products: license.products,
          setupUrl: `${process.env.NEXT_PUBLIC_APP_URL}/setup?key=${license.license_key}`
        }
      })
    });
    */

    return NextResponse.json({
      success: true,
      message: 'Welcome email sent successfully',
      recipient: license.email
    });

  } catch (error: any) {
    console.error('Resend email error:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error.message },
      { status: 500 }
    );
  }
}