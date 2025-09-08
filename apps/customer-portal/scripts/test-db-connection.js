const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const prisma = new PrismaClient();

async function testConnection() {
  console.log('Testing database connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@') || 'Not set');
  
  try {
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully!');
    
    // Test a simple query
    const userCount = await prisma.users.count();
    console.log(`✅ Found ${userCount} users in the database`);
    
    // Check for a specific user
    const testUser = await prisma.users.findFirst({
      where: { email: 'harry@intelagentstudios.com' }
    });
    
    if (testUser) {
      console.log('✅ Found test user:', {
        email: testUser.email,
        name: testUser.name,
        hasPassword: !!testUser.password_hash,
        licenseKey: testUser.license_key
      });
    } else {
      console.log('⚠️ Test user not found');
    }
    
    // Check licenses
    const licenses = await prisma.licenses.count();
    console.log(`✅ Found ${licenses} licenses in the database`);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('\nTroubleshooting steps:');
    console.error('1. Go to Railway Dashboard -> PostgreSQL service -> Connect tab');
    console.error('2. Copy the "Public Network" connection string');
    console.error('3. Update DATABASE_URL in .env.local with the external URL');
    console.error('4. Make sure you are not using the "Private Network" URL locally');
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();