import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { generateProductKey } from '@/lib/product-keys';

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
      case 'configure_existing': {
        const { licenseKey } = data;
        
        // Update the selected license to be fully configured
        const updatedLicense = await prisma.licenses.update({
          where: { license_key: licenseKey },
          data: {
            status: 'active',
            plan: 'pro_platform',
            products: ['chatbot', 'sales-outreach-agent', 'data-enrichment', 'onboarding-agent']
          }
        });
        
        // Update or create user with this license
        await prisma.users.upsert({
          where: { email: 'harry@intelagentstudios.com' },
          update: { 
            license_key: licenseKey
          },
          create: {
            id: randomUUID(),
            email: 'harry@intelagentstudios.com',
            name: 'Harry Southgate',
            license_key: licenseKey,
            password_hash: '$2b$10$dummy.hash.for.initial.setup', // User will need to reset password
            email_verified: true
          }
        });
        
        return NextResponse.json({ 
          success: true, 
          license: updatedLicense,
          message: `License ${licenseKey} configured as primary license` 
        });
      }
      
      case 'create_product_key': {
        const { licenseKey, product, productKey } = data;
        
        // Generate a new product key if not provided
        const generatedKey = productKey || generateProductKey(product || 'chatbot').key;
        
        // Create the specific product key for the website embed
        const newProductKey = await prisma.product_keys.create({
          data: {
            product_key: generatedKey,
            license_key: licenseKey,
            product: product || 'chatbot',
            status: 'active'
          }
        });
        
        return NextResponse.json({ 
          success: true, 
          productKey: newProductKey,
          embedCode: `<script src="https://dashboard.intelagentstudios.com/chatbot-widget.js" data-site-key="${newProductKey.product_key}"></script>`
        });
      }
      
      case 'delete_product_keys': {
        const { licenseKey } = data;
        
        try {
          console.log(`Attempting to delete product keys for license: ${licenseKey}`);
          
          // First, let's check what product keys exist
          const existingKeys = await prisma.product_keys.findMany({
            where: { license_key: licenseKey }
          });
          
          console.log(`Found ${existingKeys.length} product keys to delete:`, existingKeys.map(k => k.product_key));
          
          let deletedLogs = 0;
          let deletedKnowledge = 0;
          
          // Delete all related data for each product key
          for (const key of existingKeys) {
            // Delete chatbot logs first (they have foreign key constraint)
            try {
              const logsDeleted = await prisma.chatbot_logs.deleteMany({
                where: { product_key: key.product_key }
              });
              deletedLogs += logsDeleted.count;
              console.log(`Deleted ${logsDeleted.count} chatbot logs for ${key.product_key}`);
            } catch (logErr) {
              console.log(`Error deleting chatbot logs for ${key.product_key}:`, logErr);
            }
            
            // Delete custom knowledge
            try {
              const knowledgeDeleted = await prisma.custom_knowledge.deleteMany({
                where: { product_key: key.product_key }
              });
              deletedKnowledge += knowledgeDeleted.count;
              console.log(`Deleted ${knowledgeDeleted.count} custom knowledge entries for ${key.product_key}`);
            } catch (knowledgeErr) {
              console.log(`Error deleting custom knowledge for ${key.product_key}:`, knowledgeErr);
            }
          }
          
          // Now delete all product keys for this license
          const deleted = await prisma.product_keys.deleteMany({
            where: { license_key: licenseKey }
          });
          
          console.log(`Successfully deleted ${deleted.count} product keys, ${deletedLogs} chat logs, ${deletedKnowledge} knowledge entries`);
          
          return NextResponse.json({ 
            success: true, 
            message: `Deleted ${deleted.count} product keys (and ${deletedLogs} chat logs, ${deletedKnowledge} knowledge entries) for license ${licenseKey}` 
          });
        } catch (error: any) {
          console.error('Error deleting product keys:', error);
          return NextResponse.json({ 
            success: false,
            error: error.message,
            message: `Failed to delete product keys: ${error.message}`,
            details: error.toString()
          }, { status: 400 });
        }
      }
      
      case 'delete_license': {
        const { licenseKey } = data;
        
        try {
          // First delete associated product keys
          const deletedKeys = await prisma.product_keys.deleteMany({
            where: { license_key: licenseKey }
          });
          console.log(`Deleted ${deletedKeys.count} product keys for ${licenseKey}`);
          
          // Check if any users are using this license
          const usersWithLicense = await prisma.users.findMany({
            where: { license_key: licenseKey }
          });
          
          if (usersWithLicense.length > 0) {
            console.log(`Found ${usersWithLicense.length} users with license ${licenseKey}, setting to null`);
            // Don't delete user accounts, just remove their license association
            await prisma.users.updateMany({
              where: { license_key: licenseKey },
              data: { license_key: 'NEEDS_LICENSE' } // Set to placeholder instead of null
            });
          }
          
          // Delete the license
          await prisma.licenses.delete({
            where: { license_key: licenseKey }
          });
          
          return NextResponse.json({ 
            success: true, 
            message: `License ${licenseKey} and ${deletedKeys.count} product keys deleted` 
          });
        } catch (error: any) {
          console.error('Error deleting license:', error);
          return NextResponse.json({ 
            success: false,
            error: error.message,
            message: `Failed to delete license ${licenseKey}: ${error.message}` 
          }, { status: 400 });
        }
      }
      
      case 'list_product_keys': {
        const { licenseKey } = data;
        
        const productKeys = await prisma.product_keys.findMany({
          where: { license_key: licenseKey },
          orderBy: { created_at: 'desc' }
        });
        
        return NextResponse.json({ 
          success: true, 
          productKeys
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
          const productKeys = await prisma.product_keys.findMany({
            where: { license_key: license.license_key }
          });
          
          return {
            license_key: license.license_key,
            email: license.email,
            name: user?.name || 'Unknown',
            status: license.status,
            user_email: user?.email,
            product_key_count: productKeys.length,
            product_keys: productKeys.map(pk => ({
              key: pk.product_key,
              product: pk.product,
              status: pk.status
            })),
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