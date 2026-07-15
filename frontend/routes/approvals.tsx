import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { OperationalCrudPage, type OperationalModuleConfig } from "@/components/business/OperationalCrudPage";

export const Route = createFileRoute("/approvals")({ head: () => ({ meta: [{ title: "Phê duyệt - WIS" }] }), component: ApprovalsPage });

const config: OperationalModuleConfig = {
  resource: "approvals", detailModule: "approvals", title: "Phê duyệt",
  subtitle: "Theo dõi đề nghị, quyết định và lịch sử xử lý tập trung",
  createLabel: "Tạo đề nghị", icon: CheckCircle2, managePermission: "manage_projects",
  emptyItem: () => ({ id: crypto.randomUUID(), code: "", title: "", requester: "", department: "", line: "", amount: 0, requestDate: "", dueDate: "", status: "pending", description: "", decisionNote: "" }),
  fields: [
    { key: "code", label: "Mã đề nghị", required: true }, { key: "title", label: "Nội dung đề nghị", required: true },
    { key: "requester", label: "Người đề nghị", required: true }, { key: "department", label: "Phòng ban", required: true },
    { key: "line", label: "Line", type: "select", options: ["Line 1", "Line 2", "Line 3"].map(value => ({ value, label: value })) },
    { key: "amount", label: "Giá trị", type: "money", min: 0 }, { key: "requestDate", label: "Ngày đề nghị", type: "date" },
    { key: "dueDate", label: "Hạn xử lý", type: "date" },
    { key: "status", label: "Trạng thái", type: "select", required: true, options: [{ value: "pending", label: "Chờ xử lý" }, { value: "reviewing", label: "Đang xem xét" }, { value: "approved", label: "Đã duyệt" }, { value: "rejected", label: "Từ chối" }] },
    { key: "description", label: "Nội dung chi tiết", type: "textarea" }, { key: "decisionNote", label: "Ý kiến phê duyệt", type: "textarea" },
  ],
  columns: [{ key: "code", label: "Mã" }, { key: "title", label: "Đề nghị" }, { key: "requester", label: "Người đề nghị" }, { key: "amount", label: "Giá trị", kind: "money" }, { key: "dueDate", label: "Hạn", kind: "date" }, { key: "status", label: "Trạng thái", kind: "status" }],
  searchPlaceholder: "Tìm mã, nội dung, người đề nghị...", dateRanges: [["requestDate", "dueDate"]],
};
function ApprovalsPage() { return <OperationalCrudPage config={config} />; }
