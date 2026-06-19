/**
 * Supabase clients.
 * - `supabase` (anon, browser-safe): used by React islands for public reads & admin auth.
 * - `supabaseAdmin` (service role, server-only): bypasses RLS for write operations
 *   after we've verified the user is an authenticated admin via `requireAdmin()`.
 * If env vars are missing, all helpers fall back to static JSON so the site
 * still renders during local dev without Supabase credentials.
 *
 * Cloudflare Workers: secrets (SUPABASE_SERVICE_ROLE_KEY, ZAI_API_KEY) are
 * injected into process.env per-request by @astrojs/cloudflare middleware.
 * PUBLIC_* vars are inlined at build time via import.meta.env.
 * All env reads MUST happen inside functions (request time), not at module scope.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient as createSsrBrowserClient, createServerClient as createSsrServerClient, parseCookieHeader, type CookieOptions, type CookieMethodsServer } from "@supabase/ssr";

function env() {
  const url = import.meta.env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL || "";
  const anon = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY || "";
  const service = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return { url, anon, service };
}

export function checkSupabase(): boolean {
  const { url, anon } = env();
  return Boolean(url && anon);
}

/** True only when the service-role client can be built (url + service key). */
export function checkSupabaseAdmin(): boolean {
  const { url, service } = env();
  return Boolean(url && service);
}


/** Server-side admin client (service role, RLS bypass). NEVER import from a client island. */
export function getAdminClient(): SupabaseClient | null {
  const { url, service } = env();
  if (!url || !service) return null;
  return createClient(url, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Astro server context: read/write auth cookies through the SSR helper. */
export function getServerClient(
  request: Request,
  cookies: { set: (name: string, value: string, options: CookieOptions) => void; get: (name: string) => { value: string } | undefined; delete: (name: string, options: CookieOptions) => void },
): SupabaseClient | null {
  const { url, anon } = env();
  if (!url || !anon) return null;
  // Cookie adapter in the current (non-deprecated) getAll/setAll shape.
  const cookieMethods: CookieMethodsServer = {
    getAll() {
      return parseCookieHeader(request.headers.get("Cookie") ?? "").map((c) => ({ name: c.name, value: c.value ?? "" }));
    },
    setAll(list: { name: string; value: string; options: CookieOptions }[]) {
      list.forEach(({ name, value, options }) => cookies.set(name, value, options));
    },
  };
  // `createServerClient` ships as two overloads; the first (get/set/remove) is
  // @deprecated, and TS mis-attributes that deprecation to this call even though
  // we pass getAll/setAll. Pin the current single-signature shape so the bogus
  // ts(6387) deprecation warning isn't raised. No runtime change.
  const makeServerClient = createSsrServerClient as unknown as (
    url: string,
    key: string,
    opts: { cookies: CookieMethodsServer },
  ) => SupabaseClient;
  return makeServerClient(url, anon, { cookies: cookieMethods });
}

/** Browser island: lightweight anon client. */
export function getBrowserClient(): SupabaseClient | null {
  const { url, anon } = env();
  if (!url || !anon || typeof window === "undefined") return null;
  return createSsrBrowserClient(url, anon);
}
