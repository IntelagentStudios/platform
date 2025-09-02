/**
 * Skill Aliases System
 * Allows custom naming and shortcuts for skills per license key
 * No third-party services required
 */

import { EventEmitter } from 'events';

export interface SkillAlias {
  id: string;
  licenseKey: string;
  alias: string;
  skillId: string;
  description?: string;
  defaultParams?: Record<string, any>;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
}

export interface AliasGroup {
  id: string;
  licenseKey: string;
  name: string;
  description?: string;
  aliases: string[]; // Array of alias IDs
  createdAt: Date;
}

export class SkillAliases extends EventEmitter {
  private static instance: SkillAliases;
  private aliases = new Map<string, SkillAlias[]>(); // By license key
  private aliasLookup = new Map<string, SkillAlias>(); // Quick lookup by alias+license
  private groups = new Map<string, AliasGroup[]>(); // Alias groups by license
  
  private constructor() {
    super();
    this.loadFromStorage();
  }
  
  public static getInstance(): SkillAliases {
    if (!SkillAliases.instance) {
      SkillAliases.instance = new SkillAliases();
    }
    return SkillAliases.instance;
  }
  
  /**
   * Create a new skill alias
   */
  public createAlias(
    licenseKey: string,
    alias: string,
    skillId: string,
    options?: {
      description?: string;
      defaultParams?: Record<string, any>;
      tags?: string[];
    }
  ): SkillAlias {
    // Check if alias already exists for this license
    const lookupKey = `${licenseKey}:${alias.toLowerCase()}`;
    if (this.aliasLookup.has(lookupKey)) {
      throw new Error(`Alias "${alias}" already exists for this license`);
    }
    
    const aliasObj: SkillAlias = {
      id: `alias_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      licenseKey,
      alias,
      skillId,
      description: options?.description,
      defaultParams: options?.defaultParams,
      tags: options?.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    };
    
    // Store alias
    const licenseAliases = this.aliases.get(licenseKey) || [];
    licenseAliases.push(aliasObj);
    this.aliases.set(licenseKey, licenseAliases);
    
    // Add to lookup
    this.aliasLookup.set(lookupKey, aliasObj);
    
    this.saveToStorage();
    
    console.log(`[SkillAliases] Created alias "${alias}" for skill ${skillId}`);
    
    this.emit('alias:created', aliasObj);
    
    return aliasObj;
  }
  
  /**
   * Resolve an alias to skill ID and params
   */
  public resolveAlias(
    licenseKey: string,
    aliasOrSkillId: string,
    userParams?: Record<string, any>
  ): { skillId: string; params: Record<string, any> } | null {
    const lookupKey = `${licenseKey}:${aliasOrSkillId.toLowerCase()}`;
    const alias = this.aliasLookup.get(lookupKey);
    
    if (!alias) {
      // Not an alias, return as skill ID
      return { skillId: aliasOrSkillId, params: userParams || {} };
    }
    
    // Increment usage count
    alias.usageCount++;
    alias.updatedAt = new Date();
    this.saveToStorage();
    
    // Merge default params with user params
    const params = {
      ...alias.defaultParams,
      ...userParams
    };
    
    this.emit('alias:used', {
      aliasId: alias.id,
      alias: alias.alias,
      skillId: alias.skillId,
      usageCount: alias.usageCount
    });
    
    return {
      skillId: alias.skillId,
      params
    };
  }
  
  /**
   * Update an alias
   */
  public updateAlias(
    licenseKey: string,
    aliasId: string,
    updates: Partial<{
      alias: string;
      skillId: string;
      description: string;
      defaultParams: Record<string, any>;
      tags: string[];
    }>
  ): boolean {
    const licenseAliases = this.aliases.get(licenseKey);
    if (!licenseAliases) return false;
    
    const aliasObj = licenseAliases.find(a => a.id === aliasId);
    if (!aliasObj) return false;
    
    // If alias name is changing, update lookup
    if (updates.alias && updates.alias !== aliasObj.alias) {
      const oldKey = `${licenseKey}:${aliasObj.alias.toLowerCase()}`;
      const newKey = `${licenseKey}:${updates.alias.toLowerCase()}`;
      
      // Check if new alias already exists
      if (this.aliasLookup.has(newKey)) {
        throw new Error(`Alias "${updates.alias}" already exists`);
      }
      
      this.aliasLookup.delete(oldKey);
      aliasObj.alias = updates.alias;
      this.aliasLookup.set(newKey, aliasObj);
    }
    
    // Update other fields
    if (updates.skillId !== undefined) aliasObj.skillId = updates.skillId;
    if (updates.description !== undefined) aliasObj.description = updates.description;
    if (updates.defaultParams !== undefined) aliasObj.defaultParams = updates.defaultParams;
    if (updates.tags !== undefined) aliasObj.tags = updates.tags;
    
    aliasObj.updatedAt = new Date();
    
    this.saveToStorage();
    
    this.emit('alias:updated', aliasObj);
    
    return true;
  }
  
  /**
   * Delete an alias
   */
  public deleteAlias(licenseKey: string, aliasId: string): boolean {
    const licenseAliases = this.aliases.get(licenseKey);
    if (!licenseAliases) return false;
    
    const index = licenseAliases.findIndex(a => a.id === aliasId);
    if (index === -1) return false;
    
    const aliasObj = licenseAliases[index];
    
    // Remove from arrays and maps
    licenseAliases.splice(index, 1);
    const lookupKey = `${licenseKey}:${aliasObj.alias.toLowerCase()}`;
    this.aliasLookup.delete(lookupKey);
    
    // Remove from any groups
    const groups = this.groups.get(licenseKey) || [];
    groups.forEach(group => {
      const aliasIndex = group.aliases.indexOf(aliasId);
      if (aliasIndex !== -1) {
        group.aliases.splice(aliasIndex, 1);
      }
    });
    
    this.saveToStorage();
    
    this.emit('alias:deleted', { aliasId, alias: aliasObj.alias });
    
    return true;
  }
  
  /**
   * Get all aliases for a license
   */
  public getLicenseAliases(licenseKey: string): SkillAlias[] {
    return this.aliases.get(licenseKey) || [];
  }
  
  /**
   * Search aliases
   */
  public searchAliases(
    licenseKey: string,
    query?: {
      text?: string;
      tags?: string[];
      skillId?: string;
    }
  ): SkillAlias[] {
    const licenseAliases = this.aliases.get(licenseKey) || [];
    
    return licenseAliases.filter(alias => {
      if (query?.text) {
        const searchText = query.text.toLowerCase();
        if (!alias.alias.toLowerCase().includes(searchText) &&
            !alias.description?.toLowerCase().includes(searchText)) {
          return false;
        }
      }
      
      if (query?.tags && query.tags.length > 0) {
        if (!query.tags.some(tag => alias.tags?.includes(tag))) {
          return false;
        }
      }
      
      if (query?.skillId && alias.skillId !== query.skillId) {
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * Create an alias group
   */
  public createGroup(
    licenseKey: string,
    name: string,
    description?: string,
    aliasIds?: string[]
  ): AliasGroup {
    const group: AliasGroup = {
      id: `group_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      licenseKey,
      name,
      description,
      aliases: aliasIds || [],
      createdAt: new Date()
    };
    
    const licenseGroups = this.groups.get(licenseKey) || [];
    licenseGroups.push(group);
    this.groups.set(licenseKey, licenseGroups);
    
    this.saveToStorage();
    
    this.emit('group:created', group);
    
    return group;
  }
  
  /**
   * Add aliases to a group
   */
  public addToGroup(groupId: string, aliasIds: string[]): boolean {
    for (const [licenseKey, groups] of this.groups.entries()) {
      const group = groups.find(g => g.id === groupId);
      if (group) {
        // Only add aliases that aren't already in the group
        const newAliases = aliasIds.filter(id => !group.aliases.includes(id));
        group.aliases.push(...newAliases);
        
        this.saveToStorage();
        
        this.emit('group:updated', group);
        return true;
      }
    }
    return false;
  }
  
  /**
   * Get alias groups for a license
   */
  public getLicenseGroups(licenseKey: string): AliasGroup[] {
    return this.groups.get(licenseKey) || [];
  }
  
  /**
   * Export aliases for backup
   */
  public exportAliases(licenseKey: string): {
    aliases: SkillAlias[];
    groups: AliasGroup[];
    exportDate: Date;
  } {
    return {
      aliases: this.getLicenseAliases(licenseKey),
      groups: this.getLicenseGroups(licenseKey),
      exportDate: new Date()
    };
  }
  
  /**
   * Import aliases from backup
   */
  public importAliases(
    licenseKey: string,
    data: {
      aliases: SkillAlias[];
      groups?: AliasGroup[];
    },
    merge = false
  ): { imported: number; skipped: number } {
    let imported = 0;
    let skipped = 0;
    
    if (!merge) {
      // Clear existing aliases
      this.aliases.set(licenseKey, []);
      this.groups.set(licenseKey, []);
      
      // Clear from lookup
      for (const [key, alias] of this.aliasLookup.entries()) {
        if (alias.licenseKey === licenseKey) {
          this.aliasLookup.delete(key);
        }
      }
    }
    
    // Import aliases
    for (const alias of data.aliases) {
      try {
        const lookupKey = `${licenseKey}:${alias.alias.toLowerCase()}`;
        if (this.aliasLookup.has(lookupKey)) {
          skipped++;
          continue;
        }
        
        const newAlias = { ...alias, licenseKey };
        const licenseAliases = this.aliases.get(licenseKey) || [];
        licenseAliases.push(newAlias);
        this.aliases.set(licenseKey, licenseAliases);
        this.aliasLookup.set(lookupKey, newAlias);
        
        imported++;
      } catch (error) {
        skipped++;
      }
    }
    
    // Import groups
    if (data.groups) {
      const licenseGroups = this.groups.get(licenseKey) || [];
      for (const group of data.groups) {
        licenseGroups.push({ ...group, licenseKey });
      }
      this.groups.set(licenseKey, licenseGroups);
    }
    
    this.saveToStorage();
    
    this.emit('aliases:imported', { licenseKey, imported, skipped });
    
    return { imported, skipped };
  }
  
  /**
   * Get most used aliases
   */
  public getTopAliases(licenseKey: string, limit = 10): SkillAlias[] {
    const licenseAliases = this.aliases.get(licenseKey) || [];
    return [...licenseAliases]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }
  
  /**
   * Save to persistent storage
   */
  private saveToStorage(): void {
    try {
      const fs = require('fs');
      const path = require('path');
      const dataDir = path.join(process.cwd(), 'data');
      
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      const data = {
        aliases: Array.from(this.aliases.entries()),
        groups: Array.from(this.groups.entries()),
        timestamp: new Date().toISOString()
      };
      
      fs.writeFileSync(
        path.join(dataDir, 'skill-aliases.json'),
        JSON.stringify(data, null, 2)
      );
    } catch (error) {
      console.error('[SkillAliases] Failed to save to storage:', error);
    }
  }
  
  /**
   * Load from persistent storage
   */
  private loadFromStorage(): void {
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'data', 'skill-aliases.json');
      
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        
        // Restore aliases
        this.aliases = new Map(data.aliases);
        
        // Rebuild lookup
        for (const [licenseKey, aliases] of this.aliases.entries()) {
          for (const alias of aliases) {
            const lookupKey = `${licenseKey}:${alias.alias.toLowerCase()}`;
            this.aliasLookup.set(lookupKey, alias);
          }
        }
        
        // Restore groups
        if (data.groups) {
          this.groups = new Map(data.groups);
        }
        
        console.log('[SkillAliases] Loaded from storage');
      }
    } catch (error) {
      console.error('[SkillAliases] Failed to load from storage:', error);
    }
  }
}