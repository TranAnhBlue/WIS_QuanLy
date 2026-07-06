// Nitro API Route: PUT /api/auth/change-password
import { defineEventHandler, readBody, createError, getHeader } from 'h3';
import { connectDB } from '../../../src/lib/db';
import User from '../../../src/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export default defineEventHandler(async (event) => {
  try {
    // Get token from Authorization header
    const authHeader = getHeader(event, 'Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message: 'Token không hợp lệ',
      });
    }

    const token = authHeader.substring(7);

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      throw createError({
        statusCode: 401,
        message: 'Token hết hạn hoặc không hợp lệ',
      });
    }

    // Parse request body
    const body = await readBody(event);
    const { oldPassword, newPassword } = body;

    // Validate required fields
    if (!oldPassword || !newPassword) {
      throw createError({
        statusCode: 400,
        message: 'Vui lòng nhập đầy đủ thông tin',
      });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      throw createError({
        statusCode: 400,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự',
      });
    }

    // Connect to database
    await connectDB();

    // Find user
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'Người dùng không tồn tại',
      });
    }

    // Verify old password
    const isPasswordValid = await user.comparePassword(oldPassword);

    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        message: 'Mật khẩu hiện tại không đúng',
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    // Return success response
    return {
      success: true,
      message: 'Đổi mật khẩu thành công',
    };
  } catch (error: any) {
    console.error('Change password error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      message: 'Đã xảy ra lỗi server',
    });
  }
});
