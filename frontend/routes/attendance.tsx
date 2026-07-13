import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Clock, CheckCircle2, AlertCircle, LogIn, LogOut, Calendar, ArrowLeft } from "lucide-react";
import { message } from "antd";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/attendance")({
  component: AttendancePage,
});

interface AttendanceRecord {
  _id: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: "present" | "absent" | "late" | "early_leave" | "half_day";
  workingHours: number;
}

interface TodayAttendance {
  _id: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: string;
  workingHours: number;
}

function AttendancePage() {
  const navigate = useNavigate();
  const { session, user, isAuthenticated, isLoading } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Load today's attendance
  useEffect(() => {
    if (isAuthenticated && session?.token) {
      loadTodayAttendance();
      loadAttendanceHistory();
    }
  }, [isAuthenticated, session?.token]);

  const loadTodayAttendance = async () => {
    try {
      const API_BASE = "http://localhost:5000";
      const response = await fetch(`${API_BASE}/api/attendance/today`, {
        headers: {
          Authorization: `Bearer ${session?.token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setTodayAttendance(data.attendance);
      }
    } catch (error) {
      console.error("Error loading today's attendance:", error);
    }
  };

  const loadAttendanceHistory = async () => {
    try {
      const API_BASE = "http://localhost:5000";
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const response = await fetch(
        `${API_BASE}/api/attendance/history?month=${month}&year=${year}`,
        {
          headers: {
            Authorization: `Bearer ${session?.token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setAttendanceHistory(data.attendance);
      }
    } catch (error) {
      console.error("Error loading attendance history:", error);
    }
  };

  const handleCheckIn = async () => {
    try {
      setLoading(true);
      const API_BASE = "http://localhost:5000";
      const response = await fetch(`${API_BASE}/api/attendance/check-in`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        message.success("✓ Chấm công vào thành công!");
        setTodayAttendance(data.attendance);
      } else {
        message.error(data.message || "Chấm công vào thất bại");
      }
    } catch (error) {
      console.error("Check-in error:", error);
      message.error("Lỗi chấm công vào");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setLoading(true);
      const API_BASE = "http://localhost:5000";
      const response = await fetch(`${API_BASE}/api/attendance/check-out`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        message.success("✓ Chấm công ra thành công!");
        setTodayAttendance(data.attendance);
      } else {
        message.error(data.message || "Chấm công ra thất bại");
      }
    } catch (error) {
      console.error("Check-out error:", error);
      message.error("Lỗi chấm công ra");
    } finally {
      setLoading(false);
    }
  };

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

  if (!isAuthenticated || !user) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-500";
      case "late":
        return "bg-yellow-500";
      case "early_leave":
        return "bg-orange-500";
      case "absent":
        return "bg-red-500";
      case "half_day":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "present":
        return "Có mặt";
      case "late":
        return "Đi muộn";
      case "early_leave":
        return "Về sớm";
      case "absent":
        return "Vắng mặt";
      case "half_day":
        return "Nửa ngày";
      default:
        return status;
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "Chưa";
    const date = new Date(timeString);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate({ to: "/" })}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Clock className="h-8 w-8" />
              Chấm công
            </h1>
            <p className="text-muted-foreground">Chấm công vào/ra hàng ngày</p>
          </div>
        </div>

        {/* Today's Check-in/Check-out Card */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle>Hôm nay - {formatDate(new Date().toISOString())}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Badge */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Trạng thái:</span>
              <Badge className={`${getStatusColor(todayAttendance?.status || "absent")} text-white`}>
                {getStatusLabel(todayAttendance?.status || "absent")}
              </Badge>
            </div>

            {/* Check-in/Check-out Times */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Check-in Time */}
              <div className="p-4 rounded-lg bg-surface border border-border">
                <div className="text-xs text-muted-foreground mb-2">Giờ vào</div>
                <div className="text-2xl font-bold font-mono text-primary">
                  {formatTime(todayAttendance?.checkInTime)}
                </div>
              </div>

              {/* Check-out Time */}
              <div className="p-4 rounded-lg bg-surface border border-border">
                <div className="text-xs text-muted-foreground mb-2">Giờ ra</div>
                <div className="text-2xl font-bold font-mono text-primary">
                  {formatTime(todayAttendance?.checkOutTime)}
                </div>
              </div>

              {/* Working Hours */}
              <div className="p-4 rounded-lg bg-surface border border-border">
                <div className="text-xs text-muted-foreground mb-2">Giờ làm việc</div>
                <div className="text-2xl font-bold font-mono text-success">
                  {todayAttendance?.workingHours || 0}h
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                size="lg"
                onClick={handleCheckIn}
                disabled={!!todayAttendance?.checkInTime || loading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <LogIn className="mr-2 h-5 w-5" />
                {todayAttendance?.checkInTime ? "✓ Đã chấm công vào" : "Chấm công vào"}
              </Button>

              <Button
                size="lg"
                onClick={handleCheckOut}
                disabled={!todayAttendance?.checkInTime || !!todayAttendance?.checkOutTime || loading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <LogOut className="mr-2 h-5 w-5" />
                {todayAttendance?.checkOutTime ? "✓ Đã chấm công ra" : "Chấm công ra"}
              </Button>
            </div>

            {!todayAttendance?.checkInTime && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-800">
                  Hãy chấm công vào khi bạn đến công ty
                </p>
              </div>
            )}

            {todayAttendance?.checkInTime && !todayAttendance?.checkOutTime && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                <p className="text-sm text-yellow-800">
                  Nhớ chấm công ra khi bạn rời công ty
                </p>
              </div>
            )}

            {todayAttendance?.checkOutTime && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <p className="text-sm text-green-800">
                  Chấm công hôm nay hoàn tất. Tổng giờ làm: {todayAttendance?.workingHours}h
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Lịch sử chấm công
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">
                Không có dữ liệu chấm công
              </p>
            ) : (
              <div className="space-y-2">
                {attendanceHistory.map((record) => (
                  <div
                    key={record._id}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border hover:bg-surface/80 transition"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{formatDate(record.date)}</div>
                      <div className="text-sm text-muted-foreground">
                        Vào: {formatTime(record.checkInTime)} | Ra: {formatTime(record.checkOutTime)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-mono font-semibold">{record.workingHours}h</div>
                        <div className="text-xs text-muted-foreground">Giờ làm</div>
                      </div>
                      <Badge className={`${getStatusColor(record.status)} text-white`}>
                        {getStatusLabel(record.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
