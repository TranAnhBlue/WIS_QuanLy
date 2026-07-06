// Nitro API Route: GET /api/users - List all users (Admin only)
import { defineEventHandler, createError, getHeader } from 'h3';
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
      // group_admin level
      throw createError({
        statusCode: 403,
        message: 'Không có quyền truy cập',
      });
    }

    await connectDB();

    // Get all users
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });

    return {
      success: true,
      users: users.map((user) => ({
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
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
    };
  } catch (error: any) {
    console.error('List users error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      message: 'Đã xảy ra lỗi server',
    });
  }
});
