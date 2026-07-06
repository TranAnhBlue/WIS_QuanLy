// Nitro API Route: POST /api/users - Create new user (Admin only)
import { defineEventHandler, readBody, createError, getHeader } from 'h3';
import { connectDB } from '../../../src/lib/db';
import User from '../../../src/models/User';
import jwt from 'jsonwebtoken';
import { ROLE_HIERARCHY } from '../../../src/lib/permissions';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export default defineEventHandler(async (event) => {
  try {
    // Verify admin access
    const authHeader = getHeader(event, 'Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message: 'Token không hợp lệ',
      });
    }

    const token = authHeader.substring(7);

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      throw createError({
        statusCode: 401,
        message: 'Token hết hạn hoặc không hợp lệ',
      });
    }

    // Check if user has admin privileges
    const userRole = decoded.role;
    const roleLevel = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] || 0;

    if (roleLevel < 85) {
      throw createError({
        statusCode: 403,
        message: 'Không có quyền truy cập',
      });
    }

    const body = await readBody(event);
    const { email, password, name, role, company, department, phone, status } = body;

    // Validate required fields
    if (!email || !password || !name || !role || !company || !department) {
      throw createError({
        statusCode: 400,
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc',
      });
    }

    // Validate password length
    if (password.length < 6) {
      throw createError({
        statusCode: 400,
        message: 'Mật khẩu phải có ít nhất 6 ký tự',
      });
    }

    await connectDB();

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw createError({
        statusCode: 409,
        message: 'Email đã được sử dụng',
      });
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      name,
      role,
      company,
      department,
      phone: phone || undefined,
      joinDate: new Date(),
      status: status || 'active',
    });

    await user.save();

    return {
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
        department: user.department,
        avatar: user.avatar,
        phone: user.phone,
        joinDate: user.joinDate,
        status: user.status,
      },
    };
  } catch (error: any) {
    console.error('Create user error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      message: 'Đã xảy ra lỗi server',
    });
  }
});
