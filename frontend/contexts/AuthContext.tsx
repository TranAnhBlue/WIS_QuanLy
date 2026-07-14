// Authentication Context - MongoDB API version
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Role, Permission } from "@/lib/permissions";
import { ROLE_HIERARCHY, PERMISSIONS } from "@/lib/permissions";

// API Base URL - Backend Node.js API
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

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
  uploadAvatar: (file: File) => Promise<{ success: boolean; error?: string }>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'wis_auth_token';
const USER_KEY = 'wis_user_data';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const endSession = useCallback((redirect = true) => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setSession(null);
    setUser(null);
    if (redirect && window.location.pathname !== '/login') {
      window.location.replace('/login');
    }
  }, []);

  // Load session from localStorage on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const userData = localStorage.getItem(USER_KEY);

        if (token && userData) {
          JSON.parse(userData);
          const response = await fetch(`${API_BASE}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.status === 401 || response.status === 403) {
            endSession();
            return;
          }
          if (!response.ok) throw new Error(`Không thể xác minh phiên (${response.status})`);
          const result = await response.json();
          if (!result.success || !result.user) throw new Error('Dữ liệu phiên không hợp lệ');
          localStorage.setItem(USER_KEY, JSON.stringify(result.user));
          setSession({ token, user: result.user });
          setUser(result.user);
        }
      } catch (error) {
        console.error("Không thể khôi phục phiên đăng nhập:", error);
        endSession();
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [endSession]);

  useEffect(() => {
    const handleUnauthorized = () => endSession();
    window.addEventListener('wis:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('wis:unauthorized', handleUnauthorized);
  }, [endSession]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if ((event.key === TOKEN_KEY || event.key === USER_KEY) && !localStorage.getItem(TOKEN_KEY)) {
        endSession();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [endSession]);

  useEffect(() => {
    if (!session?.token) return;
    try {
      const encodedPayload = session.token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
      if (!encodedPayload) throw new Error('Token không hợp lệ');
      const paddedPayload = encodedPayload.padEnd(Math.ceil(encodedPayload.length / 4) * 4, '=');
      const payload = JSON.parse(atob(paddedPayload));
      const expiresAt = Number(payload.exp) * 1000;
      if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
        endSession();
        return;
      }
      const timer = window.setTimeout(() => endSession(), Math.min(expiresAt - Date.now(), 2_147_483_647));
      return () => window.clearTimeout(timer);
    } catch {
      endSession();
    }
  }, [session?.token, endSession]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔑 [Auth] Attempting login for:', email);
      
      // Call Backend Node.js API
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('📡 [Auth] Login response:', {
        status: response.status,
        success: data.success,
        hasToken: !!data.token,
        hasUser: !!data.user,
      });

      if (response.ok && data.success && data.token && data.user) {
        // API login successful - save to localStorage
        console.log('💾 [Auth] Saving token to localStorage...');
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        
        // Verify save
        const savedToken = localStorage.getItem(TOKEN_KEY);
        console.log('✅ [Auth] Token saved successfully:', !!savedToken);
        
        setSession({ token: data.token, user: data.user });
        setUser(data.user);
        return { success: true };
      }

      // Login failed
      console.log('❌ [Auth] Login failed:', data.message);
      return {
        success: false,
        error: data.message || 'Email hoặc mật khẩu không đúng',
      };
    } catch (error) {
      console.error('❌ [Auth] Login error:', error);
      return {
        success: false,
        error: 'Không thể kết nối với server. Đảm bảo backend đang chạy tại http://localhost:5000',
      };
    }
  };

  const logout = () => {
    console.log('👋 [Auth] Logging out...');
    endSession(false);
    console.log('✅ [Auth] Logout complete');
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

  const uploadAvatar = async (file: File): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!session?.token) return { success: false, error: 'Chưa đăng nhập' };
      const body = new FormData();
      body.append('avatar', file);
      const response = await fetch(`${API_BASE}/api/auth/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
        body,
      });
      const result = await response.json();
      if (response.ok && result.success && result.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(result.user));
        setUser(result.user);
        setSession({ ...session, user: result.user });
        return { success: true };
      }
      return { success: false, error: result.message || 'Không thể tải avatar lên' };
    } catch (error) {
      console.error('Avatar upload error:', error);
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
    uploadAvatar,
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
