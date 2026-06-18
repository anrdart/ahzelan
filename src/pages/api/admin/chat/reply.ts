import type { APIRoute } from "astro";
import { requireAdmin } from "@/lib/auth";
import { adminReply } from "@/lib/chat";
export const prerender = false;

/** POST /api/admin/chat/reply { session_id, content } (admin only) */
export const POST: APIRoute = async (ctx) => {
  const res = await requireAdmin(ctx.request, ctx.cookies);
  if (res instanceof Response) return res;
  const { session_id, content } = (await ctx.request.json().catch(() => ({}))) as {
    session_id?: string;
    content?: string;
  };
  if (!session_id || !content?.trim()) {
    return json({ error: "session_id & content wajib diisi" }, 400);
  }
  const msg = await adminReply(session_id, content.trim(), res.id);
  if (!msg) return json({ error: "Gagal menyimpan balasan" }, 500);
  return json(msg, 201);
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}
