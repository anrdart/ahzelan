import type { APIRoute } from "astro";
import { requireAdmin } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase";
import { markAdminRead } from "@/lib/chat";
export const prerender = false;

/** GET /api/admin/chat/[id] → { session, messages } (admin only) */
export const GET: APIRoute = async (ctx) => {
  const res = await requireAdmin(ctx.request, ctx.cookies);
  if (res instanceof Response) return res;
  const id = ctx.params.id;
  if (!id) return json({ error: "missing id" }, 400);
  const c = getAdminClient();
  if (!c) return json({ error: "Supabase not configured" }, 503);

  const { data: session } = await c.from("chat_sessions").select("*").eq("id", id).maybeSingle();
  if (!session) return json({ error: "not found" }, 404);
  const { data: messages } = await c
    .from("chat_messages")
    .select("*")
    .eq("session_id", id)
    .order("created_at", { ascending: true });
  await markAdminRead(id);
  return json({ session, messages: messages ?? [] });
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}
