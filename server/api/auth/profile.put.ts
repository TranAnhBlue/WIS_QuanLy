// Nitro API Route: PUT /api/auth/profile
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
    const { name, phone } = body;

    // Validate required fields
    if (!name) {
      throw createError({
        statusCode: 400,
        message: 'Tên là bắt buộc',
      });
    }

    // Connect to database
    await connectDB();

    // Find and update user
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'Người dùng không tồn tại',
      });
    }

    // Update fields
    user.name = name;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    // Return success response
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
    console.error('Update profile error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      message: 'Đã xảy ra lỗi server',
    });
  }
});
