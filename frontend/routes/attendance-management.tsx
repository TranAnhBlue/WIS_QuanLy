import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  Clock, ArrowLeft, Calendar, Download, Filter, Users, 
  CheckCircle2, XCircle, AlertTriangle, AlertCircle 
} from "lucide-react";
import { message, Select } from "antd";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppDatePicker } from "@/components/ui/app-date-picker";

export const Route = createFileRoute("/attendance-management")({
  component: AttendanceManagementPage,
});

interface AttendanceRecord {
  _id?: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    role: string;
    company: string;
    department: string;
  };
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: "present" | "absent" | "late" | "early_leave";
  workingHours: number;
}

interface AttendanceStats {
  total: number;
  present: number;
  late: number;
  early_leave: number;
  absent: number;
}

function AttendanceManagementPage() {
  const navigate = useNavigate();
  const { session, user, isAuthenticated, isLoading } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Redirect if not authorized
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: "/login" });
      return;
    }

    if (user && !['group_admin', 'group_ceo', 'group_director', 'company_ceo', 'company_deputy', 'dept_manager'].includes(user.role)) {
      navigate({ to: "/403" });
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  // Load attendance data
  useEffect(() => {
    if (isAuthenticated && session?.token) {
      loadAttendanceData();
    }
  }, [isAuthenticated, session?.token, selectedDate]);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      const API_BASE = "http://localhost:5000";
      const response = await fetch(
        `${API_BASE}/api/attendance/all?date=${selectedDate}`,
        {
          headers: {
            Authorization: `Bearer ${session?.token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setAttendanceRecords(data.attendance);
        setStats(data.stats);
      } else {
        message.error(data.message || "Không thể tải dữ liệu");
      }
    } catch (error) {
      console.error("Error loading attendance data:", error);
      message.error("Lỗi khi tải dữ liệu chấm công");
    } finally {
      setLoading(false);
    }
  };

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
      default:
        return status;
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "—";
    const date = new Date(timeString);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const exportToCSV = () => {
    const headers = ["Họ tên", "Email", "Vai trò", "Công ty", "Phòng ban", "Giờ vào", "Giờ ra", "Giờ làm", "Trạng thái"];
    const rows = filteredRecords
      .filter(record => record.userId) // Filter out records with null userId
      .map(record => [
        record.userId.name,
        record.userId.email,
        record.userId.role,
        record.userId.company,
        record.userId.department,
        formatTime(record.checkInTime),
        formatTime(record.checkOutTime),
        `${record.workingHours}h`,
        getStatusLabel(record.status),
      ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `attendance_${selectedDate}.csv`;
    link.click();
  };

  const filteredRecords = filterStatus === "all" 
    ? attendanceRecords 
    : attendanceRecords.filter(r => r.status === filterStatus);

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

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
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
              <Users className="h-8 w-8" />
              Quản lý chấm công
            </h1>
            <p className="text-muted-foreground">Theo dõi chấm công của nhân viên</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="w-44">
                  <AppDatePicker
                    value={selectedDate}
                    outputFormat="YYYY-MM-DD"
                    onChange={(date) => date && setSelectedDate(date)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={filterStatus}
                  onChange={setFilterStatus}
                  style={{ width: 150 }}
                  options={[
                    { label: "Tất cả", value: "all" },
                    { label: "Có mặt", value: "present" },
                    { label: "Đi muộn", value: "late" },
                    { label: "Về sớm", value: "early_leave" },
                    { label: "Vắng mặt", value: "absent" },
                  ]}
                />
              </div>

              <div className="ml-auto">
                <Button onClick={exportToCSV} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Xuất CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Tổng số</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                <div className="text-sm text-muted-foreground">Có mặt</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
                <div className="text-sm text-muted-foreground">Đi muộn</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <AlertCircle className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                <div className="text-2xl font-bold text-orange-600">{stats.early_leave}</div>
                <div className="text-sm text-muted-foreground">Về sớm</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <XCircle className="h-6 w-6 mx-auto mb-2 text-red-500" />
                <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                <div className="text-sm text-muted-foreground">Vắng mặt</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Attendance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Danh sách chấm công
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({filteredRecords.length} người)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Không có dữ liệu
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Họ tên</th>
                      <th className="text-left p-3 font-medium">Vai trò</th>
                      <th className="text-left p-3 font-medium">Công ty</th>
                      <th className="text-left p-3 font-medium">Giờ vào</th>
                      <th className="text-left p-3 font-medium">Giờ ra</th>
                      <th className="text-left p-3 font-medium">Giờ làm</th>
                      <th className="text-left p-3 font-medium">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords
                      .filter(record => record.userId) // Filter out records with null userId
                      .map((record, index) => (
                        <tr key={record._id || index} className="border-b hover:bg-surface/50">
                          <td className="p-3">
                            <div className="font-medium">{record.userId.name}</div>
                            <div className="text-sm text-muted-foreground">{record.userId.email}</div>
                          </td>
                          <td className="p-3 text-sm">{record.userId.role}</td>
                          <td className="p-3 text-sm">
                            <div>{record.userId.company}</div>
                            <div className="text-xs text-muted-foreground">{record.userId.department}</div>
                          </td>
                        <td className="p-3 font-mono text-sm">
                          {formatTime(record.checkInTime)}
                        </td>
                        <td className="p-3 font-mono text-sm">
                          {formatTime(record.checkOutTime)}
                        </td>
                        <td className="p-3 font-mono font-semibold text-sm">
                          {record.workingHours}h
                        </td>
                        <td className="p-3">
                          <Badge className={`${getStatusColor(record.status)} text-white`}>
                            {getStatusLabel(record.status)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
