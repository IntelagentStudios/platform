import { BaseAdapter, QueryResult, QueryOptions, DatabaseConfig } from './DatabaseAdapter';
import { Pool, Client } from 'pg';

export class PostgresAdapter extends BaseAdapter {
  private pool: Pool | null = null;

  async connect(): Promise<void> {
    if (this.connected) return;

    const config = {
      connectionString: this.config.connectionString,
      host: this.config.host,
      port: this.config.port || 5432,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
      max: this.config.poolSize || 20,
      connectionTimeoutMillis: this.config.timeout || 5000
    };

    this.pool = new Pool(config);
    
    // Test connection
    const client = await this.pool.connect();
    client.release();
    
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.connected = false;
    }
  }

  async query(sql: string, params?: any[]): Promise<QueryResult> {
    if (!this.pool) throw new Error('Database not connected');
    
    const result = await this.pool.query(sql, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount || 0,
      fields: result.fields?.map(f => f.name)
    };
  }

  async insert(table: string, data: Record<string, any>): Promise<any> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const result = await this.query(sql, values);
    
    return result.rows[0];
  }

  async update(table: string, id: string | number, data: Record<string, any>): Promise<any> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    
    values.push(id);
    const sql = `UPDATE ${table} SET ${setClause} WHERE id = $${values.length} RETURNING *`;
    const result = await this.query(sql, values);
    
    return result.rows[0];
  }

  async delete(table: string, id: string | number): Promise<boolean> {
    const sql = `DELETE FROM ${table} WHERE id = $1`;
    const result = await this.query(sql, [id]);
    return result.rowCount > 0;
  }

  async findOne(table: string, conditions: Record<string, any>): Promise<any> {
    const keys = Object.keys(conditions);
    const values = Object.values(conditions);
    const whereClause = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
    
    const sql = `SELECT * FROM ${table} WHERE ${whereClause} LIMIT 1`;
    const result = await this.query(sql, values);
    
    return result.rows[0];
  }

  async findMany(
    table: string, 
    conditions?: Record<string, any>, 
    options?: QueryOptions
  ): Promise<any[]> {
    let sql = `SELECT ${options?.select?.join(', ') || '*'} FROM ${table}`;
    const values: any[] = [];
    
    if (conditions && Object.keys(conditions).length > 0) {
      const keys = Object.keys(conditions);
      const whereClause = keys.map((key, i) => {
        values.push(conditions[key]);
        return `${key} = $${values.length}`;
      }).join(' AND ');
      sql += ` WHERE ${whereClause}`;
    }
    
    if (options?.orderBy) {
      const orderClauses = Object.entries(options.orderBy)
        .map(([key, dir]) => `${key} ${dir.toUpperCase()}`)
        .join(', ');
      sql += ` ORDER BY ${orderClauses}`;
    }
    
    if (options?.limit) {
      sql += ` LIMIT ${options.limit}`;
    }
    
    if (options?.offset) {
      sql += ` OFFSET ${options.offset}`;
    }
    
    const result = await this.query(sql, values);
    return result.rows;
  }

  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    if (!this.pool) throw new Error('Database not connected');
    
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback();
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}