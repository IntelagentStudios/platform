/**
 * GraphQL API for Execution History
 * Custom GraphQL implementation without third-party libraries
 * Provides rich querying capabilities for workflow history
 */

import { EventEmitter } from 'events';
import * as http from 'http';
import * as url from 'url';

export interface ExecutionRecord {
  id: string;
  licenseKey: string;
  skillId: string;
  taskId: string;
  parentTaskId?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input: any;
  output?: any;
  error?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface QueryFilters {
  licenseKey?: string;
  skillId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'startTime' | 'endTime' | 'duration' | 'skillId';
  sortOrder?: 'asc' | 'desc';
}

export interface AggregationResult {
  licenseKey: string;
  skillId?: string;
  count: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  successRate: number;
  period?: string;
}

export class GraphQLAPI extends EventEmitter {
  private static instance: GraphQLAPI;
  private executions = new Map<string, ExecutionRecord>();
  private server?: http.Server;
  
  private constructor() {
    super();
    this.loadFromStorage();
  }
  
  public static getInstance(): GraphQLAPI {
    if (!GraphQLAPI.instance) {
      GraphQLAPI.instance = new GraphQLAPI();
    }
    return GraphQLAPI.instance;
  }
  
  /**
   * Start GraphQL server
   */
  public startServer(port = 4000): void {
    if (this.server) {
      console.log('[GraphQLAPI] Server already running');
      return;
    }
    
    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });
    
    this.server.listen(port, () => {
      console.log(`[GraphQLAPI] GraphQL server running on http://localhost:${port}/graphql`);
    });
  }
  
  /**
   * Stop GraphQL server
   */
  public stopServer(): void {
    if (this.server) {
      this.server.close();
      this.server = undefined;
      console.log('[GraphQLAPI] Server stopped');
    }
  }
  
  /**
   * Handle HTTP request
   */
  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const parsedUrl = url.parse(req.url || '', true);
    
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    if (parsedUrl.pathname === '/graphql') {
      if (req.method === 'GET') {
        // Serve GraphQL playground
        this.servePlayground(res);
      } else if (req.method === 'POST') {
        // Handle GraphQL query
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          this.handleGraphQLQuery(body, res);
        });
      }
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  }
  
  /**
   * Serve GraphQL playground
   */
  private servePlayground(res: http.ServerResponse): void {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>GraphQL Playground</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #333; }
        .query-area { display: flex; gap: 20px; margin-bottom: 20px; }
        textarea { flex: 1; padding: 15px; border: 1px solid #ddd; border-radius: 5px; font-family: 'Courier New', monospace; min-height: 300px; }
        button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 16px; }
        button:hover { background: #0056b3; }
        .result { background: white; padding: 15px; border-radius: 5px; border: 1px solid #ddd; }
        pre { margin: 0; white-space: pre-wrap; }
        .examples { background: white; padding: 15px; border-radius: 5px; margin-top: 20px; }
        .example { margin: 10px 0; padding: 10px; background: #f9f9f9; border-radius: 3px; cursor: pointer; }
        .example:hover { background: #f0f0f0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>GraphQL API Explorer</h1>
        
        <div class="query-area">
            <textarea id="query" placeholder="Enter your GraphQL query here...">
{
  executions(licenseKey: "YOUR_LICENSE_KEY", limit: 10) {
    id
    skillId
    status
    startTime
    duration
  }
}</textarea>
            <textarea id="variables" placeholder="Variables (JSON)...">{}</textarea>
        </div>
        
        <button onclick="executeQuery()">Execute Query</button>
        
        <div class="result">
            <h3>Result:</h3>
            <pre id="result">Query result will appear here...</pre>
        </div>
        
        <div class="examples">
            <h3>Example Queries:</h3>
            
            <div class="example" onclick="loadExample(this)">
                <strong>Get Recent Executions</strong>
                <pre>{
  executions(limit: 20, sortBy: "startTime", sortOrder: "desc") {
    id
    skillId
    status
    startTime
    duration
  }
}</pre>
            </div>
            
            <div class="example" onclick="loadExample(this)">
                <strong>Get Failed Executions</strong>
                <pre>{
  executions(status: "failed", limit: 10) {
    id
    skillId
    error
    startTime
  }
}</pre>
            </div>
            
            <div class="example" onclick="loadExample(this)">
                <strong>Get Aggregated Stats</strong>
                <pre>{
  aggregations(groupBy: "skillId") {
    skillId
    count
    avgDuration
    successRate
  }
}</pre>
            </div>
        </div>
    </div>
    
    <script>
        function executeQuery() {
            const query = document.getElementById('query').value;
            const variables = document.getElementById('variables').value;
            
            fetch('/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, variables: variables ? JSON.parse(variables) : {} })
            })
            .then(res => res.json())
            .then(data => {
                document.getElementById('result').textContent = JSON.stringify(data, null, 2);
            })
            .catch(err => {
                document.getElementById('result').textContent = 'Error: ' + err.message;
            });
        }
        
        function loadExample(element) {
            const query = element.querySelector('pre').textContent;
            document.getElementById('query').value = query;
        }
    </script>
</body>
</html>`;
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }
  
  /**
   * Handle GraphQL query
   */
  private async handleGraphQLQuery(body: string, res: http.ServerResponse): Promise<void> {
    try {
      const { query, variables } = JSON.parse(body);
      const result = await this.executeQuery(query, variables);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ data: result }));
      
    } catch (error: any) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        errors: [{ message: error.message }] 
      }));
    }
  }
  
  /**
   * Execute GraphQL query (simplified parser)
   */
  private async executeQuery(query: string, variables: any = {}): Promise<any> {
    // Simple query parser - real implementation would use a proper parser
    const cleanQuery = query.replace(/\s+/g, ' ').trim();
    
    // Handle executions query
    if (cleanQuery.includes('executions')) {
      const filters = this.parseFilters(cleanQuery, variables);
      return { executions: this.queryExecutions(filters) };
    }
    
    // Handle aggregations query
    if (cleanQuery.includes('aggregations')) {
      const filters = this.parseFilters(cleanQuery, variables);
      return { aggregations: this.queryAggregations(filters) };
    }
    
    // Handle execution by ID
    if (cleanQuery.includes('execution(')) {
      const idMatch = cleanQuery.match(/execution\(id:\s*"([^"]+)"/);
      if (idMatch) {
        const execution = this.executions.get(idMatch[1]);
        return { execution };
      }
    }
    
    // Handle stats query
    if (cleanQuery.includes('stats')) {
      return { stats: this.getStats() };
    }
    
    throw new Error('Unknown query type');
  }
  
  /**
   * Parse filters from query
   */
  private parseFilters(query: string, variables: any): QueryFilters {
    const filters: QueryFilters = {};
    
    // Extract parameters from query
    const paramsMatch = query.match(/\(([^)]+)\)/);
    if (paramsMatch) {
      const params = paramsMatch[1];
      
      // Parse each parameter
      const paramPairs = params.split(',').map(p => p.trim());
      for (const pair of paramPairs) {
        const [key, value] = pair.split(':').map(s => s.trim());
        
        if (value.startsWith('$')) {
          // Variable reference
          const varName = value.substring(1);
          filters[key as keyof QueryFilters] = variables[varName];
        } else {
          // Direct value
          const cleanValue = value.replace(/['"]/g, '');
          if (key === 'limit' || key === 'offset') {
            filters[key] = parseInt(cleanValue);
          } else if (key === 'startDate' || key === 'endDate') {
            filters[key as keyof QueryFilters] = new Date(cleanValue);
          } else {
            filters[key as keyof QueryFilters] = cleanValue as any;
          }
        }
      }
    }
    
    return filters;
  }
  
  /**
   * Query executions
   */
  public queryExecutions(filters: QueryFilters): ExecutionRecord[] {
    let results = Array.from(this.executions.values());
    
    // Apply filters
    if (filters.licenseKey) {
      results = results.filter(e => e.licenseKey === filters.licenseKey);
    }
    
    if (filters.skillId) {
      results = results.filter(e => e.skillId === filters.skillId);
    }
    
    if (filters.status) {
      results = results.filter(e => e.status === filters.status);
    }
    
    if (filters.startDate) {
      results = results.filter(e => e.startTime >= filters.startDate!);
    }
    
    if (filters.endDate) {
      results = results.filter(e => e.startTime <= filters.endDate!);
    }
    
    // Sort
    if (filters.sortBy) {
      results.sort((a, b) => {
        const aVal = a[filters.sortBy as keyof ExecutionRecord];
        const bVal = b[filters.sortBy as keyof ExecutionRecord];
        
        if (filters.sortOrder === 'desc') {
          return aVal > bVal ? -1 : 1;
        }
        return aVal > bVal ? 1 : -1;
      });
    }
    
    // Pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 100;
    
    return results.slice(offset, offset + limit);
  }
  
  /**
   * Query aggregations
   */
  public queryAggregations(filters: QueryFilters & { groupBy?: string }): AggregationResult[] {
    const executions = this.queryExecutions(filters);
    const groups = new Map<string, ExecutionRecord[]>();
    
    // Group executions
    for (const execution of executions) {
      const key = filters.groupBy === 'skillId' 
        ? execution.skillId 
        : execution.licenseKey;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(execution);
    }
    
    // Calculate aggregations
    const results: AggregationResult[] = [];
    
    for (const [key, group] of groups.entries()) {
      const durations = group
        .filter(e => e.duration !== undefined)
        .map(e => e.duration!);
      
      const successful = group.filter(e => e.status === 'completed').length;
      
      results.push({
        licenseKey: filters.groupBy === 'skillId' ? group[0].licenseKey : key,
        skillId: filters.groupBy === 'skillId' ? key : undefined,
        count: group.length,
        avgDuration: durations.length > 0 
          ? durations.reduce((a, b) => a + b, 0) / durations.length 
          : 0,
        minDuration: durations.length > 0 ? Math.min(...durations) : 0,
        maxDuration: durations.length > 0 ? Math.max(...durations) : 0,
        successRate: group.length > 0 ? (successful / group.length) * 100 : 0
      });
    }
    
    return results;
  }
  
  /**
   * Get overall stats
   */
  public getStats(): any {
    const executions = Array.from(this.executions.values());
    
    return {
      totalExecutions: executions.length,
      totalLicenses: new Set(executions.map(e => e.licenseKey)).size,
      totalSkills: new Set(executions.map(e => e.skillId)).size,
      statusCounts: {
        pending: executions.filter(e => e.status === 'pending').length,
        running: executions.filter(e => e.status === 'running').length,
        completed: executions.filter(e => e.status === 'completed').length,
        failed: executions.filter(e => e.status === 'failed').length
      }
    };
  }
  
  /**
   * Record an execution
   */
  public recordExecution(execution: ExecutionRecord): void {
    this.executions.set(execution.id, execution);
    
    // Keep only last 10000 executions in memory
    if (this.executions.size > 10000) {
      const oldestId = Array.from(this.executions.keys())[0];
      this.executions.delete(oldestId);
    }
    
    this.saveToStorage();
    
    this.emit('execution:recorded', execution);
  }
  
  /**
   * Update execution status
   */
  public updateExecution(
    id: string, 
    updates: Partial<ExecutionRecord>
  ): void {
    const execution = this.executions.get(id);
    if (!execution) return;
    
    Object.assign(execution, updates);
    
    if (updates.status === 'completed' || updates.status === 'failed') {
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
    }
    
    this.saveToStorage();
    
    this.emit('execution:updated', execution);
  }
  
  /**
   * Save to persistent storage
   */
  private saveToStorage(): void {
    try {
      const fs = require('fs');
      const path = require('path');
      const dataDir = path.join(process.cwd(), 'data');
      
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Convert dates to ISO strings for JSON
      const data = Array.from(this.executions.entries()).map(([id, exec]) => ({
        ...exec,
        startTime: exec.startTime.toISOString(),
        endTime: exec.endTime?.toISOString()
      }));
      
      fs.writeFileSync(
        path.join(dataDir, 'execution-history.json'),
        JSON.stringify(data, null, 2)
      );
    } catch (error) {
      console.error('[GraphQLAPI] Failed to save to storage:', error);
    }
  }
  
  /**
   * Load from persistent storage
   */
  private loadFromStorage(): void {
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'data', 'execution-history.json');
      
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        
        for (const exec of data) {
          this.executions.set(exec.id, {
            ...exec,
            startTime: new Date(exec.startTime),
            endTime: exec.endTime ? new Date(exec.endTime) : undefined
          });
        }
        
        console.log(`[GraphQLAPI] Loaded ${this.executions.size} executions from storage`);
      }
    } catch (error) {
      console.error('[GraphQLAPI] Failed to load from storage:', error);
    }
  }
}