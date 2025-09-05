import { NextRequest, NextResponse } from 'next/server';
import { OrchestratorAgent } from '@intelagent/skills-orchestrator/dist/core/OrchestratorAgent';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Enhanced Chatbot API with Full Skills System Integration
 * Leverages all 310 skills for intelligent automation
 */
export async function POST(request: NextRequest) {
  const startTime = performance.now();
  
  try {
    const body = await request.json();
    const {
      message,
      sessionId,
      productKey,
      chatHistory = [],
      context = {},
      intent = null
    } = body;

    // Validate input
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get product configuration
    const productConfig = await getProductConfiguration(productKey);
    
    // Analyze user intent and determine required skills
    const analysis = await analyzeIntent(message, chatHistory, context);
    
    // Route to appropriate skills based on intent
    const skillsToExecute = determineSkillCombination(analysis, null);
    
    // Execute skills in optimized sequence
    const orchestrator = OrchestratorAgent.getInstance();
    const executionResults = await executeSkillWorkflow(
      orchestrator,
      skillsToExecute,
      {
        message,
        productKey,
        sessionId,
        context: {
          ...context,
          chatHistory,
          productConfig,
          analysis
        }
      }
    );
    
    // Generate intelligent response based on skill outputs
    const response = await generateEnhancedResponse(
      message,
      executionResults,
      analysis,
      productConfig
    );
    
    // Store conversation with enhanced metadata
    await storeEnhancedConversation({
      productKey,
      sessionId,
      userMessage: message,
      botResponse: response.text,
      metadata: {
        intent: analysis.intent,
        confidence: analysis.confidence,
        skillsUsed: skillsToExecute.map(s => s.id),
        executionTime: performance.now() - startTime,
        context: response.context,
        suggestions: response.suggestions,
        actions: response.actions
      }
    });
    
    return NextResponse.json({
      response: response.text,
      suggestions: response.suggestions,
      actions: response.actions,
      context: response.context,
      metadata: {
        processingTime: `${Math.round(performance.now() - startTime)}ms`,
        skillsUsed: skillsToExecute.length,
        confidence: analysis.confidence
      }
    }, {
      headers: {
        'X-Response-Time': String(Math.round(performance.now() - startTime)),
        'X-Skills-Used': String(skillsToExecute.length),
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('Enhanced chatbot error:', error);
    return NextResponse.json({
      error: 'Failed to process message',
      message: error.message
    }, { status: 500 });
  }
}

/**
 * Analyze user intent using AI and pattern matching
 */
async function analyzeIntent(message: string, history: any[], context: any) {
  const intents = {
    // Financial intents
    payment: /pay|invoice|bill|charge|refund|subscription/i,
    pricing: /price|cost|fee|quote|estimate/i,
    
    // Operational intents
    scheduling: /schedule|appointment|meeting|calendar|book/i,
    workflow: /automate|workflow|process|task/i,
    data: /data|report|analytics|metrics|export/i,
    
    // Support intents
    help: /help|support|issue|problem|error|broken/i,
    information: /what|how|why|when|where|explain|tell/i,
    
    // Integration intents
    integration: /connect|integrate|api|webhook|sync/i,
    
    // Security intents
    security: /secure|password|auth|login|permission/i,
    
    // Communication intents
    notification: /notify|alert|remind|email|sms/i,
    
    // E-commerce intents
    shopping: /buy|purchase|order|cart|checkout/i,
    product: /product|item|service|feature/i,
    
    // Analytics intents
    analytics: /analyze|insight|trend|pattern|forecast/i
  };
  
  // Determine primary intent
  let detectedIntent = 'general';
  let confidence = 0.5;
  
  for (const [intent, pattern] of Object.entries(intents)) {
    if (pattern.test(message)) {
      detectedIntent = intent;
      confidence = 0.8;
      break;
    }
  }
  
  // Enhance with context analysis
  if (history.length > 0) {
    // Check conversation context for better intent understanding
    const recentContext = history.slice(-3).map(h => h.message).join(' ');
    if (recentContext.includes(detectedIntent)) {
      confidence = Math.min(confidence + 0.1, 1.0);
    }
  }
  
  // Extract entities (simplified - would use NLP in production)
  const entities = extractEntities(message);
  
  return {
    intent: detectedIntent,
    confidence,
    entities,
    sentiment: analyzeSentiment(message),
    urgency: detectUrgency(message),
    language: 'en', // Would detect language in production
    topics: extractTopics(message)
  };
}

/**
 * Determine which skills to execute based on intent
 */
function determineSkillCombination(analysis: any, skillsMatrix: any) {
  const skillSets = {
    payment: [
      { id: 'payment_processor', priority: 1 },
      { id: 'invoice_generator', priority: 2 },
      { id: 'notification_hub', priority: 3 }
    ],
    scheduling: [
      { id: 'calendar_scheduler', priority: 1 },
      { id: 'email_sender', priority: 2 },
      { id: 'reminder_system', priority: 3 }
    ],
    workflow: [
      { id: 'workflow_engine', priority: 1 },
      { id: 'task_scheduler', priority: 2 },
      { id: 'approval_workflow', priority: 3 }
    ],
    data: [
      { id: 'data_aggregator', priority: 1 },
      { id: 'report_generator', priority: 2 },
      { id: 'pdf_generator', priority: 3 }
    ],
    integration: [
      { id: 'api_connector', priority: 1 },
      { id: 'webhook_handler', priority: 2 },
      { id: 'data_sync', priority: 3 }
    ],
    analytics: [
      { id: 'analytics_engine', priority: 1 },
      { id: 'predictive_model', priority: 2 },
      { id: 'dashboard_builder', priority: 3 }
    ],
    security: [
      { id: 'auth_manager', priority: 1 },
      { id: 'encryption_tool', priority: 2 },
      { id: 'audit_logger', priority: 3 }
    ],
    notification: [
      { id: 'notification_hub', priority: 1 },
      { id: 'email_composer', priority: 2 },
      { id: 'sms_gateway', priority: 3 }
    ],
    general: [
      { id: 'nlp_processor', priority: 1 },
      { id: 'response_generator', priority: 2 }
    ]
  };
  
  // Get relevant skills for the intent
  const relevantSkills = skillSets[analysis.intent] || skillSets.general;
  
  // Add conditional skills based on entities
  if (analysis.entities.includes('urgent')) {
    relevantSkills.push({ id: 'priority_handler', priority: 0 });
  }
  
  if (analysis.sentiment === 'negative') {
    relevantSkills.push({ id: 'escalation_manager', priority: 0 });
  }
  
  // Sort by priority and return
  return relevantSkills.sort((a, b) => a.priority - b.priority);
}

/**
 * Execute skills workflow with proper orchestration
 */
async function executeSkillWorkflow(
  orchestrator: OrchestratorAgent,
  skills: any[],
  params: any
) {
  const results = {};
  
  // Execute skills in parallel where possible
  const parallelGroups = groupSkillsByDependency(skills);
  
  for (const group of parallelGroups) {
    const groupPromises = group.map(async (skill) => {
      try {
        // Use the execute method with proper parameters
        const result = await orchestrator.execute({
          skillId: skill.id,
          params: {
            ...params.context,
            message: params.message,
            previousResults: results
          },
          context: {
            userId: params.sessionId || 'chatbot-user',
            licenseKey: params.productKey || 'chatbot',
            sessionId: params.sessionId,
            metadata: {
              source: 'chatbot',
              productKey: params.productKey
            }
          }
        });
        
        results[skill.id] = result;
        return { skillId: skill.id, success: true, result };
      } catch (error) {
        console.error(`Skill ${skill.id} failed:`, error);
        return { skillId: skill.id, success: false, error: error.message };
      }
    });
    
    await Promise.all(groupPromises);
  }
  
  return results;
}

/**
 * Generate enhanced response with context and actions
 */
async function generateEnhancedResponse(
  message: string,
  executionResults: any,
  analysis: any,
  config: any
) {
  // Build response based on skill outputs
  let responseText = '';
  const suggestions = [];
  const actions = [];
  const context = {};
  
  // Process skill results
  for (const [skillId, result] of Object.entries(executionResults)) {
    if (result && typeof result === 'object' && 'output' in result) {
      const output = result.output as any;
      
      // Aggregate response text
      if (output?.message) {
        responseText += output.message + ' ';
      }
      
      // Collect suggestions
      if (output?.suggestions) {
        suggestions.push(...output.suggestions);
      }
      
      // Collect actionable items
      if (output?.actions) {
        actions.push(...output.actions);
      }
      
      // Update context
      if (output?.context) {
        Object.assign(context, output.context);
      }
    }
  }
  
  // If no response generated, create a default one
  if (!responseText) {
    responseText = generateDefaultResponse(analysis.intent, message);
  }
  
  // Add personalization based on config
  if (config?.preferences?.tone) {
    responseText = adjustTone(responseText, config.preferences.tone);
  }
  
  // Add follow-up suggestions based on intent
  if (suggestions.length === 0) {
    suggestions.push(...generateSuggestions(analysis.intent));
  }
  
  return {
    text: responseText.trim(),
    suggestions: suggestions.slice(0, 3), // Limit to 3 suggestions
    actions: actions.slice(0, 5), // Limit to 5 actions
    context
  };
}

/**
 * Helper functions
 */

function extractEntities(message: string): string[] {
  const entities = [];
  
  // Extract email addresses
  const emailMatch = message.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
  if (emailMatch) entities.push(...emailMatch);
  
  // Extract phone numbers
  const phoneMatch = message.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g);
  if (phoneMatch) entities.push(...phoneMatch);
  
  // Extract URLs
  const urlMatch = message.match(/https?:\/\/[^\s]+/g);
  if (urlMatch) entities.push(...urlMatch);
  
  // Extract dates
  const dateMatch = message.match(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g);
  if (dateMatch) entities.push(...dateMatch);
  
  // Extract urgency indicators
  if (/urgent|asap|immediately|now/i.test(message)) {
    entities.push('urgent');
  }
  
  return entities;
}

function analyzeSentiment(message: string): string {
  const positive = /good|great|excellent|happy|thanks|appreciate|love/i;
  const negative = /bad|terrible|awful|hate|angry|frustrated|disappointed/i;
  
  if (negative.test(message)) return 'negative';
  if (positive.test(message)) return 'positive';
  return 'neutral';
}

function detectUrgency(message: string): 'high' | 'medium' | 'low' {
  if (/urgent|asap|immediately|emergency|critical/i.test(message)) {
    return 'high';
  }
  if (/soon|quick|fast|today/i.test(message)) {
    return 'medium';
  }
  return 'low';
}

function extractTopics(message: string): string[] {
  const topics = [];
  const topicPatterns = {
    billing: /bill|invoice|payment|charge/i,
    support: /help|support|issue|problem/i,
    product: /product|feature|service/i,
    account: /account|profile|settings/i,
    technical: /api|integration|webhook|code/i
  };
  
  for (const [topic, pattern] of Object.entries(topicPatterns)) {
    if (pattern.test(message)) {
      topics.push(topic);
    }
  }
  
  return topics;
}

function groupSkillsByDependency(skills: any[]): any[][] {
  // Simple grouping - in production would analyze actual dependencies
  const groups = [];
  let currentGroup = [];
  
  for (const skill of skills) {
    if (skill.priority === 0) {
      // High priority skills run first
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
        currentGroup = [];
      }
      groups.push([skill]);
    } else if (currentGroup.length < 3) {
      // Group up to 3 skills for parallel execution
      currentGroup.push(skill);
    } else {
      groups.push(currentGroup);
      currentGroup = [skill];
    }
  }
  
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }
  
  return groups;
}

function generateDefaultResponse(intent: string, message: string): string {
  const responses = {
    payment: "I'll help you with payment-related queries. Let me check your account details.",
    scheduling: "I can assist with scheduling. What would you like to schedule?",
    workflow: "I'll help you set up automation workflows. What process would you like to automate?",
    data: "I can generate reports and analyze data for you. What information do you need?",
    integration: "I'll help you integrate with external services. Which service would you like to connect?",
    analytics: "I can provide insights and analytics. What metrics are you interested in?",
    security: "I'll help with security-related matters. What security concern do you have?",
    notification: "I can set up notifications for you. What would you like to be notified about?",
    general: "I'm here to help! Could you provide more details about what you need?"
  };
  
  return responses[intent] || responses.general;
}

function adjustTone(text: string, tone: string): string {
  // Simple tone adjustment - would use NLG in production
  switch (tone) {
    case 'formal':
      return text.replace(/Hi|Hey/g, 'Greetings')
                 .replace(/thanks/gi, 'thank you')
                 .replace(/yeah/gi, 'yes');
    case 'casual':
      return text.replace(/Greetings/g, 'Hey')
                 .replace(/thank you/gi, 'thanks');
    default:
      return text;
  }
}

function generateSuggestions(intent: string): string[] {
  const suggestions = {
    payment: [
      "View recent transactions",
      "Update payment method",
      "Download invoice"
    ],
    scheduling: [
      "View calendar",
      "Book appointment",
      "Set reminder"
    ],
    workflow: [
      "Create automation",
      "View active workflows",
      "Check task status"
    ],
    data: [
      "Generate report",
      "Export data",
      "View analytics"
    ],
    general: [
      "Tell me more",
      "Get help",
      "View documentation"
    ]
  };
  
  return suggestions[intent] || suggestions.general;
}

async function getProductConfiguration(productKey: string) {
  if (!productKey) return null;
  
  try {
    const config = await prisma.product_keys.findFirst({
      where: { 
        product_key: productKey,
        status: 'active'
      },
      include: {
        licenses: true
      }
    });
    
    return config;
  } catch (error) {
    console.error('Failed to get product config:', error);
    return null;
  }
}

async function storeEnhancedConversation(data: any) {
  try {
    await prisma.chatbot_logs.create({
      data: {
        product_key: data.productKey || 'anonymous',
        session_id: data.sessionId,
        customer_message: data.userMessage,
        chatbot_response: data.botResponse,
        intent_detected: JSON.stringify({
          enhanced: true,
          skills: data.metadata?.skillsUsed,
          executionTime: data.metadata?.executionTime
        }).slice(0, 255),
        conversation_id: data.sessionId,
        domain: 'intelagentstudios.com',
        user_id: 'enhanced_user',
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to store conversation:', error);
  }
}