// Check ALL attendance records in database
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Attendance from './src/models/Attendance.js';
import User from './src/models/User.js';

dotenv.config();

async function checkAllAttendance() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    // Get ALL attendance records
    console.log('📊 ALL Attendance Records in Database:');
    console.log('='.repeat(80));
    
    const allRecords = await Attendance.find({})
      .populate('userId', 'name email')
      .sort({ date: -1 });

    console.log(`\nTotal records found: ${allRecords.length}\n`);

    if (allRecords.length === 0) {
      console.log('⚠️  No attendance records in database!');
      console.log('   This means no one has ever checked in.');
    } else {
      allRecords.forEach((record, index) => {
        const dateUTC = record.date.toISOString();
        const dateLocal = record.date.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
        const dateOnly = record.date.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
        
        console.log(`\n[${index + 1}] ${record.userId?.name || 'Unknown User'}`);
        console.log(`    Email: ${record.userId?.email || 'N/A'}`);
        console.log(`    Date (UTC): ${dateUTC}`);
        console.log(`    Date (VN):  ${dateLocal}`);
        console.log(`    Date only:  ${dateOnly}`);
        console.log(`    Status: ${record.status}`);
        
        if (record.checkInTime) {
          console.log(`    Check-in:  ${record.checkInTime.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`);
        }
        if (record.checkOutTime) {
          console.log(`    Check-out: ${record.checkOutTime.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`);
        }
        console.log(`    Hours: ${record.workingHours}h`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n📅 Summary by Date (Vietnam Time):');
    
    // Group by date
    const byDate = {};
    allRecords.forEach(record => {
      const dateKey = record.date.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      if (!byDate[dateKey]) {
        byDate[dateKey] = [];
      }
      byDate[dateKey].push(record);
    });

    Object.keys(byDate).sort().reverse().forEach(dateKey => {
      console.log(`\n${dateKey}: ${byDate[dateKey].length} records`);
      byDate[dateKey].forEach(r => {
        console.log(`  - ${r.userId?.name}: ${r.status}`);
      });
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
    process.exit(0);
  }
}

checkAllAttendance();
