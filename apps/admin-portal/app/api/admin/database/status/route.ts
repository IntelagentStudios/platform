import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Hardcoded Railway database URL
const RAILWAY_DATABASE_URL = 'postgresql://railway:iX9nnJ6tyKYg2luc4nRqQLlw3c~*SN0s@centerbeam.proxy.rlwy.net:34807/railway';

// Use the same global singleton
const globalForPrisma = globalThis as unknown as {
  prismaAdmin: PrismaClient | undefined;
};

export async function GET(request: NextRequest) {
  try {
    const hasGlobalConnection = !!globalForPrisma.prismaAdmin;
    let connectionWorking = false;
    let error = null;
    
    if (globalForPrisma.prismaAdmin) {
      try {
        await globalForPrisma.prismaAdmin.$queryRaw`SELECT 1`;
        connectionWorking = true;
      } catch (err: any) {
        error = err.message;
      }
    }
    
    return NextResponse.json({
      hardcodedUrl: 'Railway External Proxy',
      globalConnection: hasGlobalConnection,
      connectionWorking,
      error
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}