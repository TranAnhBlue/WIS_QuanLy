import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const registerSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  confirmPassword: z.string(),
  name: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
  company: z.string().min(1, "Vui lòng chọn công ty"),
  department: z.string().min(1, "Vui lòng nhập phòng ban"),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      company: "",
      department: "",
      phone: "",
    },
  });

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate({ to: "/" });
    return null;
  }

  const onSubmit = async (data: RegisterForm) => {
    setError("");
    setSuccess(false);
    setIsLoading(true);

    try {
      const result = await registerUser({
        email: data.email,
        password: data.password,
        name: data.name,
        role: "employee", // Default role for new registrations
        company: data.company,
        department: data.department,
        phone: data.phone,
        joinDate: new Date().toISOString().split("T")[0],
        status: "active",
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate({ to: "/login" });
        }, 2000);
      } else {
        setError(result.error || "Đăng ký thất bại");
      }
    } catch (err) {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <UserPlus className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl text-center">Đăng ký tài khoản</CardTitle>
          <CardDescription className="text-center">
            Tạo tài khoản mới để sử dụng hệ thống WIS
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-500 bg-green-50 text-green-900">
                <AlertDescription>
                  Đăng ký thành công! Đang chuyển đến trang đăng nhập...
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Họ và tên</Label>
                <Input
                  id="name"
                  placeholder="Nguyễn Văn A"
                  {...register("name")}
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  {...register("email")}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("password")}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("confirmPassword")}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Công ty</Label>
                <Select onValueChange={(value) => setValue("company", value)} disabled={isLoading}>
                  <SelectTrigger id="company">
                    <SelectValue placeholder="Chọn công ty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WIS Group">WIS Group</SelectItem>
                    <SelectItem value="SCT">SCT</SelectItem>
                    <SelectItem value="Green Tech">Green Tech</SelectItem>
                    <SelectItem value="Eco Solutions">Eco Solutions</SelectItem>
                  </SelectContent>
                </Select>
                {errors.company && (
                  <p className="text-sm text-destructive">{errors.company.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Phòng ban</Label>
                <Input
                  id="department"
                  placeholder="IT, Sales, Marketing..."
                  {...register("department")}
                  disabled={isLoading}
                />
                {errors.department && (
                  <p className="text-sm text-destructive">{errors.department.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="phone">Số điện thoại (không bắt buộc)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0900000000"
                  {...register("phone")}
                  disabled={isLoading}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isLoading || success}>
              {isLoading ? "Đang đăng ký..." : "Đăng ký"}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Đã có tài khoản?{" "}
              <button
                type="button"
                onClick={() => navigate({ to: "/login" })}
                className="text-primary hover:underline"
                disabled={isLoading}
              >
                Đăng nhập ngay
              </button>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});
