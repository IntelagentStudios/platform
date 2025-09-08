import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check database connection
    const dbConnected = await prisma.$queryRaw`SELECT 1`
      .then(() => true)
      .catch(() => false);
    
    // Count users
    const userCount = await prisma.users.count().catch(() => -1);
    
    // Count licenses
    const licenseCount = await prisma.licenses.count().catch(() => -1);
    
    // Check for harry@intelagentstudios.com
    const harryExists = await prisma.users.findUnique({
      where: { email: 'harry@intelagentstudios.com' },
      select: {
        email: true,
        name: true,
        role: true,
        license_key: true,
        created_at: true
      }
    }).catch(() => null);
    
    // Check harry's license if exists
    let licenseInfo = null;
    if (harryExists?.license_key) {
      licenseInfo = await prisma.licenses.findUnique({
        where: { license_key: harryExists.license_key },
        select: {
          license_key: true,
          status: true,
          plan: true,
          is_pro: true,
          products: true
        }
      }).catch(() => null);
    }
    
    // Environment info
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasRedisUrl: !!process.env.REDIS_URL,
      databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + '...',
      isRailway: process.env.DATABASE_URL?.includes('railway'),
      isInternal: process.env.DATABASE_URL?.includes('railway.internal')
    };
    
    return NextResponse.json({
      status: 'diagnostic',
      timestamp: new Date().toISOString(),
      database: {
        connected: dbConnected,
        userCount,
        licenseCount
      },
      testUser: harryExists ? {
        found: true,
        ...harryExists,
        hasPassword: false // Don't expose password info
      } : {
        found: false
      },
      license: licenseInfo,
      environment: envInfo,
      message: dbConnected ? 'Database connected' : 'Database connection failed'
    });
    
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}