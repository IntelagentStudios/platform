/**
 * Management Team Architecture
 * All 8 management agents that coordinate skill execution
 * Each agent is responsible for specific domains
 */

import { EventEmitter } from 'events';
import { FinanceAgent } from './FinanceAgent';
import { OperationsAgent } from './OperationsAgent';
import { InfrastructureAgent } from './InfrastructureAgent';
import { SecurityAgent } from './SecurityAgent';
import { ComplianceAgent } from './ComplianceAgent';
import { IntegrationAgent } from './IntegrationAgent';
import { AnalyticsAgent } from './AnalyticsAgent';
import { CommunicationsAgent } from './CommunicationsAgent';
import { SkillsMatrix } from './SkillsMatrix';
import { v4 as uuidv4 } from 'uuid';

export interface ManagementRequest {
  id?: string;
  type: 'skill' | 'workflow' | 'system';
  action: string;
  params: any;
  context: {
    userId: string;
    sessionId?: string;
    priority?: 'low' | 'normal' | 'high' | 'critical';
    licenseKey?: string;
  };
}

export interface ManagementDecision {
  approved: boolean;
  reason?: string;
  agents: string[];
  routing: string;
  requirements?: string[];
  warnings?: string[];
  estimatedCost?: number;
  estimatedTime?: number;
}

export interface ManagementResult {
  requestId: string;
  success: boolean;
  decision: ManagementDecision;
  results?: any;
  errors?: string[];
  audit: AuditTrail[];
}

export interface AuditTrail {
  timestamp: Date;
  agent: string;
  action: string;
  details: any;
}

/**
 * Central Management Team
 * Coordinates all 8 agents and makes collective decisions
 */
export class ManagementTeam extends EventEmitter {
  private static instance: ManagementTeam;
  
  // All 8 Management Agents
  private finance: FinanceAgent;
  private operations: OperationsAgent;
  private infrastructure: InfrastructureAgent;
  private security: SecurityAgent;
  private compliance: ComplianceAgent;
  private integration: IntegrationAgent;
  private analytics: AnalyticsAgent;
  private communications: CommunicationsAgent;
  
  // Skills Matrix for agent-skill mapping
  private skillsMatrix: SkillsMatrix;
  
  // Active requests tracking
  private activeRequests = new Map<string, ManagementRequest>();
  private auditLog = new Map<string, AuditTrail[]>();

  private constructor() {
    super();
    this.initializeAgents();
    this.setupInterAgentCommunication();
  }

  public static getInstance(): ManagementTeam {
    if (!ManagementTeam.instance) {
      ManagementTeam.instance = new ManagementTeam();
    }
    return ManagementTeam.instance;
  }

  /**
   * Initialize all 8 management agents
   */
  private initializeAgents(): void {
    console.log('[ManagementTeam] Initializing all 8 agents...');
    
    // Initialize core management agents
    this.finance = FinanceAgent.getInstance();
    this.operations = OperationsAgent.getInstance();
    this.infrastructure = InfrastructureAgent.getInstance();
    this.security = SecurityAgent.getInstance();
    
    // Initialize specialized agents
    this.compliance = new ComplianceAgent();
    this.integration = new IntegrationAgent();
    this.analytics = new AnalyticsAgent();
    this.communications = new CommunicationsAgent();
    
    // Initialize skills matrix
    this.skillsMatrix = SkillsMatrix.getInstance();
    
    console.log('[ManagementTeam] All 8 agents initialized with 310 skills');
  }

  /**
   * Setup inter-agent communication channels
   */
  private setupInterAgentCommunication(): void {
    // Finance events
    this.finance.on('payment:required', (data) => 
      this.handleCrossAgentEvent('finance', 'payment:required', data)
    );
    
    // Security events
    this.security.on('threat:detected', (data) =>
      this.handleCrossAgentEvent('security', 'threat:detected', data)
    );
    
    // Operations events
    this.operations.on('workflow:started', (data) =>
      this.handleCrossAgentEvent('operations', 'workflow:started', data)
    );
    
    // Infrastructure events
    this.infrastructure.on('resource:limit', (data) =>
      this.handleCrossAgentEvent('infrastructure', 'resource:limit', data)
    );
    
    // Compliance events
    this.compliance.on('violation:detected', (data) =>
      this.handleCrossAgentEvent('compliance', 'violation:detected', data)
    );
    
    // Integration events
    this.integration.on('api:failed', (data) =>
      this.handleCrossAgentEvent('integration', 'api:failed', data)
    );
    
    // Analytics events
    this.analytics.on('anomaly:detected', (data) =>
      this.handleCrossAgentEvent('analytics', 'anomaly:detected', data)
    );
    
    // Communications events
    this.communications.on('delivery:failed', (data) =>
      this.handleCrossAgentEvent('communications', 'delivery:failed', data)
    );
    
    console.log('[ManagementTeam] Inter-agent communication established');
  }

  /**
   * Process a management request through all agents
   */
  public async processRequest(request: ManagementRequest): Promise<ManagementResult> {
    const requestId = request.id || uuidv4();
    request.id = requestId;
    
    this.activeRequests.set(requestId, request);
    const audit: AuditTrail[] = [];
    
    try {
      // Step 1: Security validation
      const securityCheck = await this.security.validateRequest(request);
      audit.push({
        timestamp: new Date(),
        agent: 'security',
        action: 'validate',
        details: securityCheck
      });
      
      if (!securityCheck.approved) {
        return this.createResult(requestId, false, securityCheck, audit, 
          ['Security validation failed: ' + securityCheck.reason]
        );
      }
      
      // Step 2: Compliance validation
      const complianceCheck = await this.compliance.validateRequest(request);
      audit.push({
        timestamp: new Date(),
        agent: 'compliance',
        action: 'validate',
        details: complianceCheck
      });
      
      if (!complianceCheck.approved) {
        return this.createResult(requestId, false, complianceCheck, audit,
          ['Compliance validation failed: ' + complianceCheck.reason]
        );
      }
      
      // Step 3: Financial validation (cost estimation)
      const financeCheck = await this.finance.estimateCost(request);
      audit.push({
        timestamp: new Date(),
        agent: 'finance',
        action: 'estimate',
        details: financeCheck
      });
      
      // Step 4: Infrastructure capacity check
      const infraCheck = await this.infrastructure.checkCapacity(request);
      audit.push({
        timestamp: new Date(),
        agent: 'infrastructure',
        action: 'capacity_check',
        details: infraCheck
      });
      
      if (!infraCheck.available) {
        return this.createResult(requestId, false, infraCheck, audit,
          ['Infrastructure capacity not available']
        );
      }
      
      // Step 5: Determine responsible agents from Skills Matrix
      const responsibleAgents = this.skillsMatrix.getResponsibleAgents(request);
      
      // Step 6: Build collective decision
      const decision: ManagementDecision = {
        approved: true,
        agents: responsibleAgents,
        routing: this.determineRouting(request, responsibleAgents),
        estimatedCost: financeCheck.estimatedCost,
        estimatedTime: infraCheck.estimatedTime,
        requirements: [],
        warnings: complianceCheck.recommendations || []
      };
      
      // Step 7: Execute the request
      const executionResults = await this.executeRequest(request, decision, audit);
      
      // Step 8: Track execution in analytics
      await this.analytics.trackExecution(requestId, executionResults);
      
      // Step 9: Create final result
      const result = this.createResult(requestId, true, decision, audit, [], executionResults);
      
      // Step 10: Emit completion event
      this.emit('request:completed', result);
      
      return result;
      
    } catch (error: any) {
      console.error(`[ManagementTeam] Request ${requestId} failed:`, error);
      
      const errorDecision: ManagementDecision = {
        approved: false,
        reason: error.message,
        agents: [],
        routing: 'failed'
      };
      
      return this.createResult(requestId, false, errorDecision, audit, [error.message]);
    } finally {
      this.activeRequests.delete(requestId);
      this.auditLog.set(requestId, audit);
    }
  }

  /**
   * Determine routing strategy
   */
  private determineRouting(request: ManagementRequest, agents: string[]): string {
    if (agents.length === 1) return agents[0];
    
    // Priority routing based on request type
    if (request.context.priority === 'critical') {
      return 'parallel'; // All agents work simultaneously
    }
    
    return 'sequential'; // Agents work in sequence
  }

  /**
   * Execute the request through responsible agents
   */
  private async executeRequest(
    request: ManagementRequest,
    decision: ManagementDecision,
    audit: AuditTrail[]
  ): Promise<any> {
    const primaryAgent = decision.agents[0];
    let result: any;
    
    switch (primaryAgent) {
      case 'finance':
        result = await this.finance.execute(request);
        break;
        
      case 'operations':
        result = await this.operations.execute(request);
        break;
        
      case 'infrastructure':
        result = await this.infrastructure.execute(request);
        break;
        
      case 'security':
        result = await this.security.execute(request);
        break;
        
      case 'compliance':
        result = await this.compliance.execute(request);
        break;
        
      case 'integration':
        result = await this.integration.execute(request);
        break;
        
      case 'analytics':
        result = await this.analytics.execute(request);
        break;
        
      case 'communications':
        result = await this.communications.execute(request);
        break;
        
      default:
        result = await this.operations.execute(request);
    }
    
    audit.push({
      timestamp: new Date(),
      agent: primaryAgent,
      action: 'execute',
      details: result
    });
    
    // If multiple agents, execute secondary agents
    if (decision.agents.length > 1 && decision.routing === 'parallel') {
      const secondaryResults = await Promise.all(
        decision.agents.slice(1).map(async agent => {
          const agentResult = await this.executeByAgentName(agent, request);
          audit.push({
            timestamp: new Date(),
            agent,
            action: 'execute_secondary',
            details: agentResult
          });
          return agentResult;
        })
      );
      
      result = {
        primary: result,
        secondary: secondaryResults
      };
    }
    
    return result;
  }

  /**
   * Execute request by agent name
   */
  private async executeByAgentName(agentName: string, request: any): Promise<any> {
    const agents: Record<string, any> = {
      finance: this.finance,
      operations: this.operations,
      infrastructure: this.infrastructure,
      security: this.security,
      compliance: this.compliance,
      integration: this.integration,
      analytics: this.analytics,
      communications: this.communications
    };
    
    const agent = agents[agentName];
    if (!agent) {
      throw new Error(`Unknown agent: ${agentName}`);
    }
    
    return await agent.execute(request);
  }

  /**
   * Handle cross-agent events
   */
  private handleCrossAgentEvent(source: string, event: string, data: any): void {
    console.log(`[ManagementTeam] Cross-agent event from ${source}: ${event}`, data);
    
    // Broadcast to other agents if needed
    this.emit('agent:event', {
      source,
      event,
      data,
      timestamp: new Date()
    });
    
    // Handle specific cross-agent scenarios
    switch (event) {
      case 'payment:required':
        // Operations might need to pause until payment is confirmed
        this.operations.handleExternalEvent('payment:required', data);
        break;
        
      case 'threat:detected':
        // All agents need to know about security threats
        [this.finance, this.operations, this.infrastructure, this.compliance].forEach(agent => {
          agent.handleExternalEvent('threat:detected', data);
        });
        break;
        
      case 'violation:detected':
        // Security and operations need to respond to compliance violations
        this.security.handleExternalEvent('compliance:violation', data);
        this.operations.handleExternalEvent('compliance:violation', data);
        break;
        
      case 'resource:limit':
        // Operations needs to throttle
        this.operations.handleExternalEvent('resource:limit', data);
        this.analytics.handleExternalEvent('resource:limit', data);
        break;
        
      case 'api:failed':
        // Operations and communications might need to retry
        this.operations.handleExternalEvent('integration:failed', data);
        this.communications.handleExternalEvent('integration:failed', data);
        break;
        
      case 'anomaly:detected':
        // Security and operations should investigate
        this.security.handleExternalEvent('anomaly:detected', data);
        this.operations.handleExternalEvent('anomaly:detected', data);
        break;
        
      case 'delivery:failed':
        // Integration might need to check external services
        this.integration.handleExternalEvent('delivery:failed', data);
        break;
    }
  }

  /**
   * Create a management result
   */
  private createResult(
    requestId: string,
    success: boolean,
    decision: ManagementDecision,
    audit: AuditTrail[],
    errors: string[] = [],
    results?: any
  ): ManagementResult {
    return {
      requestId,
      success,
      decision,
      results,
      errors,
      audit
    };
  }

  /**
   * Emergency shutdown
   */
  public async emergencyShutdown(reason: string): Promise<void> {
    console.log(`[ManagementTeam] EMERGENCY SHUTDOWN: ${reason}`);
    
    // Stop all 8 agents
    await Promise.all([
      this.finance.shutdown(),
      this.operations.shutdown(),
      this.infrastructure.shutdown(),
      this.security.shutdown(),
      this.compliance.shutdown(),
      this.integration.shutdown(),
      this.analytics.shutdown(),
      this.communications.shutdown()
    ]);
    
    // Clear active requests
    this.activeRequests.clear();
    
    this.emit('shutdown', { reason, timestamp: new Date() });
  }

  /**
   * Get current status of all agents
   */
  public async getStatus(): Promise<any> {
    return {
      activeRequests: this.activeRequests.size,
      agents: {
        finance: await this.finance.getStatus(),
        operations: await this.operations.getStatus(),
        infrastructure: await this.infrastructure.getStatus(),
        security: await this.security.getStatus(),
        compliance: await this.compliance.getStatus(),
        integration: await this.integration.getStatus(),
        analytics: await this.analytics.getStatus(),
        communications: await this.communications.getStatus()
      },
      skillsMatrix: this.skillsMatrix.getStatus(),
      health: 'operational'
    };
  }

  /**
   * Get audit log for a request
   */
  public getAuditLog(requestId: string): AuditTrail[] | undefined {
    return this.auditLog.get(requestId);
  }
  
  /**
   * Get agent statistics
   */
  public getAgentStatistics(): any {
    return {
      totalAgents: 8,
      totalSkills: 310,
      distribution: {
        finance: this.skillsMatrix.getAgentSkills('finance').length,
        operations: this.skillsMatrix.getAgentSkills('operations').length,
        infrastructure: this.skillsMatrix.getAgentSkills('infrastructure').length,
        security: this.skillsMatrix.getAgentSkills('security').length,
        compliance: this.skillsMatrix.getAgentSkills('compliance').length,
        integration: this.skillsMatrix.getAgentSkills('integration').length,
        analytics: this.skillsMatrix.getAgentSkills('analytics').length,
        communications: this.skillsMatrix.getAgentSkills('communications').length
      }
    };
  }
}