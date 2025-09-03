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
// INTERNAL COMPONENTS (Not for external use)
// ============================================
export { BaseSkill } from './skills/BaseSkill';
export { SkillsRegistry } from './skills/registry';
export { SkillResult, SkillParams, SkillCategory } from './types';
export { SkillFactory } from './skills/SkillFactory';
export type { SkillDefinition } from './skills/SkillFactory';