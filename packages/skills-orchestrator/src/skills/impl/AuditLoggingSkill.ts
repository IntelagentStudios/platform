import { BaseSkill } from '../BaseSkill';
import { SkillResult, SkillParams, SkillMetadata, SkillCategory } from '../../types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuditLoggingSkill extends BaseSkill {
  metadata: SkillMetadata = {
    id: 'audit_logging',
    name: 'Audit & Logging Service',
    description: 'Comprehensive audit logging and activity tracking for all system operations',
    category: SkillCategory.AUTOMATION,
    version: '1.0.0',
    author: 'Intelagent Platform',
    tags: ['audit', 'logging', 'compliance', 'tracking', 'monitoring', 'security']
  };

  async executeImpl(params: SkillParams): Promise<SkillResult> {
    const { action, licenseKey, data } = params;

    if (!licenseKey) {
      return this.error('License key is required');
    }

    try {
      switch (action) {
        // Logging Operations
        case 'log_activity':
          return await this.logActivity(licenseKey, data);
        case 'log_error':
          return await this.logError(licenseKey, data);
        case 'log_security_event':
          return await this.logSecurityEvent(licenseKey, data);
        case 'log_api_call':
          return await this.logApiCall(licenseKey, data);

        // Audit Trail Operations
        case 'create_audit_trail':
          return await this.createAuditTrail(licenseKey, data);
        case 'get_audit_trail':
          return await this.getAuditTrail(licenseKey, data);
        case 'verify_audit_integrity':
          return await this.verifyAuditIntegrity(licenseKey, data.auditId);

        // Query Operations
        case 'search_logs':
          return await this.searchLogs(licenseKey, data);
        case 'get_activity_summary':
          return await this.getActivitySummary(licenseKey, data);
        case 'get_user_activities':
          return await this.getUserActivities(licenseKey, data);

        // Compliance Operations
        case 'generate_compliance_report':
          return await this.generateComplianceReport(licenseKey, data);
        case 'export_audit_logs':
          return await this.exportAuditLogs(licenseKey, data);
        case 'retain_logs':
          return await this.retainLogs(licenseKey, data);

        // Analytics Operations
        case 'analyze_patterns':
          return await this.analyzeActivityPatterns(licenseKey, data);
        case 'detect_anomalies':
          return await this.detectAnomalies(licenseKey, data);

        default:
          return this.error(`Unknown action: ${action}`);
      }
    } catch (error: any) {
      this.log(`Error in AuditLoggingSkill: ${error.message}`, 'error');
      return this.error(error.message);
    }
  }

  private async logActivity(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const {
        activityType,
        description,
        agentId,
        userId,
        metadata,
        severity = 'info',
        category = 'general'
      } = data;

      // Create activity log
      const log = await prisma.activity_logs.create({
        data: {
          license_key: licenseKey,
          activity_type: activityType,
          description,
          agent_id: agentId,
          user_id: userId,
          severity,
          category,
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString(),
            source: 'audit_logging'
          },
          ip_address: data.ipAddress,
          user_agent: data.userAgent,
          created_at: new Date()
        }
      });

      // Check for critical activities that need immediate attention
      if (severity === 'critical' || severity === 'error') {
        await this.notifyManagement(licenseKey, {
          type: 'critical_activity',
          logId: log.id,
          activityType,
          description,
          severity
        });
      }

      // Update real-time activity metrics
      await this.updateActivityMetrics(licenseKey, activityType);

      return this.success({
        logId: log.id,
        logged: true,
        severity,
        message: 'Activity logged successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to log activity: ${error.message}`);
    }
  }

  private async logError(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const {
        errorCode,
        errorMessage,
        stackTrace,
        agentId,
        context,
        severity = 'error'
      } = data;

      // Create error log
      const errorLog = await prisma.error_logs.create({
        data: {
          license_key: licenseKey,
          error_code: errorCode,
          error_message: errorMessage,
          stack_trace: stackTrace,
          agent_id: agentId,
          severity,
          context: context || {},
          resolved: false,
          created_at: new Date()
        }
      });

      // Also create an activity log for tracking
      await this.logActivity(licenseKey, {
        activityType: 'error_occurred',
        description: `Error: ${errorCode} - ${errorMessage}`,
        agentId,
        metadata: {
          errorId: errorLog.id,
          errorCode,
          context
        },
        severity
      });

      // For critical errors, create an alert
      if (severity === 'critical') {
        await prisma.alerts.create({
          data: {
            license_key: licenseKey,
            alert_type: 'system_error',
            severity: 'critical',
            message: errorMessage,
            source: agentId || 'system',
            metadata: {
              errorId: errorLog.id,
              errorCode,
              stackTrace
            },
            status: 'active'
          }
        });
      }

      return this.success({
        errorLogId: errorLog.id,
        logged: true,
        alertCreated: severity === 'critical',
        message: 'Error logged successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to log error: ${error.message}`);
    }
  }

  private async logSecurityEvent(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const {
        eventType,
        description,
        userId,
        agentId,
        ipAddress,
        riskLevel = 'medium',
        action: securityAction
      } = data;

      // Create security log
      const securityLog = await prisma.security_logs.create({
        data: {
          license_key: licenseKey,
          event_type: eventType,
          description,
          user_id: userId,
          agent_id: agentId,
          ip_address: ipAddress,
          risk_level: riskLevel,
          action_taken: securityAction,
          metadata: data.metadata || {},
          created_at: new Date()
        }
      });

      // Log as activity
      await this.logActivity(licenseKey, {
        activityType: 'security_event',
        description: `Security Event: ${eventType}`,
        agentId,
        userId,
        metadata: {
          securityLogId: securityLog.id,
          eventType,
          riskLevel
        },
        severity: riskLevel === 'high' ? 'warning' : 'info',
        category: 'security'
      });

      // Notify security management agent for high-risk events
      if (riskLevel === 'high' || riskLevel === 'critical') {
        await this.notifyManagement(licenseKey, {
          type: 'security_alert',
          target: 'security',
          securityLogId: securityLog.id,
          eventType,
          riskLevel,
          description
        });
      }

      return this.success({
        securityLogId: securityLog.id,
        riskLevel,
        notified: riskLevel === 'high' || riskLevel === 'critical',
        message: 'Security event logged'
      });
    } catch (error: any) {
      return this.error(`Failed to log security event: ${error.message}`);
    }
  }

  private async logApiCall(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const {
        endpoint,
        method,
        statusCode,
        responseTime,
        userId,
        agentId,
        requestData,
        responseData
      } = data;

      // Create API log
      const apiLog = await prisma.api_logs.create({
        data: {
          license_key: licenseKey,
          endpoint,
          method,
          status_code: statusCode,
          response_time: responseTime,
          user_id: userId,
          agent_id: agentId,
          request_data: requestData || {},
          response_data: responseData || {},
          created_at: new Date()
        }
      });

      // Update API usage metrics
      await prisma.usage_tracking.create({
        data: {
          license_key: licenseKey,
          agent_id: agentId,
          period: 'real-time',
          api_calls: 1,
          custom_metrics: {
            endpoint,
            method,
            statusCode,
            responseTime
          },
          timestamp: new Date()
        }
      });

      return this.success({
        apiLogId: apiLog.id,
        logged: true,
        message: 'API call logged'
      });
    } catch (error: any) {
      return this.error(`Failed to log API call: ${error.message}`);
    }
  }

  private async createAuditTrail(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const {
        entity,
        entityId,
        action: auditAction,
        changes,
        userId,
        agentId,
        reason
      } = data;

      // Create audit trail entry
      const audit = await prisma.audit_trails.create({
        data: {
          license_key: licenseKey,
          entity,
          entity_id: entityId,
          action: auditAction,
          changes: changes || {},
          previous_values: data.previousValues || {},
          user_id: userId,
          agent_id: agentId,
          reason,
          metadata: {
            timestamp: new Date().toISOString(),
            hash: this.generateAuditHash(data)
          },
          created_at: new Date()
        }
      });

      // Log the audit trail creation
      await this.logActivity(licenseKey, {
        activityType: 'audit_trail_created',
        description: `Audit trail created for ${entity} ${entityId}: ${auditAction}`,
        agentId,
        userId,
        metadata: {
          auditId: audit.id,
          entity,
          action: auditAction
        },
        category: 'audit'
      });

      return this.success({
        auditId: audit.id,
        entity,
        action: auditAction,
        message: 'Audit trail created'
      });
    } catch (error: any) {
      return this.error(`Failed to create audit trail: ${error.message}`);
    }
  }

  private async getAuditTrail(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { entity, entityId, startDate, endDate, limit = 100 } = data;

      const whereClause: any = {
        license_key: licenseKey
      };

      if (entity) whereClause.entity = entity;
      if (entityId) whereClause.entity_id = entityId;
      if (startDate || endDate) {
        whereClause.created_at = {};
        if (startDate) whereClause.created_at.gte = new Date(startDate);
        if (endDate) whereClause.created_at.lte = new Date(endDate);
      }

      const auditTrail = await prisma.audit_trails.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        take: limit
      });

      const trail = auditTrail.map(entry => ({
        id: entry.id,
        entity: entry.entity,
        entityId: entry.entity_id,
        action: entry.action,
        changes: entry.changes,
        userId: entry.user_id,
        agentId: entry.agent_id,
        reason: entry.reason,
        timestamp: entry.created_at
      }));

      return this.success({
        trail,
        count: trail.length,
        filters: { entity, entityId, startDate, endDate },
        message: 'Audit trail retrieved'
      });
    } catch (error: any) {
      return this.error(`Failed to get audit trail: ${error.message}`);
    }
  }

  private async verifyAuditIntegrity(licenseKey: string, auditId: string): Promise<SkillResult> {
    try {
      const audit = await prisma.audit_trails.findFirst({
        where: {
          license_key: licenseKey,
          id: auditId
        }
      });

      if (!audit) {
        return this.error('Audit entry not found');
      }

      // Verify hash integrity
      const expectedHash = this.generateAuditHash({
        entity: audit.entity,
        entityId: audit.entity_id,
        action: audit.action,
        changes: audit.changes,
        userId: audit.user_id,
        agentId: audit.agent_id
      });

      const isValid = (audit.metadata as any)?.hash === expectedHash;

      if (!isValid) {
        // Log integrity violation
        await this.logSecurityEvent(licenseKey, {
          eventType: 'audit_integrity_violation',
          description: `Audit integrity check failed for audit ${auditId}`,
          riskLevel: 'high',
          action: 'investigation_required'
        });
      }

      return this.success({
        auditId,
        valid: isValid,
        hash: (audit.metadata as any)?.hash,
        message: isValid ? 'Audit integrity verified' : 'Audit integrity violation detected'
      });
    } catch (error: any) {
      return this.error(`Failed to verify audit integrity: ${error.message}`);
    }
  }

  private async searchLogs(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const {
        query,
        logType = 'activity',
        startDate,
        endDate,
        severity,
        category,
        limit = 100
      } = data;

      let results: any[] = [];

      switch (logType) {
        case 'activity':
          const whereActivity: any = {
            license_key: licenseKey
          };
          if (query) {
            whereActivity.OR = [
              { description: { contains: query, mode: 'insensitive' } },
              { activity_type: { contains: query, mode: 'insensitive' } }
            ];
          }
          if (severity) whereActivity.severity = severity;
          if (category) whereActivity.category = category;
          if (startDate || endDate) {
            whereActivity.created_at = {};
            if (startDate) whereActivity.created_at.gte = new Date(startDate);
            if (endDate) whereActivity.created_at.lte = new Date(endDate);
          }

          const activityLogs = await prisma.activity_logs.findMany({
            where: whereActivity,
            orderBy: { created_at: 'desc' },
            take: limit
          });
          results = activityLogs;
          break;

        case 'error':
          const whereError: any = {
            license_key: licenseKey
          };
          if (query) {
            whereError.OR = [
              { error_message: { contains: query, mode: 'insensitive' } },
              { error_code: { contains: query, mode: 'insensitive' } }
            ];
          }
          if (severity) whereError.severity = severity;

          const errorLogs = await prisma.error_logs.findMany({
            where: whereError,
            orderBy: { created_at: 'desc' },
            take: limit
          });
          results = errorLogs;
          break;

        case 'security':
          const whereSecurity: any = {
            license_key: licenseKey
          };
          if (query) {
            whereSecurity.OR = [
              { description: { contains: query, mode: 'insensitive' } },
              { event_type: { contains: query, mode: 'insensitive' } }
            ];
          }

          const securityLogs = await prisma.security_logs.findMany({
            where: whereSecurity,
            orderBy: { created_at: 'desc' },
            take: limit
          });
          results = securityLogs;
          break;
      }

      return this.success({
        results,
        count: results.length,
        logType,
        query,
        message: 'Logs searched successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to search logs: ${error.message}`);
    }
  }

  private async getActivitySummary(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { period = '24h', groupBy = 'type' } = data;

      const startDate = this.getStartDateForPeriod(period);

      const activities = await prisma.activity_logs.findMany({
        where: {
          license_key: licenseKey,
          created_at: { gte: startDate }
        }
      });

      let summary: any = {};

      switch (groupBy) {
        case 'type':
          summary = this.groupByField(activities, 'activity_type');
          break;
        case 'severity':
          summary = this.groupByField(activities, 'severity');
          break;
        case 'category':
          summary = this.groupByField(activities, 'category');
          break;
        case 'agent':
          summary = this.groupByField(activities, 'agent_id');
          break;
        case 'hourly':
          summary = this.groupByHour(activities);
          break;
      }

      // Calculate statistics
      const stats = {
        total: activities.length,
        critical: activities.filter(a => a.severity === 'critical').length,
        errors: activities.filter(a => a.severity === 'error').length,
        warnings: activities.filter(a => a.severity === 'warning').length,
        info: activities.filter(a => a.severity === 'info').length
      };

      return this.success({
        period,
        groupBy,
        summary,
        stats,
        message: 'Activity summary generated'
      });
    } catch (error: any) {
      return this.error(`Failed to get activity summary: ${error.message}`);
    }
  }

  private async getUserActivities(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { userId, startDate, endDate, limit = 100 } = data;

      const whereClause: any = {
        license_key: licenseKey,
        user_id: userId
      };

      if (startDate || endDate) {
        whereClause.created_at = {};
        if (startDate) whereClause.created_at.gte = new Date(startDate);
        if (endDate) whereClause.created_at.lte = new Date(endDate);
      }

      const activities = await prisma.activity_logs.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        take: limit
      });

      // Get user's audit trail
      const audits = await prisma.audit_trails.findMany({
        where: {
          license_key: licenseKey,
          user_id: userId
        },
        orderBy: { created_at: 'desc' },
        take: 10
      });

      return this.success({
        userId,
        activities: activities.map(a => ({
          id: a.id,
          type: a.activity_type,
          description: a.description,
          severity: a.severity,
          timestamp: a.created_at
        })),
        recentAudits: audits.map(a => ({
          id: a.id,
          entity: a.entity,
          action: a.action,
          timestamp: a.created_at
        })),
        totalActivities: activities.length,
        message: 'User activities retrieved'
      });
    } catch (error: any) {
      return this.error(`Failed to get user activities: ${error.message}`);
    }
  }

  private async generateComplianceReport(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { reportType = 'gdpr', startDate, endDate } = data;

      const report: any = {
        type: reportType,
        generatedAt: new Date().toISOString(),
        period: { startDate, endDate }
      };

      switch (reportType) {
        case 'gdpr':
          // GDPR compliance report
          report.dataProcessing = await this.getDataProcessingActivities(licenseKey, startDate, endDate);
          report.dataAccess = await this.getDataAccessLogs(licenseKey, startDate, endDate);
          report.dataRetention = await this.getDataRetentionStatus(licenseKey);
          report.securityEvents = await this.getSecurityEventsSummary(licenseKey, startDate, endDate);
          break;

        case 'sox':
          // SOX compliance report
          report.financialActivities = await this.getFinancialActivities(licenseKey, startDate, endDate);
          report.accessControls = await this.getAccessControlAudits(licenseKey, startDate, endDate);
          report.changeManagement = await this.getChangeManagementLogs(licenseKey, startDate, endDate);
          break;

        case 'hipaa':
          // HIPAA compliance report
          report.phiAccess = await this.getPHIAccessLogs(licenseKey, startDate, endDate);
          report.encryptionStatus = await this.getEncryptionStatus(licenseKey);
          report.auditControls = await this.getAuditControlStatus(licenseKey);
          break;
      }

      // Store the report
      await prisma.compliance_reports.create({
        data: {
          license_key: licenseKey,
          report_type: reportType,
          report_data: report,
          generated_at: new Date()
        }
      });

      return this.success({
        report,
        reportType,
        message: 'Compliance report generated'
      });
    } catch (error: any) {
      return this.error(`Failed to generate compliance report: ${error.message}`);
    }
  }

  private async exportAuditLogs(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { format = 'json', startDate, endDate, includeTypes = [] } = data;

      // Get all relevant logs
      const whereClause: any = {
        license_key: licenseKey
      };

      if (startDate || endDate) {
        whereClause.created_at = {};
        if (startDate) whereClause.created_at.gte = new Date(startDate);
        if (endDate) whereClause.created_at.lte = new Date(endDate);
      }

      const logs: any = {};

      if (includeTypes.length === 0 || includeTypes.includes('activity')) {
        logs.activities = await prisma.activity_logs.findMany({ where: whereClause });
      }

      if (includeTypes.length === 0 || includeTypes.includes('audit')) {
        logs.audits = await prisma.audit_trails.findMany({ where: whereClause });
      }

      if (includeTypes.length === 0 || includeTypes.includes('error')) {
        logs.errors = await prisma.error_logs.findMany({ where: whereClause });
      }

      if (includeTypes.length === 0 || includeTypes.includes('security')) {
        logs.security = await prisma.security_logs.findMany({ where: whereClause });
      }

      // Format the export
      let exportData: any;
      switch (format) {
        case 'json':
          exportData = JSON.stringify(logs, null, 2);
          break;
        case 'csv':
          exportData = this.convertToCSV(logs);
          break;
        case 'xml':
          exportData = this.convertToXML(logs);
          break;
      }

      // Create export record
      const exportRecord = await prisma.log_exports.create({
        data: {
          license_key: licenseKey,
          export_format: format,
          export_size: exportData.length,
          filters: { startDate, endDate, includeTypes },
          exported_at: new Date()
        }
      });

      return this.success({
        exportId: exportRecord.id,
        format,
        size: exportData.length,
        data: exportData,
        message: 'Audit logs exported successfully'
      });
    } catch (error: any) {
      return this.error(`Failed to export audit logs: ${error.message}`);
    }
  }

  private async retainLogs(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { retentionDays = 90, archiveOld = true } = data;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Archive old logs if requested
      if (archiveOld) {
        // Archive activity logs
        const oldActivities = await prisma.activity_logs.findMany({
          where: {
            license_key: licenseKey,
            created_at: { lt: cutoffDate }
          }
        });

        if (oldActivities.length > 0) {
          await prisma.archived_logs.createMany({
            data: oldActivities.map(log => ({
              license_key: licenseKey,
              log_type: 'activity',
              original_data: log,
              archived_at: new Date()
            }))
          });
        }
      }

      // Delete old logs
      const deleted = {
        activities: await prisma.activity_logs.deleteMany({
          where: {
            license_key: licenseKey,
            created_at: { lt: cutoffDate }
          }
        }),
        errors: await prisma.error_logs.deleteMany({
          where: {
            license_key: licenseKey,
            created_at: { lt: cutoffDate }
          }
        }),
        api: await prisma.api_logs.deleteMany({
          where: {
            license_key: licenseKey,
            created_at: { lt: cutoffDate }
          }
        })
      };

      return this.success({
        retentionDays,
        cutoffDate,
        archived: archiveOld,
        deleted: {
          activities: deleted.activities.count,
          errors: deleted.errors.count,
          api: deleted.api.count
        },
        message: 'Log retention policy applied'
      });
    } catch (error: any) {
      return this.error(`Failed to apply retention policy: ${error.message}`);
    }
  }

  private async analyzeActivityPatterns(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { period = '7d', minOccurrences = 5 } = data;

      const startDate = this.getStartDateForPeriod(period);

      const activities = await prisma.activity_logs.findMany({
        where: {
          license_key: licenseKey,
          created_at: { gte: startDate }
        }
      });

      // Analyze patterns
      const patterns = {
        // Most common activities
        commonActivities: this.findCommonPatterns(activities, 'activity_type', minOccurrences),

        // Peak activity times
        peakTimes: this.findPeakTimes(activities),

        // Agent activity patterns
        agentPatterns: this.analyzeAgentPatterns(activities),

        // Error patterns
        errorPatterns: this.findErrorPatterns(activities),

        // Sequential patterns (activities that often occur together)
        sequentialPatterns: this.findSequentialPatterns(activities)
      };

      return this.success({
        period,
        patterns,
        totalActivities: activities.length,
        message: 'Activity patterns analyzed'
      });
    } catch (error: any) {
      return this.error(`Failed to analyze patterns: ${error.message}`);
    }
  }

  private async detectAnomalies(licenseKey: string, data: any): Promise<SkillResult> {
    try {
      const { threshold = 2, lookbackDays = 30 } = data;

      const activities = await prisma.activity_logs.findMany({
        where: {
          license_key: licenseKey,
          created_at: {
            gte: new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000)
          }
        }
      });

      const anomalies: any[] = [];

      // Detect unusual activity volumes
      const volumeAnomalies = this.detectVolumeAnomalies(activities, threshold);
      if (volumeAnomalies.length > 0) {
        anomalies.push(...volumeAnomalies);
      }

      // Detect unusual access patterns
      const accessAnomalies = this.detectAccessAnomalies(activities, threshold);
      if (accessAnomalies.length > 0) {
        anomalies.push(...accessAnomalies);
      }

      // Detect unusual error rates
      const errorAnomalies = this.detectErrorAnomalies(activities, threshold);
      if (errorAnomalies.length > 0) {
        anomalies.push(...errorAnomalies);
      }

      // Create alerts for significant anomalies
      for (const anomaly of anomalies.filter(a => a.severity === 'high')) {
        await prisma.alerts.create({
          data: {
            license_key: licenseKey,
            alert_type: 'anomaly_detected',
            severity: 'warning',
            message: `Anomaly detected: ${anomaly.description}`,
            source: 'audit_logging',
            metadata: anomaly,
            status: 'active'
          }
        });
      }

      return this.success({
        anomalies,
        count: anomalies.length,
        threshold,
        lookbackDays,
        message: 'Anomaly detection completed'
      });
    } catch (error: any) {
      return this.error(`Failed to detect anomalies: ${error.message}`);
    }
  }

  // Helper methods
  private generateAuditHash(data: any): string {
    // Simple hash generation (in production, use proper cryptographic hashing)
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  private async updateActivityMetrics(licenseKey: string, activityType: string): Promise<void> {
    // Update real-time activity metrics
    const key = `activity_metrics:${licenseKey}:${activityType}`;
    // In production, this would update a real-time metrics store (Redis, etc.)
  }

  private async notifyManagement(licenseKey: string, data: any): Promise<void> {
    // Send notification to management agents
    await prisma.notifications.create({
      data: {
        license_key: licenseKey,
        recipient_type: 'management_agent',
        recipient_id: data.target || 'operations',
        type: data.type,
        priority: data.severity || 'medium',
        title: 'Audit Alert',
        message: JSON.stringify(data),
        status: 'pending'
      }
    });
  }

  private getStartDateForPeriod(period: string): Date {
    const now = new Date();
    const match = period.match(/(\d+)([hdwmy])/);
    if (!match) return new Date(0);

    const [, value, unit] = match;
    const num = parseInt(value);

    switch (unit) {
      case 'h': return new Date(now.getTime() - num * 60 * 60 * 1000);
      case 'd': return new Date(now.getTime() - num * 24 * 60 * 60 * 1000);
      case 'w': return new Date(now.getTime() - num * 7 * 24 * 60 * 60 * 1000);
      case 'm': return new Date(now.getTime() - num * 30 * 24 * 60 * 60 * 1000);
      case 'y': return new Date(now.getTime() - num * 365 * 24 * 60 * 60 * 1000);
      default: return new Date(0);
    }
  }

  private groupByField(items: any[], field: string): Record<string, number> {
    return items.reduce((acc, item) => {
      const key = item[field] || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  private groupByHour(items: any[]): Record<string, number> {
    return items.reduce((acc, item) => {
      const hour = new Date(item.created_at).getHours();
      const key = `${hour}:00`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  private findCommonPatterns(items: any[], field: string, minOccurrences: number): any[] {
    const counts = this.groupByField(items, field);
    return Object.entries(counts)
      .filter(([, count]) => count >= minOccurrences)
      .sort(([, a], [, b]) => b - a)
      .map(([pattern, count]) => ({ pattern, count }));
  }

  private findPeakTimes(activities: any[]): any {
    const hourly = this.groupByHour(activities);
    const peak = Object.entries(hourly)
      .sort(([, a], [, b]) => b - a)[0];

    return {
      hour: peak ? peak[0] : null,
      count: peak ? peak[1] : 0
    };
  }

  private analyzeAgentPatterns(activities: any[]): any {
    const agentActivities = this.groupByField(activities, 'agent_id');
    return Object.entries(agentActivities)
      .map(([agent, count]) => ({ agent, count }))
      .sort((a, b) => b.count - a.count);
  }

  private findErrorPatterns(activities: any[]): any[] {
    const errors = activities.filter(a => a.severity === 'error' || a.severity === 'critical');
    return this.findCommonPatterns(errors, 'activity_type', 2);
  }

  private findSequentialPatterns(activities: any[]): any[] {
    const patterns: Record<string, number> = {};

    for (let i = 0; i < activities.length - 1; i++) {
      const sequence = `${activities[i].activity_type} -> ${activities[i + 1].activity_type}`;
      patterns[sequence] = (patterns[sequence] || 0) + 1;
    }

    return Object.entries(patterns)
      .filter(([, count]) => count > 2)
      .sort(([, a], [, b]) => b - a)
      .map(([pattern, count]) => ({ pattern, count }));
  }

  private detectVolumeAnomalies(activities: any[], threshold: number): any[] {
    // Simplified anomaly detection
    const anomalies: any[] = [];
    const hourlyVolumes = this.groupByHour(activities);
    const volumes = Object.values(hourlyVolumes);
    const avg = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const stdDev = Math.sqrt(volumes.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / volumes.length);

    Object.entries(hourlyVolumes).forEach(([hour, count]) => {
      if (Math.abs(count - avg) > threshold * stdDev) {
        anomalies.push({
          type: 'volume_anomaly',
          hour,
          count,
          expected: avg,
          deviation: (count - avg) / stdDev,
          severity: Math.abs(count - avg) > 3 * stdDev ? 'high' : 'medium',
          description: `Unusual activity volume at ${hour}: ${count} activities (expected: ${avg.toFixed(0)})`
        });
      }
    });

    return anomalies;
  }

  private detectAccessAnomalies(activities: any[], threshold: number): any[] {
    // Detect unusual access patterns
    const anomalies: any[] = [];

    // Group by user and check for unusual access times
    const userActivities = activities.reduce((acc, activity) => {
      if (!activity.user_id) return acc;
      if (!acc[activity.user_id]) acc[activity.user_id] = [];
      acc[activity.user_id].push(new Date(activity.created_at).getHours());
      return acc;
    }, {} as Record<string, number[]>);

    Object.entries(userActivities).forEach(([userId, hours]) => {
      const unusualHours = hours.filter(h => h < 6 || h > 22);
      if (unusualHours.length > threshold) {
        anomalies.push({
          type: 'access_anomaly',
          userId,
          unusualAccessCount: unusualHours.length,
          severity: 'medium',
          description: `User ${userId} accessed system during unusual hours ${unusualHours.length} times`
        });
      }
    });

    return anomalies;
  }

  private detectErrorAnomalies(activities: any[], threshold: number): any[] {
    const anomalies: any[] = [];
    const errors = activities.filter(a => a.severity === 'error' || a.severity === 'critical');
    const errorRate = errors.length / activities.length;

    if (errorRate > 0.1) {  // More than 10% error rate
      anomalies.push({
        type: 'error_rate_anomaly',
        errorRate: (errorRate * 100).toFixed(2),
        errorCount: errors.length,
        totalCount: activities.length,
        severity: errorRate > 0.2 ? 'high' : 'medium',
        description: `High error rate detected: ${(errorRate * 100).toFixed(2)}%`
      });
    }

    return anomalies;
  }

  private convertToCSV(data: any): string {
    // Simplified CSV conversion
    const rows: string[] = [];

    Object.entries(data).forEach(([type, logs]) => {
      if (Array.isArray(logs) && logs.length > 0) {
        const headers = Object.keys(logs[0]);
        rows.push(headers.join(','));
        logs.forEach((log: any) => {
          rows.push(headers.map(h => JSON.stringify(log[h] || '')).join(','));
        });
      }
    });

    return rows.join('\n');
  }

  private convertToXML(data: any): string {
    // Simplified XML conversion
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<audit_logs>\n';

    Object.entries(data).forEach(([type, logs]) => {
      xml += `  <${type}>\n`;
      if (Array.isArray(logs)) {
        logs.forEach((log: any) => {
          xml += '    <entry>\n';
          Object.entries(log).forEach(([key, value]) => {
            xml += `      <${key}>${value}</${key}>\n`;
          });
          xml += '    </entry>\n';
        });
      }
      xml += `  </${type}>\n`;
    });

    xml += '</audit_logs>';
    return xml;
  }

  // Compliance helper methods (simplified implementations)
  private async getDataProcessingActivities(licenseKey: string, startDate?: Date, endDate?: Date): Promise<any> {
    return { activities: [], compliant: true };
  }

  private async getDataAccessLogs(licenseKey: string, startDate?: Date, endDate?: Date): Promise<any> {
    return { accesses: [], authorized: true };
  }

  private async getDataRetentionStatus(licenseKey: string): Promise<any> {
    return { retentionPolicy: '90 days', compliant: true };
  }

  private async getSecurityEventsSummary(licenseKey: string, startDate?: Date, endDate?: Date): Promise<any> {
    return { events: [], incidents: 0 };
  }

  private async getFinancialActivities(licenseKey: string, startDate?: Date, endDate?: Date): Promise<any> {
    return { transactions: [], audited: true };
  }

  private async getAccessControlAudits(licenseKey: string, startDate?: Date, endDate?: Date): Promise<any> {
    return { audits: [], violations: 0 };
  }

  private async getChangeManagementLogs(licenseKey: string, startDate?: Date, endDate?: Date): Promise<any> {
    return { changes: [], approved: true };
  }

  private async getPHIAccessLogs(licenseKey: string, startDate?: Date, endDate?: Date): Promise<any> {
    return { accesses: [], encrypted: true };
  }

  private async getEncryptionStatus(licenseKey: string): Promise<any> {
    return { encrypted: true, algorithm: 'AES-256' };
  }

  private async getAuditControlStatus(licenseKey: string): Promise<any> {
    return { enabled: true, compliant: true };
  }

  validate(params: SkillParams): boolean {
    if (!params.action) {
      this.log('Missing required parameter: action', 'error');
      return false;
    }

    const validActions = [
      'log_activity', 'log_error', 'log_security_event', 'log_api_call',
      'create_audit_trail', 'get_audit_trail', 'verify_audit_integrity',
      'search_logs', 'get_activity_summary', 'get_user_activities',
      'generate_compliance_report', 'export_audit_logs', 'retain_logs',
      'analyze_patterns', 'detect_anomalies'
    ];

    if (!validActions.includes(params.action)) {
      this.log(`Invalid action: ${params.action}`, 'error');
      return false;
    }

    return true;
  }
}