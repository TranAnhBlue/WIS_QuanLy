import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, MessagesSquare, Users, FileText, FileSignature, FolderKanban,
  BadgeCheck, GraduationCap, FlaskConical, Scale, Leaf, UserCog, Target,
  CheckCircle2, FileBox, Bell, Sparkles, Settings, Search, ChevronDown,
  TrendingUp, TrendingDown, ArrowUpRight, AlertTriangle, Clock, Send,
  Building2, ChevronsLeft, Circle, Award, LogOut, User as UserIcon, Shield,
} from "lucide-react";
import { message } from "antd";
import { useAuth } from "@/contexts/AuthContext";
import { DEPARTMENT_INFO, type Role, type Company, type Department, type Permission } from "@/lib/permissions";
import { apiRequest } from "@/lib/backend-api";
import wisLogo from "@/assets/logo-wis.jpg";
import { formatVND } from "@/lib/currency";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard - WIS" },
      { name: "description", content: "Hệ điều hành tập đoàn — quản trị Line 1, Line 2, Line 3 trên một nền tảng duy nhất." },
      { property: "og:title", content: "WIS — Hệ sinh thái xanh" },
      { property: "og:description", content: "Hệ điều hành tập đoàn — quản trị Line 1, Line 2, Line 3 trên một nền tảng duy nhất." },
    ],
  }),
  component: DashboardPage,
});

type ModuleItem = { 
  id: string; 
  label: string; 
  icon: typeof LayoutDashboard; 
  requiresPermission?: string;
  minRole?: Role;
  roles?: Role[];
  companies?: Company[]; // Module chỉ hiển thị cho các công ty này
  departments?: Department[]; // Module chỉ hiển thị cho các phòng ban này
};

type ModuleGroup = {
  group: string;
  items: ModuleItem[];
  hiddenForRoles?: Role[]; // Group ẩn với các roles này
};

// Helper function để kiểm tra xem một module có được hiển thị cho user hiện tại không
function isModuleVisible(
  item: ModuleItem, 
  userRole: Role, 
  userCompany: Company,
  userDepartment: Department,
  hasPermissionFn: (permission: Permission) => boolean
): boolean {
  // Quản trị viên hệ thống có thể thấy tất cả module.
  if (userRole === "group_admin") {
    return true;
  }

  // Ban lãnh đạo quản lý nghiệp vụ/nhân sự, không quản trị tài khoản hệ thống.
  if (userRole === "group_ceo" || userRole === "group_director") {
    return item.id !== "users";
  }
  
  // Company CEO và Deputy có thể thấy hầu hết (trừ system settings)
  if ((userRole === "company_ceo" || userRole === "company_deputy") && !["settings", "users"].includes(item.id)) {
    return true;
  }
  
  // Kiểm tra company - nếu module chỉ dành cho công ty cụ thể
  if (item.companies && !item.companies.includes(userCompany)) {
    return false;
  }
  
  // Kiểm tra department - nếu module chỉ dành cho phòng ban cụ thể
  if (item.departments && !item.departments.includes(userDepartment)) {
    return false;
  }
  
  // Kiểm tra permission nếu có
  if (item.requiresPermission && !hasPermissionFn(item.requiresPermission as Permission)) {
    return false;
  }
  
  // Kiểm tra minRole nếu có
  if (item.minRole) {
    const roleHierarchy: Record<Role, number> = {
      intern: 10, staff: 20, specialist: 30, senior_specialist: 40, team_leader: 50,
      dept_deputy: 60, dept_manager: 70, company_deputy: 75, company_ceo: 80,
      group_admin: 90, group_director: 95, group_ceo: 100,
    };
    if (roleHierarchy[userRole] < roleHierarchy[item.minRole]) {
      return false;
    }
  }
  
  // Kiểm tra roles cụ thể nếu có
  if (item.roles && !item.roles.includes(userRole)) {
    return false;
  }
  
  return true;
}

const MODULES: ModuleGroup[] = [
  {
    group: "Tổng quan",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "chat", label: "Chat nội bộ", icon: MessagesSquare },
      { 
        id: "notifications", 
        label: "Thông báo", 
        icon: Bell
      },
      { 
        id: "attendance", 
        label: "Chấm công", 
        icon: Clock
      },
    ],
  },
  {
    group: "Kinh doanh",
    hiddenForRoles: ["group_admin"], // Admin không thấy group này
    items: [
      { 
        id: "crm", 
        label: "CRM & Khách hàng", 
        icon: Users,
        requiresPermission: "view_customers"
      },
      { 
        id: "quotations", 
        label: "Báo giá", 
        icon: FileText,
        requiresPermission: "view_quotations"
      },
      { 
        id: "contracts", 
        label: "Hợp đồng", 
        icon: FileSignature,
        requiresPermission: "view_contracts"
      },
      { 
        id: "projects", 
        label: "Dự án", 
        icon: FolderKanban,
        requiresPermission: "view_projects"
      },
    ],
  },
  {
    group: "Nghiệp vụ",
    hiddenForRoles: ["group_admin"], // Admin không thấy group này
    items: [
      { 
        id: "certifications", 
        label: "Chứng nhận ISO", 
        icon: BadgeCheck,
        requiresPermission: "view_certifications",
        companies: ["WCERT"], // Chỉ WCERT mới có chứng nhận ISO
        departments: ["WCERT_CERT", "WCERT_AUDIT", "WCERT_TRAINING"]
      },
      { 
        id: "training", 
        label: "Đào tạo", 
        icon: GraduationCap,
        requiresPermission: "view_training",
        companies: ["SCT_VIET", "WCERT"], // SCT và WCERT có đào tạo
        departments: ["SCT_TRAINING", "WCERT_TRAINING"]
      },
      { 
        id: "science", 
        label: "Nhiệm vụ KH", 
        icon: FlaskConical,
        requiresPermission: "view_science_missions",
        companies: ["SCT_VIET"], // Chỉ SCT có nhiệm vụ KH
        departments: ["SCT_SCIENCE"] // Phòng 302
      },
      { 
        id: "legal", 
        label: "Bảo hộ & Pháp lý", 
        icon: Scale,
        requiresPermission: "view_legal",
        companies: ["SCT_VIET", "ICT_VIET"], // SCT và ICT có pháp lý
        departments: ["SCT_LEGAL", "ICT_LEGAL", "ICT_ADMIN"] // Phòng pháp lý SCT/ICT và hành chính ICT
      },
      { 
        id: "vietgap", 
        label: "VietGAP", 
        icon: Leaf,
        requiresPermission: "view_vietgap",
        companies: ["ICT_VIET"], // Chỉ ICT có VietGAP
        departments: ["ICT_VIETGAP", "ICT_ORGANIC", "ICT_ADMIN"]
      },
    ],
  },
  {
    group: "Tổ chức",
    hiddenForRoles: ["group_admin"], // Admin không thấy group này
    items: [
      { 
        id: "hrm", 
        label: "Nhân sự", 
        icon: UserCog,
        requiresPermission: "view_hr"
      },
      { 
        id: "kpi", 
        label: "KPI", 
        icon: Target,
        requiresPermission: "view_kpi"
      },
      { 
        id: "rewards", 
        label: "Tích thưởng", 
        icon: Award,
        requiresPermission: "view_rewards"
      },
      { 
        id: "approvals", 
        label: "Duyệt", 
        icon: CheckCircle2,
        minRole: "team_leader"
      },
      { 
        id: "documents", 
        label: "Tài liệu", 
        icon: FileBox,
        requiresPermission: "view_documents"
      },
    ],
  },
  {
    group: "Hệ thống",
    items: [
      { 
        id: "users", 
        label: "Quản lý người dùng", 
        icon: Users,
        requiresPermission: "manage_users"
      },
      { 
        id: "attendance-management", 
        label: "Quản lý chấm công", 
        icon: Clock,
        roles: ["group_admin", "group_ceo", "group_director", "company_ceo", "company_deputy", "dept_manager"]
      },
      { 
        id: "ai", 
        label: "AI Assistant", 
        icon: Sparkles,
        minRole: "specialist"
      },
      { 
        id: "settings", 
        label: "Cài đặt", 
        icon: Settings,
        requiresPermission: "manage_settings"
      },
    ],
  },
];

const COMPANIES = [
  { id: "group", label: "Toàn tập đoàn", color: "oklch(0.82 0.16 82)" },
  { id: "sct", label: "Line 1", color: "oklch(0.72 0.17 155)" },
  { id: "wcert", label: "Line 2", color: "oklch(0.7 0.15 230)" },
  { id: "ict", label: "Line 3", color: "oklch(0.65 0.2 310)" },
];

function getVietnamClock(now = new Date()) {
  const timeZone = "Asia/Ho_Chi_Minh";
  const dateText = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone,
  }).format(now);
  const timeText = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone,
  }).format(now);
  const hour = Number(new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit", hour12: false, timeZone,
  }).format(now));
  const greeting = hour >= 5 && hour < 11
    ? "Chào buổi sáng"
    : hour >= 11 && hour < 14
      ? "Chào buổi trưa"
      : hour >= 14 && hour < 18
        ? "Chào buổi chiều"
        : "Chào buổi tối";
  return {
    dateTime: `${dateText.charAt(0).toUpperCase()}${dateText.slice(1)} • ${timeText}`,
    greeting,
  };
}

const REVENUE = [
  { company: "Line 1", value: 1965, delta: 8.1, trend: "up", desc: "Tư vấn & đào tạo" },
  { company: "Line 2", value: 4280, delta: 12.4, trend: "up", desc: "Phạm vi tiêu chuẩn quy chuẩn ISO" },
  { company: "Line 3", value: 1120, delta: -3.2, trend: "down", desc: "VietGAP & du lịch" },
];

const KPIS = [
  { label: "Lead mới", value: 47, sub: "+12 tuần này", icon: TrendingUp, tone: "info" },
  { label: "Khách hàng mới", value: 18, sub: "+5 tuần này", icon: Users, tone: "success" },
  { label: "Hợp đồng ký", value: 9, sub: formatVND(1_840_000_000), icon: FileSignature, tone: "primary" },
  { label: "Dự án đang chạy", value: 27, sub: "23 đúng tiến độ", icon: FolderKanban, tone: "info" },
  { label: "Dự án quá hạn", value: 4, sub: "Cần xử lý gấp", icon: AlertTriangle, tone: "destructive" },
  { label: "Task quá hạn", value: 8, sub: "Hôm nay", icon: Clock, tone: "warning" },
];

const PROJECTS = [
  { code: "WC-2025-041", name: "ISO 9001 — Công ty TNHH Minh Phú", company: "Line 2", pm: "Nguyễn Văn A", progress: 78, status: "on-track", due: "12/07" },
  { code: "WC-2025-038", name: "ISO 22000 — Vinamilk Tiên Sơn", company: "Line 2", pm: "Trần Thị B", progress: 45, status: "at-risk", due: "28/06" },
  { code: "SC-2025-019", name: "Đào tạo Lead Auditor — Khóa 12", company: "Line 1", pm: "Lê Minh C", progress: 92, status: "on-track", due: "30/06" },
  { code: "IC-2025-007", name: "VietGAP — HTX Nông sản Sơn La", company: "Line 3", pm: "Phạm Quốc D", progress: 22, status: "overdue", due: "20/06" },
  { code: "WC-2025-035", name: "HACCP — Thủy sản Bình Định", company: "Line 2", pm: "Hoàng Thu E", progress: 64, status: "on-track", due: "05/08" },
];

const ACTIVITY = [
  { time: "09:42", actor: "Nguyễn Văn A", action: "đã ký hợp đồng", target: "HĐ-2025-184", value: formatVND(285_000_000), tone: "success" },
  { time: "09:18", actor: "Trần Thị B", action: "tạo báo giá mới", target: "BG-2025-072", value: null, tone: "info" },
  { time: "08:55", actor: "Hệ thống", action: "cảnh báo dự án quá hạn", target: "IC-2025-007", value: null, tone: "destructive" },
  { time: "08:30", actor: "Lê Minh C", action: "hoàn thành đánh giá GĐ1", target: "WC-2025-038", value: null, tone: "success" },
  { time: "07:55", actor: "Phạm Quốc D", action: "yêu cầu duyệt chi phí", target: formatVND(12_500_000), value: null, tone: "warning" },
];

function DashboardPage() {
  const navigate = useNavigate();
  const { session, user, isAuthenticated, isLoading, logout, hasPermission } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState("dashboard");
  const [company, setCompany] = useState("group");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [dashboard, setDashboard] = useState<{ users: number; attendanceToday: number; projects: number; resources: Record<string, number>; revenue: Record<string, number>; employeesByLine: Record<string, number>; projectRows: typeof PROJECTS; activities: typeof ACTIVITY } | null>(null);
  const [vietnamClock, setVietnamClock] = useState<{ dateTime: string; greeting: string } | null>(null);

  useEffect(() => {
    const updateClock = () => setVietnamClock(getVietnamClock());
    updateClock();
    const timer = window.setInterval(updateClock, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isAuthenticated) apiRequest<{ stats: typeof dashboard }>("/api/dashboard")
      .then((r) => setDashboard(r.stats)).catch((e) => message.error(e.message));
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    apiRequest<{ count: number }>("/api/notifications/unread-count")
      .then((result) => setUnreadNotifications(result.count))
      .catch(() => setUnreadNotifications(0));
  }, [isAuthenticated]);

  const liveRevenue = REVENUE.map((r) => ({
    ...r,
    value: dashboard?.revenue?.[r.company] || 0,
    delta: 0,
    desc: `${r.desc} • ${dashboard?.employeesByLine?.[r.company] ?? 0} nhân sự`,
  }));
  const liveKpis = [
    { label: "Người dùng", value: dashboard?.users ?? 0, sub: "Tài khoản đang quản lý", icon: Users, tone: "info", to: "/users", adminOnly: true },
    { label: "Chấm công hôm nay", value: dashboard?.attendanceToday ?? 0, sub: "Bản ghi hôm nay", icon: CheckCircle2, tone: "success", to: "/attendance-management" },
    { label: "Hợp đồng", value: dashboard?.resources?.contracts ?? 0, sub: "Hợp đồng đang quản lý", icon: FileSignature, tone: "primary", to: "/contracts" },
    { label: "Dự án", value: dashboard?.projects ?? 0, sub: "Dự án đang quản lý", icon: FolderKanban, tone: "info", to: "/projects" },
    { label: "Báo giá", value: dashboard?.resources?.quotations ?? 0, sub: "Báo giá đang quản lý", icon: FileText, tone: "warning", to: "/quotations" },
    { label: "Nhân sự", value: dashboard?.resources?.employees ?? 0, sub: "Hồ sơ nhân sự", icon: UserCog, tone: "destructive", to: "/hr" },
  ].filter((k) => !k.adminOnly || user?.role === "group_admin");
  const liveActivities = dashboard?.activities || [];

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  // Helper function to get dashboard title based on role
  const getDashboardTitle = (role: Role) => {
    if (role === "group_ceo" || role === "group_director") return "Dashboard CEO";
    if (role === "company_ceo" || role === "company_deputy") return "Dashboard Giám đốc";
    if (role === "dept_manager" || role === "dept_deputy") return "Dashboard Phòng ban";
    if (role === "team_leader") return "Dashboard Team";
    if (role === "group_admin") return "Dashboard Hệ thống";
    return "Dashboard";
  };

  const dashboardTitle = getDashboardTitle(user.role);

  const handleLogout = () => {
    logout();
    message.success("Đã đăng xuất thành công!");
    navigate({ to: "/login" });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex min-h-screen text-foreground">
      {/* Sidebar */}
      <aside
        className={`${collapsed ? "w-[72px]" : "w-[260px]"} shrink-0 border-r border-sidebar-border bg-sidebar transition-all duration-300 flex flex-col sticky top-0 h-screen`}
      >
        <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
          <div className="size-10 shrink-0 overflow-hidden rounded-full bg-white p-1 ring-1 ring-sidebar-border shadow-sm">
            <img src={wisLogo} alt="WIS" className="h-full w-full object-contain" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="font-display font-semibold text-sm leading-tight truncate">WIS</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">Hệ sinh thái xanh</div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="text-muted-foreground hover:text-foreground transition"
              aria-label="Thu gọn"
            >
              <ChevronsLeft className="size-4" />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="mx-auto mt-2 size-8 grid place-items-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            aria-label="Mở rộng"
          >
            <ChevronsLeft className="size-4 rotate-180" />
          </button>
        )}

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {MODULES.map((group) => {
            // Check if group is hidden for current user role
            if (group.hiddenForRoles && group.hiddenForRoles.includes(user.role)) {
              return null;
            }
            
            // Filter items based on user role, company, department and permissions
            const visibleItems = group.items.filter(item => {
              // hasPermission from useAuth returns a function, so we pass it directly
              return isModuleVisible(item, user.role, user.company as Company, user.department as Department, hasPermission);
            });
            
            // Don't show group if no items are visible
            if (visibleItems.length === 0) {
              return null;
            }
            
            return (
              <div key={group.group}>
                {!collapsed && (
                  <div className="px-3 mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
                    {group.group}
                  </div>
                )}
                <ul className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = active === item.id;
                    const routeMap: Record<string, string> = { 
                      chat: "/chat", 
                      notifications: "/notifications",
                      training: "/training", 
                      hrm: "/hr", 
                      rewards: "/reward", 
                      certifications: "/certifications", 
                      projects: "/projects", 
                      quotations: "/quotations", 
                      contracts: "/contracts",
                      science: "/science",
                      legal: "/legal",
                      vietgap: "/vietgap",
                      users: "/users",
                      attendance: "/attendance",
                      "attendance-management": "/attendance-management",
                      settings: "/setup"
                    };
                    const to = routeMap[item.id];
                    const cls = `w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition relative ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    }`;
                    const inner = (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-primary rounded-r" />
                        )}
                        <Icon className="size-4 shrink-0" />
                        {!collapsed && (
                          <span className="flex-1 text-left truncate">{item.label}</span>
                        )}
                      </>
                    );
                    return (
                      <li key={item.id}>
                        {to ? (
                          <Link to={to} className={cls} title={collapsed ? item.label : undefined}>
                            {inner}
                          </Link>
                        ) : (
                          <button
                            onClick={() => setActive(item.id)}
                            className={cls}
                            title={collapsed ? item.label : undefined}
                          >
                            {inner}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className={`border-t border-sidebar-border p-3 ${collapsed ? "flex justify-center" : ""}`}>
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`flex items-center gap-3 w-full hover:bg-sidebar-accent rounded-md p-1 transition ${collapsed ? "" : ""}`}
            >
              <div className="size-8 shrink-0 rounded-full bg-gradient-to-br from-primary to-chart-2 grid place-items-center font-display font-semibold text-primary-foreground text-xs">
                {getInitials(user.name)}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium truncate">{user.name}</div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {DEPARTMENT_INFO[user.department as Department]?.name || user.department}
                  </div>
                </div>
              )}
              {!collapsed && (
                <span className="size-2 rounded-full bg-success animate-pulse-dot" aria-label="online" />
              )}
            </button>

            {/* User dropdown menu */}
            {showUserMenu && !collapsed && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-popover border border-border rounded-md shadow-lg overflow-hidden">
                <div className="p-3 border-b border-border">
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
                <div className="py-1">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <UserIcon className="h-4 w-4" />
                    Thông tin cá nhân
                  </Link>
                  {hasPermission("manage_users") && (
                    <Link
                      to="/users"
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Shield className="h-4 w-4" />
                      Quản lý người dùng
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition w-full text-left text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-10 flex items-center gap-4 px-6">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Tập đoàn</span>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">{dashboardTitle}</span>
          </div>

          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                placeholder="Tìm khách hàng, dự án, hợp đồng…"
                className="w-full h-9 pl-9 pr-16 rounded-md bg-surface border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5">⌘K</kbd>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-md bg-surface border border-border">
            {COMPANIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCompany(c.id)}
                className={`px-3 py-1 text-xs font-medium rounded transition ${
                  company === c.id ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {company === c.id && (
                  <span className="inline-block size-1.5 rounded-full mr-1.5" style={{ background: c.color }} />
                )}
                {c.label}
              </button>
            ))}
          </div>

          <Link to="/notifications" className="relative size-9 grid place-items-center rounded-md hover:bg-surface transition" aria-label="Mở thông báo">
            <Bell className="size-4" />
            {unreadNotifications > 0 && (
              <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-5 text-destructive-foreground">
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
              </span>
            )}
          </Link>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 space-y-6">
          {/* Page heading */}
          <div className="flex items-end justify-between gap-4 flex-wrap animate-count-up">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
                {vietnamClock?.dateTime || "Đang cập nhật thời gian..."}
              </div>
              <h1 className="font-display text-3xl font-semibold tracking-tight">
                {vietnamClock?.greeting || "Xin chào"}, <span className="text-primary">{user.name}</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Dữ liệu hôm nay: <span className="text-success font-medium">{dashboard?.attendanceToday ?? 0}</span> lượt chấm công • <span className="text-warning font-medium">{dashboard?.projects ?? 0}</span> dự án
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Circle className="size-2 fill-success text-success animate-pulse-dot" />
              Dữ liệu cập nhật real-time
            </div>
          </div>

          {/* Revenue per company - Only visible for management levels */}
          {(user.role === "group_ceo" || user.role === "group_director" || user.role === "group_admin" || 
            user.role === "company_ceo" || user.role === "company_deputy") && (
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {liveRevenue.map((r, idx) => (
                <div
                  key={r.company}
                  className="kpi-tile kpi-tile-hover p-5 animate-count-up"
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full" style={{ background: COMPANIES[idx + 1].color }} />
                      <span className="text-sm font-medium">{r.company}</span>
                    </div>
                    <span className={`flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded ${
                      r.trend === "up" ? "text-success bg-success/10" : "text-destructive bg-destructive/10"
                    }`}>
                      {r.trend === "up" ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                      {r.delta > 0 ? "+" : ""}{r.delta}%
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-3xl font-semibold tabular-nums">{formatVND(r.value)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">{r.desc}</div>
                  {/* Mini sparkline */}
                  <svg viewBox="0 0 100 24" className="w-full h-6 mt-3" preserveAspectRatio="none">
                    <polyline
                      points={r.trend === "up"
                        ? "0,20 12,18 24,16 36,14 48,12 60,10 72,7 84,5 100,3"
                        : "0,8 12,10 24,9 36,13 48,12 60,15 72,14 84,18 100,20"}
                      fill="none"
                      stroke={COMPANIES[idx + 1].color}
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
              ))}
            </section>
          )}

          {/* KPI tiles */}
          <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {liveKpis.map((k, idx) => {
              const Icon = k.icon;
              const toneClass = {
                info: "text-info",
                success: "text-success",
                primary: "text-primary",
                warning: "text-warning",
                destructive: "text-destructive",
              }[k.tone];
              return (
                <Link
                  to={k.to}
                  key={k.label}
                  className="kpi-tile kpi-tile-hover block p-4 animate-count-up focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{ animationDelay: `${240 + idx * 50}ms` }}
                  aria-label={`Mở module ${k.label}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`size-4 ${toneClass}`} />
                    <ArrowUpRight className="size-3 text-muted-foreground/50" />
                  </div>
                  <div className="font-display text-2xl font-semibold tabular-nums">{k.value}</div>
                  <div className="text-[11px] text-foreground/80 font-medium mt-1">{k.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{k.sub}</div>
                </Link>
              );
            })}
          </section>

          {/* Two-column: Projects + AI/Activity */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Projects table */}
            <div className="surface-card lg:col-span-2 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div>
                  <h2 className="font-display font-semibold">Dự án trọng điểm</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {dashboard?.projectRows?.length ?? 0}/{dashboard?.projects ?? 0} dự án đang theo dõi cấp CEO
                  </p>
                </div>
                <button className="text-xs text-primary hover:underline flex items-center gap-1">
                  Xem tất cả <ArrowUpRight className="size-3" />
                </button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                    <th className="text-left font-medium px-5 py-2.5">Mã / Tên</th>
                    <th className="text-left font-medium py-2.5">PM</th>
                    <th className="text-left font-medium py-2.5 w-40">Tiến độ</th>
                    <th className="text-left font-medium py-2.5">Trạng thái</th>
                    <th className="text-right font-medium px-5 py-2.5">Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {(dashboard?.projectRows || []).map((p) => {
                    const statusMap = ({
                      planning: { label: "Lập kế hoạch", cls: "bg-info/10 text-info" },
                      "on-track": { label: "Đúng tiến độ", cls: "bg-success/10 text-success" },
                      "at-risk": { label: "Rủi ro", cls: "bg-warning/10 text-warning" },
                      "overdue": { label: "Quá hạn", cls: "bg-destructive/10 text-destructive" },
                      done: { label: "Hoàn thành", cls: "bg-primary/10 text-primary" },
                    } as Record<string, { label: string; cls: string }>)[p.status] || {
                      label: p.status || "Chưa xác định",
                      cls: "bg-muted text-muted-foreground",
                    };
                    return (
                      <tr key={p.code} className="border-b border-border/50 last:border-0 hover:bg-surface/50 transition">
                        <td className="px-5 py-3">
                          <div className="font-mono text-[11px] text-muted-foreground">{p.code}</div>
                          <div className="font-medium text-sm mt-0.5">{p.name}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">{p.company}</div>
                        </td>
                        <td className="py-3 text-xs text-muted-foreground">{p.pm}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  p.status === "overdue" ? "bg-destructive" : p.status === "at-risk" ? "bg-warning" : "bg-success"
                                }`}
                                style={{ width: `${p.progress}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-mono tabular-nums text-muted-foreground w-8">{p.progress}%</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded ${statusMap.cls}`}>
                            {statusMap.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-xs font-mono tabular-nums text-muted-foreground">{p.due}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* AI Assistant - Only for specialist and above */}
            {(user.role !== "intern" && user.role !== "staff") && (
              <div className="surface-card overflow-hidden flex flex-col">
                <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                  <div className="size-7 rounded-md bg-gradient-to-br from-primary to-chart-5 grid place-items-center">
                    <Sparkles className="size-3.5 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-display font-semibold text-sm">
                      {user.role === "group_ceo" || user.role === "group_director" ? "CEO Assistant" : 
                       user.role === "company_ceo" || user.role === "company_deputy" ? "GĐ Assistant" :
                       "AI Assistant"}
                    </h2>
                    <p className="text-[10px] text-muted-foreground">
                      {user.role === "group_ceo" || user.role === "group_director" ? "Truy vấn dữ liệu tập đoàn bằng tiếng Việt" :
                       user.role === "company_ceo" || user.role === "company_deputy" ? "Truy vấn dữ liệu công ty bằng tiếng Việt" :
                       "Hỗ trợ thông minh cho công việc"}
                    </p>
                  </div>
                  <span className="size-1.5 rounded-full bg-success animate-pulse-dot" />
                </div>

                <div className="flex-1 p-4 space-y-3 text-sm">
                  <div className="text-muted-foreground text-xs">Câu hỏi gợi ý hôm nay:</div>
                  {((user.role === "group_ceo" || user.role === "group_director") ? [
                    "Công ty nào doanh thu thấp nhất tháng này?",
                    "Có bao nhiêu dự án ISO đang trễ?",
                    "Khách hàng nào sắp tái chứng nhận trong 30 ngày?",
                    "KPI phòng ban nào thấp nhất quý này?",
                  ] : (user.role === "company_ceo" || user.role === "company_deputy") ? [
                    "Dự án nào của công ty đang chậm tiến độ?",
                    "Nhân viên nào có KPI cao nhất tháng này?",
                    "Khách hàng nào cần chăm sóc trong tuần này?",
                    "Chi phí phòng ban nào vượt ngân sách?",
                  ] : [
                    "Nhiệm vụ nào tôi cần hoàn thành hôm nay?",
                    "Lịch họp của tôi tuần này như thế nào?",
                    "Có email nào cần phản hồi khẩn cấp?",
                    "Tiến độ dự án của team như thế nào?",
                  ]).map((q) => (
                    <button
                      key={q}
                      className="w-full text-left text-xs px-3 py-2.5 rounded-md bg-surface border border-border hover:border-primary/40 hover:bg-surface-2 transition group flex items-start gap-2"
                    >
                      <span className="text-primary mt-0.5">▸</span>
                      <span className="flex-1">{q}</span>
                    </button>
                  ))}
                </div>

                <div className="p-3 border-t border-border">
                  <div className="relative">
                    <input
                      placeholder={
                        user.role === "group_ceo" || user.role === "group_director" ? "Hỏi bất kỳ điều gì về tập đoàn…" :
                        user.role === "company_ceo" || user.role === "company_deputy" ? "Hỏi về công ty…" :
                        "Hỏi về công việc…"
                      }
                      className="w-full h-10 pl-3 pr-10 rounded-md bg-surface border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button className="absolute right-1.5 top-1.5 size-7 grid place-items-center rounded bg-primary text-primary-foreground hover:opacity-90 transition">
                      <Send className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Activity feed */}
          <section className="surface-card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="font-display font-semibold">Hoạt động hôm nay</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Cập nhật theo thời gian thực từ các phân hệ nghiệp vụ</p>
              </div>
              <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                Lọc <ChevronDown className="size-3" />
              </button>
            </div>
            <ul className="divide-y divide-border/50">
              {liveActivities.map((a, i) => {
                const toneClass = {
                  success: "bg-success",
                  info: "bg-info",
                  warning: "bg-warning",
                  destructive: "bg-destructive",
                }[a.tone];
                return (
                  <li key={i} className="px-5 py-3 flex items-center gap-4 hover:bg-surface/50 transition">
                    <div className="font-mono text-[11px] text-muted-foreground tabular-nums w-12">{a.time}</div>
                    <span className={`size-2 rounded-full shrink-0 ${toneClass}`} />
                    <div className="flex-1 text-sm min-w-0">
                      <span className="font-medium">{a.actor}</span>
                      <span className="text-muted-foreground"> {a.action} </span>
                      <span className="font-mono text-xs text-foreground/80">{a.target}</span>
                    </div>
                    {a.value && (
                      <span className="text-xs font-mono text-success tabular-nums">{a.value}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <footer className="text-[11px] text-muted-foreground text-center py-4">
            WIS v0.1 — Prototype • Hệ sinh thái xanh • Phiên bản dành cho phê duyệt thiết kế
          </footer>
        </main>
      </div>
    </div>
  );
}
