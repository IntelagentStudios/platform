import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const cookieStore = cookies();
    const adminToken = cookieStore.get('admin_token');
    
    if (!adminToken) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }
    
    try {
      const decoded = jwt.verify(adminToken.value, JWT_SECRET) as any;
      if (!decoded.isAdmin) {
        return NextResponse.json({ error: 'Not an admin' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const { productKey } = await request.json();
    
    // Search for the product key
    const productKeyRecord = await prisma.product_keys.findFirst({
      where: {
        product_key: productKey
      }
    });
    
    if (!productKeyRecord) {
      return NextResponse.json({ 
        found: false, 
        message: 'Product key not found in database' 
      });
    }
    
    // Get the associated license
    const license = await prisma.licenses.findFirst({
      where: {
        license_key: productKeyRecord.license_key
      }
    });
    
    // Get the user
    const user = await prisma.users.findFirst({
      where: {
        license_key: productKeyRecord.license_key
      }
    });
    
    return NextResponse.json({
      found: true,
      productKey: productKeyRecord,
      license: license,
      user: user,
      summary: {
        productKey: productKey,
        licenseKey: productKeyRecord.license_key,
        product: productKeyRecord.product,
        status: productKeyRecord.status,
        createdAt: productKeyRecord.created_at,
        lastUsed: productKeyRecord.last_used_at,
        userEmail: user?.email || 'No user found',
        userName: user?.name || 'Unknown'
      }
    });
    
  } catch (error) {
    console.error('Error searching for product key:', error);
    return NextResponse.json({ error: 'Failed to search product key' }, { status: 500 });
  }
}