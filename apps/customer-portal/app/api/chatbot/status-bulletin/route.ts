import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { productKey, conversations, stats } = await request.json();

    if (!productKey) {
      return NextResponse.json({ error: 'Product key required' }, { status: 400 });
    }

    // Check for system-wide issues or account flags
    const accountFlags = await checkAccountFlags(productKey);
    const systemIssues = await checkSystemIssues();

    // If there are critical issues, return them immediately
    if (accountFlags.critical || systemIssues.critical) {
      const criticalMessage = accountFlags.details?.[0] || systemIssues.details?.[0] ||
        'Critical issue detected - please check your account settings.';
      return NextResponse.json({
        bulletin: {
          priority: 'critical',
          message: criticalMessage,
          timestamp: new Date().toISOString()
        }
      });
    }

    // If there are warnings, include them
    if (accountFlags.warning || systemIssues.warning) {
      const warningMessage = accountFlags.details?.[0] || systemIssues.details?.[0] ||
        'There\'s something that needs your attention in the settings.';
      return NextResponse.json({
        bulletin: {
          priority: 'warning',
          message: warningMessage,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Default to simple status message
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        bulletin: {
          priority: 'info',
          message: "Everything is running smoothly.",
          timestamp: new Date().toISOString()
        }
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Analyze recent conversations for interesting patterns
    const recentConversations = conversations.slice(0, 20);
    const topics: Record<string, number> = {};
    const locations: Record<string, number> = {};

    recentConversations.forEach((conv: any) => {
      // Extract topics
      if (conv.messages && conv.messages.length > 0) {
        const firstUserMessage = conv.messages.find((m: any) => m.sender === 'user');
        if (firstUserMessage) {
          const content = firstUserMessage.content.toLowerCase();
          if (content.includes('price') || content.includes('cost')) {
            topics['pricing'] = (topics['pricing'] || 0) + 1;
          }
          if (content.includes('feature') || content.includes('how')) {
            topics['features'] = (topics['features'] || 0) + 1;
          }
          if (content.includes('support') || content.includes('help')) {
            topics['support'] = (topics['support'] || 0) + 1;
          }
        }
      }

      // Extract domains/locations
      if (conv.domain) {
        const domain = conv.domain;
        if (domain.includes('.ca')) locations['Canada'] = (locations['Canada'] || 0) + 1;
        if (domain.includes('.uk')) locations['UK'] = (locations['UK'] || 0) + 1;
        if (domain.includes('.au')) locations['Australia'] = (locations['Australia'] || 0) + 1;
      }
    });

    // Generate natural language bulletin
    const topTopic = Object.entries(topics).sort((a, b) => b[1] - a[1])[0];
    const topLocation = Object.entries(locations).sort((a, b) => b[1] - a[1])[0];

    const prompt = `Based on this chatbot activity data, determine if there's anything notable happening:

Today's conversations: ${stats?.todayConversations || 0}
This week: ${stats?.weekConversations || 0}
Top topic: ${topTopic ? `${topTopic[0]} (${topTopic[1]} conversations)` : 'General inquiries'}
Notable location: ${topLocation ? `Increased interest from ${topLocation[0]}` : 'Normal geographic distribution'}

Generate a JSON response with:
- message: Either "Everything is running smoothly." OR if there's something genuinely notable (like unusual activity, a spike in a specific topic, or new geographic interest), mention it briefly.

Examples:
- Normal activity: "Everything is running smoothly."
- Notable activity: "Seeing increased interest from Canada today."
- Notable activity: "Lots of pricing questions coming in this afternoon."

Default to "Everything is running smoothly." unless there's genuinely something worth mentioning.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that provides brief, conversational updates about chatbot activity. Write like you\'re having a friendly conversation with the business owner. Be specific and natural.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');

    return NextResponse.json({
      bulletin: {
        priority: 'info',
        message: aiResponse.message || "Everything is running smoothly.",
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating status bulletin:', error);
    return NextResponse.json({
      bulletin: {
        priority: 'info',
        message: 'Everything is running smoothly.',
        timestamp: new Date().toISOString()
      }
    });
  }
}

async function checkAccountFlags(productKey: string) {
  try {
    // Find the license key from the product key
    const productKeyRecord = await prisma.product_keys.findUnique({
      where: { product_key: productKey }
    });

    if (!productKeyRecord) {
      return { warning: false, critical: false, details: [] };
    }

    // Check for account-specific issues
    const license = await prisma.licenses.findUnique({
      where: { license_key: productKeyRecord.license_key }
    });

    if (!license) {
      return { warning: false, critical: false, details: [] };
    }

    const details: string[] = [];
    let priority: 'warning' | 'critical' | null = null;

    // Check for subscription issues
    if (license.subscription_status === 'past_due') {
      details.push('Payment past due - please update billing information');
      priority = 'warning';
    }

    if (license.subscription_status === 'canceled' || license.subscription_status === 'unpaid') {
      details.push('Subscription inactive - service may be interrupted');
      priority = 'critical';
    }

    // Check for usage limits (example)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLogs = await prisma.chatbot_logs.count({
      where: {
        product_key: productKey,
        created_at: { gte: today }
      }
    });

    // Example: Alert if approaching limits
    if (todayLogs > 900 && license.tier === 'pro') {
      details.push('Approaching daily conversation limit (900/1000)');
      priority = priority === 'critical' ? 'critical' : 'warning';
    }

    return {
      warning: priority === 'warning',
      critical: priority === 'critical',
      details
    };
  } catch (error) {
    console.error('Error checking account flags:', error);
    return { warning: false, critical: false, details: [] };
  }
}

async function checkSystemIssues() {
  try {
    // Check for system-wide issues
    const details: string[] = [];
    let priority: 'warning' | 'critical' | null = null;

    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      details.push('AI insights unavailable - OpenAI not configured');
      priority = 'warning';
    }

    // You could add more system checks here:
    // - Database connectivity
    // - High error rates
    // - Service outages
    // - Scheduled maintenance

    return {
      warning: priority === 'warning',
      critical: priority === 'critical',
      details
    };
  } catch (error) {
    console.error('Error checking system issues:', error);
    return { warning: false, critical: false, details: [] };
  }
}