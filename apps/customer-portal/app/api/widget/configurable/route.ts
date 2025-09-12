import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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
      }
    } catch (error) {
      console.error('Could not fetch product configuration:', error);
    }

    // Simply redirect to the static widget with configuration injected via global variable
    const widgetCode = `
(function() {
  // Configuration from database
  window.INTELAGENT_CONFIG = {
    title: "${title}",
    companyName: "${companyName}",
    domain: "${domain}",
    productKey: "${productKey}"
  };
  
  // Load the static widget with increased padding
  const script = document.createElement('script');
  script.src = 'https://dashboard.intelagentstudios.com/chatbot-widget.js';
  script.setAttribute('data-product-key', '${productKey}');
  
  // Add custom styles with increased padding
  const style = document.createElement('style');
  style.textContent = \`
    /* Override padding with increased values */
    .intelagent-chat-header {
      padding: 30px 35px !important; /* Increased from 20px 24px */
    }
    .intelagent-chat-messages {
      padding: 35px !important; /* Increased from 24px */
    }
    .intelagent-message {
      margin: 25px 0 !important; /* Increased from 16px */
    }
    .intelagent-message-content {
      padding: 18px 25px !important; /* Increased from 12px 18px */
    }
    .intelagent-chat-input {
      padding: 20px 25px !important; /* Increased from 12px 16px */
    }
    .intelagent-chat-input textarea {
      padding: 12px 18px !important; /* Increased from 6px 12px */
    }
    /* Ensure box-sizing for proper spacing */
    .intelagent-chat-box,
    .intelagent-chat-box * {
      box-sizing: border-box !important;
    }
  \`;
  document.head.appendChild(style);
  
  // Append the script
  document.head.appendChild(script);
})();
`;

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