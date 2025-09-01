/**
 * Skills Registry
 * Central registry for all skills with management capabilities
 */

import { SkillFactory, SkillDefinition } from './SkillFactory';
import { BaseSkill } from './BaseSkill';

interface SkillInstance {
  definition: SkillDefinition;
  implementation?: BaseSkill;
  status: 'available' | 'loading' | 'loaded' | 'error';
  error?: string;
  stats: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    totalDuration: number;
    lastExecuted?: Date;
  };
}

export class SkillsRegistry {
  private static instance: SkillsRegistry;
  private skills: Map<string, SkillInstance> = new Map();
  private enabledSkills: Set<string> = new Set();
  
  private constructor() {
    this.initialize();
  }
  
  static getInstance(): SkillsRegistry {
    if (!SkillsRegistry.instance) {
      SkillsRegistry.instance = new SkillsRegistry();
    }
    return SkillsRegistry.instance;
  }
  
  private initialize() {
    // Load all skill definitions from factory
    const definitions = SkillFactory.getAllSkills();
    
    definitions.forEach(definition => {
      this.skills.set(definition.id, {
        definition,
        status: 'available',
        stats: {
          totalExecutions: 0,
          successfulExecutions: 0,
          failedExecutions: 0,
          totalDuration: 0
        }
      });
      
      // Enable all skills by default (can be configured)
      this.enabledSkills.add(definition.id);
    });
    
    console.log(`[SkillsRegistry] Initialized with ${definitions.length} skills`);
  }
  
  /**
   * Get all registered skills
   */
  getAllSkills(): SkillInstance[] {
    return Array.from(this.skills.values());
  }
  
  /**
   * Get skill by ID
   */
  getSkill(id: string): SkillInstance | undefined {
    return this.skills.get(id);
  }
  
  /**
   * Get skills by category
   */
  getSkillsByCategory(category: string): SkillInstance[] {
    return this.getAllSkills().filter(
      skill => skill.definition.category === category
    );
  }
  
  /**
   * Get enabled skills
   */
  getEnabledSkills(): SkillInstance[] {
    return this.getAllSkills().filter(
      skill => this.enabledSkills.has(skill.definition.id)
    );
  }
  
  /**
   * Enable a skill
   */
  enableSkill(id: string): boolean {
    if (this.skills.has(id)) {
      this.enabledSkills.add(id);
      console.log(`[SkillsRegistry] Enabled skill: ${id}`);
      return true;
    }
    return false;
  }
  
  /**
   * Disable a skill
   */
  disableSkill(id: string): boolean {
    if (this.enabledSkills.delete(id)) {
      console.log(`[SkillsRegistry] Disabled skill: ${id}`);
      
      // Unload implementation if loaded
      const skill = this.skills.get(id);
      if (skill && skill.implementation) {
        skill.implementation = undefined;
        skill.status = 'available';
      }
      
      return true;
    }
    return false;
  }
  
  /**
   * Check if skill is enabled
   */
  isSkillEnabled(id: string): boolean {
    return this.enabledSkills.has(id);
  }
  
  /**
   * Load skill implementation
   */
  async loadSkill(id: string): Promise<BaseSkill | null> {
    const skillInstance = this.skills.get(id);
    
    if (!skillInstance) {
      console.error(`[SkillsRegistry] Skill not found: ${id}`);
      return null;
    }
    
    if (!this.isSkillEnabled(id)) {
      console.error(`[SkillsRegistry] Skill is disabled: ${id}`);
      return null;
    }
    
    if (skillInstance.implementation) {
      return skillInstance.implementation;
    }
    
    skillInstance.status = 'loading';
    
    try {
      // Dynamic import based on skill ID
      // In production, this would load actual implementations
      const implementation = await this.createSkillImplementation(id);
      
      if (implementation) {
        skillInstance.implementation = implementation;
        skillInstance.status = 'loaded';
        console.log(`[SkillsRegistry] Loaded skill: ${id}`);
        return implementation;
      } else {
        throw new Error('Implementation not found');
      }
    } catch (error: any) {
      skillInstance.status = 'error';
      skillInstance.error = error.message;
      console.error(`[SkillsRegistry] Failed to load skill ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Create skill implementation
   * In production, this would load actual skill classes
   */
  private async createSkillImplementation(id: string): Promise<BaseSkill | null> {
    // Import existing implementations
    switch (id) {
      case 'calculator':
        const { CalculatorSkill } = await import('./impl/CalculatorSkill');
        return new CalculatorSkill();
      
      case 'datetime':
        const { DateTimeSkill } = await import('./impl/DateTimeSkill');
        return new DateTimeSkill();
      
      case 'weather':
        const { WeatherSkill } = await import('./impl/WeatherSkill');
        return new WeatherSkill();
      
      default:
        // For unimplemented skills, return a mock implementation
        return this.createMockSkill(id);
    }
  }
  
  /**
   * Create a mock skill for unimplemented skills
   */
  private createMockSkill(id: string): BaseSkill | null {
    const definition = SkillFactory.getSkillDefinition(id);
    if (!definition) return null;
    
    // Create a dynamic mock skill
    return {
      metadata: {
        id: definition.id,
        name: definition.name,
        description: definition.description,
        category: definition.category as any,
        version: '1.0.0',
        author: 'Intelagent',
        tags: definition.tags
      },
      
      async execute(params: any) {
        // Mock execution
        return {
          success: true,
          data: {
            message: `Mock execution of ${definition.name}`,
            params,
            timestamp: new Date()
          },
          metadata: {
            skillId: definition.id,
            skillName: definition.name,
            timestamp: new Date()
          }
        };
      },
      
      validate(params: any) {
        return true;
      },
      
      getConfig() {
        return {};
      }
    } as BaseSkill;
  }
  
  /**
   * Update skill statistics
   */
  updateSkillStats(
    id: string,
    success: boolean,
    duration: number
  ): void {
    const skill = this.skills.get(id);
    if (!skill) return;
    
    skill.stats.totalExecutions++;
    if (success) {
      skill.stats.successfulExecutions++;
    } else {
      skill.stats.failedExecutions++;
    }
    skill.stats.totalDuration += duration;
    skill.stats.lastExecuted = new Date();
  }
  
  /**
   * Get skill statistics
   */
  getSkillStats(id: string) {
    const skill = this.skills.get(id);
    if (!skill) return null;
    
    const stats = skill.stats;
    const successRate = stats.totalExecutions > 0
      ? (stats.successfulExecutions / stats.totalExecutions) * 100
      : 0;
    
    const avgDuration = stats.totalExecutions > 0
      ? stats.totalDuration / stats.totalExecutions
      : 0;
    
    return {
      ...stats,
      successRate,
      avgDuration
    };
  }
  
  /**
   * Get registry statistics
   */
  getRegistryStats() {
    const total = this.skills.size;
    const enabled = this.enabledSkills.size;
    const loaded = Array.from(this.skills.values()).filter(
      s => s.status === 'loaded'
    ).length;
    
    const totalExecutions = Array.from(this.skills.values()).reduce(
      (sum, skill) => sum + skill.stats.totalExecutions,
      0
    );
    
    const categories = new Map<string, number>();
    this.getAllSkills().forEach(skill => {
      const cat = skill.definition.category;
      categories.set(cat, (categories.get(cat) || 0) + 1);
    });
    
    return {
      totalSkills: total,
      enabledSkills: enabled,
      loadedSkills: loaded,
      totalExecutions,
      categoryCounts: Object.fromEntries(categories)
    };
  }
  
  /**
   * Search skills
   */
  searchSkills(query: string): SkillInstance[] {
    const definitions = SkillFactory.searchSkills(query);
    const ids = new Set(definitions.map(d => d.id));
    
    return this.getAllSkills().filter(
      skill => ids.has(skill.definition.id)
    );
  }
  
  /**
   * Export registry data
   */
  exportData() {
    return {
      skills: Array.from(this.skills.entries()).map(([id, skill]) => ({
        id,
        definition: skill.definition,
        status: skill.status,
        enabled: this.enabledSkills.has(id),
        stats: skill.stats
      })),
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Import registry data
   */
  importData(data: any) {
    if (!data.skills) return false;
    
    data.skills.forEach((skillData: any) => {
      const skill = this.skills.get(skillData.id);
      if (skill) {
        // Update stats
        if (skillData.stats) {
          skill.stats = {
            ...skill.stats,
            ...skillData.stats
          };
        }
        
        // Update enabled status
        if (skillData.enabled) {
          this.enabledSkills.add(skillData.id);
        } else {
          this.enabledSkills.delete(skillData.id);
        }
      }
    });
    
    console.log(`[SkillsRegistry] Imported data from ${data.timestamp}`);
    return true;
  }
}