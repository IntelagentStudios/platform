import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ExecutionLogEntry {
  executionId: string;
  skillName: string;
  skillCategory?: string;
  licenseKey?: string;
  productKey?: string;
  userId?: string;
  sessionId?: string;
  inputParams?: any;
  context?: any;
  status: 'started' | 'success' | 'failed' | 'timeout';
  startTime: Date;
  endTime?: Date;
  durationMs?: number;
  outputData?: any;
  errorMessage?: string;
  errorStack?: string;
  tokensUsed?: number;
  apiCallsMade?: number;
  externalRequests?: any[];
  metadata?: any;
}

export interface WorkflowLogEntry {
  workflowId: string;
  workflowName: string;
  workflowType: 'n8n' | 'skills-chain' | 'custom';
  licenseKey?: string;
  productKey?: string;
  triggerType: 'manual' | 'webhook' | 'schedule' | 'event';
  triggerData?: any;
  parentExecutionId?: string;
  childExecutions?: string[];
  status: string;
  currentStep?: number;
  totalSteps?: number;
  startTime: Date;
  endTime?: Date;
  durationMs?: number;
  finalOutput?: any;
  errorDetails?: any;
  metadata?: any;
}

export interface ApiRequestLogEntry {
  executionId?: string;
  requestId: string;
  serviceName: string;
  endpointUrl: string;
  method: string;
  headers?: any;
  requestBody?: any;
  statusCode?: number;
  responseHeaders?: any;
  responseBody?: any;
  requestTime: Date;
  responseTime?: Date;
  durationMs?: number;
  errorMessage?: string;
  retryCount?: number;
  licenseKey?: string;
  productKey?: string;
}

export class SkillExecutionLogger {
  private static instance: SkillExecutionLogger;
  private executionStack: Map<string, ExecutionLogEntry> = new Map();
  private apiRequestBuffer: ApiRequestLogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Start periodic flush of buffered logs
    this.startPeriodicFlush();
  }

  static getInstance(): SkillExecutionLogger {
    if (!SkillExecutionLogger.instance) {
      SkillExecutionLogger.instance = new SkillExecutionLogger();
    }
    return SkillExecutionLogger.instance;
  }

  /**
   * Log the start of a skill execution
   */
  async logSkillStart(entry: Partial<ExecutionLogEntry>): Promise<string> {
    const executionId = entry.executionId || this.generateExecutionId();
    
    const logEntry: ExecutionLogEntry = {
      executionId,
      skillName: entry.skillName || 'unknown',
      skillCategory: entry.skillCategory,
      licenseKey: entry.licenseKey,
      productKey: entry.productKey,
      userId: entry.userId,
      sessionId: entry.sessionId,
      inputParams: entry.inputParams,
      context: entry.context,
      status: 'started',
      startTime: new Date(),
      metadata: entry.metadata
    };

    // Store in memory for quick access
    this.executionStack.set(executionId, logEntry);

    // Write to database
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO skill_executions (
          execution_id, skill_name, skill_category, license_key, product_key,
          user_id, session_id, input_params, context, status, start_time, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `,
        executionId,
        logEntry.skillName,
        logEntry.skillCategory,
        logEntry.licenseKey,
        logEntry.productKey,
        logEntry.userId,
        logEntry.sessionId,
        JSON.stringify(logEntry.inputParams),
        JSON.stringify(logEntry.context),
        logEntry.status,
        logEntry.startTime,
        JSON.stringify(logEntry.metadata)
      );
    } catch (error) {
      console.error('Failed to log skill start:', error);
    }

    return executionId;
  }

  /**
   * Log the completion of a skill execution
   */
  async logSkillComplete(
    executionId: string,
    status: 'success' | 'failed' | 'timeout',
    outputData?: any,
    error?: Error
  ): Promise<void> {
    const startEntry = this.executionStack.get(executionId);
    if (!startEntry) {
      console.warn(`No start entry found for execution ${executionId}`);
      return;
    }

    const endTime = new Date();
    const durationMs = endTime.getTime() - startEntry.startTime.getTime();

    // Update in-memory entry
    startEntry.status = status;
    startEntry.endTime = endTime;
    startEntry.durationMs = durationMs;
    startEntry.outputData = outputData;
    
    if (error) {
      startEntry.errorMessage = error.message;
      startEntry.errorStack = error.stack;
    }

    // Update database
    try {
      await prisma.$executeRawUnsafe(`
        UPDATE skill_executions
        SET status = $1, end_time = $2, duration_ms = $3,
            output_data = $4, error_message = $5, error_stack = $6
        WHERE execution_id = $7
      `,
        status,
        endTime,
        durationMs,
        outputData ? JSON.stringify(outputData) : null,
        error?.message,
        error?.stack,
        executionId
      );
    } catch (dbError) {
      console.error('Failed to log skill completion:', dbError);
    }

    // Clean up memory after a delay
    setTimeout(() => {
      this.executionStack.delete(executionId);
    }, 60000); // Keep in memory for 1 minute for reference
  }

  /**
   * Log a workflow execution
   */
  async logWorkflow(entry: Partial<WorkflowLogEntry>): Promise<string> {
    const workflowId = entry.workflowId || this.generateWorkflowId();
    
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO workflow_executions (
          workflow_id, workflow_name, workflow_type, license_key, product_key,
          trigger_type, trigger_data, parent_execution_id, status,
          current_step, total_steps, start_time, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `,
        workflowId,
        entry.workflowName || 'unknown',
        entry.workflowType || 'custom',
        entry.licenseKey,
        entry.productKey,
        entry.triggerType || 'manual',
        JSON.stringify(entry.triggerData),
        entry.parentExecutionId,
        entry.status || 'started',
        entry.currentStep || 0,
        entry.totalSteps || 0,
        entry.startTime || new Date(),
        JSON.stringify(entry.metadata)
      );
    } catch (error) {
      console.error('Failed to log workflow:', error);
    }

    return workflowId;
  }

  /**
   * Log an API request
   */
  async logApiRequest(entry: Partial<ApiRequestLogEntry>): Promise<void> {
    const requestId = entry.requestId || this.generateRequestId();
    
    const logEntry: ApiRequestLogEntry = {
      requestId,
      executionId: entry.executionId,
      serviceName: entry.serviceName || 'unknown',
      endpointUrl: entry.endpointUrl || '',
      method: entry.method || 'GET',
      headers: entry.headers,
      requestBody: entry.requestBody,
      requestTime: entry.requestTime || new Date(),
      licenseKey: entry.licenseKey,
      productKey: entry.productKey
    };

    // Buffer the request for batch insertion
    this.apiRequestBuffer.push(logEntry);

    // Flush if buffer is large enough
    if (this.apiRequestBuffer.length >= 10) {
      await this.flushApiRequests();
    }
  }

  /**
   * Update an API request with response data
   */
  async updateApiResponse(
    requestId: string,
    statusCode: number,
    responseBody?: any,
    responseHeaders?: any,
    error?: string
  ): Promise<void> {
    const responseTime = new Date();
    
    try {
      await prisma.$executeRawUnsafe(`
        UPDATE api_request_logs
        SET status_code = $1, response_body = $2, response_headers = $3,
            response_time = $4, duration_ms = $5, error_message = $6
        WHERE request_id = $7
      `,
        statusCode,
        responseBody ? JSON.stringify(responseBody) : null,
        responseHeaders ? JSON.stringify(responseHeaders) : null,
        responseTime,
        0, // Calculate based on request_time
        error,
        requestId
      );
    } catch (dbError) {
      console.error('Failed to update API response:', dbError);
    }
  }

  /**
   * Get execution metrics for a skill
   */
  async getSkillMetrics(
    skillName: string,
    timeRange: { start: Date; end: Date }
  ): Promise<any> {
    try {
      const metrics = await prisma.$queryRawUnsafe(`
        SELECT
          COUNT(*) as total_executions,
          COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
          AVG(duration_ms) as avg_duration,
          MIN(duration_ms) as min_duration,
          MAX(duration_ms) as max_duration,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration,
          PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms) as p99_duration
        FROM skill_executions
        WHERE skill_name = $1
          AND start_time >= $2
          AND start_time <= $3
      `,
        skillName,
        timeRange.start,
        timeRange.end
      );

      return metrics;
    } catch (error) {
      console.error('Failed to get skill metrics:', error);
      return null;
    }
  }

  /**
   * Get user activity summary
   */
  async getUserActivity(userId: string, licenseKey?: string): Promise<any> {
    try {
      const activity = await prisma.$queryRawUnsafe(`
        SELECT
          user_id,
          COUNT(DISTINCT skill_name) as unique_skills_used,
          COUNT(*) as total_executions,
          DATE(start_time) as date,
          COUNT(DISTINCT session_id) as sessions
        FROM skill_executions
        WHERE user_id = $1
          ${licenseKey ? 'AND license_key = $2' : ''}
        GROUP BY user_id, DATE(start_time)
        ORDER BY date DESC
        LIMIT 30
      `,
        userId,
        ...(licenseKey ? [licenseKey] : [])
      );

      return activity;
    } catch (error) {
      console.error('Failed to get user activity:', error);
      return null;
    }
  }

  /**
   * Flush buffered API requests to database
   */
  private async flushApiRequests(): Promise<void> {
    if (this.apiRequestBuffer.length === 0) return;

    const requests = [...this.apiRequestBuffer];
    this.apiRequestBuffer = [];

    try {
      // Batch insert API requests
      for (const request of requests) {
        await prisma.$executeRawUnsafe(`
          INSERT INTO api_request_logs (
            execution_id, request_id, service_name, endpoint_url, method,
            headers, request_body, request_time, license_key, product_key
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `,
          request.executionId,
          request.requestId,
          request.serviceName,
          request.endpointUrl,
          request.method,
          JSON.stringify(request.headers),
          JSON.stringify(request.requestBody),
          request.requestTime,
          request.licenseKey,
          request.productKey
        );
      }
    } catch (error) {
      console.error('Failed to flush API requests:', error);
      // Re-add to buffer on failure
      this.apiRequestBuffer.unshift(...requests);
    }
  }

  /**
   * Start periodic flush of buffered logs
   */
  private startPeriodicFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flushApiRequests().catch(console.error);
    }, 5000); // Flush every 5 seconds
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    await this.flushApiRequests();
    await prisma.$disconnect();
  }

  // Helper methods
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateWorkflowId(): string {
    return `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const skillLogger = SkillExecutionLogger.getInstance();