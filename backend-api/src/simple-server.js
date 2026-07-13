import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import Attendance from './models/Attendance.js';
import User from './models/User.js';
import chatRoutes from './routes/chatRoutes.js';
import projectRoutes from './routes/projectRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(','), credentials: true }));
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// MongoDB connect
console.log('🔄 Connecting to MongoDB...');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    console.log('📊 Database:', mongoose.connection.name);
  })
  .catch(err => console.error('❌ MongoDB Error:', err));

// Auth middleware
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('🔐 [Auth Middleware] Checking authorization:', {
      hasAuthHeader: !!authHeader,
      authHeaderPreview: authHeader ? `${authHeader.substring(0, 30)}...` : 'null',
      path: req.path,
      method: req.method,
    });
    
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      console.log('❌ [Auth Middleware] No token provided');
      return res.status(401).json({ success: false, message: 'Không có token' });
    }
    
    console.log('🔍 [Auth Middleware] Verifying token with JWT_SECRET...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ [Auth Middleware] Token verified successfully for user:', decoded.email);
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('❌ [Auth Middleware] Token verification failed:', {
      error: error.message,
      name: error.name,
    });
    res.status(401).json({ success: false, message: 'Token không hợp lệ' });
  }
};

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running!',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ==================== AUTH ENDPOINTS ====================

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔑 [Login] Attempting login for:', email);
    
    // Need to explicitly select password since it's excluded by default
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('❌ [Login] User not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('❌ [Login] Password mismatch for:', email);
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng',
      });
    }

    console.log('✅ [Login] Password verified, generating token with JWT_SECRET:', process.env.JWT_SECRET?.substring(0, 10) + '...');
    
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        company: user.company,
        department: user.department,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    console.log('✅ [Login] Token generated successfully, length:', token.length);
    
    res.json({
      success: true,
      token,
      user: user.getPublicProfile(),
    });
  } catch (error) {
    console.error('❌ [Login] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get profile
app.get('/api/auth/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User không tồn tại' });
    }
    res.json({ success: true, user: user.getPublicProfile() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update profile
app.put('/api/auth/profile', protect, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User không tồn tại' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    
    await user.save();
    
    res.json({ success: true, user: user.getPublicProfile() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Change password
app.put('/api/auth/change-password', protect, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    // Need to select password field
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User không tồn tại' });
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mật khẩu cũ không đúng' });
    }

    user.password = newPassword;
    await user.save();
    
    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== USER MANAGEMENT ENDPOINTS ====================

// Get all users (Admin and CEO only)
app.get('/api/users', protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User không tồn tại' });
    }

    let query = {};
    
    // CEO sees all users except admin
    if (currentUser.role === 'group_ceo') {
      query = { role: { $ne: 'group_admin' } };
    } else if (currentUser.role !== 'group_admin') {
      // Other roles cannot access this endpoint
      return res.status(403).json({ 
        success: false, 
        message: 'Bạn không có quyền truy cập' 
      });
    }
    // Admin sees all users (no filter)

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users: users.map(u => u.getPublicProfile()),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user by ID
app.get('/api/users/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User không tồn tại' });
    }

    res.json({ success: true, user: user.getPublicProfile() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create user (Admin and CEO only)
app.post('/api/users', protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    
    if (!['group_admin', 'group_ceo'].includes(currentUser.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bạn không có quyền tạo user' 
      });
    }

    const { username, email, password, name, role, company, department, phone } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email hoặc username đã tồn tại',
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      name,
      role,
      company,
      department,
      phone,
      status: 'active',
    });

    res.status(201).json({
      success: true,
      user: user.getPublicProfile(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user (Admin and CEO only)
app.put('/api/users/:id', protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    
    if (!['group_admin', 'group_ceo'].includes(currentUser.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bạn không có quyền cập nhật user' 
      });
    }

    const { name, role, company, department, phone, status } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User không tồn tại' });
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (company) user.company = company;
    if (department) user.department = department;
    if (phone !== undefined) user.phone = phone;
    if (status) user.status = status;

    await user.save();

    res.json({ success: true, user: user.getPublicProfile() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete user (Admin and CEO only)
app.delete('/api/users/:id', protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    
    if (!['group_admin', 'group_ceo'].includes(currentUser.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bạn không có quyền xóa user' 
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User không tồn tại' });
    }

    // Prevent deleting admin
    if (user.role === 'group_admin') {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa admin',
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Xóa user thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== ATTENDANCE ENDPOINTS ====================

// Check-in
app.post('/api/attendance/check-in', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({ userId, date: today });

    if (attendance && attendance.checkInTime) {
      return res.status(400).json({
        success: false,
        message: 'Đã chấm công vào hôm nay rồi',
        attendance: attendance.getPublicProfile(),
      });
    }

    if (!attendance) {
      attendance = new Attendance({ userId, date: today });
    }

    attendance.checkInTime = new Date();
    
    const hour = attendance.checkInTime.getHours();
    const minute = attendance.checkInTime.getMinutes();
    const checkInHour = hour + minute / 60;

    if (checkInHour > 8.5) {
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// Check-out
app.post('/api/attendance/check-out', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({ userId, date: today });

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
      });
    }

    attendance.checkOutTime = new Date();
    attendance.calculateWorkingHours();

    const hour = attendance.checkOutTime.getHours();
    const minute = attendance.checkOutTime.getMinutes();
    const checkOutHour = hour + minute / 60;

    if (checkOutHour < 16.5) {
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get today
app.get('/api/attendance/today', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({ userId, date: today });

    if (!attendance) {
      attendance = { userId, date: today, status: 'absent', checkInTime: null, checkOutTime: null, workingHours: 0 };
    }

    res.status(200).json({
      success: true,
      attendance: attendance.getPublicProfile ? attendance.getPublicProfile() : attendance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get history
app.get('/api/attendance/history', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;

    let query = { userId };

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendance = await Attendance.find(query).sort({ date: -1 }).limit(30);

    res.status(200).json({
      success: true,
      count: attendance.length,
      attendance: attendance.map(a => a.getPublicProfile()),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all attendance (Admin/CEO only)
app.get('/api/attendance/all', protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    
    // Only Admin, CEO, Directors, and Managers can view
    const allowedRoles = ['group_admin', 'group_ceo', 'group_director', 'company_ceo', 'company_deputy', 'dept_manager'];
    if (!allowedRoles.includes(currentUser.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bạn không có quyền truy cập' 
      });
    }

    const { date, status, company, department } = req.query;
    
    // Build query
    let query = {};
    let displayDate; // The actual date to display
    
    // Date filter (default to today)
    if (date) {
      // Parse the date string as local Vietnam time, then create range
      const selectedDate = new Date(date);
      selectedDate.setHours(0, 0, 0, 0);
      displayDate = new Date(selectedDate);
      
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      query.date = { $gte: selectedDate, $lt: nextDay };
    } else {
      // For today, use local time
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      displayDate = new Date(today);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      query.date = { $gte: today, $lt: tomorrow };
    }

    // Get all attendance records
    const attendanceRecords = await Attendance.find(query)
      .sort({ checkInTime: 1 })
      .populate('userId', 'name email role company department');

    // Filter by company if not group level
    let filteredRecords = attendanceRecords;
    if (currentUser.role === 'company_ceo' || currentUser.role === 'company_deputy') {
      filteredRecords = attendanceRecords.filter(a => a.userId?.company === currentUser.company);
    } else if (currentUser.role === 'dept_manager') {
      filteredRecords = attendanceRecords.filter(a => a.userId?.department === currentUser.department);
    }

    // Apply additional filters
    if (status) {
      filteredRecords = filteredRecords.filter(a => a.status === status);
    }
    if (company) {
      filteredRecords = filteredRecords.filter(a => a.userId?.company === company);
    }
    if (department) {
      filteredRecords = filteredRecords.filter(a => a.userId?.department === department);
    }

    // Get all users to find who didn't check in
    let allUsers = await User.find({ status: 'active' }).select('name email role company department');
    
    // Filter users by role access
    if (currentUser.role === 'company_ceo' || currentUser.role === 'company_deputy') {
      allUsers = allUsers.filter(u => u.company === currentUser.company);
    } else if (currentUser.role === 'dept_manager') {
      allUsers = allUsers.filter(u => u.department === currentUser.department);
    }
    
    // Find users who didn't check in
    const checkedInUserIds = new Set(filteredRecords.map(a => a.userId?._id?.toString()));
    const absentUsers = allUsers.filter(u => !checkedInUserIds.has(u._id.toString()));

    // Create absent records
    const absentRecords = absentUsers.map(user => ({
      userId: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        department: user.department,
      },
      date: displayDate,
      status: 'absent',
      checkInTime: null,
      checkOutTime: null,
      workingHours: 0,
    }));

    // Combine and sort
    const allRecords = [
      ...filteredRecords.map(a => ({
        _id: a._id,
        userId: a.userId,
        date: a.date,
        checkInTime: a.checkInTime,
        checkOutTime: a.checkOutTime,
        status: a.status,
        workingHours: a.workingHours,
      })),
      ...absentRecords,
    ].sort((a, b) => {
      // Sort by status priority: absent > late > early_leave > present
      const statusPriority = { absent: 0, late: 1, early_leave: 2, present: 3 };
      return statusPriority[a.status] - statusPriority[b.status];
    });

    // Calculate statistics
    const stats = {
      total: allRecords.length,
      present: allRecords.filter(a => a.status === 'present').length,
      late: allRecords.filter(a => a.status === 'late').length,
      early_leave: allRecords.filter(a => a.status === 'early_leave').length,
      absent: allRecords.filter(a => a.status === 'absent').length,
    };

    res.json({
      success: true,
      date: displayDate,
      stats,
      count: allRecords.length,
      attendance: allRecords,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== CHAT ENDPOINTS ====================
// Use chat routes with authentication middleware
app.use('/api/chat', protect, chatRoutes);

// ==================== PROJECT ENDPOINTS ====================
// Use project routes with authentication middleware
app.use('/api', protect, projectRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 WIS QuanLy API Server (Simplified)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
  console.log(`🔑 JWT_SECRET: ${process.env.JWT_SECRET?.substring(0, 20)}...`);
  console.log(`⏰ JWT_EXPIRE: ${process.env.JWT_EXPIRE || '7d'}`);
  console.log(`🌐 CORS_ORIGIN: ${process.env.CORS_ORIGIN}`);
  console.log(`⏰ Attendance API: /api/attendance/*`);
  console.log(`💬 Chat API: /api/chat/*`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});
