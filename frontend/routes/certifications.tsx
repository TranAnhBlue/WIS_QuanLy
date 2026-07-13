import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck, ArrowLeft, Search, Plus, Filter, Calendar, Building2,
  ShieldCheck, AlertTriangle, Clock, FileCheck2, X, Pencil, Trash2,
} from "lucide-react";
import { message } from "antd";
import { businessApi } from "@/lib/backend-api";

export const Route = createFileRoute("/certifications")({
  head: () => ({
    meta: [
      { title: "Phạm vi tiêu chuẩn quy chuẩn — WIS" },
      { name: "description", content: "Quản lý phạm vi tiêu chuẩn quy chuẩn ISO, HACCP, VietGAP..." },
    ],
  }),
  component: CertificationsPage,
});

type Line = "Line 1" | "Line 2" | "Line 3";
type Status = "active" | "expiring" | "expired" | "draft";

type Cert = {
  id: string; code: string; standard: string; scope: string;
  customer: string; line: Line; issued: string; expires: string;
  status: Status; auditor: string;
};

const STORAGE_KEY = "wis_certifications";

const INITIAL: Cert[] = [
  { id: "c1", code: "WC-ISO-2025-041", standard: "ISO 9001:2015", scope: "Sản xuất & phân phối thực phẩm", customer: "Công ty TNHH Minh Phú", line: "Line 2", issued: "12/03/2024", expires: "12/03/2027", status: "active", auditor: "Trần Thị B" },
  { id: "c2", code: "WC-ISO-2024-098", standard: "ISO 22000:2018", scope: "Chuỗi cung ứng sữa", customer: "Vinamilk Tiên Sơn", line: "Line 2", issued: "05/08/2023", expires: "05/08/2026", status: "expiring", auditor: "Hoàng Thu E" },
  { id: "c3", code: "WC-HACCP-2024-012", standard: "HACCP CODEX", scope: "Chế biến thủy sản đông lạnh", customer: "Thủy sản Bình Định", line: "Line 2", issued: "20/11/2024", expires: "20/11/2027", status: "active", auditor: "Bùi Ngọc H" },
  { id: "c4", code: "IC-VGAP-2025-007", standard: "VietGAP Trồng trọt", scope: "Trồng rau, củ, quả", customer: "HTX Nông sản Sơn La", line: "Line 3", issued: "15/01/2025", expires: "15/01/2028", status: "active", auditor: "Phạm Quốc D" },
  { id: "c5", code: "WC-ISO-2022-055", standard: "ISO 14001:2015", scope: "Quản lý môi trường nhà máy", customer: "Cty CP May Nhà Bè", line: "Line 2", issued: "10/06/2022", expires: "10/06/2025", status: "expired", auditor: "Trần Thị B" },
  { id: "c6", code: "SC-TR-2025-019", standard: "Đào tạo Lead Auditor ISO 9001", scope: "Chương trình 40h", customer: "Khóa 12 công khai", line: "Line 1", issued: "—", expires: "—", status: "draft", auditor: "Lê Minh C" },
  { id: "c7", code: "IC-VGAP-2025-021", standard: "VietGAP Chăn nuôi", scope: "Trang trại lợn 500 nái", customer: "HTX Chăn nuôi Hòa Bình", line: "Line 3", issued: "22/04/2025", expires: "22/04/2028", status: "active", auditor: "Phạm Quốc D" },
  { id: "c8", code: "WC-ISO-2024-102", standard: "ISO 45001:2018", scope: "An toàn sức khỏe nghề nghiệp", customer: "Cty XD Hòa Bình", line: "Line 2", issued: "18/09/2024", expires: "18/09/2027", status: "expiring", auditor: "Hoàng Thu E" },
];

const STATUS_META: Record<Status, { label: string; cls: string }> = {
  active:   { label: "Còn hiệu lực", cls: "bg-success/15 text-success border-success/30" },
  expiring: { label: "Sắp hết hạn", cls: "bg-warning/15 text-warning border-warning/30" },
  expired:  { label: "Hết hạn", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  draft:    { label: "Nháp", cls: "bg-muted text-muted-foreground border-border" },
};

const emptyCert = (): Cert => ({
  id: crypto.randomUUID(), code: "", standard: "", scope: "", customer: "",
  line: "Line 2", issued: "", expires: "", status: "draft", auditor: "",
});

function CertificationsPage() {
  const [certs, setCerts] = useState<Cert[]>([]);
  const [q, setQ] = useState("");
  const [line, setLine] = useState<"all" | Line>("all");
  const [status, setStatus] = useState<"all" | Status>("all");
  const [sel, setSel] = useState<Cert | null>(null);
  const [editing, setEditing] = useState<Cert | null>(null);
  const [confirmDel, setConfirmDel] = useState<Cert | null>(null);

  useEffect(() => { businessApi.list<Cert>('certifications').then(setCerts).catch(e => message.error(e.message)); }, []);

  const filtered = useMemo(() => certs.filter(c =>
    (line === "all" || c.line === line) &&
    (status === "all" || c.status === status) &&
    (q === "" || (c.code + c.standard + c.customer + c.scope).toLowerCase().includes(q.toLowerCase()))
  ), [certs, q, line, status]);

  const kpi = useMemo(() => ({
    total: certs.length,
    active: certs.filter(c => c.status === "active").length,
    expiring: certs.filter(c => c.status === "expiring").length,
    expired: certs.filter(c => c.status === "expired").length,
  }), [certs]);

  async function save(c: Cert) {
    const isUpdate = certs.some(x => x.id === c.id);
    try {
      const saved = isUpdate ? await businessApi.update('certifications', c) : await businessApi.create<Cert>('certifications', c);
      setCerts(prev => isUpdate ? prev.map(x => x.id === saved.id ? saved : x) : [saved, ...prev]);
      setEditing(null); setSel(saved);
    } catch (e) { message.error(e instanceof Error ? e.message : 'Không thể lưu'); return; }
    message.success(isUpdate ? `Đã cập nhật ${c.code}` : `Đã tạo ${c.code}`);
  }
  async function remove(id: string) {
    const item = certs.find(x => x.id === id);
    try { await businessApi.remove('certifications', id); } catch (e) { message.error(e instanceof Error ? e.message : 'Không thể xóa'); return; }
    setCerts(prev => prev.filter(x => x.id !== id));
    setConfirmDel(null); setSel(null);
    if (item) message.success(`Đã xóa ${item.code}`);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-3 px-6 h-14">
          <Link to="/" className="p-1.5 rounded hover:bg-muted"><ArrowLeft className="size-4" /></Link>
          <BadgeCheck className="size-5 text-primary" />
          <div>
            <h1 className="font-display font-semibold text-sm">Phạm vi tiêu chuẩn quy chuẩn</h1>
            <div className="text-[11px] text-muted-foreground">Quản lý chứng nhận & phạm vi áp dụng</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setEditing(emptyCert())} className="flex items-center gap-1.5 h-8 px-3 rounded bg-primary text-primary-foreground text-xs font-medium hover:opacity-90">
              <Plus className="size-3.5" /> Cấp mới
            </button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Tổng số phạm vi", value: kpi.total, icon: FileCheck2, tone: "primary" },
            { label: "Còn hiệu lực", value: kpi.active, icon: ShieldCheck, tone: "success" },
            { label: "Sắp hết hạn", value: kpi.expiring, icon: Clock, tone: "warning" },
            { label: "Đã hết hạn", value: kpi.expired, icon: AlertTriangle, tone: "destructive" },
          ].map(k => (
            <div key={k.label} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] text-muted-foreground uppercase tracking-wide">{k.label}</div>
                <k.icon className={`size-4 text-${k.tone}`} />
              </div>
              <div className="font-display font-semibold text-2xl">{k.value}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm mã, tiêu chuẩn, khách hàng..."
              className="w-full h-9 pl-8 pr-3 rounded border border-border bg-card text-sm" />
          </div>
          <select value={line} onChange={e => setLine(e.target.value as "all" | Line)} className="h-9 px-2 rounded border border-border bg-card text-sm">
            <option value="all">Tất cả Line</option><option>Line 1</option><option>Line 2</option><option>Line 3</option>
          </select>
          <select value={status} onChange={e => setStatus(e.target.value as "all" | Status)} className="h-9 px-2 rounded border border-border bg-card text-sm">
            <option value="all">Mọi trạng thái</option>
            <option value="active">Còn hiệu lực</option>
            <option value="expiring">Sắp hết hạn</option>
            <option value="expired">Hết hạn</option>
            <option value="draft">Nháp</option>
          </select>
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Filter className="size-3.5" />{filtered.length} kết quả</div>
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5">Mã</th>
                <th className="text-left px-4 py-2.5">Tiêu chuẩn / Phạm vi</th>
                <th className="text-left px-4 py-2.5">Khách hàng</th>
                <th className="text-left px-4 py-2.5">Line</th>
                <th className="text-left px-4 py-2.5">Hiệu lực</th>
                <th className="text-left px-4 py-2.5">Trạng thái</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs cursor-pointer" onClick={() => setSel(c)}>{c.code}</td>
                  <td className="px-4 py-3 cursor-pointer" onClick={() => setSel(c)}>
                    <div className="font-medium">{c.standard}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[280px]">{c.scope}</div>
                  </td>
                  <td className="px-4 py-3 cursor-pointer" onClick={() => setSel(c)}>{c.customer}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded bg-muted">{c.line}</span></td>
                  <td className="px-4 py-3 text-xs">
                    <div className="flex items-center gap-1"><Calendar className="size-3" />{c.issued}</div>
                    <div className="text-muted-foreground">→ {c.expires}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded border ${STATUS_META[c.status].cls}`}>{STATUS_META[c.status].label}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setEditing(c)} className="p-1.5 rounded hover:bg-muted" title="Sửa"><Pencil className="size-3.5" /></button>
                    <button onClick={() => setConfirmDel(c)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive" title="Xóa"><Trash2 className="size-3.5" /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-sm text-muted-foreground">Không có kết quả</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {sel && (
        <div className="fixed inset-0 bg-black/40 z-20 flex justify-end" onClick={() => setSel(null)}>
          <aside className="w-full max-w-md h-full bg-card border-l border-border overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-start justify-between">
              <div>
                <div className="text-[11px] font-mono text-muted-foreground">{sel.code}</div>
                <h2 className="font-display font-semibold mt-1">{sel.standard}</h2>
                <span className={`inline-block mt-2 text-[11px] px-2 py-0.5 rounded border ${STATUS_META[sel.status].cls}`}>{STATUS_META[sel.status].label}</span>
              </div>
              <button onClick={() => setSel(null)} className="p-1 rounded hover:bg-muted"><X className="size-4" /></button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div>
                <div className="text-[11px] uppercase text-muted-foreground mb-1">Phạm vi áp dụng</div>
                <div>{sel.scope}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><div className="text-[11px] uppercase text-muted-foreground mb-1">Khách hàng</div><div className="flex items-center gap-1.5"><Building2 className="size-3.5 text-muted-foreground" />{sel.customer}</div></div>
                <div><div className="text-[11px] uppercase text-muted-foreground mb-1">Line</div><div>{sel.line}</div></div>
                <div><div className="text-[11px] uppercase text-muted-foreground mb-1">Ngày cấp</div><div>{sel.issued}</div></div>
                <div><div className="text-[11px] uppercase text-muted-foreground mb-1">Hết hạn</div><div>{sel.expires}</div></div>
                <div className="col-span-2"><div className="text-[11px] uppercase text-muted-foreground mb-1">Đánh giá viên trưởng</div><div>{sel.auditor}</div></div>
              </div>
              <div className="pt-3 border-t border-border flex gap-2">
                <button onClick={() => setEditing(sel)} className="flex-1 h-9 rounded bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5"><Pencil className="size-3.5" />Sửa</button>
                <button onClick={() => setConfirmDel(sel)} className="h-9 px-3 rounded border border-destructive/30 text-destructive text-sm flex items-center gap-1.5"><Trash2 className="size-3.5" />Xóa</button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {editing && <CertForm cert={editing} onClose={() => setEditing(null)} onSave={save} />}
      {confirmDel && (
        <ConfirmDialog title="Xóa phạm vi?" message={`Bạn có chắc muốn xóa "${confirmDel.standard}"?`}
          onCancel={() => setConfirmDel(null)} onConfirm={() => remove(confirmDel.id)} />
      )}
    </div>
  );
}

function CertForm({ cert, onClose, onSave }: { cert: Cert; onClose: () => void; onSave: (c: Cert) => void }) {
  const [f, setF] = useState<Cert>(cert);
  const isNew = !cert.code;
  return (
    <div className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-display font-semibold">{isNew ? "Cấp phạm vi mới" : "Sửa phạm vi"}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="size-4" /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(f); }} className="p-5 space-y-3 text-sm">
          <Field label="Mã"><input required value={f.code} onChange={e => setF({ ...f, code: e.target.value })} className={inp} placeholder="VD: WC-ISO-2025-042" /></Field>
          <Field label="Tiêu chuẩn"><input required value={f.standard} onChange={e => setF({ ...f, standard: e.target.value })} className={inp} placeholder="VD: ISO 9001:2015" /></Field>
          <Field label="Phạm vi áp dụng"><textarea required value={f.scope} onChange={e => setF({ ...f, scope: e.target.value })} className={`${inp} min-h-16`} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Khách hàng"><input required value={f.customer} onChange={e => setF({ ...f, customer: e.target.value })} className={inp} /></Field>
            <Field label="Line"><select value={f.line} onChange={e => setF({ ...f, line: e.target.value as Line })} className={inp}><option>Line 1</option><option>Line 2</option><option>Line 3</option></select></Field>
            <Field label="Ngày cấp"><input value={f.issued} onChange={e => setF({ ...f, issued: e.target.value })} className={inp} placeholder="dd/mm/yyyy" /></Field>
            <Field label="Hết hạn"><input value={f.expires} onChange={e => setF({ ...f, expires: e.target.value })} className={inp} placeholder="dd/mm/yyyy" /></Field>
            <Field label="Trạng thái"><select value={f.status} onChange={e => setF({ ...f, status: e.target.value as Status })} className={inp}>
              <option value="draft">Nháp</option><option value="active">Còn hiệu lực</option>
              <option value="expiring">Sắp hết hạn</option><option value="expired">Hết hạn</option>
            </select></Field>
            <Field label="Đánh giá viên"><input value={f.auditor} onChange={e => setF({ ...f, auditor: e.target.value })} className={inp} /></Field>
          </div>
          <div className="pt-3 border-t border-border flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="h-9 px-4 rounded border border-border text-sm">Hủy</button>
            <button type="submit" className="h-9 px-4 rounded bg-primary text-primary-foreground text-sm font-medium">{isNew ? "Tạo" : "Lưu"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inp = "w-full h-9 px-2.5 rounded border border-border bg-background text-sm";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="text-[11px] uppercase text-muted-foreground mb-1">{label}</div>{children}</div>;
}

export function ConfirmDialog({ title, message, onCancel, onConfirm }: { title: string; message: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-card border border-border rounded-lg w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
        <h3 className="font-display font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{message}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="h-9 px-4 rounded border border-border text-sm">Hủy</button>
          <button onClick={onConfirm} className="h-9 px-4 rounded bg-destructive text-destructive-foreground text-sm font-medium">Xóa</button>
        </div>
      </div>
    </div>
  );
}
