import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, FileText, GraduationCap, Paperclip, Plus, Trash2, Upload } from "lucide-react";
import { message } from "antd";
import { apiRequest, businessApi, deleteBusinessFile, uploadBusinessFile } from "@/lib/backend-api";

export const Route = createFileRoute("/training/$courseId")({
  head: () => ({ meta: [{ title: "Bài học đào tạo - WIS" }] }), component: CourseManagePage,
});

type Course = { id: string; code: string; title: string; company: string; instructor: string; status: string; description?: string };
type LessonFile = { id: string; name: string; url: string; publicId: string; resourceType: string; type: string; size: number; uploadedAt: string };
type Lesson = { id: string; order: number; title: string; duration: string; description: string; done: boolean; files: LessonFile[] };
type LessonState = { id: string; courseId: string; lessons: Lesson[] };

const emptyLesson = (order: number): Lesson => ({ id: crypto.randomUUID(), order, title: "", duration: "", description: "", done: false, files: [] });

function CourseManagePage() {
  const { courseId } = Route.useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [recordId, setRecordId] = useState("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    Promise.all([
      apiRequest<{ item: Course }>(`/api/business/trainings/${courseId}`).then(result => result.item),
      businessApi.list<LessonState>("training-lessons"),
    ]).then(([courseData, states]) => {
      setCourse(courseData);
      const state = states.find(item => item.courseId === courseId);
      if (state) { setRecordId(state.id); setLessons(state.lessons || []); setSelectedId(state.lessons?.[0]?.id || ""); }
    }).catch(error => message.error(error instanceof Error ? error.message : "Không thể tải khóa học"))
      .finally(() => setLoading(false));
  }, [courseId]);

  const selected = lessons.find(item => item.id === selectedId) || null;
  const progress = useMemo(() => lessons.length ? Math.round(lessons.filter(item => item.done).length / lessons.length * 100) : 0, [lessons]);

  async function persist(next: Lesson[]) {
    const normalized = next.map((item, index) => ({ ...item, order: index + 1 }));
    if (recordId) await businessApi.update("training-lessons", { id: recordId, courseId, lessons: normalized });
    else {
      const created = await businessApi.create<LessonState>("training-lessons", { id: "", courseId, lessons: normalized });
      setRecordId(created.id);
    }
    setLessons(normalized);
    return normalized;
  }

  async function saveLesson(lesson: Lesson) {
    if (!lesson.title.trim() || !lesson.duration.trim()) return message.warning("Vui lòng nhập tên và thời lượng bài học");
    try {
      const exists = lessons.some(item => item.id === lesson.id);
      const next = exists ? lessons.map(item => item.id === lesson.id ? lesson : item) : [...lessons, lesson];
      await persist(next); setSelectedId(lesson.id); setEditing(null); message.success(exists ? "Đã cập nhật bài học" : "Đã thêm bài học");
    } catch (error) { message.error(error instanceof Error ? error.message : "Không thể lưu bài học"); }
  }

  async function updateSelected(patch: Partial<Lesson>) {
    if (!selected) return;
    try { await persist(lessons.map(item => item.id === selected.id ? { ...item, ...patch } : item)); }
    catch (error) { message.error(error instanceof Error ? error.message : "Không thể cập nhật bài học"); }
  }

  async function removeLesson(lesson: Lesson) {
    if (!window.confirm(`Xóa bài học “${lesson.title}”?`)) return;
    try {
      await Promise.all(lesson.files.filter(file => file.publicId).map(file => deleteBusinessFile(file.publicId, file.resourceType).catch(() => null)));
      const next = await persist(lessons.filter(item => item.id !== lesson.id));
      setSelectedId(next[0]?.id || ""); message.success("Đã xóa bài học");
    } catch (error) { message.error(error instanceof Error ? error.message : "Không thể xóa bài học"); }
  }

  async function uploadFiles(files: FileList | null) {
    if (!files || !selected) return;
    try {
      setUploading(true);
      const uploaded = await Promise.all(Array.from(files).map(file => uploadBusinessFile(file, "training")));
      const today = new Intl.DateTimeFormat("vi-VN").format(new Date());
      await updateSelected({ files: [...selected.files, ...uploaded.map(file => ({ id: crypto.randomUUID(), name: file.name, url: file.url, publicId: file.publicId, resourceType: file.resourceType, type: file.type, size: file.size, uploadedAt: today }))] });
      message.success("Đã tải tài liệu lên Cloudinary");
    } finally { setUploading(false); }
  }

  async function removeFile(file: LessonFile) {
    if (!selected) return;
    try { await deleteBusinessFile(file.publicId, file.resourceType); await updateSelected({ files: selected.files.filter(item => item.id !== file.id) }); message.success("Đã xóa tài liệu"); }
    catch (error) { message.error(error instanceof Error ? error.message : "Không thể xóa tài liệu"); }
  }

  if (loading) return <div className="grid min-h-screen place-items-center bg-background text-muted-foreground">Đang tải khóa học...</div>;
  if (!course) return <div className="grid min-h-screen place-items-center bg-background"><Link to="/training" className="text-primary">Khóa học không tồn tại — quay lại</Link></div>;

  return <div className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur"><div className="flex h-16 items-center gap-3 px-5"><Link to="/training" className="grid size-9 place-items-center rounded-md hover:bg-muted"><ArrowLeft className="size-5" /></Link><div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary"><GraduationCap className="size-5" /></div><div className="min-w-0"><div className="text-xs text-muted-foreground">{course.code} • {course.company}</div><h1 className="truncate font-semibold">{course.title}</h1></div><div className="ml-auto text-sm"><span className="font-semibold text-primary">{progress}%</span> hoàn thành</div></div></header>
    <main className="grid gap-5 p-5 lg:grid-cols-[360px_minmax(0,1fr)]">
      <section className="overflow-hidden rounded-xl border border-border bg-card"><div className="flex items-center justify-between border-b border-border p-4"><div><h2 className="font-semibold">Danh sách bài học</h2><p className="text-xs text-muted-foreground">{lessons.length} bài học</p></div><button onClick={() => setEditing(emptyLesson(lessons.length + 1))} className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground"><Plus className="size-4" /></button></div><div className="divide-y divide-border">{lessons.map(lesson => <button key={lesson.id} onClick={() => setSelectedId(lesson.id)} className={`flex w-full items-center gap-3 p-4 text-left ${selectedId === lesson.id ? "bg-primary/10" : "hover:bg-muted/30"}`}><span className="grid size-7 place-items-center rounded-full bg-muted text-xs">{lesson.order}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{lesson.title}</span><span className="text-xs text-muted-foreground">{lesson.duration} • {lesson.files.length} file</span></span>{lesson.done && <CheckCircle2 className="size-4 text-success" />}</button>)}{lessons.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">Chưa có bài học</div>}</div></section>
      <section className="rounded-xl border border-border bg-card p-5">{selected ? <><div className="flex items-start justify-between gap-3"><div><div className="text-xs text-muted-foreground">Bài {selected.order}</div><h2 className="mt-1 text-xl font-semibold">{selected.title}</h2><div className="mt-1 text-sm text-muted-foreground">{selected.duration}</div></div><div className="flex gap-2"><button onClick={() => setEditing(selected)} className="h-9 rounded-md border border-border px-3 text-sm">Chỉnh sửa</button><button onClick={() => removeLesson(selected)} className="grid size-9 place-items-center rounded-md text-destructive hover:bg-destructive/10"><Trash2 className="size-4" /></button></div></div><p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{selected.description || "Chưa có mô tả."}</p><label className="mt-5 flex items-center gap-2"><input type="checkbox" checked={selected.done} onChange={event => updateSelected({ done: event.target.checked })} />Đánh dấu hoàn thành</label><div className="mt-6 border-t border-border pt-5"><div className="flex items-center justify-between"><h3 className="font-semibold">Tài liệu ({selected.files.length})</h3><label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-primary px-3 text-sm text-primary-foreground"><Upload className="size-4" />{uploading ? "Đang tải..." : "Tải file"}<input type="file" multiple disabled={uploading} onChange={event => { uploadFiles(event.target.files); event.target.value = ""; }} className="hidden" /></label></div><div className="mt-3 space-y-2">{selected.files.map(file => <div key={file.id} className="flex items-center gap-3 rounded-lg border border-border p-3"><FileText className="size-5 text-primary" /><a href={file.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1"><span className="block truncate text-sm font-medium hover:text-primary">{file.name}</span><span className="text-xs text-muted-foreground">{Math.ceil(file.size / 1024)} KB • {file.uploadedAt}</span></a><button onClick={() => removeFile(file)} className="grid size-8 place-items-center rounded-md text-destructive hover:bg-destructive/10"><Trash2 className="size-4" /></button></div>)}{selected.files.length === 0 && <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground"><Paperclip className="mx-auto mb-2 size-5" />Chưa có tài liệu</div>}</div></div></> : <div className="grid min-h-72 place-items-center text-muted-foreground">Chọn hoặc tạo bài học</div>}</section>
    </main>
    {editing && <LessonDialog lesson={editing} onClose={() => setEditing(null)} onSave={saveLesson} />}
  </div>;
}

function LessonDialog({ lesson, onClose, onSave }: { lesson: Lesson; onClose: () => void; onSave: (lesson: Lesson) => void }) {
  const [form, setForm] = useState(lesson);
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}><form onSubmit={event => { event.preventDefault(); onSave(form); }} onClick={event => event.stopPropagation()} className="w-full max-w-lg space-y-4 rounded-xl border border-border bg-card p-5"><h2 className="text-lg font-semibold">{lesson.title ? "Chỉnh sửa bài học" : "Thêm bài học"}</h2><label className="block text-sm">Tên bài học *<input value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3" /></label><label className="block text-sm">Thời lượng *<input value={form.duration} onChange={event => setForm({ ...form, duration: event.target.value })} placeholder="Ví dụ: 1 giờ 30 phút" className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3" /></label><label className="block text-sm">Mô tả<textarea value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} className="mt-1 min-h-28 w-full rounded-md border border-border bg-background p-3" /></label><div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="h-9 rounded-md border border-border px-4">Hủy</button><button className="h-9 rounded-md bg-primary px-4 text-primary-foreground">Lưu bài học</button></div></form></div>;
}
