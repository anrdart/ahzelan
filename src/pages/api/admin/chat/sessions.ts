import type { APIRoute } from "astro";
import { requireAdmin } from "@/lib/auth";
import { listSessions, totalUnread } from "@/lib/chat";
export const prerender = false;

/** GET /api/admin/chat/sessions → { sessions, unread } (admin only) */
export const GET: APIRoute = async (ctx) => {
  const res = await requireAdmin(ctx.request, ctx.cookies);
  if (res instanceof Response) return res;
  const [sessions, unread] = await Promise.all([listSessions(), totalUnread()]);
  return new Response(JSON.stringify({ sessions, unread }), {
    headers: { "Content-Type": "application/json" },
  });
};
