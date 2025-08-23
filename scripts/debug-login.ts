import { prisma } from '@intelagent/database';
import bcrypt from 'bcryptjs';

async function debugLogin() {
  try {
    // Check if INTL-AGNT-BOSS-MODE user exists
    const users = await prisma.users.findMany({
      where: { license_key: 'INTL-AGNT-BOSS-MODE' },
      select: {
        id: true,
        email: true,
        password_hash: true,
        license_key: true,
        name: true,
        created_at: true
      }
    });

    if (users.length === 0) {
      console.log('❌ No user found with INTL-AGNT-BOSS-MODE license');
    } else {
      console.log(`✅ Found ${users.length} user(s) with INTL-AGNT-BOSS-MODE:`);
      
      for (const user of users) {
        console.log('\nUser Details:');
        console.log('- ID:', user.id);
        console.log('- Email:', user.email);
        console.log('- Name:', user.name);
        console.log('- Password Hash:', user.password_hash ? 'Present' : 'Missing');
        console.log('- Created:', user.created_at);
        
        // Test password hashing
        const testPassword = 'TestPassword123';
        const hash = await bcrypt.hash(testPassword, 12);
        const isValid = await bcrypt.compare(testPassword, hash);
        console.log('\nPassword hashing test:', isValid ? '✅ Working' : '❌ Failed');
      }
    }

    // Check all users in database
    const allUsers = await prisma.users.findMany({
      select: {
        email: true,
        license_key: true
      }
    });
    
    console.log(`\n📊 Total users in database: ${allUsers.length}`);
    allUsers.forEach(u => {
      console.log(`   - ${u.email} (${u.license_key})`);
    });

  } catch (error) {
    console.error('Error debugging login:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugLogin();