import type { APIRoute } from "astro";
import { getServerClient } from "@/lib/supabase";
import { getAdminClient } from "@/lib/supabase";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const body = (await request.json().catch(() => ({}))) as { email?: string; password?: string };
  const { email, password } = body;
  if (!email || !password) {
    return new Response(JSON.stringify({ error: "Email & password wajib diisi" }), { status: 400 });
  }

  const client = getServerClient(request, {
    set: (n, v, o) => cookies.set(n, v, o),
    get: (n) => cookies.get(n),
    delete: (n, o) => cookies.delete(n, o),
  });
  if (!client) {
    return new Response(JSON.stringify({ error: "Supabase belum dikonfigurasi (set env vars)" }), { status: 503 });
  }

  // Optional whitelist check before sign-in
  const adminClient = getAdminClient();
  if (adminClient) {
    const { data: settings } = await adminClient.from("site_settings").select("whitelist_admins").eq("id", 1).single();
    const allow = (settings?.whitelist_admins as string[] | null) ?? [];
    if (allow.length > 0 && !allow.includes(email)) {
      return new Response(JSON.stringify({ error: "Email ini tidak terdaftar sebagai admin" }), { status: 403 });
    }
  }

  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    return new Response(JSON.stringify({ error: "Email atau password salah" }), { status: 401 });
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
