/**
 * Advanced Conversation Context Manager
 * Manages multi-turn conversations with memory and context awareness
 */

import { Redis } from 'ioredis';

export interface ConversationContext {
  sessionId: string;
  productKey: string;
  userId?: string;
  startTime: Date;
  lastActivity: Date;
  turns: ConversationTurn[];
  entities: Map<string, EntityInfo>;
  topics: string[];
  sentiment: SentimentTrend;
  intent: IntentChain;
  memory: ConversationMemory;
  preferences: UserPreferences;
  metadata: Record<string, any>;
}

export interface ConversationTurn {
  id: string;
  timestamp: Date;
  userMessage: string;
  botResponse: string;
  intent: string;
  entities: string[];
  sentiment: string;
  skillsUsed: string[];
  confidence: number;
  responseTime: number;
}

export interface EntityInfo {
  value: string;
  type: 'person' | 'location' | 'date' | 'number' | 'email' | 'phone' | 'product' | 'custom';
  confidence: number;
  firstMentioned: Date;
  lastMentioned: Date;
  frequency: number;
  context: string[];
}

export interface SentimentTrend {
  current: 'positive' | 'neutral' | 'negative';
  history: Array<{ sentiment: string; timestamp: Date }>;
  overall: number; // -1 to 1
  improving: boolean;
}

export interface IntentChain {
  current: string;
  previous: string[];
  predicted: string[];
  patterns: Map<string, number>;
}

export interface ConversationMemory {
  shortTerm: MemoryItem[];
  longTerm: MemoryItem[];
  facts: Map<string, FactItem>;
  preferences: Map<string, any>;
}

export interface MemoryItem {
  id: string;
  content: string;
  timestamp: Date;
  importance: number;
  category: string;
  ttl?: number; // Time to live in seconds
}

export interface FactItem {
  fact: string;
  confidence: number;
  source: string;
  timestamp: Date;
  verified: boolean;
}

export interface UserPreferences {
  communicationStyle: 'formal' | 'casual' | 'technical';
  responseLength: 'brief' | 'detailed' | 'moderate';
  preferredChannels: string[];
  language: string;
  timezone: string;
  customSettings: Map<string, any>;
}

export class ConversationContextManager {
  private static instance: ConversationContextManager;
  private redis: Redis | null = null;
  private memoryCache = new Map<string, ConversationContext>();
  private readonly CONTEXT_TTL = 3600; // 1 hour in seconds
  private readonly MAX_TURNS = 50;
  private readonly MAX_SHORT_TERM_MEMORY = 10;
  private readonly MAX_LONG_TERM_MEMORY = 100;
  
  private constructor() {
    this.initializeRedis();
  }
  
  private initializeRedis(): void {
    try {
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL);
        console.log('Redis connected for conversation context');
      } else {
        console.log('Redis URL not configured, using in-memory cache');
      }
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      console.log('Falling back to in-memory cache');
    }
  }
  
  public static getInstance(): ConversationContextManager {
    if (!ConversationContextManager.instance) {
      ConversationContextManager.instance = new ConversationContextManager();
    }
    return ConversationContextManager.instance;
  }
  
  /**
   * Get or create conversation context
   */
  public async getContext(sessionId: string, productKey: string): Promise<ConversationContext> {
    // Try cache first
    if (this.memoryCache.has(sessionId)) {
      const context = this.memoryCache.get(sessionId)!;
      context.lastActivity = new Date();
      return context;
    }
    
    // Try Redis if available
    if (this.redis) {
      try {
        const stored = await this.redis.get(`context:${sessionId}`);
        if (stored) {
          const context = this.deserializeContext(JSON.parse(stored));
          context.lastActivity = new Date();
          this.memoryCache.set(sessionId, context);
          return context;
        }
      } catch (error) {
        console.error('Failed to get context from Redis:', error);
      }
    }
    
    // Create new context
    return this.createNewContext(sessionId, productKey);
  }
  
  /**
   * Create a new conversation context
   */
  private createNewContext(sessionId: string, productKey: string): ConversationContext {
    const context: ConversationContext = {
      sessionId,
      productKey,
      startTime: new Date(),
      lastActivity: new Date(),
      turns: [],
      entities: new Map(),
      topics: [],
      sentiment: {
        current: 'neutral',
        history: [],
        overall: 0,
        improving: false
      },
      intent: {
        current: 'general',
        previous: [],
        predicted: [],
        patterns: new Map()
      },
      memory: {
        shortTerm: [],
        longTerm: [],
        facts: new Map(),
        preferences: new Map()
      },
      preferences: {
        communicationStyle: 'casual',
        responseLength: 'moderate',
        preferredChannels: ['web'],
        language: 'en',
        timezone: 'UTC',
        customSettings: new Map()
      },
      metadata: {}
    };
    
    this.memoryCache.set(sessionId, context);
    return context;
  }
  
  /**
   * Add a conversation turn
   */
  public async addTurn(
    sessionId: string,
    turn: Omit<ConversationTurn, 'id' | 'timestamp'>
  ): Promise<ConversationContext> {
    const context = await this.getContext(sessionId, '');
    
    const newTurn: ConversationTurn = {
      ...turn,
      id: `turn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    
    // Add turn (maintain max turns)
    context.turns.push(newTurn);
    if (context.turns.length > this.MAX_TURNS) {
      // Move oldest turns to long-term memory
      const oldTurns = context.turns.splice(0, context.turns.length - this.MAX_TURNS);
      this.archiveTurns(context, oldTurns);
    }
    
    // Update entities
    this.updateEntities(context, turn.entities, turn.userMessage);
    
    // Update sentiment
    this.updateSentiment(context, turn.sentiment);
    
    // Update intent chain
    this.updateIntentChain(context, turn.intent);
    
    // Extract and store facts
    this.extractFacts(context, turn.userMessage, turn.botResponse);
    
    // Update memory
    this.updateMemory(context, newTurn);
    
    // Save context
    await this.saveContext(context);
    
    return context;
  }
  
  /**
   * Get conversation summary
   */
  public getSummary(context: ConversationContext): string {
    const recentTurns = context.turns.slice(-5);
    const topics = [...new Set(context.topics)].join(', ');
    const mainIntent = this.getMostFrequentIntent(context);
    
    let summary = `Conversation started ${this.getTimeDiff(context.startTime)}. `;
    summary += `Main topics: ${topics || 'general discussion'}. `;
    summary += `User intent: ${mainIntent}. `;
    summary += `Sentiment: ${context.sentiment.current}. `;
    summary += `${context.turns.length} exchanges so far.`;
    
    return summary;
  }
  
  /**
   * Get relevant context for response generation
   */
  public getRelevantContext(context: ConversationContext, currentMessage: string): any {
    return {
      recentTurns: context.turns.slice(-3),
      entities: Array.from(context.entities.entries()).map(([key, value]) => ({
        name: key,
        ...value
      })),
      facts: Array.from(context.memory.facts.entries()).map(([key, value]) => ({
        key,
        ...value
      })),
      preferences: context.preferences,
      sentiment: context.sentiment.current,
      intentHistory: context.intent.previous.slice(-3),
      topics: context.topics.slice(-5),
      importantMemory: this.getImportantMemory(context)
    };
  }
  
  /**
   * Predict next user intent
   */
  public predictNextIntent(context: ConversationContext): string[] {
    const predictions = [];
    const patterns = context.intent.patterns;
    
    // Based on patterns
    if (patterns.size > 0) {
      const sorted = Array.from(patterns.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      predictions.push(...sorted.map(([intent]) => intent));
    }
    
    // Based on current intent
    const intentFlows = {
      'purchase': ['payment', 'shipping', 'confirmation'],
      'support': ['troubleshooting', 'escalation', 'resolution'],
      'information': ['details', 'comparison', 'decision'],
      'account': ['update', 'security', 'preferences']
    };
    
    if (intentFlows[context.intent.current]) {
      predictions.push(...intentFlows[context.intent.current]);
    }
    
    return [...new Set(predictions)].slice(0, 3);
  }
  
  /**
   * Check if context indicates conversation end
   */
  public isConversationEnding(context: ConversationContext): boolean {
    const lastTurn = context.turns[context.turns.length - 1];
    if (!lastTurn) return false;
    
    const endingPhrases = [
      'bye', 'goodbye', 'thanks', 'thank you', 'done', 
      'finished', 'that\'s all', 'nothing else'
    ];
    
    const userMessage = lastTurn.userMessage.toLowerCase();
    return endingPhrases.some(phrase => userMessage.includes(phrase));
  }
  
  /**
   * Get personalized greeting based on context
   */
  public getPersonalizedGreeting(context: ConversationContext): string {
    const timeOfDay = this.getTimeOfDay();
    const returning = context.turns.length > 0;
    const name = context.entities.get('userName');
    
    let greeting = '';
    
    if (returning) {
      greeting = `Welcome back${name ? ` ${name.value}` : ''}! `;
      greeting += `I see we were discussing ${context.topics[context.topics.length - 1] || 'your query'}. `;
      greeting += 'How can I continue helping you?';
    } else {
      greeting = `Good ${timeOfDay}${name ? ` ${name.value}` : ''}! `;
      greeting += 'I\'m here to help you with anything you need. What can I assist you with today?';
    }
    
    return greeting;
  }
  
  /**
   * Private helper methods
   */
  
  private updateEntities(
    context: ConversationContext, 
    entities: string[], 
    message: string
  ): void {
    entities.forEach(entity => {
      if (context.entities.has(entity)) {
        const info = context.entities.get(entity)!;
        info.lastMentioned = new Date();
        info.frequency++;
        info.context.push(message.substring(0, 50));
      } else {
        context.entities.set(entity, {
          value: entity,
          type: this.detectEntityType(entity),
          confidence: 0.8,
          firstMentioned: new Date(),
          lastMentioned: new Date(),
          frequency: 1,
          context: [message.substring(0, 50)]
        });
      }
    });
    
    // Extract topics from message
    const topics = this.extractTopics(message);
    topics.forEach(topic => {
      if (!context.topics.includes(topic)) {
        context.topics.push(topic);
      }
    });
  }
  
  private updateSentiment(context: ConversationContext, sentiment: string): void {
    context.sentiment.history.push({
      sentiment,
      timestamp: new Date()
    });
    
    // Keep last 10 sentiment readings
    if (context.sentiment.history.length > 10) {
      context.sentiment.history.shift();
    }
    
    // Calculate overall sentiment
    const sentimentValues = {
      'positive': 1,
      'neutral': 0,
      'negative': -1
    };
    
    const total = context.sentiment.history.reduce(
      (sum, item) => sum + sentimentValues[item.sentiment],
      0
    );
    
    context.sentiment.overall = total / context.sentiment.history.length;
    context.sentiment.current = sentiment as any;
    
    // Check if improving
    if (context.sentiment.history.length > 2) {
      const recent = context.sentiment.history.slice(-3);
      const recentAvg = recent.reduce((sum, item) => 
        sum + sentimentValues[item.sentiment], 0) / 3;
      context.sentiment.improving = recentAvg > context.sentiment.overall;
    }
  }
  
  private updateIntentChain(context: ConversationContext, intent: string): void {
    context.intent.previous.push(context.intent.current);
    context.intent.current = intent;
    
    // Track intent patterns
    const pattern = `${context.intent.previous[context.intent.previous.length - 1]}->${intent}`;
    context.intent.patterns.set(
      pattern,
      (context.intent.patterns.get(pattern) || 0) + 1
    );
    
    // Predict next intents
    context.intent.predicted = this.predictNextIntent(context);
  }
  
  private updateMemory(context: ConversationContext, turn: ConversationTurn): void {
    // Add to short-term memory
    const memoryItem: MemoryItem = {
      id: turn.id,
      content: `User: ${turn.userMessage.substring(0, 100)}`,
      timestamp: turn.timestamp,
      importance: turn.confidence,
      category: turn.intent,
      ttl: 3600 // 1 hour
    };
    
    context.memory.shortTerm.push(memoryItem);
    
    // Maintain max short-term memory size
    if (context.memory.shortTerm.length > this.MAX_SHORT_TERM_MEMORY) {
      // Move important items to long-term memory
      const removed = context.memory.shortTerm.shift();
      if (removed && removed.importance > 0.7) {
        context.memory.longTerm.push(removed);
        
        // Maintain max long-term memory size
        if (context.memory.longTerm.length > this.MAX_LONG_TERM_MEMORY) {
          context.memory.longTerm.shift();
        }
      }
    }
  }
  
  private extractFacts(
    context: ConversationContext, 
    userMessage: string, 
    botResponse: string
  ): void {
    // Simple fact extraction (would use NLP in production)
    const factPatterns = [
      /my name is (\w+)/i,
      /i live in ([\w\s]+)/i,
      /i work at ([\w\s]+)/i,
      /my email is ([\w@.]+)/i
    ];
    
    factPatterns.forEach(pattern => {
      const match = userMessage.match(pattern);
      if (match) {
        const fact = match[0];
        const value = match[1];
        context.memory.facts.set(fact, {
          fact: value,
          confidence: 0.9,
          source: 'user',
          timestamp: new Date(),
          verified: false
        });
      }
    });
  }
  
  private archiveTurns(context: ConversationContext, turns: ConversationTurn[]): void {
    // Convert old turns to long-term memory
    turns.forEach(turn => {
      const memory: MemoryItem = {
        id: turn.id,
        content: `[${turn.timestamp.toISOString()}] ${turn.intent}: ${turn.userMessage.substring(0, 50)}`,
        timestamp: turn.timestamp,
        importance: 0.5,
        category: 'archive',
        ttl: 86400 // 24 hours
      };
      context.memory.longTerm.push(memory);
    });
  }
  
  private getImportantMemory(context: ConversationContext): MemoryItem[] {
    const allMemory = [
      ...context.memory.shortTerm,
      ...context.memory.longTerm.filter(m => m.importance > 0.7)
    ];
    
    return allMemory
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 5);
  }
  
  private detectEntityType(entity: string): EntityInfo['type'] {
    if (/@/.test(entity)) return 'email';
    if (/^\d{3}-?\d{3}-?\d{4}$/.test(entity)) return 'phone';
    if (/^\d+$/.test(entity)) return 'number';
    if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(entity)) return 'date';
    return 'custom';
  }
  
  private extractTopics(message: string): string[] {
    const topics = [];
    const topicKeywords = {
      'payment': ['pay', 'payment', 'invoice', 'bill'],
      'support': ['help', 'support', 'issue', 'problem'],
      'product': ['product', 'feature', 'service'],
      'account': ['account', 'profile', 'settings']
    };
    
    const lowerMessage = message.toLowerCase();
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        topics.push(topic);
      }
    }
    
    return topics;
  }
  
  private getMostFrequentIntent(context: ConversationContext): string {
    const intentCounts = new Map<string, number>();
    
    context.turns.forEach(turn => {
      intentCounts.set(turn.intent, (intentCounts.get(turn.intent) || 0) + 1);
    });
    
    let maxIntent = 'general';
    let maxCount = 0;
    
    intentCounts.forEach((count, intent) => {
      if (count > maxCount) {
        maxCount = count;
        maxIntent = intent;
      }
    });
    
    return maxIntent;
  }
  
  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }
  
  private getTimeDiff(start: Date): string {
    const diff = Date.now() - start.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  }
  
  /**
   * Save context to Redis
   */
  private async saveContext(context: ConversationContext): Promise<void> {
    if (this.redis) {
      try {
        const serialized = this.serializeContext(context);
        await this.redis.setex(
          `context:${context.sessionId}`,
          this.CONTEXT_TTL,
          JSON.stringify(serialized)
        );
      } catch (error) {
        console.error('Failed to save context to Redis:', error);
      }
    }
  }
  
  /**
   * Serialize context for storage
   */
  private serializeContext(context: ConversationContext): any {
    return {
      ...context,
      entities: Array.from(context.entities.entries()),
      intent: {
        ...context.intent,
        patterns: Array.from(context.intent.patterns.entries())
      },
      memory: {
        ...context.memory,
        facts: Array.from(context.memory.facts.entries()),
        preferences: Array.from(context.memory.preferences.entries())
      },
      preferences: {
        ...context.preferences,
        customSettings: Array.from(context.preferences.customSettings.entries())
      }
    };
  }
  
  /**
   * Deserialize context from storage
   */
  private deserializeContext(data: any): ConversationContext {
    return {
      ...data,
      startTime: new Date(data.startTime),
      lastActivity: new Date(data.lastActivity),
      entities: new Map(data.entities),
      turns: data.turns.map((turn: any) => ({
        ...turn,
        timestamp: new Date(turn.timestamp)
      })),
      sentiment: {
        ...data.sentiment,
        history: data.sentiment.history.map((h: any) => ({
          ...h,
          timestamp: new Date(h.timestamp)
        }))
      },
      intent: {
        ...data.intent,
        patterns: new Map(data.intent.patterns)
      },
      memory: {
        ...data.memory,
        facts: new Map(data.memory.facts),
        preferences: new Map(data.memory.preferences),
        shortTerm: data.memory.shortTerm.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })),
        longTerm: data.memory.longTerm.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }))
      },
      preferences: {
        ...data.preferences,
        customSettings: new Map(data.preferences.customSettings)
      }
    };
  }
  
  /**
   * Clear expired contexts
   */
  public async clearExpiredContexts(): Promise<number> {
    let cleared = 0;
    
    // Clear from memory cache
    const now = Date.now();
    for (const [sessionId, context] of this.memoryCache.entries()) {
      const inactive = now - context.lastActivity.getTime();
      if (inactive > this.CONTEXT_TTL * 1000) {
        this.memoryCache.delete(sessionId);
        cleared++;
      }
    }
    
    return cleared;
  }
}