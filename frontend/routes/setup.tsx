import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RefreshCw, CheckCircle2, AlertCircle, Copy, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/backend-api";

type User = {
  id: string; email: string; password: string; name: string; role: string;
  company: string; department: string; phone?: string; avatar?: string;
  joinDate?: string; status: "active" | "inactive"; createdAt?: string; updatedAt?: string;
};

export const Route = createFileRoute("/setup")({
  head: () => ({ meta: [{ title: "Thiết lập - WIS" }] }),
  component: SetupPage,
});

// Demo users - same as in auth.ts
const DEMO_USERS: Omit<User, "createdAt" | "updatedAt">[] = [
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
  },
  // WCERT
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
  },
  // SCT VIET
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
  },
  // ICT VIET
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
  },
];

function SetupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const [currentUsers, setCurrentUsers] = useState<User[]>([]);

  useEffect(() => {
    apiRequest<{ users: User[] }>("/api/users").then((r) => setCurrentUsers(r.users)).catch(() => setCurrentUsers([]));
  }, []);

  const handleReset = async () => {
    setLoading(true);
    setSuccess(false);
    setError("");

    try {
      const existing = new Set(currentUsers.map((u) => u.email));
      for (const user of DEMO_USERS.filter((u) => !existing.has(u.email))) {
        await apiRequest("/api/users", {
          method: "POST",
          body: JSON.stringify({ ...user, username: user.email.split("@")[0] }),
        });
      }
      const refreshed = await apiRequest<{ users: User[] }>("/api/users");
      setCurrentUsers(refreshed.users);
      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setError("Có lỗi xảy ra khi reset dữ liệu");
      setLoading(false);
    }
  };

  const copyCredentials = (email: string, password: string) => {
    const text = `${email} / ${password}`;
    navigator.clipboard.writeText(text);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const goToLogin = () => {
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <RefreshCw className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Thiết lập Dữ liệu Demo</h1>
          <p className="text-muted-foreground">
            Reset dữ liệu và khởi tạo lại 15 tài khoản demo
          </p>
        </div>

        {/* Status */}
        {success && (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-500">
              Đã reset dữ liệu thành công! Có {DEMO_USERS.length} tài khoản demo sẵn sàng.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle>Trạng thái hiện tại</CardTitle>
            <CardDescription>Số lượng người dùng trong hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{currentUsers.length}</div>
                <div className="text-sm text-muted-foreground">người dùng</div>
              </div>
              <Button onClick={handleReset} disabled={loading}>
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Đang reset...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset dữ liệu demo
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Demo Accounts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>15 Tài khoản Demo</CardTitle>
                <CardDescription>Danh sách tài khoản có sẵn để đăng nhập</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPasswords(!showPasswords)}
              >
                {showPasswords ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Ẩn mật khẩu
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Hiện mật khẩu
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* WIS Group */}
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                  WIS GROUP - Tập đoàn
                </h3>
                <div className="space-y-2">
                  {DEMO_USERS.filter((u) => u.company === "WIS_GROUP").map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.email} {showPasswords && `/ ${user.password}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-500">
                          {user.role === "group_ceo" ? "Tổng GĐ" : "Admin"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyCredentials(user.email, user.password)}
                        >
                          {copiedEmail === user.email ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* WCERT */}
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                  WCERT - Tầng 5 (Chứng nhận ISO)
                </h3>
                <div className="space-y-2">
                  {DEMO_USERS.filter((u) => u.company === "WCERT").map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.email} {showPasswords && `/ ${user.password}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-500">
                          {user.role === "company_ceo"
                            ? "GĐ"
                            : user.role === "senior_specialist"
                            ? "Auditor"
                            : "Sales"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyCredentials(user.email, user.password)}
                        >
                          {copiedEmail === user.email ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SCT VIET */}
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                  SCT VIET - Tầng 3 (Khoa học & Công nghệ)
                </h3>
                <div className="space-y-2">
                  {DEMO_USERS.filter((u) => u.company === "SCT_VIET").map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.email} {showPasswords && `/ ${user.password}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded bg-purple-500/10 text-purple-500">
                          {user.role === "company_ceo"
                            ? "GĐ"
                            : user.role === "dept_manager"
                            ? "Trưởng phòng"
                            : user.department === "SCT_SCIENCE"
                            ? "Khoa học"
                            : user.role === "senior_specialist"
                            ? "Chuyên viên"
                            : "Đào tạo"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyCredentials(user.email, user.password)}
                        >
                          {copiedEmail === user.email ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ICT VIET */}
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                  ICT VIET - Tầng 2 (Du lịch & VietGAP)
                </h3>
                <div className="space-y-2">
                  {DEMO_USERS.filter((u) => u.company === "ICT_VIET").map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.email} {showPasswords && `/ ${user.password}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded bg-orange-500/10 text-orange-500">
                          {user.role === "company_ceo"
                            ? "GĐ"
                            : user.department === "ICT_TOURISM"
                            ? "Du lịch"
                            : "VietGAP"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyCredentials(user.email, user.password)}
                        >
                          {copiedEmail === user.email ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={goToLogin}>
            Quay lại đăng nhập
          </Button>
          {success && (
            <Button onClick={goToLogin}>
              Đăng nhập ngay
            </Button>
          )}
        </div>

        {/* Note */}
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="font-medium">Lưu ý quan trọng:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Dữ liệu được lưu an toàn trên <strong>máy chủ hệ thống</strong></li>
                  <li>Xóa cache trình duyệt không làm mất dữ liệu hệ thống</li>
                  <li>Mật khẩu được backend băm bằng <strong>bcrypt</strong></li>
                  <li>Chỉ quản trị viên hệ thống mới có quyền khởi tạo tài khoản</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
