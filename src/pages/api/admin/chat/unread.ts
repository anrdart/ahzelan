import type { APIRoute } from "astro";
import { requireAdmin } from "@/lib/auth";
import { totalUnread } from "@/lib/chat";
export const prerender = false;

/** GET /api/admin/chat/unread → { unread } (admin only, polled by sidebar badge) */
export const GET: APIRoute = async (ctx) => {
  const res = await requireAdmin(ctx.request, ctx.cookies);
  if (res instanceof Response) return res;
  return new Response(JSON.stringify({ unread: await totalUnread() }), {
    headers: { "Content-Type": "application/json" },
  });
};
