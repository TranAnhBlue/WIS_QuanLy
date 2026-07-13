
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  FileSignature, ArrowLeft, Search, Plus, Filter, Calendar, Building2,
  CheckCircle2, Clock, X, AlertTriangle, PenTool, Pencil, Trash2,
} from "lucide-react";
import { message } from "antd";
import { ConfirmDialog } from "./certifications";
import { businessApi } from "@/lib/backend-api";
import { AppDatePicker, isDateBefore, isValidDateValue } from "@/components/ui/app-date-picker";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatVND } from "@/lib/currency";

export const Route = createFileRoute("/contracts")({
  head: () => ({
    meta: [
      { title: "Hợp đồng — WIS" },
      { name: "description", content: "Quản lý hợp đồng, tiến độ thanh toán và tài liệu." },
    ],
  }),
  component: ContractsPage,
});

type Line = "Line 1" | "Line 2" | "Line 3";
type Status = "draft" | "pending-sign" | "active" | "completed" | "terminated";

type Milestone = { name: string; amount: number; due: string; paid: boolean };
type Contract = {
  id: string; code: string; title: string; customer: string; line: Line;
  owner: string; signed: string; expires: string; value: number;
  status: Status; milestones: Milestone[];
};

const STORAGE_KEY = "wis_contracts";

const INITIAL: Contract[] = [
  { id: "h1", code: "HĐ-2025-041", title: "Tư vấn & chứng nhận ISO 9001", customer: "Cty TNHH Minh Phú", line: "Line 2", owner: "Trần Thị B", signed: "01/03/2025", expires: "01/03/2026", value: 320_000_000, status: "active", milestones: [
    { name: "Tạm ứng 30%", amount: 96_000_000, due: "05/03", paid: true },
    { name: "Sau đánh giá giai đoạn 1", amount: 128_000_000, due: "20/05", paid: true },
    { name: "Cấp chứng nhận", amount: 96_000_000, due: "15/07", paid: false },
  ] },
  { id: "h2", code: "HĐ-2025-038", title: "Tư vấn ISO 22000 Vinamilk", customer: "Vinamilk Tiên Sơn", line: "Line 2", owner: "Hoàng Thu E", signed: "10/04/2025", expires: "10/04/2026", value: 480_000_000, status: "active", milestones: [
    { name: "Tạm ứng 40%", amount: 192_000_000, due: "15/04", paid: true },
    { name: "Giao GAP report", amount: 144_000_000, due: "30/06", paid: false },
    { name: "Nghiệm thu cuối", amount: 144_000_000, due: "10/09", paid: false },
  ] },
  { id: "h3", code: "HĐ-2025-019", title: "Đào tạo Lead Auditor K12", customer: "10 học viên công khai", line: "Line 1", owner: "Lê Minh C", signed: "20/05/2025", expires: "30/06/2025", value: 140_000_000, status: "active", milestones: [
    { name: "Học phí trọn khóa", amount: 140_000_000, due: "20/05", paid: true },
  ] },
  { id: "h4", code: "HĐ-2025-007", title: "Chứng nhận VietGAP Sơn La", customer: "HTX Nông sản Sơn La", line: "Line 3", owner: "Phạm Quốc D", signed: "01/02/2025", expires: "01/02/2028", value: 210_000_000, status: "active", milestones: [
    { name: "Tạm ứng 30%", amount: 63_000_000, due: "05/02", paid: true },
    { name: "Đánh giá thực địa", amount: 84_000_000, due: "01/06", paid: false },
    { name: "Cấp chứng nhận", amount: 63_000_000, due: "01/08", paid: false },
  ] },
  { id: "h5", code: "HĐ-2025-050", title: "Gia hạn ISO 14001 May Nhà Bè", customer: "Cty CP May Nhà Bè", line: "Line 2", owner: "Trần Thị B", signed: "—", expires: "—", value: 45_000_000, status: "pending-sign", milestones: [] },
  { id: "h6", code: "HĐ-2024-118", title: "ISO 14001 May Nhà Bè", customer: "Cty CP May Nhà Bè", line: "Line 2", owner: "Bùi Ngọc H", signed: "05/10/2024", expires: "20/03/2025", value: 300_000_000, status: "completed", milestones: [
    { name: "Trọn gói", amount: 300_000_000, due: "20/03", paid: true },
  ] },
  { id: "h7", code: "HĐ-2024-098", title: "HACCP Codex thủy sản", customer: "Thủy sản Cà Mau", line: "Line 2", owner: "Hoàng Thu E", signed: "12/07/2024", expires: "12/01/2025", value: 90_000_000, status: "terminated", milestones: [
    { name: "Tạm ứng", amount: 27_000_000, due: "15/07", paid: true },
  ] },
];

const STATUS_META: Record<Status, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  draft:          { label: "Nháp", cls: "bg-muted text-muted-foreground border-border", icon: FileSignature },
  "pending-sign": { label: "Chờ ký", cls: "bg-warning/15 text-warning border-warning/30", icon: PenTool },
  active:         { label: "Đang thực hiện", cls: "bg-success/15 text-success border-success/30", icon: CheckCircle2 },
  completed:      { label: "Hoàn thành", cls: "bg-primary/15 text-primary border-primary/30", icon: CheckCircle2 },
  terminated:     { label: "Chấm dứt", cls: "bg-destructive/15 text-destructive border-destructive/30", icon: AlertTriangle },
};

const fmt = formatVND;

const emptyContract = (): Contract => ({
  id: crypto.randomUUID(), code: "", title: "", customer: "", line: "Line 2",
  owner: "", signed: "", expires: "", value: 0, status: "draft", milestones: [],
});

function ContractsPage() {
  const [items, setItems] = useState<Contract[]>([]);
  const [q, setQ] = useState("");
  const [line, setLine] = useState<"all" | Line>("all");
  const [status, setStatus] = useState<"all" | Status>("all");
  const [sel, setSel] = useState<Contract | null>(null);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [confirmDel, setConfirmDel] = useState<Contract | null>(null);

  useEffect(() => { businessApi.list<Contract>('contracts').then(setItems).catch(e => message.error(e.message)); }, []);

  const filtered = useMemo(() => items.filter(c =>
    (line === "all" || c.line === line) &&
    (status === "all" || c.status === status) &&
    (q === "" || (c.code + c.title + c.customer + c.owner).toLowerCase().includes(q.toLowerCase()))
  ), [items, q, line, status]);

  const kpi = {
    total: items.filter(x => x.status === "active").reduce((s, x) => s + x.value, 0),
    active: items.filter(x => x.status === "active").length,
    pending: items.filter(x => x.status === "pending-sign").length,
    collected: items.reduce((s, c) => s + c.milestones.filter(m => m.paid).reduce((a, m) => a + m.amount, 0), 0),
  };

  const selPaid = sel?.milestones.filter(m => m.paid).reduce((s, m) => s + m.amount, 0) ?? 0;
  const selPct = sel && sel.value ? Math.round(selPaid / sel.value * 100) : 0;

  async function save(c: Contract) {
    const isUpdate = items.some(x => x.id === c.id);
    try {
      const saved = isUpdate ? await businessApi.update('contracts', c) : await businessApi.create<Contract>('contracts', c);
      setItems(prev => isUpdate ? prev.map(x => x.id === saved.id ? saved : x) : [saved, ...prev]);
      setEditing(null); setSel(saved);
    } catch (e) { message.error(e instanceof Error ? e.message : 'Không thể lưu'); return; }
    message.success(isUpdate ? `Đã cập nhật hợp đồng ${c.code}` : `Đã tạo hợp đồng ${c.code}`);
  }
  async function remove(id: string) {
    const item = items.find(x => x.id === id);
    try { await businessApi.remove('contracts', id); } catch (e) { message.error(e instanceof Error ? e.message : 'Không thể xóa'); return; }
    setItems(prev => prev.filter(x => x.id !== id)); 
    setConfirmDel(null); 
    setSel(null);
    if (item) message.success(`Đã xóa hợp đồng ${item.code}`);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-3 px-6 h-14">
          <Link to="/" className="p-1.5 rounded hover:bg-muted"><ArrowLeft className="size-4" /></Link>
          <FileSignature className="size-5 text-primary" />
          <div>
            <h1 className="font-display font-semibold text-sm">Hợp đồng</h1>
            <div className="text-[11px] text-muted-foreground">Ký kết, tiến độ thanh toán & lưu trữ</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setEditing(emptyContract())} className="flex items-center gap-1.5 h-8 px-3 rounded bg-primary text-primary-foreground text-xs font-medium hover:opacity-90">
              <Plus className="size-3.5" /> Tạo hợp đồng
            </button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-[11px] text-muted-foreground uppercase mb-2">Giá trị đang chạy</div>
            <div className="font-display font-semibold text-xl">{fmt(kpi.total)}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-[11px] text-muted-foreground uppercase mb-2">HĐ đang thực hiện</div>
            <div className="font-display font-semibold text-2xl text-success">{kpi.active}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-[11px] text-muted-foreground uppercase mb-2">Chờ ký</div>
            <div className="font-display font-semibold text-2xl text-warning">{kpi.pending}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-[11px] text-muted-foreground uppercase mb-2">Đã thu</div>
            <div className="font-display font-semibold text-xl text-primary">{fmt(kpi.collected)}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm mã, tên hợp đồng, khách hàng..."
              className="w-full h-9 pl-8 pr-3 rounded border border-border bg-card text-sm" />
          </div>
          <select value={line} onChange={e => setLine(e.target.value as "all" | Line)} className="h-9 px-2 rounded border border-border bg-card text-sm">
            <option value="all">Tất cả Line</option><option>Line 1</option><option>Line 2</option><option>Line 3</option>
          </select>
          <select value={status} onChange={e => setStatus(e.target.value as "all" | Status)} className="h-9 px-2 rounded border border-border bg-card text-sm">
            <option value="all">Mọi trạng thái</option>
            <option value="draft">Nháp</option>
            <option value="pending-sign">Chờ ký</option>
            <option value="active">Đang thực hiện</option>
            <option value="completed">Hoàn thành</option>
            <option value="terminated">Chấm dứt</option>
          </select>
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Filter className="size-3.5" />{filtered.length} hợp đồng</div>
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5">Mã</th>
                <th className="text-left px-4 py-2.5">Tên hợp đồng</th>
                <th className="text-left px-4 py-2.5">Khách hàng</th>
                <th className="text-left px-4 py-2.5">Line</th>
                <th className="text-right px-4 py-2.5">Giá trị</th>
                <th className="text-left px-4 py-2.5">Hiệu lực</th>
                <th className="text-left px-4 py-2.5">Trạng thái</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const S = STATUS_META[c.status];
                return (
                  <tr key={c.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs cursor-pointer" onClick={() => setSel(c)}>{c.code}</td>
                    <td className="px-4 py-3 font-medium cursor-pointer" onClick={() => setSel(c)}>{c.title}</td>
                    <td className="px-4 py-3 text-xs">{c.customer}</td>
                    <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded bg-muted">{c.line}</span></td>
                    <td className="px-4 py-3 text-right font-mono">{fmt(c.value)}</td>
                    <td className="px-4 py-3 text-xs">{c.signed} → {c.expires}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded border inline-flex items-center gap-1 ${S.cls}`}>
                        <S.icon className="size-3" />{S.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setEditing(c)} className="p-1.5 rounded hover:bg-muted"><Pencil className="size-3.5" /></button>
                      <button onClick={() => setConfirmDel(c)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="size-3.5" /></button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-sm text-muted-foreground">Không có kết quả</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {sel && (
        <div className="fixed inset-0 bg-black/40 z-20 flex justify-end" onClick={() => setSel(null)}>
          <aside className="w-full max-w-lg h-full bg-card border-l border-border overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-start justify-between">
              <div>
                <div className="text-[11px] font-mono text-muted-foreground">{sel.code}</div>
                <h2 className="font-display font-semibold mt-1">{sel.title}</h2>
                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Building2 className="size-3.5" />{sel.customer}</div>
                <span className={`inline-block mt-2 text-[11px] px-2 py-0.5 rounded border ${STATUS_META[sel.status].cls}`}>{STATUS_META[sel.status].label}</span>
              </div>
              <button onClick={() => setSel(null)} className="p-1 rounded hover:bg-muted"><X className="size-4" /></button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><div className="text-[11px] uppercase text-muted-foreground mb-1">Line</div><div>{sel.line}</div></div>
                <div><div className="text-[11px] uppercase text-muted-foreground mb-1">Phụ trách</div><div>{sel.owner}</div></div>
                <div><div className="text-[11px] uppercase text-muted-foreground mb-1">Ký ngày</div><div className="flex items-center gap-1"><Calendar className="size-3.5" />{sel.signed}</div></div>
                <div><div className="text-[11px] uppercase text-muted-foreground mb-1">Hết hạn</div><div className="flex items-center gap-1"><Calendar className="size-3.5" />{sel.expires}</div></div>
                <div className="col-span-2"><div className="text-[11px] uppercase text-muted-foreground mb-1">Giá trị hợp đồng</div><div className="font-display font-semibold text-lg">{fmt(sel.value)}</div></div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="uppercase text-muted-foreground">Tiến độ thanh toán</span>
                  <span className="font-mono">{fmt(selPaid)} / {selPct}%</span>
                </div>
                <div className="h-2 rounded bg-muted overflow-hidden">
                  <div className="h-full bg-success" style={{ width: `${selPct}%` }} />
                </div>
              </div>

              <div>
                <div className="text-[11px] uppercase text-muted-foreground mb-2">Mốc thanh toán</div>
                {sel.milestones.length === 0 ? (
                  <div className="text-xs text-muted-foreground italic">Chưa có mốc — hợp đồng đang chờ ký.</div>
                ) : (
                  <ul className="space-y-2">
                    {sel.milestones.map((m, i) => (
                      <li key={i} className="flex items-center gap-3 rounded border border-border p-2.5">
                        {m.paid
                          ? <CheckCircle2 className="size-4 text-success shrink-0" />
                          : <Clock className="size-4 text-warning shrink-0" />}
                        <div className="flex-1">
                          <div className="text-sm font-medium">{m.name}</div>
                          <div className="text-[11px] text-muted-foreground">Hạn {m.due}</div>
                        </div>
                        <div className="text-sm font-mono">{fmt(m.amount)}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="pt-3 border-t border-border flex gap-2">
                <button onClick={() => setEditing(sel)} className="flex-1 h-9 rounded bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5"><Pencil className="size-3.5" />Sửa</button>
                <button onClick={() => setConfirmDel(sel)} className="h-9 px-3 rounded border border-destructive/30 text-destructive text-sm flex items-center gap-1.5"><Trash2 className="size-3.5" />Xóa</button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {editing && <ContractForm contract={editing} onClose={() => setEditing(null)} onSave={save} />}
      {confirmDel && (
        <ConfirmDialog title="Xóa hợp đồng?" message={`Bạn có chắc muốn xóa "${confirmDel.title}"?`}
          onCancel={() => setConfirmDel(null)} onConfirm={() => remove(confirmDel.id)} />
      )}
    </div>
  );
}

const inp = "w-full h-9 px-2.5 rounded border border-border bg-background text-sm";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="text-[11px] uppercase text-muted-foreground mb-1">{label}</div>{children}</div>;
}

function ContractForm({ contract, onClose, onSave }: { contract: Contract; onClose: () => void; onSave: (c: Contract) => void }) {
  const [f, setF] = useState<Contract>(contract);
  const isNew = !contract.code;
  function setMs(i: number, patch: Partial<Milestone>) {
    setF({ ...f, milestones: f.milestones.map((m, idx) => idx === i ? { ...m, ...patch } : m) });
  }
  function submit() {
    if (Boolean(f.signed) !== Boolean(f.expires)) {
      message.error("Vui lòng nhập đủ ngày ký và ngày hết hạn");
      return;
    }
    if (f.signed && (!isValidDateValue(f.signed) || !isValidDateValue(f.expires))) {
      message.error("Ngày ký hoặc ngày hết hạn không hợp lệ");
      return;
    }
    if (f.signed && isDateBefore(f.expires, f.signed)) {
      message.error("Ngày hết hạn không được trước ngày ký");
      return;
    }
    if (f.milestones.some(m => m.due && !isValidDateValue(m.due))) {
      message.error("Có hạn thanh toán không hợp lệ");
      return;
    }
    onSave(f);
  }
  return (
    <div className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-display font-semibold">{isNew ? "Tạo hợp đồng mới" : "Sửa hợp đồng"}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="size-4" /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); submit(); }} className="p-5 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mã HĐ"><input required value={f.code} onChange={e => setF({ ...f, code: e.target.value })} className={inp} /></Field>
            <Field label="Line"><select value={f.line} onChange={e => setF({ ...f, line: e.target.value as Line })} className={inp}><option>Line 1</option><option>Line 2</option><option>Line 3</option></select></Field>
          </div>
          <Field label="Tên hợp đồng"><input required value={f.title} onChange={e => setF({ ...f, title: e.target.value })} className={inp} /></Field>
          <Field label="Khách hàng"><input required value={f.customer} onChange={e => setF({ ...f, customer: e.target.value })} className={inp} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phụ trách"><input value={f.owner} onChange={e => setF({ ...f, owner: e.target.value })} className={inp} /></Field>
            <Field label="Trạng thái"><select value={f.status} onChange={e => setF({ ...f, status: e.target.value as Status })} className={inp}>
              <option value="draft">Nháp</option><option value="pending-sign">Chờ ký</option>
              <option value="active">Đang thực hiện</option><option value="completed">Hoàn thành</option><option value="terminated">Chấm dứt</option>
            </select></Field>
            <Field label="Ngày ký"><AppDatePicker value={f.signed} onChange={signed => setF({ ...f, signed })} /></Field>
            <Field label="Hết hạn"><AppDatePicker value={f.expires} onChange={expires => setF({ ...f, expires })} /></Field>
            <Field label="Giá trị hợp đồng"><CurrencyInput value={f.value} onChange={value => setF({ ...f, value })} className={inp} /></Field>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] uppercase text-muted-foreground">Mốc thanh toán</div>
              <button type="button" onClick={() => setF({ ...f, milestones: [...f.milestones, { name: "", amount: 0, due: "", paid: false }] })} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus className="size-3" />Thêm mốc</button>
            </div>
            <div className="space-y-2">
              {f.milestones.map((m, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input placeholder="Tên mốc" value={m.name} onChange={e => setMs(i, { name: e.target.value })} className={`${inp} col-span-4`} />
                  <div className="col-span-3"><CurrencyInput value={m.amount} onChange={amount => setMs(i, { amount })} className={inp} placeholder="Số tiền" /></div>
                  <div className="col-span-2"><AppDatePicker value={m.due} onChange={due => setMs(i, { due })} placeholder="Hạn" /></div>
                  <label className="col-span-2 flex items-center gap-1.5 text-xs"><input type="checkbox" checked={m.paid} onChange={e => setMs(i, { paid: e.target.checked })} />Đã trả</label>
                  <button type="button" onClick={() => setF({ ...f, milestones: f.milestones.filter((_, idx) => idx !== i) })} className="col-span-1 p-1 text-destructive hover:bg-destructive/10 rounded"><Trash2 className="size-4" /></button>
                </div>
              ))}
            </div>
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
