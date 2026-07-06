// Test attendance management endpoint
const API_BASE = 'http://localhost:5000';

async function testAttendanceManagement() {
  console.log('🧪 Testing Attendance Management API...\n');

  try {
    // Step 1: Login as CEO
    console.log('🔐 Step 1: Login as CEO...');
    const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ceo@wis.vn',
        password: 'ceo123'
      })
    });
    const loginData = await loginRes.json();
    
    if (!loginData.success || !loginData.token) {
      console.log('❌ Login failed:', loginData.message);
      return;
    }
    
    console.log('✅ Login successful');
    console.log('   User:', loginData.user.name);
    console.log('   Role:', loginData.user.role);
    const token = loginData.token;

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Step 2: Get all attendance
    console.log('📊 Step 2: Get all attendance for today...');
    const attendanceRes = await fetch(`${API_BASE}/api/attendance/all`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const attendanceData = await attendanceRes.json();
    
    if (!attendanceData.success) {
      console.log('❌ Failed to get attendance:', attendanceData.message);
      return;
    }

    console.log('✅ Attendance data received');
    console.log('\n📈 Statistics:');
    console.log('   Total:', attendanceData.stats.total);
    console.log('   Present:', attendanceData.stats.present);
    console.log('   Late:', attendanceData.stats.late);
    console.log('   Early Leave:', attendanceData.stats.early_leave);
    console.log('   Absent:', attendanceData.stats.absent);

    console.log('\n👥 Sample Records:');
    attendanceData.attendance.slice(0, 5).forEach((record, i) => {
      console.log(`\n   ${i + 1}. ${record.userId.name}`);
      console.log(`      Status: ${record.status}`);
      console.log(`      Check-in: ${record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString('vi-VN') : '—'}`);
      console.log(`      Check-out: ${record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString('vi-VN') : '—'}`);
      console.log(`      Working hours: ${record.workingHours}h`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Step 3: Test filter by status
    console.log('🔍 Step 3: Test filter by status (late)...');
    const lateRes = await fetch(`${API_BASE}/api/attendance/all?status=late`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const lateData = await lateRes.json();
    
    console.log(`✅ Found ${lateData.count} late records`);
    lateData.attendance.slice(0, 3).forEach((record, i) => {
      console.log(`   ${i + 1}. ${record.userId.name} - ${new Date(record.checkInTime).toLocaleTimeString('vi-VN')}`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAttendanceManagement();
