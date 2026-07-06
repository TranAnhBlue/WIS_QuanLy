// Authentication Context - MongoDB API version
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Role, Permission } from "@/lib/permissions";
import { ROLE_HIERARCHY, PERMISSIONS } from "@/lib/permissions";

// API Base URL
const API_BASE = typeof window !== 'undefined' ? window.location.origin : '';

interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  company: string;
  department: string;
  phone?: string;
  avatar?: string;
  joinDate: string;
  status: string;
}

interface AuthSession {
  token: string;
  user: User;
}

interface AuthContextType {
  session: AuthSession | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasRole: (role: Role) => boolean;
  hasPermission: (permission: Permission) => boolean;
  updateProfile: (data: { name: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'wis_auth_token';
const USER_KEY = 'wis_user_data';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from localStorage on mount
  useEffect(() => {
    const loadSession = () => {
      try {
        if (typeof window === 'undefined') return;
        
        const token = localStorage.getItem(TOKEN_KEY);
        const userData = localStorage.getItem(USER_KEY);

        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setSession({ token, user: parsedUser });
          setUser(parsedUser);
        }
      } catch (error) {
        console.error("Error loading session:", error);
        // Clear invalid data
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Try API login first
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.token && data.user) {
        // API login successful
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setSession({ token: data.token, user: data.user });
        setUser(data.user);
        return { success: true };
      }
    } catch (apiError) {
      console.warn('API login failed, falling back to localStorage:', apiError);
    }

    // Fallback to localStorage-based authentication
    try {
      const { loginUser, DEMO_USERS } = await import('@/lib/auth');
      
      // Initialize demo users if not exists
      const usersJson = localStorage.getItem('wis_users');
      if (!usersJson) {
        localStorage.setItem('wis_users', JSON.stringify(DEMO_USERS));
      }

      const result = loginUser(email, password);
      
      if (result.success && result.session) {
        // Create a fake token for localStorage mode
        const token = `localStorage_${Date.now()}_${result.session.userId}`;
        const user: User = {
          id: result.session.userId,
          email: result.session.email,
          name: result.session.name,
          role: result.session.role,
          company: result.session.company,
          department: result.session.department,
          avatar: result.session.avatar,
          joinDate: new Date().toISOString().split('T')[0],
          status: 'active',
        };
        
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        setSession({ token, user });
        setUser(user);
        return { success: true };
      }

      return {
        success: false,
        error: result.error || 'Email hoặc mật khẩu không đúng',
      };
    } catch (error) {
      console.error('LocalStorage login error:', error);
      return {
        success: false,
        error: 'Đã xảy ra lỗi khi đăng nhập',
      };
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    // Clear state
    setSession(null);
    setUser(null);
  };

  const hasRole = (role: Role): boolean => {
    if (!user) return false;
    return user.role === role;
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    
    // Get user's role level
    const userRoleLevel = ROLE_HIERARCHY[user.role] || 0;
    
    // Get required role level for this permission
    const requiredRole = PERMISSIONS[permission];
    if (!requiredRole) return false;
    
    const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
    
    // User has permission if their role level is >= required level
    return userRoleLevel >= requiredLevel;
  };

  const updateProfile = async (data: { name: string; phone?: string }): Promise<{ success: boolean; error?: string }> => {
    // Try API first
    try {
      if (session?.token && !session.token.startsWith('localStorage_')) {
        const response = await fetch(`${API_BASE}/api/auth/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.token}`,
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok && result.success && result.user) {
          localStorage.setItem(USER_KEY, JSON.stringify(result.user));
          setUser(result.user);
          setSession({ ...session, user: result.user });
          return { success: true };
        }
      }
    } catch (apiError) {
      console.warn('API update failed, using localStorage');
    }

    // Fallback to localStorage
    try {
      if (!user) return { success: false, error: 'Chưa đăng nhập' };

      const { updateUserProfile } = await import('@/lib/auth');
      const result = updateUserProfile(user.id, data);

      if (result.success && result.user) {
        const updatedUser: User = {
          ...user,
          name: result.user.name,
          phone: result.user.phone,
        };
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        setUser(updatedUser);
        if (session) {
          setSession({ ...session, user: updatedUser });
        }
        return { success: true };
      }

      return { success: false, error: result.error || 'Cập nhật thất bại' };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'Đã xảy ra lỗi' };
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    // Try API first
    try {
      if (session?.token && !session.token.startsWith('localStorage_')) {
        const response = await fetch(`${API_BASE}/api/auth/change-password`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.token}`,
          },
          body: JSON.stringify({ oldPassword, newPassword }),
        });

        const result = await response.json();

        if (response.ok) {
          return { success: true };
        }
      }
    } catch (apiError) {
      console.warn('API change password failed, using localStorage');
    }

    // Fallback to localStorage
    try {
      if (!user) return { success: false, error: 'Chưa đăng nhập' };

      const { changeUserPassword } = await import('@/lib/auth');
      const result = changeUserPassword(user.id, oldPassword, newPassword);

      return result.success
        ? { success: true }
        : { success: false, error: result.error || 'Đổi mật khẩu thất bại' };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: 'Đã xảy ra lỗi' };
    }
  };

  const value: AuthContextType = {
    session,
    user,
    isLoading,
    isAuthenticated: !!session && !!user,
    login,
    logout,
    hasRole,
    hasPermission,
    updateProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
