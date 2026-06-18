import type { APIRoute } from "astro";
import { getServerClient } from "@/lib/supabase";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const client = getServerClient(request, {
    set: (n, v, o) => cookies.set(n, v, o),
    get: (n) => cookies.get(n),
    delete: (n, o) => cookies.delete(n, o),
  });
  if (client) await client.auth.signOut();
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
