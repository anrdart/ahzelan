/**
 * Supabase clients.
 * - `supabase` (anon, browser-safe): used by React islands for public reads & admin auth.
 * - `supabaseAdmin` (service role, server-only): bypasses RLS for write operations
 *   after we've verified the user is an authenticated admin via `requireAdmin()`.
 * If env vars are missing, all helpers fall back to static JSON so the site
 * still renders during local dev without Supabase credentials.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient as createSsrBrowserClient, createServerClient as createSsrServerClient, parseCookieHeader, type CookieOptions } from "@supabase/ssr";

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON);

/** Server-side admin client (service role, RLS bypass). NEVER import from a client island. */
export function getAdminClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_SERVICE) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Astro server context: read/write auth cookies through the SSR helper. */
export function getServerClient(
  request: Request,
  cookies: { set: (name: string, value: string, options: CookieOptions) => void; get: (name: string) => { value: string } | undefined; delete: (name: string, options: CookieOptions) => void },
): SupabaseClient | null {
  if (!hasSupabase) return null;
  return createSsrServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get("Cookie") ?? "").map((c) => ({ name: c.name, value: c.value ?? "" }));
      },
      setAll(list: { name: string; value: string; options: CookieOptions }[]) {
        list.forEach(({ name, value, options }) => cookies.set(name, value, options));
      },
    },
  });
}

/** Browser island: lightweight anon client. */
export function getBrowserClient(): SupabaseClient | null {
  if (!hasSupabase || typeof window === "undefined") return null;
  return createSsrBrowserClient(SUPABASE_URL, SUPABASE_ANON);
}
