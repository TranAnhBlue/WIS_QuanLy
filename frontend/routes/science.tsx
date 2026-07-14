import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";
import { OperationalCrudPage, type OperationalModuleConfig } from "@/components/business/OperationalCrudPage";

export const Route = createFileRoute("/science")({
  head: () => ({ meta: [{ title: "Nhiệm vụ KH - WIS" }, { name: "description", content: "Quản lý nhiệm vụ khoa học và công nghệ." }] }),
  component: SciencePage,
});

const STATUS_OPTIONS = [
  { value: "draft", label: "Bản nháp" }, { value: "planning", label: "Lập kế hoạch" },
  { value: "active", label: "Đang thực hiện" }, { value: "suspended", label: "Tạm dừng" },
  { value: "completed", label: "Hoàn thành" }, { value: "overdue", label: "Quá hạn" },
];

const config: OperationalModuleConfig = {
  resource: "science-missions",
  detailModule: "science",
  title: "Nhiệm vụ khoa học",
  subtitle: "Theo dõi đề tài, nhiệm vụ, kinh phí và tiến độ thực hiện",
  createLabel: "Tạo nhiệm vụ",
  icon: FlaskConical,
  managePermission: "manage_science_missions",
  searchPlaceholder: "Tìm mã, tên nhiệm vụ, chủ nhiệm...",
  emptyItem: () => ({ id: crypto.randomUUID(), code: "", title: "", topic: "", manager: "", leadAgency: "", startDate: "", endDate: "", budget: 0, progress: 0, status: "planning", description: "" }),
  dateRanges: [["startDate", "endDate"]],
  fields: [
    { key: "code", label: "Mã nhiệm vụ", required: true, placeholder: "VD: NVKH-2026-001" },
    { key: "title", label: "Tên nhiệm vụ", required: true, placeholder: "Tên đề tài/nhiệm vụ" },
    { key: "topic", label: "Lĩnh vực nghiên cứu", placeholder: "Nông nghiệp, môi trường..." },
    { key: "manager", label: "Chủ nhiệm nhiệm vụ", required: true },
    { key: "leadAgency", label: "Cơ quan chủ trì" },
    { key: "budget", label: "Kinh phí (VNĐ)", type: "money", min: 0 },
    { key: "startDate", label: "Ngày bắt đầu", type: "date", required: true },
    { key: "endDate", label: "Ngày kết thúc", type: "date", required: true },
    { key: "progress", label: "Tiến độ (%)", type: "number", min: 0, max: 100 },
    { key: "status", label: "Trạng thái", type: "select", required: true, options: STATUS_OPTIONS },
    { key: "description", label: "Mô tả và kết quả dự kiến", type: "textarea" },
  ],
  columns: [
    { key: "code", label: "Mã" }, { key: "title", label: "Nhiệm vụ" },
    { key: "manager", label: "Chủ nhiệm" }, { key: "endDate", label: "Hạn hoàn thành", kind: "date" },
    { key: "budget", label: "Kinh phí", kind: "money" }, { key: "progress", label: "Tiến độ", kind: "progress" },
    { key: "status", label: "Trạng thái", kind: "status" },
  ],
};

function SciencePage() { return <OperationalCrudPage config={config} />; }
