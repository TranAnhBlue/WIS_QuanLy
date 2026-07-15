import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { ArrowLeft, Eye, Filter, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { message } from "antd";
import { businessApi, uploadBusinessFile } from "@/lib/backend-api";
import { formatVND } from "@/lib/currency";
import { useAuth } from "@/contexts/AuthContext";
import type { Permission } from "@/lib/permissions";
import { AppDatePicker, isDateBefore, isValidDateValue } from "@/components/ui/app-date-picker";

export type OperationalItem = {
  id: string;
  code: string;
  title: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: string | number | undefined;
};

export type OperationalField = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "date" | "number" | "money" | "select" | "file";
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
};

export type OperationalColumn = {
  key: string;
  label: string;
  kind?: "status" | "date" | "money" | "progress";
};

export type OperationalModuleConfig = {
  resource: string;
  detailModule: string;
  title: string;
  subtitle: string;
  createLabel: string;
  icon: ComponentType<{ className?: string }>;
  managePermission: Permission;
  fields: OperationalField[];
  columns: OperationalColumn[];
  emptyItem: () => OperationalItem;
  searchPlaceholder: string;
  dateRanges?: Array<[string, string]>;
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Bản nháp",
  planning: "Lập kế hoạch",
  active: "Đang thực hiện",
  in_progress: "Đang xử lý",
  pending: "Chờ xử lý",
  submitted: "Đã nộp",
  reviewing: "Đang thẩm định",
  granted: "Đã cấp văn bằng",
  approved: "Đã phê duyệt",
  rejected: "Từ chối",
  completed: "Hoàn thành",
  expired: "Hết hiệu lực",
  suspended: "Tạm dừng",
  overdue: "Quá hạn",
};

const STATUS_CLASSES: Record<string, string> = {
  active: "border-success/30 bg-success/10 text-success",
  in_progress: "border-primary/30 bg-primary/10 text-primary",
  granted: "border-success/30 bg-success/10 text-success",
  approved: "border-success/30 bg-success/10 text-success",
  completed: "border-success/30 bg-success/10 text-success",
  rejected: "border-destructive/30 bg-destructive/10 text-destructive",
  expired: "border-destructive/30 bg-destructive/10 text-destructive",
  overdue: "border-destructive/30 bg-destructive/10 text-destructive",
  pending: "border-warning/30 bg-warning/10 text-warning",
  submitted: "border-warning/30 bg-warning/10 text-warning",
  reviewing: "border-warning/30 bg-warning/10 text-warning",
};

const VALUE_LABELS: Record<string, string> = {
  trademark: "Nhãn hiệu", copyright: "Quyền tác giả", patent: "Sáng chế/Giải pháp hữu ích",
  license: "Giấy phép", legal: "Tư vấn pháp lý", "contract-review": "Rà soát hợp đồng",
  cultivation: "VietGAP trồng trọt", livestock: "VietGAP chăn nuôi",
  aquaculture: "VietGAP thủy sản", organic: "Hữu cơ",
};

function statusLabel(value: string) {
  return STATUS_LABELS[value] || value || "—";
}

function displayValue(item: OperationalItem, column: OperationalColumn) {
  const value = item[column.key];
  if (value === undefined || value === null || value === "") return "—";
  if (column.kind === "status") return statusLabel(String(value));
  if (column.kind === "money") return formatVND(Number(value));
  if (column.kind === "progress") return `${Number(value)}%`;
  return VALUE_LABELS[String(value)] || String(value);
}

export function OperationalCrudPage({ config }: { config: OperationalModuleConfig }) {
  const { hasPermission } = useAuth();
  const canManage = hasPermission(config.managePermission);
  const [items, setItems] = useState<OperationalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<OperationalItem | null>(null);
  const [deleting, setDeleting] = useState<OperationalItem | null>(null);

  useEffect(() => {
    setLoading(true);
    businessApi.list<OperationalItem>(config.resource)
      .then(setItems)
      .catch((error) => message.error(error instanceof Error ? error.message : "Không thể tải dữ liệu"))
      .finally(() => setLoading(false));
  }, [config.resource]);

  const statuses = useMemo(() => Array.from(new Set(items.map((item) => item.status).filter(Boolean))), [items]);
  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("vi");
    return items.filter((item) => {
      if (status !== "all" && item.status !== status) return false;
      if (!keyword) return true;
      return config.fields.some((field) => String(item[field.key] ?? "").toLocaleLowerCase("vi").includes(keyword));
    });
  }, [items, query, status, config.fields]);

  const statusCounts = useMemo(() => ({
    total: items.length,
    active: items.filter((item) => ["active", "in_progress", "reviewing"].includes(item.status)).length,
    completed: items.filter((item) => ["completed", "approved", "granted"].includes(item.status)).length,
    attention: items.filter((item) => ["overdue", "expired", "rejected", "suspended"].includes(item.status)).length,
  }), [items]);

  async function save(item: OperationalItem) {
    const isUpdate = items.some((current) => current.id === item.id);
    try {
      const saved = isUpdate
        ? await businessApi.update(config.resource, item)
        : await businessApi.create<OperationalItem>(config.resource, item);
      setItems((current) => isUpdate
        ? current.map((existing) => existing.id === saved.id ? saved : existing)
        : [saved, ...current]);
      setEditing(null);
      message.success(isUpdate ? "Đã cập nhật hồ sơ" : "Đã tạo hồ sơ mới");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Không thể lưu hồ sơ");
    }
  }

  async function remove() {
    if (!deleting) return;
    try {
      await businessApi.remove(config.resource, deleting.id);
      setItems((current) => current.filter((item) => item.id !== deleting.id));
      setDeleting(null);
      message.success("Đã xóa hồ sơ");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Không thể xóa hồ sơ");
    }
  }

  const Icon = config.icon;
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <Link to="/" className="grid size-9 place-items-center rounded-md hover:bg-muted" aria-label="Quay lại Dashboard"><ArrowLeft className="size-5" /></Link>
          <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-5" /></div>
          <div className="min-w-0"><h1 className="font-display text-base font-semibold">{config.title}</h1><p className="truncate text-xs text-muted-foreground">{config.subtitle}</p></div>
          {canManage && <button onClick={() => setEditing(config.emptyItem())} className="ml-auto inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"><Plus className="size-4" />{config.createLabel}</button>}
        </div>
      </header>

      <main className="space-y-5 p-4 sm:p-6">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ["Tổng hồ sơ", statusCounts.total], ["Đang xử lý", statusCounts.active],
            ["Đã hoàn thành", statusCounts.completed], ["Cần chú ý", statusCounts.attention],
          ].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-border bg-card p-4"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-2 font-display text-2xl font-semibold">{value}</div></div>)}
        </section>

        <section className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={config.searchPlaceholder} className="h-10 w-full rounded-md border border-border bg-card pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-ring" /></div>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 min-w-44 rounded-md border border-border bg-card px-3 text-sm text-foreground"><option value="all">Mọi trạng thái</option>{statuses.map((itemStatus) => <option key={itemStatus} value={itemStatus}>{statusLabel(itemStatus)}</option>)}</select>
          <div className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs text-muted-foreground"><Filter className="size-4" />{filtered.length} kết quả</div>
        </section>

        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground"><tr>{config.columns.map((column) => <th key={column.key} className="px-4 py-3 text-left">{column.label}</th>)}<th className="w-32 px-4 py-3 text-right">Thao tác</th></tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.map((item) => <tr key={item.id} className="hover:bg-muted/25">{config.columns.map((column, index) => <td key={column.key} className={`px-4 py-3 ${index === 0 ? "font-medium" : ""}`}>{column.kind === "status" ? <span className={`inline-flex rounded-full border px-2 py-1 text-xs ${STATUS_CLASSES[item.status] || "border-border bg-muted text-muted-foreground"}`}>{displayValue(item, column)}</span> : column.kind === "progress" ? <div className="flex min-w-28 items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, Number(item[column.key] || 0)))}%` }} /></div><span className="text-xs">{displayValue(item, column)}</span></div> : displayValue(item, column)}</td>)}
                <td className="px-4 py-3"><div className="flex justify-end gap-1"><Link to="/details/$module/$id" params={{ module: config.detailModule, id: item.id }} className="grid size-8 place-items-center rounded-md hover:bg-muted" title="Xem chi tiết"><Eye className="size-4" /></Link>{canManage && <><button onClick={() => setEditing(item)} className="grid size-8 place-items-center rounded-md hover:bg-muted" title="Sửa"><Pencil className="size-4" /></button><button onClick={() => setDeleting(item)} className="grid size-8 place-items-center rounded-md text-destructive hover:bg-destructive/10" title="Xóa"><Trash2 className="size-4" /></button></>}</div></td>
              </tr>)}
              {!loading && filtered.length === 0 && <tr><td colSpan={config.columns.length + 1} className="px-6 py-14 text-center text-muted-foreground">Chưa có hồ sơ phù hợp</td></tr>}
              {loading && <tr><td colSpan={config.columns.length + 1} className="px-6 py-14 text-center text-muted-foreground">Đang tải dữ liệu...</td></tr>}
            </tbody></table></div>
        </section>
      </main>

      {editing && <OperationalForm config={config} item={editing} isNew={!items.some((item) => item.id === editing.id)} onClose={() => setEditing(null)} onSave={save} />}
      {deleting && <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setDeleting(null)}><div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl" onClick={(event) => event.stopPropagation()}><h2 className="font-display text-lg font-semibold">Xóa hồ sơ?</h2><p className="mt-2 text-sm text-muted-foreground">Hồ sơ “{deleting.title}” sẽ bị xóa khỏi MongoDB và không thể khôi phục.</p><div className="mt-5 flex justify-end gap-2"><button onClick={() => setDeleting(null)} className="h-9 rounded-md border border-border px-4 text-sm">Hủy</button><button onClick={remove} className="h-9 rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground">Xóa</button></div></div></div>}
    </div>
  );
}

function OperationalForm({ config, item, isNew, onClose, onSave }: { config: OperationalModuleConfig; item: OperationalItem; isNew: boolean; onClose: () => void; onSave: (item: OperationalItem) => void }) {
  const [form, setForm] = useState(item);
  const [uploading, setUploading] = useState(false);
  const set = (key: string, value: string | number) => setForm((current) => ({ ...current, [key]: value }));

  function submit() {
    const missing = config.fields.filter((field) => field.required && String(form[field.key] ?? "").trim() === "");
    if (missing.length) return message.error(`Vui lòng nhập: ${missing.map((field) => field.label).join(", ")}`);
    const invalidDate = config.fields.find((field) => field.type === "date" && form[field.key] && !isValidDateValue(String(form[field.key])));
    if (invalidDate) return message.error(`${invalidDate.label} không hợp lệ`);
    for (const [startKey, endKey] of config.dateRanges || []) {
      if (form[startKey] && form[endKey] && isDateBefore(String(form[endKey]), String(form[startKey]))) return message.error("Ngày kết thúc không được trước ngày bắt đầu");
    }
    const invalidNumber = config.fields.find((field) => ["number", "money"].includes(field.type || "") && form[field.key] !== "" && form[field.key] !== undefined && (!Number.isFinite(Number(form[field.key])) || (field.min !== undefined && Number(form[field.key]) < field.min) || (field.max !== undefined && Number(form[field.key]) > field.max)));
    if (invalidNumber) return message.error(`${invalidNumber.label} không hợp lệ`);
    onSave(form);
  }

  return <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4" onClick={onClose}><div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card shadow-xl" onClick={(event) => event.stopPropagation()}><div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-4"><div><h2 className="font-display font-semibold">{isNew ? config.createLabel : "Cập nhật hồ sơ"}</h2><p className="text-xs text-muted-foreground">Các trường có dấu * là bắt buộc</p></div><button onClick={onClose} className="grid size-8 place-items-center rounded-md hover:bg-muted"><X className="size-4" /></button></div>
    <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="grid gap-4 p-5 sm:grid-cols-2">{config.fields.map((field) => <label key={field.key} className={field.type === "textarea" || field.type === "file" ? "sm:col-span-2" : ""}><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{field.label}{field.required && " *"}</span>{field.type === "textarea" ? <textarea value={String(form[field.key] ?? "")} onChange={(event) => set(field.key, event.target.value)} placeholder={field.placeholder} className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring" /> : field.type === "select" ? <select value={String(form[field.key] ?? "")} onChange={(event) => set(field.key, event.target.value)} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"><option value="">Chọn {field.label.toLocaleLowerCase("vi")}</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : field.type === "date" ? <AppDatePicker value={String(form[field.key] ?? "")} onChange={(value) => set(field.key, value)} /> : field.type === "file" ? <div className="rounded-md border border-dashed border-border bg-background p-3"><input type="file" disabled={uploading} onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; try { setUploading(true); const uploaded = await uploadBusinessFile(file, "documents"); setForm((current) => ({ ...current, fileName: uploaded.name, fileUrl: uploaded.url, filePublicId: uploaded.publicId, fileResourceType: uploaded.resourceType, fileType: uploaded.type, fileSize: uploaded.size })); message.success("Đã tải file lên Cloudinary"); } catch (error) { message.error(error instanceof Error ? error.message : "Không thể tải file"); } finally { setUploading(false); event.target.value = ""; } }} className="block w-full text-sm" />{form.fileUrl && <a href={String(form.fileUrl)} target="_blank" rel="noreferrer" className="mt-2 block truncate text-xs text-primary hover:underline">{String(form.fileName || form.fileUrl)}</a>}</div> : <input type={field.type === "number" || field.type === "money" ? "number" : "text"} min={field.min} max={field.max} value={form[field.key] ?? ""} onChange={(event) => set(field.key, field.type === "number" || field.type === "money" ? (event.target.value === "" ? "" : Number(event.target.value)) : event.target.value)} placeholder={field.placeholder} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring" />}</label>)}<div className="flex justify-end gap-2 border-t border-border pt-4 sm:col-span-2"><button type="button" onClick={onClose} className="h-9 rounded-md border border-border px-4 text-sm">Hủy</button><button type="submit" disabled={uploading} className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50">{uploading ? "Đang tải file..." : isNew ? "Tạo hồ sơ" : "Lưu thay đổi"}</button></div></form>
  </div></div>;
}
