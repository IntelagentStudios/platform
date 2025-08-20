import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

// Store connection in memory (in production, use a proper session store)
let dbConnection: PrismaClient | null = null;
let connectionConfig: string | null = null;

export async function GET(request: NextRequest) {
  try {
    // Check if we have an existing connection
    if (dbConnection) {
      try {
        // Test the connection
        await dbConnection.$queryRaw`SELECT 1`;
        
        // Get database stats
        const [tableCount, dbSize, connections] = await Promise.all([
          dbConnection.$queryRaw`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
          `,
          dbConnection.$queryRaw`
            SELECT pg_database_size(current_database()) as size
          `,
          dbConnection.$queryRaw`
            SELECT count(*) as count 
            FROM pg_stat_activity 
            WHERE state = 'active'
          `
        ]);

        // Get table information
        const tables = await dbConnection.$queryRaw`
          SELECT 
            tablename as name,
            pg_total_relation_size(schemaname||'.'||tablename) as size
          FROM pg_tables 
          WHERE schemaname = 'public'
          ORDER BY tablename
        ` as any[];

        return NextResponse.json({
          connected: true,
          type: 'PostgreSQL',
          version: '14.5',
          uptime: Date.now(),
          connections: {
            active: (connections as any)[0]?.count || 0,
            idle: 0,
            max: 100
          },
          size: {
            total: (dbSize as any)[0]?.size || 0,
            tables: tables.reduce((sum, t) => sum + (t.size || 0), 0),
            indexes: 0
          },
          performance: {
            queries: 0,
            slowQueries: 0,
            avgResponseTime: 0
          },
          tables: tables.map(t => ({
            name: t.name,
            rows: 0,
            size: t.size || 0,
            lastModified: new Date()
          }))
        });
      } catch (error) {
        console.error('Database query error:', error);
        dbConnection = null;
        connectionConfig = null;
      }
    }

    // Check environment variable as fallback
    const envUrl = process.env.DATABASE_URL;
    if (envUrl && !dbConnection) {
      try {
        dbConnection = new PrismaClient({
          datasources: {
            db: {
              url: envUrl
            }
          }
        });
        await dbConnection.$connect();
        connectionConfig = envUrl;
        
        // Retry the request with the new connection
        return GET(request);
      } catch (error) {
        console.error('Failed to connect with env DATABASE_URL:', error);
      }
    }

    return NextResponse.json({
      connected: false,
      type: 'PostgreSQL',
      version: 'Unknown',
      uptime: 0,
      connections: { active: 0, idle: 0, max: 100 },
      size: { total: 0, tables: 0, indexes: 0 },
      performance: { queries: 0, slowQueries: 0, avgResponseTime: 0 },
      tables: []
    });
  } catch (error) {
    console.error('Database API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database stats' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url, action } = await request.json();

    if (action === 'connect') {
      // Disconnect existing connection if any
      if (dbConnection) {
        await dbConnection.$disconnect();
        dbConnection = null;
      }

      // Try to connect with the provided URL
      const testConnection = new PrismaClient({
        datasources: {
          db: {
            url: url
          }
        }
      });

      // Test the connection
      await testConnection.$connect();
      await testConnection.$queryRaw`SELECT 1`;

      // If successful, store the connection
      dbConnection = testConnection;
      connectionConfig = url;

      return NextResponse.json({
        success: true,
        message: 'Database connected successfully'
      });
    }

    if (action === 'disconnect') {
      if (dbConnection) {
        await dbConnection.$disconnect();
        dbConnection = null;
        connectionConfig = null;
      }
      return NextResponse.json({
        success: true,
        message: 'Database disconnected'
      });
    }

    if (action === 'execute' && dbConnection) {
      const { query } = await request.json();
      
      try {
        // Execute the SQL query
        const result = await dbConnection.$queryRawUnsafe(query);
        
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

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to connect to database' 
      },
      { status: 500 }
    );
  }
}