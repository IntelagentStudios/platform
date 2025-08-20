import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Use a global singleton to prevent multiple connections
const globalForPrisma = globalThis as unknown as {
  prismaAdmin: PrismaClient | undefined;
  prismaUrl: string | undefined;
};

// Clean up any existing connection
async function cleanupConnection() {
  if (globalForPrisma.prismaAdmin) {
    try {
      await globalForPrisma.prismaAdmin.$disconnect();
    } catch (error) {
      console.error('Error disconnecting:', error);
    } finally {
      globalForPrisma.prismaAdmin = undefined;
      globalForPrisma.prismaUrl = undefined;
    }
  }
}

export async function GET(request: NextRequest) {
  console.log('Database GET request received');
  try {
    // Check if we have an existing connection
    if (globalForPrisma.prismaAdmin) {
      console.log('Testing existing database connection...');
      try {
        // Test the connection
        await globalForPrisma.prismaAdmin.$queryRaw`SELECT 1`;
        
        // Get database stats
        const [tableCount, dbSize, connections] = await Promise.all([
          globalForPrisma.prismaAdmin.$queryRaw`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
          `,
          globalForPrisma.prismaAdmin.$queryRaw`
            SELECT pg_database_size(current_database()) as size
          `,
          globalForPrisma.prismaAdmin.$queryRaw`
            SELECT count(*) as count 
            FROM pg_stat_activity 
            WHERE state = 'active'
          `
        ]);

        // Get table information
        const tables = await globalForPrisma.prismaAdmin.$queryRaw`
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
        await cleanupConnection();
        // Don't try to reconnect automatically, just return disconnected state
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
      }
    }

    // Don't automatically try to connect with env variable
    // Let the user explicitly connect through the UI
    console.log('No active database connection');

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
    // Return a valid response even on error
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
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url, action } = await request.json();

    if (action === 'connect') {
      try {
        console.log('Attempting to connect with URL:', url?.substring(0, 50) + '...');
        
        // Clean up any existing connection first
        await cleanupConnection();

        // Parse and clean the connection URL
        let connectionUrl = url;
        
        // Remove any existing connection parameters we're about to add
        if (connectionUrl.includes('connection_limit=') || connectionUrl.includes('pool_timeout=')) {
          const urlParts = connectionUrl.split('?');
          if (urlParts.length > 1) {
            const params = urlParts[1].split('&').filter(p => 
              !p.startsWith('connection_limit=') && !p.startsWith('pool_timeout=')
            );
            connectionUrl = urlParts[0] + (params.length > 0 ? '?' + params.join('&') : '');
          }
        }
        
        // Add connection pool parameters
        const separator = connectionUrl.includes('?') ? '&' : '?';
        connectionUrl = connectionUrl + separator + 'connection_limit=2&pool_timeout=2';
        
        console.log('Final connection URL params:', connectionUrl.split('?')[1]);

        // Create new connection
        const testConnection = new PrismaClient({
          datasources: {
            db: {
              url: connectionUrl
            }
          },
          log: ['error', 'warn', 'info']
        });

        // Test the connection with timeout
        const connectPromise = testConnection.$connect();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout after 5 seconds')), 5000)
        );
        
        await Promise.race([connectPromise, timeoutPromise]);
        
        // Test with a simple query
        const testResult = await testConnection.$queryRaw`SELECT 1 as test`;
        console.log('Connection test successful:', testResult);

        // If successful, store the connection
        globalForPrisma.prismaAdmin = testConnection;
        globalForPrisma.prismaUrl = url;

        return NextResponse.json({
          success: true,
          message: 'Database connected successfully'
        });
      } catch (connectError: any) {
        console.error('Connection error details:', connectError);
        // Clean up on failure
        await cleanupConnection();
        throw connectError;
      }
    }

    if (action === 'disconnect') {
      await cleanupConnection();
      return NextResponse.json({
        success: true,
        message: 'Database disconnected'
      });
    }

    if (action === 'execute' && globalForPrisma.prismaAdmin) {
      const { query } = await request.json();
      
      try {
        // Execute the SQL query
        const result = await globalForPrisma.prismaAdmin.$queryRawUnsafe(query);
        
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
    // Clean up on any error
    await cleanupConnection();
    
    // Check for specific error types
    let errorMessage = error.message || 'Failed to connect to database';
    if (errorMessage.includes('too many clients')) {
      errorMessage = 'Too many connections. Please wait a moment and try again.';
    } else if (errorMessage.includes('ECONNREFUSED')) {
      errorMessage = 'Cannot connect to database. Please check if the database is running.';
    } else if (errorMessage.includes('authentication failed')) {
      errorMessage = 'Invalid database credentials. Please check your connection string.';
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage
      },
      { status: 500 }
    );
  }
}

// Clean up on process termination
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await cleanupConnection();
  });
}