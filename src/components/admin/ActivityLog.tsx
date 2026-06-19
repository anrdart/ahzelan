"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

type Log = {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
};

const ACTION_COLORS: Record<string, "success" | "accent" | "destructive" | "neutral"> = {
  create: "success",
  update: "accent",
  delete: "destructive",
};

const ENTITY_LABELS: Record<string, string> = {
  articles: "Artikel", services: "Layanan", packages: "Paket", testimonials: "Testimoni",
  faqs: "FAQ", recommendations: "Rekomendasi", media: "Media", pages: "Halaman",
  sections: "Seksi", navigation_items: "Navigasi", site_settings: "Pengaturan",
  chat_sessions: "Chat", gallery_items: "Galeri", bio_links: "Bio Link",
  process_steps: "Proses", skills: "Keahlian",
};

const ENTITY_TYPES = Object.keys(ENTITY_LABELS);

function relTime(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return "Baru saja";
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j lalu`;
  const dd = Math.floor(h / 24);
  if (dd === 1) return "Kemarin";
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export default function ActivityLog() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [hasMore, setHasMore] = useState(true);

  const fetchLogs = async (offset = 0, append = false, ignoreRef?: { current: boolean }) => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "50", offset: String(offset) });
    if (typeFilter !== "all") params.set("type", typeFilter);
    try {
      const res = await fetch(`/api/admin/activity?${params}`);
      if (res.ok && !ignoreRef?.current) {
        const data = (await res.json()) as Log[];
        setLogs((prev) => {
          if (!append) return data;
          const seen = new Set(prev.map((l) => l.id));
          return [...prev, ...data.filter((l) => !seen.has(l.id))];
        });
        setHasMore(data.length === 50);
      }
    } catch { /* ignore */ }
    if (!ignoreRef?.current) setLoading(false);
  };

  useEffect(() => {
    const ignore = { current: false };
    fetchLogs(0, false, ignore);
    return () => { ignore.current = true; };
  }, [typeFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Semua tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua tipe</SelectItem>
            {ENTITY_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{ENTITY_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>Aksi</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead className="hidden md:table-cell">Entity ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">Belum ada aktivitas.</TableCell>
              </TableRow>
            ) : (
              logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{relTime(l.created_at)}</TableCell>
                  <TableCell>
                    <Badge variant={ACTION_COLORS[l.action] ?? "neutral"}>{l.action}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{ENTITY_LABELS[l.entity_type] ?? l.entity_type}</TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">{l.entity_id?.slice(0, 8) ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {loading && (
        <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
      )}
      {hasMore && !loading && logs.length > 0 && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={() => fetchLogs(logs.length, true)}>Muat lebih banyak</Button>
        </div>
      )}
    </div>
  );
}
