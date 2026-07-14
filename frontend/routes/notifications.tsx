import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  BellRing,
  Check,
  CheckCheck,
  CircleAlert,
  Info,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { message } from "antd";
import { apiRequest } from "@/lib/backend-api";
import { COMPANY_INFO, DEPARTMENT_INFO, type Company, type Department } from "@/lib/permissions";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Thông báo - WIS" },
      { name: "description", content: "Trung tâm thông báo nội bộ WIS." },
    ],
  }),
  component: NotificationsPage,
});

type NotificationType = "info" | "success" | "warning" | "error";
type Category = "general" | "system" | "project" | "attendance" | "contract" | "quotation" | "hr" | "chat" | "training";
type Audience = "all" | "company" | "department";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  category: Category;
  link?: string;
  audience: Audience | "users";
  targetCompanies: Company[];
  targetDepartments: Department[];
  createdBy?: { id?: string; _id?: string; name: string; email: string };
  isRead: boolean;
  canManage: boolean;
  createdAt: string;
};

type NotificationForm = {
  id?: string;
  title: string;
  message: string;
  type: NotificationType;
  category: Category;
  link: string;
  audience: Audience;
  targetCompany: Company;
  targetDepartment: Department;
};

const EMPTY_FORM: NotificationForm = {
  title: "",
  message: "",
  type: "info",
  category: "general",
  link: "",
  audience: "all",
  targetCompany: "WIS_GROUP",
  targetDepartment: "WIS_EXECUTIVE",
};

const CATEGORY_LABELS: Record<Category, string> = {
  general: "Chung",
  system: "Hệ thống",
  project: "Dự án",
  attendance: "Chấm công",
  contract: "Hợp đồng",
  quotation: "Báo giá",
  hr: "Nhân sự",
  chat: "Chat nội bộ",
  training: "Đào tạo",
};

const TYPE_META: Record<NotificationType, { label: string; icon: typeof Info; cls: string; dot: string }> = {
  info: { label: "Thông tin", icon: Info, cls: "bg-sky-500/10 text-sky-500", dot: "bg-sky-500" },
  success: { label: "Thành công", icon: Check, cls: "bg-emerald-500/10 text-emerald-500", dot: "bg-emerald-500" },
  warning: { label: "Cảnh báo", icon: AlertTriangle, cls: "bg-amber-500/10 text-amber-500", dot: "bg-amber-500" },
  error: { label: "Quan trọng", icon: CircleAlert, cls: "bg-rose-500/10 text-rose-500", dot: "bg-rose-500" },
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [canCreate, setCanCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"all" | "unread" | "read">("all");
  const [category, setCategory] = useState<"all" | Category>("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<NotificationForm | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      if (category !== "all") params.set("category", category);
      const result = await apiRequest<{
        notifications: Notification[];
        unread: number;
        canCreate: boolean;
      }>(`/api/notifications?${params.toString()}`);
      setItems(result.notifications);
      setUnread(result.unread);
      setCanCreate(result.canCreate);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Không thể tải thông báo");
    } finally {
      setLoading(false);
    }
  }, [status, category]);

  useEffect(() => {
    load();
  }, [load]);

  const visibleItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) => `${item.title} ${item.message}`.toLowerCase().includes(keyword));
  }, [items, search]);

  async function markAllRead() {
    try {
      await apiRequest("/api/notifications/read-all", { method: "PATCH" });
      setItems((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnread(0);
      message.success("Đã đánh dấu tất cả là đã đọc");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Không thể cập nhật thông báo");
    }
  }

  function edit(item: Notification) {
    setForm({
      id: item.id,
      title: item.title,
      message: item.message,
      type: item.type,
      category: item.category,
      link: item.link || "",
      audience: item.audience === "users" ? "all" : item.audience,
      targetCompany: item.targetCompanies?.[0] || "WIS_GROUP",
      targetDepartment: item.targetDepartments?.[0] || "WIS_EXECUTIVE",
    });
  }

  async function save() {
    if (!form?.title.trim() || !form.message.trim()) {
      message.warning("Vui lòng nhập tiêu đề và nội dung");
      return;
    }
    const payload = {
      title: form.title.trim(),
      message: form.message.trim(),
      type: form.type,
      category: form.category,
      link: form.link.trim(),
      audience: form.audience,
      targetCompanies: form.audience === "company" ? [form.targetCompany] : [],
      targetDepartments: form.audience === "department" ? [form.targetDepartment] : [],
      targetUsers: [],
    };
    try {
      setSaving(true);
      if (form.id) {
        await apiRequest(`/api/notifications/${form.id}`, { method: "PUT", body: JSON.stringify(payload) });
        message.success("Đã cập nhật thông báo");
      } else {
        await apiRequest("/api/notifications", { method: "POST", body: JSON.stringify(payload) });
        message.success("Đã gửi thông báo");
      }
      setForm(null);
      await load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Không thể lưu thông báo");
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: Notification) {
    if (!window.confirm(`Xóa thông báo “${item.title}”?`)) return;
    try {
      await apiRequest(`/api/notifications/${item.id}`, { method: "DELETE" });
      setItems((current) => current.filter((value) => value.id !== item.id));
      if (!item.isRead) setUnread((value) => Math.max(0, value - 1));
      message.success("Đã xóa thông báo");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Không thể xóa thông báo");
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link to="/" className="grid size-9 place-items-center rounded-md hover:bg-muted" aria-label="Quay lại dashboard">
            <ArrowLeft className="size-5" />
          </Link>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <BellRing className="size-5" />
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold">Trung tâm thông báo</h1>
              <p className="text-xs text-muted-foreground">{unread ? `${unread} thông báo chưa đọc` : "Bạn đã đọc tất cả thông báo"}</p>
            </div>
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm hover:bg-muted">
              <CheckCheck className="size-4" /> <span className="hidden sm:inline">Đọc tất cả</span>
            </button>
          )}
          {canCreate && (
            <button onClick={() => setForm({ ...EMPTY_FORM })} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Plus className="size-4" /> <span className="hidden sm:inline">Tạo thông báo</span>
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
        <section className="grid gap-3 sm:grid-cols-3">
          <SummaryCard label="Tổng thông báo" value={items.length} icon={Bell} tone="text-sky-500 bg-sky-500/10" />
          <SummaryCard label="Chưa đọc" value={unread} icon={BellRing} tone="text-amber-500 bg-amber-500/10" />
          <SummaryCard label="Đã đọc" value={Math.max(0, items.length - unread)} icon={CheckCheck} tone="text-emerald-500 bg-emerald-500/10" />
        </section>

        <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tiêu đề hoặc nội dung..." className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
            <option value="all">Tất cả trạng thái</option>
            <option value="unread">Chưa đọc</option>
            <option value="read">Đã đọc</option>
          </select>
          <select value={category} onChange={(event) => setCategory(event.target.value as typeof category)} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
            <option value="all">Tất cả module</option>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </section>

        <section className="overflow-hidden rounded-xl border border-border bg-card">
          {loading ? (
            <div className="p-12 text-center text-sm text-muted-foreground">Đang tải thông báo...</div>
          ) : visibleItems.length === 0 ? (
            <div className="flex flex-col items-center p-14 text-center">
              <Bell className="mb-3 size-10 text-muted-foreground/40" />
              <div className="font-medium">Không có thông báo</div>
              <p className="mt-1 text-sm text-muted-foreground">Không tìm thấy thông báo phù hợp với bộ lọc.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {visibleItems.map((item) => {
                const meta = TYPE_META[item.type];
                const Icon = meta.icon;
                const manageable = item.canManage || canCreate;
                return (
                  <article key={item.id} onClick={() => { window.location.href = `/details/notifications/${item.id}`; }} className={`group flex cursor-pointer gap-4 p-4 transition hover:bg-muted/40 sm:p-5 ${item.isRead ? "" : "bg-primary/[0.035]"}`}>
                    <div className={`grid size-10 shrink-0 place-items-center rounded-lg ${meta.cls}`}><Icon className="size-5" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start gap-2">
                        <h2 className={`flex-1 text-sm ${item.isRead ? "font-medium" : "font-semibold"}`}>{item.title}</h2>
                        {!item.isRead && <span className={`mt-1.5 size-2 rounded-full ${meta.dot}`} title="Chưa đọc" />}
                      </div>
                      <p className="mt-1 whitespace-pre-line text-sm leading-6 text-muted-foreground">{item.message}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
                        <span className="rounded bg-muted px-2 py-1">{CATEGORY_LABELS[item.category]}</span>
                        <span>{formatTime(item.createdAt)}</span>
                        {item.createdBy?.name && <span>Gửi bởi {item.createdBy.name}</span>}
                        {item.link && <a href={item.link} onClick={(event) => event.stopPropagation()} className="font-medium text-primary hover:underline">Mở nội dung</a>}
                      </div>
                    </div>
                    {manageable && (
                      <div className="flex shrink-0 gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                        <button onClick={(event) => { event.stopPropagation(); edit(item); }} className="grid size-8 place-items-center rounded-md hover:bg-muted" title="Sửa"><Pencil className="size-4" /></button>
                        <button onClick={(event) => { event.stopPropagation(); remove(item); }} className="grid size-8 place-items-center rounded-md text-destructive hover:bg-destructive/10" title="Xóa"><Trash2 className="size-4" /></button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {form && <NotificationModal form={form} setForm={setForm} onClose={() => setForm(null)} onSave={save} saving={saving} />}
    </div>
  );
}

function NotificationDetail({ item, loading, canManage, onClose, onEdit, onDelete }: { item: Notification; loading: boolean; canManage: boolean; onClose: () => void; onEdit: () => void; onDelete: () => void }) {
  const meta = TYPE_META[item.type];
  const Icon = meta.icon;
  const audience = item.audience === "all"
    ? "Toàn công ty"
    : item.audience === "company"
      ? item.targetCompanies.map((company) => COMPANY_INFO[company]?.name || company).join(", ")
      : item.audience === "department"
        ? item.targetDepartments.map((department) => DEPARTMENT_INFO[department]?.name || department).join(", ")
        : "Người nhận được chỉ định";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-start gap-4 border-b border-border p-5">
          <div className={`grid size-11 shrink-0 place-items-center rounded-xl ${meta.cls}`}><Icon className="size-6" /></div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="rounded bg-muted px-2 py-1 text-[11px] font-medium">{CATEGORY_LABELS[item.category]}</span>
              <span className="text-xs text-muted-foreground">{meta.label}</span>
            </div>
            <h2 className="font-display text-xl font-semibold leading-7">{item.title}</h2>
          </div>
          <button onClick={onClose} className="grid size-8 shrink-0 place-items-center rounded-md hover:bg-muted" aria-label="Đóng"><X className="size-4" /></button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-5 sm:p-6">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Đang tải chi tiết...</div>
          ) : (
            <>
              <div className="whitespace-pre-wrap text-[15px] leading-7 text-foreground">{item.message}</div>
              <dl className="mt-6 grid gap-4 rounded-lg border border-border bg-muted/30 p-4 text-sm sm:grid-cols-2">
                <div><dt className="text-xs text-muted-foreground">Thời gian gửi</dt><dd className="mt-1 font-medium">{formatTime(item.createdAt)}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Người gửi</dt><dd className="mt-1 font-medium">{item.createdBy?.name || "Hệ thống"}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Phạm vi nhận</dt><dd className="mt-1 font-medium">{audience}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Trạng thái</dt><dd className="mt-1 inline-flex items-center gap-1.5 font-medium text-emerald-500"><Check className="size-3.5" /> Đã đọc</dd></div>
              </dl>
            </>
          )}
        </div>

        <div className="flex flex-wrap justify-between gap-2 border-t border-border px-5 py-4">
          <div className="flex gap-2">
            {canManage && <button onClick={onEdit} className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm hover:bg-muted"><Pencil className="size-4" /> Sửa</button>}
            {canManage && <button onClick={onDelete} className="inline-flex h-9 items-center gap-2 rounded-md border border-destructive/30 px-3 text-sm text-destructive hover:bg-destructive/10"><Trash2 className="size-4" /> Xóa</button>}
          </div>
          <div className="flex gap-2">
            {item.link && <a href={item.link} className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">Mở nội dung liên quan</a>}
            <button onClick={onClose} className="h-9 rounded-md border border-border px-4 text-sm hover:bg-muted">Đóng</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Bell; tone: string }) {
  return <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"><div className={`grid size-10 place-items-center rounded-lg ${tone}`}><Icon className="size-5" /></div><div><div className="text-2xl font-semibold tabular-nums">{value}</div><div className="text-xs text-muted-foreground">{label}</div></div></div>;
}

function NotificationModal({ form, setForm, onClose, onSave, saving }: { form: NotificationForm; setForm: (form: NotificationForm) => void; onClose: () => void; onSave: () => void; saving: boolean }) {
  const update = <K extends keyof NotificationForm,>(key: K, value: NotificationForm[K]) => setForm({ ...form, [key]: value });
  const departmentOptions = Object.entries(DEPARTMENT_INFO) as [Department, { name: string; company: Company }][];
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="font-semibold">{form.id ? "Cập nhật thông báo" : "Tạo thông báo"}</h2><p className="text-xs text-muted-foreground">Thông báo được lưu trực tiếp trên MongoDB.</p></div><button onClick={onClose} className="grid size-8 place-items-center rounded-md hover:bg-muted"><X className="size-4" /></button></div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Tiêu đề *</span><input value={form.title} onChange={(event) => update("title", event.target.value)} maxLength={160} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" /></label>
          <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Nội dung *</span><textarea value={form.message} onChange={(event) => update("message", event.target.value)} rows={5} maxLength={2000} className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm" /></label>
          <label className="space-y-1.5"><span className="text-sm font-medium">Mức độ</span><select value={form.type} onChange={(event) => update("type", event.target.value as NotificationType)} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">{Object.entries(TYPE_META).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}</select></label>
          <label className="space-y-1.5"><span className="text-sm font-medium">Module</span><select value={form.category} onChange={(event) => update("category", event.target.value as Category)} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">{Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="space-y-1.5"><span className="text-sm font-medium">Người nhận</span><select value={form.audience} onChange={(event) => update("audience", event.target.value as Audience)} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"><option value="all">Toàn công ty</option><option value="company">Theo Line</option><option value="department">Theo phòng ban</option></select></label>
          {form.audience === "company" && <label className="space-y-1.5"><span className="text-sm font-medium">Line</span><select value={form.targetCompany} onChange={(event) => update("targetCompany", event.target.value as Company)} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">{Object.entries(COMPANY_INFO).map(([value, info]) => <option key={value} value={value}>{info.name}</option>)}</select></label>}
          {form.audience === "department" && <label className="space-y-1.5"><span className="text-sm font-medium">Phòng ban</span><select value={form.targetDepartment} onChange={(event) => update("targetDepartment", event.target.value as Department)} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">{departmentOptions.map(([value, info]) => <option key={value} value={value}>{info.name} — {COMPANY_INFO[info.company].name}</option>)}</select></label>}
          <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Đường dẫn liên quan</span><input value={form.link} onChange={(event) => update("link", event.target.value)} placeholder="Ví dụ: /projects" className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" /></label>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4"><button onClick={onClose} className="h-9 rounded-md border border-border px-4 text-sm hover:bg-muted">Hủy</button><button onClick={onSave} disabled={saving} className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50">{saving ? "Đang lưu..." : form.id ? "Lưu thay đổi" : "Gửi thông báo"}</button></div>
      </div>
    </div>
  );
}
