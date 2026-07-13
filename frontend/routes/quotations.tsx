import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  FileText, ArrowLeft, Search, Plus, Filter, Calendar, Building2, X,
  Send, CheckCircle2, XCircle, Clock, FileSignature, Pencil, Trash2,
} from "lucide-react";
import { message } from "antd";
import { ConfirmDialog } from "./certifications";
import { businessApi } from "@/lib/backend-api";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatVND } from "@/lib/currency";

export const Route = createFileRoute("/quotations")({
  head: () => ({
    meta: [
      { title: "Báo giá — WIS" },
      { name: "description", content: "Quản lý báo giá gửi khách hàng." },
    ],
  }),
  component: QuotationsPage,
});

type Line = "Line 1" | "Line 2" | "Line 3";
type Status = "draft" | "sent" | "accepted" | "rejected" | "expired";

type QuoteLine = { desc: string; qty: number; price: number };
type Quote = {
  id: string; code: string; customer: string; contact: string; line: Line;
  owner: string; created: string; valid: string; status: Status;
  items: QuoteLine[]; notes?: string;
};

const STATUS_META: Record<Status, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  draft:    { label: "Nháp", cls: "bg-muted text-muted-foreground border-border", icon: FileText },
  sent:     { label: "Đã gửi", cls: "bg-info/15 text-info border-info/30", icon: Send },
  accepted: { label: "Được chấp nhận", cls: "bg-success/15 text-success border-success/30", icon: CheckCircle2 },
  rejected: { label: "Từ chối", cls: "bg-destructive/15 text-destructive border-destructive/30", icon: XCircle },
  expired:  { label: "Hết hạn", cls: "bg-warning/15 text-warning border-warning/30", icon: Clock },
};

const fmt = formatVND;

const emptyQuote = (): Quote => ({
  id: crypto.randomUUID(), code: "", customer: "", contact: "", line: "Line 2",
  owner: "", created: "", valid: "", status: "draft",
  items: [{ desc: "", qty: 1, price: 0 }], notes: "",
});

function QuotationsPage() {
  const [items, setItems] = useState<Quote[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | Status>("all");
  const [line, setLine] = useState<"all" | Line>("all");
  const [sel, setSel] = useState<Quote | null>(null);
  const [editing, setEditing] = useState<Quote | null>(null);
  const [confirmDel, setConfirmDel] = useState<Quote | null>(null);

  useEffect(() => { businessApi.list<Quote>('quotations').then(setItems).catch(e => message.error(e.message)); }, []);

  const withTotal = useMemo(() => items.map(x => ({
    ...x, total: x.items.reduce((s, l) => s + l.qty * l.price, 0)
  })), [items]);

  const filtered = useMemo(() => withTotal.filter(p =>
    (line === "all" || p.line === line) &&
    (status === "all" || p.status === status) &&
    (q === "" || (p.code + p.customer + p.owner).toLowerCase().includes(q.toLowerCase()))
  ), [withTotal, q, line, status]);

  const kpi = {
    total: withTotal.reduce((s, x) => s + x.total, 0),
    sent: withTotal.filter(x => x.status === "sent").length,
    accepted: withTotal.filter(x => x.status === "accepted").reduce((s, x) => s + x.total, 0),
    winRate: (() => {
      const closed = withTotal.filter(x => x.status === "accepted" || x.status === "rejected");
      if (!closed.length) return 0;
      return Math.round(withTotal.filter(x => x.status === "accepted").length / closed.length * 100);
    })(),
  };

  const selTotal = sel?.items.reduce((s, l) => s + l.qty * l.price, 0) ?? 0;

  async function save(item: Quote) {
    const isUpdate = items.some(x => x.id === item.id);
    try {
      const saved = isUpdate ? await businessApi.update('quotations', item) : await businessApi.create<Quote>('quotations', item);
      setItems(prev => isUpdate ? prev.map(x => x.id === saved.id ? saved : x) : [saved, ...prev]);
      setEditing(null); setSel(saved);
    } catch (e) { message.error(e instanceof Error ? e.message : 'Không thể lưu'); return; }
    message.success(isUpdate ? `Đã cập nhật báo giá ${item.code}` : `Đã tạo báo giá ${item.code}`);
  }
  async function remove(id: string) {
    const item = items.find(x => x.id === id);
    try { await businessApi.remove('quotations', id); } catch (e) { message.error(e instanceof Error ? e.message : 'Không thể xóa'); return; }
    setItems(prev => prev.filter(x => x.id !== id)); 
    setConfirmDel(null); 
    setSel(null);
    if (item) message.success(`Đã xóa báo giá ${item.code}`);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-3 px-6 h-14">
          <Link to="/" className="p-1.5 rounded hover:bg-muted"><ArrowLeft className="size-4" /></Link>
          <FileText className="size-5 text-primary" />
          <div>
            <h1 className="font-display font-semibold text-sm">Báo giá</h1>
            <div className="text-[11px] text-muted-foreground">Theo dõi báo giá gửi khách hàng</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setEditing(emptyQuote())} className="flex items-center gap-1.5 h-8 px-3 rounded bg-primary text-primary-foreground text-xs font-medium hover:opacity-90">
              <Plus className="size-3.5" /> Tạo báo giá
            </button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-[11px] text-muted-foreground uppercase mb-2">Tổng giá trị</div>
            <div className="font-display font-semibold text-xl">{fmt(kpi.total)}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-[11px] text-muted-foreground uppercase mb-2">Đang chờ</div>
            <div className="font-display font-semibold text-2xl text-info">{kpi.sent}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-[11px] text-muted-foreground uppercase mb-2">Đã chốt</div>
            <div className="font-display font-semibold text-xl text-success">{fmt(kpi.accepted)}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-[11px] text-muted-foreground uppercase mb-2">Tỉ lệ thắng</div>
            <div className="font-display font-semibold text-2xl">{kpi.winRate}%</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm mã, khách hàng, người phụ trách..."
              className="w-full h-9 pl-8 pr-3 rounded border border-border bg-card text-sm" />
          </div>
          <select value={line} onChange={e => setLine(e.target.value as "all" | Line)} className="h-9 px-2 rounded border border-border bg-card text-sm">
            <option value="all">Tất cả Line</option><option>Line 1</option><option>Line 2</option><option>Line 3</option>
          </select>
          <select value={status} onChange={e => setStatus(e.target.value as "all" | Status)} className="h-9 px-2 rounded border border-border bg-card text-sm">
            <option value="all">Mọi trạng thái</option>
            <option value="draft">Nháp</option><option value="sent">Đã gửi</option>
            <option value="accepted">Chấp nhận</option><option value="rejected">Từ chối</option>
            <option value="expired">Hết hạn</option>
          </select>
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Filter className="size-3.5" />{filtered.length} báo giá</div>
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5">Mã</th>
                <th className="text-left px-4 py-2.5">Khách hàng</th>
                <th className="text-left px-4 py-2.5">Line</th>
                <th className="text-left px-4 py-2.5">Người phụ trách</th>
                <th className="text-right px-4 py-2.5">Giá trị</th>
                <th className="text-left px-4 py-2.5">Hiệu lực</th>
                <th className="text-left px-4 py-2.5">Trạng thái</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const S = STATUS_META[p.status];
                return (
                  <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs cursor-pointer" onClick={() => setSel(p)}>{p.code}</td>
                    <td className="px-4 py-3 cursor-pointer" onClick={() => setSel(p)}>
                      <div className="font-medium">{p.customer}</div>
                      <div className="text-xs text-muted-foreground">{p.contact}</div>
                    </td>
                    <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded bg-muted">{p.line}</span></td>
                    <td className="px-4 py-3 text-xs">{p.owner}</td>
                    <td className="px-4 py-3 text-right font-mono">{fmt(p.total)}</td>
                    <td className="px-4 py-3 text-xs">{p.created} → {p.valid}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded border inline-flex items-center gap-1 ${S.cls}`}>
                        <S.icon className="size-3" />{S.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setEditing(p)} className="p-1.5 rounded hover:bg-muted"><Pencil className="size-3.5" /></button>
                      <button onClick={() => setConfirmDel(p)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="size-3.5" /></button>
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
                <h2 className="font-display font-semibold mt-1 flex items-center gap-1.5"><Building2 className="size-4" />{sel.customer}</h2>
                <span className={`inline-block mt-2 text-[11px] px-2 py-0.5 rounded border ${STATUS_META[sel.status].cls}`}>{STATUS_META[sel.status].label}</span>
              </div>
              <button onClick={() => setSel(null)} className="p-1 rounded hover:bg-muted"><X className="size-4" /></button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><div className="text-[11px] uppercase text-muted-foreground mb-1">Đầu mối</div><div>{sel.contact}</div></div>
                <div><div className="text-[11px] uppercase text-muted-foreground mb-1">Phụ trách</div><div>{sel.owner}</div></div>
                <div><div className="text-[11px] uppercase text-muted-foreground mb-1">Ngày tạo</div><div className="flex items-center gap-1"><Calendar className="size-3.5" />{sel.created}</div></div>
                <div><div className="text-[11px] uppercase text-muted-foreground mb-1">Hiệu lực đến</div><div className="flex items-center gap-1"><Calendar className="size-3.5" />{sel.valid}</div></div>
              </div>
              <div>
                <div className="text-[11px] uppercase text-muted-foreground mb-2">Hạng mục</div>
                <div className="rounded border border-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40">
                      <tr><th className="text-left p-2">Mô tả</th><th className="text-right p-2 w-12">SL</th><th className="text-right p-2 w-28">Đơn giá</th><th className="text-right p-2 w-28">Thành tiền</th></tr>
                    </thead>
                    <tbody>
                      {sel.items.map((l, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="p-2">{l.desc}</td>
                          <td className="p-2 text-right font-mono">{l.qty}</td>
                          <td className="p-2 text-right font-mono">{formatVND(l.price)}</td>
                          <td className="p-2 text-right font-mono">{formatVND(l.qty * l.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/40 font-medium">
                      <tr><td colSpan={3} className="p-2 text-right">Tổng cộng</td><td className="p-2 text-right font-mono">{fmt(selTotal)}</td></tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              {sel.notes && (
                <div className="rounded border border-warning/30 bg-warning/10 p-3 text-xs">
                  <div className="font-medium mb-0.5">Ghi chú</div>{sel.notes}
                </div>
              )}
              <div className="pt-3 border-t border-border grid grid-cols-2 gap-2">
                <button onClick={() => setEditing(sel)} className="h-9 rounded bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5"><Pencil className="size-3.5" />Sửa</button>
                <button onClick={() => setConfirmDel(sel)} className="h-9 rounded border border-destructive/30 text-destructive text-sm flex items-center justify-center gap-1.5"><Trash2 className="size-3.5" />Xóa</button>
                <button className="h-9 rounded border border-border text-sm flex items-center justify-center gap-1.5"><Send className="size-3.5" />Gửi khách</button>
                <button className="h-9 rounded border border-border text-sm flex items-center justify-center gap-1.5"><FileSignature className="size-3.5" />Chuyển HĐ</button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {editing && <QuoteForm quote={editing} onClose={() => setEditing(null)} onSave={save} />}
      {confirmDel && (
        <ConfirmDialog title="Xóa báo giá?" message={`Bạn có chắc muốn xóa "${confirmDel.code}"?`}
          onCancel={() => setConfirmDel(null)} onConfirm={() => remove(confirmDel.id)} />
      )}
    </div>
  );
}

const inp = "w-full h-9 px-2.5 rounded border border-border bg-background text-sm";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="text-[11px] uppercase text-muted-foreground mb-1">{label}</div>{children}</div>;
}

function QuoteForm({ quote, onClose, onSave }: { quote: Quote; onClose: () => void; onSave: (q: Quote) => void }) {
  const [f, setF] = useState<Quote>(quote);
  const isNew = !quote.code;
  const total = f.items.reduce((s, l) => s + l.qty * l.price, 0);
  function setLine(i: number, patch: Partial<QuoteLine>) {
    setF({ ...f, items: f.items.map((l, idx) => idx === i ? { ...l, ...patch } : l) });
  }
  return (
    <div className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-display font-semibold">{isNew ? "Tạo báo giá mới" : "Sửa báo giá"}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="size-4" /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(f); }} className="p-5 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mã báo giá"><input required value={f.code} onChange={e => setF({ ...f, code: e.target.value })} className={inp} /></Field>
            <Field label="Line"><select value={f.line} onChange={e => setF({ ...f, line: e.target.value as Line })} className={inp}><option>Line 1</option><option>Line 2</option><option>Line 3</option></select></Field>
            <Field label="Khách hàng"><input required value={f.customer} onChange={e => setF({ ...f, customer: e.target.value })} className={inp} /></Field>
            <Field label="Đầu mối"><input value={f.contact} onChange={e => setF({ ...f, contact: e.target.value })} className={inp} /></Field>
            <Field label="Phụ trách"><input value={f.owner} onChange={e => setF({ ...f, owner: e.target.value })} className={inp} /></Field>
            <Field label="Trạng thái"><select value={f.status} onChange={e => setF({ ...f, status: e.target.value as Status })} className={inp}>
              <option value="draft">Nháp</option><option value="sent">Đã gửi</option>
              <option value="accepted">Chấp nhận</option><option value="rejected">Từ chối</option><option value="expired">Hết hạn</option>
            </select></Field>
            <Field label="Ngày tạo"><input value={f.created} onChange={e => setF({ ...f, created: e.target.value })} className={inp} placeholder="dd/mm" /></Field>
            <Field label="Hiệu lực đến"><input value={f.valid} onChange={e => setF({ ...f, valid: e.target.value })} className={inp} placeholder="dd/mm" /></Field>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] uppercase text-muted-foreground">Hạng mục</div>
              <button type="button" onClick={() => setF({ ...f, items: [...f.items, { desc: "", qty: 1, price: 0 }] })} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus className="size-3" />Thêm dòng</button>
            </div>
            <div className="space-y-2">
              {f.items.map((l, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input placeholder="Mô tả" value={l.desc} onChange={e => setLine(i, { desc: e.target.value })} className={`${inp} col-span-6`} />
                  <input type="number" value={l.qty} onChange={e => setLine(i, { qty: +e.target.value })} className={`${inp} col-span-2`} />
                  <div className="col-span-3"><CurrencyInput value={l.price} onChange={price => setLine(i, { price })} className={inp} placeholder="Đơn giá" /></div>
                  <button type="button" onClick={() => setF({ ...f, items: f.items.filter((_, idx) => idx !== i) })} className="col-span-1 p-1 text-destructive hover:bg-destructive/10 rounded"><Trash2 className="size-4" /></button>
                </div>
              ))}
            </div>
            <div className="text-right mt-2 text-sm font-medium">Tổng: <span className="font-mono">{fmt(total)}</span></div>
          </div>
          <Field label="Ghi chú"><textarea value={f.notes ?? ""} onChange={e => setF({ ...f, notes: e.target.value })} className={`${inp} min-h-16`} /></Field>
          <div className="pt-3 border-t border-border flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="h-9 px-4 rounded border border-border text-sm">Hủy</button>
            <button type="submit" className="h-9 px-4 rounded bg-primary text-primary-foreground text-sm font-medium">{isNew ? "Tạo" : "Lưu"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
