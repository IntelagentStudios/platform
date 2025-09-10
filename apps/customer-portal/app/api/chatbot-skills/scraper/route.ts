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
 * Mimics the n8n workflow's dual-agent approach:
 * 1. Search Agent - Determines what to search and scrapes website
 * 2. Response Agent - Creates response using scraped data
 */
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

    // Get domain from product key
    let domain = 'intelagentstudios.com';
    let companyName = 'Intelagent Studios';
    
    if (productKey) {
      try {
        const productKeyRecord = await prisma.product_keys.findFirst({
          where: {
            product_key: productKey,
            product: 'chatbot',
            status: 'active'
          }
        });

        // Get license separately if needed
        let license = null;
        if (productKeyRecord?.license_key) {
          license = await prisma.licenses.findUnique({
            where: { license_key: productKeyRecord.license_key }
          });
        }

        if (productKeyRecord) {
          const metadata = productKeyRecord.metadata as any;
          domain = metadata?.domain || license?.domain || domain;
          companyName = metadata?.company_name || license?.customer_name || domain;
        }
      } catch (error) {
        console.log('Could not fetch product key:', error);
      }
    }

    // AGENT 1: Search Strategy (determines what pages to scrape)
    const searchStrategy = analyzeIntent(message, chatHistory);
    console.log('Search strategy:', searchStrategy);

    // Determine which pages to scrape based on intent
    let urlsToScrape = [`https://${domain}`]; // Always include homepage
    
    if (searchStrategy.intent === 'services' || searchStrategy.intent === 'products') {
      urlsToScrape.push(
        `https://${domain}/services`,
        `https://${domain}/products`,
        `https://${domain}/solutions`,
        `https://${domain}/features`
      );
    } else if (searchStrategy.intent === 'pricing' || searchStrategy.intent === 'cost') {
      urlsToScrape.push(
        `https://${domain}/pricing`,
        `https://${domain}/plans`,
        `https://${domain}/packages`
      );
    } else if (searchStrategy.intent === 'contact') {
      urlsToScrape.push(
        `https://${domain}/contact`,
        `https://${domain}/about`,
        `https://${domain}/team`
      );
    } else if (searchStrategy.intent === 'about') {
      urlsToScrape.push(
        `https://${domain}/about`,
        `https://${domain}/company`,
        `https://${domain}/team`
      );
    }

    // Scrape the website pages
    const scrapedContent = await scrapeWebsite(urlsToScrape);
    
    // AGENT 2: Response Creation (creates response using scraped data)
    const response = createResponse(
      message,
      searchStrategy,
      scrapedContent,
      companyName,
      domain
    );

    // Log conversation
    try {
      await prisma.chatbot_logs.create({
        data: {
          session_id: sessionId || 'anonymous',
          customer_message: message,
          chatbot_response: response,
          timestamp: new Date(),
          intent_detected: searchStrategy.intent,
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
        timestamp: new Date().toISOString(),
        debug: {
          intent: searchStrategy.intent,
          urlsScraped: urlsToScrape.length,
          domain
        }
      },
      { headers: corsHeaders }
    );

  } catch (error: any) {
    console.error('Scraper chatbot error:', error);
    return NextResponse.json(
      { 
        response: "I apologize, but I'm having trouble accessing the website information. Please try again in a moment.",
        error: error.message 
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * Analyze user intent (Agent 1 logic)
 */
function analyzeIntent(message: string, chatHistory: any[]) {
  const lowerMessage = message.toLowerCase();
  
  // Determine intent
  let intent = 'general';
  let searchTerms: string[] = [];
  
  if (lowerMessage.includes('service') || lowerMessage.includes('offer') || lowerMessage.includes('what do you do')) {
    intent = 'services';
    searchTerms = ['services', 'solutions', 'offerings'];
  } else if (lowerMessage.includes('product')) {
    intent = 'products';
    searchTerms = ['products', 'features', 'solutions'];
  } else if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('pricing')) {
    intent = 'pricing';
    searchTerms = ['pricing', 'cost', 'plans', 'packages'];
  } else if (lowerMessage.includes('contact') || lowerMessage.includes('reach') || lowerMessage.includes('speak')) {
    intent = 'contact';
    searchTerms = ['contact', 'email', 'phone', 'address'];
  } else if (lowerMessage.includes('about') || lowerMessage.includes('who')) {
    intent = 'about';
    searchTerms = ['about', 'company', 'team', 'mission'];
  } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
    intent = 'support';
    searchTerms = ['help', 'support', 'documentation', 'faq'];
  }
  
  return {
    intent,
    searchTerms,
    originalMessage: message
  };
}

/**
 * Scrape website content (simplified version - in production would use proper scraping)
 */
async function scrapeWebsite(urls: string[]): Promise<any> {
  const scrapedData: any = {};
  
  for (const url of urls) {
    try {
      // In production, this would actually fetch and parse the website
      // For now, we'll use a simplified approach
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'IntelagentChatbot/1.0'
        }
      }).catch(() => null);
      
      if (response && response.ok) {
        const html = await response.text();
        
        // Extract text content (simplified - would use proper HTML parser in production)
        const textContent = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .substring(0, 5000); // Limit content length
        
        // Extract key information
        scrapedData[url] = {
          title: extractTitle(html),
          content: textContent,
          meta: extractMetaDescription(html)
        };
      }
    } catch (error) {
      console.log(`Could not scrape ${url}:`, error);
    }
  }
  
  // If no data was scraped, provide defaults
  if (Object.keys(scrapedData).length === 0) {
    scrapedData.default = {
      title: 'Company Website',
      content: 'Welcome to our website. We provide quality services and products.',
      meta: 'Professional services and solutions'
    };
  }
  
  return scrapedData;
}

/**
 * Extract title from HTML
 */
function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : 'Website';
}

/**
 * Extract meta description from HTML
 */
function extractMetaDescription(html: string): string {
  const match = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  return match ? match[1].trim() : '';
}

/**
 * Create response using scraped data (Agent 2 logic)
 */
function createResponse(
  message: string,
  searchStrategy: any,
  scrapedContent: any,
  companyName: string,
  domain: string
): string {
  // Combine all scraped content
  let allContent = '';
  for (const [url, data] of Object.entries(scrapedContent)) {
    const pageData = data as any;
    allContent += `${pageData.title}: ${pageData.content} ${pageData.meta} `;
  }
  
  // Create response based on intent and scraped content
  let response = '';
  
  if (searchStrategy.intent === 'services' || searchStrategy.intent === 'products') {
    // Look for service/product mentions in content
    const keywords = ['service', 'offer', 'provide', 'solution', 'product', 'feature'];
    const relevantInfo = extractRelevantSentences(allContent, keywords);
    
    if (relevantInfo.length > 0) {
      response = `Based on ${domain}, here's what I found:\n\n${relevantInfo}\n\nWould you like more specific information about any of these?`;
    } else {
      response = `${companyName} provides various services and solutions. Please visit ${domain} for detailed information about our offerings, or feel free to ask about specific services you're interested in.`;
    }
  }
  else if (searchStrategy.intent === 'pricing') {
    const keywords = ['price', 'cost', 'plan', 'package', 'subscription', 'fee', '$'];
    const relevantInfo = extractRelevantSentences(allContent, keywords);
    
    if (relevantInfo.length > 0) {
      response = `Here's the pricing information I found:\n\n${relevantInfo}\n\nFor detailed pricing or a custom quote, please visit ${domain}/pricing or contact our sales team.`;
    } else {
      response = `For pricing information, please visit ${domain}/pricing or contact our sales team for a customized quote based on your specific needs.`;
    }
  }
  else if (searchStrategy.intent === 'contact') {
    const keywords = ['contact', 'email', 'phone', 'address', 'reach', '@'];
    const relevantInfo = extractRelevantSentences(allContent, keywords);
    
    if (relevantInfo.length > 0) {
      response = `Here's how you can reach ${companyName}:\n\n${relevantInfo}\n\nYou can also visit ${domain}/contact for more contact options.`;
    } else {
      response = `You can reach ${companyName} through their website at ${domain}/contact. They'll be happy to assist you with any questions.`;
    }
  }
  else if (searchStrategy.intent === 'about') {
    const keywords = ['about', 'founded', 'mission', 'vision', 'team', 'company', 'who we are'];
    const relevantInfo = extractRelevantSentences(allContent, keywords);
    
    if (relevantInfo.length > 0) {
      response = `Here's information about ${companyName}:\n\n${relevantInfo}\n\nLearn more at ${domain}/about`;
    } else {
      response = `${companyName} is dedicated to providing quality services. Visit ${domain}/about to learn more about the company, team, and mission.`;
    }
  }
  else {
    // General response - try to find relevant info based on the message
    const messageWords = message.toLowerCase().split(' ').filter(w => w.length > 3);
    const relevantInfo = extractRelevantSentences(allContent, messageWords);
    
    if (relevantInfo.length > 0) {
      response = `Based on your question about "${message}", here's what I found:\n\n${relevantInfo}\n\nIs there anything specific you'd like to know more about?`;
    } else {
      response = `I understand you're asking about "${message}". While I couldn't find specific information about that on the website, ${companyName} offers various services and solutions. You can:\n\n• Visit ${domain} for more information\n• Check specific sections like services, products, or about us\n• Contact them directly for personalized assistance\n\nHow else can I help you today?`;
    }
  }
  
  return response;
}

/**
 * Extract relevant sentences from content based on keywords
 */
function extractRelevantSentences(content: string, keywords: string[]): string {
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
  const relevant: string[] = [];
  
  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase();
    for (const keyword of keywords) {
      if (lowerSentence.includes(keyword.toLowerCase())) {
        // Clean up the sentence
        const cleaned = sentence
          .trim()
          .replace(/\s+/g, ' ')
          .replace(/^[^a-zA-Z0-9]+/, '');
        
        if (cleaned.length > 20 && cleaned.length < 200 && !relevant.includes(cleaned)) {
          relevant.push(cleaned);
          break;
        }
      }
    }
    
    // Limit to 3 most relevant sentences
    if (relevant.length >= 3) break;
  }
  
  return relevant.length > 0 ? relevant.join('\n\n') : '';
}