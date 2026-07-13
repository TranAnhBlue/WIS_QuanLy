import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldAlert, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/403")({
  component: ForbiddenPage,
});

function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center">
          {/* Icon */}
          <div className="mx-auto w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-6">
            <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-500" />
          </div>

          {/* Error Code */}
          <div className="text-6xl font-bold text-red-600 dark:text-red-500 mb-2">
            403
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold mb-3">
            Truy cập bị từ chối
          </h1>

          {/* Description */}
          <p className="text-muted-foreground mb-6">
            Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là lỗi.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </Button>
            <Button
              onClick={() => navigate({ to: "/" })}
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Về trang chủ
            </Button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              <strong>Lý do có thể:</strong>
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• Vai trò của bạn không có quyền truy cập</li>
              <li>• Tính năng chỉ dành cho quản lý cấp cao</li>
              <li>• Tài khoản của bạn chưa được kích hoạt đầy đủ</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
