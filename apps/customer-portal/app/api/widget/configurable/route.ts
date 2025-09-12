import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productKey = searchParams.get('key');

    if (!productKey) {
      return new NextResponse('Product key required', { status: 400 });
    }

    // Get configuration from database
    let title = 'Chat Assistant';
    let companyName = 'Intelagent Studios';
    let domain = 'intelagentstudios.com';
    let primaryColor = '#3b3b3b';
    let accentColor = '#666';
    let headerPadding = '30px 35px'; // Increased from 20px 24px
    let messagesPadding = '35px'; // Increased from 24px
    let messageMargin = '25px'; // Increased from 16px
    let messagePadding = '18px 25px'; // Increased from 12px 18px
    let inputPadding = '20px 25px'; // Increased from 12px 16px
    let textareaPadding = '12px 18px'; // Increased from 6px 12px

    try {
      const productKeyRecord = await prisma.product_keys.findFirst({
        where: {
          product_key: productKey,
          product: 'chatbot',
          status: 'active'
        }
      });

      if (productKeyRecord) {
        const metadata = productKeyRecord.metadata as any;
        
        // Get license if available
        let license = null;
        if (productKeyRecord.license_key) {
          license = await prisma.licenses.findUnique({
            where: { license_key: productKeyRecord.license_key }
          });
        }

        // Configuration values
        title = metadata?.title || license?.customer_name || title;
        companyName = metadata?.company_name || license?.customer_name || companyName;
        domain = metadata?.domain || license?.domain || domain;
        
        // Style customization
        if (metadata?.primary_color) primaryColor = metadata.primary_color;
        if (metadata?.accent_color) accentColor = metadata.accent_color;
        
        // Spacing customization (allow overrides)
        if (metadata?.header_padding) headerPadding = metadata.header_padding;
        if (metadata?.messages_padding) messagesPadding = metadata.messages_padding;
        if (metadata?.message_margin) messageMargin = metadata.message_margin;
        if (metadata?.message_padding) messagePadding = metadata.message_padding;
        if (metadata?.input_padding) inputPadding = metadata.input_padding;
        if (metadata?.textarea_padding) textareaPadding = metadata.textarea_padding;
      }
    } catch (error) {
      console.error('Could not fetch product configuration:', error);
    }

    // Read the static widget file
    const staticWidgetPath = path.join(process.cwd(), 'apps', 'customer-portal', 'public', 'chatbot-widget.js');
    let widgetCode = fs.readFileSync(staticWidgetPath, 'utf-8');

    // Replace configuration placeholders
    widgetCode = widgetCode
      // Replace title
      .replace(/<span>Chat Assistant<\/span>/g, `<span>${title}</span>`)
      // Replace company name in footer
      .replace(/Powered by Intelagent Studios/g, `Powered by ${companyName}`)
      // Replace primary colors (user message background)
      .replace(/rgba\(59, 59, 59, 0\.95\)/g, `${primaryColor}e6`) // Convert to rgba
      .replace(/rgba\(41, 41, 41, 0\.95\)/g, `${primaryColor}cc`)
      // Replace accent colors
      .replace(/fill: #666/g, `fill: ${accentColor}`)
      .replace(/color: #666/g, `color: ${accentColor}`)
      // Apply increased padding values with !important
      .replace(/padding: 20px 24px;/g, `padding: ${headerPadding} !important;`)
      .replace(/padding: 24px;/g, `padding: ${messagesPadding} !important;`)
      .replace(/margin: 16px 0;/g, `margin: ${messageMargin} 0 !important;`)
      .replace(/padding: 12px 18px;/g, `padding: ${messagePadding} !important;`)
      .replace(/padding: 12px 16px;/g, `padding: ${inputPadding} !important;`)
      .replace(/padding: 6px 12px;/g, `padding: ${textareaPadding} !important;`);

    // Add cache-busting timestamp
    const timestamp = Date.now();
    widgetCode = `// Generated: ${timestamp}\n${widgetCode}`;

    // Return as JavaScript with proper headers
    return new NextResponse(widgetCode, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error: any) {
    console.error('Widget configuration error:', error);
    return new NextResponse(`console.error('Widget error: ${error.message}');`, {
      status: 500,
      headers: {
        'Content-Type': 'application/javascript',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}