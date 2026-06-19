/**
 * Generic CRUD endpoint factory for admin entities.
 * Every write verifies the caller is an admin (requireAdmin) and uses the
 * service-role client so RLS is bypassed only after auth passes.
 */
import type { APIContext } from "astro";
import { getAdminClient } from "./supabase";
import { requireAdmin, type AdminUser } from "./auth";

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
  "gallery_items",
  "bio_links",
  "process_steps",
  "skills",
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
export function crudHandlers(table: string) {
  if (!ALLOWED.has(table)) throw new Error(`Table not allowed: ${table}`);

  type Guarded = { user: AdminUser; client: NonNullable<ReturnType<typeof getAdminClient>> };
  async function guard(ctx: APIContext): Promise<Response | Guarded> {
    const res = await requireAdmin(ctx.request, ctx.cookies);
    if (res instanceof Response) return res;
    const client = getAdminClient();
    if (!client) return json({ error: "Supabase not configured" }, 503);
    return { user: res, client };
  }

  return {
    async GET(ctx: APIContext): Promise<Response> {
      const g = await guard(ctx);
      if (g instanceof Response) return g;
      const url = new URL(ctx.request.url);
      const limit = Math.min(Math.max(1, Number(url.searchParams.get("limit")) || 200), 500);
      const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
      const { data, error } = await g.client
        .from(table)
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) return json({ error: error.message }, 400);
      return json(data);
    },

    async POST(ctx: APIContext): Promise<Response> {
      const g = await guard(ctx);
      if (g instanceof Response) return g;
      const body = await ctx.request.json().catch(() => null);
      if (!body || typeof body !== "object") return json({ error: "Invalid body" }, 400);
      delete (body as any).id;
      delete (body as any).created_at;
      delete (body as any).updated_at;
      const { data, error } = await g.client.from(table).insert(body).select().single();
      if (error) return json({ error: error.message }, 400);
      await logActivity(g.user.id, "create", table, data.id);
      return json(data, 201);
    },

    async PUT(ctx: APIContext): Promise<Response> {
      const g = await guard(ctx);
      if (g instanceof Response) return g;
      const body = await ctx.request.json().catch(() => null) as Record<string, any> | null;
      if (!body || typeof body !== "object" || !body.id) return json({ error: "Missing id" }, 400);
      const id = body.id;
      delete body.id;
      delete body.created_at;
      delete body.updated_at;
      const { data, error } = await g.client.from(table).update(body).eq("id", id).select().single();
      if (error) return json({ error: error.message }, 400);
      await logActivity(g.user.id, "update", table, id);
      return json(data);
    },

    async DELETE(ctx: APIContext): Promise<Response> {
      const g = await guard(ctx);
      if (g instanceof Response) return g;
      const body = (await ctx.request.json().catch(() => ({}))) as { id?: string; ids?: string[] };
      const ids = body.ids ?? (body.id ? [body.id] : []);
      const paramId = new URL(ctx.request.url).searchParams.get("id");
      if (paramId) ids.push(paramId);
      const uniq = [...new Set(ids)];
      if (!uniq.length) return json({ error: "Missing id" }, 400);
      const { error } = await g.client.from(table).delete().in("id", uniq);
      if (error) return json({ error: error.message }, 400);
      await Promise.all(uniq.map((id) => logActivity(g.user.id, "delete", table, id)));
      return json({ ok: true });
    },
  };
}

export { json };
