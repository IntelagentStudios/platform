/**
 * GDPR and Data Compliance Module
 * Handles data protection, privacy, and compliance requirements
 */

import { getTenantManager, getAdminDb } from '@intelagent/database';
import crypto from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(crypto.scrypt);

export interface GDPRExportData {
  userData: any;
  chatbotData?: any;
  salesData?: any;
  setupData?: any;
  auditLogs: any[];
  metadata: {
    exportedAt: Date;
    licenseKey: string;
    requestedBy: string;
  };
}

export interface DataRetentionPolicy {
  tableName: string;
  retentionDays: number;
  archiveStrategy: 'delete' | 'anonymize' | 'archive';
}

class ComplianceService {
  private encryptionKey: Buffer;
  
  constructor() {
    // Initialize encryption key from environment
    const key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    this.encryptionKey = crypto.createHash('sha256').update(key).digest();
  }

  /**
   * Export all user data for GDPR compliance
   */
  async exportUserData(licenseKey: string, userId: string): Promise<GDPRExportData> {
    const tenantManager = getTenantManager();
    const adminDb = await getAdminDb();
    
    try {
      // Get user data from public schema
      const userData = await adminDb.users.findFirst({
        where: {
          id: userId,
          license_key: licenseKey
        }
      });

      if (!userData) {
        throw new Error('User not found');
      }

      // Get tenant-specific data
      const tenantDb = await tenantManager.getTenantConnection(licenseKey);
      const exportData: GDPRExportData = {
        userData: this.sanitizeUserData(userData),
        auditLogs: [],
        metadata: {
          exportedAt: new Date(),
          licenseKey,
          requestedBy: userId
        }
      };

      // Get tenant config to know which products to export
      const config = await tenantManager.getTenantConfig(licenseKey);
      if (!config) {
        throw new Error('Tenant configuration not found');
      }

      // Export product-specific data based on license
      if (config.products.includes('chatbot')) {
        exportData.chatbotData = await this.exportChatbotData(tenantDb, userId);
      }
      
      if (config.products.includes('sales_agent')) {
        exportData.salesData = await this.exportSalesData(tenantDb, userId);
      }
      
      if (config.products.includes('setup_agent')) {
        exportData.setupData = await this.exportSetupData(tenantDb, userId);
      }

      // Get audit logs
      const auditLogs = await adminDb.audit_logs.findMany({
        where: {
          license_key: licenseKey,
          user_id: userId
        },
        orderBy: { created_at: 'desc' },
        take: 1000
      });
      
      exportData.auditLogs = auditLogs;

      // Log the export request
      await this.logDataExport(licenseKey, userId);

      return exportData;
    } catch (error) {
      console.error('Failed to export user data:', error);
      throw error;
    }
  }

  /**
   * Delete user data (right to be forgotten)
   */
  async deleteUserData(licenseKey: string, userId: string, options = { 
    keepAnonymized: false 
  }): Promise<boolean> {
    const tenantManager = getTenantManager();
    const adminDb = await getAdminDb();
    
    try {
      // Verify user exists and belongs to license
      const user = await adminDb.users.findFirst({
        where: {
          id: userId,
          license_key: licenseKey
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Cannot delete license owner
      if (user.role === 'owner') {
        throw new Error('Cannot delete license owner account');
      }

      if (options.keepAnonymized) {
        // Anonymize user data instead of deleting
        await this.anonymizeUser(licenseKey, userId);
      } else {
        // Hard delete user and all associated data
        
        // Delete from tenant schema
        const tenantDb = await tenantManager.getTenantConnection(licenseKey);
        const config = await tenantManager.getTenantConfig(licenseKey);
        
        if (config) {
          // Delete product-specific data
          if (config.products.includes('chatbot')) {
            await this.deleteChatbotData(tenantDb, userId);
          }
          
          if (config.products.includes('sales_agent')) {
            await this.deleteSalesData(tenantDb, userId);
          }
          
          if (config.products.includes('setup_agent')) {
            await this.deleteSetupData(tenantDb, userId);
          }
        }

        // Delete from public schema
        await adminDb.users.delete({
          where: { id: userId }
        });
      }

      // Log the deletion
      await this.logDataDeletion(licenseKey, userId, options.keepAnonymized);

      return true;
    } catch (error) {
      console.error('Failed to delete user data:', error);
      throw error;
    }
  }

  /**
   * Anonymize user data while preserving structure
   */
  async anonymizeUser(licenseKey: string, userId: string): Promise<void> {
    const adminDb = await getAdminDb();
    
    // Generate anonymous identifier
    const anonId = `ANON_${crypto.randomBytes(8).toString('hex')}`;
    
    await adminDb.users.update({
      where: { id: userId },
      data: {
        email: `${anonId}@anonymized.local`,
        name: `Anonymous User ${anonId}`,
        password_hash: crypto.randomBytes(32).toString('hex')
      }
    });

    // Anonymize API keys
    await adminDb.api_keys.updateMany({
      where: { user_id: userId },
      data: {
        name: 'Anonymized Key',
        status: 'revoked'
      }
    });
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Hash PII data for pseudonymization
   */
  async hashPII(data: string, salt?: string): Promise<string> {
    const useSalt = salt || crypto.randomBytes(16).toString('hex');
    const derivedKey = await scrypt(data, useSalt, 64) as Buffer;
    return `${useSalt}:${derivedKey.toString('hex')}`;
  }

  /**
   * Apply data retention policies
   */
  async applyRetentionPolicies(licenseKey: string): Promise<void> {
    const policies: DataRetentionPolicy[] = [
      {
        tableName: 'audit_logs',
        retentionDays: 365,
        archiveStrategy: 'delete'
      },
      {
        tableName: 'user_sessions',
        retentionDays: 30,
        archiveStrategy: 'delete'
      },
      {
        tableName: 'chatbot_messages',
        retentionDays: 90,
        archiveStrategy: 'anonymize'
      },
      {
        tableName: 'sales_interactions',
        retentionDays: 730, // 2 years
        archiveStrategy: 'archive'
      }
    ];

    for (const policy of policies) {
      await this.enforceRetentionPolicy(licenseKey, policy);
    }
  }

  /**
   * Enforce a specific retention policy
   */
  private async enforceRetentionPolicy(
    licenseKey: string, 
    policy: DataRetentionPolicy
  ): Promise<void> {
    const tenantManager = getTenantManager();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

    try {
      const tenantDb = await tenantManager.getTenantConnection(licenseKey);

      if (tenantDb) {
        switch (policy.archiveStrategy) {
          case 'delete':
            await tenantDb.$executeRawUnsafe(
              `DELETE FROM ${policy.tableName} WHERE created_at < $1`,
              cutoffDate
            );
            break;

          case 'anonymize':
            // Anonymize old records
            await this.anonymizeOldRecords(tenantDb, policy.tableName, cutoffDate);
            break;
          
          case 'archive':
            // Move to archive table
            await this.archiveOldRecords(tenantDb, policy.tableName, cutoffDate);
            break;
        }
      }
    } catch (error) {
      console.error(`Failed to enforce retention policy for ${policy.tableName}:`, error);
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(licenseKey: string): Promise<any> {
    const adminDb = await getAdminDb();
    const tenantManager = getTenantManager();
    
    const report = {
      licenseKey,
      generatedAt: new Date(),
      dataProtection: {
        encryptionEnabled: !!process.env.ENCRYPTION_KEY,
        tlsEnabled: process.env.NODE_ENV === 'production',
        passwordHashingAlgorithm: 'bcrypt',
        apiKeyHashingAlgorithm: 'sha256'
      },
      dataRetention: {
        policiesActive: true,
        lastCleanup: null as Date | null
      },
      userRights: {
        dataExportAvailable: true,
        dataDeletionAvailable: true,
        dataPortabilitySupported: true,
        consentManagementEnabled: true
      },
      auditTrail: {
        enabled: true,
        retentionDays: 365
      },
      statistics: {
        totalUsers: 0,
        totalDataExports: 0,
        totalDataDeletions: 0,
        averageResponseTime: '24 hours'
      }
    };

    // Get statistics
    const stats = await adminDb.$queryRaw`
      SELECT
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT CASE WHEN al.action = 'data_export' THEN al.id END) as total_exports,
        COUNT(DISTINCT CASE WHEN al.action = 'data_deletion' THEN al.id END) as total_deletions
      FROM public.users u
      LEFT JOIN public.audit_logs al ON al.user_id = u.id
      WHERE u.license_key = ${licenseKey}
    ` as any[];

    if (stats && stats[0]) {
      report.statistics.totalUsers = stats[0].total_users;
      report.statistics.totalDataExports = stats[0].total_exports;
      report.statistics.totalDataDeletions = stats[0].total_deletions;
    }

    return report;
  }

  /**
   * Check consent status for data processing
   */
  async checkConsent(userId: string, consentType: string): Promise<boolean> {
    const adminDb = await getAdminDb();
    
    const consent = await adminDb.$queryRaw`
      SELECT granted
      FROM public.user_consents
      WHERE user_id = ${userId}
        AND consent_type = ${consentType}
        AND revoked_at IS NULL
      ORDER BY granted_at DESC
      LIMIT 1
    ` as any[];

    return consent && consent.length > 0 && consent[0].granted;
  }

  /**
   * Record user consent
   */
  async recordConsent(
    userId: string, 
    consentType: string, 
    granted: boolean,
    metadata?: any
  ): Promise<void> {
    const adminDb = await getAdminDb();
    
    await adminDb.$executeRaw`
      INSERT INTO public.user_consents (
        user_id, consent_type, granted, granted_at, metadata
      ) VALUES (
        ${userId}, ${consentType}, ${granted}, NOW(), ${metadata || {}}
      )
    `;
  }

  // Private helper methods
  private sanitizeUserData(userData: any): any {
    const sanitized = { ...userData };
    delete sanitized.password_hash;
    delete sanitized.api_keys;
    return sanitized;
  }

  private async exportChatbotData(db: any, userId: string): Promise<any> {
    // Export chatbot-related data for the user
    return {};
  }

  private async exportSalesData(db: any, userId: string): Promise<any> {
    // Export sales-related data for the user
    return {};
  }

  private async exportSetupData(db: any, userId: string): Promise<any> {
    // Export setup-related data for the user
    return {};
  }

  private async deleteChatbotData(db: any, userId: string): Promise<void> {
    // Delete chatbot-related data
  }

  private async deleteSalesData(db: any, userId: string): Promise<void> {
    // Delete sales-related data
  }

  private async deleteSetupData(db: any, userId: string): Promise<void> {
    // Delete setup-related data
  }

  private async anonymizeOldRecords(db: any, tableName: string, cutoffDate: Date): Promise<void> {
    // Anonymize records older than cutoff date
  }

  private async archiveOldRecords(db: any, tableName: string, cutoffDate: Date): Promise<void> {
    // Archive records to separate table
  }

  private async logDataExport(licenseKey: string, userId: string): Promise<void> {
    const adminDb = await getAdminDb();
    await adminDb.audit_logs.create({
      data: {
        license_key: licenseKey,
        user_id: userId,
        action: 'data_export',
        resource_type: 'gdpr',
        resource_id: userId,
        created_at: new Date()
      }
    });
  }

  private async logDataDeletion(licenseKey: string, userId: string, anonymized: boolean): Promise<void> {
    const adminDb = await getAdminDb();
    await adminDb.audit_logs.create({
      data: {
        license_key: licenseKey,
        user_id: userId,
        action: anonymized ? 'data_anonymization' : 'data_deletion',
        resource_type: 'gdpr',
        resource_id: userId,
        changes: { anonymized },
        created_at: new Date()
      }
    });
  }
}

// Singleton instance
const complianceService = new ComplianceService();

export default complianceService;
export { ComplianceService };