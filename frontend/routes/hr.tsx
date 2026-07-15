import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Users, UserPlus, Search, Filter, Building2, Briefcase,
  Mail, Phone, MapPin, Calendar, TrendingUp, TrendingDown, Award,
  CheckCircle2, Clock, AlertTriangle, X, Edit3, FileText, Target,
  GraduationCap, MoreHorizontal, Download, Trash2, Save,
} from "lucide-react";
import { message } from "antd";
import { apiRequest } from "@/lib/backend-api";
import { type Company as AccountCompany, type Role } from "@/lib/permissions";
import { useAuth } from "@/contexts/AuthContext";
import { AppDatePicker, isValidDateValue, parseDateValue } from "@/components/ui/app-date-picker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/hr")({
  head: () => ({
    meta: [
      { title: "Nhân sự - WIS" },
      { name: "description", content: "Quản lý nhân sự toàn tập đoàn Line 2, Line 1, Line 3." },
    ],
  }),
  component: HRPage,
});

type Status = "active" | "probation" | "leave" | "resigned";
type Company = string;
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
  role?: Role;
  companyCode?: AccountCompany;
  departmentCode?: string;
};

const ALL = "Tất cả";
const STATUS_META: Record<Status, { label: string; cls: string; dot: string }> = {
  active: { label: "Đang làm", cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30", dot: "bg-emerald-500" },
  probation: { label: "Thử việc", cls: "bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/30", dot: "bg-amber-500" },
  leave: { label: "Nghỉ phép", cls: "bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-sky-500/30", dot: "bg-sky-500" },
  resigned: { label: "Đã nghỉ", cls: "bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-rose-500/30", dot: "bg-rose-500" },
};

type HrAccount = {
  id: string;
  name: string;
  email: string;
  role: Role;
  company: AccountCompany;
  department: string;
  phone?: string;
  avatar?: string;
  joinDate?: string;
  createdAt?: string;
  status: "active" | "inactive";
  kpi?: number;
  certifications?: string[];
};

const ROLE_LABELS: Record<Role, string> = {
  intern: "Thực tập sinh",
  staff: "Nhân viên",
  specialist: "Chuyên viên",
  senior_specialist: "Chuyên viên cao cấp",
  team_leader: "Trưởng nhóm",
  dept_deputy: "Phó phòng",
  dept_manager: "Trưởng phòng",
  company_deputy: "Phó Giám đốc công ty",
  company_ceo: "Giám đốc công ty",
  group_admin: "Quản trị hệ thống",
  group_director: "Giám đốc điều hành",
  group_ceo: "Tổng Giám đốc",
};

const COMPANY_LABELS: Record<AccountCompany, string> = {
  WIS_GROUP: "Tập đoàn WIS",
  WCERT: "LINE 2",
  SCT_VIET: "LINE 1",
  ICT_VIET: "LINE 3",
};

const DEPARTMENT_LABELS: Record<string, string> = {
  WIS_EXECUTIVE: "Ban Điều hành",
  WIS_IT: "Phòng Công nghệ thông tin",
  WIS_HR: "Phòng Nhân sự",
  WIS_ADMIN: "Phòng Hành chính",
  WIS_FINANCE: "Phòng Tài chính",
  WCERT_TECHNICAL: "Phòng Kỹ thuật chứng nhận",
  WCERT_SALES: "Phòng Kinh doanh",
  WCERT_ACCOUNTING: "Phòng Kế toán",
  WCERT_OFFICE: "Phòng Hành chính",
  WCERT_AUDIT: "Phòng Đánh giá",
  WCERT_CERT: "Phòng Chứng nhận",
  WCERT_TRAINING: "Phòng Đào tạo",
  SCT_CONSULTING: "Phòng Tư vấn",
  SCT_TRAINING: "Phòng Đào tạo",
  SCT_SCIENCE: "Phòng Nhiệm vụ khoa học",
  SCT_LEGAL: "Phòng Pháp lý và bảo hộ",
  SCT_ADMIN: "Phòng Hành chính",
  ICT_TOURISM: "Phòng Du lịch",
  ICT_CONSULTING: "Phòng Tư vấn",
  ICT_VIETGAP: "Phòng VietGAP",
  ICT_TRADEMARK: "Phòng Nhãn hiệu",
  ICT_LEGAL: "Phòng Pháp lý",
  ICT_ORGANIC: "Phòng Hữu cơ",
  ICT_ADMIN: "Phòng Hành chính",
};

const COMPANY_DEPARTMENTS: Record<AccountCompany, string[]> = {
  WIS_GROUP: ["WIS_EXECUTIVE", "WIS_IT", "WIS_HR"],
  WCERT: ["WCERT_TECHNICAL", "WCERT_SALES", "WCERT_ACCOUNTING", "WCERT_OFFICE", "WCERT_AUDIT", "WCERT_TRAINING"],
  SCT_VIET: ["SCT_CONSULTING", "SCT_TRAINING", "SCT_SCIENCE", "SCT_LEGAL"],
  ICT_VIET: ["ICT_TOURISM", "ICT_CONSULTING", "ICT_VIETGAP", "ICT_TRADEMARK", "ICT_LEGAL", "ICT_ORGANIC", "ICT_ADMIN"],
};

function accountToEmployee(account: HrAccount): Employee {
  return {
    id: account.id,
    code: account.email.split("@")[0].toUpperCase(),
    name: account.name,
    title: ROLE_LABELS[account.role] ?? account.role,
    department: DEPARTMENT_LABELS[account.department] ?? account.department.replaceAll("_", " "),
    company: COMPANY_LABELS[account.company] ?? account.company,
    email: account.email,
    phone: account.phone || "—",
    location: COMPANY_LABELS[account.company] || "—",
    joinedAt: (account.joinDate || account.createdAt || "").slice(0, 10) || "—",
    status: account.status === "active" ? "active" : "resigned",
    kpi: Number(account.kpi) || 0,
    certifications: account.certifications || [],
    avatar: account.avatar || "",
    role: account.role,
    companyCode: account.company,
    departmentCode: account.department,
  };
}

function avatarFrom(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return (first + last).toUpperCase();
}

function HRPage() {
  const { hasPermission, user: currentUser } = useAuth();
  const canManage = hasPermission("manage_hr");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [company, setCompany] = useState<string>(ALL);
  const [status, setStatus] = useState<"all" | Status>("all");
  const [department, setDepartment] = useState<string>("Tất cả");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Employee | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Employee | null>(null);

  const loadEmployees = () => {
    apiRequest<{ employees: HrAccount[] }>("/api/hr/employees")
      .then(({ employees }) => setEmployees(employees.map(accountToEmployee)))
      .catch(e => message.error(e instanceof Error ? e.message : "Không thể tải danh sách nhân sự"));
  };
  useEffect(loadEmployees, []);

  const companies = useMemo(() => [ALL, ...Array.from(new Set(employees.map(e => e.company)))], [employees]);
  const departments = useMemo(() => [ALL, ...Array.from(new Set(employees.map(e => e.department)))], [employees]);

  const filtered = useMemo(() => employees.filter(e =>
    (company === ALL || e.company === company) &&
    (status === "all" || e.status === status) &&
    (department === ALL || e.department === department) &&
    (query.trim() === "" ||
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      e.code.toLowerCase().includes(query.toLowerCase()) ||
      e.title.toLowerCase().includes(query.toLowerCase()))
  ), [employees, company, status, department, query]);

  const stats = useMemo(() => {
    const total = employees.length || 1;
    const active = employees.filter(e => e.status === "active").length;
    const inactive = employees.filter(e => e.status !== "active").length;
    const companyCount = new Set(employees.map(e => e.company)).size;
    return { total: employees.length, active, inactive, companyCount };
  }, [employees]);

  function openCreate() {
    setEditTarget(null);
    setFormOpen(true);
  }

  function openEdit(employee: Employee) {
    setEditTarget(employee);
    setSelected(null);
    setFormOpen(true);
  }

  async function saveEmployee(data: EmployeeAccountFormData) {
    try {
      const path = editTarget ? `/api/hr/employees/${editTarget.id}` : "/api/hr/employees";
      await apiRequest(path, {
        method: editTarget ? "PUT" : "POST",
        body: JSON.stringify(data),
      });
      message.success(editTarget ? "Đã cập nhật nhân sự" : "Đã thêm nhân sự");
      setFormOpen(false);
      setEditTarget(null);
      loadEmployees();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Không thể lưu nhân sự");
    }
  }

  async function deleteEmployee(employee: Employee) {
    try {
      await apiRequest(`/api/hr/employees/${employee.id}`, { method: "DELETE" });
      message.success("Đã xóa nhân sự");
      setConfirmDelete(null);
      setSelected(null);
      loadEmployees();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Không thể xóa nhân sự");
    }
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
            <p className="text-xs text-muted-foreground">Hệ sinh thái xanh · {stats.total} nhân sự từ tài khoản hệ thống</p>
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium hover:bg-muted/50">
            <Download className="h-3.5 w-3.5" /> Xuất Excel
          </button>
          {canManage && (
            <button onClick={openCreate} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
              <UserPlus className="h-3.5 w-3.5" /> Thêm nhân sự
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-12 gap-4 p-6">
        <section className="col-span-12 grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard icon={<Users className="h-4 w-4" />} label="Tổng nhân sự" value={stats.total.toString()} hint={`${stats.companyCount} đơn vị`} tone="amber" trend="cập nhật" up />
          <KpiCard icon={<CheckCircle2 className="h-4 w-4" />} label="Đang làm việc" value={stats.active.toString()} hint={`${Math.round(stats.active / Math.max(stats.total,1) * 100)}% tổng`} tone="emerald" trend="ổn định" />
          <KpiCard icon={<Clock className="h-4 w-4" />} label="Ngừng hoạt động" value={stats.inactive.toString()} hint="tài khoản" tone="sky" trend="theo dõi" />
          <KpiCard icon={<Building2 className="h-4 w-4" />} label="Đơn vị" value={stats.companyCount.toString()} hint="trong hệ thống" tone="violet" trend="đang quản lý" />
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
              <select value={company} onChange={e => setCompany(e.target.value)} className="hr-select bg-transparent text-xs font-medium text-foreground outline-none">
                {companies.map(c => <option className="bg-card text-foreground" key={c}>{c}</option>)}
              </select>
            </Pill>
            <Pill icon={<Briefcase className="h-3.5 w-3.5" />}>
              <select value={department} onChange={e => setDepartment(e.target.value)} className="hr-select bg-transparent text-xs font-medium text-foreground outline-none">
                {departments.map(d => <option className="bg-card text-foreground" key={d}>{d}</option>)}
              </select>
            </Pill>
            <Pill icon={<Filter className="h-3.5 w-3.5" />}>
              <select value={status} onChange={e => setStatus(e.target.value as "all" | Status)} className="hr-select bg-transparent text-xs font-medium text-foreground outline-none">
                <option className="bg-card text-foreground" value="all">Mọi trạng thái</option>
                <option className="bg-card text-foreground" value="active">Đang làm</option>
                <option className="bg-card text-foreground" value="resigned">Đã nghỉ</option>
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
                <th className="px-4 py-3 text-left font-medium">Liên hệ</th>
                <th className="px-4 py-3 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map(e => (
                <tr key={e.id} className="cursor-pointer transition-colors hover:bg-muted/30" onClick={() => { window.location.href = `/details/hr/${e.id}`; }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 ring-1 ring-border/60">
                        <AvatarImage src={e.avatar} alt={e.name} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-br from-amber-500/20 to-sky-500/20 text-xs font-semibold">{avatarFrom(e.name)}</AvatarFallback>
                      </Avatar>
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
                  <td className="px-4 py-3 text-xs text-muted-foreground">{e.phone}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1" onClick={ev => ev.stopPropagation()}>
                      {canManage && (e.role !== "group_admin" || currentUser?.role === "group_admin") && (
                        <button onClick={() => openEdit(e)} title="Chỉnh sửa" className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {canManage && (e.role !== "group_admin" || currentUser?.role === "group_admin") && (
                        <button onClick={() => setConfirmDelete(e)} title="Xóa" className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <Link to="/details/$module/$id" params={{ module: "hr", id: e.id }} onClick={(event) => event.stopPropagation()} title="Chi tiết" className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </Link>
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

      {selected && <EmployeeDrawer employee={selected} onClose={() => setSelected(null)} onEdit={canManage && (selected.role !== "group_admin" || currentUser?.role === "group_admin") ? () => openEdit(selected) : undefined} onDelete={canManage && (selected.role !== "group_admin" || currentUser?.role === "group_admin") ? () => setConfirmDelete(selected) : undefined} />}
      {formOpen && <EmployeeAccountModal initial={editTarget} onClose={() => { setFormOpen(false); setEditTarget(null); }} onSave={saveEmployee} />}
      {confirmDelete && (
        <ConfirmModal
          title="Xóa nhân sự?"
          message={`Bạn chắc chắn muốn xóa "${confirmDelete.name}"? Tài khoản đăng nhập tương ứng cũng sẽ bị xóa.`}
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

function EmployeeDrawer({ employee, onClose, onEdit, onDelete }: { employee: Employee; onClose: () => void; onEdit?: () => void; onDelete?: () => void }) {
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
            <Avatar className="h-16 w-16 rounded-2xl ring-1 ring-border/60">
              <AvatarImage src={employee.avatar} alt={employee.name} className="object-cover" />
              <AvatarFallback className="rounded-2xl bg-gradient-to-br from-amber-500/20 to-sky-500/20 text-lg font-semibold">{avatarFrom(employee.name)}</AvatarFallback>
            </Avatar>
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

          <div className="flex gap-2 pt-2">
            {onEdit && (
              <button onClick={onEdit} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
                <Edit3 className="h-3.5 w-3.5" /> Chỉnh sửa
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/40 px-3 py-2 text-sm font-medium text-rose-500 hover:bg-rose-500/10">
                <Trash2 className="h-3.5 w-3.5" /> Xóa
              </button>
            )}
            <button className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border/60 px-3 py-2 text-sm font-medium hover:bg-muted">
              <FileText className="h-3.5 w-3.5" /> Hồ sơ
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

type EmployeeAccountFormData = {
  name: string;
  email: string;
  password?: string;
  role: Role;
  company: AccountCompany;
  department: string;
  phone: string;
  status: "active" | "inactive";
  joinDate: string;
};

function EmployeeAccountModal({ initial, onClose, onSave }: {
  initial: Employee | null;
  onClose: () => void;
  onSave: (data: EmployeeAccountFormData) => void;
}) {
  const { user: currentUser } = useAuth();
  const isEdit = Boolean(initial);
  const defaultCompany = initial?.companyCode ?? "WIS_GROUP";
  const [form, setForm] = useState<EmployeeAccountFormData>({
    name: initial?.name ?? "",
    email: initial?.email ?? "",
    password: "",
    role: initial?.role ?? "staff",
    company: defaultCompany,
    department: initial?.departmentCode ?? COMPANY_DEPARTMENTS[defaultCompany][0],
    phone: initial?.phone === "—" ? "" : initial?.phone ?? "",
    status: initial?.status === "resigned" ? "inactive" : "active",
    joinDate: initial?.joinedAt === "—" ? new Date().toISOString().slice(0, 10) : initial?.joinedAt ?? new Date().toISOString().slice(0, 10),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update<K extends keyof EmployeeAccountFormData>(key: K, value: EmployeeAccountFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function changeCompany(company: AccountCompany) {
    setForm(prev => ({ ...prev, company, department: COMPANY_DEPARTMENTS[company][0] }));
  }

  function submit() {
    const nextErrors: Record<string, string> = {};
    if (form.name.trim().length < 2) nextErrors.name = "Vui lòng nhập họ tên";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = "Email không hợp lệ";
    if (!isEdit && (!form.password || form.password.length < 6)) nextErrors.password = "Mật khẩu cần ít nhất 6 ký tự";
    if (form.password && form.password.length < 6) nextErrors.password = "Mật khẩu cần ít nhất 6 ký tự";
    if (form.phone && !/^[0-9]{10,11}$/.test(form.phone)) nextErrors.phone = "Số điện thoại cần 10–11 chữ số";
    if (!isValidDateValue(form.joinDate)) nextErrors.joinDate = "Ngày vào làm không hợp lệ";
    if (parseDateValue(form.joinDate)?.isAfter(new Date(), "day")) nextErrors.joinDate = "Ngày vào làm không được ở tương lai";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) onSave({ ...form, password: form.password || undefined });
  }

  const selectCls = `${inputCls} hr-select text-foreground`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-label="Đóng" />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border/60 bg-card shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-card/95 px-5 py-3 backdrop-blur">
          <div>
            <div className="text-sm font-semibold">{isEdit ? "Cập nhật nhân sự" : "Thêm nhân sự"}</div>
            <div className="text-xs text-muted-foreground">Dữ liệu được đồng bộ với tài khoản hệ thống</div>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2">
          <Field label="Họ và tên *" error={errors.name}><input className={inputCls} value={form.name} onChange={e => update("name", e.target.value)} /></Field>
          <Field label="Email *" error={errors.email}><input className={inputCls} type="email" value={form.email} onChange={e => update("email", e.target.value)} /></Field>
          <Field label={isEdit ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu *"} error={errors.password}><input className={inputCls} type="password" value={form.password} onChange={e => update("password", e.target.value)} /></Field>
          <Field label="Số điện thoại" error={errors.phone}><input className={inputCls} value={form.phone} onChange={e => update("phone", e.target.value.replace(/\D/g, ""))} /></Field>
          <Field label="Vai trò">
            <select className={selectCls} value={form.role} onChange={e => update("role", e.target.value as Role)}>
              {(Object.keys(ROLE_LABELS) as Role[])
                .filter(role => role !== "group_admin" || currentUser?.role === "group_admin")
                .map(role => <option className="bg-card text-foreground" key={role} value={role}>{ROLE_LABELS[role]}</option>)}
            </select>
          </Field>
          <Field label="Công ty">
            <select className={selectCls} value={form.company} onChange={e => changeCompany(e.target.value as AccountCompany)}>
              {(Object.keys(COMPANY_LABELS) as AccountCompany[]).map(company => <option className="bg-card text-foreground" key={company} value={company}>{COMPANY_LABELS[company]}</option>)}
            </select>
          </Field>
          <Field label="Phòng ban">
            <select className={selectCls} value={form.department} onChange={e => update("department", e.target.value)}>
              {COMPANY_DEPARTMENTS[form.company].map(department => <option className="bg-card text-foreground" key={department} value={department}>{DEPARTMENT_LABELS[department] ?? department}</option>)}
            </select>
          </Field>
          <Field label="Trạng thái">
            <select className={selectCls} value={form.status} onChange={e => update("status", e.target.value as "active" | "inactive")}>
              <option className="bg-card text-foreground" value="active">Đang làm việc</option>
              <option className="bg-card text-foreground" value="inactive">Ngừng hoạt động</option>
            </select>
          </Field>
          <Field label="Ngày vào làm" error={errors.joinDate}><AppDatePicker value={form.joinDate} outputFormat="YYYY-MM-DD" onChange={joinDate => update("joinDate", joinDate)} /></Field>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border/60 bg-card/95 px-5 py-3 backdrop-blur">
          <button onClick={onClose} className="rounded-lg border border-border/60 px-4 py-2 text-sm font-medium hover:bg-muted">Hủy</button>
          <button onClick={submit} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
            <Save className="h-3.5 w-3.5" /> {isEdit ? "Lưu thay đổi" : "Thêm nhân sự"}
          </button>
        </div>
      </div>
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
          <Field label="Ngày vào làm"><AppDatePicker value={form.joinedAt} outputFormat="YYYY-MM-DD" onChange={joinedAt => set("joinedAt", joinedAt)} /></Field>
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
