// Nitro API Route: PUT /api/users/:id - Update user by ID (Admin only)
import { defineEventHandler, readBody, createError, getHeader, getRouterParam } from 'h3';
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

    const id = getRouterParam(event, 'id');
    const body = await readBody(event);
    const { name, role, company, department, phone, status, password } = body;

    await connectDB();

    const user = await User.findById(id);

    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'Người dùng không tồn tại',
      });
    }

    // Update fields
    if (name) user.name = name;
    if (role) user.role = role;
    if (company) user.company = company;
    if (department) user.department = department;
    if (phone !== undefined) user.phone = phone;
    if (status) user.status = status;

    // Only update password if provided
    if (password && password.length >= 6) {
      user.password = password;
    }

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
    console.error('Update user error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      message: 'Đã xảy ra lỗi server',
    });
  }
});
