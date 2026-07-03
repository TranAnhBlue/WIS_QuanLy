import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate({ to: "/" });
    return null;
  }

  const onSubmit = async (data: LoginForm) => {
    setError("");
    setIsLoading(true);

    try {
      const result = await login(data.email, data.password);

      if (result.success) {
        navigate({ to: "/" });
      } else {
        setError(result.error || "Đăng nhập thất bại");
      }
    } catch (err) {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <LogIn className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl text-center">Đăng nhập WIS</CardTitle>
          <CardDescription className="text-center">
            Nhập email và mật khẩu để truy cập hệ thống
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
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

            {/* Demo accounts info */}
            <div className="rounded-lg border border-border bg-muted/50 p-3 text-xs space-y-1">
              <p className="font-semibold text-foreground mb-2">Tài khoản demo:</p>
              <p className="text-muted-foreground">
                <span className="font-medium">Admin:</span> admin@wis.vn / admin123
              </p>
              <p className="text-muted-foreground">
                <span className="font-medium">CEO:</span> ceo@wis.vn / ceo123
              </p>
              <p className="text-muted-foreground">
                <span className="font-medium">Manager:</span> manager@wis.vn / manager123
              </p>
              <p className="text-muted-foreground">
                <span className="font-medium">Employee:</span> employee@wis.vn / employee123
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Chưa có tài khoản?{" "}
              <button
                type="button"
                onClick={() => navigate({ to: "/register" })}
                className="text-primary hover:underline"
                disabled={isLoading}
              >
                Đăng ký ngay
              </button>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export const Route = createFileRoute("/login")({
  component: LoginPage,
});
