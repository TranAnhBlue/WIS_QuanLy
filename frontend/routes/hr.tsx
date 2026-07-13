import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Users, UserPlus, Search, Filter, Building2, Briefcase,
  Mail, Phone, MapPin, Calendar, TrendingUp, TrendingDown, Award,
  CheckCircle2, Clock, AlertTriangle, X, Edit3, FileText, Target,
  GraduationCap, MoreHorizontal, Download, Trash2, Save,
} from "lucide-react";
import { message } from "antd";
import { businessApi } from "@/lib/backend-api";

export const Route = createFileRoute("/hr")({
  head: () => ({
    meta: [
      { title: "Nhân sự — WIS" },
      { name: "description", content: "Quản lý nhân sự toàn tập đoàn Line 2, Line 1, Line 3." },
    ],
  }),
  component: HRPage,
});

type Status = "active" | "probation" | "leave" | "resigned";
type Company = "Line 2" | "Line 1" | "Line 3";
type Employee = {
  id: string;
  code: string;
  name: string;
  title: string;
  department: string;
  company: Company;
  email: string;
  phone: string;
  location: string;
  joinedAt: string;
  status: Status;
  manager?: string;
  kpi: number;
  certifications: string[];
  avatar: string;
};

const SEED: Employee[] = [
  { id: "e1", code: "WC-001", name: "Nguyễn Văn A", title: "Tổng giám đốc", department: "Ban giám đốc", company: "Line 2", email: "a.nguyen@wcert.vn", phone: "0901 234 567", location: "Hà Nội", joinedAt: "2018-03-15", status: "active", kpi: 96, certifications: ["ISO 9001 Lead Auditor", "IRCA"], avatar: "NA" },
  { id: "e2", code: "WC-014", name: "Trần Thị B", title: "Giám đốc Phạm vi tiêu chuẩn quy chuẩn", department: "Phạm vi tiêu chuẩn quy chuẩn", company: "Line 2", email: "b.tran@wcert.vn", phone: "0912 345 678", location: "Hà Nội", joinedAt: "2019-06-01", status: "active", manager: "Nguyễn Văn A", kpi: 92, certifications: ["ISO 9001", "ISO 14001", "HACCP"], avatar: "TB" },
  { id: "e3", code: "WC-027", name: "Lê Minh C", title: "Trưởng phòng Kinh doanh", department: "Kinh doanh", company: "Line 2", email: "c.le@wcert.vn", phone: "0987 654 321", location: "Hà Nội", joinedAt: "2020-09-10", status: "active", manager: "Nguyễn Văn A", kpi: 88, certifications: ["ISO 9001"], avatar: "LC" },
  { id: "e4", code: "WC-042", name: "Phạm Thu D", title: "Chuyên viên Đánh giá", department: "Phạm vi tiêu chuẩn quy chuẩn", company: "Line 2", email: "d.pham@wcert.vn", phone: "0934 567 890", location: "Hà Nội", joinedAt: "2021-11-20", status: "active", manager: "Trần Thị B", kpi: 84, certifications: ["ISO 22000"], avatar: "PD" },
  { id: "e5", code: "WC-058", name: "Hoàng Thu E", title: "Chuyên viên Marketing", department: "Marketing", company: "Line 2", email: "e.hoang@wcert.vn", phone: "0966 778 899", location: "TP.HCM", joinedAt: "2022-02-14", status: "active", manager: "Lê Minh C", kpi: 79, certifications: [], avatar: "HE" },
  { id: "e6", code: "SC-003", name: "Vũ Đức F", title: "Giám đốc Line 1", department: "Ban giám đốc", company: "Line 1", email: "f.vu@sctviet.vn", phone: "0945 678 123", location: "Hà Nội", joinedAt: "2019-01-05", status: "active", kpi: 91, certifications: ["ISO 14001", "ISO 45001"], avatar: "VF" },
  { id: "e7", code: "SC-011", name: "Đỗ Thanh G", title: "Trưởng phòng Đào tạo", department: "Đào tạo", company: "Line 1", email: "g.do@sctviet.vn", phone: "0978 123 456", location: "Hà Nội", joinedAt: "2020-04-22", status: "active", manager: "Vũ Đức F", kpi: 87, certifications: ["TOT", "ISO 9001"], avatar: "ĐG" },
  { id: "e8", code: "IC-002", name: "Bùi Quang H", title: "Giám đốc Line 3", department: "Ban giám đốc", company: "Line 3", email: "h.bui@ictviet.vn", phone: "0923 456 789", location: "Sơn La", joinedAt: "2020-07-01", status: "active", kpi: 89, certifications: ["VietGAP", "GlobalGAP"], avatar: "BH" },
  { id: "e9", code: "IC-009", name: "Mai Hồng I", title: "Chuyên viên VietGAP", department: "Nông nghiệp", company: "Line 3", email: "i.mai@ictviet.vn", phone: "0956 789 012", location: "Sơn La", joinedAt: "2022-08-15", status: "probation", manager: "Bùi Quang H", kpi: 72, certifications: ["VietGAP"], avatar: "MI" },
  { id: "e10", code: "WC-063", name: "Đặng Văn K", title: "Kế toán trưởng", department: "Tài chính", company: "Line 2", email: "k.dang@wcert.vn", phone: "0902 345 678", location: "Hà Nội", joinedAt: "2019-10-12", status: "active", manager: "Nguyễn Văn A", kpi: 90, certifications: ["CPA Việt Nam"], avatar: "ĐK" },
  { id: "e11", code: "WC-071", name: "Ngô Thị L", title: "Chuyên viên Nhân sự", department: "Nhân sự", company: "Line 2", email: "l.ngo@wcert.vn", phone: "0915 234 567", location: "Hà Nội", joinedAt: "2023-03-01", status: "active", manager: "Nguyễn Văn A", kpi: 81, certifications: [], avatar: "NL" },
  { id: "e12", code: "SC-018", name: "Trịnh Quốc M", title: "Giảng viên cấp cao", department: "Đào tạo", company: "Line 1", email: "m.trinh@sctviet.vn", phone: "0938 765 432", location: "TP.HCM", joinedAt: "2021-05-18", status: "leave", manager: "Đỗ Thanh G", kpi: 75, certifications: ["ISO 27001", "TOT"], avatar: "TM" },
];

const COMPANIES: ("Tất cả" | Company)[] = ["Tất cả", "Line 2", "Line 1", "Line 3"];
const STATUS_META: Record<Status, { label: string; cls: string; dot: string }> = {
  active: { label: "Đang làm", cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30", dot: "bg-emerald-500" },
  probation: { label: "Thử việc", cls: "bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/30", dot: "bg-amber-500" },
  leave: { label: "Nghỉ phép", cls: "bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-sky-500/30", dot: "bg-sky-500" },
  resigned: { label: "Đã nghỉ", cls: "bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-rose-500/30", dot: "bg-rose-500" },
};

const STORAGE_KEY = "wis_hr_employees";

function avatarFrom(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return (first + last).toUpperCase();
}

function HRPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [company, setCompany] = useState<(typeof COMPANIES)[number]>("Tất cả");
  const [status, setStatus] = useState<"all" | Status>("all");
  const [department, setDepartment] = useState<string>("Tất cả");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Employee | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Employee | null>(null);

  useEffect(() => { businessApi.list<Employee>('employees').then(setEmployees).catch(e => message.error(e.message)); }, []);

  const departments = useMemo(() => ["Tất cả", ...Array.from(new Set(employees.map(e => e.department)))], [employees]);

  const filtered = useMemo(() => employees.filter(e =>
    (company === "Tất cả" || e.company === company) &&
    (status === "all" || e.status === status) &&
    (department === "Tất cả" || e.department === department) &&
    (query.trim() === "" ||
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      e.code.toLowerCase().includes(query.toLowerCase()) ||
      e.title.toLowerCase().includes(query.toLowerCase()))
  ), [employees, company, status, department, query]);

  const stats = useMemo(() => {
    const total = employees.length || 1;
    const active = employees.filter(e => e.status === "active").length;
    const probation = employees.filter(e => e.status === "probation").length;
    const avgKpi = Math.round(employees.reduce((s, e) => s + e.kpi, 0) / total);
    return { total: employees.length, active, probation, avgKpi };
  }, [employees]);

  function openCreate() { setEditTarget(null); setFormOpen(true); }
  function openEdit(emp: Employee) { setEditTarget(emp); setFormOpen(true); setSelected(null); }
  async function saveEmployee(data: Employee) {
    const exists = employees.some(p => p.id === data.id);
    try {
      const saved = exists ? await businessApi.update('employees', data) : await businessApi.create<Employee>('employees', data);
      setEmployees(prev => exists ? prev.map(p => p.id === saved.id ? saved : p) : [saved, ...prev]);
    } catch (e) { message.error(e instanceof Error ? e.message : 'Không thể lưu nhân sự'); return; }
    setFormOpen(false);
    setEditTarget(null);
  }
  async function deleteEmployee(emp: Employee) {
    try { await businessApi.remove('employees', emp.id); } catch (e) { message.error(e instanceof Error ? e.message : 'Không thể xóa'); return; }
    setEmployees(prev => prev.filter(p => p.id !== emp.id));
    setConfirmDelete(null);
    setSelected(null);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-6 py-3">
          <Link to="/" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 hover:bg-muted/50">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-300 ring-1 ring-amber-500/30">
            <Users className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h1 className="text-base font-semibold leading-tight">Quản lý Nhân sự</h1>
            <p className="text-xs text-muted-foreground">Hệ sinh thái xanh · {stats.total} nhân viên · Lưu cục bộ</p>
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium hover:bg-muted/50">
            <Download className="h-3.5 w-3.5" /> Xuất Excel
          </button>
          <button onClick={openCreate} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
            <UserPlus className="h-3.5 w-3.5" /> Thêm nhân viên
          </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-4 p-6">
        <section className="col-span-12 grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard icon={<Users className="h-4 w-4" />} label="Tổng nhân sự" value={stats.total.toString()} hint="3 công ty" tone="amber" trend="cập nhật" up />
          <KpiCard icon={<CheckCircle2 className="h-4 w-4" />} label="Đang làm việc" value={stats.active.toString()} hint={`${Math.round(stats.active / Math.max(stats.total,1) * 100)}% tổng`} tone="emerald" trend="ổn định" />
          <KpiCard icon={<Clock className="h-4 w-4" />} label="Thử việc" value={stats.probation.toString()} hint="cần đánh giá" tone="sky" trend="theo dõi" up />
          <KpiCard icon={<Target className="h-4 w-4" />} label="KPI trung bình" value={`${stats.avgKpi}%`} hint="quý này" tone="violet" trend="+3.2% so QT trước" up />
        </section>

        <section className="col-span-12 rounded-xl border border-border/60 bg-card/60 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Tìm theo tên, mã NV, chức danh..."
                className="h-9 w-full rounded-lg border border-border/60 bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <Pill icon={<Building2 className="h-3.5 w-3.5" />}>
              <select value={company} onChange={e => setCompany(e.target.value as (typeof COMPANIES)[number])} className="bg-transparent text-xs font-medium outline-none">
                {COMPANIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Pill>
            <Pill icon={<Briefcase className="h-3.5 w-3.5" />}>
              <select value={department} onChange={e => setDepartment(e.target.value)} className="bg-transparent text-xs font-medium outline-none">
                {departments.map(d => <option key={d}>{d}</option>)}
              </select>
            </Pill>
            <Pill icon={<Filter className="h-3.5 w-3.5" />}>
              <select value={status} onChange={e => setStatus(e.target.value as "all" | Status)} className="bg-transparent text-xs font-medium outline-none">
                <option value="all">Mọi trạng thái</option>
                <option value="active">Đang làm</option>
                <option value="probation">Thử việc</option>
                <option value="leave">Nghỉ phép</option>
                <option value="resigned">Đã nghỉ</option>
              </select>
            </Pill>
            <div className="ml-auto text-xs text-muted-foreground">{filtered.length} kết quả</div>
          </div>
        </section>

        <section className="col-span-12 overflow-hidden rounded-xl border border-border/60 bg-card/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Nhân viên</th>
                <th className="px-4 py-3 text-left font-medium">Chức danh</th>
                <th className="px-4 py-3 text-left font-medium">Phòng ban</th>
                <th className="px-4 py-3 text-left font-medium">Công ty</th>
                <th className="px-4 py-3 text-left font-medium">Trạng thái</th>
                <th className="px-4 py-3 text-left font-medium">KPI</th>
                <th className="px-4 py-3 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map(e => (
                <tr key={e.id} className="cursor-pointer transition-colors hover:bg-muted/30" onClick={() => setSelected(e)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-sky-500/20 text-xs font-semibold ring-1 ring-border/60">
                        {e.avatar}
                      </div>
                      <div>
                        <div className="font-medium leading-tight">{e.name}</div>
                        <div className="text-xs text-muted-foreground">{e.code} · {e.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{e.title}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{e.department}</td>
                  <td className="px-4 py-3"><span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">{e.company}</span></td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${STATUS_META[e.status].cls}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[e.status].dot}`} />
                      {STATUS_META[e.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                        <div className={`h-full rounded-full ${e.kpi >= 85 ? "bg-emerald-500" : e.kpi >= 75 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${e.kpi}%` }} />
                      </div>
                      <span className="text-xs font-medium tabular-nums">{e.kpi}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1" onClick={ev => ev.stopPropagation()}>
                      <button onClick={() => openEdit(e)} title="Chỉnh sửa" className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setConfirmDelete(e)} title="Xóa" className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setSelected(e)} title="Chi tiết" className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">Không tìm thấy nhân viên phù hợp.</td></tr>
              )}
            </tbody>
          </table>
        </section>
      </div>

      {selected && <EmployeeDrawer employee={selected} onClose={() => setSelected(null)} onEdit={() => openEdit(selected)} onDelete={() => setConfirmDelete(selected)} />}
      {formOpen && <EmployeeFormModal initial={editTarget} onClose={() => { setFormOpen(false); setEditTarget(null); }} onSave={saveEmployee} />}
      {confirmDelete && (
        <ConfirmModal
          title="Xóa nhân viên?"
          message={`Bạn chắc chắn muốn xóa "${confirmDelete.name}" (${confirmDelete.code})? Hành động này không thể hoàn tác.`}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => deleteEmployee(confirmDelete)}
        />
      )}
    </div>
  );
}

function KpiCard({ icon, label, value, hint, tone, trend, up }: { icon: React.ReactNode; label: string; value: string; hint: string; tone: "amber" | "emerald" | "sky" | "violet"; trend: string; up?: boolean }) {
  const tones = {
    amber: "from-amber-500/15 text-amber-600 dark:text-amber-300 ring-amber-500/30",
    emerald: "from-emerald-500/15 text-emerald-600 dark:text-emerald-300 ring-emerald-500/30",
    sky: "from-sky-500/15 text-sky-600 dark:text-sky-300 ring-sky-500/30",
    violet: "from-violet-500/15 text-violet-600 dark:text-violet-300 ring-violet-500/30",
  } as const;
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-4">
      <div className="flex items-center justify-between">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${tones[tone]} ring-1`}>{icon}</div>
        <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${up ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
          {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {trend}
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label} · <span className="opacity-70">{hint}</span></div>
    </div>
  );
}

function Pill({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-2.5 py-1.5">
      <span className="text-muted-foreground">{icon}</span>
      {children}
    </div>
  );
}

function EmployeeDrawer({ employee, onClose, onEdit, onDelete }: { employee: Employee; onClose: () => void; onEdit: () => void; onDelete: () => void }) {
  const meta = STATUS_META[employee.status];
  return (
    <div className="fixed inset-0 z-50 flex">
      <button className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-label="Đóng" />
      <aside className="w-full max-w-md overflow-y-auto border-l border-border/60 bg-card shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-card/95 px-5 py-3 backdrop-blur">
          <div className="text-xs font-medium text-muted-foreground">{employee.code} · {employee.company}</div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-5 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-sky-500/20 text-lg font-semibold ring-1 ring-border/60">{employee.avatar}</div>
            <div className="flex-1">
              <div className="text-lg font-semibold leading-tight">{employee.name}</div>
              <div className="text-sm text-muted-foreground">{employee.title}</div>
              <div className="mt-2 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${meta.cls}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} /> {meta.label}
                </span>
                <span className="text-xs text-muted-foreground">{employee.department}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <Info icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={employee.email} />
            <Info icon={<Phone className="h-3.5 w-3.5" />} label="Điện thoại" value={employee.phone} />
            <Info icon={<MapPin className="h-3.5 w-3.5" />} label="Địa điểm" value={employee.location} />
            <Info icon={<Calendar className="h-3.5 w-3.5" />} label="Vào làm" value={employee.joinedAt} />
          </div>

          {employee.manager && (
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
              <div className="text-xs text-muted-foreground">Quản lý trực tiếp</div>
              <div className="font-medium">{employee.manager}</div>
            </div>
          )}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">KPI quý này</h3>
              <span className="text-sm font-semibold tabular-nums">{employee.kpi}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className={`h-full rounded-full ${employee.kpi >= 85 ? "bg-emerald-500" : employee.kpi >= 75 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${employee.kpi}%` }} />
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              {employee.kpi >= 85 ? <Award className="h-3.5 w-3.5 text-emerald-500" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
              {employee.kpi >= 85 ? "Vượt mục tiêu" : employee.kpi >= 75 ? "Đạt yêu cầu" : "Cần cải thiện"}
            </div>
          </div>

          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
              <GraduationCap className="h-4 w-4 text-muted-foreground" /> Chứng chỉ ({employee.certifications.length})
            </h3>
            {employee.certifications.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 p-3 text-xs text-muted-foreground">Chưa có chứng chỉ chuyên môn.</div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {employee.certifications.map(c => (
                  <span key={c} className="rounded-md bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-300">{c}</span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={onEdit} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
              <Edit3 className="h-3.5 w-3.5" /> Chỉnh sửa
            </button>
            <button onClick={onDelete} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/40 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-500/10">
              <Trash2 className="h-3.5 w-3.5" /> Xóa
            </button>
            <button className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border/60 px-3 py-2 text-sm font-medium hover:bg-muted">
              <FileText className="h-3.5 w-3.5" /> Hồ sơ
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">{icon}{label}</div>
      <div className="mt-0.5 text-sm font-medium truncate">{value}</div>
    </div>
  );
}

function EmployeeFormModal({ initial, onClose, onSave }: { initial: Employee | null; onClose: () => void; onSave: (e: Employee) => void }) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState<Employee>(() => initial ?? {
    id: `e${Date.now()}`,
    code: "",
    name: "",
    title: "",
    department: "",
    company: "Line 2",
    email: "",
    phone: "",
    location: "Hà Nội",
    joinedAt: new Date().toISOString().slice(0, 10),
    status: "probation",
    manager: "",
    kpi: 75,
    certifications: [],
    avatar: "",
  });
  const [certInput, setCertInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof Employee>(key: K, value: Employee[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function addCert() {
    const v = certInput.trim();
    if (!v) return;
    if (form.certifications.includes(v)) { setCertInput(""); return; }
    set("certifications", [...form.certifications, v]);
    setCertInput("");
  }
  function removeCert(c: string) {
    set("certifications", form.certifications.filter(x => x !== c));
  }

  function submit() {
    const err: Record<string, string> = {};
    if (!form.name.trim()) err.name = "Bắt buộc";
    if (!form.code.trim()) err.code = "Bắt buộc";
    if (!form.title.trim()) err.title = "Bắt buộc";
    if (!form.department.trim()) err.department = "Bắt buộc";
    if (!form.email.trim() || !/.+@.+/.test(form.email)) err.email = "Email không hợp lệ";
    setErrors(err);
    if (Object.keys(err).length) return;
    onSave({
      ...form,
      manager: form.manager?.trim() || undefined,
      avatar: form.avatar?.trim() || avatarFrom(form.name),
      kpi: Math.max(0, Math.min(100, Number(form.kpi) || 0)),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-label="Đóng" />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border/60 bg-card shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-border/60 bg-card/95 px-5 py-3 backdrop-blur">
          <div>
            <div className="text-sm font-semibold">{isEdit ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}</div>
            <div className="text-xs text-muted-foreground">Điền thông tin cơ bản — sẽ lưu vào danh sách</div>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3 p-5">
          <Field label="Họ và tên *" error={errors.name}><input value={form.name} onChange={e => set("name", e.target.value)} className={inputCls} placeholder="Nguyễn Văn A" /></Field>
          <Field label="Mã nhân viên *" error={errors.code}><input value={form.code} onChange={e => set("code", e.target.value.toUpperCase())} className={inputCls} placeholder="WC-100" /></Field>
          <Field label="Chức danh *" error={errors.title}><input value={form.title} onChange={e => set("title", e.target.value)} className={inputCls} placeholder="Chuyên viên..." /></Field>
          <Field label="Phòng ban *" error={errors.department}><input value={form.department} onChange={e => set("department", e.target.value)} className={inputCls} placeholder="Kinh doanh" /></Field>
          <Field label="Công ty">
            <select value={form.company} onChange={e => set("company", e.target.value as Company)} className={inputCls}>
              <option>Line 2</option><option>Line 1</option><option>Line 3</option>
            </select>
          </Field>
          <Field label="Trạng thái">
            <select value={form.status} onChange={e => set("status", e.target.value as Status)} className={inputCls}>
              <option value="active">Đang làm</option>
              <option value="probation">Thử việc</option>
              <option value="leave">Nghỉ phép</option>
              <option value="resigned">Đã nghỉ</option>
            </select>
          </Field>
          <Field label="Email *" error={errors.email}><input value={form.email} onChange={e => set("email", e.target.value)} className={inputCls} type="email" placeholder="a@wcert.vn" /></Field>
          <Field label="Số điện thoại"><input value={form.phone} onChange={e => set("phone", e.target.value)} className={inputCls} placeholder="0912..." /></Field>
          <Field label="Địa điểm"><input value={form.location} onChange={e => set("location", e.target.value)} className={inputCls} /></Field>
          <Field label="Ngày vào làm"><input value={form.joinedAt} onChange={e => set("joinedAt", e.target.value)} type="date" className={inputCls} /></Field>
          <Field label="Quản lý trực tiếp"><input value={form.manager ?? ""} onChange={e => set("manager", e.target.value)} className={inputCls} placeholder="Tên quản lý" /></Field>
          <Field label={`KPI (%) — ${form.kpi}`}>
            <input type="range" min={0} max={100} value={form.kpi} onChange={e => set("kpi", Number(e.target.value))} className="w-full accent-amber-500" />
          </Field>

          <div className="col-span-2">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Chứng chỉ chuyên môn</label>
            <div className="flex gap-2">
              <input
                value={certInput}
                onChange={e => setCertInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCert(); } }}
                placeholder="VD: ISO 9001 Lead Auditor"
                className={inputCls + " flex-1"}
              />
              <button type="button" onClick={addCert} className="rounded-lg bg-muted px-3 text-xs font-medium hover:bg-muted/70">Thêm</button>
            </div>
            {form.certifications.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {form.certifications.map(c => (
                  <span key={c} className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-300">
                    {c}
                    <button onClick={() => removeCert(c)} className="hover:text-rose-500"><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border/60 bg-card/95 px-5 py-3 backdrop-blur">
          <button onClick={onClose} className="rounded-lg border border-border/60 px-4 py-2 text-sm font-medium hover:bg-muted">Hủy</button>
          <button onClick={submit} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
            <Save className="h-3.5 w-3.5" /> {isEdit ? "Lưu thay đổi" : "Thêm nhân viên"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls = "h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
      {error && <div className="mt-1 text-[11px] text-rose-600">{error}</div>}
    </div>
  );
}

function ConfirmModal({ title, message, onCancel, onConfirm }: { title: string; message: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} aria-label="Đóng" />
      <div className="relative w-full max-w-sm rounded-2xl border border-border/60 bg-card p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/15 text-rose-600 ring-1 ring-rose-500/30">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">{title}</div>
            <div className="mt-1 text-xs text-muted-foreground">{message}</div>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium hover:bg-muted">Hủy</button>
          <button onClick={onConfirm} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500">Xóa</button>
        </div>
      </div>
    </div>
  );
}
