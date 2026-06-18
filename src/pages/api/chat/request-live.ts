import type { APIRoute } from "astro";
import { getOrCreateSession, requestLiveChat } from "@/lib/chat";
export const prerender = false;

/** POST /api/chat/request-live { guest_token, name?, email? } */
export const POST: APIRoute = async ({ request }) => {
  const { guest_token, name, email } = (await request.json().catch(() => ({}))) as {
    guest_token?: string;
    name?: string;
    email?: string;
  };
  if (!guest_token) return json({ error: "guest_token wajib diisi" }, 400);

  const session = await getOrCreateSession(guest_token);
  if (!session) return json({ error: "Supabase belum dikonfigurasi" }, 503);

  await requestLiveChat(session.id, name?.trim() || null, email?.trim() || null);
  return json({ ok: true, status: "live_requested" });
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}
