import { BaseSkill } from '../BaseSkill';
import { SkillParams, SkillResult, SkillCategory } from '../../types';

interface SearchStrategy {
  search_path: string;
  intent: string;
  action: string;
  expected_content: string;
  custom_knowledge_summary?: string;
  knowledge_gaps?: string;
  fallback_paths: string[];
  conversation_context: string;
}

export class SearchStrategySkill extends BaseSkill {
  metadata = {
    id: 'search_strategy',
    name: 'Search Strategy Skill',
    description: 'Intelligent search strategist that selects the best pages to scrape based on user queries',
    category: SkillCategory.AI_POWERED,
    version: '1.0.0',
    author: 'Intelagent',
    tags: ['search', 'strategy', 'ai', 'chatbot']
  };

  private readonly siteStructure = {
    '/products': 'Product catalog and solutions',
    '/services': 'Consultancy and professional services',
    '/contact': 'Contact information and hours',
    '/about': 'Company information and credibility',
    '/products/chatbot': 'Chatbot product details',
    '/services/consultancy': 'Consulting services details',
    '/products/sales-agent': 'Sales agent automation tool'
  };

  private readonly industryRouting = {
    recruitment: {
      primary: '/products',
      secondary: ['/products/sales-agent', '/services'],
      focus: 'automation tools, candidate outreach, custom workflows'
    },
    ecommerce: {
      primary: '/products/chatbot',
      secondary: ['/services/consultancy'],
      focus: 'customer service, integration'
    },
    professional_services: {
      primary: '/products',
      secondary: ['/about', '/contact'],
      focus: 'all tools, credibility, consultation'
    }
  };

  async execute(params: SkillParams): Promise<SkillResult> {
    try {
      const { 
        customer_message, 
        custom_knowledge,
        chat_history,
        session_id 
      } = params;

      if (!customer_message) {
        throw new Error('Customer message is required');
      }

      // Detect industry and intent
      const industry = this.detectIndustry(customer_message);
      const intent = this.detectIntent(customer_message);
      
      // Build search strategy
      const strategy = this.buildSearchStrategy(
        customer_message,
        intent,
        industry,
        custom_knowledge,
        chat_history
      );

      return {
        success: true,
        data: {
          search_plan: strategy,
          site_structure: this.siteStructure,
          suggested_links: this.getSuggestedLinks(intent, industry),
          conversation_context: this.buildConversationContext(chat_history, customer_message)
        },
        metadata: {
          intent,
          industry,
          session_id,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to generate search strategy',
        data: {
          search_plan: {
            search_path: '/',
            intent: 'general',
            action: 'scrape_full_page',
            expected_content: 'General information',
            fallback_paths: ['/products', '/services'],
            conversation_context: 'Error - falling back to home'
          }
        }
      };
    }
  }

  private detectIndustry(message: string): string | null {
    const lowercaseMessage = message.toLowerCase();
    
    if (lowercaseMessage.includes('recruitment') || 
        lowercaseMessage.includes('hiring') || 
        lowercaseMessage.includes('candidate')) {
      return 'recruitment';
    }
    
    if (lowercaseMessage.includes('ecommerce') || 
        lowercaseMessage.includes('online store') || 
        lowercaseMessage.includes('shop')) {
      return 'ecommerce';
    }
    
    if (lowercaseMessage.includes('professional') || 
        lowercaseMessage.includes('consulting') || 
        lowercaseMessage.includes('agency')) {
      return 'professional_services';
    }
    
    return null;
  }

  private detectIntent(message: string): string {
    const lowercaseMessage = message.toLowerCase();
    
    // Contact/hours intent
    if (lowercaseMessage.includes('hours') || 
        lowercaseMessage.includes('contact') || 
        lowercaseMessage.includes('phone') ||
        lowercaseMessage.includes('email')) {
      return 'contact_info';
    }
    
    // Pricing intent
    if (lowercaseMessage.includes('price') || 
        lowercaseMessage.includes('cost') || 
        lowercaseMessage.includes('how much')) {
      return 'pricing';
    }
    
    // Product inquiry
    if (lowercaseMessage.includes('product') || 
        lowercaseMessage.includes('solution') || 
        lowercaseMessage.includes('offer')) {
      return 'product_inquiry';
    }
    
    // Demo/trial intent
    if (lowercaseMessage.includes('demo') || 
        lowercaseMessage.includes('trial') || 
        lowercaseMessage.includes('try')) {
      return 'demo_request';
    }
    
    // Support intent
    if (lowercaseMessage.includes('help') || 
        lowercaseMessage.includes('support') || 
        lowercaseMessage.includes('problem')) {
      return 'support';
    }
    
    // Industry-specific solution
    if (lowercaseMessage.includes('recommend') || 
        lowercaseMessage.includes('suggest') || 
        lowercaseMessage.includes('what would')) {
      return 'recommendation';
    }
    
    return 'general_inquiry';
  }

  private buildSearchStrategy(
    message: string,
    intent: string,
    industry: string | null,
    customKnowledge?: string,
    chatHistory?: string
  ): SearchStrategy {
    let searchPath = '/';
    let expectedContent = 'General company information';
    let fallbackPaths = ['/products', '/services'];
    
    // Intent-based routing
    switch (intent) {
      case 'contact_info':
        searchPath = '/contact';
        expectedContent = 'Contact details, hours, location';
        fallbackPaths = ['/about'];
        break;
        
      case 'pricing':
        searchPath = '/products';
        expectedContent = 'Product pricing and packages';
        fallbackPaths = ['/contact', '/services'];
        break;
        
      case 'product_inquiry':
        searchPath = '/products';
        expectedContent = 'Product catalog and features';
        fallbackPaths = ['/services', '/about'];
        break;
        
      case 'demo_request':
        searchPath = '/contact';
        expectedContent = 'Demo scheduling and contact form';
        fallbackPaths = ['/products'];
        break;
        
      case 'support':
        searchPath = '/contact';
        expectedContent = 'Support channels and resources';
        fallbackPaths = ['/about'];
        break;
        
      case 'recommendation':
        if (industry && this.industryRouting[industry]) {
          const routing = this.industryRouting[industry];
          searchPath = routing.primary;
          expectedContent = routing.focus;
          fallbackPaths = routing.secondary;
        } else {
          searchPath = '/products';
          expectedContent = 'Product recommendations';
          fallbackPaths = ['/services'];
        }
        break;
    }
    
    // Industry-specific overrides
    if (industry && this.industryRouting[industry]) {
      const routing = this.industryRouting[industry];
      if (intent === 'general_inquiry') {
        searchPath = routing.primary;
        expectedContent = routing.focus;
        fallbackPaths = routing.secondary;
      }
    }
    
    return {
      search_path: searchPath,
      intent: `${industry ? industry + '_' : ''}${intent}`,
      action: 'scrape_full_page',
      expected_content: expectedContent,
      custom_knowledge_summary: customKnowledge ? this.summarizeKnowledge(customKnowledge) : undefined,
      knowledge_gaps: customKnowledge ? 'Additional website context needed' : 'No custom knowledge available',
      fallback_paths: fallbackPaths,
      conversation_context: this.buildConversationContext(chatHistory, message)
    };
  }

  private summarizeKnowledge(knowledge: string): string {
    // Truncate and summarize custom knowledge
    if (knowledge.length > 200) {
      return knowledge.substring(0, 197) + '...';
    }
    return knowledge;
  }

  private getSuggestedLinks(intent: string, industry: string | null): Record<string, string> {
    const links: Record<string, string> = {};
    
    // Add intent-based links
    switch (intent) {
      case 'contact_info':
        links.contact = '/contact';
        links.about = '/about';
        break;
      case 'product_inquiry':
      case 'pricing':
        links.products = '/products';
        links.chatbot = '/products/chatbot';
        links.sales_agent = '/products/sales-agent';
        break;
      case 'demo_request':
        links.schedule_demo = '/contact';
        links.products = '/products';
        break;
    }
    
    // Add industry-based links
    if (industry === 'recruitment') {
      links.sales_agent = '/products/sales-agent';
      links.automation = '/products';
    } else if (industry === 'ecommerce') {
      links.chatbot = '/products/chatbot';
      links.consultancy = '/services/consultancy';
    }
    
    return links;
  }

  private buildConversationContext(chatHistory?: string, currentMessage?: string): string {
    const previousTopic = this.extractPreviousTopic(chatHistory);
    const currentTopic = currentMessage ? this.extractTopic(currentMessage) : 'unknown';
    const journeyStage = this.determineJourneyStage(chatHistory);
    
    return `Previous: ${previousTopic}. Now: ${currentTopic}. Journey stage: ${journeyStage}`;
  }

  private extractPreviousTopic(chatHistory?: string): string {
    if (!chatHistory) return 'new conversation';
    
    // Simple topic extraction from last message
    if (chatHistory.includes('product')) return 'products';
    if (chatHistory.includes('price')) return 'pricing';
    if (chatHistory.includes('contact')) return 'contact';
    
    return 'general';
  }

  private extractTopic(message: string): string {
    const intent = this.detectIntent(message);
    return intent.replace(/_/g, ' ');
  }

  private determineJourneyStage(chatHistory?: string): string {
    if (!chatHistory || chatHistory.length < 50) {
      return 'discovery';
    } else if (chatHistory.includes('price') || chatHistory.includes('demo')) {
      return 'evaluation';
    } else if (chatHistory.includes('contact') || chatHistory.includes('schedule')) {
      return 'decision';
    }
    
    return 'exploration';
  }

  validate(params: SkillParams): boolean {
    return !!params.customer_message;
  }
}