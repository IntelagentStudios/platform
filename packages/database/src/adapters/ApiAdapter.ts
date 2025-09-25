import { BaseAdapter, QueryResult, QueryOptions } from './DatabaseAdapter';

/**
 * API Adapter for customers who want to connect their database via REST API
 * Provides complete data isolation and security
 */
export class ApiAdapter extends BaseAdapter {
  private baseUrl: string;
  private headers: Record<string, string>;

  async connect(): Promise<void> {
    if (!this.config.apiEndpoint) {
      throw new Error('API endpoint is required for API adapter');
    }

    this.baseUrl = this.config.apiEndpoint;
    this.headers = {
      'Content-Type': 'application/json',
      ...this.config.apiHeaders
    };

    if (this.config.apiKey) {
      this.headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    // Test connection
    const healthy = await this.healthCheck();
    if (!healthy) {
      throw new Error('Failed to connect to API');
    }

    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  private async makeRequest(endpoint: string, method: string, body?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async query(sql: string, params?: any[]): Promise<QueryResult> {
    const result = await this.makeRequest('/query', 'POST', {
      sql,
      params,
      schema: this.config.schema
    });

    return {
      rows: result.rows || [],
      rowCount: result.rowCount || 0,
      fields: result.fields
    };
  }

  async insert(table: string, data: Record<string, any>): Promise<any> {
    return this.makeRequest('/insert', 'POST', {
      table,
      data,
      schema: this.config.schema
    });
  }

  async update(table: string, id: string | number, data: Record<string, any>): Promise<any> {
    return this.makeRequest('/update', 'PUT', {
      table,
      id,
      data,
      schema: this.config.schema
    });
  }

  async delete(table: string, id: string | number): Promise<boolean> {
    const result = await this.makeRequest('/delete', 'DELETE', {
      table,
      id,
      schema: this.config.schema
    });
    return result.success || false;
  }

  async findOne(table: string, conditions: Record<string, any>): Promise<any> {
    const result = await this.makeRequest('/find-one', 'POST', {
      table,
      conditions,
      schema: this.config.schema
    });
    return result.data;
  }

  async findMany(
    table: string,
    conditions?: Record<string, any>,
    options?: QueryOptions
  ): Promise<any[]> {
    const result = await this.makeRequest('/find-many', 'POST', {
      table,
      conditions,
      options,
      schema: this.config.schema
    });
    return result.data || [];
  }

  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    // Start transaction
    const { transactionId } = await this.makeRequest('/transaction/begin', 'POST');

    try {
      // Execute callback with transaction context
      const result = await callback();
      
      // Commit transaction
      await this.makeRequest('/transaction/commit', 'POST', { transactionId });
      
      return result;
    } catch (error) {
      // Rollback transaction
      await this.makeRequest('/transaction/rollback', 'POST', { transactionId });
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.makeRequest('/health', 'GET');
      return result.status === 'ok';
    } catch {
      return false;
    }
  }
}