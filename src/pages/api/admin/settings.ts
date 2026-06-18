import type { APIRoute } from "astro";
import { getAdminClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
export const prerender = false;

export const POST: APIRoute = async (ctx) => {
  const res = await requireAdmin(ctx.request, ctx.cookies);
  if (res instanceof Response) return res;
  const client = getAdminClient();
  if (!client) return new Response(JSON.stringify({ error: "Supabase not configured" }), { status: 503 });
  const body = (await ctx.request.json().catch(() => null)) as Record<string, any> | null;
  if (!body) return new Response(JSON.stringify({ error: "Invalid body" }), { status: 400 });
  delete body.id;
  delete body.created_at;
  const { data, error } = await client.from("site_settings").update(body).eq("id", 1).select().single();
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  return new Response(JSON.stringify(data), { status: 200 });
};
