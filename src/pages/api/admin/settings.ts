import type { APIRoute } from "astro";
import { getAdminClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
export const prerender = false;

/**
 * Fields this endpoint may mutate. Explicit allowlist (not a denylist) so a
 * stray/unknown key in the body can't clobber sensitive columns.
 *
 * `whitelist_admins` is deliberately excluded: it IS the admin roster, and auth
 * is fail-closed on it (auth.ts). Allowing it here would let any single admin
 * grant admin to anyone, or empty it to lock out every admin (unrecoverable
 * without direct DB access). It is seeded/managed via SQL, not this endpoint.
 */
const ALLOWED = new Set([
  "site_name", "tagline", "logo_light_url", "logo_dark_url", "favicon_url",
  "primary_color", "secondary_color", "accent_color",
  "font_heading", "font_body",
  "whatsapp_number", "email", "socials",
  "footer_text", "default_seo_title", "default_seo_description", "og_image_url",
  "analytics_script", "radius",
]);

export const POST: APIRoute = async (ctx) => {
  const res = await requireAdmin(ctx.request, ctx.cookies);
  if (res instanceof Response) return res;
  const client = getAdminClient();
  if (!client) return new Response(JSON.stringify({ error: "Supabase not configured" }), { status: 503 });
  const body = (await ctx.request.json().catch(() => null)) as Record<string, any> | null;
  if (!body) return new Response(JSON.stringify({ error: "Invalid body" }), { status: 400 });
  const patch: Record<string, any> = {};
  for (const [k, v] of Object.entries(body)) if (ALLOWED.has(k)) patch[k] = v;

  const { data, error } = await client.from("site_settings").update(patch).eq("id", 1).select().single();
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  return new Response(JSON.stringify(data), { status: 200 });
};
