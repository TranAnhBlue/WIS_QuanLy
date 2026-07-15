import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import Attendance from "./models/Attendance.js";
import User from "./models/User.js";
import Notification from "./models/Notification.js";
import chatRoutes from "./routes/chatRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import businessRoutes from "./routes/businessRoutes.js";
import { register } from "./controllers/authController.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import assistantRoutes from "./routes/assistantRoutes.js";
import { avatarUpload } from "./middleware/upload.js";
import { deleteFromCloudinary, uploadToCloudinary } from "./services/cloudinaryService.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(","), credentials: true }));
app.use(express.json());

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// MongoDB connect
console.log("🔄 Connecting to MongoDB...");
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("✅ MongoDB Connected");
    console.log("📊 Database:", mongoose.connection.name);
    // Keep notification indexes aligned after schema changes.
    await Notification.syncIndexes();
  })
  .catch((err) => console.error("❌ MongoDB Error:", err));

// Auth middleware
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ success: false, message: "Không có token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Token không hợp lệ" });
  }
};

// Health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running!",
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// ==================== AUTH ENDPOINTS ====================

// Public registration is implemented by the Express backend. This replaces
// the legacy Nitro/TanStack API handlers formerly stored under /server.
app.post("/api/auth/register", register);

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🔑 [Login] Attempting login for:", email);

    // Need to explicitly select password since it's excluded by default
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      console.log("❌ [Login] User not found:", email);
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log("❌ [Login] Password mismatch for:", email);
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng",
      });
    }

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
      { expiresIn: process.env.JWT_EXPIRE || "7d" },
    );

    console.log("✅ [Login] Token generated successfully, length:", token.length);

    res.json({
      success: true,
      token,
      user: user.getPublicProfile(),
    });
  } catch (error) {
    console.error("❌ [Login] Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get profile
app.get("/api/auth/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User không tồn tại" });
    }
    res.json({ success: true, user: user.getPublicProfile() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update profile
app.put("/api/auth/profile", protect, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User không tồn tại" });
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
app.put("/api/auth/change-password", protect, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    // Need to select password field
    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User không tồn tại" });
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Mật khẩu cũ không đúng" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Đổi mật khẩu thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== USER MANAGEMENT ENDPOINTS ====================

// Get all users (system admin only)
app.get("/api/users", protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);

    if (!currentUser) {
      return res.status(404).json({ success: false, message: "User không tồn tại" });
    }

    let query = {};

    if (currentUser.role !== "group_admin") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền truy cập",
      });
    }
    // Admin sees all users (no filter)

    const users = await User.find(query).select("-password").sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users: users.map((u) => u.getPublicProfile()),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user by ID
app.get("/api/users/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User không tồn tại" });
    }

    res.json({ success: true, user: user.getPublicProfile() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Employee directory is sourced from user accounts created by the system admin.
const hrViewRoles = new Set([
  "staff",
  "specialist",
  "senior_specialist",
  "team_leader",
  "dept_deputy",
  "dept_manager",
  "company_deputy",
  "company_ceo",
  "group_admin",
  "group_director",
  "group_ceo",
]);
const hrManageRoles = new Set([
  "dept_deputy",
  "dept_manager",
  "company_deputy",
  "company_ceo",
  "group_admin",
  "group_director",
  "group_ceo",
]);

app.get("/api/hr/employees", protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id).select("role");

    if (!currentUser || !hrViewRoles.has(currentUser.role)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem danh sách nhân sự",
      });
    }

    const employees = await User.find({}).select("-password").sort({ createdAt: -1 }).lean();

    res.json({
      success: true,
      count: employees.length,
      employees: employees.map(({ _id, __v, password, ...employee }) => ({
        ...employee,
        id: _id.toString(),
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/hr/employees", protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id).select("role");
    if (!currentUser || !hrManageRoles.has(currentUser.role)) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền thêm nhân sự" });
    }

    const { email, password, name, role, company, department, phone, status, joinDate, kpi, certifications } = req.body;
    if (role === "group_admin" && currentUser.role !== "group_admin") {
      return res
        .status(403)
        .json({ success: false, message: "Chỉ Admin được cấp vai trò quản trị hệ thống" });
    }
    const existingUser = await User.findOne({ email: email?.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email đã tồn tại trong hệ thống" });
    }

    const employee = await User.create({
      email,
      password,
      name,
      role,
      company,
      department,
      phone: phone || undefined,
      status: status || "active",
      joinDate: joinDate || new Date(),
      kpi: Number.isFinite(Number(kpi)) ? Number(kpi) : 0,
      certifications: Array.isArray(certifications) ? certifications : [],
    });
    res.status(201).json({ success: true, employee: employee.getPublicProfile() });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.put("/api/hr/employees/:id", protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id).select("role");
    if (!currentUser || !hrManageRoles.has(currentUser.role)) {
      return res
        .status(403)
        .json({ success: false, message: "Bạn không có quyền cập nhật nhân sự" });
    }

    const employee = await User.findById(req.params.id).select("+password");
    if (!employee)
      return res.status(404).json({ success: false, message: "Nhân sự không tồn tại" });

    const { email, password, name, role, company, department, phone, status, joinDate, kpi, certifications } = req.body;
    if (
      (employee.role === "group_admin" || role === "group_admin") &&
      currentUser.role !== "group_admin"
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Chỉ Admin được thay đổi tài khoản quản trị hệ thống" });
    }
    if (email && email.toLowerCase() !== employee.email) {
      const duplicate = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: employee.id },
      });
      if (duplicate)
        return res.status(400).json({ success: false, message: "Email đã tồn tại trong hệ thống" });
      employee.email = email;
    }
    if (name) employee.name = name;
    if (role) employee.role = role;
    if (company) employee.company = company;
    if (department) employee.department = department;
    if (phone !== undefined) employee.phone = phone || undefined;
    if (status) employee.status = status;
    if (joinDate) employee.joinDate = joinDate;
    if (kpi !== undefined) employee.kpi = Number(kpi);
    if (certifications !== undefined) employee.certifications = Array.isArray(certifications) ? certifications : [];
    if (password) employee.password = password;
    await employee.save();

    res.json({ success: true, employee: employee.getPublicProfile() });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.delete("/api/hr/employees/:id", protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id).select("role");
    if (!currentUser || !hrManageRoles.has(currentUser.role)) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xóa nhân sự" });
    }
    if (req.params.id === req.user.id) {
      return res
        .status(400)
        .json({ success: false, message: "Không thể xóa tài khoản đang đăng nhập" });
    }

    const employee = await User.findById(req.params.id);
    if (!employee)
      return res.status(404).json({ success: false, message: "Nhân sự không tồn tại" });
    if (employee.role === "group_admin") {
      return res
        .status(400)
        .json({ success: false, message: "Không thể xóa tài khoản quản trị hệ thống" });
    }
    await employee.deleteOne();
    res.json({ success: true, message: "Đã xóa nhân sự" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create user (system admin only)
app.post("/api/users", protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);

    if (currentUser.role !== "group_admin") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền tạo user",
      });
    }

    const { email, password, name, role, company, department, phone, status } = req.body;

    const existingUser = await User.findOne({ email: email?.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email hoặc username đã tồn tại",
      });
    }

    const user = await User.create({
      email,
      password,
      name,
      role,
      company,
      department,
      phone,
      status: status || "active",
    });

    res.status(201).json({
      success: true,
      user: user.getPublicProfile(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user (system admin only)
app.put("/api/users/:id", protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);

    if (currentUser.role !== "group_admin") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền cập nhật user",
      });
    }

    const { email, password, name, role, company, department, phone, status } = req.body;
    const user = await User.findById(req.params.id).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: "User không tồn tại" });
    }

    if (email && email.toLowerCase() !== user.email) {
      const duplicate = await User.exists({ email: email.toLowerCase(), _id: { $ne: user.id } });
      if (duplicate) return res.status(400).json({ success: false, message: "Email đã tồn tại" });
      user.email = email;
    }
    if (name) user.name = name;
    if (role) user.role = role;
    if (company) user.company = company;
    if (department) user.department = department;
    if (phone !== undefined) user.phone = phone;
    if (status) user.status = status;
    if (password) user.password = password;

    await user.save();

    res.json({ success: true, user: user.getPublicProfile() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete user (system admin only)
app.delete("/api/users/:id", protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);

    if (currentUser.role !== "group_admin") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa user",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User không tồn tại" });
    }

    // Prevent deleting admin
    if (user.role === "group_admin") {
      return res.status(400).json({
        success: false,
        message: "Không thể xóa admin",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Xóa user thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== ATTENDANCE ENDPOINTS ====================

// Check-in
app.post("/api/attendance/check-in", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({ userId, date: today });

    if (attendance && attendance.checkInTime) {
      return res.status(400).json({
        success: false,
        message: "Đã chấm công vào hôm nay rồi",
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
      attendance.status = "late";
    } else {
      attendance.status = "present";
    }

    await attendance.save();

    res.status(200).json({
      success: true,
      message: "Chấm công vào thành công",
      attendance: attendance.getPublicProfile(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Check-out
app.post("/api/attendance/check-out", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({ userId, date: today });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Chưa chấm công vào hôm nay",
      });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({
        success: false,
        message: "Đã chấm công ra rồi",
      });
    }

    attendance.checkOutTime = new Date();
    attendance.calculateWorkingHours();

    const hour = attendance.checkOutTime.getHours();
    const minute = attendance.checkOutTime.getMinutes();
    const checkOutHour = hour + minute / 60;

    if (checkOutHour < 16.5) {
      attendance.status = "early_leave";
    } else if (attendance.status !== "late") {
      attendance.status = "present";
    }

    await attendance.save();

    res.status(200).json({
      success: true,
      message: "Chấm công ra thành công",
      attendance: attendance.getPublicProfile(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get today
app.get("/api/attendance/today", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({ userId, date: today });

    if (!attendance) {
      attendance = {
        userId,
        date: today,
        status: "absent",
        checkInTime: null,
        checkOutTime: null,
        workingHours: 0,
      };
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
app.get("/api/attendance/history", protect, async (req, res) => {
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
      attendance: attendance.map((a) => a.getPublicProfile()),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all attendance (Admin/CEO only)
app.get("/api/attendance/all", protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);

    // Only Admin, CEO, Directors, and Managers can view
    const allowedRoles = [
      "group_admin",
      "group_ceo",
      "group_director",
      "company_ceo",
      "company_deputy",
      "dept_manager",
    ];
    if (!allowedRoles.includes(currentUser.role)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền truy cập",
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
      .populate("userId", "name email role company department");

    // Filter by company if not group level
    let filteredRecords = attendanceRecords;
    if (currentUser.role === "company_ceo" || currentUser.role === "company_deputy") {
      filteredRecords = attendanceRecords.filter((a) => a.userId?.company === currentUser.company);
    } else if (currentUser.role === "dept_manager") {
      filteredRecords = attendanceRecords.filter(
        (a) => a.userId?.department === currentUser.department,
      );
    }

    // Apply additional filters
    if (status) {
      filteredRecords = filteredRecords.filter((a) => a.status === status);
    }
    if (company) {
      filteredRecords = filteredRecords.filter((a) => a.userId?.company === company);
    }
    if (department) {
      filteredRecords = filteredRecords.filter((a) => a.userId?.department === department);
    }

    // Get all users to find who didn't check in
    let allUsers = await User.find({ status: "active" }).select(
      "name email role company department",
    );

    // Filter users by role access
    if (currentUser.role === "company_ceo" || currentUser.role === "company_deputy") {
      allUsers = allUsers.filter((u) => u.company === currentUser.company);
    } else if (currentUser.role === "dept_manager") {
      allUsers = allUsers.filter((u) => u.department === currentUser.department);
    }

    // Find users who didn't check in
    const checkedInUserIds = new Set(filteredRecords.map((a) => a.userId?._id?.toString()));
    const absentUsers = allUsers.filter((u) => !checkedInUserIds.has(u._id.toString()));

    // Create absent records
    const absentRecords = absentUsers.map((user) => ({
      userId: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        department: user.department,
      },
      date: displayDate,
      status: "absent",
      checkInTime: null,
      checkOutTime: null,
      workingHours: 0,
    }));

    // Combine and sort
    const allRecords = [
      ...filteredRecords.map((a) => ({
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
      present: allRecords.filter((a) => a.status === "present").length,
      late: allRecords.filter((a) => a.status === "late").length,
      early_leave: allRecords.filter((a) => a.status === "early_leave").length,
      absent: allRecords.filter((a) => a.status === "absent").length,
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

// Upload avatar to Cloudinary. The image is held in memory only and never
// persisted to the application server's filesystem.
app.post("/api/auth/avatar", protect, avatarUpload.single("avatar"), async (req, res) => {
  let uploadedAsset = null;
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Vui lòng chọn ảnh avatar" });
    const user = await User.findById(req.user.id).select("+avatarPublicId +avatarResourceType");
    if (!user) return res.status(404).json({ success: false, message: "User không tồn tại" });

    uploadedAsset = await uploadToCloudinary(req.file, { folder: "wis/avatars", resourceType: "image" });
    const oldAsset = { publicId: user.avatarPublicId, resourceType: user.avatarResourceType };
    user.avatar = uploadedAsset.secure_url;
    user.avatarPublicId = uploadedAsset.public_id;
    user.avatarResourceType = uploadedAsset.resource_type;
    await user.save();

    if (oldAsset.publicId) {
      await deleteFromCloudinary(oldAsset.publicId, oldAsset.resourceType || "image").catch((error) => {
        console.error("Old avatar cleanup failed:", error.message);
      });
    }
    res.json({ success: true, user: user.getPublicProfile() });
  } catch (error) {
    if (uploadedAsset?.public_id) await deleteFromCloudinary(uploadedAsset.public_id, uploadedAsset.resource_type).catch(() => {});
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/attendance/detail/:userId", protect, async (req, res) => {
  try {
    const date = req.query.date;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) {
      return res.status(400).json({ success: false, message: "Ngày chấm công không hợp lệ" });
    }
    const user = await User.findById(req.params.userId).select("name email role company department");
    if (!user) return res.status(404).json({ success: false, message: "Nhân sự không tồn tại" });
    const start = new Date(`${date}T00:00:00+07:00`);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const record = await Attendance.findOne({ userId: user._id, checkInTime: { $gte: start, $lt: end } }).lean();
    res.json({
      success: true,
      attendance: {
        id: record?._id?.toString() || `${user.id}-${date}`,
        userId: { id: user.id, name: user.name, email: user.email, role: user.role, company: user.company, department: user.department },
        date,
        checkInTime: record?.checkInTime || null,
        checkOutTime: record?.checkOutTime || null,
        status: record?.status || "absent",
        workingHours: record?.workingHours || 0,
      },
    });
  } catch (error) {
    res.status(error.name === "CastError" ? 400 : 500).json({ success: false, message: error.message });
  }
});

// ==================== CHAT ENDPOINTS ====================
// Use chat routes with authentication middleware
app.use("/api/chat", protect, chatRoutes);

// ==================== PROJECT ENDPOINTS ====================
// Use project routes with authentication middleware
app.use("/api", protect, projectRoutes);
app.use("/api", protect, businessRoutes);
app.use("/api", protect, notificationRoutes);
app.use("/api", protect, assistantRoutes);

// Consistent JSON errors for all modular routes.
app.use((error, req, res, next) => {
  console.error(error);
  res
    .status(error.status || (error.name === "CastError" || error.name === "MulterError" ? 400 : 500))
    .json({ success: false, message: error.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🚀 WIS QuanLy API Server (Simplified)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
  console.log(`🔑 JWT_SECRET: ${process.env.JWT_SECRET?.substring(0, 20)}...`);
  console.log(`⏰ JWT_EXPIRE: ${process.env.JWT_EXPIRE || "7d"}`);
  console.log(`🌐 CORS_ORIGIN: ${process.env.CORS_ORIGIN}`);
  console.log(`⏰ Attendance API: /api/attendance/*`);
  console.log(`💬 Chat API: /api/chat/*`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
});
