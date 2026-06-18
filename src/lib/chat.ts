/**
 * Server-side chat helpers. Uses service-role admin client (RLS bypass) for
 * writes; reads use the same client. Browser widget talks to /api/chat/* only.
 */
import { getAdminClient, hasSupabase } from "./supabase";
import { aiReply, type ChatTurn } from "./ai";
import { FALLBACK_FAQS } from "./fallback";

export type ChatSession = {
  id: string;
  guest_token: string;
  guest_name: string | null;
  status: "bot" | "live_requested" | "live" | "closed";
  bot_mode: boolean;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system" | "admin";
  actor: "guest" | "bot" | "admin";
  content: string;
  created_at: string;
};

function client() {
  const c = getAdminClient();
  if (!c) throw new Error("Supabase not configured");
  return c;
}

/** Get or create an anonymous session for a guest token. */
export async function getOrCreateSession(token: string): Promise<ChatSession | null> {
  if (!hasSupabase) return null;
  const c = client();
  const { data: existing } = await c
    .from("chat_sessions")
    .select("*")
    .eq("guest_token", token)
    .maybeSingle();
  if (existing) return existing as ChatSession;

  const { data, error } = await c
    .from("chat_sessions")
    .insert({ guest_token: token, status: "bot", bot_mode: true })
    .select()
    .single();
  if (error) return null;
  return data as ChatSession;
}

export async function getSession(token: string): Promise<ChatSession | null> {
  if (!hasSupabase) return null;
  const c = client();
  const { data } = await c.from("chat_sessions").select("*").eq("guest_token", token).maybeSingle();
  return (data as ChatSession) ?? null;
}

export async function getMessages(token: string): Promise<ChatMessage[]> {
  if (!hasSupabase) return [];
  const c = client();
  const { data: sess } = await c.from("chat_sessions").select("id").eq("guest_token", token).maybeSingle();
  if (!sess) return [];
  const { data } = await c
    .from("chat_messages")
    .select("*")
    .eq("session_id", sess.id)
    .order("created_at", { ascending: true });
  return (data as ChatMessage[]) ?? [];
}

/** Persist a message and return it. */
async function addMessage(
  sessionId: string,
  role: ChatMessage["role"],
  actor: ChatMessage["actor"],
  content: string,
): Promise<ChatMessage | null> {
  const c = client();
  const { data, error } = await c
    .from("chat_messages")
    .insert({ session_id: sessionId, role, actor, content })
    .select()
    .single();
  if (error) return null;
  return data as ChatMessage;
}

/**
 * Generate a reply for a guest message.
 *  - If session is in human-takeover mode (bot_mode=false) or status=live/live_requested:
 *    no auto reply (wait for admin). Returns { reply: null, reason: "human" }.
 *  - Else try AI (Z.ai). If AI unavailable/fails, FAQ match.
 *  - Else generic fallback that nudges toward live chat / WhatsApp.
 */
export async function replyToGuest(
  sessionId: string,
  botMode: boolean,
  history: ChatMessage[],
  userText: string,
): Promise<{ reply: string | null; reason: "ai" | "faq" | "fallback" | "human" | "error" }> {
  // Human has taken over — bot stays quiet.
  if (!botMode) return { reply: null, reason: "human" };

  // Build LLM history (last ~10 turns, drop system rows).
  const turns: ChatTurn[] = history
    .filter((m) => m.role !== "system")
    .slice(-10)
    .map((m) => ({ role: m.role === "admin" ? "assistant" : (m.role as "user" | "assistant"), content: m.content }))
    .concat([{ role: "user", content: userText }]);

  try {
    const ai = await aiReply(turns);
    if (ai) {
      await addMessage(sessionId, "assistant", "bot", ai);
      return { reply: ai, reason: "ai" };
    }
  } catch {
    // fall through to FAQ/fallback
  }

  // FAQ fallback: simple keyword match against the faqs table/fallback.
  const faq = matchFaq(userText);
  if (faq) {
    const text = faq.answer;
    await addMessage(sessionId, "assistant", "bot", text);
    return { reply: text, reason: "faq" };
  }

  const text =
    "Hmm, aku belum yakin jawaban paling pas untuk itu 🤔 Coba klik tombol 'Minta Live Chat' di bawah biar aku hubungin kamu langsung, atau WA aku di wa.me/6285156563313 ya.";
  await addMessage(sessionId, "assistant", "bot", text);
  return { reply: text, reason: "fallback" };
}

function matchFaq(text: string): { answer: string } | null {
  const t = text.toLowerCase();
  for (const f of FALLBACK_FAQS) {
    const keywords = f.question
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4);
    if (keywords.some((k) => t.includes(k.replace(/[?]/g, "")))) {
      return { answer: f.answer };
    }
  }
  return null;
}

/** Guest requests escalation to a human. */
export async function requestLiveChat(
  sessionId: string,
  guestName: string | null,
  guestEmail: string | null,
): Promise<void> {
  const c = client();
  await c
    .from("chat_sessions")
    .update({ status: "live_requested", bot_mode: false, guest_name: guestName, guest_email: guestEmail })
    .eq("id", sessionId);
  await addMessage(
    sessionId,
    "system",
    "bot",
    "Permintaan live chat kamu udah aku terima 🙌 Ahzelan akan lanjut obrolan ini secepatnya. Sambil nunggu, kamu bisa tetap ngetik ya.",
  );
}

/** Admin sends a reply. Flips session to live + clears admin_unread. */
export async function adminReply(sessionId: string, content: string, adminId: string): Promise<ChatMessage | null> {
  const c = client();
  const msg = await addMessage(sessionId, "admin", "admin", content);
  await c
    .from("chat_sessions")
    .update({ status: "live", bot_mode: false, admin_unread: 0, last_message_at: new Date().toISOString() })
    .eq("id", sessionId);
  await c.from("activity_logs").insert({ user_id: adminId, action: "chat_reply", entity_type: "chat_sessions", entity_id: sessionId });
  return msg;
}

/** Reset admin_unread for a session the admin just opened. */
export async function markAdminRead(sessionId: string): Promise<void> {
  const c = client();
  await c.from("chat_sessions").update({ admin_unread: 0 }).eq("id", sessionId);
}

/** Reset guest_unread (called when widget opens). */
export async function markGuestRead(token: string): Promise<void> {
  const c = client();
  await c.from("chat_sessions").update({ guest_unread: 0 }).eq("guest_token", token);
}

/** List all sessions for the admin panel, newest-activity first. */
export async function listSessions(): Promise<(ChatSession & { last_message?: string })[]> {
  if (!hasSupabase) return [];
  const c = client();
  const { data } = await c
    .from("chat_sessions")
    .select("*")
    .order("last_message_at", { ascending: false })
    .limit(200);
  return (data as ChatSession[]) ?? [];
}

/** Total unread across sessions (for sidebar badge). */
export async function totalUnread(): Promise<number> {
  if (!hasSupabase) return 0;
  const c = client();
  const { count } = await c
    .from("chat_sessions")
    .select("id", { count: "exact", head: true })
    .gt("admin_unread", 0);
  return count ?? 0;
}
