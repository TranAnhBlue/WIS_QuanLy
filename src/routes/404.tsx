import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FileQuestion, Home, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/404")({
  component: NotFoundPage,
});

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center">
          {/* Icon */}
          <div className="mx-auto w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-6">
            <FileQuestion className="w-10 h-10 text-blue-600 dark:text-blue-500" />
          </div>

          {/* Error Code */}
          <div className="text-6xl font-bold text-blue-600 dark:text-blue-500 mb-2">
            404
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold mb-3">
            Không tìm thấy trang
          </h1>

          {/* Description */}
          <p className="text-muted-foreground mb-6">
            Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển. Vui lòng kiểm tra lại đường dẫn.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate({ to: -1 as any })}
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

          {/* Search Suggestion */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 mb-3">
              <Search className="w-4 h-4" />
              <strong>Các trang phổ biến:</strong>
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: "/" })}
              >
                Dashboard
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: "/attendance" })}
              >
                Chấm công
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: "/profile" })}
              >
                Hồ sơ
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
