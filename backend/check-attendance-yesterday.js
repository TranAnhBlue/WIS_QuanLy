// Check attendance for today (7/7/2026) with LOCAL time parsing
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Attendance from './src/models/Attendance.js';
import User from './src/models/User.js';

dotenv.config();

async function checkTodayAttendance() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    // Test for today (7/7/2026) using LOCAL time parsing (like the fixed backend)
    const dateStr = '2026-07-07';
    const selectedDate = new Date(dateStr);
    selectedDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);

    console.log('🔍 Searching for attendance on 7/7/2026 (TODAY)...');
    console.log('   Start:', selectedDate.toISOString(), '(', selectedDate.toLocaleString('vi-VN'), ')');
    console.log('   End:', nextDay.toISOString(), '(', nextDay.toLocaleString('vi-VN'), ')');
    console.log('');

    // Query with local time range
    const records = await Attendance.find({
      date: { $gte: selectedDate, $lt: nextDay }
    }).populate('userId', 'name email');

    console.log(`📊 Found: ${records.length} records for 7/7/2026`);
    
    if (records.length > 0) {
      records.forEach(r => {
        console.log(`\n   ✅ ${r.userId?.name || 'Unknown'}: ${r.status}`);
        console.log(`      Date in DB: ${r.date.toISOString()}`);
        console.log(`      Date (VN):  ${r.date.toLocaleString('vi-VN')}`);
        console.log(`      Check-in:   ${r.checkInTime ? r.checkInTime.toLocaleString('vi-VN') : 'N/A'}`);
        console.log(`      Check-out:  ${r.checkOutTime ? r.checkOutTime.toLocaleString('vi-VN') : 'N/A'}`);
        console.log(`      Hours:      ${r.workingHours}h`);
      });
    } else {
      console.log('   ❌ No records found for today!');
      console.log('   This should NOT happen if someone checked in today.');
    }

    // Show what's actually in database
    console.log('\n\n📅 What is actually in database:');
    const allRecords = await Attendance.find({})
      .populate('userId', 'name')
      .sort({ date: -1 })
      .limit(3);
    
    allRecords.forEach(r => {
      console.log(`   - ${r.date.toISOString()} = ${r.date.toLocaleDateString('vi-VN')} - ${r.userId?.name}: ${r.status}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
    process.exit(0);
  }
}

checkTodayAttendance();
