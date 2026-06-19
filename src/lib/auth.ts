/** Auth helper. Verifies the current session belongs to an admin before allowing writes. */
import { getServerClient } from "./supabase";
import type { AstroCookies } from "astro";

export type AdminUser = { id: string; email: string | null };

export async function getCurrentUser(
  request: Request,
  cookies: AstroCookies,
): Promise<AdminUser | null> {
  const client = getServerClient(request, {
    set: (n, v, o) => cookies.set(n, v, o),
    get: (n) => cookies.get(n),
    delete: (n, o) => cookies.delete(n, o),
  });
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  if (error || !data?.user) return null;
  // Roster check: only allow whitelisted admins (stored in site_settings.whitelist_admins jsonb)
  const email = data.user.email ?? null;
  const { data: settings } = await client
    .from("site_settings")
    .select("whitelist_admins")
    .eq("id", 1)
    .single();
  const allow = (settings?.whitelist_admins as string[] | null) ?? [];
  // Fail CLOSED: an empty/unreadable whitelist means no one is an admin.
  if (!email || allow.length === 0 || !allow.includes(email)) return null;
  return { id: data.user.id, email };
}

export async function requireAdmin(
  request: Request,
  cookies: AstroCookies,
): Promise<AdminUser | Response> {
  const user = await getCurrentUser(request, cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}
