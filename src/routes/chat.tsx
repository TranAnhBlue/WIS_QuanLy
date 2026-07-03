import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
  Search, Plus, Paperclip, Send, Smile, AtSign, Phone, Video, MoreHorizontal,
  Users, Hash, FolderKanban, MessageSquare, Bell, Pin, Star, FileText, Image as ImageIcon,
  File as FileIcon, Download, X, Check, CheckCheck, Mic, Settings, ChevronLeft,
  ArrowLeft, Reply, Circle, BellOff, Archive,
} from "lucide-react";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat nội bộ — WIS" },
      { name: "description", content: "Chat cá nhân, nhóm và dự án — thay thế Zalo trong nội bộ tập đoàn." },
      { property: "og:title", content: "Chat nội bộ — WIS" },
      { property: "og:description", content: "Chat cá nhân, nhóm và dự án — thay thế Zalo trong nội bộ tập đoàn." },
    ],
  }),
  component: ChatPage,
});

type ConvKind = "direct" | "group" | "project" | "channel";
type Conversation = {
  id: string;
  kind: ConvKind;
  name: string;
  sub?: string;
  last: string;
  time: string;
  unread?: number;
  online?: boolean;
  pinned?: boolean;
  muted?: boolean;
  members?: number;
};

const CONVERSATIONS: Conversation[] = [
  // Pinned
  { id: "p1", kind: "project", name: "WC-2025-038 · ISO 22000 Vinamilk", sub: "Trần Thị B + 6 người", last: "Trần Thị B: Đã gửi báo cáo GĐ1, mọi người xem giúp", time: "09:42", unread: 4, pinned: true, members: 7 },
  { id: "p2", kind: "channel", name: "ban-giam-doc", sub: "Kênh điều hành tập đoàn", last: "Nguyễn Thị Lan Anh: Họp 14h thứ 2 nhé", time: "09:18", unread: 2, pinned: true, members: 5 },
  // Direct
  { id: "d1", kind: "direct", name: "Trần Thị B", sub: "Trưởng phòng Đánh giá · Line 2", last: "Em sẽ gửi lại trong chiều nay anh ạ", time: "09:30", unread: 2, online: true },
  { id: "d2", kind: "direct", name: "Lê Minh C", sub: "Trưởng phòng Đào tạo · Line 1", last: "Vâng anh, khóa 12 chốt 30 học viên", time: "08:55", online: true },
  { id: "d3", kind: "direct", name: "Hoàng Thu E", sub: "Kế toán trưởng", last: "Anh duyệt giúp em phiếu chi 12.5tr", time: "08:30", unread: 1 },
  { id: "d4", kind: "direct", name: "Phạm Quốc D", sub: "PM · Line 3", last: "Bạn: Ok anh nhé", time: "Hôm qua" },
  // Groups
  { id: "g1", kind: "group", name: "Lãnh đạo 3 công ty", sub: "Hùng, Linh, Tuấn, Mai + 2", last: "Linh: Doanh thu Q2 Line 2 tăng 12%", time: "08:10", members: 6 },
  { id: "g2", kind: "group", name: "Đánh giá viên Line 2", sub: "12 thành viên", last: "Trần Thị B: Lịch đánh giá tuần sau đã update", time: "Hôm qua", members: 12 },
  // Project channels
  { id: "pr1", kind: "project", name: "IC-2025-007 · VietGAP Sơn La", sub: "Phạm Quốc D + 4 người", last: "Hệ thống: Dự án đã chuyển trạng thái Quá hạn", time: "08:55", unread: 8, members: 5 },
  { id: "pr2", kind: "project", name: "WC-2025-041 · ISO 9001 Minh Phú", sub: "Nguyễn Văn A + 5 người", last: "Nguyễn Văn A: Đã hoàn tất checklist GĐ2", time: "Hôm qua", members: 6 },
  // Channels
  { id: "c1", kind: "channel", name: "thong-bao-cong-ty", sub: "Tất cả nhân sự · 33 người", last: "HR: Lịch nghỉ lễ 2/9 đã ban hành", time: "T2", members: 33, muted: true },
  { id: "c2", kind: "channel", name: "random", sub: "Trò chuyện ngoài lề", last: "Lê Minh C: Ai đặt trà chiều không 🍵", time: "T2", members: 28, muted: true },
];

type Msg = {
  id: string;
  author: string;
  role?: string;
  avatar: string;
  time: string;
  text?: string;
  attachments?: { kind: "image" | "file"; name: string; size?: string; ext?: string }[];
  reply?: { author: string; text: string };
  mentions?: string[];
  reactions?: { emoji: string; count: number; mine?: boolean }[];
  status?: "sent" | "delivered" | "read";
  system?: boolean;
  mine?: boolean;
};

const TODAY_DIVIDER: Msg = {
  id: "div-today", system: true, author: "Hệ thống", avatar: "", time: "08:00",
  text: "Hôm nay · Thứ sáu, 26/06/2026",
};

const THREADS: Record<string, Msg[]> = {
  // WC-2025-038 · ISO 22000 Vinamilk
  p1: [
    TODAY_DIVIDER,
    { id: "p1-1", author: "Trần Thị B", role: "Trưởng phòng Đánh giá · Line 2", avatar: "TB", time: "09:12",
      text: "Anh Hùng ơi, em vừa hoàn tất đánh giá giai đoạn 1 cho Vinamilk Tiên Sơn. Em gửi anh báo cáo và 3 ảnh hiện trường.",
      reactions: [{ emoji: "👍", count: 3 }, { emoji: "🎉", count: 1, mine: true }] },
    { id: "p1-2", author: "Trần Thị B", role: "Trưởng phòng Đánh giá · Line 2", avatar: "TB", time: "09:13",
      attachments: [
        { kind: "file", name: "BC-DanhGia-GD1-Vinamilk-TienSon.pdf", size: "2.4 MB", ext: "PDF" },
        { kind: "image", name: "hien-truong-01.jpg", size: "1.8 MB" },
        { kind: "image", name: "hien-truong-02.jpg", size: "2.1 MB" },
        { kind: "image", name: "hien-truong-03.jpg", size: "1.6 MB" },
      ] },
    { id: "p1-3", author: "Nguyễn Thị Lan Anh", role: "Group CEO", avatar: "LA", time: "09:30", mine: true,
      text: "Cảm ơn em. Anh đã xem qua, tổng thể ổn. Có 2 điểm cần làm rõ trước khi qua GĐ2:", status: "read" },
    { id: "p1-4", author: "Nguyễn Thị Lan Anh", role: "Group CEO", avatar: "LA", time: "09:30", mine: true,
      text: "1. Mục 4.2 — đánh giá rủi ro chuỗi cung ứng chưa đủ độ sâu\n2. Cần bổ sung biên bản phỏng vấn QA leader", status: "read" },
    { id: "p1-5", author: "Trần Thị B", role: "Trưởng phòng Đánh giá · Line 2", avatar: "TB", time: "09:38",
      reply: { author: "Nguyễn Thị Lan Anh", text: "1. Mục 4.2 — đánh giá rủi ro chuỗi cung ứng…" },
      text: "Em nhận thông tin. Em làm việc lại với khách hàng và cập nhật trong chiều nay anh ạ.",
      mentions: ["@LanAnh"] },
    { id: "p1-6", system: true, author: "Hệ thống", avatar: "", time: "09:40",
      text: "Lê Minh C đã được thêm vào cuộc trò chuyện" },
    { id: "p1-7", author: "Lê Minh C", role: "Trưởng phòng Đào tạo · Line 1", avatar: "LC", time: "09:41",
      text: "Em vừa join. Bên Line 1 có thể hỗ trợ đào tạo nội bộ cho QA team của Vinamilk nếu cần nhé anh.",
      reactions: [{ emoji: "💡", count: 2 }] },
    { id: "p1-8", author: "Trần Thị B", role: "Trưởng phòng Đánh giá · Line 2", avatar: "TB", time: "09:42",
      text: "Đã gửi báo cáo GĐ1, mọi người xem giúp" },
  ],
  // ban-giam-doc
  p2: [
    TODAY_DIVIDER,
    { id: "p2-1", author: "Nguyễn Thị Linh", role: "CEO · Line 1", avatar: "NL", time: "08:50",
      text: "Doanh thu Q2 của Line 1 đã chốt 8.4 tỷ, vượt 7% kế hoạch. Em sẽ gửi báo cáo chi tiết trong file." },
    { id: "p2-2", author: "Nguyễn Thị Linh", role: "CEO · Line 1", avatar: "NL", time: "08:51",
      attachments: [{ kind: "file", name: "BC-DoanhThu-Q2-SCT.xlsx", size: "186 KB", ext: "XLSX" }] },
    { id: "p2-3", author: "Trần Văn Tuấn", role: "CEO · Line 3", avatar: "TT", time: "09:05",
      text: "Bên Line 3 Q2 đạt 5.1 tỷ, đúng kế hoạch. Có 2 dự án CNTT đang chậm tiến độ, em sẽ báo cáo riêng." },
    { id: "p2-4", author: "Nguyễn Thị Lan Anh", role: "Group CEO", avatar: "LA", time: "09:18", mine: true,
      text: "Họp 14h thứ 2 nhé. Mọi người chuẩn bị: KPI Q2, kế hoạch Q3, top 3 rủi ro.", status: "read",
      reactions: [{ emoji: "✅", count: 4 }] },
  ],
  // Trần Thị B (direct)
  d1: [
    TODAY_DIVIDER,
    { id: "d1-1", author: "Trần Thị B", role: "Trưởng phòng Đánh giá · Line 2", avatar: "TB", time: "09:20",
      text: "Anh ơi, hợp đồng HĐ-2025-184 của Minh Phú đã ký xong, em đã upload lên hệ thống." },
    { id: "d1-2", author: "Nguyễn Thị Lan Anh", role: "Group CEO", avatar: "LA", time: "09:25", mine: true,
      text: "Ok em, tốt lắm. Khi nào kick-off được?", status: "read" },
    { id: "d1-3", author: "Trần Thị B", role: "Trưởng phòng Đánh giá · Line 2", avatar: "TB", time: "09:30",
      text: "Em sẽ gửi lại trong chiều nay anh ạ" },
  ],
  // Lê Minh C
  d2: [
    TODAY_DIVIDER,
    { id: "d2-1", author: "Nguyễn Thị Lan Anh", role: "Group CEO", avatar: "LA", time: "08:50", mine: true,
      text: "Khóa đào tạo ISO 9001 tháng 7 chốt được bao nhiêu học viên rồi em?", status: "read" },
    { id: "d2-2", author: "Lê Minh C", role: "Trưởng phòng Đào tạo · Line 1", avatar: "LC", time: "08:55",
      text: "Vâng anh, khóa 12 chốt 30 học viên. Doanh thu dự kiến 180tr." },
  ],
  // Hoàng Thu E — duyệt phiếu chi
  d3: [
    TODAY_DIVIDER,
    { id: "d3-1", author: "Hoàng Thu E", role: "Kế toán trưởng", avatar: "HE", time: "08:28",
      text: "Anh duyệt giúp em phiếu chi 12.5tr cho chi phí công tác đoàn đánh giá Vinamilk Tiên Sơn ạ." },
    { id: "d3-2", author: "Hoàng Thu E", role: "Kế toán trưởng", avatar: "HE", time: "08:30",
      attachments: [{ kind: "file", name: "PC-2026-0287-VinamilkTienSon.pdf", size: "320 KB", ext: "PDF" }] },
  ],
  // Phạm Quốc D
  d4: [
    { id: "d4-1", system: true, author: "Hệ thống", avatar: "", time: "Hôm qua",
      text: "Hôm qua · Thứ năm, 25/06/2026" },
    { id: "d4-2", author: "Nguyễn Thị Lan Anh", role: "Group CEO", avatar: "LA", time: "17:40", mine: true,
      text: "Em phụ trách kết nối với Sở Nông nghiệp Sơn La cho dự án VietGAP nhé.", status: "read" },
    { id: "d4-3", author: "Phạm Quốc D", role: "PM · Line 3", avatar: "PD", time: "17:55",
      text: "Ok anh nhé" },
  ],
  // Lãnh đạo 3 công ty
  g1: [
    TODAY_DIVIDER,
    { id: "g1-1", author: "Nguyễn Thị Linh", role: "CEO · Line 1", avatar: "NL", time: "08:05",
      text: "Update nhanh: pipeline đào tạo Q3 đang có 12 KH tiềm năng, ước tính 1.6 tỷ." },
    { id: "g1-2", author: "Nguyễn Thị Linh", role: "CEO · Line 1", avatar: "NL", time: "08:10",
      text: "Doanh thu Q2 Line 2 tăng 12%", reactions: [{ emoji: "🔥", count: 2 }, { emoji: "👏", count: 1, mine: true }] },
  ],
  // Đánh giá viên Line 2
  g2: [
    { id: "g2-1", system: true, author: "Hệ thống", avatar: "", time: "Hôm qua",
      text: "Hôm qua · Thứ năm, 25/06/2026" },
    { id: "g2-2", author: "Trần Thị B", role: "Trưởng phòng Đánh giá · Line 2", avatar: "TB", time: "16:20",
      text: "Lịch đánh giá tuần sau đã update trên hệ thống, mọi người vào xem và xác nhận giúp em." },
    { id: "g2-3", author: "Trần Thị B", role: "Trưởng phòng Đánh giá · Line 2", avatar: "TB", time: "16:21",
      attachments: [{ kind: "file", name: "LichDanhGia-T27.xlsx", size: "94 KB", ext: "XLSX" }] },
  ],
  // IC-2025-007 · VietGAP Sơn La
  pr1: [
    TODAY_DIVIDER,
    { id: "pr1-1", system: true, author: "Hệ thống", avatar: "", time: "08:55",
      text: "Dự án đã chuyển trạng thái Quá hạn — deadline 24/06/2026" },
    { id: "pr1-2", author: "Phạm Quốc D", role: "PM · Line 3", avatar: "PD", time: "09:02",
      text: "Em xin lỗi anh, bên Sở Nông nghiệp Sơn La trả hồ sơ yêu cầu bổ sung 2 chỉ tiêu. Em đang xử lý." },
    { id: "pr1-3", author: "Nguyễn Thị Lan Anh", role: "Group CEO", avatar: "LA", time: "09:10", mine: true,
      text: "Cho anh deadline mới cụ thể và phương án xử lý trước 17h hôm nay.", status: "read",
      mentions: ["@Phạm Quốc D"] },
  ],
  // WC-2025-041 · ISO 9001 Minh Phú
  pr2: [
    { id: "pr2-1", system: true, author: "Hệ thống", avatar: "", time: "Hôm qua",
      text: "Hôm qua · Thứ năm, 25/06/2026" },
    { id: "pr2-2", author: "Nguyễn Văn A", role: "Trưởng đoàn đánh giá", avatar: "NA", time: "15:30",
      text: "Đã hoàn tất checklist GĐ2, không có NC major, 3 NC minor. Em chuẩn bị báo cáo cuối." },
    { id: "pr2-3", author: "Nguyễn Văn A", role: "Trưởng đoàn đánh giá", avatar: "NA", time: "15:32",
      attachments: [{ kind: "file", name: "Checklist-ISO9001-MinhPhu-GD2.xlsx", size: "412 KB", ext: "XLSX" }] },
  ],
  // thong-bao-cong-ty
  c1: [
    { id: "c1-1", system: true, author: "Hệ thống", avatar: "", time: "Thứ hai",
      text: "Thứ hai · 22/06/2026" },
    { id: "c1-2", author: "HR · Mai", role: "Hành chính nhân sự", avatar: "MA", time: "09:00",
      text: "Lịch nghỉ lễ 2/9 đã ban hành: nghỉ từ thứ 2 (01/09) đến hết thứ 3 (02/09). Chi tiết xem file đính kèm." },
    { id: "c1-3", author: "HR · Mai", role: "Hành chính nhân sự", avatar: "MA", time: "09:01",
      attachments: [{ kind: "file", name: "TB-NghiLe-2-9-2026.pdf", size: "180 KB", ext: "PDF" }],
      reactions: [{ emoji: "🎉", count: 12 }, { emoji: "❤️", count: 5 }] },
  ],
  // random
  c2: [
    { id: "c2-1", system: true, author: "Hệ thống", avatar: "", time: "Thứ hai",
      text: "Thứ hai · 22/06/2026" },
    { id: "c2-2", author: "Lê Minh C", role: "Trưởng phòng Đào tạo · Line 1", avatar: "LC", time: "15:30",
      text: "Ai đặt trà chiều không 🍵", reactions: [{ emoji: "🙋", count: 4 }, { emoji: "🍵", count: 6 }] },
  ],
};

function emptyThread(): Msg[] {
  return [
    TODAY_DIVIDER,
    { id: "empty-1", system: true, author: "Hệ thống", avatar: "", time: "",
      text: "Chưa có tin nhắn — hãy bắt đầu cuộc trò chuyện" },
  ];
}

type NotifKind = "mention" | "approval" | "system" | "message";
type Notif = { id: string; kind: NotifKind; from: string; text: string; time: string; unread?: boolean };
const INITIAL_NOTIFICATIONS: Notif[] = [
  { id: "n1", kind: "mention", from: "Trần Thị B", text: "đã nhắc anh trong WC-2025-038", time: "5 phút", unread: true },
  { id: "n2", kind: "approval", from: "Hoàng Thu E", text: "yêu cầu duyệt phiếu chi ₫ 12.5tr", time: "1 giờ", unread: true },
  { id: "n3", kind: "system", from: "Hệ thống", text: "Dự án IC-2025-007 chuyển trạng thái Quá hạn", time: "2 giờ", unread: true },
  { id: "n6", kind: "mention", from: "Phạm Quốc D", text: "đã nhắc anh trong IC-2025-007", time: "2 giờ", unread: true },
  { id: "n7", kind: "approval", from: "Nguyễn Văn A", text: "yêu cầu duyệt báo cáo GĐ2 Minh Phú", time: "3 giờ", unread: true },
  { id: "n4", kind: "message", from: "Lãnh đạo 3 công ty", text: "Linh: Doanh thu Q2 Line 2 tăng 12%", time: "3 giờ" },
  { id: "n5", kind: "system", from: "Hệ thống", text: "HĐ-2025-184 đã được ký", time: "Hôm nay" },
];
const NOTIF_TABS: { id: "all" | NotifKind; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "mention", label: "Nhắc tên" },
  { id: "approval", label: "Duyệt" },
  { id: "system", label: "Hệ thống" },
];

function ChatPage() {
  const [selectedId, setSelectedId] = useState("p1");
  const [filter, setFilter] = useState<"all" | "direct" | "group" | "project" | "channel">("all");
  const [search, setSearch] = useState("");
  const [threads, setThreads] = useState<Record<string, Msg[]>>(() => ({ ...THREADS }));
  const thread = threads[selectedId] ?? emptyThread();
  const setThread = (updater: (t: Msg[]) => Msg[]) =>
    setThreads((all) => ({ ...all, [selectedId]: updater(all[selectedId] ?? emptyThread()) }));
  const [draft, setDraft] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<{ kind: "image" | "file"; name: string; size: string; ext?: string }[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  const [notifications, setNotifications] = useState<Notif[]>(INITIAL_NOTIFICATIONS);
  const [notifTab, setNotifTab] = useState<"all" | NotifKind>("all");
  const unreadCount = notifications.filter((n) => n.unread).length;
  const visibleNotifs = notifications.filter((n) => notifTab === "all" || n.kind === notifTab);
  useEffect(() => {
    if (!showNotifications || unreadCount === 0) return;
    const t = setTimeout(() => setNotifications((ns) => ns.map((n) => ({ ...n, unread: false }))), 800);
    return () => clearTimeout(t);
  }, [showNotifications, unreadCount]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const conv = CONVERSATIONS.find((c) => c.id === selectedId)!;

  const filtered = CONVERSATIONS.filter((c) => {
    if (filter !== "all" && c.kind !== filter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const pinned = filtered.filter((c) => c.pinned);
  const rest = filtered.filter((c) => !c.pinned);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [thread.length, selectedId]);

  function send() {
    if (!draft.trim() && pendingAttachments.length === 0) return;
    const m: Msg = {
      id: `mine-${Date.now()}`,
      author: "Nguyễn Thị Lan Anh",
      role: "Group CEO",
      avatar: "LA",
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      text: draft.trim() || undefined,
      attachments: pendingAttachments.length ? pendingAttachments : undefined,
      status: "sent",
      mine: true,
    };
    setThread((t) => [...t, m]);
    setDraft("");
    setPendingAttachments([]);
    // simulate delivery progression
    setTimeout(() => setThread((t) => t.map((x) => x.id === m.id ? { ...x, status: "delivered" } : x)), 600);
    setTimeout(() => setThread((t) => t.map((x) => x.id === m.id ? { ...x, status: "read" } : x)), 1800);
  }

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const next = files.map((f) => {
      const isImage = f.type.startsWith("image/");
      const ext = f.name.split(".").pop()?.toUpperCase() ?? "FILE";
      const size = f.size > 1024 * 1024
        ? `${(f.size / 1024 / 1024).toFixed(1)} MB`
        : `${Math.max(1, Math.round(f.size / 1024))} KB`;
      return { kind: (isImage ? "image" : "file") as "image" | "file", name: f.name, size, ext };
    });
    setPendingAttachments((p) => [...p, ...next]);
    e.target.value = "";
  }

  return (
    <div className="flex min-h-screen text-foreground">
      {/* App rail */}
      <div className="w-14 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-3 gap-1 sticky top-0 h-screen">
        <Link to="/" className="size-9 grid place-items-center rounded-md bg-primary text-primary-foreground font-display font-bold mb-2">
          W
        </Link>
        <Link to="/" className="size-9 grid place-items-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition" title="Quay lại Dashboard">
          <ArrowLeft className="size-4" />
        </Link>
        <div className="h-px w-8 bg-sidebar-border my-1" />
        <button className="size-9 grid place-items-center rounded-md bg-sidebar-accent text-foreground" title="Chat">
          <MessageSquare className="size-4" />
        </button>
        <button
          onClick={() => setShowNotifications((s) => !s)}
          className={`size-9 grid place-items-center rounded-md transition relative ${
            showNotifications ? "bg-sidebar-accent text-foreground" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
          }`}
          title="Thông báo"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-mono font-semibold grid place-items-center">
              {unreadCount}
            </span>
          )}
        </button>
        <div className="mt-auto">
          <div className="size-9 rounded-full bg-gradient-to-br from-primary to-chart-2 grid place-items-center font-display font-semibold text-primary-foreground text-xs">
            PH
          </div>
        </div>
      </div>

      {/* Conversation list */}
      <aside className="w-[320px] shrink-0 border-r border-border bg-sidebar/40 flex flex-col sticky top-0 h-screen">
        <div className="px-4 pt-4 pb-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-display text-lg font-semibold">Chat nội bộ</h1>
            <button className="size-8 grid place-items-center rounded-md hover:bg-surface transition" title="Tạo cuộc trò chuyện">
              <Plus className="size-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm người, nhóm, dự án…"
              className="w-full h-9 pl-9 pr-3 rounded-md bg-surface border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex gap-1 mt-3 -mx-1 overflow-x-auto no-scrollbar">
            {([
              ["all", "Tất cả"],
              ["direct", "Cá nhân"],
              ["group", "Nhóm"],
              ["project", "Dự án"],
              ["channel", "Kênh"],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded transition shrink-0 ${
                  filter === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-surface"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {pinned.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium flex items-center gap-1.5">
                <Pin className="size-3" /> Ghim
              </div>
              {pinned.map((c) => <ConvRow key={c.id} c={c} active={c.id === selectedId} onClick={() => setSelectedId(c.id)} />)}
            </div>
          )}
          <div>
            <div className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
              Gần đây
            </div>
            {rest.map((c) => <ConvRow key={c.id} c={c} active={c.id === selectedId} onClick={() => setSelectedId(c.id)} />)}
            {rest.length === 0 && pinned.length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">Không có cuộc trò chuyện phù hợp</div>
            )}
          </div>
        </div>
      </aside>

      {/* Thread */}
      <section className="flex-1 min-w-0 flex flex-col bg-background">
        {/* Thread header */}
        <header className="h-16 border-b border-border flex items-center gap-3 px-5 sticky top-0 bg-background/90 backdrop-blur z-10">
          <button onClick={() => setShowInfoPanel((s) => !s)} className="lg:hidden size-8 grid place-items-center rounded-md hover:bg-surface" title="Thông tin">
            <ChevronLeft className="size-4" />
          </button>
          <ConvAvatar c={conv} size={9} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm truncate">{conv.name}</h2>
              {conv.kind === "channel" && <Hash className="size-3.5 text-muted-foreground" />}
              {conv.muted && <BellOff className="size-3 text-muted-foreground" />}
            </div>
            <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5">
              {conv.online && <span className="inline-flex items-center gap-1"><Circle className="size-1.5 fill-success text-success" /> Online</span>}
              {conv.online && conv.sub && <span>·</span>}
              {conv.sub}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="size-9 grid place-items-center rounded-md hover:bg-surface transition" title="Gọi thoại"><Phone className="size-4" /></button>
            <button className="size-9 grid place-items-center rounded-md hover:bg-surface transition" title="Gọi video"><Video className="size-4" /></button>
            <button className="size-9 grid place-items-center rounded-md hover:bg-surface transition" title="Tìm trong cuộc trò chuyện"><Search className="size-4" /></button>
            <button onClick={() => setShowInfoPanel((s) => !s)} className={`size-9 grid place-items-center rounded-md transition ${showInfoPanel ? "bg-surface text-foreground" : "hover:bg-surface text-muted-foreground"}`} title="Thông tin">
              <MoreHorizontal className="size-4" />
            </button>
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {thread.map((m, i) => {
            const prev = thread[i - 1];
            const grouped = prev && !m.system && !prev.system && prev.author === m.author && !m.reply;
            if (m.system) {
              return (
                <div key={m.id} className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">{m.text}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              );
            }
            return <MessageBubble key={m.id} m={m} grouped={!!grouped} />;
          })}
        </div>

        {/* Composer */}
        <div className="border-t border-border bg-background px-4 py-3">
          {pendingAttachments.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-2">
              {pendingAttachments.map((a, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-surface border border-border rounded-md pl-2 pr-1 py-1 text-xs">
                  {a.kind === "image"
                    ? <ImageIcon className="size-3.5 text-info" />
                    : <FileIcon className="size-3.5 text-primary" />}
                  <span className="font-medium truncate max-w-[160px]">{a.name}</span>
                  <span className="text-muted-foreground">{a.size}</span>
                  <button
                    onClick={() => setPendingAttachments((p) => p.filter((_, i) => i !== idx))}
                    className="size-5 grid place-items-center rounded hover:bg-muted text-muted-foreground"
                    aria-label="Xoá"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2 bg-surface border border-border rounded-lg px-2 py-1.5 focus-within:ring-1 focus-within:ring-primary">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="size-8 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition shrink-0"
              title="Đính kèm file"
            >
              <Paperclip className="size-4" />
            </button>
            <input ref={fileInputRef} type="file" multiple hidden onChange={onPickFiles} />
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder={`Nhắn tin tới ${conv.name}…`}
              className="flex-1 resize-none bg-transparent text-sm py-1.5 px-1 focus:outline-none placeholder:text-muted-foreground max-h-32"
              style={{ minHeight: "32px" }}
            />
            <div className="flex items-center gap-0.5 shrink-0">
              <button className="size-8 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition" title="Mention"><AtSign className="size-4" /></button>
              <button className="size-8 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition" title="Emoji"><Smile className="size-4" /></button>
              <button className="size-8 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition" title="Ghi âm"><Mic className="size-4" /></button>
              <button
                onClick={send}
                disabled={!draft.trim() && pendingAttachments.length === 0}
                className="size-8 grid place-items-center rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
                aria-label="Gửi"
              >
                <Send className="size-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-muted-foreground">
            <span>Enter để gửi · Shift+Enter để xuống dòng · @ để nhắc người</span>
            <span className="flex items-center gap-1"><Circle className="size-1.5 fill-success text-success" /> Đã mã hoá end-to-end</span>
          </div>
        </div>
      </section>

      {/* Right panel: notifications drawer OR conversation info */}
      {showNotifications ? (
        <aside className="w-[340px] shrink-0 border-l border-border bg-sidebar/40 flex flex-col sticky top-0 h-screen">
          <div className="h-16 border-b border-border flex items-center justify-between px-4">
            <h3 className="font-display font-semibold text-sm flex items-center gap-2">
              <Bell className="size-4" /> Thông báo
              {unreadCount > 0 && (
                <span className="ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary text-primary-foreground">{unreadCount}</span>
              )}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setNotifications((ns) => ns.map((n) => ({ ...n, unread: false })))}
                disabled={unreadCount === 0}
                className="text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:hover:text-muted-foreground"
              >
                Đánh dấu đã đọc
              </button>
              <button onClick={() => setShowNotifications(false)} className="size-7 grid place-items-center rounded hover:bg-surface" aria-label="Đóng"><X className="size-4" /></button>
            </div>
          </div>
          <div className="flex items-center gap-1 px-3 py-2 border-b border-border overflow-x-auto">
            {NOTIF_TABS.map((t) => {
              const count = t.id === "all"
                ? notifications.filter((n) => n.unread).length
                : notifications.filter((n) => n.kind === t.id && n.unread).length;
              const active = notifTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setNotifTab(t.id)}
                  className={`text-[11px] px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface hover:text-foreground"
                  }`}
                >
                  {t.label}
                  {count > 0 && (
                    <span className={`text-[10px] font-mono px-1 rounded ${active ? "bg-primary-foreground/20" : "bg-surface text-foreground"}`}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex-1 overflow-y-auto">
            {visibleNotifs.length === 0 && (
              <div className="px-4 py-10 text-center text-xs text-muted-foreground">
                Không có thông báo trong mục này
              </div>
            )}
            {visibleNotifs.map((n) => {
              const Icon = n.kind === "mention" ? AtSign : n.kind === "approval" ? Check : n.kind === "system" ? Bell : MessageSquare;
              const tone = n.kind === "mention" ? "text-primary bg-primary/10" : n.kind === "approval" ? "text-warning bg-warning/10" : n.kind === "system" ? "text-info bg-info/10" : "text-muted-foreground bg-muted";
              const label = n.kind === "mention" ? "Nhắc tên" : n.kind === "approval" ? "Duyệt" : n.kind === "system" ? "Hệ thống" : "Tin nhắn";
              return (
                <button
                  key={n.id}
                  onClick={() => setNotifications((ns) => ns.map((x) => x.id === n.id ? { ...x, unread: false } : x))}
                  className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-surface/50 transition flex items-start gap-3 ${n.unread ? "bg-surface/30" : ""}`}
                >
                  <div className={`size-8 grid place-items-center rounded-md shrink-0 ${tone}`}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded ${tone}`}>{label}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">{n.from}</span>{" "}
                      <span className="text-muted-foreground">{n.text}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">{n.time} trước</div>
                  </div>
                  {n.unread && <span className="size-2 rounded-full bg-primary shrink-0 mt-2" />}
                </button>
              );
            })}
          </div>
        </aside>
      ) : showInfoPanel ? (
        <aside className="w-[300px] shrink-0 border-l border-border bg-sidebar/40 hidden lg:flex flex-col sticky top-0 h-screen">
          <div className="h-16 border-b border-border flex items-center justify-between px-4">
            <h3 className="font-display font-semibold text-sm">Thông tin</h3>
            <button onClick={() => setShowInfoPanel(false)} className="size-7 grid place-items-center rounded hover:bg-surface" aria-label="Đóng"><X className="size-4" /></button>
          </div>
          <div className="p-4 flex flex-col items-center text-center border-b border-border">
            <ConvAvatar c={conv} size={16} />
            <div className="font-semibold text-sm mt-3">{conv.name}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{conv.sub}</div>
            <div className="flex items-center gap-1.5 mt-3">
              <IconBtn icon={Pin} label="Ghim" />
              <IconBtn icon={Star} label="Yêu thích" />
              <IconBtn icon={conv.muted ? Bell : BellOff} label={conv.muted ? "Bật âm" : "Tắt âm"} />
              <IconBtn icon={Archive} label="Lưu trữ" />
              <IconBtn icon={Settings} label="Cài đặt" />
            </div>
          </div>
          {conv.members && (
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Thành viên · {conv.members}</div>
                <button className="text-[10px] text-primary hover:underline">Xem tất cả</button>
              </div>
              <div className="flex -space-x-2">
                {["LA", "TB", "LC", "HE", "NA"].slice(0, Math.min(5, conv.members)).map((a, i) => (
                  <div key={i} className="size-7 rounded-full ring-2 ring-sidebar bg-gradient-to-br from-chart-2 to-chart-5 grid place-items-center text-[10px] font-semibold">{a}</div>
                ))}
                {conv.members > 5 && (
                  <div className="size-7 rounded-full ring-2 ring-sidebar bg-surface grid place-items-center text-[10px] font-medium text-muted-foreground">+{conv.members - 5}</div>
                )}
              </div>
            </div>
          )}
          <div className="p-4 border-b border-border">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">File đã chia sẻ · 8</div>
            <div className="space-y-1.5">
              {[
                { name: "BC-DanhGia-GD1-Vinamilk.pdf", size: "2.4 MB", ext: "PDF" },
                { name: "Checklist-ISO22000.xlsx", size: "412 KB", ext: "XLSX" },
                { name: "hien-truong-01.jpg", size: "1.8 MB", ext: "JPG" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded hover:bg-surface text-xs group cursor-pointer">
                  <div className="size-7 rounded grid place-items-center bg-primary/10 text-primary font-mono text-[9px] font-semibold shrink-0">{f.ext}</div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{f.name}</div>
                    <div className="text-[10px] text-muted-foreground">{f.size}</div>
                  </div>
                  <Download className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                </div>
              ))}
            </div>
          </div>
          {conv.kind === "project" && (
            <div className="p-4">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Liên kết dự án</div>
              <div className="surface-card p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Mã dự án</span>
                  <span className="font-mono">{conv.name.split(" · ")[0]}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tiến độ</span>
                  <span className="font-mono text-success">45%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Deadline</span>
                  <span className="font-mono">28/06</span>
                </div>
                <button className="w-full mt-2 text-[11px] text-primary hover:underline text-center pt-2 border-t border-border">Mở dự án →</button>
              </div>
            </div>
          )}
        </aside>
      ) : null}
    </div>
  );
}

function ConvRow({ c, active, onClick }: { c: Conversation; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-3 py-2.5 flex items-start gap-3 transition border-l-2 ${
        active
          ? "bg-surface border-primary"
          : "border-transparent hover:bg-surface/50"
      }`}
    >
      <ConvAvatar c={c} size={10} />
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1.5">
          <div className={`text-sm truncate flex-1 ${c.unread ? "font-semibold" : "font-medium"}`}>{c.name}</div>
          <div className="text-[10px] text-muted-foreground font-mono shrink-0">{c.time}</div>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className={`text-xs truncate flex-1 ${c.unread ? "text-foreground" : "text-muted-foreground"}`}>{c.last}</div>
          {c.muted && <BellOff className="size-3 text-muted-foreground shrink-0" />}
          {c.unread && (
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground min-w-[18px] text-center shrink-0">
              {c.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function ConvAvatar({ c, size }: { c: Conversation; size: number }) {
  const cls = `size-${size} shrink-0 rounded-md grid place-items-center font-display font-semibold relative`;
  if (c.kind === "channel") {
    return <div className={`${cls} bg-info/20 text-info`}><Hash className="size-4" /></div>;
  }
  if (c.kind === "project") {
    return <div className={`${cls} bg-primary/15 text-primary`}><FolderKanban className="size-4" /></div>;
  }
  if (c.kind === "group") {
    return <div className={`${cls} bg-chart-5/20 text-chart-5`}><Users className="size-4" /></div>;
  }
  const initials = c.name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div className={`${cls} bg-gradient-to-br from-chart-2 to-chart-3 text-foreground text-xs`}>
      {initials}
      {c.online && <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-success ring-2 ring-sidebar" />}
    </div>
  );
}

function MessageBubble({ m, grouped }: { m: Msg; grouped: boolean }) {
  const mine = m.mine;
  return (
    <div className={`group flex gap-3 ${mine ? "flex-row-reverse" : ""} ${grouped ? "-mt-2" : ""}`}>
      <div className="w-9 shrink-0">
        {!grouped && (
          <div className={`size-9 rounded-md grid place-items-center font-display font-semibold text-xs ${
            mine ? "bg-gradient-to-br from-primary to-chart-2 text-primary-foreground" : "bg-gradient-to-br from-chart-2 to-chart-3"
          }`}>
            {m.avatar}
          </div>
        )}
      </div>
      <div className={`flex-1 min-w-0 max-w-[68%] ${mine ? "flex flex-col items-end" : ""}`}>
        {!grouped && (
          <div className={`flex items-baseline gap-2 mb-1 ${mine ? "flex-row-reverse" : ""}`}>
            <span className="text-sm font-semibold">{m.author}</span>
            {m.role && <span className="text-[10px] text-muted-foreground">{m.role}</span>}
            <span className="text-[10px] text-muted-foreground font-mono">{m.time}</span>
          </div>
        )}
        {m.reply && (
          <div className={`mb-1 pl-3 border-l-2 border-primary text-xs ${mine ? "text-right border-r-2 border-l-0 pr-3 pl-0" : ""}`}>
            <div className="text-primary font-medium">{m.reply.author}</div>
            <div className="text-muted-foreground truncate">{m.reply.text}</div>
          </div>
        )}
        {m.text && (
          <div className={`inline-block px-3.5 py-2 text-sm rounded-lg whitespace-pre-wrap break-words ${
            mine
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-surface border border-border rounded-tl-sm"
          }`}>
            {m.text.split(/(@\S+)/g).map((part, i) =>
              part.startsWith("@")
                ? <span key={i} className={mine ? "underline font-medium" : "text-primary font-medium"}>{part}</span>
                : <span key={i}>{part}</span>
            )}
          </div>
        )}
        {m.attachments && (
          <div className={`mt-1.5 flex flex-col gap-1.5 ${mine ? "items-end" : "items-start"}`}>
            {m.attachments.filter((a) => a.kind === "image").length > 0 && (
              <div className="grid grid-cols-3 gap-1 max-w-sm">
                {m.attachments.filter((a) => a.kind === "image").map((a, i) => (
                  <div key={i} className="aspect-square rounded-md border border-border bg-gradient-to-br from-surface to-surface-2 grid place-items-center group/img relative overflow-hidden cursor-pointer hover:border-primary transition">
                    <ImageIcon className="size-6 text-muted-foreground" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent text-[9px] text-white font-mono px-1.5 py-1 opacity-0 group-hover/img:opacity-100 transition truncate">
                      {a.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {m.attachments.filter((a) => a.kind === "file").map((a, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-surface border border-border rounded-md max-w-sm group/file cursor-pointer hover:border-primary transition">
                <div className="size-9 rounded grid place-items-center bg-primary/10 text-primary font-mono text-[10px] font-semibold shrink-0">
                  {a.ext ?? "FILE"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{a.name}</div>
                  <div className="text-[10px] text-muted-foreground">{a.size}</div>
                </div>
                <button className="size-7 grid place-items-center rounded text-muted-foreground opacity-0 group-hover/file:opacity-100 hover:bg-muted transition shrink-0">
                  <Download className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        {m.reactions && m.reactions.length > 0 && (
          <div className={`flex gap-1 mt-1 ${mine ? "justify-end" : ""}`}>
            {m.reactions.map((r, i) => (
              <button key={i} className={`text-[11px] px-1.5 py-0.5 rounded-full border flex items-center gap-1 transition ${
                r.mine ? "bg-primary/15 border-primary text-foreground" : "bg-surface border-border hover:border-primary/40"
              }`}>
                <span>{r.emoji}</span>
                <span className="font-mono tabular-nums text-[10px]">{r.count}</span>
              </button>
            ))}
          </div>
        )}
        {mine && m.status && (
          <div className="text-[10px] text-muted-foreground font-mono mt-0.5 flex items-center gap-1">
            {m.status === "sent" && <><Check className="size-3" /> Đã gửi</>}
            {m.status === "delivered" && <><CheckCheck className="size-3" /> Đã nhận</>}
            {m.status === "read" && <><CheckCheck className="size-3 text-info" /> Đã đọc</>}
          </div>
        )}
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition self-start mt-1 hidden md:flex items-center gap-0.5">
        <button className="size-7 grid place-items-center rounded hover:bg-surface text-muted-foreground" title="Trả lời"><Reply className="size-3.5" /></button>
        <button className="size-7 grid place-items-center rounded hover:bg-surface text-muted-foreground" title="Cảm xúc"><Smile className="size-3.5" /></button>
        <button className="size-7 grid place-items-center rounded hover:bg-surface text-muted-foreground" title="Thêm"><MoreHorizontal className="size-3.5" /></button>
      </div>
    </div>
  );
}

function IconBtn({ icon: Icon, label }: { icon: typeof Pin; label: string }) {
  return (
    <button className="flex-1 flex flex-col items-center gap-1 py-2 rounded-md hover:bg-surface transition text-muted-foreground hover:text-foreground" title={label}>
      <Icon className="size-3.5" />
      <span className="text-[9px]">{label}</span>
    </button>
  );
}
