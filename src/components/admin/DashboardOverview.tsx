"use client";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import StatCard from "./StatCard";

type Stat = { label: string; value: string; icon: string; delta: string };
type Article = { id: string; title: string; category: string; date: string; status: "Published" | "Draft" };
type Activity = { icon: string; text: string; time: string };

const QUICK = [
  { icon: "square-pen", label: "Edit Homepage", href: "/admin/pages" },
  { icon: "upload", label: "Upload Media", href: "/admin/media" },
  { icon: "palette", label: "Ubah Warna", href: "/admin/theme" },
  { icon: "plus", label: "Tambah Artikel", href: "/admin/articles" },
];

export default function DashboardOverview({ stats, articles, activity }: { stats: Stat[]; articles: Article[]; activity: Activity[] }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4.5">
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6">
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-border rounded-2xl">
            <div className="px-5 py-4.5 border-b border-border font-display font-bold text-base">Aksi Cepat</div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {QUICK.map((q) => (
                <a key={q.label} href={q.href} className="flex flex-col items-center gap-2.5 p-5 bg-surface-page border border-border rounded-xl font-display font-semibold text-[13.5px] hover:bg-royal-50 hover:border-royal-200 transition-colors">
                  <span className="w-11 h-11 rounded-xl bg-white border border-border text-royal-700 flex items-center justify-center">
                    <Icon name={q.icon} size={22} />
                  </span>
                  {q.label}
                </a>
              ))}
            </div>
          </div>

          <div className="bg-white border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4.5 border-b border-border flex justify-between items-center">
              <span className="font-display font-bold text-base">Artikel Terbaru</span>
              <a href="/admin/articles" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground font-semibold">Semua <Icon name="arrow-right" size={14} /></a>
            </div>
            <div>
              {articles.length === 0 && <div className="p-6 text-sm text-muted-foreground text-center">Belum ada artikel.</div>}
              {articles.map((a, i) => (
                <div key={a.id} className="flex items-center gap-3.5 px-5 py-3.5" style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                  <span className="w-9.5 h-9.5 rounded-lg bg-muted text-slate-600 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center shrink-0" style={{ width: 38, height: 38 }}>
                    <Icon name="file-text" size={18} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[14.5px] font-display truncate">{a.title}</div>
                    <div className="text-[12.5px] text-muted-foreground">{a.category} · {a.date}</div>
                  </div>
                  <Badge variant={a.status === "Published" ? "success" : "neutral"} dot={a.status === "Published"}>
                    {a.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-border rounded-2xl">
          <div className="px-5 py-4.5 border-b border-border font-display font-bold text-base">Aktivitas</div>
          <div className="px-5 py-2.5">
            {activity.map((a, i) => (
              <div key={i} className="flex gap-3 py-3" style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                <span className="w-8 h-8 rounded-lg bg-royal-50 text-royal-700 flex items-center justify-center shrink-0">
                  <Icon name={a.icon} size={16} />
                </span>
                <div>
                  <div className="text-sm leading-snug">{a.text}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
