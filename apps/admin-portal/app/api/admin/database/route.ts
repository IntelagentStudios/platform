import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Hardcoded Railway database URL
const RAILWAY_DATABASE_URL = 'postgresql://railway:iX9nnJ6tyKYg2luc4nRqQLlw3c~*SN0s@centerbeam.proxy.rlwy.net:34807/railway';

// Use a global singleton to prevent multiple connections
const globalForPrisma = globalThis as unknown as {
  prismaAdmin: PrismaClient | undefined;
};

// Initialize connection if not exists
function getDbConnection() {
  if (!globalForPrisma.prismaAdmin) {
    globalForPrisma.prismaAdmin = new PrismaClient({
      datasources: {
        db: {
          url: RAILWAY_DATABASE_URL
        }
      },
      log: ['error', 'warn']
    });
  }
  return globalForPrisma.prismaAdmin;
}

export async function GET(request: NextRequest) {
  console.log('Database GET request received');
  try {
    // Always use the hardcoded connection
    const db = getDbConnection();
    
    try {
      // Test the connection
      await db.$connect();
      const testResult = await db.$queryRaw`SELECT 1 as test`;
      console.log('Connection test passed:', testResult);
      
      // Get database stats with error handling for each query
      let tableCount, dbSize, connections, version;
      try {
        [tableCount, dbSize, connections, version] = await Promise.all([
          db.$queryRaw`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
          `,
          db.$queryRaw`
            SELECT pg_database_size(current_database()) as size
          `,
          db.$queryRaw`
            SELECT count(*) as count 
            FROM pg_stat_activity 
            WHERE state = 'active'
          `,
          db.$queryRaw`SELECT version() as version`
        ]);
      } catch (statsError) {
        console.log('Some stats queries failed, using defaults:', statsError);
        tableCount = [{ count: 0 }];
        dbSize = [{ size: 0 }];
        connections = [{ count: 1 }];
        version = [{ version: 'PostgreSQL' }];
      }

      // Get table information
      let tables = [];
      try {
        tables = await db.$queryRaw`
          SELECT 
            tablename as name,
            pg_total_relation_size(schemaname||'.'||tablename) as size
          FROM pg_tables 
          WHERE schemaname = 'public'
          ORDER BY tablename
          LIMIT 20
        ` as any[];
      } catch (tablesError) {
        console.log('Failed to get tables, using empty array:', tablesError);
        tables = [];
      }

      // Get row counts for each table
      for (const table of tables) {
        try {
          const countResult = await db.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${table.name}"`) as any[];
          table.rows = Number(countResult[0]?.count || 0);
        } catch (e) {
          table.rows = 0;
        }
      }

      const versionString = (version as any)[0]?.version || 'PostgreSQL';
      const versionMatch = versionString.match(/PostgreSQL ([\d.]+)/); 
      
      return NextResponse.json({
        connected: true,
        type: 'PostgreSQL',
        version: versionMatch ? versionMatch[1] : '14.x',
        uptime: Date.now(),
        connections: {
          active: Number((connections as any)[0]?.count || 0),
          idle: 0,
          max: 100
        },
        size: {
          total: Number((dbSize as any)[0]?.size || 0),
          tables: tables.reduce((sum, t) => sum + Number(t.size || 0), 0),
          indexes: 0
        },
        performance: {
          queries: 0,
          slowQueries: 0,
          avgResponseTime: 0
        },
        tables: tables.map(t => ({
          name: t.name,
          rows: t.rows || 0,
          size: Number(t.size || 0),
          lastModified: new Date()
        }))
      });
    } catch (error: any) {
      console.error('Database query error:', error.message);
      
      // Try to reconnect
      if (globalForPrisma.prismaAdmin) {
        try {
          await globalForPrisma.prismaAdmin.$disconnect();
        } catch (e) {}
        globalForPrisma.prismaAdmin = undefined;
      }
      
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

    // Always use hardcoded connection
    const db = getDbConnection();

    if (action === 'execute') {
      try {
        // Execute the SQL query
        const result = await db.$queryRawUnsafe(query);
        
        return NextResponse.json({
          success: true,
          result: result,
          rowCount: Array.isArray(result) ? result.length : 0
        });
      } catch (error: any) {
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