import { prisma } from '@intelagent/database';

async function checkDatabase() {
  console.log('🔍 Checking database connection...\n');
  
  try {
    // Test basic connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connected successfully!\n');
    
    // Check for users table
    const userCount = await prisma.users.count();
    console.log(`📊 Users in database: ${userCount}`);
    
    // Check for specific user
    const harry = await prisma.users.findUnique({
      where: { email: 'harry@intelagentstudios.com' },
      include: { license: true }
    });
    
    if (harry) {
      console.log('\n✅ Harry found:');
      console.log(`  - ID: ${harry.id}`);
      console.log(`  - Email: ${harry.email}`);
      console.log(`  - License: ${harry.license_key}`);
      console.log(`  - Has password: ${!!harry.password_hash}`);
    } else {
      console.log('\n❌ Harry not found in database');
    }
    
    // Check database URL (masked)
    const dbUrl = process.env.DATABASE_URL || 'NOT SET';
    const maskedUrl = dbUrl.includes('@') 
      ? dbUrl.substring(0, dbUrl.indexOf('://') + 3) + '***' + dbUrl.substring(dbUrl.lastIndexOf('@'))
      : dbUrl.substring(0, 30) + '...';
    console.log(`\n🔗 Database URL: ${maskedUrl}`);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('\nMake sure:');
    console.error('1. DATABASE_URL is set correctly');
    console.error('2. Database server is running');
    console.error('3. Prisma client is generated (npx prisma generate)');
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();