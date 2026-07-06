// Nitro API Route: POST /api/auth/login
import { defineEventHandler, readBody, createError } from 'h3';
import { connectDB } from '../../../src/lib/db';
import User from '../../../src/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export default defineEventHandler(async (event) => {
  try {
    // Parse request body
    const body = await readBody(event);
    const { email, password } = body;

    if (!email || !password) {
      throw createError({
        statusCode: 400,
        message: 'Email và mật khẩu là bắt buộc',
      });
    }

    // Connect to database
    await connectDB();

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Email hoặc mật khẩu không đúng',
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw createError({
        statusCode: 403,
        message: 'Tài khoản đã bị vô hiệu hóa',
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        message: 'Email hoặc mật khẩu không đúng',
      });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        company: user.company,
        department: user.department,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return success response
    return {
      success: true,
      token,
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
    console.error('Login error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      message: 'Đã xảy ra lỗi server',
    });
  }
});
