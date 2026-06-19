/**
 * Data accessors. Returns Supabase data if env is configured, otherwise
 * the static fallback. Each function is safe to call from any Astro page.
 */
import { checkSupabase, getServerClient } from "./supabase";
import type {
  Service,
  Package,
  Testimonial,
  Faq,
  Recommendation,
  Article,
  SiteSetting,
  GalleryItem,
  BioLink,
  ProcessStep,
  Skill,
} from "./types";
import { sanitizeHtml } from "./sanitize";
import {
  FALLBACK_SERVICES,
  FALLBACK_PACKAGES,
  FALLBACK_TESTIMONIALS,
  FALLBACK_FAQS,
  FALLBACK_RECOMMENDATIONS,
  FALLBACK_ARTICLES,
  FALLBACK_SETTINGS,
  FALLBACK_GALLERY,
  FALLBACK_BIO,
  FALLBACK_PROCESS,
  FALLBACK_SKILLS,
} from "./fallback";

function clientOrNull(request: Request, cookies: Parameters<typeof getServerClient>[1]) {
  return checkSupabase() ? getServerClient(request, cookies) : null;
}

export async function getServices(request: Request, cookies: Parameters<typeof getServerClient>[1]): Promise<Service[]> {
  const c = clientOrNull(request, cookies);
  if (c) {
    const { data } = await c.from("services").select("*").eq("is_visible", true).order("sort_order");
    if (data?.length) return data as Service[];
  }
  return FALLBACK_SERVICES;
}

export async function getPackages(request: Request, cookies: Parameters<typeof getServerClient>[1]): Promise<Package[]> {
  const c = clientOrNull(request, cookies);
  if (c) {
    const { data } = await c.from("packages").select("*").eq("is_visible", true).order("sort_order");
    if (data?.length) return data as Package[];
  }
  return FALLBACK_PACKAGES;
}

export async function getTestimonials(request: Request, cookies: Parameters<typeof getServerClient>[1]): Promise<Testimonial[]> {
  const c = clientOrNull(request, cookies);
  if (c) {
    const { data } = await c.from("testimonials").select("*").eq("is_visible", true).order("sort_order");
    if (data?.length) return data as Testimonial[];
  }
  return FALLBACK_TESTIMONIALS;
}

export async function getFaqs(request: Request, cookies: Parameters<typeof getServerClient>[1]): Promise<Faq[]> {
  const c = clientOrNull(request, cookies);
  if (c) {
    const { data } = await c.from("faqs").select("*").eq("is_visible", true).order("sort_order");
    if (data?.length) return data as Faq[];
  }
  return FALLBACK_FAQS;
}

export async function getRecommendations(request: Request, cookies: Parameters<typeof getServerClient>[1]): Promise<Recommendation[]> {
  const c = clientOrNull(request, cookies);
  if (c) {
    const { data } = await c.from("recommendations").select("*").eq("is_visible", true).order("sort_order");
    if (data?.length) return data as Recommendation[];
  }
  return FALLBACK_RECOMMENDATIONS;
}

export async function getArticles(request: Request, cookies: Parameters<typeof getServerClient>[1], limit?: number): Promise<Article[]> {
  const c = clientOrNull(request, cookies);
  if (c) {
    let q = c.from("articles").select("*").eq("status", "published").order("published_at", { ascending: false });
    if (limit) q = q.limit(limit);
    const { data } = await q;
    if (data?.length) return (data as Article[]).map((a) => ({ ...a, content: sanitizeHtml(a.content) }));
  }
  const sorted = [...FALLBACK_ARTICLES].sort(
    (a, b) => new Date(b.published_at ?? b.created_at ?? 0).getTime() - new Date(a.published_at ?? a.created_at ?? 0).getTime(),
  );
  return limit ? sorted.slice(0, limit) : sorted;
}

export async function getArticleBySlug(
  request: Request,
  cookies: Parameters<typeof getServerClient>[1],
  slug: string,
): Promise<Article | null> {
  const c = clientOrNull(request, cookies);
  if (c) {
    const { data } = await c.from("articles").select("*").eq("slug", slug).eq("status", "published").single();
    if (data) return { ...(data as Article), content: sanitizeHtml(data.content) };
  }
  const f = FALLBACK_ARTICLES.find((a) => a.slug === slug) ?? null;
  return f ? { ...f, content: sanitizeHtml(f.content) } : null;
}

export async function getSettings(request: Request, cookies: Parameters<typeof getServerClient>[1]): Promise<Partial<SiteSetting>> {
  const c = clientOrNull(request, cookies);
  if (c) {
    const { data } = await c.from("site_settings").select("*").eq("id", 1).single();
    if (data) return data as SiteSetting;
  }
  return FALLBACK_SETTINGS;
}

export async function getGalleryItems(request: Request, cookies: Parameters<typeof getServerClient>[1]): Promise<GalleryItem[]> {
  const c = clientOrNull(request, cookies);
  if (c) {
    const { data } = await c.from("gallery_items").select("*").eq("is_visible", true).order("sort_order");
    if (data?.length) return data as GalleryItem[];
  }
  return FALLBACK_GALLERY as GalleryItem[];
}

export async function getBioLinks(request: Request, cookies: Parameters<typeof getServerClient>[1]): Promise<BioLink[]> {
  const c = clientOrNull(request, cookies);
  if (c) {
    const { data } = await c.from("bio_links").select("*").eq("is_visible", true).order("sort_order");
    if (data?.length) return data as BioLink[];
  }
  return FALLBACK_BIO as BioLink[];
}

export async function getProcessSteps(request: Request, cookies: Parameters<typeof getServerClient>[1]): Promise<ProcessStep[]> {
  const c = clientOrNull(request, cookies);
  if (c) {
    const { data } = await c.from("process_steps").select("*").eq("is_visible", true).order("sort_order");
    if (data?.length) return data as ProcessStep[];
  }
  return FALLBACK_PROCESS as ProcessStep[];
}

export async function getSkills(request: Request, cookies: Parameters<typeof getServerClient>[1]): Promise<Skill[]> {
  const c = clientOrNull(request, cookies);
  if (c) {
    const { data } = await c.from("skills").select("*").eq("is_visible", true).order("sort_order");
    if (data?.length) return data as Skill[];
  }
  return FALLBACK_SKILLS as Skill[];
}
