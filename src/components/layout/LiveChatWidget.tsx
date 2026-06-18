"use client";
import { useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Icon } from "@/components/ui/icon";
import { SITE, waLink } from "@/lib/site";

type Msg = { id?: string; role: "user" | "assistant" | "system" | "admin"; actor: "guest" | "bot" | "admin"; content: string; created_at?: string };
type Sess = { id: string; guest_token: string; status: "bot" | "live_requested" | "live" | "closed"; bot_mode: boolean };

const WELCOME: Msg = {
  role: "assistant",
  actor: "bot",
  content: "Halo! 👋 Aku asisten AI Ahzelan. Tanya apa aja soal landing page, website, copywriting, atau ads ya. Kalau mau ngobrol langsung sama Ahzelan, tinggal klik 'Minta Live Chat'.",
};

const GREETINGS = ["halo", "hai", "hi", "pagi", "siang", "sore", "malam", "salam"];

const SB_URL = import.meta.env.PUBLIC_SUPABASE_URL;
const SB_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const ENABLED = Boolean(SB_URL && SB_KEY);

async function readJson<T = any>(r: Response): Promise<T> {
  try { return (await r.json()) as T; } catch { return {} as T; }
}

function getToken(): string {
  try {
    let t = localStorage.getItem("ahz-chat-token");
    if (!t) {
      t = "g-" + crypto.randomUUID();
      localStorage.setItem("ahz-chat-token", t);
    }
    return t;
  } catch {
    return "g-fallback";
  }
}

export default function LiveChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sess, setSess] = useState<Sess | null>(null);
  const [showLiveForm, setShowLiveForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [unread, setUnread] = useState(0);
  const [liveRequested, setLiveRequested] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Ensure session on first open
  const ensureSession = async () => {
    if (!ENABLED || sess) return sess;
    try {
      const r = await fetch("/api/chat/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guest_token: getToken() }),
      });
      if (!r.ok) return null;
      const data = await readJson<{ session?: Sess; messages?: Msg[] }>(r);
      setSess(data.session ?? null);
      const history: Msg[] = (data.messages ?? []).map((m: any) => ({ ...m }));
      if (history.length) setMsgs(history);
      return data.session ?? null;
    } catch {
      return null;
    }
  };

  // When opening, ensure session + clear guest unread
  useEffect(() => {
    if (open && ENABLED) {
      ensureSession();
      setUnread(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Legacy "Chat Ahzelan" CTAs around the site dispatch this event; open the widget.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("ahz:open-contact", onOpen);
    return () => window.removeEventListener("ahz:open-contact", onOpen);
  }, []);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open, showLiveForm]);

  // Realtime: listen for admin/bot replies via Supabase channel
  useEffect(() => {
    if (!ENABLED || !sess) return;
    const sb = createBrowserClient(SB_URL, SB_KEY);
    const channel = sb
      .channel("ahz-chat-" + sess.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `session_id=eq.${sess.id}` }, (payload: any) => {
        const m = payload.new as Msg;
        // Only append messages not from the guest (those are echoed on send)
        if (m.actor !== "guest") {
          setMsgs((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          if (!open) setUnread((u) => u + 1);
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chat_sessions", filter: `id=eq.${sess.id}` }, (payload: any) => {
        setSess(payload.new as Sess);
        if (payload.new.status === "live_requested" || payload.new.status === "live") setLiveRequested(true);
      })
      .subscribe();
    return () => { sb.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sess?.id]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setBusy(true);
    setMsgs((prev) => [...prev, { role: "user", actor: "guest", content: text }]);

    if (!ENABLED) {
      // Offline/local FAQ-lite fallback
      const t = text.toLowerCase();
      const isGreet = GREETINGS.some((g) => t.startsWith(g) || t === g);
      const reply: Msg = isGreet
        ? { role: "assistant", actor: "bot", content: "Halo! 👋 Saat ini mode demo — Supabase belum di-set, jadi aku balas statis. Colok env Supabase + Z.ai buat AI penuh ya." }
        : { role: "assistant", actor: "bot", content: "Aku belum connect ke server (mode demo). Hubungkan Supabase + ZAI_API_KEY biar aku bisa jawab beneran 🙏" };
      setTimeout(() => setMsgs((prev) => [...prev, reply]), 350);
      setBusy(false);
      return;
    }

    await ensureSession();
    try {
      const r = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guest_token: getToken(), content: text }),
      });
      const data = await readJson<{ error?: string; messages?: Msg[]; reply?: string; reason?: string; bot_mode?: boolean }>(r);
      if (!r.ok) throw new Error(data.error || "Gagal");
      // Reconcile from server history (authoritative)
      if (Array.isArray(data.messages)) {
        setMsgs(data.messages);
      } else if (data.reply) {
        setMsgs((prev) => [...prev, { role: data.reason === "human" ? "system" : "assistant", actor: "bot", content: data.reply! }]);
      }
      if (data.bot_mode === false && data.reason === "human") {
        setLiveRequested(true);
      }
    } catch (e: any) {
      setMsgs((prev) => [...prev, { role: "system", actor: "bot", content: "Yah, gagal kirim. Coba lagi ya." }]);
    } finally {
      setBusy(false);
    }
  };

  const requestLive = async () => {
    if (!ENABLED) {
      setShowLiveForm(false);
      setLiveRequested(true);
      setMsgs((prev) => [...prev, { role: "system", actor: "bot", content: "Mode demo: live chat belum aktif. Sambil nunggu, WA aja ya → wa.me/6285156563313" }]);
      return;
    }
    await ensureSession();
    try {
      const r = await fetch("/api/chat/request-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guest_token: getToken(), name, email }),
      });
      if (!r.ok) throw new Error("Gagal");
      setShowLiveForm(false);
      setLiveRequested(true);
      // The system message from the server will arrive via realtime; also fetch
      const fresh = await fetch("/api/chat/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ guest_token: getToken() }) });
      const j = await readJson<{ messages?: Msg[] }>(fresh);
      if (Array.isArray(j.messages)) setMsgs(j.messages);
    } catch {
      setMsgs((prev) => [...prev, { role: "system", actor: "bot", content: "Gagal request live chat. Coba WA langsung ya." }]);
    }
  };

  const status = !ENABLED
    ? "Mode demo"
    : liveRequested || (sess && (sess.status === "live_requested" || sess.status === "live"))
    ? "Menunggu Ahzelan…"
    : "AI Aktif";

  return (
    <>
      {/* Floating launcher */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Tutup chat" : "Buka live chat"}
        className="fixed right-5 bottom-5 z-50 inline-flex items-center gap-2.5 h-14 rounded-full bg-primary pl-5 pr-6 text-white shadow-brand font-display font-bold text-[15px] hover:scale-[1.03] active:scale-[0.97] transition-transform"
      >
        <Icon name="message-circle" size={22} />
        <span className="hidden sm:inline">{open ? "Tutup" : "Live Chat"}</span>
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center">{unread}</span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed right-5 bottom-24 z-50 w-[calc(100vw-2.5rem)] max-w-[380px] h-[min(560px,75vh)] flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="on-dark bg-primary px-4 py-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
              <Icon name="message-circle" size={18} />
            </div>
            <div className="flex-1">
              <div className="font-display font-bold text-sm leading-tight">Ahzelan Live Chat</div>
              <div className="text-[11px] text-white/80 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> {status}
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Tutup" className="text-white/80 hover:text-white">
              <Icon name="x" size={18} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3.5 space-y-2.5 bg-background">
            {msgs.map((m, i) => (
              <Bubble key={m.id ?? i} msg={m} />
            ))}
            {busy && <div className="text-center text-xs text-muted-foreground py-1">Ahzelan AI lagi ngetik…</div>}
          </div>

          {/* Live request form */}
          {showLiveForm ? (
            <div className="p-3.5 border-t border-border bg-card space-y-2.5">
              <div className="text-sm font-display font-semibold">Ngobrol langsung sama Ahzelan</div>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kamu (opsional)" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email/WhatsApp (opsional)" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
              <div className="flex gap-2">
                <button onClick={() => setShowLiveForm(false)} className="flex-1 h-10 rounded-md border border-input bg-background text-sm font-semibold">Batal</button>
                <button onClick={requestLive} className="flex-1 h-10 rounded-md bg-primary text-primary-foreground text-sm font-semibold">Kirim Permintaan</button>
              </div>
            </div>
          ) : (
            <>
              {/* Quick actions */}
              {!liveRequested && (
                <div className="px-3.5 pt-2 flex gap-2">
                  <button onClick={() => setShowLiveForm(true)} className="flex-1 text-xs font-semibold py-2 rounded-md border border-input bg-background hover:bg-accent inline-flex items-center justify-center gap-1.5">
                    <Icon name="users" size={13} /> Minta Live Chat
                  </button>
                  <a href={waLink(SITE.whatsapp)} target="_blank" rel="noopener" className="flex-1 text-xs font-semibold py-2 rounded-md border border-input bg-background hover:bg-accent inline-flex items-center justify-center gap-1.5">
                    <Icon name="message-circle" size={13} /> WhatsApp
                  </a>
                </div>
              )}

              {/* Input */}
              <div className="p-3 border-t border-border bg-card flex gap-2 items-end">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, 500))}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  rows={1}
                  maxLength={500}
                  placeholder={liveRequested ? "Ketik pesan…" : "Tanya apa aja…"}
                  className="flex-1 resize-none max-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
                <button onClick={send} disabled={busy || !input.trim()} aria-label="Kirim" className="h-10 w-10 shrink-0 rounded-md bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50">
                  <Icon name="arrow-up-right" size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const isGuest = msg.actor === "guest";
  const isSystem = msg.role === "system";
  if (isSystem) {
    return <div className="text-center text-[11px] text-muted-foreground bg-muted rounded-lg px-3 py-1.5 mx-auto max-w-[90%]">{msg.content}</div>;
  }
  return (
    <div className={`flex ${isGuest ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] px-3.5 py-2 text-sm leading-relaxed rounded-2xl ${
          isGuest
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : msg.actor === "admin"
            ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100 rounded-bl-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        }`}
      >
        {msg.actor === "admin" && <div className="text-[10px] font-bold uppercase opacity-70 mb-0.5">Ahzelan</div>}
        {msg.actor === "bot" && <div className="text-[10px] font-bold uppercase opacity-50 mb-0.5">AI</div>}
        <div className="whitespace-pre-wrap break-words">{msg.content}</div>
      </div>
    </div>
  );
}
