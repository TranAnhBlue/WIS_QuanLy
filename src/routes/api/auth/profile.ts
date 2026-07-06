// API Route: PUT /api/auth/profile - Update user profile
import { createAPIFileRoute } from '@tanstack/start/api';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export const APIRoute = createAPIFileRoute('/api/auth/profile')({
  PUT: async ({ request }) => {
    try {
      // Get token from Authorization header
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Token không hợp lệ' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const token = authHeader.substring(7);

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

      // Parse request body
      const body = await request.json();
      const { name, phone } = body;

      // Validate required fields
      if (!name) {
        return new Response(
          JSON.stringify({ error: 'Tên là bắt buộc' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Connect to database
      await connectDB();

      // Find and update user
      const user = await User.findById(decoded.userId);

      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Người dùng không tồn tại' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Update fields
      user.name = name;
      if (phone !== undefined) user.phone = phone;

      await user.save();

      // Return success response
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
      console.error('Update profile error:', error);
      return new Response(
        JSON.stringify({ error: 'Đã xảy ra lỗi server' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
});
