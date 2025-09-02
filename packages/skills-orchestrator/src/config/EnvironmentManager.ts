/**
 * Environment Manager
 * Manages environment variables per license key for secure configuration
 * No third-party services - uses encryption for sensitive data
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';

export interface EnvironmentVariable {
  key: string;
  value: string;
  encrypted: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LicenseEnvironment {
  licenseKey: string;
  variables: Map<string, EnvironmentVariable>;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnvironmentTemplate {
  id: string;
  name: string;
  description?: string;
  variables: Array<{
    key: string;
    defaultValue?: string;
    required: boolean;
    encrypted: boolean;
    description?: string;
  }>;
  createdAt: Date;
}

export class EnvironmentManager extends EventEmitter {
  private static instance: EnvironmentManager;
  private environments = new Map<string, LicenseEnvironment>();
  private templates = new Map<string, EnvironmentTemplate>();
  private encryptionKey: Buffer;
  
  private constructor() {
    super();
    this.encryptionKey = this.getOrCreateEncryptionKey();
    this.loadFromStorage();
  }
  
  public static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }
  
  /**
   * Set an environment variable for a license
   */
  public setVariable(
    licenseKey: string,
    key: string,
    value: string,
    options?: {
      encrypted?: boolean;
      description?: string;
    }
  ): void {
    let environment = this.environments.get(licenseKey);
    
    if (!environment) {
      environment = {
        licenseKey,
        variables: new Map(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.environments.set(licenseKey, environment);
    }
    
    const actualValue = options?.encrypted ? this.encrypt(value) : value;
    
    const variable: EnvironmentVariable = {
      key,
      value: actualValue,
      encrypted: options?.encrypted || false,
      description: options?.description,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Check if updating existing
    const existing = environment.variables.get(key);
    if (existing) {
      variable.createdAt = existing.createdAt;
    }
    
    environment.variables.set(key, variable);
    environment.updatedAt = new Date();
    
    this.saveToStorage();
    
    console.log(`[EnvironmentManager] Set variable ${key} for license ${licenseKey}`);
    
    this.emit('variable:set', {
      licenseKey,
      key,
      encrypted: variable.encrypted
    });
  }
  
  /**
   * Get an environment variable
   */
  public getVariable(licenseKey: string, key: string): string | undefined {
    const environment = this.environments.get(licenseKey);
    if (!environment) return undefined;
    
    const variable = environment.variables.get(key);
    if (!variable) return undefined;
    
    if (variable.encrypted) {
      return this.decrypt(variable.value);
    }
    
    return variable.value;
  }
  
  /**
   * Get all variables for a license (decrypted)
   */
  public getVariables(licenseKey: string): Record<string, string> {
    const environment = this.environments.get(licenseKey);
    if (!environment) return {};
    
    const result: Record<string, string> = {};
    
    for (const [key, variable] of environment.variables.entries()) {
      result[key] = variable.encrypted ? this.decrypt(variable.value) : variable.value;
    }
    
    return result;
  }
  
  /**
   * Get variable metadata (without decrypting values)
   */
  public getVariableMetadata(licenseKey: string): Array<{
    key: string;
    encrypted: boolean;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
  }> {
    const environment = this.environments.get(licenseKey);
    if (!environment) return [];
    
    return Array.from(environment.variables.entries()).map(([key, variable]) => ({
      key,
      encrypted: variable.encrypted,
      description: variable.description,
      createdAt: variable.createdAt,
      updatedAt: variable.updatedAt
    }));
  }
  
  /**
   * Delete a variable
   */
  public deleteVariable(licenseKey: string, key: string): boolean {
    const environment = this.environments.get(licenseKey);
    if (!environment) return false;
    
    const deleted = environment.variables.delete(key);
    
    if (deleted) {
      environment.updatedAt = new Date();
      this.saveToStorage();
      
      this.emit('variable:deleted', { licenseKey, key });
    }
    
    return deleted;
  }
  
  /**
   * Set multiple variables at once
   */
  public setVariables(
    licenseKey: string,
    variables: Record<string, { value: string; encrypted?: boolean; description?: string }>
  ): void {
    for (const [key, config] of Object.entries(variables)) {
      this.setVariable(licenseKey, key, config.value, {
        encrypted: config.encrypted,
        description: config.description
      });
    }
  }
  
  /**
   * Create an environment template
   */
  public createTemplate(
    name: string,
    variables: Array<{
      key: string;
      defaultValue?: string;
      required: boolean;
      encrypted: boolean;
      description?: string;
    }>,
    description?: string
  ): EnvironmentTemplate {
    const template: EnvironmentTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      name,
      description,
      variables,
      createdAt: new Date()
    };
    
    this.templates.set(template.id, template);
    this.saveToStorage();
    
    this.emit('template:created', template);
    
    return template;
  }
  
  /**
   * Apply a template to a license
   */
  public applyTemplate(
    licenseKey: string,
    templateId: string,
    overrides?: Record<string, string>
  ): boolean {
    const template = this.templates.get(templateId);
    if (!template) return false;
    
    for (const varConfig of template.variables) {
      const value = overrides?.[varConfig.key] || varConfig.defaultValue;
      
      if (!value && varConfig.required) {
        throw new Error(`Required variable ${varConfig.key} not provided`);
      }
      
      if (value) {
        this.setVariable(licenseKey, varConfig.key, value, {
          encrypted: varConfig.encrypted,
          description: varConfig.description
        });
      }
    }
    
    this.emit('template:applied', { licenseKey, templateId });
    
    return true;
  }
  
  /**
   * Export environment for backup
   */
  public exportEnvironment(licenseKey: string): {
    licenseKey: string;
    variables: Array<{
      key: string;
      value: string;
      encrypted: boolean;
      description?: string;
    }>;
    exportDate: Date;
  } {
    const environment = this.environments.get(licenseKey);
    if (!environment) {
      return {
        licenseKey,
        variables: [],
        exportDate: new Date()
      };
    }
    
    const variables = Array.from(environment.variables.entries()).map(([key, variable]) => ({
      key,
      value: variable.value, // Keep encrypted if it was encrypted
      encrypted: variable.encrypted,
      description: variable.description
    }));
    
    return {
      licenseKey,
      variables,
      exportDate: new Date()
    };
  }
  
  /**
   * Import environment from backup
   */
  public importEnvironment(
    licenseKey: string,
    data: {
      variables: Array<{
        key: string;
        value: string;
        encrypted: boolean;
        description?: string;
      }>;
    },
    merge = false
  ): { imported: number; skipped: number } {
    if (!merge) {
      // Clear existing environment
      this.environments.delete(licenseKey);
    }
    
    let imported = 0;
    let skipped = 0;
    
    for (const variable of data.variables) {
      try {
        // If the value is already encrypted, store it as-is
        if (variable.encrypted) {
          let environment = this.environments.get(licenseKey);
          if (!environment) {
            environment = {
              licenseKey,
              variables: new Map(),
              createdAt: new Date(),
              updatedAt: new Date()
            };
            this.environments.set(licenseKey, environment);
          }
          
          environment.variables.set(variable.key, {
            key: variable.key,
            value: variable.value,
            encrypted: true,
            description: variable.description,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        } else {
          this.setVariable(licenseKey, variable.key, variable.value, {
            encrypted: false,
            description: variable.description
          });
        }
        
        imported++;
      } catch (error) {
        skipped++;
      }
    }
    
    this.saveToStorage();
    
    this.emit('environment:imported', { licenseKey, imported, skipped });
    
    return { imported, skipped };
  }
  
  /**
   * Clone environment from one license to another
   */
  public cloneEnvironment(sourceLicense: string, targetLicense: string): boolean {
    const sourceEnv = this.environments.get(sourceLicense);
    if (!sourceEnv) return false;
    
    const targetEnv: LicenseEnvironment = {
      licenseKey: targetLicense,
      variables: new Map(sourceEnv.variables),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.environments.set(targetLicense, targetEnv);
    this.saveToStorage();
    
    this.emit('environment:cloned', { sourceLicense, targetLicense });
    
    return true;
  }
  
  /**
   * Validate environment against a template
   */
  public validateEnvironment(licenseKey: string, templateId: string): {
    valid: boolean;
    missing: string[];
    extra: string[];
  } {
    const template = this.templates.get(templateId);
    const environment = this.environments.get(licenseKey);
    
    if (!template) {
      return { valid: false, missing: [], extra: [] };
    }
    
    const templateKeys = new Set(template.variables.map(v => v.key));
    const envKeys = environment ? new Set(environment.variables.keys()) : new Set();
    
    const missing = template.variables
      .filter(v => v.required && !envKeys.has(v.key))
      .map(v => v.key);
    
    const extra = Array.from(envKeys).filter(key => !templateKeys.has(key));
    
    return {
      valid: missing.length === 0,
      missing,
      extra
    };
  }
  
  /**
   * Encrypt a value
   */
  private encrypt(value: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }
  
  /**
   * Decrypt a value
   */
  private decrypt(encryptedValue: string): string {
    const parts = encryptedValue.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  /**
   * Get or create encryption key
   */
  private getOrCreateEncryptionKey(): Buffer {
    const fs = require('fs');
    const path = require('path');
    const keyPath = path.join(process.cwd(), 'data', '.env-key');
    
    try {
      if (fs.existsSync(keyPath)) {
        return fs.readFileSync(keyPath);
      }
    } catch (error) {
      // Continue to create new key
    }
    
    // Create new key
    const key = crypto.randomBytes(32);
    
    try {
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(keyPath, key);
    } catch (error) {
      console.error('[EnvironmentManager] Failed to save encryption key:', error);
    }
    
    return key;
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
      
      // Convert Maps to arrays for JSON serialization
      const data = {
        environments: Array.from(this.environments.entries()).map(([key, env]) => ({
          licenseKey: key,
          variables: Array.from(env.variables.entries()),
          createdAt: env.createdAt,
          updatedAt: env.updatedAt
        })),
        templates: Array.from(this.templates.entries()),
        timestamp: new Date().toISOString()
      };
      
      fs.writeFileSync(
        path.join(dataDir, 'environments.json'),
        JSON.stringify(data, null, 2)
      );
    } catch (error) {
      console.error('[EnvironmentManager] Failed to save to storage:', error);
    }
  }
  
  /**
   * Load from persistent storage
   */
  private loadFromStorage(): void {
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'data', 'environments.json');
      
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        
        // Restore environments
        for (const env of data.environments) {
          const environment: LicenseEnvironment = {
            licenseKey: env.licenseKey,
            variables: new Map(env.variables),
            createdAt: new Date(env.createdAt),
            updatedAt: new Date(env.updatedAt)
          };
          this.environments.set(env.licenseKey, environment);
        }
        
        // Restore templates
        if (data.templates) {
          this.templates = new Map(data.templates);
        }
        
        console.log('[EnvironmentManager] Loaded from storage');
      }
    } catch (error) {
      console.error('[EnvironmentManager] Failed to load from storage:', error);
    }
  }
}