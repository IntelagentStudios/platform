import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

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
    
    const { action, data } = await request.json();
    
    switch (action) {
      case 'create_master_license': {
        // Create a new consolidated master license for Harry
        const newLicense = await prisma.licenses.create({
          data: {
            license_key: 'INTL-MASTER-2025',
            email: 'harry@intelagentstudios.com',
            status: 'active',
            plan: 'pro_platform',
            products: ['chatbot', 'sales-agent', 'data-enrichment', 'setup-agent'],
            created_at: new Date()
          }
        });
        
        // Update or create user with this license
        await prisma.users.upsert({
          where: { email: 'harry@intelagentstudios.com' },
          update: { 
            license_key: 'INTL-MASTER-2025'
          },
          create: {
            id: randomUUID(),
            email: 'harry@intelagentstudios.com',
            name: 'Harry Southgate',
            license_key: 'INTL-MASTER-2025',
            password_hash: '$2b$10$dummy.hash.for.initial.setup', // User will need to reset password
            email_verified: true
          }
        });
        
        return NextResponse.json({ 
          success: true, 
          license: newLicense,
          message: 'Master license created successfully' 
        });
      }
      
      case 'create_product_key': {
        const { licenseKey, product, productKey } = data;
        
        // Create the specific product key for the website embed
        const newProductKey = await prisma.product_keys.create({
          data: {
            product_key: productKey || 'key_ya4c9x7shyz3djpn',
            license_key: licenseKey,
            product: product,
            status: 'active'
          }
        });
        
        return NextResponse.json({ 
          success: true, 
          productKey: newProductKey,
          embedCode: `<script src="https://dashboard.intelagentstudios.com/chatbot-widget.js" data-site-key="${newProductKey.product_key}"></script>`
        });
      }
      
      case 'delete_license': {
        const { licenseKey } = data;
        
        // First delete associated product keys
        await prisma.product_keys.deleteMany({
          where: { license_key: licenseKey }
        });
        
        // Update any users using this license to null
        await prisma.users.updateMany({
          where: { license_key: licenseKey },
          data: { license_key: null }
        });
        
        // Delete the license
        await prisma.licenses.delete({
          where: { license_key: licenseKey }
        });
        
        return NextResponse.json({ 
          success: true, 
          message: `License ${licenseKey} deleted` 
        });
      }
      
      case 'list_for_cleanup': {
        // Get all licenses for review
        const licenses = await prisma.licenses.findMany({
          orderBy: { created_at: 'desc' }
        });
        
        const licensesWithDetails = await Promise.all(licenses.map(async (license) => {
          const user = await prisma.users.findFirst({
            where: { license_key: license.license_key }
          });
          const productKeys = await prisma.product_keys.count({
            where: { license_key: license.license_key }
          });
          
          return {
            license_key: license.license_key,
            email: license.email,
            name: user?.name || 'Unknown',
            status: license.status,
            user_email: user?.email,
            product_key_count: productKeys,
            created_at: license.created_at
          };
        }));
        
        return NextResponse.json({ 
          success: true, 
          licenses: licensesWithDetails,
          duplicates: licensesWithDetails.filter(l => 
            l.email === 'harry@intelagentstudios.com'
          ),
          test_accounts: licensesWithDetails.filter(l => 
            l.email?.includes('test') || l.email?.includes('friend')
          )
        });
      }
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
  } catch (error) {
    console.error('License consolidation error:', error);
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }
}