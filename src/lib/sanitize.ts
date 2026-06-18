/**
 * Portable HTML sanitizer — runs on Cloudflare Workers, Node, and the browser
 * (no jsdom/DOM dependency). Allowlist-based: strips scripts, event handlers,
 * javascript: URIs, and any tag/attr not explicitly permitted.
 *
 * Used for article body HTML, which — though authored by an admin — is rendered
 * to the public and must never be able to inject script. Defense in depth on
 * top of the admin auth gate.
 */
const ALLOWED_TAGS = new Set([
  "p", "br", "hr", "h1", "h2", "h3", "h4", "h5", "h6",
  "strong", "b", "em", "i", "u", "s", "del", "mark", "small", "sub", "sup",
  "ul", "ol", "li", "blockquote", "pre", "code",
  "a", "img", "figure", "figcaption",
  "table", "thead", "tbody", "tr", "th", "td",
  "span", "div",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
  img: new Set(["src", "alt", "title", "width", "height", "loading"]),
  "*": new Set(["class"]),
};

const URI_ATTRS = new Set(["href", "src"]);
const SAFE_URI = /^(https?:|mailto:|tel:|\/|#|data:image\/)/i;

export function sanitizeHtml(input: string): string {
  if (!input) return "";

  // Remove script/style/iframe/object/embed blocks entirely (with content).
  let html = input
    .replace(/<\s*(script|style|iframe|object|embed|noscript|template)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*\/?>/gi, "");

  // Walk every tag; drop disallowed tags & attributes.
  html = html.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g, (match, slash, tag, attrs) => {
    const name = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(name)) return "";
    if (slash) return `</${name}>`;

    const allowed = ALLOWED_ATTRS[name] ?? new Set<string>();
    const global = ALLOWED_ATTRS["*"]!;
    const kept: string[] = [];

    const attrRe = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
    let m: RegExpExecArray | null;
    while ((m = attrRe.exec(attrs)) !== null) {
      const attr = m[1].toLowerCase();
      const value = m[3] ?? m[4] ?? m[5] ?? "";
      if (attr.startsWith("on")) continue; // event handlers
      if (attr === "style") continue; // no inline style (CSS injection)
      if (!allowed.has(attr) && !global.has(attr)) continue;
      if (URI_ATTRS.has(attr) && !SAFE_URI.test(value.trim())) continue;
      const safeVal = value.replace(/"/g, "&quot;");
      kept.push(`${attr}="${safeVal}"`);
    }

    // force rel=noopener on target=_blank links
    if (name === "a" && /target\s*=\s*["']?_blank/i.test(attrs)) {
      if (!kept.some((k) => k.startsWith("rel="))) kept.push('rel="noopener noreferrer"');
    }

    return `<${name}${kept.length ? " " + kept.join(" ") : ""}>`;
  });

  return html;
}
