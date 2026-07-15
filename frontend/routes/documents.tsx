import { createFileRoute } from "@tanstack/react-router";
import { FileBox } from "lucide-react";
import { OperationalCrudPage, type OperationalModuleConfig } from "@/components/business/OperationalCrudPage";

export const Route = createFileRoute("/documents")({ head: () => ({ meta: [{ title: "Tài liệu - WIS" }] }), component: DocumentsPage });
const config: OperationalModuleConfig = {
  resource: "documents", detailModule: "documents", title: "Kho tài liệu",
  subtitle: "Lưu trữ file tập trung trên Cloudinary và quản lý thông tin bằng MongoDB",
  createLabel: "Tải tài liệu", icon: FileBox, managePermission: "manage_documents",
  emptyItem: () => ({ id: crypto.randomUUID(), code: "", title: "", category: "internal", owner: "", line: "", fileName: "", fileUrl: "", filePublicId: "", fileResourceType: "", fileType: "", fileSize: 0, status: "active", description: "" }),
  fields: [
    { key: "code", label: "Mã tài liệu", required: true }, { key: "title", label: "Tên tài liệu", required: true },
    { key: "category", label: "Danh mục", type: "select", required: true, options: [{ value: "internal", label: "Nội bộ" }, { value: "template", label: "Biểu mẫu" }, { value: "legal", label: "Pháp lý" }, { value: "training", label: "Đào tạo" }] },
    { key: "owner", label: "Người quản lý", required: true }, { key: "line", label: "Line", type: "select", options: ["Line 1", "Line 2", "Line 3"].map(value => ({ value, label: value })) },
    { key: "fileUrl", label: "File", type: "file", required: true },
    { key: "status", label: "Trạng thái", type: "select", required: true, options: [{ value: "active", label: "Đang sử dụng" }, { value: "expired", label: "Hết hiệu lực" }] },
    { key: "description", label: "Mô tả", type: "textarea" },
  ],
  columns: [{ key: "code", label: "Mã" }, { key: "title", label: "Tài liệu" }, { key: "category", label: "Danh mục" }, { key: "owner", label: "Quản lý" }, { key: "line", label: "Line" }, { key: "fileName", label: "Tên file" }, { key: "status", label: "Trạng thái", kind: "status" }],
  searchPlaceholder: "Tìm mã, tên tài liệu, người quản lý...",
};
function DocumentsPage() { return <OperationalCrudPage config={config} />; }
