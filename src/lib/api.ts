/**
 * Generic CRUD endpoint factory for admin entities.
 * Every write verifies the caller is an admin (requireAdmin) and uses the
 * service-role client so RLS is bypassed only after auth passes.
 */
import type { APIContext } from "astro";
import { getAdminClient } from "./supabase";
import { requireAdmin } from "./auth";

const ALLOWED = new Set([
  "site_settings",
  "pages",
  "sections",
  "media",
  "navigation_items",
  "services",
  "packages",
  "testimonials",
  "faqs",
  "recommendations",
  "articles",
]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

/** Parse a fetch response as JSON with a typed fallback. */
export async function readJson<T = any>(res: Response, fallback: T = undefined as T): Promise<T> {
  try { return (await res.json()) as T; } catch { return fallback; }
}

async function logActivity(adminId: string, action: string, entity: string, entityId: string | null) {
  const c = getAdminClient();
  if (!c) return;
  await c.from("activity_logs").insert({ user_id: adminId, action, entity_type: entity, entity_id: entityId });
}

/** Returns { GET?, POST, PUT, DELETE } handlers for a table. */
export function crudHandlers(table: string, opts: { softColumns?: string[] } = {}) {
  if (!ALLOWED.has(table)) throw new Error(`Table not allowed: ${table}`);

  async function guard(ctx: APIContext) {
    const res = await requireAdmin(ctx.request, ctx.cookies);
    if (res instanceof Response) return { error: res };
    const client = getAdminClient();
    if (!client) return { error: json({ error: "Supabase not configured" }, 503) };
    return { user: res, client };
  }

  return {
    async POST(ctx: APIContext) {
      const g = await guard(ctx);
      if ("error" in g) return g.error;
      const body = await ctx.request.json().catch(() => null);
      if (!body || typeof body !== "object") return json({ error: "Invalid body" }, 400);
      delete (body as any).id;
      const { data, error } = await g.client.from(table).insert(body).select().single();
      if (error) return json({ error: error.message }, 400);
      await logActivity(g.user.id, "create", table, data.id);
      return json(data, 201);
    },

    async PUT(ctx: APIContext) {
      const g = await guard(ctx);
      if ("error" in g) return g.error;
      const body = await ctx.request.json().catch(() => null) as Record<string, any> | null;
      if (!body || typeof body !== "object" || !body.id) return json({ error: "Missing id" }, 400);
      const id = body.id;
      delete body.id;
      delete body.created_at;
      const { data, error } = await g.client.from(table).update(body).eq("id", id).select().single();
      if (error) return json({ error: error.message }, 400);
      await logActivity(g.user.id, "update", table, id);
      return json(data);
    },

    async DELETE(ctx: APIContext) {
      const g = await guard(ctx);
      if ("error" in g) return g.error;
      const bodyId = (await ctx.request.json().catch(() => ({}))) as { id?: string };
      const id = new URL(ctx.request.url).searchParams.get("id") ?? bodyId.id;
      if (!id) return json({ error: "Missing id" }, 400);
      const { error } = await g.client.from(table).delete().eq("id", id);
      if (error) return json({ error: error.message }, 400);
      await logActivity(g.user.id, "delete", table, id);
      return json({ ok: true });
    },
  };
}

export { json };
