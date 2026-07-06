// Test admin login and check role
const API_BASE = 'http://localhost:5000';

async function testAdminLogin() {
  console.log('🧪 Testing Admin Login...\n');

  try {
    // Login as admin
    console.log('🔐 Logging in as admin@wis.vn...');
    const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@wis.vn',
        password: 'admin123'
      })
    });

    const loginData = await loginRes.json();
    
    console.log('\n📊 Login Response:');
    console.log('   Success:', loginData.success);
    console.log('   Token:', loginData.token ? loginData.token.substring(0, 30) + '...' : 'None');
    
    if (loginData.user) {
      console.log('\n👤 User Data:');
      console.log('   ID:', loginData.user.id);
      console.log('   Email:', loginData.user.email);
      console.log('   Name:', loginData.user.name);
      console.log('   Role:', loginData.user.role);
      console.log('   Company:', loginData.user.company);
      console.log('   Department:', loginData.user.department);
      console.log('   Status:', loginData.user.status);
      
      // Check if role is group_admin
      if (loginData.user.role === 'group_admin') {
        console.log('\n✅ SUCCESS: User has group_admin role!');
        console.log('   This user SHOULD have access to manage_users permission.');
      } else {
        console.log('\n❌ ERROR: User role is NOT group_admin!');
        console.log('   Expected: group_admin');
        console.log('   Got:', loginData.user.role);
      }
    } else {
      console.log('\n❌ No user data in response');
    }

    if (!loginData.success) {
      console.log('\n❌ Login failed:', loginData.message);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

testAdminLogin();
