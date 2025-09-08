const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function resetPassword() {
  try {
    console.log('Password Reset Tool');
    console.log('==================\n');
    
    const email = await question('Enter email address: ');
    const newPassword = await question('Enter new password: ');
    
    // Find user
    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase().trim() }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await prisma.users.update({
      where: { email: email.toLowerCase().trim() },
      data: { password_hash: hashedPassword }
    });
    
    console.log('✅ Password updated successfully!');
    console.log('User details:');
    console.log('- Email:', user.email);
    console.log('- Name:', user.name);
    console.log('- License Key:', user.license_key);
    console.log('- Role:', user.role);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

resetPassword();