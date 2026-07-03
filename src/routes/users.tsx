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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { User, UserRole } from "@/lib/auth";
import { getAllUsers, saveUsers, deleteUser as deleteUserUtil } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const userSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự").optional(),
  name: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
  role: z.enum(["admin", "ceo", "manager", "employee", "guest"]),
  company: z.string().min(1, "Vui lòng nhập công ty"),
  department: z.string().min(1, "Vui lòng nhập phòng ban"),
  phone: z.string().optional(),
  status: z.enum(["active", "inactive"]),
});

type UserForm = z.infer<typeof userSchema>;

function UsersPage() {
  const navigate = useNavigate();
  const { session, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      role: "employee",
      company: "WIS Group",
      department: "",
      phone: "",
      status: "active",
    },
  });

  // Check permission
  if (!isAuthenticated || !session || session.role !== "admin") {
    navigate({ to: "/" });
    return null;
  }

  // Load users
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const allUsers = getAllUsers();
    setUsers(allUsers);
  };

  const filtered = useMemo(() => {
    return users.filter((user) => {
      const matchSearch =
        search === "" ||
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.department.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === "all" || user.role === roleFilter;
      const matchStatus = statusFilter === "all" || user.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => u.status === "active").length,
      admin: users.filter((u) => u.role === "admin").length,
      ceo: users.filter((u) => u.role === "ceo").length,
      manager: users.filter((u) => u.role === "manager").length,
      employee: users.filter((u) => u.role === "employee").length,
    };
  }, [users]);

  const openCreate = () => {
    setEditingUser(null);
    form.reset({
      email: "",
      password: "",
      name: "",
      role: "employee",
      company: "WIS Group",
      department: "",
      phone: "",
      status: "active",
    });
    setError("");
    setSuccess("");
    setDialogOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
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

  const onSubmit = (data: UserForm) => {
    setError("");
    setSuccess("");

    try {
      const allUsers = getAllUsers();

      if (editingUser) {
        // Update existing user
        const index = allUsers.findIndex((u) => u.id === editingUser.id);
        if (index !== -1) {
          const updatedUser: User = {
            ...allUsers[index],
            ...data,
            // Only update password if provided
            password: data.password || allUsers[index].password,
            updatedAt: new Date().toISOString(),
          };
          allUsers[index] = updatedUser;
          saveUsers(allUsers);
          setSuccess("Cập nhật người dùng thành công!");
          loadUsers();
          setTimeout(() => setDialogOpen(false), 1000);
        }
      } else {
        // Create new user
        const emailExists = allUsers.some(
          (u) => u.email.toLowerCase() === data.email.toLowerCase()
        );
        if (emailExists) {
          setError("Email đã được sử dụng");
          return;
        }

        if (!data.password) {
          setError("Vui lòng nhập mật khẩu");
          return;
        }

        const newUser: User = {
          id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          email: data.email,
          password: data.password,
          name: data.name,
          role: data.role,
          company: data.company,
          department: data.department,
          phone: data.phone,
          joinDate: new Date().toISOString().split("T")[0],
          status: data.status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        allUsers.push(newUser);
        saveUsers(allUsers);
        setSuccess("Tạo người dùng thành công!");
        loadUsers();
        setTimeout(() => setDialogOpen(false), 1000);
      }
    } catch (err) {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
    }
  };

  const confirmDelete = (user: User) => {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (!deletingUser) return;

    // Prevent deleting self
    if (deletingUser.id === session.userId) {
      alert("Không thể xóa tài khoản đang đăng nhập");
      return;
    }

    const success = deleteUserUtil(deletingUser.id);
    if (success) {
      loadUsers();
      setDeleteDialogOpen(false);
      setDeletingUser(null);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "admin":
        return <ShieldCheck className="h-4 w-4" />;
      case "ceo":
        return <Crown className="h-4 w-4" />;
      case "manager":
        return <Shield className="h-4 w-4" />;
      default:
        return <UserIcon className="h-4 w-4" />;
    }
  };

  const getRoleName = (role: UserRole) => {
    const names: Record<UserRole, string> = {
      admin: "Admin",
      ceo: "CEO",
      manager: "Manager",
      employee: "Employee",
      guest: "Guest",
    };
    return names[role];
  };

  const getRoleColor = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      admin: "bg-red-500",
      ceo: "bg-purple-500",
      manager: "bg-blue-500",
      employee: "bg-green-500",
      guest: "bg-gray-500",
    };
    return colors[role];
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Admin</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.admin}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">CEO</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.ceo}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Manager</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.manager}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Employee</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.employee}</div>
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
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả vai trò</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="ceo">CEO</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="guest">Guest</SelectItem>
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
                    <TableCell>{user.company}</TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === "active" ? "default" : "secondary"}>
                        {user.status === "active" ? "Hoạt động" : "Không hoạt động"}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.joinDate}</TableCell>
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
                          disabled={user.id === session.userId}
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
                  <Label htmlFor="role">Vai trò</Label>
                  <Select
                    value={form.watch("role")}
                    onValueChange={(value) => form.setValue("role", value as UserRole)}
                  >
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="ceo">CEO</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="guest">Guest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Trạng thái</Label>
                  <Select
                    value={form.watch("status")}
                    onValueChange={(value) => form.setValue("status", value as "active" | "inactive")}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Hoạt động</SelectItem>
                      <SelectItem value="inactive">Không hoạt động</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Công ty</Label>
                  <Input id="company" {...form.register("company")} />
                  {form.formState.errors.company && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.company.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Phòng ban</Label>
                  <Input id="department" {...form.register("department")} />
                  {form.formState.errors.department && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.department.message}
                    </p>
                  )}
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
