import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { OperationalCrudPage, type OperationalModuleConfig } from "@/components/business/OperationalCrudPage";

export const Route = createFileRoute("/crm")({ head: () => ({ meta: [{ title: "CRM & Khách hàng - WIS" }] }), component: CrmPage });

const config: OperationalModuleConfig = {
  resource: "customers", detailModule: "crm", title: "CRM & Khách hàng",
  subtitle: "Quản lý tập trung khách hàng, đầu mối liên hệ và người phụ trách",
  createLabel: "Thêm khách hàng", icon: Users, managePermission: "manage_customers",
  emptyItem: () => ({ id: crypto.randomUUID(), code: "", title: "", name: "", taxCode: "", contact: "", phone: "", email: "", line: "Line 1", industry: "", address: "", owner: "", status: "active", notes: "" }),
  fields: [
    { key: "code", label: "Mã khách hàng", required: true }, { key: "name", label: "Tên khách hàng", required: true },
    { key: "taxCode", label: "Mã số thuế" }, { key: "industry", label: "Lĩnh vực" },
    { key: "contact", label: "Người liên hệ" }, { key: "phone", label: "Số điện thoại" }, { key: "email", label: "Email" },
    { key: "line", label: "Line", type: "select", required: true, options: ["Line 1", "Line 2", "Line 3"].map(value => ({ value, label: value })) },
    { key: "owner", label: "Người phụ trách", required: true }, { key: "address", label: "Địa chỉ", type: "textarea" },
    { key: "status", label: "Trạng thái", type: "select", required: true, options: [{ value: "lead", label: "Tiềm năng" }, { value: "active", label: "Đang hợp tác" }, { value: "inactive", label: "Ngừng hợp tác" }] },
    { key: "notes", label: "Ghi chú", type: "textarea" },
  ],
  columns: [{ key: "code", label: "Mã" }, { key: "name", label: "Khách hàng" }, { key: "contact", label: "Liên hệ" }, { key: "phone", label: "Điện thoại" }, { key: "line", label: "Line" }, { key: "owner", label: "Phụ trách" }, { key: "status", label: "Trạng thái", kind: "status" }],
  searchPlaceholder: "Tìm tên, mã, mã số thuế hoặc người liên hệ...",
};

function CrmPage() { return <OperationalCrudPage config={config} />; }
