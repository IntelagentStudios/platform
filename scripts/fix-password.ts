import { prisma } from '@intelagent/database';
import bcrypt from 'bcryptjs';

async function fixPassword() {
  const email = 'harry@intelagentstudios.com';
  const correctPassword = 'Birksgrange226!';
  
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
    console.log('Current password hash:', user.password_hash?.substring(0, 20) + '...');
    
    // Test current password
    const currentValid = await bcrypt.compare(correctPassword, user.password_hash);
    console.log('Current password works:', currentValid ? '✅ Yes' : '❌ No');
    
    if (!currentValid) {
      console.log('\n🔧 Fixing password hash...');
      
      // Create new hash
      const newHash = await bcrypt.hash(correctPassword, 12);
      
      // Update user
      await prisma.users.update({
        where: { email: email.toLowerCase() },
        data: { password_hash: newHash }
      });
      
      console.log('✅ Password updated successfully!');
      
      // Verify it works
      const updatedUser = await prisma.users.findUnique({
        where: { email: email.toLowerCase() }
      });
      
      const nowValid = await bcrypt.compare(correctPassword, updatedUser!.password_hash);
      console.log('Password now works:', nowValid ? '✅ Yes' : '❌ No');
    } else {
      console.log('✅ Password already works correctly!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPassword();