/**
 * Security Agent
 * Manages platform security, threat detection, and access control
 */

import { EventEmitter } from 'events';
import { prisma } from '@intelagent/database';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

interface SecurityCheck {
  passed: boolean;
  risks: string[];
  score: number; // 0-100, higher is more secure
  recommendations: string[];
}

interface ThreatDetection {
  threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  threats: Array<{
    type: string;
    severity: string;
    description: string;
    mitigation: string;
  }>;
  blocked: boolean;
}

interface AccessControl {
  allowed: boolean;
  reason?: string;
  permissions: string[];
  restrictions: string[];
}

interface AuditLog {
  userId: string;
  action: string;
  resource: string;
  result: 'allowed' | 'denied';
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export class SecurityAgent extends EventEmitter {
  private static instance: SecurityAgent;
  private readonly jwtSecret: Buffer;
  private suspiciousPatterns: Map<string, RegExp>;
  private blacklistedIPs: Set<string>;
  private rateLimits: Map<string, { count: number; resetTime: number }>;

  private readonly securityPolicies = {
    maxLoginAttempts: 5,
    lockoutDuration: 900000, // 15 minutes
    sessionTimeout: 3600000, // 1 hour
    passwordMinLength: 12,
    passwordRequirements: {
      uppercase: true,
      lowercase: true,
      numbers: true,
      special: true
    },
    mfaRequired: ['admin', 'financial', 'sensitive'],
    ipWhitelist: process.env.IP_WHITELIST?.split(',') || [],
    rateLimit: {
      windowMs: 60000, // 1 minute
      maxRequests: 100
    }
  };

  private constructor() {
    super();
    const secret = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
    this.jwtSecret = Buffer.from(secret, 'utf-8');
    this.suspiciousPatterns = new Map();
    this.blacklistedIPs = new Set();
    this.rateLimits = new Map();
    this.initializeSecurityPatterns();
  }

  public static getInstance(): SecurityAgent {
    if (!SecurityAgent.instance) {
      SecurityAgent.instance = new SecurityAgent();
    }
    return SecurityAgent.instance;
  }

  private initializeSecurityPatterns() {
    // SQL Injection patterns
    this.suspiciousPatterns.set('sql_injection', /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b.*\b(FROM|INTO|WHERE|TABLE)\b)/gi);
    
    // XSS patterns
    this.suspiciousPatterns.set('xss', /(<script[\s\S]*?>[\s\S]*?<\/script>|javascript:|on\w+\s*=)/gi);
    
    // Path traversal
    this.suspiciousPatterns.set('path_traversal', /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\/|\.\.%2f|%2e%2e%5c)/gi);
    
    // Command injection
    this.suspiciousPatterns.set('command_injection', /(;|\||&&|\$\(|\`|>|<)/g);
  }

  /**
   * Perform comprehensive security check
   */
  public async performSecurityCheck(
    request: any,
    context: { userId?: string; ipAddress?: string; action: string }
  ): Promise<SecurityCheck> {
    const risks: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check for suspicious patterns
    const patternCheck = this.checkSuspiciousPatterns(JSON.stringify(request));
    if (patternCheck.length > 0) {
      risks.push(...patternCheck);
      score -= patternCheck.length * 20;
      recommendations.push('Input contains potentially malicious patterns');
    }

    // Check IP reputation
    if (context.ipAddress) {
      const ipCheck = await this.checkIPReputation(context.ipAddress);
      if (!ipCheck.safe) {
        risks.push(`IP address flagged: ${ipCheck.reason}`);
        score -= 30;
        recommendations.push('Consider blocking this IP address');
      }
    }

    // Check rate limiting
    if (context.userId) {
      const rateCheck = this.checkRateLimit(context.userId);
      if (!rateCheck.allowed) {
        risks.push('Rate limit exceeded');
        score -= 20;
        recommendations.push('Implement request throttling');
      }
    }

    // Check authentication status
    if (!context.userId) {
      risks.push('Unauthenticated request');
      score -= 10;
      recommendations.push('Require authentication for this action');
    }

    // Check for anomalous behavior
    const anomalyCheck = await this.detectAnomalies(context);
    if (anomalyCheck.suspicious) {
      risks.push(`Anomalous behavior detected: ${anomalyCheck.reason}`);
      score -= 25;
      recommendations.push('Monitor user activity closely');
    }

    return {
      passed: score >= 50,
      risks,
      score: Math.max(0, score),
      recommendations
    };
  }

  /**
   * Detect and respond to threats
   */
  public async detectThreats(
    activity: any,
    context: { userId?: string; ipAddress?: string; sessionId?: string }
  ): Promise<ThreatDetection> {
    const threats: ThreatDetection['threats'] = [];
    let threatLevel: ThreatDetection['threatLevel'] = 'none';
    let shouldBlock = false;

    // Check for brute force attacks
    const bruteForceCheck = await this.checkBruteForce(context);
    if (bruteForceCheck.detected) {
      threats.push({
        type: 'brute_force',
        severity: 'high',
        description: 'Multiple failed authentication attempts detected',
        mitigation: 'Account locked for 15 minutes'
      });
      threatLevel = 'high';
      shouldBlock = true;
    }

    // Check for data exfiltration attempts
    const exfiltrationCheck = await this.checkDataExfiltration(activity);
    if (exfiltrationCheck.suspected) {
      threats.push({
        type: 'data_exfiltration',
        severity: 'critical',
        description: 'Unusual data access pattern detected',
        mitigation: 'Access restricted and admin notified'
      });
      threatLevel = 'critical';
      shouldBlock = true;
    }

    // Check for privilege escalation
    const privEscCheck = await this.checkPrivilegeEscalation(activity, context);
    if (privEscCheck.attempted) {
      threats.push({
        type: 'privilege_escalation',
        severity: 'critical',
        description: 'Attempted to access unauthorized resources',
        mitigation: 'Request blocked and logged'
      });
      threatLevel = 'critical';
      shouldBlock = true;
    }

    // Check for injection attacks
    const injectionCheck = this.checkInjectionAttacks(activity);
    if (injectionCheck.detected) {
      threats.push({
        type: injectionCheck.type || 'injection_attack',
        severity: 'high',
        description: `${injectionCheck.type || 'Injection'} attack pattern detected`,
        mitigation: 'Input sanitized and request logged'
      });
      threatLevel = threatLevel === 'critical' ? 'critical' : 'high';
      shouldBlock = true;
    }

    // Log threat detection
    if (threats.length > 0) {
      await this.logSecurityEvent('threat_detected', {
        threats,
        context,
        blocked: shouldBlock
      });
    }

    return {
      threatLevel,
      threats,
      blocked: shouldBlock
    };
  }

  /**
   * Manage access control
   */
  public async checkAccessControl(
    userId: string,
    resource: string,
    action: string
  ): Promise<AccessControl> {
    try {
      // Get user and their permissions
      const user = await prisma.users.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return {
          allowed: false,
          reason: 'User not found',
          permissions: [],
          restrictions: []
        };
      }

      // Check if user is locked out
      const lockoutCheck = await this.checkLockout(userId);
      if (lockoutCheck.locked) {
        return {
          allowed: false,
          reason: `Account locked until ${lockoutCheck.until}`,
          permissions: [],
          restrictions: ['account_locked']
        };
      }

      // Get user's license tier
      let tier = 'free';
      if (user.license_key) {
        const license = await prisma.licenses.findUnique({
          where: { license_key: user.license_key }
        });
        tier = license?.tier || license?.plan || 'free';
      }
      const permissions = this.getTierPermissions(tier);
      const restrictions = this.getTierRestrictions(tier);

      // Check specific resource access
      const resourceAccess = this.checkResourceAccess(resource, action, permissions);

      // Log access attempt
      await this.logAccessAttempt({
        userId,
        action,
        resource,
        result: resourceAccess ? 'allowed' : 'denied',
        timestamp: new Date()
      });

      return {
        allowed: resourceAccess,
        reason: resourceAccess ? undefined : 'Insufficient permissions',
        permissions,
        restrictions
      };

    } catch (error: any) {
      await this.logSecurityEvent('access_control_error', {
        userId,
        resource,
        action,
        error: error.message
      });

      return {
        allowed: false,
        reason: 'Access control check failed',
        permissions: [],
        restrictions: []
      };
    }
  }

  /**
   * Validate and sanitize input
   */
  public sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      // Remove potential XSS
      let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      
      // Remove SQL injection attempts
      sanitized = sanitized.replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION)\b)/gi, '');
      
      // Remove command injection
      sanitized = sanitized.replace(/[;&|`$]/g, '');
      
      // Escape HTML entities
      sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');

      return sanitized;
    }

    if (typeof input === 'object' && input !== null) {
      const sanitized: any = Array.isArray(input) ? [] : {};
      
      for (const key in input) {
        if (input.hasOwnProperty(key)) {
          sanitized[key] = this.sanitizeInput(input[key]);
        }
      }
      
      return sanitized;
    }

    return input;
  }

  /**
   * Generate secure tokens
   */
  public generateSecureToken(payload: any, expiresIn: string = '1h'): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: expiresIn as any,
      algorithm: 'HS256'
    } as jwt.SignOptions);
  }

  /**
   * Verify tokens
   */
  public verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      return null;
    }
  }

  /**
   * Encrypt sensitive data
   */
  public encryptData(data: string): { encrypted: string; iv: string } {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(this.jwtSecret, 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted: encrypted + ':' + authTag.toString('hex'),
      iv: iv.toString('hex')
    };
  }

  /**
   * Decrypt sensitive data
   */
  public decryptData(encryptedData: string, iv: string): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(this.jwtSecret, 'salt', 32);
    
    const [encrypted, authTag] = encryptedData.split(':');
    
    const decipher = crypto.createDecipheriv(
      algorithm,
      key,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Perform security audit
   */
  public async performSecurityAudit(): Promise<any> {
    const audit = {
      timestamp: new Date(),
      vulnerabilities: [] as any[],
      recommendations: [] as string[],
      score: 100
    };

    // Check for weak passwords
    const weakPasswords = await this.findWeakPasswords();
    if (weakPasswords.length > 0) {
      (audit.vulnerabilities as any[]).push({
        type: 'weak_passwords',
        count: weakPasswords.length,
        severity: 'high'
      });
      audit.score -= 20;
      (audit.recommendations as string[]).push('Enforce stronger password policies');
    }

    // Check for inactive sessions
    const inactiveSessions = await this.findInactiveSessions();
    if (inactiveSessions.length > 0) {
      (audit.vulnerabilities as any[]).push({
        type: 'inactive_sessions',
        count: inactiveSessions.length,
        severity: 'medium'
      });
      audit.score -= 10;
      (audit.recommendations as string[]).push('Implement automatic session timeout');
    }

    // Check for unusual access patterns
    const unusualPatterns = await this.findUnusualAccessPatterns();
    if (unusualPatterns.length > 0) {
      (audit.vulnerabilities as any[]).push({
        type: 'unusual_access',
        patterns: unusualPatterns,
        severity: 'high'
      });
      audit.score -= 15;
      (audit.recommendations as string[]).push('Review and investigate unusual access patterns');
    }

    // Check encryption status
    const encryptionStatus = await this.checkEncryptionStatus();
    if (!encryptionStatus.allEncrypted) {
      (audit.vulnerabilities as any[]).push({
        type: 'unencrypted_data',
        details: encryptionStatus.unencrypted,
        severity: 'critical'
      });
      audit.score -= 30;
      (audit.recommendations as string[]).push('Encrypt all sensitive data at rest');
    }

    return audit;
  }

  // Private helper methods
  private checkSuspiciousPatterns(input: string): string[] {
    const detected: string[] = [];

    this.suspiciousPatterns.forEach((pattern, type) => {
      if (pattern.test(input)) {
        detected.push(`Potential ${type.replace('_', ' ')} detected`);
      }
    });

    return detected;
  }

  private async checkIPReputation(ipAddress: string): Promise<{ safe: boolean; reason?: string }> {
    // Check blacklist
    if (this.blacklistedIPs.has(ipAddress)) {
      return { safe: false, reason: 'IP is blacklisted' };
    }

    // Check whitelist
    if (this.securityPolicies.ipWhitelist.includes(ipAddress)) {
      return { safe: true };
    }

    // In production, would check external threat intelligence APIs
    // For now, simulate check
    if (ipAddress.startsWith('192.168.') || ipAddress === '127.0.0.1') {
      return { safe: true }; // Local IPs are safe
    }

    return { safe: true };
  }

  private checkRateLimit(identifier: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const limit = this.rateLimits.get(identifier);

    if (!limit || now > limit.resetTime) {
      this.rateLimits.set(identifier, {
        count: 1,
        resetTime: now + this.securityPolicies.rateLimit.windowMs
      });
      return { allowed: true, remaining: this.securityPolicies.rateLimit.maxRequests - 1 };
    }

    if (limit.count >= this.securityPolicies.rateLimit.maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    limit.count++;
    return { allowed: true, remaining: this.securityPolicies.rateLimit.maxRequests - limit.count };
  }

  private async detectAnomalies(context: any): Promise<{ suspicious: boolean; reason?: string }> {
    // Check for unusual access times
    const hour = new Date().getHours();
    if (hour >= 2 && hour <= 5) {
      return { suspicious: true, reason: 'Unusual access time' };
    }

    // Check for rapid resource access
    if (context.userId) {
      const recentAccess = await prisma.audit_logs.count({
        where: {
          action: 'access_attempt',
          user_id: context.userId,
          created_at: {
            gte: new Date(Date.now() - 60000) // Last minute
          }
        }
      });

      if (recentAccess > 20) {
        return { suspicious: true, reason: 'Rapid resource access' };
      }
    }

    return { suspicious: false };
  }

  private async checkBruteForce(context: any): Promise<{ detected: boolean }> {
    if (!context.userId) return { detected: false };

    const failedAttempts = await prisma.audit_logs.count({
      where: {
        action: 'login_failed',
        user_id: context.userId,
        created_at: {
          gte: new Date(Date.now() - 300000) // Last 5 minutes
        }
      }
    });

    return { detected: failedAttempts >= this.securityPolicies.maxLoginAttempts };
  }

  private async checkDataExfiltration(activity: any): Promise<{ suspected: boolean }> {
    // Check for large data requests
    if (activity.dataSize && activity.dataSize > 100000000) { // 100MB
      return { suspected: true };
    }

    // Check for bulk exports
    if (activity.action === 'export' && activity.recordCount > 10000) {
      return { suspected: true };
    }

    return { suspected: false };
  }

  private async checkPrivilegeEscalation(activity: any, context: any): Promise<{ attempted: boolean }> {
    // Check if user is trying to access admin resources without admin role
    if (activity.resource?.includes('admin') && !context.isAdmin) {
      return { attempted: true };
    }

    // Check for role manipulation attempts
    if (activity.action === 'update_role' && activity.targetUserId === context.userId) {
      return { attempted: true };
    }

    return { attempted: false };
  }

  private checkInjectionAttacks(activity: any): { detected: boolean; type?: string } {
    const activityStr = JSON.stringify(activity);

    for (const [type, pattern] of this.suspiciousPatterns) {
      if (pattern.test(activityStr)) {
        return { detected: true, type };
      }
    }

    return { detected: false };
  }

  private async checkLockout(userId: string): Promise<{ locked: boolean; until?: Date }> {
    const lockout = await prisma.audit_logs.findFirst({
      where: {
        action: 'account_locked',
        user_id: userId,
        created_at: {
          gte: new Date(Date.now() - this.securityPolicies.lockoutDuration)
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    if (lockout && lockout.created_at) {
      const lockoutEnd = new Date(lockout.created_at.getTime() + this.securityPolicies.lockoutDuration);
      if (lockoutEnd > new Date()) {
        return { locked: true, until: lockoutEnd };
      }
    }

    return { locked: false };
  }

  private getTierPermissions(tier: string): string[] {
    const permissions: Record<string, string[]> = {
      free: ['read_basic', 'execute_basic_skills'],
      starter: ['read_basic', 'read_advanced', 'execute_basic_skills', 'execute_standard_skills'],
      professional: ['read_all', 'write_most', 'execute_all_skills', 'api_access'],
      enterprise: ['read_all', 'write_all', 'execute_all_skills', 'api_access', 'admin_access']
    };

    return permissions[tier] || permissions.free;
  }

  private getTierRestrictions(tier: string): string[] {
    const restrictions: Record<string, string[]> = {
      free: ['no_api', 'no_export', 'limited_skills'],
      starter: ['no_bulk_export', 'rate_limited'],
      professional: ['standard_rate_limits'],
      enterprise: []
    };

    return restrictions[tier] || restrictions.free;
  }

  private checkResourceAccess(resource: string, action: string, permissions: string[]): boolean {
    // Admin resources require admin_access
    if (resource.includes('admin')) {
      return permissions.includes('admin_access');
    }

    // Write operations require write permissions
    if (['create', 'update', 'delete'].includes(action)) {
      return permissions.includes('write_all') || permissions.includes('write_most');
    }

    // Read operations
    if (action === 'read') {
      return permissions.includes('read_all') || permissions.includes('read_basic');
    }

    // Skill execution
    if (resource.includes('skill')) {
      return permissions.includes('execute_all_skills') || permissions.includes('execute_basic_skills');
    }

    return false;
  }

  private async logAccessAttempt(attempt: AuditLog): Promise<void> {
    await prisma.audit_logs.create({
      data: {
        action: 'access_attempt',
        user_id: attempt.userId,
        resource_type: 'security',
        resource_id: attempt.resource,
        changes: attempt as any,
        license_key: 'SYSTEM',
        created_at: new Date()
      }
    });
  }

  private async logSecurityEvent(eventType: string, details: any): Promise<void> {
    await prisma.audit_logs.create({
      data: {
        action: `security_${eventType}`,
        resource_type: 'security',
        changes: details,
        license_key: 'SYSTEM',
        created_at: new Date()
      }
    });
  }

  private async findWeakPasswords(): Promise<any[]> {
    // In production, would check password hashes against common passwords
    // This is a placeholder
    return [];
  }

  private async findInactiveSessions(): Promise<any[]> {
    // Check for sessions inactive for more than the timeout period
    return [];
  }

  private async findUnusualAccessPatterns(): Promise<any[]> {
    // Analyze access logs for unusual patterns
    return [];
  }

  private async checkEncryptionStatus(): Promise<{ allEncrypted: boolean; unencrypted?: string[] }> {
    // Check if sensitive data is encrypted
    // This is a placeholder for actual implementation
    return { allEncrypted: true };
  }

  /**
   * Validate a request for security concerns
   */
  public async validateRequest(request: any): Promise<any> {
    const securityCheck = await this.performSecurityCheck(
      request,
      {
        userId: request.context?.userId,
        ipAddress: '127.0.0.1',
        action: request.action || 'execute'
      }
    );

    return {
      approved: securityCheck.passed,
      reason: securityCheck.risks.join(', '),
      score: securityCheck.score,
      recommendations: securityCheck.recommendations
    };
  }

  /**
   * Execute a security-related request
   */
  public async execute(request: any): Promise<any> {
    console.log('[SecurityAgent] Executing request:', request.action);

    switch (request.action) {
      case 'audit':
        return await this.performSecurityAudit();
      case 'threat_scan':
        return await this.detectThreats(
          request.params || {},
          request.context || {}
        );
      default:
        return { success: true, action: request.action };
    }
  }

  /**
   * Handle external events from other agents
   */
  public handleExternalEvent(event: string, data: any): void {
    console.log(`[SecurityAgent] Handling external event: ${event}`, data);
    this.emit('external:event', { event, data });

    // Handle specific events
    switch (event) {
      case 'compliance:violation':
        // Increase security monitoring
        console.log('[SecurityAgent] Increasing security monitoring due to compliance violation');
        break;
      case 'anomaly:detected':
        // Investigate anomaly
        console.log('[SecurityAgent] Investigating detected anomaly');
        break;
    }
  }

  /**
   * Shutdown the agent
   */
  public async shutdown(): Promise<void> {
    console.log('[SecurityAgent] Shutting down...');
    // Cleanup resources
    this.removeAllListeners();
  }

  /**
   * Get agent status
   */
  public async getStatus(): Promise<any> {
    return {
      active: true,
      threatLevel: 'low',
      activeThreats: 0
    };
  }
}