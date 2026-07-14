import { createFileRoute } from "@tanstack/react-router";
import { Leaf } from "lucide-react";
import { OperationalCrudPage, type OperationalModuleConfig } from "@/components/business/OperationalCrudPage";

export const Route = createFileRoute("/vietgap")({
  head: () => ({ meta: [{ title: "VietGAP - WIS" }, { name: "description", content: "Quản lý hồ sơ tư vấn và chứng nhận VietGAP." }] }),
  component: VietGapPage,
});

const config: OperationalModuleConfig = {
  resource: "vietgap-records",
  detailModule: "vietgap",
  title: "Quản lý VietGAP",
  subtitle: "Theo dõi cơ sở, vùng sản xuất, đánh giá và chứng nhận VietGAP",
  createLabel: "Tạo hồ sơ",
  icon: Leaf,
  managePermission: "manage_vietgap",
  searchPlaceholder: "Tìm mã, cơ sở, khách hàng, địa phương...",
  emptyItem: () => ({ id: crypto.randomUUID(), code: "", title: "", customer: "", standard: "cultivation", farmName: "", province: "", owner: "", area: 0, startDate: "", auditDate: "", expiryDate: "", certificateNumber: "", status: "planning", description: "" }),
  dateRanges: [["startDate", "auditDate"], ["auditDate", "expiryDate"]],
  fields: [
    { key: "code", label: "Mã hồ sơ", required: true, placeholder: "VD: VGAP-2026-001" },
    { key: "title", label: "Tên hồ sơ/dự án", required: true },
    { key: "customer", label: "Khách hàng/HTX", required: true },
    { key: "standard", label: "Lĩnh vực VietGAP", type: "select", required: true, options: [
      { value: "cultivation", label: "VietGAP trồng trọt" }, { value: "livestock", label: "VietGAP chăn nuôi" },
      { value: "aquaculture", label: "VietGAP thủy sản" }, { value: "organic", label: "Hữu cơ" },
    ] },
    { key: "farmName", label: "Cơ sở/Vùng sản xuất" },
    { key: "province", label: "Tỉnh/Thành phố" },
    { key: "owner", label: "Chuyên viên phụ trách", required: true },
    { key: "area", label: "Diện tích (ha)", type: "number", min: 0 },
    { key: "startDate", label: "Ngày bắt đầu", type: "date", required: true },
    { key: "auditDate", label: "Ngày đánh giá dự kiến", type: "date" },
    { key: "expiryDate", label: "Ngày hết hiệu lực", type: "date" },
    { key: "certificateNumber", label: "Số chứng nhận" },
    { key: "status", label: "Trạng thái", type: "select", required: true, options: [
      { value: "planning", label: "Lập kế hoạch" }, { value: "active", label: "Đang tư vấn" },
      { value: "reviewing", label: "Đang đánh giá" }, { value: "approved", label: "Đã chứng nhận" },
      { value: "suspended", label: "Tạm dừng" }, { value: "expired", label: "Hết hiệu lực" },
    ] },
    { key: "description", label: "Phạm vi và ghi chú", type: "textarea" },
  ],
  columns: [
    { key: "code", label: "Mã" }, { key: "title", label: "Hồ sơ" }, { key: "customer", label: "Khách hàng" },
    { key: "province", label: "Địa phương" }, { key: "owner", label: "Phụ trách" },
    { key: "auditDate", label: "Ngày đánh giá", kind: "date" }, { key: "status", label: "Trạng thái", kind: "status" },
  ],
};

function VietGapPage() { return <OperationalCrudPage config={config} />; }
