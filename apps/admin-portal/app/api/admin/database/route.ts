import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Hardcoded Railway database URL - using simpler connection without extra params
const RAILWAY_DATABASE_URL = 'postgresql://railway:iX9nnJ6tyKYg2luc4nRqQLlw3c~*SN0s@centerbeam.proxy.rlwy.net:34807/railway';

// Use a global singleton to prevent multiple connections
const globalForPrisma = globalThis as unknown as {
  prismaAdmin: PrismaClient | undefined;
  lastConnectTime: number;
};

// Create a new connection each time but reuse if recent
function getDbConnection() {
  const now = Date.now();
  
  // If we have a connection that's less than 20 seconds old, reuse it
  if (globalForPrisma.prismaAdmin && globalForPrisma.lastConnectTime && 
      (now - globalForPrisma.lastConnectTime) < 20000) {
    return globalForPrisma.prismaAdmin;
  }
  
  // Close old connection if exists
  if (globalForPrisma.prismaAdmin) {
    globalForPrisma.prismaAdmin.$disconnect().catch(() => {});
  }
  
  // Create new connection
  globalForPrisma.prismaAdmin = new PrismaClient({
    datasources: {
      db: {
        url: RAILWAY_DATABASE_URL
      }
    },
    log: ['error'],
  });
  
  globalForPrisma.lastConnectTime = now;
  return globalForPrisma.prismaAdmin;
}

export async function GET(request: NextRequest) {
  console.log('Database GET request received at', new Date().toISOString());
  
  try {
    // Get connection (will create new if needed)
    const db = getDbConnection();
    
    try {
      // Simple connection test
      const testResult = await db.$queryRaw`SELECT 1 as test`;
      console.log('Connection test passed');
      
      // Get basic stats - keep queries minimal to reduce connection time
      let version, tableCount, dbSize;
      
      try {
        // Get version
        const versionResult = await db.$queryRaw`SELECT version() as version` as any[];
        version = versionResult[0]?.version || 'PostgreSQL';
        
        // Get table count
        const countResult = await db.$queryRaw`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
        ` as any[];
        tableCount = Number(countResult[0]?.count || 0);
        
        // Get database size
        const sizeResult = await db.$queryRaw`
          SELECT pg_database_size(current_database()) as size
        ` as any[];
        dbSize = Number(sizeResult[0]?.size || 0);
      } catch (statsError) {
        console.log('Stats query failed:', statsError);
        version = 'PostgreSQL';
        tableCount = 0;
        dbSize = 0;
      }

      // Get table list (simplified query)
      let tables = [];
      try {
        tables = await db.$queryRaw`
          SELECT 
            tablename as name,
            0 as rows,
            0 as size
          FROM pg_tables 
          WHERE schemaname = 'public'
          ORDER BY tablename
          LIMIT 10
        ` as any[];
      } catch (tablesError) {
        console.log('Failed to get tables:', tablesError);
        tables = [];
      }

      const versionMatch = version.match(/PostgreSQL ([\d.]+)/); 
      
      return NextResponse.json({
        connected: true,
        type: 'PostgreSQL',
        version: versionMatch ? versionMatch[1] : '14.x',
        uptime: Date.now(),
        connections: {
          active: 1,
          idle: 0,
          max: 100
        },
        size: {
          total: dbSize,
          tables: tableCount,
          indexes: 0
        },
        performance: {
          queries: 0,
          slowQueries: 0,
          avgResponseTime: 0
        },
        tables: tables
      });
    } catch (error: any) {
      console.error('Database query error at', new Date().toISOString(), ':', error.message);
      
      // Clear the connection on error
      globalForPrisma.prismaAdmin = undefined;
      globalForPrisma.lastConnectTime = 0;
      
      return NextResponse.json({
        connected: false,
        type: 'PostgreSQL',
        version: 'Unknown',
        uptime: 0,
        connections: { active: 0, idle: 0, max: 100 },
        size: { total: 0, tables: 0, indexes: 0 },
        performance: { queries: 0, slowQueries: 0, avgResponseTime: 0 },
        tables: [],
        error: error.message
      });
    }
  } catch (error: any) {
    console.error('Database API error:', error);
    return NextResponse.json({
      connected: false,
      type: 'PostgreSQL',
      version: 'Unknown',
      uptime: 0,
      connections: { active: 0, idle: 0, max: 100 },
      size: { total: 0, tables: 0, indexes: 0 },
      performance: { queries: 0, slowQueries: 0, avgResponseTime: 0 },
      tables: [],
      error: error.message
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, query } = body;

    if (action === 'execute') {
      const db = getDbConnection();
      
      try {
        // Execute the SQL query
        const result = await db.$queryRawUnsafe(query);
        
        return NextResponse.json({
          success: true,
          result: result,
          rowCount: Array.isArray(result) ? result.length : 0
        });
      } catch (error: any) {
        console.error('Query execution error:', error);
        return NextResponse.json({
          success: false,
          error: error.message || 'Query execution failed'
        });
      }
    }

    // For connect/disconnect, just return success since we're using hardcoded connection
    if (action === 'connect' || action === 'disconnect') {
      return NextResponse.json({
        success: true,
        message: 'Using hardcoded Railway database connection'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Database error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Database operation failed'
      },
      { status: 500 }
    );
  }
}