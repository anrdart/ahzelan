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
  const isAdminApi = path.startsWith("/api/admin");

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

  return next();
});
