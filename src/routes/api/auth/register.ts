// API Route: POST /api/auth/register
import { createAPIFileRoute } from '@tanstack/start/api';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export const APIRoute = createAPIFileRoute('/api/auth/register')({
  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const { email, password, name, role, company, department, phone } = body;

      // Validate required fields
      if (!email || !password || !name || !role || !company || !department) {
        return new Response(
          JSON.stringify({ error: 'Vui lòng điền đầy đủ thông tin bắt buộc' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Validate password length
      if (password.length < 6) {
        return new Response(
          JSON.stringify({ error: 'Mật khẩu phải có ít nhất 6 ký tự' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Connect to database
      await connectDB();

      // Check if email already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return new Response(
          JSON.stringify({ error: 'Email đã được sử dụng' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Create new user
      const user = new User({
        email: email.toLowerCase(),
        password, // Will be hashed by pre-save hook
        name,
        role,
        company,
        department,
        phone: phone || undefined,
        joinDate: new Date(),
        status: 'active',
      });

      await user.save();

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
      return new Response(
        JSON.stringify({
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
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Register error:', error);
      return new Response(
        JSON.stringify({ error: 'Đã xảy ra lỗi server' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
});
