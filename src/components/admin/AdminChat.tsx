"use client";
import { useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

type Sess = {
  id: string;
  guest_name: string | null;
  guest_email: string | null;
  status: "bot" | "live_requested" | "live" | "closed";
  bot_mode: boolean;
  admin_unread: number;
  last_message_at: string;
  summary: string | null;
  created_at: string;
};
type Msg = { id: string; session_id: string; role: "user" | "assistant" | "system" | "admin"; actor: "guest" | "bot" | "admin"; content: string; created_at: string };

const SB_URL = import.meta.env.PUBLIC_SUPABASE_URL;
const SB_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const ENABLED = Boolean(SB_URL && SB_KEY);

async function readJson<T = any>(r: Response): Promise<T> {
  try { return (await r.json()) as T; } catch { return {} as T; }
}

const fmtTime = (iso: string) => new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const fmtShort = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay ? d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
};

export default function AdminChat({ initialSessions }: { initialSessions: Sess[] }) {
  const [sessions, setSessions] = useState<Sess[]>(initialSessions);
  const [activeId, setActiveId] = useState<string | null>(initialSessions[0]?.id ?? null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load thread when active changes
  useEffect(() => {
    if (!activeId) return;
    setLoading(true);
    setMsgs([]);
    fetch(`/api/admin/chat/${activeId}`)
      .then((r) => readJson<{ messages?: Msg[] }>(r))
      .then((d) => { setMsgs(d.messages ?? []); })
      .finally(() => setLoading(false));
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [msgs, activeId]);

  // Realtime: new messages + session updates
  useEffect(() => {
    if (!ENABLED) return;
    const sb = createBrowserClient(SB_URL, SB_KEY);
    const ch = sb
      .channel("admin-chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (p: any) => {
        const m = p.new as Msg;
        if (m.session_id === activeId) {
          setMsgs((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        }
        // refresh session list (new message bumps last_message_at / unread)
        refreshSessions();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_sessions" }, () => refreshSessions())
      .subscribe();
    return () => { sb.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // Poll fallback if realtime unavailable (every 15s)
  useEffect(() => {
    const id = setInterval(refreshSessions, 15000);
    return () => clearInterval(id);
  }, []);

  const refreshSessions = async () => {
    try {
      const r = await fetch("/api/admin/chat/sessions", { cache: "no-store" });
      if (!r.ok) return;
      const d = await readJson<{ sessions?: Sess[] }>(r);
      setSessions(d.sessions ?? []);
    } catch {}
  };

  const send = async () => {
    const text = reply.trim();
    if (!text || !activeId || sending) return;
    setSending(true);
    try {
      const r = await fetch("/api/admin/chat/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: activeId, content: text }),
      });
      const body = await readJson<Msg & { error?: string }>(r);
      if (!r.ok) throw new Error(body.error || "Gagal");
      setMsgs((prev) => [...prev, body]);
      setReply("");
      refreshSessions();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const active = sessions.find((s) => s.id === activeId);
  const pending = sessions.filter((s) => s.status === "live_requested");

  if (!ENABLED) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-700 p-6 text-sm">
        Live chat butuh Supabase (PUBLIC_SUPABASE_URL + anon key). Set di <code>.env</code> lalu jalankan <code>supabase/migrations/0002_live_chat.sql</code>.
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-5 h-[calc(100vh-220px)] min-h-[480px]">
      {/* Session list */}
      <div className="flex flex-col bg-white dark:bg-slate-900 border border-border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="font-display font-bold text-sm">Obrolan</span>
          {pending.length > 0 && <Badge variant="accent">{pending.length} menunggu</Badge>}
        </div>
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Belum ada obrolan masuk.</div>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveId(s.id)}
                className={cn(
                  "w-full text-left px-4 py-3 border-b border-border transition-colors",
                  activeId === s.id ? "bg-royal-50 dark:bg-slate-800" : "hover:bg-muted/50",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display font-semibold text-sm truncate">{s.guest_name || "Tamu"}</span>
                  <span className="text-[11px] text-muted-foreground shrink-0">{fmtShort(s.last_message_at)}</span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground truncate">{s.summary || "—"}</span>
                  {s.admin_unread > 0 && (
                    <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center">{s.admin_unread}</span>
                  )}
                </div>
                <div className="mt-1">
                  <SessionBadge status={s.status} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Thread */}
      <div className="flex flex-col bg-white dark:bg-slate-900 border border-border rounded-2xl overflow-hidden">
        {active ? (
          <>
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div>
                <div className="font-display font-bold text-sm">{active.guest_name || "Tamu"}</div>
                <div className="text-xs text-muted-foreground">{active.guest_email || "tanpa email"}</div>
              </div>
              <SessionBadge status={active.status} />
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-background">
              {loading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : (
                msgs.map((m) => <AdminBubble key={m.id} msg={m} />)
              )}
            </div>

            <div className="p-3 border-t border-border flex gap-2 items-end">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                rows={1}
                placeholder="Ketik balasan ke tamu…"
                className="flex-1 resize-none max-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
              <button onClick={send} disabled={sending || !reply.trim()} className="h-10 w-10 shrink-0 rounded-md bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Pilih obrolan di kiri</div>
        )}
      </div>
    </div>
  );
}

function SessionBadge({ status }: { status: Sess["status"] }) {
  if (status === "live_requested") return <Badge variant="accent">Menunggu</Badge>;
  if (status === "live") return <Badge variant="success" dot>Aktif</Badge>;
  if (status === "closed") return <Badge variant="neutral">Selesai</Badge>;
  return <Badge variant="soft">Bot</Badge>;
}

function AdminBubble({ msg }: { msg: Msg }) {
  const isGuest = msg.actor === "guest";
  const isAdmin = msg.actor === "admin";
  if (msg.role === "system") {
    return <div className="text-center text-[11px] text-muted-foreground bg-muted rounded-lg px-3 py-1.5 mx-auto max-w-[90%]">{msg.content}</div>;
  }
  return (
    <div className={cn("flex", isGuest ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[75%] px-3.5 py-2 text-sm leading-relaxed rounded-2xl",
          isAdmin
            ? "bg-amber-500 text-white rounded-br-sm"
            : isGuest
            ? "bg-muted text-foreground rounded-bl-sm"
            : "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100 rounded-br-sm",
        )}
      >
        {msg.actor === "bot" && <div className="text-[10px] font-bold uppercase opacity-60 mb-0.5">AI Bot</div>}
        <div className="whitespace-pre-wrap break-words">{msg.content}</div>
        <div className="text-[10px] opacity-60 mt-1 text-right">{fmtTime(msg.created_at)}</div>
      </div>
    </div>
  );
}
