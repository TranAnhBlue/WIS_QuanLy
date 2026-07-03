// Authentication utilities using localStorage
export type UserRole = "admin" | "ceo" | "manager" | "employee" | "guest";

export interface User {
  id: string;
  email: string;
  password: string; // In production, this should be hashed
  name: string;
  role: UserRole;
  company: string;
  department: string;
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
  role: UserRole;
  company: string;
  department: string;
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
    password: "admin123", // In production, hash this
    name: "Admin System",
    role: "admin",
    company: "WIS Group",
    department: "IT",
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
    role: "ceo",
    company: "WIS Group",
    department: "Executive",
    phone: "0900000001",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=LanAnh",
    joinDate: "2020-01-01",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "mgr-001",
    email: "manager@wis.vn",
    password: "manager123",
    name: "Trần Văn Minh",
    role: "manager",
    company: "WIS Group",
    department: "Sales",
    phone: "0900000002",
    joinDate: "2021-03-15",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "emp-001",
    email: "employee@wis.vn",
    password: "employee123",
    name: "Lê Thị Hương",
    role: "employee",
    company: "WIS Group",
    department: "Marketing",
    phone: "0900000003",
    joinDate: "2022-06-01",
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
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const hierarchy: Record<UserRole, number> = {
    admin: 5,
    ceo: 4,
    manager: 3,
    employee: 2,
    guest: 1,
  };

  return hierarchy[userRole] >= hierarchy[requiredRole];
}

export function canAccessRoute(userRole: UserRole, route: string): boolean {
  // Define route permissions
  const routePermissions: Record<string, UserRole> = {
    "/admin": "admin",
    "/users": "admin",
    "/hr": "manager",
    "/contracts": "manager",
    "/quotations": "manager",
    "/projects": "employee",
    "/training": "employee",
    "/certifications": "employee",
    "/chat": "employee",
    "/rewards": "employee",
  };

  const requiredRole = routePermissions[route];
  if (!requiredRole) {
    return true; // Public route
  }

  return hasPermission(userRole, requiredRole);
}
