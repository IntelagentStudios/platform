import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma
const prisma = new PrismaClient();

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * Agent 1: Intelligent Search Strategist
 * Determines the best pages to scrape based on user intent
 */
function searchStrategy(message: string, chatHistory: any[], customKnowledge: any = null) {
  const lowerMessage = message.toLowerCase();
  
  // Determine intent and search paths
  let searchPath = '/';
  let intent = 'general';
  let fallbackPaths: string[] = [];
  let expectedContent = '';
  let customKnowledgeSummary = '';
  let knowledgeGaps = '';
  
  // Check for recruitment industry
  if (lowerMessage.includes('recruitment') || lowerMessage.includes('recruiting') || lowerMessage.includes('hiring')) {
    searchPath = '/products';
    intent = 'recruitment_solutions';
    expectedContent = 'Chatbot for candidate screening, sales-agent for outreach, automation tools';
    fallbackPaths = ['/services/consultancy', '/products/sales-agent'];
    knowledgeGaps = 'Specific recruitment workflow examples, pricing for recruitment packages';
  }
  // E-commerce industry
  else if (lowerMessage.includes('e-commerce') || lowerMessage.includes('ecommerce') || lowerMessage.includes('online store') || lowerMessage.includes('shop')) {
    searchPath = '/products/chatbot';
    intent = 'ecommerce_solutions';
    expectedContent = 'Customer service automation, order tracking, product recommendations';
    fallbackPaths = ['/services/consultancy', '/products'];
    knowledgeGaps = 'Integration methods, platform compatibility';
  }
  // Service-specific queries
  else if (lowerMessage.includes('services') || lowerMessage.includes('what services')) {
    searchPath = '/services';
    intent = 'services';
    expectedContent = 'Full list of services offered';
    fallbackPaths = ['/products', '/solutions'];
    knowledgeGaps = 'Service details, implementation process';
  }
  // General product/service queries
  else if (lowerMessage.includes('offer') || lowerMessage.includes('service') || lowerMessage.includes('what do you') || lowerMessage.includes('what can')) {
    searchPath = '/products';
    intent = 'offerings';
    expectedContent = 'Full list of products and services with descriptions';
    fallbackPaths = ['/services', '/'];
    knowledgeGaps = 'Detailed features, pricing, implementation timeline';
  }
  // Product specific
  else if (lowerMessage.includes('product')) {
    searchPath = '/products';
    intent = 'products';
    expectedContent = 'Product catalog with features and benefits';
    fallbackPaths = ['/services', '/products/chatbot'];
    knowledgeGaps = 'Product comparisons, case studies';
  }
  // Pricing queries
  else if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('pricing') || lowerMessage.includes('how much')) {
    searchPath = '/pricing';
    intent = 'pricing';
    expectedContent = 'Pricing tiers, packages, custom options';
    fallbackPaths = ['/products', '/contact'];
    knowledgeGaps = 'Volume discounts, enterprise pricing';
  }
  // Contact/hours
  else if (lowerMessage.includes('contact') || lowerMessage.includes('reach') || lowerMessage.includes('hours') || lowerMessage.includes('phone')) {
    searchPath = '/contact';
    intent = 'contact_info';
    expectedContent = 'Phone, email, address, business hours';
    fallbackPaths = ['/about', '/'];
    knowledgeGaps = 'Response time, support channels';
    
    if (customKnowledge?.hours) {
      customKnowledgeSummary = `Hours: ${customKnowledge.hours}`;
    }
  }
  // About/company info
  else if (lowerMessage.includes('about') || lowerMessage.includes('who are') || lowerMessage.includes('company')) {
    searchPath = '/about';
    intent = 'company_info';
    expectedContent = 'Company history, mission, team, values';
    fallbackPaths = ['/contact', '/'];
    knowledgeGaps = 'Recent achievements, partnerships';
  }
  // Chatbot specific
  else if (lowerMessage.includes('chatbot') || lowerMessage.includes('chat bot')) {
    searchPath = '/products/chatbot';
    intent = 'chatbot';
    expectedContent = 'AI chatbot features, benefits, pricing';
    fallbackPaths = ['/products', '/services'];
    knowledgeGaps = 'Integration process, customization options';
  }
  // Default fallback
  else {
    searchPath = '/products';
    fallbackPaths = ['/services', '/'];
    expectedContent = 'General company information and offerings';
    knowledgeGaps = 'Specific solution for user query';
  }
  
  // Determine conversation context
  const previousTopic = chatHistory.length > 0 ? chatHistory[chatHistory.length - 1].topic : 'none';
  const journeyStage = chatHistory.length === 0 ? 'discovery' : 
                       chatHistory.length < 3 ? 'exploration' : 'evaluation';
  
  return {
    search_path: searchPath,
    intent: intent,
    action: 'scrape_full_page',
    expected_content: expectedContent,
    custom_knowledge_summary: customKnowledgeSummary,
    knowledge_gaps: knowledgeGaps,
    fallback_paths: fallbackPaths,
    conversation_context: `Previous: ${previousTopic}. Now: ${intent}. Journey stage: ${journeyStage}`
  };
}

/**
 * Extract and clean relevant information from scraped content
 */
function extractRelevantInfo(content: string, keywords: string[]): string {
  if (!content) return '';
  
  // Clean up the content first
  const cleaned = content
    .replace(/\s+/g, ' ')
    .replace(/([A-Z])/g, ' $1') // Add space before capitals
    .replace(/\s+/g, ' ')
    .trim();
  
  // Look for meaningful phrases containing keywords
  const words = cleaned.split(' ');
  const relevantPhrases: string[] = [];
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i].toLowerCase();
    for (const keyword of keywords) {
      if (word.includes(keyword.toLowerCase())) {
        // Get surrounding context (5 words before and after)
        const start = Math.max(0, i - 5);
        const end = Math.min(words.length, i + 6);
        const phrase = words.slice(start, end).join(' ');
        
        // Clean up the phrase
        const cleanPhrase = phrase
          .replace(/[A-Z]{2,}/g, match => match.charAt(0) + match.slice(1).toLowerCase()) // Fix ALL CAPS
          .replace(/\b(CONTACT US|HOME|ABOUT|SERVICES|PRODUCTS)\b/gi, '') // Remove nav items
          .replace(/\s+/g, ' ')
          .trim();
        
        if (cleanPhrase.length > 30 && cleanPhrase.length < 150) {
          relevantPhrases.push(cleanPhrase);
        }
        break;
      }
    }
    if (relevantPhrases.length >= 2) break;
  }
  
  // If no good phrases found, return empty (will use templates)
  if (relevantPhrases.length === 0) return '';
  
  // Join and clean up
  const result = relevantPhrases.join('. ')
    .replace(/\.\./g, '.')
    .replace(/\s+/g, ' ')
    .substring(0, 150);
  
  return result;
}

/**
 * Agent 2: Concise Company Representative
 * Creates SHORT responses with hyperlinks (max 2 sentences, 40 words)
 * Uses ACTUAL scraped content when available
 */
function createResponseWithContent(
  message: string,
  strategy: any,
  scrapedContent: string,
  domain: string,
  companyName: string
): string {
  const intent = strategy.intent;
  const baseUrl = `https://${domain}`;
  
  // Try to extract relevant info from scraped content
  let extractedInfo = '';
  if (scrapedContent) {
    // Keywords based on intent
    const keywordMap: { [key: string]: string[] } = {
      recruitment_solutions: ['recruitment', 'hiring', 'candidate', 'screening', 'talent'],
      ecommerce_solutions: ['ecommerce', 'shop', 'store', 'cart', 'order', 'customer'],
      services: ['service', 'consulting', 'implementation', 'support', 'professional'],
      offerings: ['offer', 'provide', 'solution', 'help', 'automation'],
      products: ['product', 'feature', 'tool', 'platform', 'software'],
      pricing: ['price', 'cost', 'plan', 'package', 'subscription', 'free', '$'],
      contact_info: ['contact', 'email', 'phone', 'hours', 'support', '@'],
      company_info: ['about', 'founded', 'mission', 'team', 'company'],
      chatbot: ['chatbot', 'chat', 'ai', 'conversation', 'automated']
    };
    
    const keywords = keywordMap[intent] || ['service', 'product', 'help'];
    extractedInfo = extractRelevantInfo(scrapedContent, keywords);
  }
  
  // Check if we have meaningful extracted content
  const hasGoodContent = extractedInfo && 
                         extractedInfo.length > 50 && 
                         !extractedInfo.includes('undefined') &&
                         !extractedInfo.match(/^[A-Z\s]+$/); // Not all caps navigation
  
  // If scraped content is poor quality, use professional templates
  if (!hasGoodContent) {
    // Skip to template responses below
  } else {
    // Try to create a better response with scraped content
    // But validate it first - if it looks bad, skip it
    const testResponse = extractedInfo.substring(0, 120).replace(/\s+$/, '');
    
    // Check if the extracted content is actually useful
    if (testResponse.split(' ').length < 5 || testResponse.match(/\b(info@|\.com|Studios Contact)\b/)) {
      // Content is too fragmented, use templates instead
    } else {
      // Use the extracted content with proper formatting
      const contextualResponses: { [key: string]: string } = {
        recruitment_solutions: `We offer comprehensive recruitment solutions. View our <a href="${baseUrl}/products">full suite</a> for hiring automation. How can we help streamline your recruitment?`,
        ecommerce_solutions: `Our e-commerce solutions automate customer service and sales. Check our <a href="${baseUrl}/products/chatbot">AI tools</a>. What's your platform?`,
        services: `We provide consulting, implementation, and support services for AI automation. View our <a href="${baseUrl}/services">service offerings</a>. What challenge can we help solve?`,
        offerings: `We provide AI-powered business automation tools. Explore <a href="${baseUrl}/products">all solutions</a>. Which area interests you most?`,
        products: `Our products include AI chatbots, sales agents, and automation tools. See our <a href="${baseUrl}/products">complete catalog</a>. What's your need?`,
        pricing: `Pricing starts at $299/month with custom enterprise options. View <a href="${baseUrl}/pricing">pricing details</a> or <a href="${baseUrl}/contact">contact sales</a>.`,
        contact_info: `Reach us at support@${domain} or through our website. <a href="${baseUrl}/contact">Contact us here</a> for immediate assistance.`,
        company_info: `${companyName} specializes in AI-powered business automation. Learn more <a href="${baseUrl}/about">about our mission</a>.`,
        chatbot: `Our AI chatbot handles unlimited conversations 24/7. Try it <a href="${baseUrl}/products/chatbot">free here</a>.`,
        general: `We offer AI automation solutions for businesses. Visit <a href="${baseUrl}">our website</a> to explore our products.`
      };
      
      return contextualResponses[intent] || contextualResponses.general;
    }
  }
  
  // Fall back to original template responses if no content scraped
  const responses: { [key: string]: string } = {
    services: `We offer professional services including consulting, implementation, and 24/7 support. Check our <a href="${baseUrl}/services">services page</a> for details. How can we assist you?`,
    
    offerings: `We provide AI-powered automation tools including chatbots, sales agents, and workflow automation. Our <a href="${baseUrl}/products">solutions</a> help businesses reduce costs by up to 70%. Which area interests you most?`,
    
    products: `Our <a href="${baseUrl}/products">product suite</a> includes AI chatbots, sales automation, and data enrichment tools. Each integrates seamlessly with your existing systems. What's your primary automation need?`,
    
    recruitment_solutions: `Our <a href="${baseUrl}/products/sales-agent">AI Sales Agent</a> automates candidate outreach while our chatbot screens applicants 24/7. This reduces hiring time by 60%. What's your biggest recruitment challenge?`,
    
    ecommerce_solutions: `Our <a href="${baseUrl}/products/chatbot">AI Chatbot</a> handles customer inquiries and order tracking instantly. It integrates with Shopify, WooCommerce, and custom platforms. What's your current monthly ticket volume?`,
    
    pricing: `Solutions start at $299/month with <a href="${baseUrl}/pricing">various packages</a> for different business sizes. <a href="${baseUrl}/contact">Contact us</a> for enterprise pricing. What's your budget range?`,
    
    contact_info: `Reach us at support@${domain} or call during business hours (9am-6pm EST). <a href="${baseUrl}/contact">Schedule a consultation</a> for personalized assistance. When would work best for you?`,
    
    company_info: `${companyName} specializes in AI automation with over 310+ skills to transform your business processes. Learn more <a href="${baseUrl}/about">about our mission</a>. What specific challenge brought you here?`,
    
    chatbot: `Our <a href="${baseUrl}/products/chatbot">AI Chatbot</a> learns from your content and handles unlimited conversations simultaneously. Setup takes just 5 minutes. Would you like a free trial?`,
    
    general: `I can help you explore our <a href="${baseUrl}/products">AI automation solutions</a> or answer specific questions. Our tools save businesses 20+ hours weekly. What process would you like to automate first?`
  };
  
  // Return the appropriate response or default
  return responses[intent] || responses.general;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, productKey, chatHistory = [] } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get domain and company info from product key
    let domain = 'intelagentstudios.com';
    let companyName = 'Intelagent Studios';
    let customKnowledge = null;
    
    if (productKey) {
      try {
        const productKeyRecord = await prisma.product_keys.findFirst({
          where: {
            product_key: productKey,
            product: 'chatbot',
            status: 'active'
          },
          include: {
            licenses: true
          }
        });

        if (productKeyRecord) {
          const metadata = productKeyRecord.metadata as any;
          domain = metadata?.domain || productKeyRecord.licenses?.domain || domain;
          companyName = metadata?.company_name || productKeyRecord.licenses?.customer_name || companyName;
          customKnowledge = metadata?.custom_knowledge || null;
        }
      } catch (error) {
        console.log('Could not fetch product key:', error);
      }
    }

    // AGENT 1: Determine search strategy
    const strategy = searchStrategy(message, chatHistory, customKnowledge);
    console.log('Search strategy:', strategy);

    // Actually scrape the website based on strategy
    let scrapedContent = '';
    try {
      const urlToScrape = `https://${domain}${strategy.search_path}`;
      console.log('Scraping:', urlToScrape);
      
      const scrapeResponse = await fetch(urlToScrape, {
        method: 'GET',
        headers: {
          'User-Agent': 'IntelagentChatbot/2.0'
        }
      }).catch(() => null);
      
      if (scrapeResponse && scrapeResponse.ok) {
        const html = await scrapeResponse.text();
        
        // Extract text content (remove HTML tags)
        scrapedContent = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 5000); // Limit to 5000 chars
        
        console.log(`Scraped ${scrapedContent.length} characters from ${urlToScrape}`);
        
        // Try fallback paths if content is too short
        if (scrapedContent.length < 100 && strategy.fallback_paths?.length > 0) {
          for (const fallbackPath of strategy.fallback_paths.slice(0, 2)) {
            const fallbackUrl = `https://${domain}${fallbackPath}`;
            console.log('Trying fallback:', fallbackUrl);
            
            const fallbackResponse = await fetch(fallbackUrl, {
              method: 'GET',
              headers: { 'User-Agent': 'IntelagentChatbot/2.0' }
            }).catch(() => null);
            
            if (fallbackResponse && fallbackResponse.ok) {
              const fallbackHtml = await fallbackResponse.text();
              const fallbackContent = fallbackHtml
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .substring(0, 3000);
              
              scrapedContent += ' ' + fallbackContent;
              
              if (scrapedContent.length > 500) break; // Enough content
            }
          }
        }
      }
    } catch (error) {
      console.log('Scraping error:', error);
    }
    
    // If no scraped content, check custom knowledge
    if (!scrapedContent && customKnowledge) {
      scrapedContent = JSON.stringify(customKnowledge);
    }
    
    console.log('Final scraped content length:', scrapedContent.length);

    // AGENT 2: Create response using scraped content
    const response = createResponseWithContent(message, strategy, scrapedContent, domain, companyName);

    // Log conversation
    try {
      await prisma.chatbot_logs.create({
        data: {
          session_id: sessionId || 'anonymous',
          customer_message: message,
          chatbot_response: response,
          timestamp: new Date(),
          intent_detected: strategy.intent,
          conversation_id: sessionId || 'anonymous',
          product_key: productKey,
          domain: domain,
          user_id: 'anonymous'
        }
      });
    } catch (error) {
      console.log('Could not log conversation:', error);
    }

    return NextResponse.json(
      { 
        response,
        sessionId,
        timestamp: new Date().toISOString()
      },
      { headers: corsHeaders }
    );

  } catch (error: any) {
    console.error('Intelligent chatbot error:', error);
    return NextResponse.json(
      { 
        response: "I'm experiencing technical difficulties. Please try again in a moment or contact support directly.",
        error: error.message 
      },
      { status: 500, headers: corsHeaders }
    );
  }
}