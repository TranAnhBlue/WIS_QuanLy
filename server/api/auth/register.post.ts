// Nitro API Route: POST /api/auth/register
import { defineEventHandler, readBody, createError } from 'h3';
import { connectDB } from '../../../src/lib/db';
import User from '../../../src/models/User';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { email, password, name, role, company, department, phone } = body;

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
      role: role || 'staff',
      company,
      department,
      phone: phone || undefined,
      joinDate: new Date(),
      status: 'active',
    });

    await user.save();

    return {
      success: true,
      message: 'Đăng ký thành công',
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company,
        department: user.department,
      },
    };
  } catch (error: any) {
    console.error('Register error:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      message: 'Đã xảy ra lỗi server',
    });
  }
});
