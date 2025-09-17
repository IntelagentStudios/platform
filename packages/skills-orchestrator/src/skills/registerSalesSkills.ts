/**
 * Register Sales Skills
 * Registers sales-related skills with the skill registry
 */

import { SkillRegistry } from '../registry';
import { SalesOutreachSkill } from './impl/SalesOutreachSkill';
import { LeadManagementSkill } from './impl/LeadManagementSkill';

export function registerSalesSkills(): void {
  const registry = SkillRegistry.getInstance();
  
  // Register Sales Outreach Skill
  const salesOutreachSkill = new SalesOutreachSkill();
  registry.register(salesOutreachSkill);
  console.log('✅ Registered SalesOutreachSkill');
  
  // Register Lead Management Skill
  const leadManagementSkill = new LeadManagementSkill();
  registry.register(leadManagementSkill);
  console.log('✅ Registered LeadManagementSkill');
}

// Auto-register on import
if (process.env.NODE_ENV !== 'test') {
  registerSalesSkills();
}