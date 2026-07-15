import { createFileRoute } from "@tanstack/react-router";
import { Target } from "lucide-react";
import { OperationalCrudPage, type OperationalModuleConfig } from "@/components/business/OperationalCrudPage";

export const Route = createFileRoute("/kpi")({
  head: () => ({ meta: [{ title: "Quản lý KPI - WIS" }] }),
  component: KpiPage,
});

const config: OperationalModuleConfig = {
  resource: "kpis", detailModule: "kpi", title: "Quản lý KPI",
  subtitle: "Giao chỉ tiêu và theo dõi kết quả theo nhân sự, phòng ban và kỳ đánh giá",
  createLabel: "Tạo KPI", icon: Target, managePermission: "manage_kpi",
  emptyItem: () => ({ id: crypto.randomUUID(), code: "", title: "", owner: "", department: "", line: "", period: "", target: 100, actual: 0, progress: 0, status: "active", description: "" }),
  fields: [
    { key: "code", label: "Mã KPI", required: true }, { key: "title", label: "Tên chỉ tiêu", required: true },
    { key: "owner", label: "Nhân sự phụ trách", required: true }, { key: "department", label: "Phòng ban", required: true },
    { key: "line", label: "Line", type: "select", required: true, options: ["Line 1", "Line 2", "Line 3"].map(value => ({ value, label: value })) },
    { key: "period", label: "Kỳ đánh giá", required: true, placeholder: "Ví dụ: 07/2026" },
    { key: "target", label: "Mục tiêu", type: "number", min: 0, required: true },
    { key: "actual", label: "Thực hiện", type: "number", min: 0, required: true },
    { key: "progress", label: "Tỷ lệ hoàn thành (%)", type: "number", min: 0, max: 100 },
    { key: "status", label: "Trạng thái", type: "select", required: true, options: [{ value: "active", label: "Đang thực hiện" }, { value: "completed", label: "Hoàn thành" }, { value: "overdue", label: "Quá hạn" }] },
    { key: "description", label: "Ghi chú", type: "textarea" },
  ],
  columns: [{ key: "code", label: "Mã" }, { key: "title", label: "Chỉ tiêu" }, { key: "owner", label: "Phụ trách" }, { key: "department", label: "Phòng ban" }, { key: "period", label: "Kỳ" }, { key: "progress", label: "Tiến độ", kind: "progress" }, { key: "status", label: "Trạng thái", kind: "status" }],
  searchPlaceholder: "Tìm mã, chỉ tiêu, nhân sự, phòng ban...",
};

function KpiPage() { return <OperationalCrudPage config={config} />; }
