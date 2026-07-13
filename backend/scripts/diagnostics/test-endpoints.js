// Quick test of attendance endpoints
const API_BASE = 'http://localhost:5000';

async function testEndpoints() {
  console.log('🧪 Testing WIS API Endpoints...\n');

  // Test 1: Health check
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    console.log('✅ Health Check:', data);
  } catch (err) {
    console.log('❌ Health Check Failed:', err.message);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test 2: Login to get token
  try {
    console.log('🔐 Testing Login...');
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ceo@wis.vn',
        password: 'ceo123'
      })
    });
    const data = await res.json();
    
    if (data.success && data.token) {
      console.log('✅ Login Success');
      console.log('   User:', data.user.name);
      console.log('   Role:', data.user.role);
      console.log('   Token:', data.token.substring(0, 20) + '...');
      
      const token = data.token;

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Test 3: Today's attendance
      console.log('📅 Testing GET /api/attendance/today...');
      const todayRes = await fetch(`${API_BASE}/api/attendance/today`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const todayData = await todayRes.json();
      console.log('   Response:', todayData);

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Test 4: Check-in
      console.log('⏰ Testing POST /api/attendance/check-in...');
      const checkInRes = await fetch(`${API_BASE}/api/attendance/check-in`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const checkInData = await checkInRes.json();
      console.log('   Response:', checkInData);

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Test 5: History
      console.log('📋 Testing GET /api/attendance/history...');
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const historyRes = await fetch(
        `${API_BASE}/api/attendance/history?month=${month}&year=${year}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const historyData = await historyRes.json();
      console.log('   Response:', historyData);

    } else {
      console.log('❌ Login Failed:', data.message);
    }
  } catch (err) {
    console.log('❌ Test Failed:', err.message);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ All tests completed!');
}

testEndpoints();
