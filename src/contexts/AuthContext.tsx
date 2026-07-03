import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AuthSession, User, UserRole } from "@/lib/auth";
import {
  getSession,
  login as authLogin,
  logout as authLogout,
  register as authRegister,
  updateUser as authUpdateUser,
  changePassword as authChangePassword,
  getUserById,
} from "@/lib/auth";

interface AuthContextType {
  session: AuthSession | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  register: (userData: Omit<User, "id" | "createdAt" | "updatedAt">) => Promise<{ success: boolean; error?: string; user?: User }>;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (requiredRole: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session on mount
  useEffect(() => {
    const loadSession = () => {
      try {
        const currentSession = getSession();
        setSession(currentSession);
        
        if (currentSession) {
          const userData = getUserById(currentSession.userId);
          setUser(userData);
        }
      } catch (error) {
        console.error("Error loading session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const newSession = authLogin(email, password);
      
      if (!newSession) {
        return { success: false, error: "Email hoặc mật khẩu không đúng" };
      }

      setSession(newSession);
      const userData = getUserById(newSession.userId);
      setUser(userData);

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Đã xảy ra lỗi khi đăng nhập" };
    }
  };

  const logout = () => {
    authLogout();
    setSession(null);
    setUser(null);
  };

  const register = async (userData: Omit<User, "id" | "createdAt" | "updatedAt">) => {
    try {
      const newUser = authRegister(userData);
      
      if (!newUser) {
        return { success: false, error: "Email đã được sử dụng" };
      }

      return { success: true, user: newUser };
    } catch (error) {
      console.error("Register error:", error);
      return { success: false, error: "Đã xảy ra lỗi khi đăng ký" };
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!session) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    try {
      const updatedUser = authUpdateUser(session.userId, updates);
      
      if (!updatedUser) {
        return { success: false, error: "Không thể cập nhật thông tin" };
      }

      setUser(updatedUser);
      
      // Update session
      const newSession = getSession();
      setSession(newSession);

      return { success: true };
    } catch (error) {
      console.error("Update profile error:", error);
      return { success: false, error: "Đã xảy ra lỗi khi cập nhật" };
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (!session) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    try {
      const success = authChangePassword(session.userId, oldPassword, newPassword);
      
      if (!success) {
        return { success: false, error: "Mật khẩu cũ không đúng" };
      }

      return { success: true };
    } catch (error) {
      console.error("Change password error:", error);
      return { success: false, error: "Đã xảy ra lỗi khi đổi mật khẩu" };
    }
  };

  const hasRole = (role: UserRole) => {
    return session?.role === role;
  };

  const hasPermission = (requiredRole: UserRole) => {
    if (!session) return false;

    const hierarchy: Record<UserRole, number> = {
      admin: 5,
      ceo: 4,
      manager: 3,
      employee: 2,
      guest: 1,
    };

    return hierarchy[session.role] >= hierarchy[requiredRole];
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isLoading,
        isAuthenticated: !!session,
        login,
        logout,
        register,
        updateProfile,
        changePassword,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
