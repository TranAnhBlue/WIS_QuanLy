import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User as UserIcon, Lock, Save, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const profileSchema = z.object({
  name: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().optional(),
  department: z.string().min(1, "Vui lòng nhập phòng ban"),
});

const passwordSchema = z.object({
  oldPassword: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

function ProfilePage() {
  const navigate = useNavigate();
  const { user, session, isAuthenticated, updateProfile, changePassword } = useAuth();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      department: user?.department || "",
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  if (!isAuthenticated || !user) {
    navigate({ to: "/login" });
    return null;
  }

  const onProfileSubmit = async (data: ProfileForm) => {
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const result = await updateProfile(data);

      if (result.success) {
        setSuccess("Cập nhật thông tin thành công!");
      } else {
        setError(result.error || "Cập nhật thất bại");
      }
    } catch (err) {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const result = await changePassword(data.oldPassword, data.newPassword);

      if (result.success) {
        setSuccess("Đổi mật khẩu thành công!");
        passwordForm.reset();
      } else {
        setError(result.error || "Đổi mật khẩu thất bại");
      }
    } catch (err) {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleName = (role: string) => {
    const roleNames: Record<string, string> = {
      admin: "Quản trị viên",
      ceo: "Tổng Giám Đốc",
      manager: "Quản lý",
      employee: "Nhân viên",
      guest: "Khách",
    };
    return roleNames[role] || role;
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
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/" })}
          >
            ← Quay lại
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Thông tin cá nhân</h1>
            <p className="text-muted-foreground">Quản lý thông tin và bảo mật tài khoản</p>
          </div>
        </div>

        {/* User Info Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="text-2xl">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="mt-2 flex gap-4 text-sm">
                  <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1">
                    <span className="h-2 w-2 rounded-full bg-primary"></span>
                    {getRoleName(user.role)}
                  </span>
                  <span className="rounded-full border px-3 py-1">{user.company}</span>
                  <span className="rounded-full border px-3 py-1">{user.department}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">
              <UserIcon className="mr-2 h-4 w-4" />
              Thông tin
            </TabsTrigger>
            <TabsTrigger value="security">
              <Lock className="mr-2 h-4 w-4" />
              Bảo mật
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin cá nhân</CardTitle>
                <CardDescription>
                  Cập nhật thông tin cá nhân của bạn
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  {(error || success) && (
                    <Alert variant={success ? "default" : "destructive"}>
                      <AlertDescription>{success || error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Họ và tên</Label>
                      <Input
                        id="name"
                        {...profileForm.register("name")}
                        disabled={isLoading}
                      />
                      {profileForm.formState.errors.name && (
                        <p className="text-sm text-destructive">
                          {profileForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        {...profileForm.register("email")}
                        disabled={isLoading}
                      />
                      {profileForm.formState.errors.email && (
                        <p className="text-sm text-destructive">
                          {profileForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Số điện thoại</Label>
                      <Input
                        id="phone"
                        type="tel"
                        {...profileForm.register("phone")}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="department">Phòng ban</Label>
                      <Input
                        id="department"
                        {...profileForm.register("department")}
                        disabled={isLoading}
                      />
                      {profileForm.formState.errors.department && (
                        <p className="text-sm text-destructive">
                          {profileForm.formState.errors.department.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Công ty</Label>
                      <Input value={user.company} disabled />
                    </div>

                    <div className="space-y-2">
                      <Label>Vai trò</Label>
                      <Input value={getRoleName(user.role)} disabled />
                    </div>

                    <div className="space-y-2">
                      <Label>Ngày tham gia</Label>
                      <Input value={user.joinDate} disabled />
                    </div>

                    <div className="space-y-2">
                      <Label>Trạng thái</Label>
                      <Input
                        value={user.status === "active" ? "Hoạt động" : "Không hoạt động"}
                        disabled
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading}>
                      <Save className="mr-2 h-4 w-4" />
                      {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Đổi mật khẩu</CardTitle>
                <CardDescription>
                  Cập nhật mật khẩu để bảo mật tài khoản
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  {(error || success) && (
                    <Alert variant={success ? "default" : "destructive"}>
                      <AlertDescription>{success || error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="oldPassword">Mật khẩu hiện tại</Label>
                    <div className="relative">
                      <Input
                        id="oldPassword"
                        type={showPasswords.old ? "text" : "password"}
                        {...passwordForm.register("oldPassword")}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, old: !prev.old }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords.old ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordForm.formState.errors.oldPassword && (
                      <p className="text-sm text-destructive">
                        {passwordForm.formState.errors.oldPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Mật khẩu mới</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPasswords.new ? "text" : "password"}
                        {...passwordForm.register("newPassword")}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-sm text-destructive">
                        {passwordForm.formState.errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showPasswords.confirm ? "text" : "password"}
                        {...passwordForm.register("confirmPassword")}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">
                        {passwordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading}>
                      <Lock className="mr-2 h-4 w-4" />
                      {isLoading ? "Đang cập nhật..." : "Đổi mật khẩu"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});
