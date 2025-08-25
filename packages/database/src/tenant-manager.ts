/**
 * Tenant Manager for Multi-tenant Database Architecture
 * Handles schema routing, connection management, and tenant isolation
 */

import { PrismaClient } from '@prisma/client';
import { RedisManager } from '@intelagent/redis';

interface TenantConnection {
  client: PrismaClient;
  schemaName: string;
  licenseKey: string;
  lastUsed: Date;
}

interface TenantConfig {
  licenseKey: string;
  schemaName: string;
  products: string[];
  isPro: boolean;
  domain?: string;
  domainLocked?: boolean;
}

class TenantManager {
  private publicClient: PrismaClient;
  private connections: Map<string, TenantConnection> = new Map();
  private maxConnections = 100;
  private connectionTTL = 5 * 60 * 1000; // 5 minutes
  private cache: any;

  constructor() {
    // Initialize public schema client
    this.publicClient = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });

    // Initialize cache
    try {
      this.cache = RedisManager.getClient('cache');
    } catch {
      this.cache = new Map();
    }

    // Cleanup old connections periodically
    setInterval(() => this.cleanupConnections(), 60000); // Every minute
  }

  /**
   * Get tenant configuration from license key
   */
  async getTenantConfig(licenseKey: string): Promise<TenantConfig | null> {
    // Check cache first
    const cacheKey = `tenant:config:${licenseKey}`;
    const cached = await this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Query public schema for license info
      const license = await this.publicClient.$queryRaw<any[]>`
        SELECT 
          license_key,
          schema_name,
          products,
          is_pro,
          domain,
          domain_locked_at IS NOT NULL as domain_locked,
          status
        FROM public.licenses
        WHERE license_key = ${licenseKey}
        AND status = 'active'
      `;

      if (!license || license.length === 0) {
        return null;
      }

      const config: TenantConfig = {
        licenseKey: license[0].license_key,
        schemaName: license[0].schema_name,
        products: license[0].products || [],
        isPro: license[0].is_pro || false,
        domain: license[0].domain,
        domainLocked: license[0].domain_locked
      };

      // Cache for 5 minutes
      await this.saveToCache(cacheKey, config, 300);
      return config;
    } catch (error) {
      console.error('Failed to get tenant config:', error);
      return null;
    }
  }

  /**
   * Get or create a tenant-specific database connection
   */
  async getTenantConnection(licenseKey: string): Promise<PrismaClient | null> {
    // Check if connection exists and is still valid
    const existing = this.connections.get(licenseKey);
    if (existing) {
      existing.lastUsed = new Date();
      return existing.client;
    }

    // Get tenant configuration
    const config = await this.getTenantConfig(licenseKey);
    if (!config) {
      throw new Error('Invalid or inactive license');
    }

    // Create new connection with schema parameter
    const client = new PrismaClient({
      datasources: {
        db: {
          url: this.buildConnectionUrl(config.schemaName)
        }
      }
    });

    // Set search path to tenant schema
    await client.$executeRawUnsafe(`SET search_path TO ${config.schemaName}, public`);

    // Store connection
    const connection: TenantConnection = {
      client,
      schemaName: config.schemaName,
      licenseKey,
      lastUsed: new Date()
    };

    this.connections.set(licenseKey, connection);

    // Evict old connections if needed
    if (this.connections.size > this.maxConnections) {
      this.evictOldestConnection();
    }

    return client;
  }

  /**
   * Validate domain for tenant access
   */
  async validateDomain(licenseKey: string, requestDomain: string): Promise<boolean> {
    const config = await this.getTenantConfig(licenseKey);
    if (!config) return false;

    // If domain is locked, check if request matches
    if (config.domainLocked && config.domain) {
      // Extract base domain from request
      const baseDomain = this.extractBaseDomain(requestDomain);
      const licenseDomain = this.extractBaseDomain(config.domain);
      
      return baseDomain === licenseDomain;
    }

    return true;
  }

  /**
   * Create a new tenant schema for a license
   */
  async createTenantSchema(licenseKey: string, products: string[]): Promise<boolean> {
    try {
      // Call the PostgreSQL function to create schema
      await this.publicClient.$executeRaw`
        SELECT create_tenant_schema(${licenseKey}::VARCHAR, ${products}::TEXT[])
      `;

      // Clear cache for this tenant
      const cacheKey = `tenant:config:${licenseKey}`;
      await this.clearCache(cacheKey);

      return true;
    } catch (error) {
      console.error('Failed to create tenant schema:', error);
      return false;
    }
  }

  /**
   * Update tenant products (add/remove tables)
   */
  async updateTenantProducts(licenseKey: string, products: string[]): Promise<boolean> {
    try {
      const config = await this.getTenantConfig(licenseKey);
      if (!config) return false;

      // Get current products
      const currentProducts = new Set(config.products);
      const newProducts = new Set(products);

      // Find products to add
      const toAdd = Array.from(newProducts).filter(p => !currentProducts.has(p));
      
      // Find products to remove (optional - we might keep data)
      const toRemove = Array.from(currentProducts).filter(p => !newProducts.has(p));

      // Add new product tables
      for (const product of toAdd) {
        await this.publicClient.$executeRaw`
          SELECT add_product_to_schema(${config.schemaName}::VARCHAR, ${product}::VARCHAR)
        `;
      }

      // Update license record
      await this.publicClient.$executeRaw`
        UPDATE public.licenses 
        SET products = ${products}::JSONB
        WHERE license_key = ${licenseKey}
      `;

      // Clear cache
      const cacheKey = `tenant:config:${licenseKey}`;
      await this.clearCache(cacheKey);

      return true;
    } catch (error) {
      console.error('Failed to update tenant products:', error);
      return false;
    }
  }

  /**
   * Get admin connection with access to all schemas
   */
  async getAdminConnection(): Promise<PrismaClient> {
    return this.publicClient;
  }

  /**
   * Execute query on specific tenant schema (admin only)
   */
  async executeOnTenant(licenseKey: string, query: string): Promise<any> {
    const config = await this.getTenantConfig(licenseKey);
    if (!config) {
      throw new Error('Tenant not found');
    }

    try {
      // Set schema and execute query
      await this.publicClient.$executeRawUnsafe(`SET search_path TO ${config.schemaName}`);
      const result = await this.publicClient.$executeRawUnsafe(query);
      await this.publicClient.$executeRawUnsafe(`SET search_path TO public`);
      
      return result;
    } catch (error) {
      // Reset search path on error
      await this.publicClient.$executeRawUnsafe(`SET search_path TO public`);
      throw error;
    }
  }

  /**
   * Get tenant usage statistics
   */
  async getTenantStats(licenseKey: string): Promise<any> {
    const config = await this.getTenantConfig(licenseKey);
    if (!config) return null;

    const stats = await this.publicClient.$queryRaw`
      SELECT 
        pg_database_size(current_database()) as database_size,
        (SELECT COUNT(*) FROM information_schema.tables 
         WHERE table_schema = ${config.schemaName}) as table_count,
        (SELECT SUM(pg_total_relation_size(schemaname||'.'||tablename))::BIGINT
         FROM pg_tables 
         WHERE schemaname = ${config.schemaName}) as schema_size
    `;

    return (stats as any)[0] || null;
  }

  /**
   * Cleanup tenant schema (danger zone - admin only)
   */
  async deleteTenantSchema(licenseKey: string): Promise<boolean> {
    try {
      const config = await this.getTenantConfig(licenseKey);
      if (!config) return false;

      // Close any existing connections
      const connection = this.connections.get(licenseKey);
      if (connection) {
        await connection.client.$disconnect();
        this.connections.delete(licenseKey);
      }

      // Drop schema cascade
      await this.publicClient.$executeRawUnsafe(
        `DROP SCHEMA IF EXISTS ${config.schemaName} CASCADE`
      );

      // Update license status
      await this.publicClient.$executeRaw`
        UPDATE public.licenses 
        SET status = 'deleted', cancelled_at = NOW()
        WHERE license_key = ${licenseKey}
      `;

      // Clear cache
      const cacheKey = `tenant:config:${licenseKey}`;
      await this.clearCache(cacheKey);

      return true;
    } catch (error) {
      console.error('Failed to delete tenant schema:', error);
      return false;
    }
  }

  // Helper methods
  private buildConnectionUrl(schemaName: string): string {
    const baseUrl = process.env.DATABASE_URL || '';
    const url = new URL(baseUrl);
    
    // Add schema to search path
    url.searchParams.set('schema', schemaName);
    url.searchParams.set('connection_limit', '10');
    
    return url.toString();
  }

  private extractBaseDomain(url: string): string {
    try {
      // Remove protocol if present
      let domain = url.replace(/^https?:\/\//, '');
      // Remove path and port
      domain = domain.split('/')[0].split(':')[0];
      // Remove www
      domain = domain.replace(/^www\./, '');
      return domain.toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  }

  private cleanupConnections(): void {
    const now = Date.now();
    const toRemove: string[] = [];

    for (const [key, conn] of this.connections.entries()) {
      if (now - conn.lastUsed.getTime() > this.connectionTTL) {
        toRemove.push(key);
      }
    }

    for (const key of toRemove) {
      const conn = this.connections.get(key);
      if (conn) {
        conn.client.$disconnect().catch(console.error);
        this.connections.delete(key);
      }
    }
  }

  private evictOldestConnection(): void {
    let oldest: string | null = null;
    let oldestTime = Date.now();

    for (const [key, conn] of this.connections.entries()) {
      if (conn.lastUsed.getTime() < oldestTime) {
        oldest = key;
        oldestTime = conn.lastUsed.getTime();
      }
    }

    if (oldest) {
      const conn = this.connections.get(oldest);
      if (conn) {
        conn.client.$disconnect().catch(console.error);
        this.connections.delete(oldest);
      }
    }
  }

  private async getFromCache(key: string): Promise<any> {
    try {
      if (this.cache instanceof Map) {
        return this.cache.get(key);
      }
      const cached = await this.cache.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  private async saveToCache(key: string, value: any, ttl = 300): Promise<void> {
    try {
      if (this.cache instanceof Map) {
        this.cache.set(key, value);
      } else {
        await this.cache.set(key, JSON.stringify(value), 'EX', ttl);
      }
    } catch (error) {
      console.error('Cache save failed:', error);
    }
  }

  private async clearCache(key: string): Promise<void> {
    try {
      if (this.cache instanceof Map) {
        this.cache.delete(key);
      } else {
        await this.cache.del(key);
      }
    } catch (error) {
      console.error('Cache clear failed:', error);
    }
  }

  async disconnect(): Promise<void> {
    // Disconnect all tenant connections
    for (const conn of this.connections.values()) {
      await conn.client.$disconnect();
    }
    this.connections.clear();

    // Disconnect public client
    await this.publicClient.$disconnect();
  }
}

// Singleton instance
let tenantManager: TenantManager | null = null;

export function getTenantManager(): TenantManager {
  if (!tenantManager) {
    tenantManager = new TenantManager();
  }
  return tenantManager;
}

export { TenantManager };
export type { TenantConfig };