const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupAccounts() {
  try {
    console.log('Setting up authentication accounts...\n');
    
    // 1. Create customer account (Harry)
    try {
      const existingCustomer = await prisma.users.findUnique({
        where: { email: 'harry@intelagentstudios.com' }
      });
      
      if (!existingCustomer) {
        const customerHash = await bcrypt.hash('Customer123!', 10);
        const customer = await prisma.users.create({
          data: {
            email: 'harry@intelagentstudios.com',
            password_hash: customerHash,
            license_key: 'INTL-AGNT-BOSS-MODE',
            name: 'Harry',
            role: 'customer',
            email_verified: true,
            email_verified_at: new Date()
          }
        });
        console.log('✅ Created customer account:');
        console.log('   Email: harry@intelagentstudios.com');
        console.log('   Password: Customer123!');
        console.log('   Role: customer');
        console.log('   License: INTL-AGNT-BOSS-MODE');
      } else {
        console.log('✅ Customer account already exists: harry@intelagentstudios.com');
        
        // Update role if needed
        if (existingCustomer.role !== 'customer') {
          await prisma.users.update({
            where: { id: existingCustomer.id },
            data: { role: 'customer' }
          });
          console.log('   Updated role to: customer');
        }
      }
    } catch (error) {
      console.log('⚠️  Could not create customer account:', error.message);
    }
    
    // 2. Create admin license if needed
    try {
      const adminLicense = await prisma.licenses.findUnique({
        where: { license_key: 'INTL-ADMIN-KEY' }
      });
      
      if (!adminLicense) {
        await prisma.licenses.create({
          data: {
            license_key: 'INTL-ADMIN-KEY',
            email: 'admin@intelagentstudios.com',
            created_at: new Date(),
            status: 'active',
            customer_name: 'Master Admin',
            plan: 'master_admin',
            products: ['admin_panel', 'all_products']
          }
        });
        console.log('\n✅ Created admin license: INTL-ADMIN-KEY');
      }
    } catch (error) {
      console.log('⚠️  Could not create admin license:', error.message);
    }
    
    // 3. Create admin account
    try {
      const existingAdmin = await prisma.users.findUnique({
        where: { email: 'admin@intelagentstudios.com' }
      });
      
      if (!existingAdmin) {
        const adminHash = await bcrypt.hash('Admin123!', 10);
        const admin = await prisma.users.create({
          data: {
            email: 'admin@intelagentstudios.com',
            password_hash: adminHash,
            license_key: 'INTL-ADMIN-KEY',
            name: 'Admin',
            role: 'master_admin',
            email_verified: true,
            email_verified_at: new Date()
          }
        });
        console.log('\n✅ Created admin account:');
        console.log('   Email: admin@intelagentstudios.com');
        console.log('   Password: Admin123!');
        console.log('   Role: master_admin');
        console.log('   License: INTL-ADMIN-KEY');
      } else {
        console.log('\n✅ Admin account already exists: admin@intelagentstudios.com');
        
        // Update role if needed
        if (existingAdmin.role !== 'master_admin') {
          await prisma.users.update({
            where: { id: existingAdmin.id },
            data: { role: 'master_admin' }
          });
          console.log('   Updated role to: master_admin');
        }
      }
    } catch (error) {
      console.log('⚠️  Could not create admin account:', error.message);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📝 ACCOUNT SUMMARY');
    console.log('='.repeat(60));
    console.log('\n1. CUSTOMER ACCOUNT (Test as a customer)');
    console.log('   URL: https://dashboard.intelagentstudios.com/login');
    console.log('   Email: harry@intelagentstudios.com');
    console.log('   Password: Customer123!');
    console.log('   Purpose: Experience the platform as a real customer');
    
    console.log('\n2. ADMIN ACCOUNT (Manage the platform)');
    console.log('   URL: https://dashboard.intelagentstudios.com/admin');
    console.log('   Email: admin@intelagentstudios.com');
    console.log('   Password: Admin123!');
    console.log('   Purpose: Access admin panel, manage users & system');
    
    console.log('\n⚠️  IMPORTANT: Change these passwords after first login!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupAccounts().catch(console.error);