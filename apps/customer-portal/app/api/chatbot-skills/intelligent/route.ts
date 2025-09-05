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
 * Extract and intelligently process scraped content
 * Similar to n8n workflow's content extraction
 */
function extractRelevantInfo(content: string, keywords: string[]): string[] {
  if (!content) return [];
  
  // First, clean the content properly
  let cleaned = content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Split into sentences
  const sentences = cleaned.match(/[^.!?]+[.!?]+/g) || [];
  const relevantSentences: string[] = [];
  const seenContent = new Set<string>();
  
  // Score each sentence based on keyword relevance
  for (const sentence of sentences) {
    let score = 0;
    const lowerSentence = sentence.toLowerCase();
    
    // Skip navigation/header content
    if (lowerSentence.length < 30 || 
        lowerSentence.match(/^(home|about|services|products|contact|menu)/i) ||
        lowerSentence.includes('cookie') ||
        lowerSentence.includes('privacy policy')) {
      continue;
    }
    
    // Score based on keywords
    for (const keyword of keywords) {
      if (lowerSentence.includes(keyword.toLowerCase())) {
        score += 2;
      }
    }
    
    // Boost score for valuable content indicators
    if (lowerSentence.includes('we offer') || 
        lowerSentence.includes('we provide') ||
        lowerSentence.includes('our service') ||
        lowerSentence.includes('our product')) {
      score += 3;
    }
    
    if (score > 0) {
      const cleanedSentence = sentence
        .replace(/\s+/g, ' ')
        .trim();
      
      // Avoid duplicates
      const sentenceKey = cleanedSentence.substring(0, 50);
      if (!seenContent.has(sentenceKey)) {
        seenContent.add(sentenceKey);
        relevantSentences.push({
          sentence: cleanedSentence,
          score: score
        } as any);
      }
    }
  }
  
  // Sort by score and take the best ones
  return relevantSentences
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 3)
    .map((item: any) => item.sentence);
}

/**
 * Agent 2: Intelligent Response Creator
 * Uses ACTUAL scraped content to create responses
 * Mimics n8n workflow's dual-agent approach
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
  
  // Extract relevant sentences from scraped content
  let relevantSentences: string[] = [];
  
  if (scrapedContent && scrapedContent.length > 100) {
    // Keywords based on intent - more comprehensive
    const keywordMap: { [key: string]: string[] } = {
      recruitment_solutions: ['recruitment', 'hiring', 'candidate', 'screening', 'talent', 'hr', 'interview', 'applicant'],
      ecommerce_solutions: ['ecommerce', 'e-commerce', 'shop', 'store', 'cart', 'order', 'customer', 'online', 'retail'],
      services: ['service', 'consulting', 'implementation', 'support', 'professional', 'expertise', 'assist'],
      offerings: ['offer', 'provide', 'solution', 'help', 'automation', 'deliver', 'enable'],
      products: ['product', 'feature', 'tool', 'platform', 'software', 'application', 'system'],
      pricing: ['price', 'pricing', 'cost', 'plan', 'package', 'subscription', 'free', 'trial', 'month', 'year', '$', '€', '£'],
      contact_info: ['contact', 'email', 'phone', 'call', 'hours', 'support', 'reach', 'available', '@'],
      company_info: ['about', 'founded', 'mission', 'team', 'company', 'who we are', 'established', 'vision'],
      chatbot: ['chatbot', 'chat', 'bot', 'ai', 'artificial', 'conversation', 'automated', 'assistant']
    };
    
    const keywords = keywordMap[intent] || ['service', 'product', 'solution', 'help', 'offer', 'provide'];
    relevantSentences = extractRelevantInfo(scrapedContent, keywords);
  }
  
  // Build response from scraped content
  if (relevantSentences && relevantSentences.length > 0) {
    // Take the best 1-2 sentences and make them concise
    let response = '';
    
    if (relevantSentences.length >= 2) {
      // Use first sentence as main info, second as support
      const mainInfo = relevantSentences[0].substring(0, 100);
      const supportInfo = relevantSentences[1].substring(0, 80);
      response = `${mainInfo}. ${supportInfo}`;
    } else {
      // Use single sentence
      response = relevantSentences[0].substring(0, 150);
    }
    
    // Clean up the response
    response = response
      .replace(/\.\./g, '.')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Add appropriate link based on intent (generic for all companies)
    const linkMap: { [key: string]: string } = {
      recruitment_solutions: `Learn more about <a href="${baseUrl}/products">our solutions</a>.`,
      ecommerce_solutions: `Explore <a href="${baseUrl}/products">our tools</a>.`,
      services: `View <a href="${baseUrl}/services">our services</a>.`,
      offerings: `See <a href="${baseUrl}/products">our offerings</a>.`,
      products: `Browse <a href="${baseUrl}/products">our products</a>.`,
      pricing: `Check <a href="${baseUrl}/pricing">pricing details</a>.`,
      contact_info: `<a href="${baseUrl}/contact">Contact us</a>.`,
      company_info: `More <a href="${baseUrl}/about">about us</a>.`,
      chatbot: `Learn more <a href="${baseUrl}">here</a>.`
    };
    
    // Add follow-up question based on intent
    const followUpMap: { [key: string]: string } = {
      recruitment_solutions: 'What role are you hiring for?',
      ecommerce_solutions: 'What platform do you use?',
      services: 'What challenge can we help with?',
      offerings: 'Which area interests you?',
      products: 'What functionality do you need?',
      pricing: 'What\'s your budget range?',
      contact_info: 'How can we help?',
      company_info: 'What would you like to know?',
      chatbot: 'Would you like a demo?'
    };
    
    const link = linkMap[intent] || `Visit <a href="${baseUrl}">our website</a>.`;
    const followUp = followUpMap[intent] || 'How can I help?';
    
    // Combine into final response (keep under 2 sentences, ~40 words)
    if (response.length > 120) {
      response = response.substring(0, 120) + '...';
    }
    
    return `${response} ${link} ${followUp}`;
  }
  
  // ONLY if no content was scraped at all, provide minimal generic fallback
  console.log('Warning: No content scraped, using minimal fallback');
  const minimalFallbacks: { [key: string]: string } = {
    services: `Please visit our <a href="${baseUrl}/services">services page</a> for details. How can I assist you?`,
    offerings: `View our <a href="${baseUrl}/products">solutions</a>. What are you looking for?`,
    products: `See our <a href="${baseUrl}/products">products</a>. What interests you?`,
    pricing: `Check our <a href="${baseUrl}/pricing">pricing page</a>. Need specific information?`,
    contact_info: `Visit our <a href="${baseUrl}/contact">contact page</a>. How can I help?`,
    company_info: `Learn more <a href="${baseUrl}/about">about us</a>. What would you like to know?`,
    chatbot: `I'm here to help answer your questions. What would you like to know?`,
    general: `Visit <a href="${baseUrl}">our website</a> for more information. How can I assist you?`
  };
  
  return minimalFallbacks[intent] || minimalFallbacks.general;
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
    const urlsToScrape: string[] = [];
    
    // Build list of URLs to scrape
    urlsToScrape.push(`https://${domain}${strategy.search_path}`);
    if (strategy.fallback_paths && strategy.fallback_paths.length > 0) {
      strategy.fallback_paths.forEach((path: string) => {
        urlsToScrape.push(`https://${domain}${path}`);
      });
    }
    
    console.log('URLs to scrape:', urlsToScrape);
    
    // Scrape multiple pages for better content
    for (const url of urlsToScrape.slice(0, 3)) {
      try {
        console.log('Scraping:', url);
        
        const scrapeResponse = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; IntelagentBot/2.0)',
            'Accept': 'text/html,application/xhtml+xml'
          },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        }).catch(err => {
          console.log(`Failed to fetch ${url}:`, err.message);
          return null;
        });
        
        if (scrapeResponse && scrapeResponse.ok) {
          const html = await scrapeResponse.text();
          
          // Better HTML processing
          let pageContent = html
            // Remove script and style tags first
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
            // Extract text from important tags
            .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, ' $1. ')
            .replace(/<p[^>]*>(.*?)<\/p>/gi, ' $1. ')
            .replace(/<li[^>]*>(.*?)<\/li>/gi, ' $1. ')
            .replace(/<div[^>]*>(.*?)<\/div>/gi, ' $1 ')
            .replace(/<span[^>]*>(.*?)<\/span>/gi, ' $1 ')
            // Remove remaining HTML
            .replace(/<[^>]+>/g, ' ')
            // Clean up entities
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            // Clean whitespace
            .replace(/\s+/g, ' ')
            .trim();
          
          if (pageContent.length > 100) {
            scrapedContent += ' ' + pageContent.substring(0, 3000);
            console.log(`Added ${pageContent.length} chars from ${url}`);
          }
          
          // Stop if we have enough content
          if (scrapedContent.length > 5000) break;
        }
      } catch (error) {
        console.log(`Error scraping ${url}:`, error);
      }
    }
    
    console.log(`Total scraped content: ${scrapedContent.length} characters`);
    
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