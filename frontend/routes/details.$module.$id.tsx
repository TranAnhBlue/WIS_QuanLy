import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Award,
  Bell,
  BriefcaseBusiness,
  Clock,
  FileCheck2,
  FileText,
  FolderKanban,
  FlaskConical,
  Leaf,
  Scale,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { message } from "antd";
import { apiRequest } from "@/lib/backend-api";
import { formatVND } from "@/lib/currency";
import { COMPANY_INFO, DEPARTMENT_INFO, type Company, type Department } from "@/lib/permissions";

export const Route = createFileRoute("/details/$module/$id")({
  head: ({ params }) => {
    const labels: Record<string, string> = {
      notifications: "Chi tiết thông báo", projects: "Chi tiết dự án", contracts: "Chi tiết hợp đồng",
      quotations: "Chi tiết báo giá", certifications: "Chi tiết chứng chỉ", hr: "Chi tiết nhân sự",
      users: "Chi tiết người dùng", reward: "Chi tiết khen thưởng", attendance: "Chi tiết chấm công",
      "attendance-management": "Chi tiết chấm công",
      science: "Chi tiết nhiệm vụ KH", legal: "Chi tiết bảo hộ & pháp lý", vietgap: "Chi tiết VietGAP",
    };
    return { meta: [{ title: `${labels[params.module] || "Chi tiết"} - WIS` }] };
  },
  component: ModuleDetailPage,
});

type DetailData = Record<string, unknown>;
type Field = { key: string; label: string; kind?: "money" | "date" | "datetime" | "status" };
type ModuleConfig = { label: string; back: string; icon: LucideIcon; fields: Field[] };

const CONFIG: Record<string, ModuleConfig> = {
  notifications: {
    label: "Thông báo",
    back: "/notifications",
    icon: Bell,
    fields: [
      { key: "category", label: "Module" }, { key: "type", label: "Mức độ", kind: "status" },
      { key: "createdBy.name", label: "Người gửi" }, { key: "createdAt", label: "Thời gian gửi", kind: "datetime" },
      { key: "audience", label: "Phạm vi nhận" }, { key: "isRead", label: "Trạng thái", kind: "status" },
    ],
  },
  projects: {
    label: "Dự án",
    back: "/projects",
    icon: FolderKanban,
    fields: [
      { key: "code", label: "Mã dự án" }, { key: "status", label: "Trạng thái", kind: "status" },
      { key: "customer", label: "Khách hàng" }, { key: "line", label: "Line" },
      { key: "pm", label: "Quản lý dự án" }, { key: "progress", label: "Tiến độ" },
      { key: "start", label: "Ngày bắt đầu", kind: "date" }, { key: "due", label: "Hạn hoàn thành", kind: "date" },
      { key: "budget", label: "Ngân sách", kind: "money" }, { key: "tasksDone", label: "Công việc hoàn thành" },
    ],
  },
  contracts: {
    label: "Hợp đồng",
    back: "/contracts",
    icon: BriefcaseBusiness,
    fields: [
      { key: "code", label: "Mã hợp đồng" }, { key: "status", label: "Trạng thái", kind: "status" },
      { key: "customer", label: "Khách hàng" }, { key: "line", label: "Line" },
      { key: "owner", label: "Người phụ trách" }, { key: "value", label: "Giá trị", kind: "money" },
      { key: "signed", label: "Ngày ký", kind: "date" }, { key: "expires", label: "Ngày hết hạn", kind: "date" },
    ],
  },
  quotations: {
    label: "Báo giá",
    back: "/quotations",
    icon: FileText,
    fields: [
      { key: "code", label: "Mã báo giá" }, { key: "status", label: "Trạng thái", kind: "status" },
      { key: "customer", label: "Khách hàng" }, { key: "contact", label: "Đầu mối" },
      { key: "owner", label: "Người phụ trách" }, { key: "line", label: "Line" },
      { key: "created", label: "Ngày tạo", kind: "date" }, { key: "valid", label: "Hiệu lực đến", kind: "date" },
    ],
  },
  certifications: {
    label: "Chứng chỉ",
    back: "/certifications",
    icon: FileCheck2,
    fields: [
      { key: "code", label: "Mã chứng chỉ" }, { key: "status", label: "Trạng thái", kind: "status" },
      { key: "standard", label: "Tiêu chuẩn" }, { key: "customer", label: "Khách hàng" },
      { key: "line", label: "Line" }, { key: "auditor", label: "Đánh giá viên trưởng" },
      { key: "issued", label: "Ngày cấp", kind: "date" }, { key: "expires", label: "Ngày hết hạn", kind: "date" },
    ],
  },
  hr: {
    label: "Hồ sơ nhân sự",
    back: "/hr",
    icon: UserRound,
    fields: userFields(),
  },
  users: {
    label: "Tài khoản người dùng",
    back: "/users",
    icon: UserRound,
    fields: userFields(),
  },
  reward: {
    label: "Khen thưởng",
    back: "/reward",
    icon: Award,
    fields: [
      { key: "code", label: "Mã nhân sự" }, { key: "line", label: "Line" },
      { key: "title", label: "Chức danh" }, { key: "points", label: "Tổng điểm" },
      { key: "delta", label: "Điểm tháng này" }, { key: "streak", label: "Chuỗi thành tích" },
    ],
  },
  "attendance-management": {
    label: "Chi tiết chấm công",
    back: "/attendance-management",
    icon: Clock,
    fields: [
      { key: "userId.name", label: "Nhân sự" }, { key: "userId.email", label: "Email" },
      { key: "userId.role", label: "Vai trò" }, { key: "userId.company", label: "Line" },
      { key: "userId.department", label: "Phòng ban" }, { key: "date", label: "Ngày", kind: "date" },
      { key: "checkInTime", label: "Giờ vào", kind: "datetime" }, { key: "checkOutTime", label: "Giờ ra", kind: "datetime" },
      { key: "workingHours", label: "Số giờ làm" }, { key: "status", label: "Trạng thái", kind: "status" },
    ],
  },
  attendance: {
    label: "Chi tiết chấm công",
    back: "/attendance",
    icon: Clock,
    fields: [
      { key: "userId.name", label: "Nhân sự" }, { key: "userId.email", label: "Email" },
      { key: "userId.role", label: "Vai trò" }, { key: "userId.company", label: "Line" },
      { key: "userId.department", label: "Phòng ban" }, { key: "date", label: "Ngày", kind: "date" },
      { key: "checkInTime", label: "Giờ vào", kind: "datetime" }, { key: "checkOutTime", label: "Giờ ra", kind: "datetime" },
      { key: "workingHours", label: "Số giờ làm" }, { key: "status", label: "Trạng thái", kind: "status" },
    ],
  },
  science: {
    label: "Nhiệm vụ khoa học",
    back: "/science",
    icon: FlaskConical,
    fields: [
      { key: "code", label: "Mã nhiệm vụ" }, { key: "status", label: "Trạng thái", kind: "status" },
      { key: "topic", label: "Lĩnh vực nghiên cứu" }, { key: "manager", label: "Chủ nhiệm nhiệm vụ" },
      { key: "leadAgency", label: "Cơ quan chủ trì" }, { key: "budget", label: "Kinh phí", kind: "money" },
      { key: "startDate", label: "Ngày bắt đầu", kind: "date" }, { key: "endDate", label: "Ngày kết thúc", kind: "date" },
      { key: "progress", label: "Tiến độ" },
    ],
  },
  legal: {
    label: "Bảo hộ & Pháp lý",
    back: "/legal",
    icon: Scale,
    fields: [
      { key: "code", label: "Mã hồ sơ" }, { key: "status", label: "Trạng thái", kind: "status" },
      { key: "category", label: "Loại hồ sơ", kind: "status" }, { key: "owner", label: "Người phụ trách" },
      { key: "subject", label: "Chủ sở hữu/Đơn vị liên quan" }, { key: "authority", label: "Cơ quan tiếp nhận" },
      { key: "referenceNumber", label: "Số đơn/Số văn bằng" }, { key: "filingDate", label: "Ngày nộp", kind: "date" },
      { key: "deadline", label: "Hạn xử lý", kind: "date" },
    ],
  },
  vietgap: {
    label: "VietGAP",
    back: "/vietgap",
    icon: Leaf,
    fields: [
      { key: "code", label: "Mã hồ sơ" }, { key: "status", label: "Trạng thái", kind: "status" },
      { key: "customer", label: "Khách hàng/HTX" }, { key: "standard", label: "Lĩnh vực", kind: "status" },
      { key: "farmName", label: "Cơ sở/Vùng sản xuất" }, { key: "province", label: "Tỉnh/Thành phố" },
      { key: "owner", label: "Chuyên viên phụ trách" }, { key: "area", label: "Diện tích (ha)" },
      { key: "startDate", label: "Ngày bắt đầu", kind: "date" }, { key: "auditDate", label: "Ngày đánh giá", kind: "date" },
      { key: "expiryDate", label: "Ngày hết hiệu lực", kind: "date" }, { key: "certificateNumber", label: "Số chứng nhận" },
    ],
  },
};

function userFields(): Field[] {
  return [
    { key: "email", label: "Email" }, { key: "phone", label: "Số điện thoại" },
    { key: "role", label: "Vai trò" }, { key: "status", label: "Trạng thái", kind: "status" },
    { key: "company", label: "Line" }, { key: "department", label: "Phòng ban" },
    { key: "joinDate", label: "Ngày vào làm", kind: "date" }, { key: "createdAt", label: "Ngày tạo tài khoản", kind: "datetime" },
  ];
}

function valueAt(data: DetailData, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => {
    if (value && typeof value === "object" && key in value) return (value as DetailData)[key];
    return undefined;
  }, data);
}

function statusLabel(value: string) {
  const labels: Record<string, string> = {
    active: "Đang hoạt động", inactive: "Ngừng hoạt động", draft: "Nháp", sent: "Đã gửi",
    accepted: "Đã chấp nhận", rejected: "Đã từ chối", expired: "Hết hạn", expiring: "Sắp hết hạn",
    planning: "Lập kế hoạch", "on-track": "Đúng tiến độ", "at-risk": "Có rủi ro", overdue: "Quá hạn", done: "Hoàn thành",
    present: "Có mặt", absent: "Vắng mặt", late: "Đi muộn", early_leave: "Về sớm",
    info: "Thông tin", success: "Thành công", warning: "Cảnh báo", error: "Quan trọng",
    general: "Chung", system: "Hệ thống", project: "Dự án", attendance: "Chấm công", contract: "Hợp đồng",
    quotation: "Báo giá", hr: "Nhân sự", chat: "Chat nội bộ", training: "Đào tạo",
    all: "Toàn công ty", company: "Theo Line", department: "Theo phòng ban", users: "Theo người nhận",
    true: "Đã đọc", false: "Chưa đọc",
    cultivation: "VietGAP trồng trọt", livestock: "VietGAP chăn nuôi", aquaculture: "VietGAP thủy sản", organic: "Hữu cơ",
    trademark: "Nhãn hiệu", copyright: "Quyền tác giả", patent: "Sáng chế/Giải pháp hữu ích", license: "Giấy phép",
    legal: "Tư vấn pháp lý", "contract-review": "Rà soát hợp đồng", submitted: "Đã nộp", reviewing: "Đang thẩm định",
    granted: "Đã cấp văn bằng", suspended: "Tạm dừng", completed: "Hoàn thành",
  };
  return labels[value] || value;
}

function formatValue(module: string, field: Field, value: unknown) {
  if (value === undefined || value === null || value === "") return "—";
  if (field.kind === "money") {
    const amount = Number(value) * (module === "projects" ? 1_000_000 : 1);
    return formatVND(amount);
  }
  if (field.kind === "date" || field.kind === "datetime") {
    const date = new Date(String(value));
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("vi-VN", field.kind === "datetime" ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(date);
    }
  }
  if (field.kind === "status" || typeof value === "boolean") return statusLabel(String(value));
  if (field.key === "company" || field.key.endsWith(".company")) return COMPANY_INFO[value as Company]?.name || String(value);
  if (field.key === "department" || field.key.endsWith(".department")) return DEPARTMENT_INFO[value as Department]?.name || String(value);
  if (field.key === "progress") return `${value}%`;
  if (field.key === "workingHours") return `${value} giờ`;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

async function fetchDetail(module: string, id: string) {
  const businessResources: Record<string, string> = {
    contracts: "contracts", quotations: "quotations", certifications: "certifications",
    science: "science-missions", legal: "legal-records", vietgap: "vietgap-records",
  };
  if (businessResources[module]) {
    return apiRequest<{ item: DetailData }>(`/api/business/${businessResources[module]}/${id}`).then((result) => result.item);
  }
  if (module === "projects") return apiRequest<{ project: DetailData }>(`/api/projects/${id}`).then((result) => result.project);
  if (module === "notifications") {
    await apiRequest(`/api/notifications/${id}/read`, { method: "PATCH" });
    return apiRequest<{ notification: DetailData }>(`/api/notifications/${id}`).then((result) => result.notification);
  }
  if (module === "hr" || module === "users") return apiRequest<{ user: DetailData }>(`/api/users/${id}`).then((result) => result.user);
  if (module === "reward") return apiRequest<{ member: DetailData; activities: unknown[] }>(`/api/rewards/members/${id}`).then((result) => ({ ...result.member, activities: result.activities }));
  if (module === "attendance-management" || module === "attendance") {
    const separator = id.lastIndexOf("__");
    if (separator < 1) throw new Error("Mã chi tiết chấm công không hợp lệ");
    const userId = id.slice(0, separator);
    const date = id.slice(separator + 2);
    return apiRequest<{ attendance: DetailData }>(`/api/attendance/detail/${userId}?date=${encodeURIComponent(date)}`).then((result) => result.attendance);
  }
  throw new Error("Module chưa hỗ trợ màn hình chi tiết");
}

function ModuleDetailPage() {
  const { module, id } = Route.useParams();
  const config = CONFIG[module];
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchDetail(module, id)
      .then(setData)
      .catch((reason) => {
        const text = reason instanceof Error ? reason.message : "Không thể tải dữ liệu chi tiết";
        setError(text);
        message.error(text);
      })
      .finally(() => setLoading(false));
  }, [module, id]);

  const title = useMemo(() => {
    if (!data) return config?.label || "Chi tiết";
    return String(data.title || data.name || data.standard || data.customer || data.code || config?.label || "Chi tiết");
  }, [data, config]);

  if (!config) return <DetailError message="Module chưa hỗ trợ màn hình chi tiết" back="/" />;
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <a href={config.back} className="grid size-9 place-items-center rounded-md hover:bg-muted" aria-label="Quay lại"><ArrowLeft className="size-5" /></a>
          <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-5" /></div>
          <div className="min-w-0"><div className="text-xs text-muted-foreground">{config.label}</div><h1 className="truncate font-display text-lg font-semibold">{title}</h1></div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {loading ? <div className="rounded-xl border border-border bg-card p-16 text-center text-sm text-muted-foreground">Đang tải dữ liệu chi tiết...</div>
          : error || !data ? <DetailError message={error || "Dữ liệu không tồn tại"} back={config.back} />
            : <DetailContent module={module} data={data} config={config} />}
      </main>
    </div>
  );
}

function DetailContent({ module, data, config }: { module: string; data: DetailData; config: ModuleConfig }) {
  const description = String(data.message || data.description || data.scope || data.notes || "");
  const items = Array.isArray(data.items) ? data.items as DetailData[] : [];
  const milestones = Array.isArray(data.milestones) ? data.milestones as DetailData[] : [];
  const activities = Array.isArray(data.activities) ? data.activities as DetailData[] : [];
  const quoteTotal = items.reduce((total, item) => total + Number(item.qty || 0) * Number(item.price || 0), 0);
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        {description && <section className="rounded-xl border border-border bg-card p-5 sm:p-6"><h2 className="mb-3 font-semibold">Nội dung chi tiết</h2><p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{description}</p></section>}
        {(items.length > 0 || milestones.length > 0) && (
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4 font-semibold">{items.length ? "Hạng mục báo giá" : "Tiến độ thanh toán"}</div>
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-muted/40 text-xs text-muted-foreground"><tr><th className="px-5 py-3 text-left">Nội dung</th><th className="px-5 py-3 text-right">Số lượng</th><th className="px-5 py-3 text-right">Đơn giá/Giá trị</th><th className="px-5 py-3 text-right">Thành tiền</th></tr></thead><tbody className="divide-y divide-border">{(items.length ? items : milestones).map((item, index) => { const amount = Number(item.amount || 0); const total = items.length ? Number(item.qty || 0) * Number(item.price || 0) : amount; return <tr key={index}><td className="px-5 py-3 font-medium">{String(item.desc || item.name || "—")}</td><td className="px-5 py-3 text-right">{items.length ? String(item.qty || 0) : String(item.due || "—")}</td><td className="px-5 py-3 text-right">{formatVND(items.length ? Number(item.price || 0) : amount)}</td><td className="px-5 py-3 text-right font-semibold">{formatVND(total)}</td></tr>; })}</tbody>{items.length > 0 && <tfoot><tr className="border-t border-border"><td colSpan={3} className="px-5 py-4 text-right font-medium">Tổng báo giá</td><td className="px-5 py-4 text-right font-semibold text-primary">{formatVND(quoteTotal)}</td></tr></tfoot>}</table></div>
          </section>
        )}
        {activities.length > 0 && <section className="rounded-xl border border-border bg-card p-5"><h2 className="mb-3 font-semibold">Lịch sử hoạt động</h2><div className="space-y-3">{activities.map((activity, index) => <div key={index} className="flex items-start justify-between gap-4 rounded-lg bg-muted/30 p-3 text-sm"><div><div className="font-medium">{String(activity.action || "Hoạt động")}</div><div className="text-xs text-muted-foreground">{String(activity.when || "")}</div></div><div className="font-semibold text-primary">{Number(activity.points || 0) > 0 ? "+" : ""}{String(activity.points || 0)}</div></div>)}</div></section>}
      </div>
      <aside className="h-fit rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 font-semibold">Thông tin</h2>
        <dl className="space-y-4">{config.fields.map((field) => { const value = valueAt(data, field.key); return <div key={field.key} className="border-b border-border/70 pb-3 last:border-0 last:pb-0"><dt className="text-xs text-muted-foreground">{field.label}</dt><dd className="mt-1 break-words text-sm font-medium">{formatValue(module, field, value)}</dd></div>; })}</dl>
        {typeof data.link === "string" && data.link && <a href={data.link} className="mt-5 inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Mở nội dung liên quan</a>}
      </aside>
    </div>
  );
}

function DetailError({ message: text, back }: { message: string; back: string }) {
  return <div className="rounded-xl border border-border bg-card p-14 text-center"><FileText className="mx-auto mb-3 size-10 text-muted-foreground/40" /><h2 className="font-semibold">Không thể mở chi tiết</h2><p className="mt-1 text-sm text-muted-foreground">{text}</p><a href={back} className="mt-5 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Quay lại danh sách</a></div>;
}
