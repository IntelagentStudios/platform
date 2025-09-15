import { BaseSkill } from '../BaseSkill';
import { SkillParams, SkillResult, SkillCategory } from '../../types';

interface ResponseContext {
  page_content?: string;
  search_results?: any;
  custom_knowledge?: string;
  chat_history?: string;
  intent?: string;
  domain?: string;
}

export class ResponseCreatorSkill extends BaseSkill {
  metadata = {
    id: 'response_creator',
    name: 'Response Creator Skill',
    description: 'Creates concise, helpful responses with hyperlinks based on website content and context',
    category: SkillCategory.AI_POWERED,
    version: '1.0.0',
    author: 'Intelagent',
    tags: ['response', 'ai', 'chatbot', 'conversation']
  };

  private readonly responseTemplates = {
    product_inquiry: {
      template: 'We provide {specific_products}. Our <a href="/products">solutions</a> help businesses {key_benefit}. Which area interests you most?',
      maxWords: 40
    },
    pricing: {
      template: 'Our solutions start at {price} with <a href="/products">various options</a> for different needs. <a href="/contact">Contact us</a> for a custom quote. What\'s your budget range?',
      maxWords: 40
    },
    contact_info: {
      template: 'We\'re available {hours}. You can <a href="/contact">reach us here</a> or call {phone}. How can we assist you today?',
      maxWords: 35
    },
    recommendation: {
      template: 'Our <a href="{relevant_product_url}">{relevant_product}</a> addresses {industry} needs through {specific_feature}. This helps companies like yours {benefit}. What\'s your biggest challenge?',
      maxWords: 40
    },
    general: {
      template: '{direct_answer}. <a href="{relevant_link}">Learn more here</a>. {specific_question}?',
      maxWords: 35
    }
  };

  protected async executeImpl(params: SkillParams): Promise<SkillResult> {
    try {
      const { 
        customer_message,
        page_content,
        search_results,
        custom_knowledge,
        chat_history,
        intent = 'general',
        domain = 'intelagentstudios.com'
      } = params as ResponseContext & SkillParams;

      if (!customer_message) {
        throw new Error('Customer message is required');
      }

      // Generate response based on context
      const response = this.generateResponse(
        customer_message,
        page_content,
        search_results,
        custom_knowledge,
        intent,
        domain
      );

      // Ensure response is concise
      const conciseResponse = this.makeConcise(response, 40);

      // Add conversation memory
      const finalResponse = this.addConversationContext(conciseResponse, chat_history);

      return {
        success: true,
        data: {
          message: finalResponse,
          chatbot_response: finalResponse,
          intent_detected: intent,
          links_included: this.extractLinks(finalResponse),
          word_count: this.countWords(finalResponse)
        },
        metadata: {
          timestamp: new Date().toISOString(),
          domain,
          response_type: this.determineResponseType(intent)
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to generate response',
        data: {
          message: 'I apologize, but I encountered an error processing your request. Please try again.',
          chatbot_response: 'I apologize, but I encountered an error processing your request. Please try again.'
        }
      };
    }
  }

  private generateResponse(
    customerMessage: string,
    pageContent?: string,
    searchResults?: any,
    customKnowledge?: string,
    intent?: string,
    domain?: string
  ): string {
    // Priority: Custom knowledge > Page content > Default response
    
    // Extract key information from page content
    const extractedInfo = this.extractKeyInfo(pageContent);
    
    // Determine response template based on intent
    const template = this.getResponseTemplate(intent || 'general');
    
    // Build response using template and extracted information
    let response = template.template;
    
    // Replace template variables
    response = this.populateTemplate(
      response,
      customerMessage,
      extractedInfo,
      customKnowledge,
      searchResults,
      domain
    );
    
    return response;
  }

  private extractKeyInfo(pageContent?: string): Record<string, string> {
    if (!pageContent) {
      return {
        products: 'AI-powered automation solutions',
        services: 'consultancy and integration services',
        benefit: 'streamline operations and improve efficiency',
        contact: 'our contact page'
      };
    }

    const info: Record<string, string> = {};
    
    // Extract product mentions
    if (pageContent.includes('chatbot')) {
      info.products = 'intelligent chatbot solutions';
    } else if (pageContent.includes('sales')) {
      info.products = 'sales automation tools';
    } else {
      info.products = 'automation solutions';
    }
    
    // Extract benefits
    if (pageContent.includes('efficien')) {
      info.benefit = 'improve operational efficiency';
    } else if (pageContent.includes('automat')) {
      info.benefit = 'automate repetitive tasks';
    } else if (pageContent.includes('custom')) {
      info.benefit = 'provide customized solutions';
    } else {
      info.benefit = 'transform your business';
    }
    
    // Extract contact info
    const phoneMatch = pageContent.match(/\d{3}[-.]?\d{3}[-.]?\d{4}/);
    if (phoneMatch) {
      info.phone = phoneMatch[0];
    }
    
    const hoursMatch = pageContent.match(/\d{1,2}(?:am|pm)\s*-\s*\d{1,2}(?:am|pm)/i);
    if (hoursMatch) {
      info.hours = hoursMatch[0];
    }
    
    return info;
  }

  private getResponseTemplate(intent: string): { template: string; maxWords: number } {
    // Map intents to templates
    if (intent.includes('contact')) {
      return this.responseTemplates.contact_info;
    }
    if (intent.includes('pric')) {
      return this.responseTemplates.pricing;
    }
    if (intent.includes('product')) {
      return this.responseTemplates.product_inquiry;
    }
    if (intent.includes('recommend')) {
      return this.responseTemplates.recommendation;
    }
    
    return this.responseTemplates.general;
  }

  private populateTemplate(
    template: string,
    customerMessage: string,
    extractedInfo: Record<string, string>,
    customKnowledge?: string,
    searchResults?: any,
    domain?: string
  ): string {
    let response = template;
    
    // Replace common variables
    response = response.replace('{specific_products}', extractedInfo.products || 'comprehensive solutions');
    response = response.replace('{key_benefit}', extractedInfo.benefit || 'achieve their goals');
    response = response.replace('{hours}', customKnowledge?.includes('9am-6pm') ? 'Mon-Fri 9am-6pm GMT' : 'during business hours');
    response = response.replace('{phone}', extractedInfo.phone || 'through our website');
    response = response.replace('{price}', '$299/month');
    
    // Handle industry-specific replacements
    if (customerMessage.toLowerCase().includes('recruitment')) {
      response = response.replace('{industry}', 'recruitment');
      response = response.replace('{relevant_product}', 'Sales Agent');
      response = response.replace('{relevant_product_url}', '/products/sales-agent');
      response = response.replace('{specific_feature}', 'automated candidate outreach');
      response = response.replace('{benefit}', 'streamline hiring processes');
    } else if (customerMessage.toLowerCase().includes('ecommerce')) {
      response = response.replace('{industry}', 'e-commerce');
      response = response.replace('{relevant_product}', 'Chatbot');
      response = response.replace('{relevant_product_url}', '/products/chatbot');
      response = response.replace('{specific_feature}', '24/7 customer support');
      response = response.replace('{benefit}', 'improve customer satisfaction');
    } else {
      response = response.replace('{industry}', 'your industry');
      response = response.replace('{relevant_product}', 'solutions');
      response = response.replace('{relevant_product_url}', '/products');
      response = response.replace('{specific_feature}', 'intelligent automation');
      response = response.replace('{benefit}', 'increase productivity');
    }
    
    // Generic replacements
    response = response.replace('{direct_answer}', this.generateDirectAnswer(customerMessage, extractedInfo));
    response = response.replace('{relevant_link}', '/products');
    response = response.replace('{specific_question}', this.generateFollowUpQuestion(customerMessage));
    
    return response;
  }

  private generateDirectAnswer(message: string, info: Record<string, string>): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('what do you')) {
      return `We offer ${info.products || 'automation solutions'}`;
    }
    if (lowerMessage.includes('how can you help')) {
      return `We help businesses ${info.benefit || 'improve efficiency'}`;
    }
    if (lowerMessage.includes('tell me')) {
      return `Our platform provides ${info.products || 'comprehensive solutions'}`;
    }
    
    return `We specialize in ${info.products || 'business automation'}`;
  }

  private generateFollowUpQuestion(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('recruitment') || lowerMessage.includes('hiring')) {
      return 'How many candidates do you typically screen monthly';
    }
    if (lowerMessage.includes('ecommerce') || lowerMessage.includes('shop')) {
      return 'What\'s your average daily customer inquiry volume';
    }
    if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      return 'What\'s your budget range';
    }
    if (lowerMessage.includes('demo') || lowerMessage.includes('trial')) {
      return 'When would you like to schedule a demo';
    }
    
    return 'What specific challenge are you looking to solve';
  }

  private makeConcise(response: string, maxWords: number): string {
    const words = response.split(' ');
    if (words.length <= maxWords) {
      return response;
    }
    
    // Keep HTML links intact while truncating
    let truncated = '';
    let wordCount = 0;
    let inTag = false;
    
    for (const word of words) {
      if (word.includes('<a')) inTag = true;
      if (word.includes('</a>')) inTag = false;
      
      if (wordCount < maxWords || inTag) {
        truncated += word + ' ';
        if (!inTag) wordCount++;
      } else {
        break;
      }
    }
    
    // Ensure we end with a complete sentence
    if (!truncated.trim().match(/[.!?]$/)) {
      truncated = truncated.trim() + '.';
    }
    
    return truncated.trim();
  }

  private addConversationContext(response: string, chatHistory?: string): string {
    // If this is a follow-up question, adjust the response
    if (chatHistory && chatHistory.length > 100) {
      if (chatHistory.includes('price') && !response.includes('price')) {
        response = response.replace('Which area', 'Regarding pricing, which option');
      }
      if (chatHistory.includes('demo') && !response.includes('demo')) {
        response = response.replace('Learn more', 'Schedule a demo');
      }
    }
    
    return response;
  }

  private extractLinks(response: string): string[] {
    const links: string[] = [];
    const linkRegex = /<a href="([^"]+)"/g;
    let match;
    
    while ((match = linkRegex.exec(response)) !== null) {
      links.push(match[1]);
    }
    
    return links;
  }

  private countWords(text: string): number {
    // Remove HTML tags for accurate word count
    const plainText = text.replace(/<[^>]+>/g, ' ');
    return plainText.split(/\s+/).filter(word => word.length > 0).length;
  }

  private determineResponseType(intent: string): string {
    if (intent.includes('contact')) return 'contact';
    if (intent.includes('pric')) return 'pricing';
    if (intent.includes('product')) return 'product';
    if (intent.includes('recommend')) return 'recommendation';
    return 'general';
  }

  validate(params: SkillParams): boolean {
    return !!params.customer_message;
  }
}