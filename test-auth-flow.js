// Test script for authentication flow
const API_BASE = 'https://dashboard.intelagentstudios.com/api';

async function testAuthFlow() {
  console.log('🔧 Testing Authentication System...\n');
  
  // Test credentials
  const testEmail = 'test@friend.com';
  const testPassword = 'Password123!';
  const licenseKey = 'INTL-8K3M-QB7X-2024';
  
  try {
    // 1. Test Login
    console.log('1. Testing Login...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('   Status:', loginResponse.status);
    console.log('   Response:', JSON.stringify(loginData, null, 2));
    
    if (loginResponse.ok) {
      console.log('   ✅ Login successful!');
      
      // Get the auth cookie
      const setCookie = loginResponse.headers.get('set-cookie');
      if (setCookie) {
        console.log('   Cookie received:', setCookie.substring(0, 50) + '...');
      }
    } else {
      console.log('   ❌ Login failed:', loginData.error);
    }
    
    console.log('\n2. Testing Product Configuration API...');
    // We'll need to use the old auth for this test since JWT isn't working yet
    const configResponse = await fetch(`${API_BASE}/products/configuration`, {
      headers: {
        'Cookie': 'auth=authenticated-user-harry'
      }
    });
    
    const configData = await configResponse.json();
    console.log('   Status:', configResponse.status);
    if (configResponse.ok) {
      console.log('   ✅ API Access working!');
      console.log('   Chatbot configured:', configData.chatbot?.configured);
    } else {
      console.log('   ❌ API Access failed');
    }
    
    console.log('\n3. Testing Registration Check...');
    const checkResponse = await fetch(`${API_BASE}/auth/register?email=${testEmail}`);
    const checkData = await checkResponse.json();
    console.log('   Has Account:', checkData.hasAccount);
    console.log('   Has License:', checkData.hasLicense);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAuthFlow().then(() => {
  console.log('\n✅ Test complete!');
}).catch(err => {
  console.error('❌ Test error:', err);
});