// Nitro API Route: DELETE /api/users/:id - Delete user by ID (Admin only)
import { defineEventHandler, createError, getHeader, getRouterParam } from 'h3';
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

    // Prevent deleting self
    if (decoded.userId === id) {
      throw createError({
        statusCode: 400,
        message: 'Không thể xóa tài khoản đang đăng nhập',
      });
    }

    await connectDB();

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'Người dùng không tồn tại',
      });
    }

    return {
      success: true,
      message: 'Xóa người dùng thành công',
    };
  } catch (error: any) {
    console.error('Delete user error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      message: 'Đã xảy ra lỗi server',
    });
  }
});
