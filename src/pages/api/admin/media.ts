import type { APIRoute } from "astro";
import { crudHandlers } from "@/lib/api";
import { getAdminClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
export const prerender = false;

const base = crudHandlers("media");
export const POST = base.POST;
export const PUT = base.PUT;
export const DELETE = base.DELETE;

// Multipart upload endpoint
export const PUT_UPLOAD: APIRoute = async (ctx) => {
  const res = await requireAdmin(ctx.request, ctx.cookies);
  if (res instanceof Response) return res;
  const client = getAdminClient();
  if (!client) return new Response(JSON.stringify({ error: "Supabase not configured" }), { status: 503 });

  const form = await ctx.request.formData();
  const file = form.get("file") as File | null;
  if (!file) return new Response(JSON.stringify({ error: "No file" }), { status: 400 });
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `uploads/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const buf = new Uint8Array(await file.arrayBuffer());
  const { error: upErr } = await client.storage.from("media").upload(path, buf, { contentType: file.type, upsert: true });
  if (upErr) return new Response(JSON.stringify({ error: upErr.message }), { status: 400 });
  const { data: pub } = client.storage.from("media").getPublicUrl(path);
  return new Response(JSON.stringify({ url: pub.publicUrl, file_name: file.name, size: file.size, mime_type: file.type }), { status: 201 });
};
