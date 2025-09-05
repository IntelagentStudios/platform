/**
 * N8N Chatbot Skill
 * Calls the proven n8n workflow for intelligent chatbot responses
 * Maintains the efficacy of the dual-agent n8n implementation
 */

import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillCategory } from '../../types';

export class N8NChatbotSkill extends BaseSkill {
  metadata = {
    id: 'n8n_chatbot',
    name: 'N8N Intelligent Chatbot',
    description: 'Connects to proven n8n dual-agent chatbot workflow for intelligent responses',
    category: SkillCategory.COMMUNICATION,
    version: '1.0.0',
    author: 'Intelagent',
    tags: ["chatbot", "n8n", "ai", "conversation", "dual-agent", "webhook"]
  };

  validate(params: SkillParams): boolean {
    return !!(params.message || params.query);
  }

  async execute(params: SkillParams): Promise<SkillResult> {
    try {
      const { 
        message, 
        query,
        sessionId,
        productKey,
        domain,
        chatHistory = [],
        customKnowledge
      } = params;

      // Get the webhook URL from environment or params
      // Use the correct n8n instance URL
      const webhookUrl = params.webhookUrl || 
                        process.env.N8N_CHATBOT_WEBHOOK || 
                        'https://1ntelagent.up.railway.app/webhook/chatbot';  // Your working n8n instance

      // Prepare payload for n8n workflow
      const payload = {
        message: message || query,
        sessionId: sessionId || 'anonymous',
        productKey: productKey,
        domain: domain,
        chatHistory: chatHistory,
        customKnowledge: customKnowledge,
        timestamp: new Date().toISOString(),
        source: 'skills-orchestrator'
      };

      console.log(`Calling n8n chatbot webhook: ${webhookUrl}`);
      
      // Call the n8n webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'IntelagentSkills/1.0'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`N8N webhook returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Format the response to match our skill interface
      // Handle the n8n response format which uses chatbot_response
      return this.success({
        response: result.chatbot_response || result.response || result.message || result.text,
        sessionId: result.session_id || result.sessionId || sessionId,
        intent: result.intent_detected || result.intent || 'general',
        confidence: result.confidence || 0.8,
        metadata: {
          source: 'n8n-workflow',
          workflowId: result.workflowId,
          executionId: result.executionId,
          domain: result.domain || domain,
          timestamp: new Date()
        }
      });

    } catch (error: any) {
      console.error('N8N Chatbot skill error:', error);
      
      // Fallback to a basic response if n8n is unavailable
      if (error.message.includes('fetch failed') || error.message.includes('timeout')) {
        return this.success({
          response: "I'm currently unable to access full information. Please visit our website or try again in a moment.",
          sessionId: params.sessionId,
          intent: 'fallback',
          confidence: 0.3,
          metadata: {
            error: 'n8n_unavailable',
            fallback: true
          }
        });
      }
      
      return this.error(error.message);
    }
  }

  getConfig(): Record<string, any> {
    return {
      enabled: true,
      category: 'communication',
      version: '1.0.0',
      features: [
        'dual-agent-architecture',
        'website-scraping',
        'intelligent-routing',
        'context-aware',
        'multi-tenant'
      ],
      webhookUrl: process.env.N8N_CHATBOT_WEBHOOK
    };
  }
}