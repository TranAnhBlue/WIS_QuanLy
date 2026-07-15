import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { OperationalCrudPage, type OperationalModuleConfig } from "@/components/business/OperationalCrudPage";

export const Route = createFileRoute("/settings")({ head: () => ({ meta: [{ title: "Thiết lập - WIS" }] }), component: SettingsPage });
const config: OperationalModuleConfig = {
  resource: "settings", detailModule: "settings", title: "Thiết lập hệ thống",
  subtitle: "Quản lý cấu hình thật lưu trong MongoDB",
  createLabel: "Thêm thiết lập", icon: Settings, managePermission: "manage_settings",
  emptyItem: () => ({ id: crypto.randomUUID(), code: "", title: "", key: "", label: "", value: "", group: "general", status: "active", description: "" }),
  fields: [
    { key: "key", label: "Khóa cấu hình", required: true }, { key: "label", label: "Tên hiển thị", required: true },
    { key: "value", label: "Giá trị", required: true }, { key: "group", label: "Nhóm", type: "select", required: true, options: [{ value: "general", label: "Chung" }, { value: "attendance", label: "Chấm công" }, { value: "notifications", label: "Thông báo" }, { value: "uploads", label: "Tải file" }] },
    { key: "status", label: "Trạng thái", type: "select", options: [{ value: "active", label: "Đang áp dụng" }, { value: "suspended", label: "Tạm dừng" }] },
    { key: "description", label: "Mô tả", type: "textarea" },
  ],
  columns: [{ key: "key", label: "Khóa" }, { key: "label", label: "Thiết lập" }, { key: "value", label: "Giá trị" }, { key: "group", label: "Nhóm" }, { key: "status", label: "Trạng thái", kind: "status" }],
  searchPlaceholder: "Tìm khóa hoặc tên thiết lập...",
};
function SettingsPage() { return <OperationalCrudPage config={config} />; }
