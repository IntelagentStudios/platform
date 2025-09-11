import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productKey = searchParams.get('key');
  
  if (!productKey) {
    return new NextResponse('// Error: Product key required', {
      status: 400,
      headers: { 'Content-Type': 'application/javascript' }
    });
  }

  try {
    // Get the product key info and settings
    const productKeyInfo = await prisma.product_keys.findUnique({
      where: { product_key: productKey },
      select: {
        license_key: true,
        status: true,
        metadata: true
      }
    });

    if (!productKeyInfo || productKeyInfo.status !== 'active') {
      return new NextResponse('// Error: Invalid or inactive product key', {
        status: 404,
        headers: { 'Content-Type': 'application/javascript' }
      });
    }

    // Get custom knowledge
    const customKnowledge = await prisma.custom_knowledge.findMany({
      where: { 
        license_key: productKeyInfo.license_key,
        is_active: true
      },
      select: {
        content: true,
        knowledge_type: true
      }
    });

    // Combine knowledge
    let combinedKnowledge = '';
    if (customKnowledge.length > 0) {
      combinedKnowledge = customKnowledge
        .map(k => `[${k.knowledge_type}]\n${k.content}`)
        .join('\n\n---\n\n');
    }

    // Get settings from metadata
    const metadata = productKeyInfo.metadata as any;
    const settings = metadata?.settings || {};

    // Read the base widget script
    const widgetPath = path.join(process.cwd(), 'public', 'chatbot-widget-v3.js');
    let widgetScript = fs.readFileSync(widgetPath, 'utf-8');

    // Inject configuration and knowledge directly into the script
    const configInjection = `
// Injected configuration for product key: ${productKey}
window.INTELAGENT_CONFIG = {
  productKey: '${productKey}',
  settings: ${JSON.stringify({
    primaryColor: settings.primaryColor || '#0070f3',
    headerColor: settings.headerColor || settings.primaryColor || '#0070f3',
    backgroundColor: settings.backgroundColor || '#ffffff',
    position: settings.position || 'bottom-right',
    welcomeMessage: settings.welcomeMessage || 'Hello! How can I help you today?',
    responseStyle: settings.responseStyle || 'professional',
    playNotificationSound: settings.playNotificationSound !== false,
    showWelcomeMessage: settings.showWelcomeMessage !== false,
    collectEmail: settings.collectEmail || false
  }, null, 2)},
  knowledge: ${JSON.stringify(combinedKnowledge)},
  hasKnowledge: ${customKnowledge.length > 0},
  lastUpdated: '${new Date().toISOString()}'
};
`;

    // Replace the product key detection with the injected one
    widgetScript = widgetScript.replace(
      /const productKey = script\.getAttribute.*?;/s,
      `const productKey = window.INTELAGENT_CONFIG.productKey;`
    );

    // Replace the fetchConfig function to use injected config
    widgetScript = widgetScript.replace(
      /async function fetchConfig\(\) \{[\s\S]*?\n  \}/,
      `async function fetchConfig() {
    // Use injected configuration
    if (window.INTELAGENT_CONFIG && window.INTELAGENT_CONFIG.settings) {
      console.log('Using injected configuration');
      return window.INTELAGENT_CONFIG.settings;
    }
    // Fallback to API fetch
    try {
      const baseUrl = window.location.origin.includes('localhost') 
        ? window.location.origin 
        : 'https://dashboard.intelagentstudios.com';
      const response = await fetch(\`\${baseUrl}/api/widget/config?key=\${productKey}\`);
      if (response.ok) {
        const data = await response.json();
        return data.config;
      }
    } catch (error) {
      console.error('Failed to fetch widget config:', error);
    }
    return {
      primaryColor: '#0070f3',
      headerColor: '#0070f3',
      backgroundColor: '#ffffff',
      position: 'bottom-right',
      welcomeMessage: 'Hello! How can I help you today?',
      responseStyle: 'professional'
    };
  }`
    );

    // Replace the fetchCustomKnowledge function to use injected knowledge
    widgetScript = widgetScript.replace(
      /async function fetchCustomKnowledge\(\) \{[\s\S]*?\n  \}/,
      `async function fetchCustomKnowledge() {
    // Use injected knowledge
    if (window.INTELAGENT_CONFIG && window.INTELAGENT_CONFIG.knowledge) {
      console.log('Using injected knowledge:', window.INTELAGENT_CONFIG.hasKnowledge ? 'Yes' : 'No');
      return window.INTELAGENT_CONFIG.knowledge;
    }
    // Fallback to API fetch
    try {
      const baseUrl = window.location.origin.includes('localhost') 
        ? window.location.origin 
        : 'https://dashboard.intelagentstudios.com';
      const response = await fetch(\`\${baseUrl}/api/chatbot/knowledge\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productKey })
      });
      if (response.ok) {
        const data = await response.json();
        return data.knowledge || null;
      }
    } catch (error) {
      console.error('Failed to fetch custom knowledge:', error);
    }
    return null;
  }`
    );

    // Combine configuration injection with widget script
    const finalScript = configInjection + '\n' + widgetScript;

    return new NextResponse(finalScript, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error generating widget script:', error);
    return new NextResponse('// Error: Failed to generate widget script', {
      status: 500,
      headers: { 'Content-Type': 'application/javascript' }
    });
  }
}