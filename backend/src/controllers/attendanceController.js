// Attendance Management Controller
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';

// @desc    Check-in for today
// @route   POST /api/attendance/check-in
// @access  Private
export const checkIn = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    let attendance = await Attendance.findOne({
      userId,
      date: today,
    });

    if (attendance && attendance.checkInTime) {
      return res.status(400).json({
        success: false,
        message: 'Đã chấm công vào hôm nay rồi',
        attendance: attendance.getPublicProfile(),
      });
    }

    if (!attendance) {
      attendance = new Attendance({
        userId,
        date: today,
      });
    }

    attendance.checkInTime = new Date();
    
    // Determine status based on check-in time
    const hour = attendance.checkInTime.getHours();
    const minute = attendance.checkInTime.getMinutes();
    const checkInHour = hour + minute / 60;

    // Assume work starts at 8:00 AM (8.0)
    if (checkInHour > 8.5) { // After 8:30 AM
      attendance.status = 'late';
    } else {
      attendance.status = 'present';
    }

    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Chấm công vào thành công',
      attendance: attendance.getPublicProfile(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi chấm công vào',
      error: error.message,
    });
  }
};

// @desc    Check-out for today
// @route   POST /api/attendance/check-out
// @access  Private
export const checkOut = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      userId,
      date: today,
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Chưa chấm công vào hôm nay',
      });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({
        success: false,
        message: 'Đã chấm công ra rồi',
        attendance: attendance.getPublicProfile(),
      });
    }

    attendance.checkOutTime = new Date();
    
    // Calculate working hours
    attendance.calculateWorkingHours();

    // Update status based on check-out time
    const hour = attendance.checkOutTime.getHours();
    const minute = attendance.checkOutTime.getMinutes();
    const checkOutHour = hour + minute / 60;

    // Assume work ends at 5:00 PM (17.0)
    if (checkOutHour < 16.5) { // Before 4:30 PM
      attendance.status = 'early_leave';
    } else if (attendance.status !== 'late') {
      attendance.status = 'present';
    }

    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Chấm công ra thành công',
      attendance: attendance.getPublicProfile(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi chấm công ra',
      error: error.message,
    });
  }
};

// @desc    Get today's attendance status
// @route   GET /api/attendance/today
// @access  Private
export const getTodayAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({
      userId,
      date: today,
    }).populate('userId', 'name email');

    if (!attendance) {
      attendance = new Attendance({
        userId,
        date: today,
        status: 'absent',
      });
    }

    res.status(200).json({
      success: true,
      attendance: attendance.getPublicProfile(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin chấm công',
      error: error.message,
    });
  }
};

// @desc    Get attendance history for user
// @route   GET /api/attendance/history
// @access  Private
export const getAttendanceHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;

    // Build date filter
    let query = { userId };

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(30);

    res.status(200).json({
      success: true,
      count: attendance.length,
      attendance: attendance.map(a => a.getPublicProfile()),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy lịch sử chấm công',
      error: error.message,
    });
  }
};

// @desc    Get attendance statistics for department/company (Admin/Manager)
// @route   GET /api/attendance/stats
// @access  Private/Manager
export const getAttendanceStats = async (req, res) => {
  try {
    const { startDate, endDate, company, department } = req.query;

    // Build query
    let userQuery = {};
    if (company) userQuery.company = company;
    if (department) userQuery.department = department;

    const users = await User.find(userQuery).select('_id');
    const userIds = users.map(u => u._id);

    let attendanceQuery = { userId: { $in: userIds } };
    if (startDate && endDate) {
      attendanceQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const stats = await Attendance.aggregate([
      { $match: attendanceQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgWorkingHours: { $avg: '$workingHours' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thống kê chấm công',
      error: error.message,
    });
  }
};

// @desc    Mark absent for specific user and date (Admin only)
// @route   POST /api/attendance/mark-absent
// @access  Private/Admin
export const markAbsent = async (req, res) => {
  try {
    const { userId, date, reason } = req.body;

    if (!userId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp userId và date',
      });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({
      userId,
      date: attendanceDate,
    });

    if (!attendance) {
      attendance = new Attendance({
        userId,
        date: attendanceDate,
      });
    }

    attendance.status = 'absent';
    attendance.notes = reason || 'Không đi làm';

    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Đánh dấu vắng mặt thành công',
      attendance: attendance.getPublicProfile(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi đánh dấu vắng mặt',
      error: error.message,
    });
  }
};
