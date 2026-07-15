import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { OperationalCrudPage, type OperationalModuleConfig } from "@/components/business/OperationalCrudPage";

export const Route = createFileRoute("/training")({
  head: () => ({ meta: [{ title: "Đào tạo - WIS" }, { name: "description", content: "Quản lý khóa học và nội dung đào tạo." }] }),
  component: TrainingPage,
});

const config: OperationalModuleConfig = {
  resource: "trainings", detailModule: "training", title: "Quản lý đào tạo",
  subtitle: "Khóa học, học viên, tiến độ và bài giảng được lưu trong MongoDB",
  createLabel: "Tạo khóa học", icon: GraduationCap, managePermission: "manage_training",
  emptyItem: () => ({ id: crypto.randomUUID(), code: "", title: "", category: "internal", company: "", instructor: "", startDate: "", duration: "", enrolled: 0, capacity: 0, progress: 0, status: "draft", format: "Offline", price: 0, rating: 0, description: "" }),
  fields: [
    { key: "code", label: "Mã khóa học", required: true }, { key: "title", label: "Tên khóa học", required: true },
    { key: "category", label: "Loại khóa", type: "select", required: true, options: [{ value: "internal", label: "Nội bộ" }, { value: "external", label: "Khách hàng" }, { value: "certification", label: "Chứng nhận" }, { value: "compliance", label: "Tuân thủ" }] },
    { key: "company", label: "Đơn vị", type: "select", required: true, options: ["Tập đoàn", "Line 1", "Line 2", "Line 3"].map(value => ({ value, label: value })) },
    { key: "instructor", label: "Giảng viên", required: true }, { key: "startDate", label: "Ngày bắt đầu", type: "date", required: true },
    { key: "duration", label: "Thời lượng", required: true }, { key: "format", label: "Hình thức", type: "select", required: true, options: ["Online", "Offline", "Hybrid"].map(value => ({ value, label: value })) },
    { key: "capacity", label: "Sức chứa", type: "number", min: 0, required: true }, { key: "enrolled", label: "Đã đăng ký", type: "number", min: 0 },
    { key: "progress", label: "Tiến độ (%)", type: "number", min: 0, max: 100 }, { key: "price", label: "Học phí", type: "money", min: 0 },
    { key: "rating", label: "Đánh giá", type: "number", min: 0, max: 5 },
    { key: "status", label: "Trạng thái", type: "select", required: true, options: [{ value: "draft", label: "Bản nháp" }, { value: "active", label: "Mở đăng ký" }, { value: "in_progress", label: "Đang diễn ra" }, { value: "completed", label: "Hoàn thành" }] },
    { key: "description", label: "Mô tả", type: "textarea" },
  ],
  columns: [{ key: "code", label: "Mã" }, { key: "title", label: "Khóa học" }, { key: "company", label: "Đơn vị" }, { key: "instructor", label: "Giảng viên" }, { key: "startDate", label: "Khai giảng", kind: "date" }, { key: "progress", label: "Tiến độ", kind: "progress" }, { key: "status", label: "Trạng thái", kind: "status" }],
  searchPlaceholder: "Tìm mã, khóa học hoặc giảng viên...",
};

function TrainingPage() { return <OperationalCrudPage config={config} />; }
