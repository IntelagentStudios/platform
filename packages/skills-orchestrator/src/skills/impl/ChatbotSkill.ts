/**
 * Chatbot Skill
 * AI-powered conversational interface
 */

import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillCategory } from '../../types';

export class ChatbotSkill extends BaseSkill {
  metadata = {
    id: 'chatbot',
    name: 'Chatbot',
    description: 'AI-powered conversational interface',
    category: SkillCategory.COMMUNICATION,
    version: '1.0.0',
    author: 'Intelagent',
    tags: ['chat', 'conversation', 'ai', 'nlp']
  };

  private conversationHistory: Map<string, any[]> = new Map();

  validate(params: SkillParams): boolean {
    return !!(params.message && params.sessionId);
  }

  protected async executeImpl(params: SkillParams): Promise<SkillResult> {
    try {
      const { 
        message, 
        sessionId, 
        context = {}, 
        personality = 'professional',
        maxTokens = 500 
      } = params;

      // Get or create conversation history
      if (!this.conversationHistory.has(sessionId)) {
        this.conversationHistory.set(sessionId, []);
      }
      const history = this.conversationHistory.get(sessionId)!;

      // Add user message to history
      history.push({ role: 'user', content: message, timestamp: new Date() });

      // Generate response based on personality and context
      const response = await this.generateResponse(message, history, personality, context);

      // Add bot response to history
      history.push({ role: 'assistant', content: response, timestamp: new Date() });

      // Limit history size
      if (history.length > 20) {
        history.splice(0, history.length - 20);
      }

      // Analyze conversation metrics
      const metrics = this.analyzeConversation(history);

      return {
        success: true,
        data: {
          response,
          sessionId,
          conversationLength: history.length,
          metrics,
          suggestions: this.generateSuggestions(message, context),
          sentiment: this.analyzeSentiment(message),
          intent: this.detectIntent(message)
        },
        metadata: {
          skillId: this.metadata.id,
          skillName: this.metadata.name,
          timestamp: new Date()
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        metadata: {
          skillId: this.metadata.id,
          skillName: this.metadata.name,
          timestamp: new Date()
        }
      };
    }
  }

  private async generateResponse(
    message: string, 
    history: any[], 
    personality: string, 
    context: any
  ): Promise<string> {
    const intent = this.detectIntent(message);
    
    // Generate response based on intent and personality
    switch (intent) {
      case 'greeting':
        return this.generateGreeting(personality);
      
      case 'question':
        return this.generateAnswer(message, context, personality);
      
      case 'help':
        return this.generateHelpResponse(context);
      
      case 'feedback':
        return this.generateFeedbackResponse(message, personality);
      
      case 'goodbye':
        return this.generateGoodbye(personality);
      
      default:
        return this.generateGenericResponse(message, personality);
    }
  }

  private detectIntent(message: string): string {
    const lower = message.toLowerCase();
    
    if (lower.match(/^(hi|hello|hey|greetings)/)) return 'greeting';
    if (lower.includes('?') || lower.match(/^(what|who|where|when|why|how)/)) return 'question';
    if (lower.match(/(help|assist|support|guide)/)) return 'help';
    if (lower.match(/(thank|appreciate|great|good job|excellent)/)) return 'feedback';
    if (lower.match(/(bye|goodbye|see you|talk later)/)) return 'goodbye';
    
    return 'general';
  }

  private generateGreeting(personality: string): string {
    const greetings = {
      professional: 'Hello! How may I assist you today?',
      friendly: 'Hey there! What can I help you with? 😊',
      casual: 'Hi! What\'s up?',
      formal: 'Good day. How may I be of service?'
    };
    
    return greetings[personality as keyof typeof greetings] || greetings.professional;
  }

  private generateAnswer(message: string, context: any, personality: string): string {
    // Simulate answering based on context
    const templates = {
      professional: `Based on the available information, ${this.generateFactualAnswer(message, context)}`,
      friendly: `Great question! ${this.generateFactualAnswer(message, context)} Hope that helps! 😊`,
      casual: `So, ${this.generateFactualAnswer(message, context)} Make sense?`,
      formal: `In response to your inquiry, ${this.generateFactualAnswer(message, context)}`
    };
    
    return templates[personality as keyof typeof templates] || templates.professional;
  }

  private generateFactualAnswer(message: string, context: any): string {
    // Simulate generating an answer based on context
    if (context.knowledgeBase) {
      return 'I found relevant information in our knowledge base that addresses your question.';
    }
    
    return 'I understand you\'re asking about that topic. Let me provide you with the most relevant information.';
  }

  private generateHelpResponse(context: any): string {
    const capabilities = [
      'Answer questions',
      'Provide information',
      'Assist with tasks',
      'Offer suggestions',
      'Guide you through processes'
    ];
    
    return `I'm here to help! I can:\n${capabilities.map(c => `• ${c}`).join('\n')}\n\nWhat would you like assistance with?`;
  }

  private generateFeedbackResponse(message: string, personality: string): string {
    const responses = {
      professional: 'Thank you for your feedback. I\'m glad I could help.',
      friendly: 'You\'re welcome! Happy to help anytime! 😊',
      casual: 'No problem! Glad I could help out.',
      formal: 'You are most welcome. It was my pleasure to assist you.'
    };
    
    return responses[personality as keyof typeof responses] || responses.professional;
  }

  private generateGoodbye(personality: string): string {
    const goodbyes = {
      professional: 'Goodbye! Feel free to return if you need any assistance.',
      friendly: 'Bye! Have a great day! 👋',
      casual: 'See ya! Take care!',
      formal: 'Farewell. I remain at your service should you require further assistance.'
    };
    
    return goodbyes[personality as keyof typeof goodbyes] || goodbyes.professional;
  }

  private generateGenericResponse(message: string, personality: string): string {
    const responses = {
      professional: 'I understand. Could you please provide more details so I can better assist you?',
      friendly: 'Got it! Can you tell me a bit more about what you need? 😊',
      casual: 'Okay, tell me more about that.',
      formal: 'I comprehend. Would you kindly elaborate on your request?'
    };
    
    return responses[personality as keyof typeof responses] || responses.professional;
  }

  private generateSuggestions(message: string, context: any): string[] {
    const suggestions: string[] = [];
    
    // Generate contextual suggestions
    if (message.toLowerCase().includes('help')) {
      suggestions.push('View documentation', 'Contact support', 'Browse FAQs');
    }
    
    if (message.toLowerCase().includes('how')) {
      suggestions.push('View tutorial', 'See examples', 'Read guide');
    }
    
    if (context.previousTopic) {
      suggestions.push(`Continue discussing ${context.previousTopic}`);
    }
    
    // Add general suggestions
    suggestions.push('Ask another question', 'Provide feedback');
    
    return suggestions.slice(0, 3);
  }

  private analyzeSentiment(message: string): string {
    const positive = ['good', 'great', 'excellent', 'happy', 'thanks', 'love', 'appreciate'];
    const negative = ['bad', 'poor', 'terrible', 'angry', 'frustrated', 'hate', 'problem'];
    
    const lower = message.toLowerCase();
    const positiveCount = positive.filter(word => lower.includes(word)).length;
    const negativeCount = negative.filter(word => lower.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private analyzeConversation(history: any[]): any {
    const totalMessages = history.length;
    const userMessages = history.filter(m => m.role === 'user').length;
    const botMessages = history.filter(m => m.role === 'assistant').length;
    
    // Calculate average response time (simulated)
    const avgResponseTime = Math.floor(Math.random() * 1000) + 500;
    
    // Calculate conversation duration
    const firstMessage = history[0]?.timestamp;
    const lastMessage = history[history.length - 1]?.timestamp;
    const duration = lastMessage && firstMessage 
      ? (lastMessage.getTime() - firstMessage.getTime()) / 1000 
      : 0;
    
    return {
      totalMessages,
      userMessages,
      botMessages,
      avgResponseTime,
      duration,
      turnsCount: Math.floor(totalMessages / 2)
    };
  }

  public clearSession(sessionId: string): void {
    this.conversationHistory.delete(sessionId);
  }

  public getSessionHistory(sessionId: string): any[] {
    return this.conversationHistory.get(sessionId) || [];
  }

  getConfig(): Record<string, any> {
    return {
      personalities: ['professional', 'friendly', 'casual', 'formal'],
      maxHistoryLength: 20,
      maxTokens: 500,
      supportedLanguages: ['en'],
      features: ['context-aware', 'multi-turn', 'sentiment-analysis', 'intent-detection']
    };
  }
}