// API Route: GET /api/auth/me - Get current user from JWT token
import { createAPIFileRoute } from '@tanstack/start/api';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export const APIRoute = createAPIFileRoute('/api/auth/me')({
  GET: async ({ request }) => {
    try {
      // Get token from Authorization header
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Token không hợp lệ' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify token
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET) as any;
      } catch (err) {
        return new Response(
          JSON.stringify({ error: 'Token hết hạn hoặc không hợp lệ' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Connect to database
      await connectDB();

      // Find user by ID
      const user = await User.findById(decoded.userId);

      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Người dùng không tồn tại' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check if user is active
      if (user.status !== 'active') {
        return new Response(
          JSON.stringify({ error: 'Tài khoản đã bị vô hiệu hóa' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Return user data
      return new Response(
        JSON.stringify({
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
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Get current user error:', error);
      return new Response(
        JSON.stringify({ error: 'Đã xảy ra lỗi server' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
});
