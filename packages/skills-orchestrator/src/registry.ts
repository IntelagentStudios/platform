/**
 * Skills Registry
 * Manages registration and discovery of skills
 */

import { BaseSkill } from './skills/BaseSkill';
import { SkillCategory } from './types';

export class SkillRegistry {
  private static instance: SkillRegistry;
  private skills: Map<string, BaseSkill> = new Map();
  private categoryIndex: Map<SkillCategory, Set<string>> = new Map();
  
  private constructor() {
    // Initialize category index
    Object.values(SkillCategory).forEach(category => {
      this.categoryIndex.set(category as SkillCategory, new Set());
    });
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(): SkillRegistry {
    if (!SkillRegistry.instance) {
      SkillRegistry.instance = new SkillRegistry();
    }
    return SkillRegistry.instance;
  }
  
  /**
   * Register a skill
   */
  register(skill: BaseSkill): void {
    const { id, category } = skill.metadata;
    
    if (this.skills.has(id)) {
      console.warn(`Skill with id '${id}' is already registered. Overwriting.`);
    }
    
    this.skills.set(id, skill);
    this.categoryIndex.get(category)?.add(id);
    
    console.log(`Registered skill: ${skill.metadata.name} (${id})`);
  }
  
  /**
   * Unregister a skill
   */
  unregister(skillId: string): boolean {
    const skill = this.skills.get(skillId);
    if (!skill) {
      return false;
    }
    
    this.skills.delete(skillId);
    this.categoryIndex.get(skill.metadata.category)?.delete(skillId);
    
    console.log(`Unregistered skill: ${skillId}`);
    return true;
  }
  
  /**
   * Get a skill by ID
   */
  getSkill(id: string): BaseSkill | undefined {
    return this.skills.get(id);
  }
  
  /**
   * Get all registered skills
   */
  getAllSkills(): BaseSkill[] {
    return Array.from(this.skills.values());
  }
  
  /**
   * Get skills by category
   */
  getSkillsByCategory(category: SkillCategory): BaseSkill[] {
    const skillIds = this.categoryIndex.get(category) || new Set();
    return Array.from(skillIds)
      .map(id => this.skills.get(id))
      .filter(skill => skill !== undefined) as BaseSkill[];
  }
  
  /**
   * Search skills by name or tags
   */
  searchSkills(query: string): BaseSkill[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllSkills().filter(skill => {
      const { name, description, tags = [] } = skill.metadata;
      return (
        name.toLowerCase().includes(lowerQuery) ||
        description.toLowerCase().includes(lowerQuery) ||
        tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    });
  }
  
  /**
   * Check if a skill is registered
   */
  hasSkill(id: string): boolean {
    return this.skills.has(id);
  }
  
  /**
   * Get registry statistics
   */
  getStats(): {
    totalSkills: number;
    byCategory: { [key: string]: number };
  } {
    const byCategory: { [key: string]: number } = {};
    
    this.categoryIndex.forEach((skillIds, category) => {
      byCategory[category] = skillIds.size;
    });
    
    return {
      totalSkills: this.skills.size,
      byCategory
    };
  }
  
  /**
   * Clear all registered skills
   */
  clear(): void {
    this.skills.clear();
    this.categoryIndex.forEach(set => set.clear());
    console.log('Cleared all registered skills');
  }
}