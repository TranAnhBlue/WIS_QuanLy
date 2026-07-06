// API Route: POST /api/auth/login
import { createAPIFileRoute } from '@tanstack/start/api';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export const APIRoute = createAPIFileRoute('/api/auth/login')({
  POST: async ({ request }) => {
    try {
      // Parse request body
      const body = await request.json();
      const { email, password } = body;

      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: 'Email và mật khẩu là bắt buộc' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Connect to database
      await connectDB();

      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Email hoặc mật khẩu không đúng' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check if user is active
      if (user.status !== 'active') {
        return new Response(
          JSON.stringify({ error: 'Tài khoản đã bị vô hiệu hóa' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return new Response(
          JSON.stringify({ error: 'Email hoặc mật khẩu không đúng' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
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
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Login error:', error);
      return new Response(
        JSON.stringify({ error: 'Đã xảy ra lỗi server' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
});
