// Authentication utilities using localStorage
import type { Company, Department, Role } from "./permissions";

export interface User {
  id: string;
  email: string;
  password: string; // In production, this should be hashed
  name: string;
  role: Role;
  company: Company;
  department: Department;
  phone?: string;
  avatar?: string;
  joinDate: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  role: Role;
  company: Company;
  department: Department;
  avatar?: string;
  loginAt: string;
}

const USERS_KEY = "wis_users";
const SESSION_KEY = "wis_session";

// Initialize with default admin user
const DEFAULT_USERS: User[] = [
  {
    id: "admin-001",
    email: "admin@wis.vn",
    password: "admin123",
    name: "Admin System",
    role: "group_admin",
    company: "WIS_GROUP",
    department: "WIS_IT",
    phone: "0900000000",
    joinDate: new Date().toISOString().split("T")[0],
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ceo-001",
    email: "ceo@wis.vn",
    password: "ceo123",
    name: "Nguyễn Thị Lan Anh",
    role: "group_ceo",
    company: "WIS_GROUP",
    department: "WIS_EXECUTIVE",
    phone: "0900000001",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=LanAnh",
    joinDate: "2020-01-01",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // WCERT - Tầng 5
  {
    id: "wcert-ceo-001",
    email: "ceo.wcert@wis.vn",
    password: "wcert123",
    name: "Trần Văn Minh",
    role: "company_ceo",
    company: "WCERT",
    department: "WCERT_TECHNICAL",
    phone: "0900000002",
    joinDate: "2021-01-15",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wcert-tech-001",
    email: "auditor@wcert.vn",
    password: "auditor123",
    name: "Lê Thị Hương",
    role: "senior_specialist",
    company: "WCERT",
    department: "WCERT_TECHNICAL",
    phone: "0900000003",
    joinDate: "2021-03-20",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wcert-sales-001",
    email: "sales@wcert.vn",
    password: "sales123",
    name: "Phạm Quốc Tuấn",
    role: "specialist",
    company: "WCERT",
    department: "WCERT_SALES",
    phone: "0900000004",
    joinDate: "2021-06-10",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // SCT VIET - Tầng 3
  {
    id: "sct-ceo-001",
    email: "ceo.sct@wis.vn",
    password: "sct123",
    name: "Hoàng Minh Đức",
    role: "company_ceo",
    company: "SCT_VIET",
    department: "SCT_CONSULTING",
    phone: "0900000005",
    joinDate: "2020-08-01",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sct-science-001",
    email: "tuanvu@sct.vn",
    password: "tuanvu123",
    name: "Tuấn Vũ",
    role: "dept_manager",
    company: "SCT_VIET",
    department: "SCT_SCIENCE",
    phone: "0900000006",
    joinDate: "2020-09-15",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sct-science-002",
    email: "thuy@sct.vn",
    password: "thuy123",
    name: "Thùy",
    role: "senior_specialist",
    company: "SCT_VIET",
    department: "SCT_SCIENCE",
    phone: "0900000007",
    joinDate: "2021-01-10",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sct-science-003",
    email: "duc@sct.vn",
    password: "duc123",
    name: "Đức",
    role: "specialist",
    company: "SCT_VIET",
    department: "SCT_SCIENCE",
    phone: "0900000008",
    joinDate: "2021-02-20",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sct-science-004",
    email: "loc@sct.vn",
    password: "loc123",
    name: "Lộc",
    role: "specialist",
    company: "SCT_VIET",
    department: "SCT_SCIENCE",
    phone: "0900000009",
    joinDate: "2021-03-15",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sct-legal-001",
    email: "binh@sct.vn",
    password: "binh123",
    name: "Bình",
    role: "dept_manager",
    company: "SCT_VIET",
    department: "SCT_LEGAL",
    phone: "0900000010",
    joinDate: "2020-10-01",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sct-training-001",
    email: "trainer@sct.vn",
    password: "trainer123",
    name: "Nguyễn Văn Thành",
    role: "team_leader",
    company: "SCT_VIET",
    department: "SCT_TRAINING",
    phone: "0900000011",
    joinDate: "2021-04-01",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // ICT VIET - Tầng 2
  {
    id: "ict-ceo-001",
    email: "ceo.ict@wis.vn",
    password: "ict123",
    name: "Vũ Thị Mai",
    role: "company_ceo",
    company: "ICT_VIET",
    department: "ICT_TOURISM",
    phone: "0900000012",
    joinDate: "2020-07-01",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ict-tourism-001",
    email: "tour@ict.vn",
    password: "tour123",
    name: "Đỗ Minh Hà",
    role: "specialist",
    company: "ICT_VIET",
    department: "ICT_TOURISM",
    phone: "0900000013",
    joinDate: "2021-05-15",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "ict-vietgap-001",
    email: "vietgap@ict.vn",
    password: "vietgap123",
    name: "Lý Văn Sơn",
    role: "senior_specialist",
    company: "ICT_VIET",
    department: "ICT_VIETGAP",
    phone: "0900000014",
    joinDate: "2021-06-20",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Get all users from localStorage
export function getAllUsers(): User[] {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Initialize with default users
    localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  } catch (error) {
    console.error("Error loading users:", error);
    return DEFAULT_USERS;
  }
}

// Save users to localStorage
export function saveUsers(users: User[]): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (error) {
    console.error("Error saving users:", error);
  }
}

// Get user by email
export function getUserByEmail(email: string): User | null {
  const users = getAllUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

// Get user by id
export function getUserById(id: string): User | null {
  const users = getAllUsers();
  return users.find((u) => u.id === id) || null;
}

// Login
export function login(email: string, password: string): AuthSession | null {
  const user = getUserByEmail(email);
  
  if (!user) {
    return null;
  }

  if (user.password !== password) {
    return null;
  }

  if (user.status !== "active") {
    return null;
  }

  const session: AuthSession = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    company: user.company,
    department: user.department,
    avatar: user.avatar,
    loginAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error("Error saving session:", error);
  }

  return session;
}

// Register new user
export function register(userData: Omit<User, "id" | "createdAt" | "updatedAt">): User | null {
  const users = getAllUsers();
  
  // Check if email already exists
  if (users.some((u) => u.email.toLowerCase() === userData.email.toLowerCase())) {
    return null;
  }

  const newUser: User = {
    ...userData,
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  return newUser;
}

// Get current session
export function getSession(): AuthSession | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading session:", error);
  }
  return null;
}

// Logout
export function logout(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error("Error during logout:", error);
  }
}

// Update user
export function updateUser(userId: string, updates: Partial<User>): User | null {
  const users = getAllUsers();
  const index = users.findIndex((u) => u.id === userId);
  
  if (index === -1) {
    return null;
  }

  const updatedUser = {
    ...users[index],
    ...updates,
    id: users[index].id, // Don't allow ID change
    updatedAt: new Date().toISOString(),
  };

  users[index] = updatedUser;
  saveUsers(users);

  // Update session if current user
  const session = getSession();
  if (session && session.userId === userId) {
    const newSession: AuthSession = {
      ...session,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      company: updatedUser.company,
      department: updatedUser.department,
      avatar: updatedUser.avatar,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
  }

  return updatedUser;
}

// Delete user
export function deleteUser(userId: string): boolean {
  const users = getAllUsers();
  const filtered = users.filter((u) => u.id !== userId);
  
  if (filtered.length === users.length) {
    return false; // User not found
  }

  saveUsers(filtered);
  return true;
}

// Change password
export function changePassword(userId: string, oldPassword: string, newPassword: string): boolean {
  const users = getAllUsers();
  const user = users.find((u) => u.id === userId);
  
  if (!user) {
    return false;
  }

  if (user.password !== oldPassword) {
    return false;
  }

  user.password = newPassword;
  user.updatedAt = new Date().toISOString();
  saveUsers(users);

  return true;
}

// Permission checks
import { ROLE_HIERARCHY } from "./permissions";

export function hasPermission(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function canAccessRoute(userRole: Role, route: string): boolean {
  // Define route permissions with new roles
  const routePermissions: Record<string, Role> = {
    "/users": "group_admin",
    "/settings": "group_admin",
    "/hr": "dept_manager",
    "/contracts": "dept_manager",
    "/quotations": "team_leader",
    "/projects": "specialist",
    "/training": "staff",
    "/certifications": "staff",
    "/chat": "staff",
    "/rewards": "staff",
  };

  const requiredRole = routePermissions[route];
  if (!requiredRole) {
    return true; // Public route
  }

  return hasPermission(userRole, requiredRole);
}

// Exported functions for AuthContext compatibility
export const DEMO_USERS = DEFAULT_USERS;

export function loginUser(email: string, password: string): { success: boolean; session?: AuthSession; error?: string } {
  const session = login(email, password);
  if (session) {
    return { success: true, session };
  }
  return { success: false, error: 'Email hoặc mật khẩu không đúng' };
}

export function updateUserProfile(userId: string, data: { name: string; phone?: string }): { success: boolean; user?: User; error?: string } {
  const user = updateUser(userId, data);
  if (user) {
    return { success: true, user };
  }
  return { success: false, error: 'Cập nhật thất bại' };
}

export function changeUserPassword(userId: string, oldPassword: string, newPassword: string): { success: boolean; error?: string } {
  const success = changePassword(userId, oldPassword, newPassword);
  if (success) {
    return { success: true };
  }
  return { success: false, error: 'Mật khẩu hiện tại không đúng' };
}
