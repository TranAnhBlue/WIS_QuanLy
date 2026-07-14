import { createFileRoute } from "@tanstack/react-router";
import { Scale } from "lucide-react";
import { OperationalCrudPage, type OperationalModuleConfig } from "@/components/business/OperationalCrudPage";

export const Route = createFileRoute("/legal")({
  head: () => ({ meta: [{ title: "Bảo hộ & Pháp lý - WIS" }, { name: "description", content: "Quản lý hồ sơ bảo hộ sở hữu trí tuệ và pháp lý." }] }),
  component: LegalPage,
});

const config: OperationalModuleConfig = {
  resource: "legal-records",
  detailModule: "legal",
  title: "Bảo hộ & Pháp lý",
  subtitle: "Quản lý sở hữu trí tuệ, giấy phép và hồ sơ pháp lý",
  createLabel: "Tạo hồ sơ",
  icon: Scale,
  managePermission: "manage_legal",
  searchPlaceholder: "Tìm mã, tên hồ sơ, chủ sở hữu...",
  emptyItem: () => ({ id: crypto.randomUUID(), code: "", title: "", category: "trademark", owner: "", subject: "", authority: "", referenceNumber: "", filingDate: "", deadline: "", status: "draft", description: "" }),
  dateRanges: [["filingDate", "deadline"]],
  fields: [
    { key: "code", label: "Mã hồ sơ", required: true, placeholder: "VD: PL-2026-001" },
    { key: "title", label: "Tên hồ sơ", required: true },
    { key: "category", label: "Loại hồ sơ", type: "select", required: true, options: [
      { value: "trademark", label: "Nhãn hiệu" }, { value: "copyright", label: "Quyền tác giả" },
      { value: "patent", label: "Sáng chế/Giải pháp hữu ích" }, { value: "license", label: "Giấy phép" },
      { value: "legal", label: "Tư vấn pháp lý" }, { value: "contract-review", label: "Rà soát hợp đồng" },
    ] },
    { key: "owner", label: "Người phụ trách", required: true },
    { key: "subject", label: "Chủ sở hữu/Đơn vị liên quan" },
    { key: "authority", label: "Cơ quan tiếp nhận" },
    { key: "referenceNumber", label: "Số đơn/Số văn bằng" },
    { key: "filingDate", label: "Ngày nộp/tiếp nhận", type: "date", required: true },
    { key: "deadline", label: "Hạn xử lý", type: "date" },
    { key: "status", label: "Trạng thái", type: "select", required: true, options: [
      { value: "draft", label: "Bản nháp" }, { value: "submitted", label: "Đã nộp" },
      { value: "reviewing", label: "Đang thẩm định" }, { value: "granted", label: "Đã cấp văn bằng" },
      { value: "approved", label: "Đã phê duyệt" }, { value: "rejected", label: "Từ chối" },
      { value: "expired", label: "Hết hiệu lực" },
    ] },
    { key: "description", label: "Nội dung pháp lý/Ghi chú", type: "textarea" },
  ],
  columns: [
    { key: "code", label: "Mã" }, { key: "title", label: "Hồ sơ" }, { key: "category", label: "Loại" },
    { key: "subject", label: "Chủ sở hữu" }, { key: "owner", label: "Phụ trách" },
    { key: "deadline", label: "Hạn xử lý", kind: "date" }, { key: "status", label: "Trạng thái", kind: "status" },
  ],
};

function LegalPage() { return <OperationalCrudPage config={config} />; }
