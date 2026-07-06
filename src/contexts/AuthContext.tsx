// Authentication Context - MongoDB API version
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Role, Permission } from "@/lib/permissions";
import { ROLE_HIERARCHY, PERMISSIONS } from "@/lib/permissions";

// API Base URL - Backend Node.js API
const API_BASE = 'http://localhost:5000';

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
      // Call Backend Node.js API
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.token && data.user) {
        // API login successful - save to localStorage
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setSession({ token: data.token, user: data.user });
        setUser(data.user);
        return { success: true };
      }

      // Login failed
      return {
        success: false,
        error: data.message || 'Email hoặc mật khẩu không đúng',
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Không thể kết nối với server. Đảm bảo backend đang chạy tại http://localhost:5000',
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
    
    // Get the list of permissions for user's role
    const rolePermissions = PERMISSIONS[user.role];
    if (!rolePermissions) return false;
    
    // Check if the permission is in the list
    return rolePermissions.includes(permission);
  };

  const updateProfile = async (data: { name: string; phone?: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!session?.token) {
        return { success: false, error: 'Chưa đăng nhập' };
      }

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

      return { success: false, error: result.message || 'Cập nhật thất bại' };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'Không thể kết nối với server' };
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!session?.token) {
        return { success: false, error: 'Chưa đăng nhập' };
      }

      const response = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return { success: true };
      }

      return { success: false, error: result.message || 'Đổi mật khẩu thất bại' };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: 'Không thể kết nối với server' };
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
