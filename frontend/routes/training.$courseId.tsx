import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, GraduationCap, BookOpen, CheckCircle2, Circle, Clock, Upload,
  FileText, FileSpreadsheet, FileImage, Video, Paperclip, Trash2, Download,
  PlayCircle, Plus, Target, Users, Award, TrendingUp, MoreHorizontal, X,
  Pencil, Save, File as FileIcon, Cloud,
} from "lucide-react";
import { message } from "antd";
import { businessApi } from "@/lib/backend-api";

export const Route = createFileRoute("/training/$courseId")({
  head: () => ({
    meta: [
      { title: "Chi tiết đào tạo - WIS" },
      { name: "description", content: "Quản lý bài giảng, tài liệu và tiến độ học của khóa đào tạo." },
    ],
  }),
  component: CourseManagePage,
});

type LessonFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
};

type Lesson = {
  id: string;
  order: number;
  title: string;
  duration: string;
  description: string;
  done: boolean;
  files: LessonFile[];
};

type CourseMeta = {
  code: string;
  title: string;
  company: string;
  instructor: string;
  format: string;
  startDate: string;
  duration: string;
  enrolled: number;
  capacity: number;
};

const COURSE_META: Record<string, CourseMeta> = {
  c1: { code: "WC-ISO-9001-26.07", title: "Chuyên gia đánh giá nội bộ ISO 9001:2015", company: "Line 2", instructor: "TS. Nguyễn Văn A", format: "Hybrid", startDate: "05/07/2026", duration: "24h / 3 ngày", enrolled: 28, capacity: 30 },
  c2: { code: "SCT-VGAP-26.06", title: "Tập huấn VietGAP trồng trọt — Sơn La", company: "Line 1", instructor: "ThS. Trần Thị B", format: "Offline", startDate: "20/06/2026", duration: "16h / 2 ngày", enrolled: 45, capacity: 50 },
  c3: { code: "IC-HACCP-26.07", title: "HACCP cho doanh nghiệp thực phẩm", company: "Line 3", instructor: "TS. Lê Minh C", format: "Online", startDate: "12/07/2026", duration: "32h / 4 ngày", enrolled: 18, capacity: 25 },
  c4: { code: "GR-ONBOARD-26", title: "Onboarding nhân sự mới — Hệ sinh thái xanh", company: "Tập đoàn", instructor: "Phòng Nhân sự", format: "Online", startDate: "Liên tục", duration: "8h", enrolled: 12, capacity: 20 },
  c5: { code: "WC-14001-26.08", title: "ISO 14001 — Hệ thống quản lý môi trường", company: "Line 2", instructor: "ThS. Phạm Thu D", format: "Hybrid", startDate: "10/08/2026", duration: "24h / 3 ngày", enrolled: 8, capacity: 30 },
  c6: { code: "GR-COMPLY-26", title: "Tuân thủ & Đạo đức nghề nghiệp", company: "Tập đoàn", instructor: "Phòng Bảo hộ", format: "Online", startDate: "Bắt buộc Q3", duration: "4h", enrolled: 156, capacity: 180 },
  c7: { code: "SCT-22000-26.09", title: "ISO 22000 — An toàn thực phẩm", company: "Line 1", instructor: "TS. Hoàng Văn E", format: "Offline", startDate: "15/09/2026", duration: "24h / 3 ngày", enrolled: 0, capacity: 25 },
  c8: { code: "IC-CYBER-26.07", title: "An toàn thông tin ISO 27001 — Foundation", company: "Line 3", instructor: "ThS. Vũ Quang F", format: "Online", startDate: "28/07/2026", duration: "16h / 2 ngày", enrolled: 22, capacity: 25 },
};

const DEFAULT_LESSONS: { title: string; duration: string; description: string }[] = [
  { title: "Tổng quan & mục tiêu khóa học", duration: "1h30", description: "Giới thiệu chương trình, lịch học, kết quả mong đợi và cách đánh giá." },
  { title: "Bối cảnh & yêu cầu pháp lý", duration: "2h00", description: "Khung pháp lý liên quan và bối cảnh áp dụng tiêu chuẩn." },
  { title: "Các điều khoản chính của tiêu chuẩn", duration: "2h15", description: "Phân tích chi tiết các điều khoản trọng yếu kèm ví dụ thực tế." },
  { title: "Kỹ thuật đánh giá tài liệu", duration: "1h45", description: "Cách review tài liệu QMS, ghi chú phát hiện, gắn bằng chứng." },
  { title: "Phỏng vấn & thu thập bằng chứng", duration: "2h00", description: "Kỹ năng đặt câu hỏi mở, lắng nghe chủ động, ghi chép hiện trường." },
  { title: "Viết báo cáo phát hiện", duration: "1h30", description: "Mẫu báo cáo, phân loại NC/Obs/OFI, ngôn ngữ trung lập." },
  { title: "Workshop tình huống nhóm", duration: "2h30", description: "Thực hành nhóm trên case study của doanh nghiệp mẫu." },
  { title: "Bài thi cuối khóa & cấp chứng chỉ", duration: "1h30", description: "Thi trắc nghiệm + phỏng vấn ngắn, công bố kết quả & cấp chứng chỉ." },
];

function fileIcon(type: string) {
  if (type.startsWith("image/")) return FileImage;
  if (type.startsWith("video/")) return Video;
  if (type.includes("sheet") || type.includes("excel") || type.includes("csv")) return FileSpreadsheet;
  if (type.includes("pdf") || type.includes("word") || type.includes("document")) return FileText;
  return FileIcon;
}

function formatSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function CourseManagePage() {
  const { courseId } = Route.useParams();
  const meta = COURSE_META[courseId];
  if (!meta) throw notFound();

  const defaultLessons: Lesson[] = useMemo(
    () =>
      DEFAULT_LESSONS.map((l, i) => ({
        id: `l${i + 1}`,
        order: i + 1,
        title: l.title,
        duration: l.duration,
        description: l.description,
        done: i < 3,
        files:
          i === 0
            ? [
                { id: "f1", name: "Slide tổng quan khóa học.pdf", size: 2_450_000, type: "application/pdf", uploadedAt: "20/06/2026" },
                { id: "f2", name: "Lịch học chi tiết.xlsx", size: 18_400, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", uploadedAt: "20/06/2026" },
              ]
            : i === 2
            ? [{ id: "f3", name: "ISO 9001 — Các điều khoản.pdf", size: 5_120_000, type: "application/pdf", uploadedAt: "22/06/2026" }]
            : [],
      })),
    [],
  );

  const [lessons, setLessons] = useState<Lesson[]>(defaultLessons);
  const [selectedId, setSelectedId] = useState<string>(defaultLessons[0]?.id ?? "");
  const [editing, setEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordIdRef = useRef("");
  const hydratedRef = useRef(false);

  useEffect(() => {
    hydratedRef.current = false;
    businessApi.list<{ id: string; courseId: string; lessons: Lesson[] }>("training-lessons")
      .then((rows) => {
        const state = rows.find((x) => x.courseId === courseId);
        if (state?.lessons?.length) { recordIdRef.current = state.id; setLessons(state.lessons); setSelectedId(state.lessons[0].id); }
        else { setLessons(defaultLessons); setSelectedId(defaultLessons[0]?.id ?? ""); }
        setTimeout(() => { hydratedRef.current = true; }, 0);
      }).catch((e) => message.error(e.message));
  }, [courseId, defaultLessons]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    const timer = setTimeout(async () => {
      try {
        if (recordIdRef.current) await businessApi.update("training-lessons", { id: recordIdRef.current, courseId, lessons });
        else {
          const created = await businessApi.create<{ id: string; courseId: string; lessons: Lesson[] }>("training-lessons", { id: "", courseId, lessons });
          recordIdRef.current = created.id;
        }
      } catch (e) { message.error(e instanceof Error ? e.message : "Không thể lưu bài giảng"); }
    }, 400);
    return () => clearTimeout(timer);
  }, [lessons, courseId]);

  const selected = lessons.find((l) => l.id === selectedId) ?? lessons[0];
  const doneCount = lessons.filter((l) => l.done).length;
  const progress = Math.round((doneCount / Math.max(1, lessons.length)) * 100);
  const totalFiles = useMemo(() => lessons.reduce((s, l) => s + l.files.length, 0), [lessons]);

  function toggleDone(id: string) {
    setLessons((prev) => prev.map((l) => (l.id === id ? { ...l, done: !l.done } : l)));
  }

  function addLesson() {
    const n = lessons.length + 1;
    const newLesson: Lesson = {
      id: `l${Date.now()}`,
      order: n,
      title: `Bài giảng ${n}`,
      duration: "1h30",
      description: "Mô tả bài giảng…",
      done: false,
      files: [],
    };
    setLessons([...lessons, newLesson]);
    setSelectedId(newLesson.id);
    setEditing(true);
  }

  function deleteLesson(id: string) {
    setLessons((prev) => {
      const next = prev.filter((l) => l.id !== id).map((l, i) => ({ ...l, order: i + 1 }));
      if (id === selectedId && next.length) setSelectedId(next[0].id);
      return next;
    });
  }

  function updateLesson(patch: Partial<Lesson>) {
    if (!selected) return;
    setLessons((prev) => prev.map((l) => (l.id === selected.id ? { ...l, ...patch } : l)));
  }

  function onUpload(files: FileList | null) {
    if (!files || !selected) return;
    const today = new Date().toLocaleDateString("vi-VN");
    const newFiles: LessonFile[] = Array.from(files).map((f) => ({
      id: `f${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: f.name,
      size: f.size,
      type: f.type || "application/octet-stream",
      uploadedAt: today,
    }));
    updateLesson({ files: [...selected.files, ...newFiles] });
  }

  function deleteFile(fid: string) {
    if (!selected) return;
    updateLesson({ files: selected.files.filter((f) => f.id !== fid) });
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="h-14 border-b border-border bg-sidebar/60 backdrop-blur flex items-center px-4 gap-3 sticky top-0 z-20">
        <Link to="/training" className="size-8 rounded-md hover:bg-sidebar-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="size-4" />
        </Link>
        <div className="size-8 rounded-md bg-primary/15 text-primary flex items-center justify-center">
          <GraduationCap className="size-4" />
        </div>
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-sm font-semibold truncate">{meta.title}</span>
          <span className="text-[11px] text-muted-foreground font-mono">{meta.code} · {meta.instructor}</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 h-9 px-2.5 rounded-md border bg-muted/40 border-border text-[11px] text-muted-foreground" title="Lưu trên trình duyệt">
            <Cloud className="size-3" /> Đã lưu cục bộ
          </div>
          <div className="hidden md:flex items-center gap-4 px-3 h-9 rounded-md bg-muted/40 border border-border text-xs">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-success" /> {doneCount}/{lessons.length} bài</span>
            <span className="flex items-center gap-1.5"><Paperclip className="size-3.5 text-info" /> {totalFiles} tài liệu</span>
            <span className="flex items-center gap-1.5"><TrendingUp className="size-3.5 text-primary" /> {progress}%</span>
          </div>
          <button onClick={addLesson} className="h-9 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium flex items-center gap-2 transition">
            <Plus className="size-4" /> Thêm bài giảng
          </button>
        </div>
      </header>

      {/* Course progress strip */}
      <div className="px-4 pt-3">
        <div className="surface-card p-3 flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="size-3.5" /> {meta.enrolled}/{meta.capacity} học viên
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="size-3.5" /> {meta.duration}
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Video className="size-3.5" /> {meta.format}
          </div>
          <div className="ml-auto flex-1 max-w-md">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-muted-foreground">Tiến độ tổng</span>
              <span className="font-mono font-medium">{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-warning rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-col */}
      <div className="flex-1 grid grid-cols-[360px_1fr] gap-4 p-4 min-h-0">
        {/* Lesson list */}
        <aside className="surface-card flex flex-col min-h-0">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="size-4 text-primary" /> Bài giảng ({lessons.length})
            </h3>
            <span className="text-[11px] text-muted-foreground">Đã xong {doneCount}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {lessons.map((l) => {
              const active = l.id === selected?.id;
              return (
                <button
                  key={l.id}
                  onClick={() => { setSelectedId(l.id); setEditing(false); }}
                  className={`w-full text-left p-2.5 rounded-md border transition flex gap-2.5 items-start group ${
                    active ? "bg-primary/10 border-primary/40" : "bg-muted/30 border-transparent hover:bg-muted/50 hover:border-border"
                  }`}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleDone(l.id); }}
                    className={`size-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition ${
                      l.done ? "bg-success/20 text-success" : "bg-background border border-border text-muted-foreground hover:text-foreground hover:border-foreground"
                    }`}
                    title={l.done ? "Bỏ đánh dấu hoàn thành" : "Đánh dấu hoàn thành"}
                  >
                    {l.done ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-muted-foreground">Bài {l.order}</span>
                      {l.files.length > 0 && (
                        <span className="text-[10px] text-info flex items-center gap-0.5">
                          <Paperclip className="size-2.5" />{l.files.length}
                        </span>
                      )}
                    </div>
                    <div className={`text-xs font-medium leading-snug line-clamp-2 mt-0.5 ${l.done ? "text-muted-foreground line-through" : ""}`}>
                      {l.title}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="size-2.5" /> {l.duration}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="p-2 border-t border-border">
            <button onClick={addLesson} className="w-full h-8 rounded-md border border-dashed border-border hover:bg-muted/40 text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition">
              <Plus className="size-3.5" /> Thêm bài giảng mới
            </button>
          </div>
        </aside>

        {/* Lesson detail */}
        <main className="surface-card flex flex-col min-h-0 overflow-hidden">
          {selected ? (
            <>
              <div className="p-5 border-b border-border">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground">Bài {selected.order}</span>
                    <span className={`text-[10px] flex items-center gap-1 ${selected.done ? "text-success" : "text-muted-foreground"}`}>
                      <span className={`size-1.5 rounded-full ${selected.done ? "bg-success" : "bg-muted-foreground"}`} />
                      {selected.done ? "Đã hoàn thành" : "Chưa hoàn thành"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleDone(selected.id)}
                      className={`h-8 px-3 rounded-md text-xs font-medium flex items-center gap-1.5 transition border ${
                        selected.done
                          ? "bg-success/15 text-success border-success/30 hover:bg-success/20"
                          : "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                      }`}
                    >
                      <CheckCircle2 className="size-3.5" />
                      {selected.done ? "Hoàn thành" : "Đánh dấu hoàn thành"}
                    </button>
                    <button
                      onClick={() => setEditing(!editing)}
                      className="size-8 rounded-md border border-border hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition"
                      title={editing ? "Lưu" : "Sửa"}
                    >
                      {editing ? <Save className="size-3.5" /> : <Pencil className="size-3.5" />}
                    </button>
                    <button
                      onClick={() => deleteLesson(selected.id)}
                      className="size-8 rounded-md border border-border hover:bg-destructive/10 hover:border-destructive/40 flex items-center justify-center text-muted-foreground hover:text-destructive transition"
                      title="Xóa bài giảng"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {editing ? (
                  <div className="mt-3 space-y-2">
                    <input
                      value={selected.title}
                      onChange={(e) => updateLesson({ title: e.target.value })}
                      className="w-full h-10 px-3 rounded-md bg-input/50 border border-border font-display text-lg font-semibold focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <div className="flex gap-2">
                      <input
                        value={selected.duration}
                        onChange={(e) => updateLesson({ duration: e.target.value })}
                        placeholder="Thời lượng (1h30)"
                        className="w-40 h-9 px-3 rounded-md bg-input/50 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                    <textarea
                      value={selected.description}
                      onChange={(e) => updateLesson({ description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 rounded-md bg-input/50 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                    />
                  </div>
                ) : (
                  <>
                    <h2 className="mt-3 font-display text-xl font-semibold leading-tight">{selected.title}</h2>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="size-3" /> {selected.duration}</span>
                      <span className="flex items-center gap-1"><Paperclip className="size-3" /> {selected.files.length} tài liệu</span>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{selected.description}</p>
                  </>
                )}
              </div>

              {/* Files */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Paperclip className="size-4 text-info" /> Tài liệu bài giảng ({selected.files.length})
                    </h3>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="h-8 px-3 rounded-md bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium flex items-center gap-1.5 transition"
                    >
                      <Upload className="size-3.5" /> Tải tài liệu lên
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => { onUpload(e.target.files); e.target.value = ""; }}
                    />
                  </div>

                  {/* Upload dropzone */}
                  <label
                    onDragOver={(e) => { e.preventDefault(); }}
                    onDrop={(e) => { e.preventDefault(); onUpload(e.dataTransfer.files); }}
                    className="block border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 rounded-lg p-6 text-center cursor-pointer transition"
                  >
                    <Upload className="size-6 mx-auto text-muted-foreground mb-2" />
                    <div className="text-xs font-medium">Kéo & thả tài liệu vào đây hoặc <span className="text-primary">chọn từ máy</span></div>
                    <div className="text-[11px] text-muted-foreground mt-1">PDF, DOCX, XLSX, PPTX, hình ảnh, video — tối đa 50MB/file</div>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => { onUpload(e.target.files); e.target.value = ""; }}
                    />
                  </label>

                  {/* File list */}
                  {selected.files.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {selected.files.map((f) => {
                        const I = fileIcon(f.type);
                        return (
                          <div key={f.id} className="flex items-center gap-3 p-2.5 rounded-md bg-muted/40 border border-border hover:bg-muted/60 group transition">
                            <div className="size-9 rounded-md bg-background border border-border flex items-center justify-center text-muted-foreground shrink-0">
                              <I className="size-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium truncate">{f.name}</div>
                              <div className="text-[11px] text-muted-foreground">{formatSize(f.size)} · Tải lên {f.uploadedAt}</div>
                            </div>
                            <button className="size-8 rounded-md hover:bg-background flex items-center justify-center text-muted-foreground hover:text-foreground transition opacity-0 group-hover:opacity-100" title="Tải xuống">
                              <Download className="size-3.5" />
                            </button>
                            <button
                              onClick={() => deleteFile(f.id)}
                              className="size-8 rounded-md hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition opacity-0 group-hover:opacity-100"
                              title="Xóa"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-border">
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <Target className="size-4 text-primary" /> Hành động học viên
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <button className="h-9 rounded-md border border-border hover:bg-muted text-xs flex items-center justify-center gap-1.5 transition">
                      <PlayCircle className="size-3.5" /> Xem video bài giảng
                    </button>
                    <button className="h-9 rounded-md border border-border hover:bg-muted text-xs flex items-center justify-center gap-1.5 transition">
                      <FileText className="size-3.5" /> Bài kiểm tra
                    </button>
                    <button className="h-9 rounded-md border border-border hover:bg-muted text-xs flex items-center justify-center gap-1.5 transition">
                      <Award className="size-3.5" /> Cấp chứng nhận
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
              Chọn một bài giảng để xem chi tiết.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
