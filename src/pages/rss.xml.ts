import type { APIRoute } from "astro";
import { getArticles } from "@/lib/db";
import { SITE } from "@/lib/site";

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies }) => {
  const articles = await getArticles(request, cookies);
  const items = articles
    .map(
      (a) => `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${SITE.url}/blog/${a.slug}</link>
      <guid>${SITE.url}/blog/${a.slug}</guid>
      <description>${escapeXml(a.excerpt ?? "")}</description>
      <pubDate>${a.published_at ? new Date(a.published_at).toUTCString() : ""}</pubDate>
      <category>${escapeXml(a.category)}</category>
    </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Ahzelan Blog</title>
    <link>${SITE.url}/blog</link>
    <description>Tips digital marketing, SEO, dan tools — ditulis santai.</description>
    <language>id</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
}
