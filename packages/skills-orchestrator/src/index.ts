/**
 * Skills Orchestrator
 * Central system for managing and executing skills
 * IMPORTANT: All external calls MUST go through OrchestratorAgent
 */

// ============================================
// ORCHESTRATOR AGENT - PRIMARY INTERFACE
// ============================================
export { OrchestratorAgent } from './core/OrchestratorAgent';
export type {
  OrchestrationRequest,
  OrchestrationResult,
  WorkflowDefinition,
  WorkflowStep
} from './core/OrchestratorAgent';

// ============================================
// MANAGEMENT AGENTS
// ============================================
export { FinanceAgent } from './agents/FinanceAgent';
export { OperationsAgent } from './agents/OperationsAgent';
export { InfrastructureAgent } from './agents/InfrastructureAgent';
export { SecurityAgent } from './agents/SecurityAgent';
export { ComplianceAgent } from './agents/ComplianceAgent';
export { IntegrationAgent } from './agents/IntegrationAgent';
export { AnalyticsAgent } from './agents/AnalyticsAgent';
export { CommunicationsAgent } from './agents/CommunicationsAgent';
export { ManagementTeam } from './agents/ManagementTeam';
export type { ManagementRequest, ManagementDecision, ManagementResult } from './agents/ManagementTeam';

// ============================================
// INTERNAL COMPONENTS (Not for external use)
// ============================================
export { BaseSkill } from './skills/BaseSkill';
export { SkillsRegistry } from './skills/registry';
export { SkillResult, SkillParams, SkillCategory } from './types';
export { SkillFactory } from './skills/SkillFactory';
export type { SkillDefinition } from './skills/SkillFactory';

// ============================================
// CHATBOT COMPONENTS
// ============================================
export { SkillRouter } from './chatbot/SkillRouter';
export type { RoutingDecision, SkillConfig } from './chatbot/SkillRouter';
export { ConversationContextManager } from './chatbot/ConversationContextManager';
export type { 
  ConversationContext, 
  ConversationTurn,
  EntityInfo,
  SentimentTrend,
  IntentChain,
  ConversationMemory,
  UserPreferences
} from './chatbot/ConversationContextManager';

// ============================================
// SKILL IMPLEMENTATIONS
// ============================================
export { SearchStrategySkill } from './skills/impl/SearchStrategySkill';
export { ResponseCreatorSkill } from './skills/impl/ResponseCreatorSkill';
export { WebScraperSkill } from './skills/impl/WebScraperSkill';