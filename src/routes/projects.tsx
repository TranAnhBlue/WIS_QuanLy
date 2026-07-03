import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  FolderKanban, ArrowLeft, Search, Plus, Filter, Calendar, User,
  CheckCircle2, AlertTriangle, Clock, X, Pencil, Trash2,
} from "lucide-react";
import { ConfirmDialog } from "./certifications";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Dự án — WIS" },
      { name: "description", content: "Quản lý dự án theo Line 1, Line 2, Line 3." },
    ],
  }),
  component: ProjectsPage,
});

type Line = "Line 1" | "Line 2" | "Line 3";
type Status = "planning" | "on-track" | "at-risk" | "overdue" | "done";

type Project = {
  id: string; code: string; name: string; customer: string; line: Line;
  pm: string; progress: number; status: Status; start: string; due: string;
  budget: number; tasksTotal: number; tasksDone: number;
};

const STORAGE_KEY = "wis_projects";

const INITIAL: Project[] = [
  { id: "p1", code: "WC-2025-041", name: "ISO 9001 — Minh Phú", customer: "Cty TNHH Minh Phú", line: "Line 2", pm: "Nguyễn Văn A", progress: 78, status: "on-track", start: "01/03", due: "12/07", budget: 320, tasksTotal: 42, tasksDone: 33 },
  { id: "p2", code: "WC-2025-038", name: "ISO 22000 — Vinamilk Tiên Sơn", customer: "Vinamilk Tiên Sơn", line: "Line 2", pm: "Trần Thị B", progress: 45, status: "at-risk", start: "10/04", due: "28/06", budget: 480, tasksTotal: 56, tasksDone: 25 },
  { id: "p3", code: "SC-2025-019", name: "Đào tạo Lead Auditor K12", customer: "Học viên công khai", line: "Line 1", pm: "Lê Minh C", progress: 92, status: "on-track", start: "15/05", due: "30/06", budget: 140, tasksTotal: 24, tasksDone: 22 },
  { id: "p4", code: "IC-2025-007", name: "VietGAP — HTX Sơn La", customer: "HTX Nông sản Sơn La", line: "Line 3", pm: "Phạm Quốc D", progress: 22, status: "overdue", start: "01/02", due: "20/06", budget: 210, tasksTotal: 38, tasksDone: 8 },
  { id: "p5", code: "WC-2025-035", name: "HACCP — Thủy sản Bình Định", customer: "Thủy sản Bình Định", line: "Line 2", pm: "Hoàng Thu E", progress: 64, status: "on-track", start: "20/03", due: "05/08", budget: 260, tasksTotal: 44, tasksDone: 28 },
  { id: "p6", code: "IC-2025-021", name: "VietGAP Chăn nuôi Hòa Bình", customer: "HTX Hòa Bình", line: "Line 3", pm: "Phạm Quốc D", progress: 12, status: "planning", start: "10/06", due: "30/09", budget: 180, tasksTotal: 30, tasksDone: 4 },
  { id: "p7", code: "WC-2024-118", name: "ISO 14001 — May Nhà Bè", customer: "Cty CP May Nhà Bè", line: "Line 2", pm: "Bùi Ngọc H", progress: 100, status: "done", start: "05/10/24", due: "20/03", budget: 300, tasksTotal: 50, tasksDone: 50 },
  { id: "p8", code: "SC-2025-024", name: "Coaching KPI — Line 2", customer: "Nội bộ", line: "Line 1", pm: "Lê Minh C", progress: 55, status: "on-track", start: "01/05", due: "15/08", budget: 90, tasksTotal: 20, tasksDone: 11 },
];

const STATUS_META: Record<Status, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  planning:   { label: "Lập kế hoạch", cls: "bg-muted text-muted-foreground border-border", icon: Clock },
  "on-track": { label: "Đúng tiến độ", cls: "bg-success/15 text-success border-success/30", icon: CheckCircle2 },
  "at-risk":  { label: "Rủi ro", cls: "bg-warning/15 text-warning border-warning/30", icon: AlertTriangle },
  overdue:    { label: "Quá hạn", cls: "bg-destructive/15 text-destructive border-destructive/30", icon: AlertTriangle },
  done:       { label: "Hoàn thành", cls: "bg-primary/15 text-primary border-primary/30", icon: CheckCircle2 },
};

const emptyProject = (): Project => ({
  id: crypto.randomUUID(), code: "", name: "", customer: "", line: "Line 2",
  pm: "", progress: 0, status: "planning", start: "", due: "", budget: 0, tasksTotal: 0, tasksDone: 0,
});

function ProjectsPage() {
  const [items, setItems] = useState<Project[]>(INITIAL);
  const [q, setQ] = useState("");
  const [line, setLine] = useState<"all" | Line>("all");
  const [status, setStatus] = useState<"all" | Status>("all");
  const [view, setView] = useState<"table" | "kanban">("table");
  const [sel, setSel] = useState<Project | null>(null);
  const [editing, setEditing] = useState<Project | null>(null);
  const [confirmDel, setConfirmDel] = useState<Project | null>(null);

  useEffect(() => { try { const r = localStorage.getItem(STORAGE_KEY); if (r) setItems(JSON.parse(r)); } catch { /* ignore */ } }, []);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* ignore */ } }, [items]);

  const filtered = useMemo(() => items.filter(p =>
    (line === "all" || p.line === line) &&
    (status === "all" || p.status === status) &&
    (q === "" || (p.code + p.name + p.customer + p.pm).toLowerCase().includes(q.toLowerCase()))
  ), [items, q, line, status]);

  const kpi = {
    total: items.length,
    onTrack: items.filter(p => p.status === "on-track").length,
    atRisk: items.filter(p => p.status === "at-risk" || p.status === "overdue").length,
    done: items.filter(p => p.status === "done").length,
  };

  const columns: { key: Status; label: string }[] = [
    { key: "planning", label: "Kế hoạch" },
    { key: "on-track", label: "Đúng tiến độ" },
    { key: "at-risk", label: "Rủi ro" },
    { key: "overdue", label: "Quá hạn" },
    { key: "done", label: "Hoàn thành" },
  ];

  function save(p: Project) {
    setItems(prev => prev.some(x => x.id === p.id) ? prev.map(x => x.id === p.id ? p : x) : [p, ...prev]);
    setEditing(null); setSel(p);
  }
  function remove(id: string) { setItems(prev => prev.filter(x => x.id !== id)); setConfirmDel(null); setSel(null); }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-3 px-6 h-14">
          <Link to="/" className="p-1.5 rounded hover:bg-muted"><ArrowLeft className="size-4" /></Link>
          <FolderKanban className="size-5 text-primary" />
          <div>
            <h1 className="font-display font-semibold text-sm">Dự án</h1>
            <div className="text-[11px] text-muted-foreground">Điều phối và theo dõi tiến độ toàn tập đoàn</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex rounded border border-border overflow-hidden text-xs">
              <button onClick={() => setView("table")} className={`px-3 h-8 ${view === "table" ? "bg-muted" : "bg-card"}`}>Bảng</button>
              <button onClick={() => setView("kanban")} className={`px-3 h-8 ${view === "kanban" ? "bg-muted" : "bg-card"}`}>Kanban</button>
            </div>
            <button onClick={() => setEditing(emptyProject())} className="flex items-center gap-1.5 h-8 px-3 rounded bg-primary text-primary-foreground text-xs font-medium hover:opacity-90">
              <Plus className="size-3.5" /> Tạo dự án
            </button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Tổng dự án", value: kpi.total, tone: "primary" },
            { label: "Đúng tiến độ", value: kpi.onTrack, tone: "success" },
            { label: "Rủi ro / Quá hạn", value: kpi.atRisk, tone: "warning" },
            { label: "Đã hoàn thành", value: kpi.done, tone: "info" },
          ].map(k => (
            <div key={k.label} className="rounded-lg border border-border bg-card p-4">
              <div className="text-[11px] text-muted-foreground uppercase tracking-wide mb-2">{k.label}</div>
              <div className={`font-display font-semibold text-2xl text-${k.tone}`}>{k.value}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm mã, tên dự án, PM..."
              className="w-full h-9 pl-8 pr-3 rounded border border-border bg-card text-sm" />
          </div>
          <select value={line} onChange={e => setLine(e.target.value as "all" | Line)} className="h-9 px-2 rounded border border-border bg-card text-sm">
            <option value="all">Tất cả Line</option><option>Line 1</option><option>Line 2</option><option>Line 3</option>
          </select>
          <select value={status} onChange={e => setStatus(e.target.value as "all" | Status)} className="h-9 px-2 rounded border border-border bg-card text-sm">
            <option value="all">Mọi trạng thái</option>
            {columns.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Filter className="size-3.5" />{filtered.length} kết quả</div>
        </div>

        {view === "table" ? (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2.5">Mã</th>
                  <th className="text-left px-4 py-2.5">Dự án</th>
                  <th className="text-left px-4 py-2.5">PM</th>
                  <th className="text-left px-4 py-2.5">Line</th>
                  <th className="text-left px-4 py-2.5">Tiến độ</th>
                  <th className="text-left px-4 py-2.5">Hạn</th>
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
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.customer}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">{p.pm}</td>
                      <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded bg-muted">{p.line}</span></td>
                      <td className="px-4 py-3 min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded bg-muted overflow-hidden">
                            <div className={`h-full ${p.progress < 40 ? "bg-destructive" : p.progress < 70 ? "bg-warning" : "bg-success"}`} style={{ width: `${p.progress}%` }} />
                          </div>
                          <span className="text-xs font-mono w-8 text-right">{p.progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">{p.due}</td>
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {columns.map(col => {
              const cards = filtered.filter(p => p.status === col.key);
              return (
                <div key={col.key} className="rounded-lg border border-border bg-card/50 p-2 min-h-[400px]">
                  <div className="flex items-center justify-between px-2 py-1.5 text-xs font-medium">
                    <span>{col.label}</span>
                    <span className="text-muted-foreground">{cards.length}</span>
                  </div>
                  <div className="space-y-2">
                    {cards.map(p => (
                      <button key={p.id} onClick={() => setSel(p)} className="w-full text-left rounded border border-border bg-card p-2.5 hover:border-primary/40">
                        <div className="text-[10px] font-mono text-muted-foreground">{p.code}</div>
                        <div className="text-sm font-medium mt-0.5 line-clamp-2">{p.name}</div>
                        <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1"><User className="size-3" />{p.pm}</span>
                          <span>{p.progress}%</span>
                        </div>
                        <div className="mt-1.5 h-1 rounded bg-muted overflow-hidden">
                          <div className={`h-full ${p.progress < 40 ? "bg-destructive" : p.progress < 70 ? "bg-warning" : "bg-success"}`} style={{ width: `${p.progress}%` }} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {sel && (
        <div className="fixed inset-0 bg-black/40 z-20 flex justify-end" onClick={() => setSel(null)}>
          <aside className="w-full max-w-md h-full bg-card border-l border-border overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-start justify-between">
              <div>
                <div className="text-[11px] font-mono text-muted-foreground">{sel.code}</div>
                <h2 className="font-display font-semibold mt-1">{sel.name}</h2>
                <div className="text-xs text-muted-foreground mt-0.5">{sel.customer}</div>
              </div>
              <button onClick={() => setSel(null)} className="p-1 rounded hover:bg-muted"><X className="size-4" /></button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div>
                <div className="flex justify-between text-xs mb-1"><span>Tiến độ</span><span className="font-mono">{sel.progress}%</span></div>
                <div className="h-2 rounded bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${sel.progress}%` }} /></div>
                <div className="text-[11px] text-muted-foreground mt-1">{sel.tasksDone}/{sel.tasksTotal} công việc hoàn thành</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><div className="text-[11px] uppercase text-muted-foreground mb-1">PM</div><div>{sel.pm}</div></div>
                <div><div className="text-[11px] uppercase text-muted-foreground mb-1">Line</div><div>{sel.line}</div></div>
                <div><div className="text-[11px] uppercase text-muted-foreground mb-1">Bắt đầu</div><div className="flex items-center gap-1"><Calendar className="size-3.5" />{sel.start}</div></div>
                <div><div className="text-[11px] uppercase text-muted-foreground mb-1">Hạn cuối</div><div className="flex items-center gap-1"><Calendar className="size-3.5" />{sel.due}</div></div>
                <div className="col-span-2"><div className="text-[11px] uppercase text-muted-foreground mb-1">Ngân sách</div><div className="font-display font-semibold">₫ {sel.budget} triệu</div></div>
              </div>
              <div className="pt-3 border-t border-border flex gap-2">
                <button onClick={() => setEditing(sel)} className="flex-1 h-9 rounded bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5"><Pencil className="size-3.5" />Sửa</button>
                <button onClick={() => setConfirmDel(sel)} className="h-9 px-3 rounded border border-destructive/30 text-destructive text-sm flex items-center gap-1.5"><Trash2 className="size-3.5" />Xóa</button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {editing && <ProjectForm project={editing} onClose={() => setEditing(null)} onSave={save} />}
      {confirmDel && (
        <ConfirmDialog title="Xóa dự án?" message={`Bạn có chắc muốn xóa "${confirmDel.name}"?`}
          onCancel={() => setConfirmDel(null)} onConfirm={() => remove(confirmDel.id)} />
      )}
    </div>
  );
}

const inp = "w-full h-9 px-2.5 rounded border border-border bg-background text-sm";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="text-[11px] uppercase text-muted-foreground mb-1">{label}</div>{children}</div>;
}

function ProjectForm({ project, onClose, onSave }: { project: Project; onClose: () => void; onSave: (p: Project) => void }) {
  const [f, setF] = useState<Project>(project);
  const isNew = !project.code;
  return (
    <div className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-display font-semibold">{isNew ? "Tạo dự án mới" : "Sửa dự án"}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="size-4" /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(f); }} className="p-5 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mã dự án"><input required value={f.code} onChange={e => setF({ ...f, code: e.target.value })} className={inp} placeholder="WC-2025-050" /></Field>
            <Field label="Line"><select value={f.line} onChange={e => setF({ ...f, line: e.target.value as Line })} className={inp}><option>Line 1</option><option>Line 2</option><option>Line 3</option></select></Field>
          </div>
          <Field label="Tên dự án"><input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} className={inp} /></Field>
          <Field label="Khách hàng"><input required value={f.customer} onChange={e => setF({ ...f, customer: e.target.value })} className={inp} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="PM"><input value={f.pm} onChange={e => setF({ ...f, pm: e.target.value })} className={inp} /></Field>
            <Field label="Trạng thái"><select value={f.status} onChange={e => setF({ ...f, status: e.target.value as Status })} className={inp}>
              <option value="planning">Lập kế hoạch</option><option value="on-track">Đúng tiến độ</option>
              <option value="at-risk">Rủi ro</option><option value="overdue">Quá hạn</option><option value="done">Hoàn thành</option>
            </select></Field>
            <Field label="Bắt đầu"><input value={f.start} onChange={e => setF({ ...f, start: e.target.value })} className={inp} placeholder="dd/mm" /></Field>
            <Field label="Hạn cuối"><input value={f.due} onChange={e => setF({ ...f, due: e.target.value })} className={inp} placeholder="dd/mm" /></Field>
            <Field label={`Tiến độ ${f.progress}%`}><input type="range" min={0} max={100} value={f.progress} onChange={e => setF({ ...f, progress: +e.target.value })} className="w-full" /></Field>
            <Field label="Ngân sách (triệu)"><input type="number" value={f.budget} onChange={e => setF({ ...f, budget: +e.target.value })} className={inp} /></Field>
            <Field label="Số task"><input type="number" value={f.tasksTotal} onChange={e => setF({ ...f, tasksTotal: +e.target.value })} className={inp} /></Field>
            <Field label="Task hoàn thành"><input type="number" value={f.tasksDone} onChange={e => setF({ ...f, tasksDone: +e.target.value })} className={inp} /></Field>
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
