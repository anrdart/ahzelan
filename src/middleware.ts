import { defineMiddleware } from "astro:middleware";
import { getCurrentUser } from "@/lib/auth";

/**
 * - Populates Astro.locals.user for every request.
 * - Guards /admin/** (except /admin/login): redirect to login if no admin session.
 * - Guards /api/admin/**: 401 if no admin session.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { url, request, cookies } = context;
  const path = url.pathname;

  let user = null;
  try {
    user = await getCurrentUser(request, cookies);
  } catch {
    user = null;
  }
  context.locals.user = user;

  const isAdminPage = path.startsWith("/admin") && path !== "/admin/login";
  const isAdminApi = path.startsWith("/api/admin") && path !== "/api/admin/login";

  if ((isAdminPage || isAdminApi) && !user) {
    if (isAdminApi) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return context.redirect(`/admin/login?next=${encodeURIComponent(path)}`);
  }

  // already logged in → skip login page
  if (path === "/admin/login" && user) {
    return context.redirect("/admin/dashboard");
  }

  const res = await next();

  // Security headers (applied to every HTML/document response).
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("text/html")) {
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("X-Frame-Options", "SAMEORIGIN");
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    res.headers.set(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'self'",
        // Astro/React islands + inline theme-init need inline+eval; tighten later with nonces.
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data:",
        "connect-src 'self' https:",
        "form-action 'self'",
      ].join("; "),
    );
  }

  return res;
});
