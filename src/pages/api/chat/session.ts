import type { APIRoute } from "astro";
import { getOrCreateSession, getMessages, markGuestRead } from "@/lib/chat";
export const prerender = false;

/**
 * POST /api/chat/session { guest_token }
 * Ensures a session exists, returns it + recent messages, clears guest_unread.
 */
export const POST: APIRoute = async ({ request }) => {
  const { guest_token } = (await request.json().catch(() => ({}))) as { guest_token?: string };
  if (!guest_token || typeof guest_token !== "string") {
    return json({ error: "guest_token wajib diisi" }, 400);
  }
  const session = await getOrCreateSession(guest_token);
  if (!session) return json({ error: "Supabase belum dikonfigurasi" }, 503);
  await markGuestRead(guest_token);
  const messages = await getMessages(guest_token);
  return json({ session, messages });
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}
