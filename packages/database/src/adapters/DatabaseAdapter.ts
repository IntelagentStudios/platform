/**
 * Database Adapter Interface
 * Allows customers to use their own database or connect via API
 */

export interface DatabaseConfig {
  type: 'postgres' | 'mysql' | 'mongodb' | 'sqlite' | 'api' | 'custom';
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  apiEndpoint?: string;
  apiKey?: string;
  apiHeaders?: Record<string, string>;
  customAdapter?: string; // Path to custom adapter implementation
  encryptionKey?: string; // For encrypting sensitive data
  poolSize?: number;
  timeout?: number;
  retryAttempts?: number;
  schema?: string;
}

export interface QueryResult {
  rows: any[];
  rowCount: number;
  fields?: string[];
}

export interface DatabaseAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query(sql: string, params?: any[]): Promise<QueryResult>;
  insert(table: string, data: Record<string, any>): Promise<any>;
  update(table: string, id: string | number, data: Record<string, any>): Promise<any>;
  delete(table: string, id: string | number): Promise<boolean>;
  findOne(table: string, conditions: Record<string, any>): Promise<any>;
  findMany(table: string, conditions?: Record<string, any>, options?: QueryOptions): Promise<any[]>;
  transaction<T>(callback: () => Promise<T>): Promise<T>;
  healthCheck(): Promise<boolean>;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
  select?: string[];
}

export abstract class BaseAdapter implements DatabaseAdapter {
  protected config: DatabaseConfig;
  protected connected: boolean = false;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract query(sql: string, params?: any[]): Promise<QueryResult>;
  abstract insert(table: string, data: Record<string, any>): Promise<any>;
  abstract update(table: string, id: string | number, data: Record<string, any>): Promise<any>;
  abstract delete(table: string, id: string | number): Promise<boolean>;
  abstract findOne(table: string, conditions: Record<string, any>): Promise<any>;
  abstract findMany(table: string, conditions?: Record<string, any>, options?: QueryOptions): Promise<any[]>;
  abstract transaction<T>(callback: () => Promise<T>): Promise<T>;

  async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  protected sanitizeInput(input: any): any {
    // Basic SQL injection prevention
    if (typeof input === 'string') {
      return input.replace(/['"]/g, '');
    }
    return input;
  }
}