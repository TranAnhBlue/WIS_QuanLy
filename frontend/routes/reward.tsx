import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Award, ArrowLeft, Gift, Sparkles, TrendingUp, Star, Trophy, Coins,
  Plus, Search, Filter, ShoppingBag, Target, CheckCircle2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { message } from "antd";
import { businessApi } from "@/lib/backend-api";

export const Route = createFileRoute("/reward")({
  head: () => ({
    meta: [
      { title: "Tích thưởng — WIS" },
      { name: "description", content: "Hệ thống tích điểm & phần thưởng cho nhân sự Line 1, Line 2, Line 3." },
    ],
  }),
  component: RewardsPage,
});

type Line = "Line 1" | "Line 2" | "Line 3";

type Member = {
  id: string;
  name: string;
  code: string;
  line: Line;
  title: string;
  points: number;
  delta: number;
  streak: number;
};

type Activity = {
  id: string;
  who: string;
  action: string;
  points: number;
  when: string;
  type: "earn" | "redeem";
};

type RewardItem = {
  id: string;
  name: string;
  cost: number;
  stock: number;
  category: "Voucher" | "Hiện vật" | "Trải nghiệm" | "Đào tạo";
  desc: string;
};

const REWARDS: RewardItem[] = [
  { id: "r1", name: "Voucher Grab 200K", cost: 500, stock: 20, category: "Voucher", desc: "Mã Grab áp dụng cho di chuyển & GrabFood." },
  { id: "r2", name: "Áo polo đồng phục WIS", cost: 800, stock: 45, category: "Hiện vật", desc: "Áo polo cotton co-giãn, in logo WIS." },
  { id: "r3", name: "Voucher Highlands 300K", cost: 700, stock: 15, category: "Voucher", desc: "Áp dụng tại toàn bộ chi nhánh Highlands." },
  { id: "r4", name: "Team-building 1 ngày", cost: 3000, stock: 5, category: "Trải nghiệm", desc: "Đi cùng team, chi phí Line chi trả." },
  { id: "r5", name: "Khóa học Coursera Plus (1 tháng)", cost: 1200, stock: 10, category: "Đào tạo", desc: "Truy cập toàn bộ khóa học Coursera Plus." },
  { id: "r6", name: "Balo laptop cao cấp", cost: 2200, stock: 8, category: "Hiện vật", desc: "Balo chống nước, ngăn laptop 15.6\"." },
];

const LINE_COLOR: Record<Line, string> = {
  "Line 1": "oklch(0.72 0.17 155)",
  "Line 2": "oklch(0.7 0.15 230)",
  "Line 3": "oklch(0.65 0.2 310)",
};

function RewardsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [recordId, setRecordId] = useState("");
  const [filterLine, setFilterLine] = useState<"all" | Line>("all");
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"leaderboard" | "shop" | "history">("leaderboard");
  const [giveOpen, setGiveOpen] = useState(false);

  useEffect(() => {
    businessApi.list<{ id: string; members: Member[]; activities: Activity[] }>("rewards")
      .then((rows) => {
        const state = rows[0];
        if (state) { setRecordId(state.id); setMembers(state.members || []); setActivities(state.activities || []); }
      }).catch((e) => message.error(e.message));
  }, []);

  async function persist(nextMembers: Member[], nextActivities: Activity[]) {
    if (recordId) return businessApi.update("rewards", { id: recordId, members: nextMembers, activities: nextActivities });
    const created = await businessApi.create<{ id: string; members: Member[]; activities: Activity[] }>("rewards", { id: "", members: nextMembers, activities: nextActivities });
    setRecordId(created.id);
  }

  const filtered = useMemo(() => {
    let list = [...members].sort((a, b) => b.points - a.points);
    if (filterLine !== "all") list = list.filter((m) => m.line === filterLine);
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter((m) => m.name.toLowerCase().includes(s) || m.code.toLowerCase().includes(s));
    }
    return list;
  }, [members, filterLine, q]);

  const totalPoints = members.reduce((s, m) => s + m.points, 0);
  const monthDelta = members.reduce((s, m) => s + m.delta, 0);
  const byLine = (["Line 1", "Line 2", "Line 3"] as Line[]).map((l) => ({
    line: l,
    total: members.filter((m) => m.line === l).reduce((s, m) => s + m.points, 0),
  }));

  const redeem = async (item: RewardItem, memberId: string) => {
    const m = members.find((x) => x.id === memberId);
    if (!m || m.points < item.cost) return;
    const nextMembers = members.map((x) => (x.id === memberId ? { ...x, points: x.points - item.cost } : x));
    const nextActivities: Activity[] = [
      { id: `a${Date.now()}`, who: m.name, action: `Đổi ${item.name}`, points: -item.cost, when: "Vừa xong", type: "redeem" },
      ...activities,
    ];
    try { await persist(nextMembers, nextActivities); setMembers(nextMembers); setActivities(nextActivities); }
    catch (e) { message.error(e instanceof Error ? e.message : "Không thể đổi thưởng"); }
  };

  const givePoints = async (memberId: string, pts: number, reason: string) => {
    const m = members.find((x) => x.id === memberId);
    if (!m || pts <= 0) {
      message.error("Không thể cộng điểm. Vui lòng kiểm tra lại.");
      return;
    }
    const nextMembers = members.map((x) => (x.id === memberId ? { ...x, points: x.points + pts, delta: x.delta + pts } : x));
    const nextActivities: Activity[] = [
      { id: `a${Date.now()}`, who: m.name, action: reason || "Cộng điểm thưởng", points: pts, when: "Vừa xong", type: "earn" },
      ...activities,
    ];
    try { await persist(nextMembers, nextActivities); setMembers(nextMembers); setActivities(nextActivities); message.success(`Đã cộng ${pts} điểm cho ${m.name}`); }
    catch (e) { message.error(e instanceof Error ? e.message : "Không thể cộng điểm"); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center gap-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Dashboard
          </Link>
          <div className="h-6 w-px bg-border" />
          <div className="size-9 grid place-items-center rounded-md bg-primary text-primary-foreground">
            <Award className="size-4" />
          </div>
          <div>
            <div className="font-display font-semibold leading-tight">Tích thưởng</div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">WIS · Hệ sinh thái xanh</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setGiveOpen(true)}
              className="inline-flex items-center gap-2 px-3 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
            >
              <Plus className="size-4" /> Cộng điểm
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Coins} label="Tổng điểm lưu hành" value={totalPoints.toLocaleString("vi-VN")} sub={`+${monthDelta} tháng này`} tone="primary" />
          <StatCard icon={TrendingUp} label="Điểm cộng tháng này" value={monthDelta.toLocaleString("vi-VN")} sub="Toàn hệ sinh thái" tone="success" />
          <StatCard icon={Gift} label="Phần thưởng có sẵn" value={REWARDS.length} sub={`${REWARDS.reduce((s, r) => s + r.stock, 0)} suất`} tone="info" />
          <StatCard icon={Trophy} label="Người dẫn đầu" value={members.sort((a,b)=>b.points-a.points)[0]?.name.split(" ").slice(-1)[0] || "—"} sub={`${members.sort((a,b)=>b.points-a.points)[0]?.points.toLocaleString("vi-VN")} điểm`} tone="warning" />
        </div>

        {/* Line breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {byLine.map((b) => (
            <div key={b.line} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ background: LINE_COLOR[b.line] }} />
                <div className="text-sm font-medium">{b.line}</div>
                <div className="ml-auto text-xs text-muted-foreground">{members.filter((m) => m.line === b.line).length} thành viên</div>
              </div>
              <div className="mt-2 font-display text-2xl font-semibold tabular-nums">{b.total.toLocaleString("vi-VN")}</div>
              <div className="mt-2 h-1.5 rounded bg-muted overflow-hidden">
                <div className="h-full" style={{ width: `${Math.min(100, (b.total / Math.max(totalPoints, 1)) * 100)}%`, background: LINE_COLOR[b.line] }} />
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border">
          {[
            { id: "leaderboard", label: "Bảng xếp hạng", icon: Trophy },
            { id: "shop", label: "Đổi thưởng", icon: ShoppingBag },
            { id: "history", label: "Lịch sử", icon: Sparkles },
          ].map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as typeof tab)}
                className={`inline-flex items-center gap-2 px-4 h-10 text-sm border-b-2 -mb-px transition ${
                  active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === "leaderboard" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Tìm theo tên hoặc mã NV…"
                  className="w-full h-9 pl-9 pr-3 rounded-md border border-border bg-background text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="inline-flex items-center gap-1 rounded-md border border-border p-1">
                {(["all", "Line 1", "Line 2", "Line 3"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setFilterLine(l)}
                    className={`px-2.5 h-7 rounded text-xs font-medium ${filterLine === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {l === "all" ? "Tất cả" : l}
                  </button>
                ))}
              </div>
              <div className="text-xs text-muted-foreground ml-auto inline-flex items-center gap-1">
                <Filter className="size-3.5" /> {filtered.length} người
              </div>
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-2.5 w-14">#</th>
                    <th className="text-left px-4 py-2.5">Nhân sự</th>
                    <th className="text-left px-4 py-2.5">Line</th>
                    <th className="text-right px-4 py-2.5">Điểm</th>
                    <th className="text-right px-4 py-2.5">+ tháng này</th>
                    <th className="text-right px-4 py-2.5">Streak</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m, idx) => (
                    <tr key={m.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-4 py-3">
                        {idx < 3 ? (
                          <span className={`inline-flex items-center justify-center size-7 rounded-full text-xs font-bold ${
                            idx === 0 ? "bg-amber-500/20 text-amber-600" : idx === 1 ? "bg-slate-400/20 text-slate-500" : "bg-orange-500/20 text-orange-600"
                          }`}>
                            <Trophy className="size-3.5" />
                          </span>
                        ) : (
                          <span className="text-muted-foreground tabular-nums">{idx + 1}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-muted grid place-items-center text-xs font-semibold">
                            {m.name.split(" ").slice(-2).map((w) => w[0]).join("")}
                          </div>
                          <div>
                            <div className="font-medium leading-tight">{m.name}</div>
                            <div className="text-xs text-muted-foreground">{m.code} · {m.title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded border" style={{ borderColor: LINE_COLOR[m.line], color: LINE_COLOR[m.line] }}>
                          <span className="size-1.5 rounded-full" style={{ background: LINE_COLOR[m.line] }} />
                          {m.line}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-display font-semibold">
                        {m.points.toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-emerald-600">+{m.delta}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                          <Star className="size-3 fill-current" /> {m.streak} tuần
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">Không có kết quả</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "shop" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {REWARDS.map((r) => (
              <div key={r.id} className="rounded-lg border border-border bg-card p-4 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground">{r.category}</div>
                    <div className="font-medium mt-0.5">{r.name}</div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                    <Coins className="size-3" /> {r.cost.toLocaleString("vi-VN")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex-1">{r.desc}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">Còn {r.stock} suất</span>
                  <RedeemMenu members={members} onPick={(id) => redeem(r, id)} cost={r.cost} />
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "history" && (
          <div className="rounded-lg border border-border overflow-hidden">
            <ul className="divide-y divide-border">
              {activities.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`size-9 rounded-full grid place-items-center ${a.type === "earn" ? "bg-emerald-500/15 text-emerald-600" : "bg-orange-500/15 text-orange-600"}`}>
                    {a.type === "earn" ? <CheckCircle2 className="size-4" /> : <Gift className="size-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm"><span className="font-medium">{a.who}</span> · {a.action}</div>
                    <div className="text-xs text-muted-foreground">{a.when}</div>
                  </div>
                  <div className={`tabular-nums font-semibold ${a.points >= 0 ? "text-emerald-600" : "text-orange-600"}`}>
                    {a.points > 0 ? "+" : ""}{a.points}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      {giveOpen && <GivePointsModal members={members} onClose={() => setGiveOpen(false)} onSubmit={(id, pts, r) => { givePoints(id, pts, r); setGiveOpen(false); }} />}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, tone }: { icon: LucideIcon; label: string; value: string | number; sub: string; tone: string }) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-500/15 text-emerald-600",
    info: "bg-sky-500/15 text-sky-600",
    warning: "bg-amber-500/15 text-amber-600",
  };
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <div className={`size-8 grid place-items-center rounded-md ${tones[tone]}`}>
          <Icon className="size-4" />
        </div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
      <div className="mt-3 font-display text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}

function RedeemMenu({ members, cost, onPick }: { members: Member[]; cost: number; onPick: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90"
      >
        <Gift className="size-3.5" /> Đổi thưởng
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 bottom-full mb-2 z-20 w-64 max-h-64 overflow-auto rounded-md border border-border bg-popover shadow-lg p-1">
            {members.map((m) => {
              const can = m.points >= cost;
              return (
                <button
                  key={m.id}
                  disabled={!can}
                  onClick={() => { onPick(m.id); setOpen(false); }}
                  className={`w-full text-left px-2.5 py-2 rounded text-sm flex items-center gap-2 ${can ? "hover:bg-muted" : "opacity-50 cursor-not-allowed"}`}
                >
                  <span className="size-6 rounded-full bg-muted grid place-items-center text-[10px] font-semibold">
                    {m.name.split(" ").slice(-2).map((w) => w[0]).join("")}
                  </span>
                  <span className="flex-1 truncate">{m.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{m.points.toLocaleString("vi-VN")}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function GivePointsModal({ members, onClose, onSubmit }: { members: Member[]; onClose: () => void; onSubmit: (id: string, pts: number, reason: string) => void }) {
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [pts, setPts] = useState(100);
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-4">
          <Target className="size-4 text-primary" />
          <div className="font-display font-semibold">Cộng điểm thưởng</div>
        </div>
        <div className="space-y-3">
          <label className="block">
            <div className="text-xs text-muted-foreground mb-1">Nhân sự</div>
            <select value={memberId} onChange={(e) => setMemberId(e.target.value)} className="w-full h-9 px-2 rounded-md border border-border bg-background text-sm">
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name} · {m.line} · {m.points.toLocaleString("vi-VN")}đ</option>
              ))}
            </select>
          </label>
          <label className="block">
            <div className="text-xs text-muted-foreground mb-1">Số điểm</div>
            <input type="number" min={1} value={pts} onChange={(e) => setPts(parseInt(e.target.value) || 0)} className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm" />
          </label>
          <label className="block">
            <div className="text-xs text-muted-foreground mb-1">Lý do</div>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="VD: Hoàn thành dự án ISO 9001" className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm" />
          </label>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-3 h-9 rounded-md border border-border text-sm hover:bg-muted">Hủy</button>
          <button onClick={() => onSubmit(memberId, pts, reason)} className="px-3 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium">Cộng điểm</button>
        </div>
      </div>
    </div>
  );
}
