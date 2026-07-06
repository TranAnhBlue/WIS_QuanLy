// API Route: /api/users/[id] - Get, Update, Delete user by ID (Admin only)
import { createAPIFileRoute } from '@tanstack/start/api';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { ROLE_HIERARCHY } from '@/lib/permissions';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Helper function to verify admin access
async function verifyAdminAccess(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Token không hợp lệ', status: 401 };
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Check if user has admin privileges
    const userRole = decoded.role;
    const roleLevel = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] || 0;
    
    if (roleLevel < 85) { // group_admin level
      return { error: 'Không có quyền truy cập', status: 403 };
    }

    return { decoded, error: null };
  } catch (err) {
    return { error: 'Token hết hạn hoặc không hợp lệ', status: 401 };
  }
}

export const APIRoute = createAPIFileRoute('/api/users/$id')({
  // GET - Get user by ID
  GET: async ({ request, params }) => {
    try {
      const authResult = await verifyAdminAccess(request);
      if (authResult.error) {
        return new Response(
          JSON.stringify({ error: authResult.error }),
          { status: authResult.status, headers: { 'Content-Type': 'application/json' } }
        );
      }

      await connectDB();

      const user = await User.findById(params.id, { password: 0 });

      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Người dùng không tồn tại' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

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
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Get user error:', error);
      return new Response(
        JSON.stringify({ error: 'Đã xảy ra lỗi server' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  // PUT - Update user by ID
  PUT: async ({ request, params }) => {
    try {
      const authResult = await verifyAdminAccess(request);
      if (authResult.error) {
        return new Response(
          JSON.stringify({ error: authResult.error }),
          { status: authResult.status, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const body = await request.json();
      const { name, role, company, department, phone, status, password } = body;

      await connectDB();

      const user = await User.findById(params.id);

      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Người dùng không tồn tại' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Update fields
      if (name) user.name = name;
      if (role) user.role = role;
      if (company) user.company = company;
      if (department) user.department = department;
      if (phone !== undefined) user.phone = phone;
      if (status) user.status = status;
      
      // Only update password if provided
      if (password && password.length >= 6) {
        user.password = password;
      }

      await user.save();

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
      console.error('Update user error:', error);
      return new Response(
        JSON.stringify({ error: 'Đã xảy ra lỗi server' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  // DELETE - Delete user by ID
  DELETE: async ({ request, params }) => {
    try {
      const authResult = await verifyAdminAccess(request);
      if (authResult.error) {
        return new Response(
          JSON.stringify({ error: authResult.error }),
          { status: authResult.status, headers: { 'Content-Type': 'application/json' } }
        );
      }

      await connectDB();

      // Prevent deleting self
      const decoded = authResult.decoded;
      if (decoded && decoded.userId === params.id) {
        return new Response(
          JSON.stringify({ error: 'Không thể xóa tài khoản đang đăng nhập' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const user = await User.findByIdAndDelete(params.id);

      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Người dùng không tồn tại' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Xóa người dùng thành công',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Delete user error:', error);
      return new Response(
        JSON.stringify({ error: 'Đã xảy ra lỗi server' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
});
