import type { APIRoute } from "astro";
import { getOrCreateSession, getMessages, replyToGuest, type ChatMessage } from "@/lib/chat";
import { guardGuestMessage } from "@/lib/chat-guard";
import type { ChatTurn } from "@/lib/ai";
export const prerender = false;

/**
 * POST /api/chat/message { guest_token, content }
 * 1. Ensure session
 * 2. Guard: length, jailbreak/redline/secret detection, rate limit
 *    - if blocked: store the guest msg + a canned bot reply, return WITHOUT calling the LLM
 * 3. Insert the guest message
 * 4. If bot mode → generate reply (AI/FAQ/fallback), persist it, return it
 * 5. If human mode → return reply: null (admin will answer via realtime)
 */
export const POST: APIRoute = async ({ request, clientAddress }) => {
  const { guest_token, content } = (await request.json().catch(() => ({}))) as {
    guest_token?: string;
    content?: string;
  };
  if (!guest_token || !content?.trim()) {
    return json({ error: "guest_token & content wajib diisi" }, 400);
  }

  try {
  const session = await getOrCreateSession(guest_token);
  if (!session) return json({ error: "Supabase belum dikonfigurasi" }, 503);

  const admin = (await import("@/lib/supabase")).getAdminClient();
  if (!admin) return json({ error: "Supabase belum dikonfigurasi" }, 503);

  // --- Guardrails (run before any model call to save tokens) ---
  const limitKey = `${guest_token}:${clientAddress ?? "n/a"}`;
  const verdict = guardGuestMessage(limitKey, content);
  if (!verdict.allowed) {
    // Still store the (rejected) guest message + canned reply for context,
    // but DON'T call the LLM. actor stays 'bot' so it reads like the bot's refusal.
    await admin.from("chat_messages").insert([
      { session_id: session.id, role: "user", actor: "guest", content: content.trim().slice(0, 500) },
      { session_id: session.id, role: "assistant", actor: "bot", content: verdict.message },
    ]);
    return json({
      reply: verdict.message,
      reason: verdict.reason,
      blocked: true,
      bot_mode: session.bot_mode,
      messages: await getMessages(guest_token),
    });
  }

  const clean = content.trim().slice(0, 500);
  const { error: insErr } = await admin
    .from("chat_messages")
    .insert({ session_id: session.id, role: "user", actor: "guest", content: clean });
  if (insErr) return json({ error: insErr.message }, 400);

  const history = await getMessages(guest_token);
  const { reply, reason } = await replyToGuest(session.id, session.bot_mode, history, clean);

  return json({
    reply,
    reason,
    bot_mode: session.bot_mode,
    messages: await getMessages(guest_token),
  });
  } catch (e: any) {
    return json({ error: e?.message || "Gagal memproses pesan" }, 500);
  }
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

export type { ChatMessage, ChatTurn };
