import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function POST(request: NextRequest) {
  const { url } = await request.json();
  
  if (!url) {
    return NextResponse.json({ success: false, error: 'No URL provided' });
  }
  
  let testClient: PrismaClient | null = null;
  
  try {
    console.log('Testing connection to:', url.substring(0, 50) + '...');
    
    // Create a test client with minimal settings
    testClient = new PrismaClient({
      datasources: {
        db: {
          url: url
        }
      },
      log: ['error', 'warn', 'info'],
    });
    
    // Try to connect with a 5 second timeout
    const connectPromise = testClient.$connect();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 5000)
    );
    
    await Promise.race([connectPromise, timeoutPromise]);
    
    // Run a simple query
    const result = await testClient.$queryRaw`SELECT version()`;
    console.log('Database version:', result);
    
    // Disconnect immediately
    await testClient.$disconnect();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Connection successful',
      version: result
    });
  } catch (error: any) {
    console.error('Test connection error:', error);
    
    // Try to disconnect if connected
    if (testClient) {
      try {
        await testClient.$disconnect();
      } catch {}
    }
    
    // Parse error message
    let errorMessage = error.message || 'Unknown error';
    if (errorMessage.includes('P1000')) {
      errorMessage = 'Authentication failed. Check your credentials.';
    } else if (errorMessage.includes('P1001')) {
      errorMessage = 'Cannot reach database server. Check if the host is correct.';
    } else if (errorMessage.includes('P1002')) {
      errorMessage = 'Connection timeout. The server took too long to respond.';
    } else if (errorMessage.includes('ECONNREFUSED')) {
      errorMessage = 'Connection refused. The database may not be running.';
    } else if (errorMessage.includes('EHOSTUNREACH')) {
      errorMessage = 'Host unreachable. Check your network connection.';
    }
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage,
      details: error.message
    });
  }
}