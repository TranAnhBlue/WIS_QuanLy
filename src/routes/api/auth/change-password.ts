// API Route: PUT /api/auth/change-password - Change user password
import { createAPIFileRoute } from '@tanstack/start/api';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export const APIRoute = createAPIFileRoute('/api/auth/change-password')({
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
      const { oldPassword, newPassword } = body;

      // Validate required fields
      if (!oldPassword || !newPassword) {
        return new Response(
          JSON.stringify({ error: 'Vui lòng nhập đầy đủ thông tin' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Validate new password length
      if (newPassword.length < 6) {
        return new Response(
          JSON.stringify({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Connect to database
      await connectDB();

      // Find user
      const user = await User.findById(decoded.userId);

      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Người dùng không tồn tại' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Verify old password
      const isPasswordValid = await user.comparePassword(oldPassword);

      if (!isPasswordValid) {
        return new Response(
          JSON.stringify({ error: 'Mật khẩu hiện tại không đúng' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Update password (will be hashed by pre-save hook)
      user.password = newPassword;
      await user.save();

      // Return success response
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Đổi mật khẩu thành công',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Change password error:', error);
      return new Response(
        JSON.stringify({ error: 'Đã xảy ra lỗi server' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
});
