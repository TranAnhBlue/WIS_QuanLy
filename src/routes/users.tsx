import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Users as UsersIcon,
  Eye,
  EyeOff,
  Shield,
  ShieldCheck,
  User as UserIcon,
  Crown,
  Building2,
} from "lucide-react";
import { message } from "antd";
import { useAuth } from "@/contexts/AuthContext";
import type { Role, Company, Department } from "@/lib/permissions";
import { COMPANY_INFO, DEPARTMENT_INFO, ROLE_HIERARCHY } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  company: Company;
  department: Department;
  phone?: string;
  avatar?: string;
  joinDate: Date | string;
  status: 'active' | 'inactive';
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

const userSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự").optional(),
  name: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
  role: z.string(),
  company: z.string(),
  department: z.string(),
  phone: z.string().optional(),
  status: z.enum(["active", "inactive"]),
});

type UserForm = z.infer<typeof userSchema>;

function UsersPage() {
  const navigate = useNavigate();
  const { user: currentUser, session, isAuthenticated, hasPermission } = useAuth();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<ApiUser | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [availableDepartments, setAvailableDepartments] = useState<Department[]>([]);

  const form = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      role: "staff",
      company: "WIS_GROUP",
      department: "WIS_IT",
      phone: "",
      status: "active",
    },
  });

  // Check permission - only group_admin can access
  useEffect(() => {
    console.log('🔍 Users Page - Permission Check:');
    console.log('   isAuthenticated:', isAuthenticated);
    console.log('   session:', !!session);
    console.log('   currentUser:', currentUser);
    console.log('   hasPermission("manage_users"):', hasPermission("manage_users"));
    
    if (!isAuthenticated || !session) {
      console.log('❌ Not authenticated - redirecting to login');
      navigate({ to: "/login" });
      return;
    }
    
    if (!hasPermission("manage_users")) {
      console.log('❌ No permission - redirecting to 403');
      navigate({ to: "/403" });
      return;
    }
    
    console.log('✅ Access granted - loading users');
  }, [isAuthenticated, session, hasPermission, navigate]);

  // Show loading while checking permissions
  if (!isAuthenticated || !session) {
    return null;
  }

  if (!hasPermission("manage_users")) {
    return null;
  }

  // Load users from MongoDB API
  useEffect(() => {
    loadUsers();
  }, [session?.token]);

  // Update departments when company changes
  useEffect(() => {
    const company = form.watch("company") as Company;
    if (company && COMPANY_INFO[company]) {
      setAvailableDepartments(COMPANY_INFO[company].departments);
      // Reset department to first available
      if (COMPANY_INFO[company].departments.length > 0) {
        form.setValue("department", COMPANY_INFO[company].departments[0]);
      }
    }
  }, [form]);

  const loadUsers = async () => {
    try {
      if (!session?.token) {
        message.error('Phiên đăng nhập không hợp lệ');
        return;
      }

      // Call Backend Node.js API (không phải Nitro API)
      const API_BASE = 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/users`, {
        headers: {
          'Authorization': `Bearer ${session.token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUsers(data.users);
      } else {
        console.error('Failed to load users:', data.message || data.error);
        message.error(data.message || 'Không thể tải danh sách người dùng từ database');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      message.error('Lỗi kết nối với backend API server. Đảm bảo server đang chạy tại http://localhost:5000');
    }
  };

  const filtered = useMemo(() => {
    return users.filter((user) => {
      const matchSearch =
        search === "" ||
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        DEPARTMENT_INFO[user.department]?.name.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === "all" || user.role === roleFilter;
      const matchCompany = companyFilter === "all" || user.company === companyFilter;
      const matchStatus = statusFilter === "all" || user.status === statusFilter;
      return matchSearch && matchRole && matchCompany && matchStatus;
    });
  }, [users, search, roleFilter, companyFilter, statusFilter]);

  const stats = useMemo(() => {
    const byCompany = {
      WCERT: users.filter((u) => u.company === "WCERT").length,
      SCT_VIET: users.filter((u) => u.company === "SCT_VIET").length,
      ICT_VIET: users.filter((u) => u.company === "ICT_VIET").length,
      WIS_GROUP: users.filter((u) => u.company === "WIS_GROUP").length,
    };

    return {
      total: users.length,
      active: users.filter((u) => u.status === "active").length,
      ...byCompany,
    };
  }, [users]);

  const openCreate = () => {
    setEditingUser(null);
    const defaultCompany: Company = "WIS_GROUP";
    setAvailableDepartments(COMPANY_INFO[defaultCompany].departments);
    
    form.reset({
      email: "",
      password: "",
      name: "",
      role: "staff",
      company: defaultCompany,
      department: COMPANY_INFO[defaultCompany].departments[0],
      phone: "",
      status: "active",
    });
    setError("");
    setSuccess("");
    setDialogOpen(true);
  };

  const openEdit = (user: ApiUser) => {
    setEditingUser(user);
    setAvailableDepartments(COMPANY_INFO[user.company].departments);
    
    form.reset({
      email: user.email,
      password: "", // Don't show password
      name: user.name,
      role: user.role,
      company: user.company,
      department: user.department,
      phone: user.phone || "",
      status: user.status,
    });
    setError("");
    setSuccess("");
    setDialogOpen(true);
  };

  const onSubmit = async (data: UserForm) => {
    setError("");
    setSuccess("");

    try {
      if (!session?.token) {
        message.error("Phiên đăng nhập không hợp lệ");
        return;
      }

      const API_BASE = 'http://localhost:5000';

      if (editingUser) {
        // Update existing user via Backend API
        const response = await fetch(`${API_BASE}/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: data.name,
            role: data.role,
            company: data.company,
            department: data.department,
            phone: data.phone,
            status: data.status,
            password: data.password || undefined, // Only send if provided
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          message.success(`Cập nhật người dùng "${data.name}" thành công!`);
          await loadUsers();
          setTimeout(() => setDialogOpen(false), 500);
        } else {
          message.error(result.message || 'Cập nhật người dùng thất bại');
        }
      } else {
        // Create new user via Backend API
        if (!data.password) {
          message.error("Vui lòng nhập mật khẩu");
          return;
        }

        const response = await fetch(`${API_BASE}/api/users`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
            name: data.name,
            role: data.role,
            company: data.company,
            department: data.department,
            phone: data.phone,
            status: data.status,
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          message.success(`Tạo người dùng "${data.name}" thành công!`);
          await loadUsers();
          setTimeout(() => setDialogOpen(false), 500);
        } else {
          message.error(result.message || 'Tạo người dùng thất bại');
        }
      }
    } catch (err) {
      console.error('Submit error:', err);
      message.error("Lỗi kết nối với backend API server");
    }
  };

  const confirmDelete = (user: ApiUser) => {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingUser) return;

    // Prevent deleting self
    if (deletingUser.id === currentUser?.id) {
      message.error("Không thể xóa tài khoản đang đăng nhập");
      return;
    }

    try {
      if (!session?.token) {
        message.error("Phiên đăng nhập không hợp lệ");
        return;
      }

      const API_BASE = 'http://localhost:5000';

      // Call Backend API to delete user from MongoDB
      const response = await fetch(`${API_BASE}/api/users/${deletingUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.token}`,
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        message.success(`Đã xóa người dùng "${deletingUser.name}" thành công`);
        await loadUsers();
        setDeleteDialogOpen(false);
        setDeletingUser(null);
      } else {
        message.error(result.message || 'Xóa người dùng thất bại');
      }
    } catch (error) {
      console.error('Delete error:', error);
      message.error('Lỗi kết nối với backend API server');
    }
  };

  const getRoleIcon = (role: Role) => {
    const level = ROLE_HIERARCHY[role];
    if (level >= 85) return <ShieldCheck className="h-4 w-4" />;
    if (level >= 70) return <Crown className="h-4 w-4" />;
    if (level >= 50) return <Shield className="h-4 w-4" />;
    return <UserIcon className="h-4 w-4" />;
  };

  const getRoleName = (role: Role) => {
    const names: Record<string, string> = {
      group_ceo: "Tổng GĐ",
      group_director: "GĐ Điều hành",
      group_admin: "Admin",
      company_ceo: "GĐ Công ty",
      company_deputy: "Phó GĐ",
      dept_manager: "Trưởng phòng",
      dept_deputy: "Phó phòng",
      team_leader: "Trưởng nhóm",
      senior_specialist: "Chuyên viên cao cấp",
      specialist: "Chuyên viên",
      staff: "Nhân viên",
      intern: "Thực tập sinh",
    };
    return names[role] || role;
  };

  const getRoleColor = (role: Role) => {
    const level = ROLE_HIERARCHY[role];
    if (level >= 85) return "bg-red-500";
    if (level >= 70) return "bg-purple-500";
    if (level >= 50) return "bg-blue-500";
    if (level >= 30) return "bg-green-500";
    return "bg-gray-500";
  };

  const getCompanyName = (company: Company) => {
    return COMPANY_INFO[company]?.name || company;
  };

  const getDepartmentName = (department: Department) => {
    return DEPARTMENT_INFO[department]?.name || department;
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
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <UsersIcon className="h-8 w-8" />
              Quản lý người dùng
            </h1>
            <p className="text-muted-foreground">Quản lý tài khoản và phân quyền người dùng</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm người dùng
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tổng số</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Hoạt động</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">WCERT</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.WCERT}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">SCT VIET</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.SCT_VIET}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">ICT VIET</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.ICT_VIET}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">WIS Group</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.WIS_GROUP}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên, email, phòng ban..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Công ty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả công ty</SelectItem>
                  <SelectItem value="WCERT">WCERT</SelectItem>
                  <SelectItem value="SCT_VIET">SCT VIET</SelectItem>
                  <SelectItem value="ICT_VIET">ICT VIET</SelectItem>
                  <SelectItem value="WIS_GROUP">WIS Group</SelectItem>
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả vai trò</SelectItem>
                  <SelectItem value="group_ceo">Tổng GĐ</SelectItem>
                  <SelectItem value="group_admin">Admin</SelectItem>
                  <SelectItem value="company_ceo">GĐ Công ty</SelectItem>
                  <SelectItem value="dept_manager">Trưởng phòng</SelectItem>
                  <SelectItem value="team_leader">Trưởng nhóm</SelectItem>
                  <SelectItem value="senior_specialist">Chuyên viên cao cấp</SelectItem>
                  <SelectItem value="specialist">Chuyên viên</SelectItem>
                  <SelectItem value="staff">Nhân viên</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Không hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Công ty</TableHead>
                  <TableHead>Phòng ban</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tham gia</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${getRoleColor(user.role)} text-white`}
                      >
                        <span className="mr-1">{getRoleIcon(user.role)}</span>
                        {getRoleName(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-sm">{COMPANY_INFO[user.company]?.floor}</div>
                          <div className="text-xs text-muted-foreground">{user.company}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{getDepartmentName(user.department)}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === "active" ? "default" : "secondary"}>
                        {user.status === "active" ? "Hoạt động" : "Không hoạt động"}
                      </Badge>
                    </TableCell>
                    <TableCell>{typeof user.joinDate === 'string' ? user.joinDate : new Date(user.joinDate).toISOString().split('T')[0]}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => confirmDelete(user)}
                          disabled={user.id === currentUser?.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
              </DialogTitle>
              <DialogDescription>
                {editingUser
                  ? "Cập nhật thông tin người dùng"
                  : "Tạo tài khoản người dùng mới"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {(error || success) && (
                <Alert variant={success ? "default" : "destructive"}>
                  <AlertDescription>{success || error}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Họ và tên</Label>
                  <Input id="name" {...form.register("name")} />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                    disabled={!!editingUser}
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    Mật khẩu {editingUser && "(để trống nếu không đổi)"}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      {...form.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {form.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input id="phone" type="tel" {...form.register("phone")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Công ty</Label>
                  <Select
                    value={form.watch("company")}
                    onValueChange={(value) => {
                      const company = value as Company;
                      form.setValue("company", company);
                      setAvailableDepartments(COMPANY_INFO[company].departments);
                      if (COMPANY_INFO[company].departments.length > 0) {
                        form.setValue("department", COMPANY_INFO[company].departments[0]);
                      }
                    }}
                  >
                    <SelectTrigger id="company">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WIS_GROUP">WIS Group</SelectItem>
                      <SelectItem value="WCERT">WCERT - Tầng 5</SelectItem>
                      <SelectItem value="SCT_VIET">SCT VIET - Tầng 3</SelectItem>
                      <SelectItem value="ICT_VIET">ICT VIET - Tầng 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Phòng ban</Label>
                  <Select
                    value={form.watch("department")}
                    onValueChange={(value) => form.setValue("department", value)}
                  >
                    <SelectTrigger id="department">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDepartments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {DEPARTMENT_INFO[dept]?.name || dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Vai trò</Label>
                  <Select
                    value={form.watch("role")}
                    onValueChange={(value) => form.setValue("role", value)}
                  >
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="group_ceo">Tổng Giám đốc</SelectItem>
                      <SelectItem value="group_director">Giám đốc điều hành</SelectItem>
                      <SelectItem value="group_admin">Quản trị hệ thống</SelectItem>
                      <SelectItem value="company_ceo">Giám đốc công ty</SelectItem>
                      <SelectItem value="company_deputy">Phó giám đốc</SelectItem>
                      <SelectItem value="dept_manager">Trưởng phòng</SelectItem>
                      <SelectItem value="dept_deputy">Phó phòng</SelectItem>
                      <SelectItem value="team_leader">Trưởng nhóm</SelectItem>
                      <SelectItem value="senior_specialist">Chuyên viên cao cấp</SelectItem>
                      <SelectItem value="specialist">Chuyên viên</SelectItem>
                      <SelectItem value="staff">Nhân viên</SelectItem>
                      <SelectItem value="intern">Thực tập sinh</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit">
                  {editingUser ? "Cập nhật" : "Tạo mới"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa người dùng</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa người dùng{" "}
                <strong>{deletingUser?.name}</strong>? Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/users")({
  component: UsersPage,
});
