import type { APIRoute } from "astro";
import { getAdminClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
export const prerender = false;

export const GET: APIRoute = async ({ request, cookies }) => {
  const res = await requireAdmin(request, cookies);
  if (res instanceof Response) return res;
  const client = getAdminClient();
  if (!client) return json({ error: "Supabase not configured" }, 503);

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 200);
  const offset = Number(url.searchParams.get("offset")) || 0;
  const entityType = url.searchParams.get("type");

  let q = client.from("activity_logs").select("*").order("created_at", { ascending: false }).range(offset, offset + limit - 1);
  if (entityType) q = q.eq("entity_type", entityType);

  const { data, error } = await q;
  if (error) return json({ error: error.message }, 400);
  return json(data);
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}
