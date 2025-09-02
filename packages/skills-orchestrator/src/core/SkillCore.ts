/**
 * Skill Core - Shared functionality for all skills
 * Provides common operations that skills can leverage
 */

import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';

export class SkillCore extends EventEmitter {
  private static instance: SkillCore;
  private cache: Map<string, any> = new Map();
  
  // Core services (lazy loaded)
  private services: Map<string, any> = new Map();
  
  private constructor() {
    super();
  }
  
  public static getInstance(): SkillCore {
    if (!SkillCore.instance) {
      SkillCore.instance = new SkillCore();
    }
    return SkillCore.instance;
  }
  
  // ============= COMMUNICATION OPERATIONS =============
  
  async sendEmail(to: string, subject: string, content: string, options?: any) {
    const service = await this.getService('email');
    return service.send({ to, subject, text: content, ...options });
  }
  
  async sendSms(to: string, message: string, options?: any) {
    const service = await this.getService('sms');
    return service.send({ to, message, ...options });
  }
  
  async sendNotification(channel: string, message: string, options?: any) {
    // Generic notification sender
    const timestamp = new Date();
    const notificationId = this.generateId('notif');
    
    this.emit('notification:sent', { channel, message, timestamp });
    
    return {
      notificationId,
      channel,
      message,
      timestamp,
      delivered: true
    };
  }
  
  // ============= DATA PROCESSING OPERATIONS =============
  
  async processData(data: any, operation: string, options?: any) {
    switch (operation) {
      case 'parse':
        return this.parseData(data, options?.format);
      case 'transform':
        return this.transformData(data, options?.schema);
      case 'validate':
        return this.validateData(data, options?.rules);
      case 'aggregate':
        return this.aggregateData(data, options?.method);
      case 'clean':
        return this.cleanData(data);
      case 'merge':
        return this.mergeData(data, options?.target);
      case 'split':
        return this.splitData(data, options?.delimiter);
      case 'deduplicate':
        return this.deduplicateData(data);
      default:
        return data;
    }
  }
  
  private parseData(data: any, format?: string) {
    if (format === 'json' || typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    }
    if (format === 'csv') {
      return this.parseCsv(data);
    }
    if (format === 'xml') {
      return this.parseXml(data);
    }
    return data;
  }
  
  private transformData(data: any, schema?: any) {
    if (!schema) return data;
    
    const transformed: any = {};
    for (const [key, mapping] of Object.entries(schema)) {
      if (typeof mapping === 'string') {
        transformed[key] = this.getNestedValue(data, mapping);
      } else if (typeof mapping === 'function') {
        transformed[key] = (mapping as Function)(data);
      }
    }
    return transformed;
  }
  
  private validateData(data: any, rules?: any) {
    const errors: string[] = [];
    
    if (!rules) return { valid: true, errors };
    
    for (const [field, rule] of Object.entries(rules)) {
      const value = this.getNestedValue(data, field);
      
      if (typeof rule === 'object') {
        const r = rule as any;
        if (r.required && !value) {
          errors.push(`${field} is required`);
        }
        if (r.type && typeof value !== r.type) {
          errors.push(`${field} must be of type ${r.type}`);
        }
        if (r.min && value < r.min) {
          errors.push(`${field} must be at least ${r.min}`);
        }
        if (r.max && value > r.max) {
          errors.push(`${field} must be at most ${r.max}`);
        }
        if (r.pattern && !new RegExp(r.pattern).test(value)) {
          errors.push(`${field} does not match pattern ${r.pattern}`);
        }
      }
    }
    
    return { valid: errors.length === 0, errors };
  }
  
  private aggregateData(data: any[], method?: string) {
    if (!Array.isArray(data)) return data;
    
    switch (method) {
      case 'sum':
        return data.reduce((acc, val) => acc + (Number(val) || 0), 0);
      case 'average':
        return data.reduce((acc, val) => acc + (Number(val) || 0), 0) / data.length;
      case 'count':
        return data.length;
      case 'min':
        return Math.min(...data.map(v => Number(v) || 0));
      case 'max':
        return Math.max(...data.map(v => Number(v) || 0));
      case 'unique':
        return [...new Set(data)];
      default:
        return data;
    }
  }
  
  private cleanData(data: any): any {
    if (typeof data === 'string') {
      return data.trim().replace(/\s+/g, ' ');
    }
    if (Array.isArray(data)) {
      return data.map(item => this.cleanData(item)).filter(Boolean);
    }
    if (typeof data === 'object' && data !== null) {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== null && value !== undefined && value !== '') {
          cleaned[key] = this.cleanData(value);
        }
      }
      return cleaned;
    }
    return data;
  }
  
  private mergeData(source: any, target: any) {
    if (Array.isArray(source) && Array.isArray(target)) {
      return [...source, ...target];
    }
    if (typeof source === 'object' && typeof target === 'object') {
      return { ...source, ...target };
    }
    return source;
  }
  
  private splitData(data: any, delimiter?: string) {
    if (typeof data === 'string') {
      return data.split(delimiter || ',');
    }
    if (Array.isArray(data)) {
      const mid = Math.floor(data.length / 2);
      return [data.slice(0, mid), data.slice(mid)];
    }
    return [data];
  }
  
  private deduplicateData(data: any[]) {
    if (!Array.isArray(data)) return data;
    
    const seen = new Set();
    return data.filter(item => {
      const key = typeof item === 'object' ? JSON.stringify(item) : item;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  
  // ============= FILE OPERATIONS =============
  
  async readFile(filePath: string, encoding?: BufferEncoding) {
    try {
      return await fs.readFile(filePath, encoding || 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read file: ${filePath}`);
    }
  }
  
  async writeFile(filePath: string, content: any) {
    try {
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, content);
      return { success: true, path: filePath };
    } catch (error) {
      throw new Error(`Failed to write file: ${filePath}`);
    }
  }
  
  async generatePdf(content: string, options?: any) {
    const service = await this.getService('pdf');
    return service.generate({ content, ...options });
  }
  
  // ============= AI/ML OPERATIONS =============
  
  async classify(text: string, categories?: string[]) {
    // Simple keyword-based classification
    const keywords: Record<string, string[]> = {
      positive: ['good', 'great', 'excellent', 'love', 'amazing', 'wonderful'],
      negative: ['bad', 'terrible', 'hate', 'awful', 'horrible', 'worst'],
      neutral: ['okay', 'fine', 'average', 'normal', 'typical'],
      question: ['what', 'why', 'how', 'when', 'where', 'who', '?'],
      urgent: ['urgent', 'asap', 'immediate', 'critical', 'emergency'],
      business: ['invoice', 'payment', 'order', 'customer', 'client', 'revenue'],
      technical: ['bug', 'error', 'code', 'api', 'database', 'server']
    };
    
    const textLower = text.toLowerCase();
    const scores: Record<string, number> = {};
    
    const checkCategories = categories || Object.keys(keywords);
    
    for (const category of checkCategories) {
      const categoryKeywords = keywords[category] || [];
      scores[category] = categoryKeywords.filter(kw => textLower.includes(kw)).length;
    }
    
    const topCategory = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)[0];
    
    return {
      category: topCategory?.[0] || 'unknown',
      confidence: Math.min((topCategory?.[1] || 0) / 3, 1),
      scores
    };
  }
  
  async extractEntities(text: string) {
    const entities: any = {
      emails: [],
      phones: [],
      urls: [],
      dates: [],
      numbers: [],
      currencies: []
    };
    
    // Email extraction
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    entities.emails = text.match(emailRegex) || [];
    
    // Phone extraction
    const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
    entities.phones = text.match(phoneRegex) || [];
    
    // URL extraction
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    entities.urls = text.match(urlRegex) || [];
    
    // Date extraction (simple)
    const dateRegex = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g;
    entities.dates = text.match(dateRegex) || [];
    
    // Number extraction
    const numberRegex = /\b\d+\.?\d*\b/g;
    entities.numbers = text.match(numberRegex) || [];
    
    // Currency extraction
    const currencyRegex = /[\$€£¥]\d+\.?\d*/g;
    entities.currencies = text.match(currencyRegex) || [];
    
    return entities;
  }
  
  async analyzeSentiment(text: string) {
    const positive = ['good', 'great', 'excellent', 'love', 'amazing', 'wonderful', 'fantastic', 'happy'];
    const negative = ['bad', 'terrible', 'hate', 'awful', 'horrible', 'worst', 'sad', 'angry'];
    
    const textLower = text.toLowerCase();
    let score = 0;
    
    positive.forEach(word => {
      if (textLower.includes(word)) score += 1;
    });
    
    negative.forEach(word => {
      if (textLower.includes(word)) score -= 1;
    });
    
    return {
      sentiment: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral',
      score: Math.max(-1, Math.min(1, score / 5)),
      confidence: Math.min(Math.abs(score) / 3, 1)
    };
  }
  
  // ============= AUTOMATION OPERATIONS =============
  
  async scheduleTask(task: any, delay?: number) {
    const taskId = this.generateId('task');
    
    if (delay) {
      setTimeout(() => {
        this.emit('task:executed', { taskId, task, timestamp: new Date() });
      }, delay);
    } else {
      this.emit('task:scheduled', { taskId, task, timestamp: new Date() });
    }
    
    return { taskId, scheduled: true };
  }
  
  async executeWorkflow(steps: any[]) {
    const results = [];
    const workflowId = this.generateId('workflow');
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      try {
        const result = await this.executeStep(step);
        results.push({ step: i, success: true, result });
      } catch (error: any) {
        results.push({ step: i, success: false, error: error.message });
        if (!step.continueOnError) break;
      }
    }
    
    return { workflowId, results };
  }
  
  private async executeStep(step: any) {
    // Simulate step execution
    await this.delay(step.duration || 100);
    
    if (step.type === 'http') {
      return { status: 200, data: 'Mock response' };
    }
    if (step.type === 'database') {
      return { rows: [], affected: 0 };
    }
    if (step.type === 'condition') {
      return step.condition || true;
    }
    
    return { executed: true };
  }
  
  // ============= BUSINESS OPERATIONS =============
  
  async processPayment(amount: number, currency: string, customerId: string, options?: any) {
    const service = await this.getService('payment');
    return service.processPayment({ amount, currency, customerId, ...options });
  }
  
  async generateInvoice(data: any) {
    const invoiceId = this.generateId('inv');
    const invoiceNumber = `INV-${Date.now()}`;
    
    const invoice = {
      invoiceId,
      invoiceNumber,
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ...data,
      total: this.calculateTotal(data.items || []),
      status: 'pending'
    };
    
    return invoice;
  }
  
  private calculateTotal(items: any[]) {
    return items.reduce((sum, item) => {
      const quantity = item.quantity || 1;
      const price = item.price || 0;
      const tax = item.tax || 0;
      return sum + (quantity * price * (1 + tax / 100));
    }, 0);
  }
  
  // ============= UTILITY OPERATIONS =============
  
  async encrypt(data: string, key?: string) {
    const algorithm = 'aes-256-cbc';
    const encKey = key || crypto.randomBytes(32).toString('hex').slice(0, 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, encKey, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      key: encKey
    };
  }
  
  async decrypt(encryptedData: string, key: string, iv: string) {
    const algorithm = 'aes-256-cbc';
    const decipher = crypto.createDecipheriv(
      algorithm,
      key,
      Buffer.from(iv, 'hex')
    );
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  generateHash(data: string, algorithm: string = 'sha256') {
    return crypto.createHash(algorithm).update(data).digest('hex');
  }
  
  generateId(prefix: string = 'id') {
    return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }
  
  generatePassword(length: number = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
  
  // ============= HELPER METHODS =============
  
  private async getService(name: string) {
    if (!this.services.has(name)) {
      switch (name) {
        case 'email':
          const { InternalEmailService } = await import('../services/InternalEmailService');
          this.services.set(name, InternalEmailService.getInstance());
          break;
        case 'sms':
          const { InternalSmsService } = await import('../services/InternalSmsService');
          this.services.set(name, InternalSmsService.getInstance());
          break;
        case 'pdf':
          const { InternalPdfService } = await import('../services/InternalPdfService');
          this.services.set(name, InternalPdfService.getInstance());
          break;
        case 'payment':
          const { InternalPaymentService } = await import('../services/InternalPaymentService');
          this.services.set(name, InternalPaymentService.getInstance());
          break;
      }
    }
    return this.services.get(name);
  }
  
  private getNestedValue(obj: any, path: string) {
    return path.split('.').reduce((curr, key) => curr?.[key], obj);
  }
  
  private parseCsv(data: string) {
    const lines = data.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }
    
    return rows;
  }
  
  private parseXml(data: string) {
    // Simple XML to JSON conversion
    const result: any = {};
    const tagRegex = /<(\w+)>(.*?)<\/\1>/g;
    let match;
    
    while ((match = tagRegex.exec(data)) !== null) {
      result[match[1]] = match[2];
    }
    
    return result;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // ============= CACHE OPERATIONS =============
  
  setCache(key: string, value: any, ttl?: number) {
    this.cache.set(key, value);
    if (ttl) {
      setTimeout(() => this.cache.delete(key), ttl);
    }
  }
  
  getCache(key: string) {
    return this.cache.get(key);
  }
  
  clearCache() {
    this.cache.clear();
  }
}