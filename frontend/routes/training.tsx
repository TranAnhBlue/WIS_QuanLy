import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  GraduationCap, ArrowLeft, Search, Plus, Filter, Users, Clock, BookOpen,
  PlayCircle, FileText, Award, CheckCircle2, Calendar, TrendingUp,
  ChevronRight, Star, Download, BarChart3, Target, AlertCircle, X,
  Video, FileSpreadsheet, Briefcase, Sparkles,
} from "lucide-react";
import { message } from "antd";
import { businessApi } from "@/lib/backend-api";

export const Route = createFileRoute("/training")({
  head: () => ({
    meta: [
      { title: "Đào tạo — WIS" },
      { name: "description", content: "Hệ thống quản lý đào tạo nội bộ và đào tạo khách hàng của tập đoàn Line 2." },
    ],
  }),
  component: TrainingPage,
});

type Status = "draft" | "open" | "running" | "done";
type Category = "internal" | "external" | "certification" | "compliance";

type Course = {
  id: string;
  code: string;
  title: string;
  category: Category;
  company: "Line 2" | "Line 1" | "Line 3" | "Tập đoàn";
  instructor: string;
  startDate: string;
  duration: string; // "16h" / "3 ngày"
  lessons: number;
  enrolled: number;
  capacity: number;
  progress: number; // 0-100
  status: Status;
  format: "Online" | "Offline" | "Hybrid";
  price?: number; // for external courses, million VND
  rating?: number;
};

const COURSES: Course[] = [
  { id: "c1", code: "WC-ISO-9001-26.07", title: "Chuyên gia đánh giá nội bộ ISO 9001:2015", category: "certification", company: "Line 2", instructor: "TS. Nguyễn Văn A", startDate: "05/07/2026", duration: "24h / 3 ngày", lessons: 12, enrolled: 28, capacity: 30, progress: 65, status: "running", format: "Hybrid", price: 4.5, rating: 4.8 },
  { id: "c2", code: "SCT-VGAP-26.06", title: "Tập huấn VietGAP trồng trọt — Sơn La", category: "external", company: "Line 1", instructor: "ThS. Trần Thị B", startDate: "20/06/2026", duration: "16h / 2 ngày", lessons: 8, enrolled: 45, capacity: 50, progress: 100, status: "done", format: "Offline", price: 2.8, rating: 4.9 },
  { id: "c3", code: "IC-HACCP-26.07", title: "HACCP cho doanh nghiệp thực phẩm", category: "certification", company: "Line 3", instructor: "TS. Lê Minh C", startDate: "12/07/2026", duration: "32h / 4 ngày", lessons: 16, enrolled: 18, capacity: 25, progress: 0, status: "open", format: "Online", price: 5.2 },
  { id: "c4", code: "GR-ONBOARD-26", title: "Onboarding nhân sự mới — Hệ sinh thái xanh", category: "internal", company: "Tập đoàn", instructor: "Phòng Nhân sự", startDate: "Liên tục", duration: "8h", lessons: 6, enrolled: 12, capacity: 20, progress: 42, status: "running", format: "Online" },
  { id: "c5", code: "WC-14001-26.08", title: "ISO 14001 — Hệ thống quản lý môi trường", category: "certification", company: "Line 2", instructor: "ThS. Phạm Thu D", startDate: "10/08/2026", duration: "24h / 3 ngày", lessons: 12, enrolled: 8, capacity: 30, progress: 0, status: "open", format: "Hybrid", price: 4.5 },
  { id: "c6", code: "GR-COMPLY-26", title: "Tuân thủ & Đạo đức nghề nghiệp", category: "compliance", company: "Tập đoàn", instructor: "Phòng Bảo hộ", startDate: "Bắt buộc Q3", duration: "4h", lessons: 4, enrolled: 156, capacity: 180, progress: 87, status: "running", format: "Online" },
  { id: "c7", code: "SCT-22000-26.09", title: "ISO 22000 — An toàn thực phẩm", category: "external", company: "Line 1", instructor: "TS. Hoàng Văn E", startDate: "15/09/2026", duration: "24h / 3 ngày", lessons: 14, enrolled: 0, capacity: 25, progress: 0, status: "draft", format: "Offline", price: 5.8 },
  { id: "c8", code: "IC-CYBER-26.07", title: "An toàn thông tin ISO 27001 — Foundation", category: "certification", company: "Line 3", instructor: "ThS. Vũ Quang F", startDate: "28/07/2026", duration: "16h / 2 ngày", lessons: 10, enrolled: 22, capacity: 25, progress: 15, status: "running", format: "Online", price: 3.8, rating: 4.7 },
];

const KPI = [
  { label: "Khóa đang chạy", value: 14, delta: "+3", icon: PlayCircle, color: "text-info" },
  { label: "Học viên tháng này", value: 289, delta: "+18%", icon: Users, color: "text-success" },
  { label: "Tỉ lệ hoàn thành", value: "87%", delta: "+4 pts", icon: CheckCircle2, color: "text-primary" },
  { label: "Doanh thu đào tạo", value: "₫ 412M", delta: "+12.4%", icon: TrendingUp, color: "text-warning" },
];

const CAT_META: Record<Category, { label: string; cls: string }> = {
  internal: { label: "Nội bộ", cls: "bg-info/15 text-info border-info/30" },
  external: { label: "Khách hàng", cls: "bg-success/15 text-success border-success/30" },
  certification: { label: "Phạm vi tiêu chuẩn quy chuẩn", cls: "bg-primary/15 text-primary border-primary/30" },
  compliance: { label: "Tuân thủ", cls: "bg-warning/15 text-warning border-warning/30" },
};

const STATUS_META: Record<Status, { label: string; cls: string; dot: string }> = {
  draft: { label: "Nháp", cls: "text-muted-foreground", dot: "bg-muted-foreground" },
  open: { label: "Mở đăng ký", cls: "text-info", dot: "bg-info" },
  running: { label: "Đang diễn ra", cls: "text-success", dot: "bg-success animate-pulse-dot" },
  done: { label: "Hoàn thành", cls: "text-muted-foreground", dot: "bg-muted-foreground" },
};

const FILTERS = [
  { id: "all", label: "Tất cả" },
  { id: "internal", label: "Nội bộ" },
  { id: "external", label: "Khách hàng" },
  { id: "certification", label: "Phạm vi tiêu chuẩn quy chuẩn" },
  { id: "compliance", label: "Tuân thủ" },
] as const;

const UPCOMING = [
  { date: "05/07", title: "Khai giảng ISO 9001 K7", who: "28 học viên • Phòng họp trung tâm" },
  { date: "12/07", title: "HACCP — Buổi 1", who: "Vinamilk Bình Dương" },
  { date: "20/07", title: "Thi cuối khóa VietGAP", who: "45 học viên • Sơn La" },
  { date: "28/07", title: "ISO 27001 Foundation", who: "22 học viên • Online" },
];

const MY_LEARNING = [
  { title: "Onboarding nhân sự mới", lesson: "Bài 3/6 — Quy trình ERP", progress: 50 },
  { title: "Tuân thủ & Đạo đức", lesson: "Bài 4/4 — Bài kiểm tra cuối", progress: 75 },
  { title: "Kỹ năng tư vấn ISO", lesson: "Bài 2/8 — Phỏng vấn KH", progress: 25 },
];

function TrainingPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filter, setFilter] = useState<typeof FILTERS[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Course | null>(null);

  useEffect(() => { businessApi.list<Course>('trainings').then(setCourses).catch(e => message.error(e.message)); }, []);

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      if (filter !== "all" && c.category !== filter) return false;
      if (query && !`${c.title} ${c.code} ${c.instructor}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [courses, filter, query]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="h-14 border-b border-border bg-sidebar/60 backdrop-blur flex items-center px-4 gap-3 sticky top-0 z-20">
        <Link to="/" className="size-8 rounded-md hover:bg-sidebar-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="size-4" />
        </Link>
        <div className="size-8 rounded-md bg-primary/15 text-primary flex items-center justify-center">
          <GraduationCap className="size-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">Đào tạo</span>
          <span className="text-[11px] text-muted-foreground">WIS · Học viện WIS</span>
        </div>

        <div className="ml-6 relative w-80">
          <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm khóa học, mã, giảng viên..."
            className="w-full h-9 pl-8 pr-3 rounded-md bg-input/50 border border-border text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button className="h-9 px-3 rounded-md border border-border hover:bg-sidebar-accent text-sm flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
            <Download className="size-4" /> Xuất báo cáo
          </button>
          <button className="h-9 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium flex items-center gap-2 transition">
            <Plus className="size-4" /> Tạo khóa học
          </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-[1fr_320px] gap-4 p-4">
        {/* Main */}
        <main className="space-y-4 min-w-0">
          {/* KPI row */}
          <div className="grid grid-cols-4 gap-3">
            {KPI.map((k) => {
              const Icon = k.icon;
              return (
                <div key={k.label} className="kpi-tile kpi-tile-hover p-4 animate-count-up">
                  <div className="flex items-start justify-between">
                    <div className="text-xs text-muted-foreground">{k.label}</div>
                    <Icon className={`size-4 ${k.color}`} />
                  </div>
                  <div className="mt-2 font-display text-2xl font-semibold">{k.value}</div>
                  <div className="mt-1 text-[11px] text-success flex items-center gap-1">
                    <TrendingUp className="size-3" /> {k.delta} vs tháng trước
                  </div>
                </div>
              );
            })}
          </div>

          {/* Filters */}
          <div className="surface-card p-3 flex items-center gap-2 flex-wrap">
            <Filter className="size-4 text-muted-foreground" />
            {FILTERS.map((f) => {
              const active = filter === f.id;
              const count = f.id === "all" ? courses.length : courses.filter(c => c.category === f.id).length;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`h-8 px-3 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                    active ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {f.label}
                  <span className={`text-[10px] font-mono px-1 rounded ${active ? "bg-primary-foreground/20" : "bg-background/60"}`}>{count}</span>
                </button>
              );
            })}
            <div className="ml-auto text-xs text-muted-foreground">
              Hiển thị <span className="text-foreground font-medium">{filtered.length}</span> khóa học
            </div>
          </div>

          {/* Courses grid */}
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((c) => {
              const cat = CAT_META[c.category];
              const st = STATUS_META[c.status];
              return (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className="surface-card text-left p-4 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${cat.cls}`}>{cat.label}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{c.code}</span>
                    </div>
                    <span className={`text-[10px] flex items-center gap-1 ${st.cls}`}>
                      <span className={`size-1.5 rounded-full ${st.dot}`} /> {st.label}
                    </span>
                  </div>

                  <h3 className="mt-2 font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition">
                    {c.title}
                  </h3>

                  <div className="mt-2 text-[11px] text-muted-foreground flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1"><Briefcase className="size-3" /> {c.company}</span>
                    <span className="flex items-center gap-1"><Clock className="size-3" /> {c.duration}</span>
                    <span className="flex items-center gap-1"><BookOpen className="size-3" /> {c.lessons} bài</span>
                    <span className="flex items-center gap-1">
                      {c.format === "Online" ? <Video className="size-3" /> : c.format === "Offline" ? <Users className="size-3" /> : <Sparkles className="size-3" />}
                      {c.format}
                    </span>
                  </div>

                  <div className="mt-3 text-[11px] text-muted-foreground">
                    Giảng viên: <span className="text-foreground">{c.instructor}</span>
                  </div>

                  {/* Progress */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Học viên {c.enrolled}/{c.capacity}</span>
                      <span className="font-mono">{c.progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-warning rounded-full transition-all"
                        style={{ width: `${Math.max(3, (c.enrolled / c.capacity) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <div className="text-[11px] flex items-center gap-1 text-muted-foreground">
                      <Calendar className="size-3" /> {c.startDate}
                    </div>
                    <div className="flex items-center gap-2">
                      {c.rating && (
                        <span className="text-[11px] flex items-center gap-0.5 text-warning">
                          <Star className="size-3 fill-current" /> {c.rating}
                        </span>
                      )}
                      {c.price && (
                        <span className="text-[11px] font-mono text-foreground">
                          {c.price.toFixed(1)}M ₫
                        </span>
                      )}
                      <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition" />
                    </div>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-2 surface-card p-8 text-center text-sm text-muted-foreground">
                <AlertCircle className="size-6 mx-auto mb-2 opacity-50" />
                Không có khóa học nào phù hợp.
              </div>
            )}
          </div>
        </main>

        {/* Right rail */}
        <aside className="space-y-4">
          {/* My learning */}
          <div className="surface-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="size-4 text-primary" /> Học của tôi
              </h3>
              <button className="text-[11px] text-muted-foreground hover:text-foreground">Xem tất cả</button>
            </div>
            <div className="space-y-3">
              {MY_LEARNING.map((m) => (
                <div key={m.title} className="group cursor-pointer">
                  <div className="text-xs font-medium leading-snug group-hover:text-primary transition">{m.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{m.lesson}</div>
                  <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${m.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-3 w-full h-8 rounded-md border border-border text-xs hover:bg-sidebar-accent flex items-center justify-center gap-1.5 transition">
              <PlayCircle className="size-3.5" /> Tiếp tục học
            </button>
          </div>

          {/* Upcoming */}
          <div className="surface-card p-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Calendar className="size-4 text-info" /> Lịch sắp tới
            </h3>
            <div className="space-y-2.5">
              {UPCOMING.map((u, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="shrink-0 w-10 h-10 rounded-md bg-muted/60 border border-border flex flex-col items-center justify-center">
                    <span className="text-[10px] text-muted-foreground leading-none">T7</span>
                    <span className="text-xs font-display font-semibold leading-none mt-0.5">{u.date.split("/")[0]}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium truncate">{u.title}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{u.who}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Certificates */}
          <div className="surface-card p-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Award className="size-4 text-warning" /> Chứng chỉ
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: 42, l: "Đã cấp" },
                { v: 12, l: "Chờ duyệt" },
                { v: 7, l: "Sắp hết hạn" },
              ].map((s) => (
                <div key={s.l} className="text-center p-2 rounded-md bg-muted/40">
                  <div className="font-display text-lg font-semibold">{s.v}</div>
                  <div className="text-[10px] text-muted-foreground">{s.l}</div>
                </div>
              ))}
            </div>
            <button className="mt-3 w-full h-8 rounded-md bg-primary/10 text-primary text-xs hover:bg-primary/20 flex items-center justify-center gap-1.5 transition">
              <FileText className="size-3.5" /> Mẫu chứng chỉ
            </button>
          </div>
        </aside>
      </div>

      {/* Course detail drawer */}
      {selected && <CourseDrawer course={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function CourseDrawer({ course, onClose }: { course: Course; onClose: () => void }) {
  const cat = CAT_META[course.category];
  const st = STATUS_META[course.status];
  const lessons = Array.from({ length: course.lessons }, (_, i) => ({
    n: i + 1,
    title: [
      "Tổng quan & mục tiêu khóa học",
      "Bối cảnh & yêu cầu pháp lý",
      "Các điều khoản chính của tiêu chuẩn",
      "Kỹ thuật đánh giá tài liệu",
      "Phỏng vấn & thu thập bằng chứng",
      "Viết báo cáo phát hiện",
      "Bài tập tình huống nhóm",
      "Kiểm tra giữa khóa",
      "Workshop thực hành tại doanh nghiệp",
      "Phân tích nguyên nhân gốc",
      "Hành động khắc phục & cải tiến",
      "Bài thi cuối khóa & cấp chứng chỉ",
    ][i % 12],
    duration: ["1h30", "2h", "1h45", "2h15", "1h30", "2h"][i % 6],
    done: i < Math.floor((course.progress / 100) * course.lessons),
  }));

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <div className="w-[560px] bg-card border-l border-border flex flex-col shadow-2xl animate-count-up">
        <div className="h-14 border-b border-border px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${cat.cls} shrink-0`}>{cat.label}</span>
            <span className="text-[11px] font-mono text-muted-foreground truncate">{course.code}</span>
          </div>
          <button onClick={onClose} className="size-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-5 border-b border-border">
            <h2 className="font-display text-xl font-semibold leading-tight">{course.title}</h2>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className={`flex items-center gap-1 ${st.cls}`}>
                <span className={`size-1.5 rounded-full ${st.dot}`} /> {st.label}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{course.company}</span>
              {course.rating && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="flex items-center gap-0.5 text-warning"><Star className="size-3 fill-current" />{course.rating}</span>
                </>
              )}
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2">
              {[
                { l: "Thời lượng", v: course.duration, i: Clock },
                { l: "Số bài", v: `${course.lessons}`, i: BookOpen },
                { l: "Học viên", v: `${course.enrolled}/${course.capacity}`, i: Users },
                { l: "Hình thức", v: course.format, i: Video },
              ].map((s) => {
                const I = s.i;
                return (
                  <div key={s.l} className="p-2.5 rounded-md bg-muted/40 border border-border">
                    <I className="size-3.5 text-muted-foreground mb-1" />
                    <div className="text-[10px] text-muted-foreground">{s.l}</div>
                    <div className="text-xs font-medium font-display">{s.v}</div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Tiến độ khóa học</span>
                <span className="font-mono font-medium">{course.progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-warning rounded-full" style={{ width: `${course.progress}%` }} />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Link
                to="/training/$courseId"
                params={{ courseId: course.id }}
                className="flex-1 h-9 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium flex items-center justify-center gap-2 transition"
              >
                <PlayCircle className="size-4" /> {course.status === "running" ? "Tiếp tục học" : "Vào khóa học"}
              </Link>
              <Link
                to="/training/$courseId"
                params={{ courseId: course.id }}
                className="h-9 px-3 rounded-md border border-border hover:bg-muted text-sm flex items-center gap-1.5 transition"
              >
                <FileSpreadsheet className="size-4" /> Bài giảng & tài liệu
              </Link>
            </div>
          </div>


          <div className="p-5 border-b border-border">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Target className="size-4 text-primary" /> Mục tiêu khóa học
            </h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {[
                "Hiểu rõ cấu trúc và yêu cầu của tiêu chuẩn áp dụng",
                "Thực hành kỹ năng đánh giá nội bộ chuyên nghiệp",
                "Lập kế hoạch và thực hiện chương trình đánh giá",
                "Viết báo cáo phát hiện & đề xuất hành động khắc phục",
              ].map((g) => (
                <li key={g} className="flex gap-2">
                  <CheckCircle2 className="size-3.5 text-success shrink-0 mt-0.5" />
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2"><BookOpen className="size-4 text-info" /> Nội dung ({course.lessons} bài)</span>
              <span className="text-[11px] text-muted-foreground font-normal">
                Đã xong {lessons.filter(l => l.done).length}/{lessons.length}
              </span>
            </h3>
            <div className="space-y-1.5">
              {lessons.map((l) => (
                <div
                  key={l.n}
                  className={`flex items-center gap-3 p-2.5 rounded-md border transition ${
                    l.done ? "bg-success/5 border-success/20" : "bg-muted/30 border-border hover:bg-muted/50"
                  }`}
                >
                  <div className={`size-7 rounded-md flex items-center justify-center text-xs font-mono shrink-0 ${
                    l.done ? "bg-success/20 text-success" : "bg-background border border-border text-muted-foreground"
                  }`}>
                    {l.done ? <CheckCircle2 className="size-4" /> : l.n}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{l.title}</div>
                    <div className="text-[10px] text-muted-foreground">Bài {l.n} · {l.duration}</div>
                  </div>
                  <PlayCircle className="size-4 text-muted-foreground shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
