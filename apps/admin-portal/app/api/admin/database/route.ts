import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

// Use a global singleton to prevent multiple connections
const globalForPrisma = globalThis as unknown as {
  prismaAdmin: PrismaClient | undefined;
  prismaUrl: string | undefined;
};

// Store connection config in a local file (in production, use a proper database or session)
const CONFIG_FILE = path.join(process.cwd(), '.database-config.json');

async function saveConnectionUrl(url: string) {
  try {
    await writeFile(CONFIG_FILE, JSON.stringify({ url }), 'utf-8');
  } catch (error) {
    console.error('Failed to save connection URL:', error);
  }
}

async function loadConnectionUrl(): Promise<string | null> {
  try {
    const data = await readFile(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(data);
    return config.url;
  } catch (error) {
    return null;
  }
}

async function clearConnectionUrl() {
  try {
    await writeFile(CONFIG_FILE, JSON.stringify({ url: null }), 'utf-8');
  } catch (error) {
    console.error('Failed to clear connection URL:', error);
  }
}

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
    // Try to restore connection from saved config if not connected
    if (!globalForPrisma.prismaAdmin) {
      const savedUrl = await loadConnectionUrl();
      if (savedUrl) {
        console.log('Found saved connection URL, attempting to restore...');
        try {
          // Create a new client just like the test endpoint
          const newClient = new PrismaClient({
            datasources: {
              db: {
                url: savedUrl
              }
            },
            log: ['error', 'warn']
          });
          
          // Test connection with timeout
          const connectPromise = newClient.$connect();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), 5000)
          );
          
          await Promise.race([connectPromise, timeoutPromise]);
          
          // Verify connection with a simple query
          await newClient.$queryRaw`SELECT 1`;
          
          // Store the working connection
          globalForPrisma.prismaAdmin = newClient;
          globalForPrisma.prismaUrl = savedUrl;
          console.log('Connection restored successfully');
        } catch (error) {
          console.error('Failed to restore connection:', error);
          await cleanupConnection();
          await clearConnectionUrl();
        }
      } else {
        console.log('No saved connection URL found');
      }
    }
    
    // Check if we have an existing connection
    if (globalForPrisma.prismaAdmin) {
      console.log('Checking existing database connection...');
      try {
        // Test the connection with a simple query
        const testResult = await globalForPrisma.prismaAdmin.$queryRaw`SELECT 1 as test`;
        console.log('Connection test passed:', testResult);
        
        // Get database stats with error handling for each query
        let tableCount, dbSize, connections;
        try {
          [tableCount, dbSize, connections] = await Promise.all([
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
        } catch (statsError) {
          console.log('Some stats queries failed, using defaults:', statsError);
          tableCount = [{ count: 0 }];
          dbSize = [{ size: 0 }];
          connections = [{ count: 1 }];
        }

        // Get table information
        let tables = [];
        try {
          tables = await globalForPrisma.prismaAdmin.$queryRaw`
            SELECT 
              tablename as name,
              pg_total_relation_size(schemaname||'.'||tablename) as size
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename
          ` as any[];
        } catch (tablesError) {
          console.log('Failed to get tables, using empty array:', tablesError);
          tables = [];
        }

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
      } catch (error: any) {
        console.error('Database connection lost:', error.message);
        // Clean up the broken connection
        await cleanupConnection();
        await clearConnectionUrl();
        
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

        // Create new connection exactly like the test endpoint
        console.log('Creating new database connection...');
        const newClient = new PrismaClient({
          datasources: {
            db: {
              url: url
            }
          },
          log: ['error', 'warn']
        });

        // Test the connection with timeout
        console.log('Testing connection...');
        const connectPromise = newClient.$connect();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout after 5 seconds')), 5000)
        );
        
        await Promise.race([connectPromise, timeoutPromise]);
        
        // Verify with a simple query
        const testResult = await newClient.$queryRaw`SELECT version() as version`;
        console.log('Connection verified, database version:', testResult);

        // Store the working connection
        globalForPrisma.prismaAdmin = newClient;
        globalForPrisma.prismaUrl = url;
        
        // Save the connection URL for persistence
        await saveConnectionUrl(url);
        console.log('Connection URL saved for persistence');

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
      await clearConnectionUrl();
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