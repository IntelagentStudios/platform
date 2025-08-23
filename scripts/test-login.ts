import { prisma } from '@intelagent/database';
import bcrypt from 'bcryptjs';

async function testLogin() {
  const email = 'harry@intelagentstudios.com';
  const testPassword = 'your_password_here'; // Replace with your actual password
  
  try {
    // Find the user
    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', user.email);
    console.log('Password hash exists:', !!user.password_hash);
    console.log('Password hash:', user.password_hash);
    
    // Test password verification
    if (user.password_hash) {
      const isValid = await bcrypt.compare(testPassword, user.password_hash);
      console.log('Password match:', isValid ? '✅ Valid' : '❌ Invalid');
      
      // If invalid, let's create a new hash for testing
      if (!isValid) {
        const newHash = await bcrypt.hash(testPassword, 12);
        console.log('\nTo fix, update password hash to:', newHash);
        
        // Uncomment to actually update:
        // await prisma.users.update({
        //   where: { email: email.toLowerCase() },
        //   data: { password_hash: newHash }
        // });
        // console.log('Password updated!');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();