// API Route: /api/users - List and Create users (Admin only)
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
    
    // Check if user has admin privileges (group_admin level or higher)
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

export const APIRoute = createAPIFileRoute('/api/users/')({
  // GET - List all users (Admin only)
  GET: async ({ request }) => {
    try {
      const authResult = await verifyAdminAccess(request);
      if (authResult.error) {
        return new Response(
          JSON.stringify({ error: authResult.error }),
          { status: authResult.status, headers: { 'Content-Type': 'application/json' } }
        );
      }

      await connectDB();

      // Get all users
      const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });

      return new Response(
        JSON.stringify({
          success: true,
          users: users.map((user) => ({
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
          })),
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('List users error:', error);
      return new Response(
        JSON.stringify({ error: 'Đã xảy ra lỗi server' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },

  // POST - Create new user (Admin only)
  POST: async ({ request }) => {
    try {
      const authResult = await verifyAdminAccess(request);
      if (authResult.error) {
        return new Response(
          JSON.stringify({ error: authResult.error }),
          { status: authResult.status, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const body = await request.json();
      const { email, password, name, role, company, department, phone, status } = body;

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
        password,
        name,
        role,
        company,
        department,
        phone: phone || undefined,
        joinDate: new Date(),
        status: status || 'active',
      });

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
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Create user error:', error);
      return new Response(
        JSON.stringify({ error: 'Đã xảy ra lỗi server' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
});
