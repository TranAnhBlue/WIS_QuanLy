// Authentication Middleware
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Verify JWT token
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc chưa đăng nhập',
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token (exclude password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Người dùng không tồn tại',
        });
      }

      if (req.user.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản đã bị vô hiệu hóa',
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token hết hạn hoặc không hợp lệ',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi xác thực',
    });
  }
};

// Check if user has specific role level
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa đăng nhập',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập',
      });
    }

    next();
  };
};

// Check if user has admin privileges (group_admin or above)
export const isAdmin = (req, res, next) => {
  const ROLE_HIERARCHY = {
    intern: 10,
    staff: 20,
    specialist: 30,
    senior_specialist: 40,
    team_leader: 50,
    dept_deputy: 60,
    dept_manager: 70,
    company_deputy: 75,
    company_ceo: 80,
    group_admin: 90,
    group_director: 95,
    group_ceo: 100,
  };

  const userLevel = ROLE_HIERARCHY[req.user.role] || 0;

  if (userLevel < 85) {
    // group_admin level
    return res.status(403).json({
      success: false,
      message: 'Chỉ admin mới có quyền truy cập',
    });
  }

  next();
};
