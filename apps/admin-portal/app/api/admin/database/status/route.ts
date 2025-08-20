import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { readFile } from 'fs/promises';
import path from 'path';

// Use the same global singleton
const globalForPrisma = globalThis as unknown as {
  prismaAdmin: PrismaClient | undefined;
  prismaUrl: string | undefined;
};

const CONFIG_FILE = path.join(process.cwd(), '.database-config.json');

async function loadConnectionUrl(): Promise<string | null> {
  try {
    const data = await readFile(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(data);
    return config.url;
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const savedUrl = await loadConnectionUrl();
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
      savedUrl: savedUrl ? 'Yes (hidden for security)' : 'No',
      globalConnection: hasGlobalConnection,
      connectionWorking,
      error,
      globalUrl: globalForPrisma.prismaUrl ? 'Yes (hidden for security)' : 'No'
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}