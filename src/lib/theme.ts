/**
 * Site theme → CSS custom properties.
 *
 * `site_settings.primary_color` / `radius` / `font_heading` are stored in the DB
 * and applied site-wide by `ThemeVars.astro` (included in both layouts' <head>).
 *
 * Security: every DB-sourced value is validated before it touches CSS, so a
 * rogue/malformed `site_settings` row can't inject CSS (e.g. `; } html{...}`).
 * Invalid values fall back to the defaults from globals.css.
 */

/** Heading font options offered by ThemeManager → real CSS font-family stacks.
 *  Only fonts actually loaded (globals.css @fontsource) are listed, so every
 *  option renders. Add a @font-face/@import before adding an entry here. */
export const FONT_STACKS: Record<string, string> = {
  "Plus Jakarta Sans": '"Plus Jakarta Sans Variable", ui-sans-serif, system-ui, sans-serif',
  Inter: '"Inter Variable", ui-sans-serif, system-ui, sans-serif',
};

const DEFAULT_PRIMARY = "#2E4191";
const DEFAULT_RADIUS = "0.75rem";
const DEFAULT_FONT_STACK =
  '"Plus Jakarta Sans Variable", ui-sans-serif, system-ui, sans-serif';

/** #rgb | #rrggbb | #rrggbbaa — the only shapes we accept for a brand color. */
const HEX_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
/** CSS length: `12px`, `0.75rem`, `1.2em`, `50%` — no `;`, quotes, or nesting. */
const LENGTH_RE = /^\d+(?:\.\d+)?(?:px|rem|em|%)$/;

function sanitizeHex(raw: string | null | undefined): string {
  const v = (raw ?? "").trim();
  return HEX_RE.test(v) ? v : DEFAULT_PRIMARY;
}

function sanitizeRadius(raw: string | null | undefined): string {
  const v = (raw ?? "").trim();
  return LENGTH_RE.test(v) ? v : DEFAULT_RADIUS;
}

function sanitizeFontStack(raw: string | null | undefined): string {
  // Known option → its full stack. Otherwise fall back to default (we never
  // interpolate a free-form string into CSS).
  const key = (raw ?? "").trim();
  return FONT_STACKS[key] ?? DEFAULT_FONT_STACK;
}

export interface ThemeInput {
  primary_color?: string | null;
  radius?: string | null;
  font_heading?: string | null;
}

/**
 * Builds the inline <style> body that overrides the brand CSS vars.
 *
 * Uses `html:root` and `html.dark` (both specificity 0,1,1) rather than the
 * bare `:root` / `.dark` globals.css uses (both 0,1,0), so these rules beat the
 * stylesheet defaults regardless of source order. `html:root` and `html.dark`
 * are equal specificity, and `html.dark` is emitted second, so when `.dark` is
 * on <html> the dark block wins — dark mode keeps a softened primary instead of
 * the raw light-mode color.
 */
export function themeCss(input: ThemeInput): string {
  const p = sanitizeHex(input.primary_color);
  const r = sanitizeRadius(input.radius);
  const f = sanitizeFontStack(input.font_heading);

  // color-mix is progressive enhancement; base --brand-primary is always a
  // plain hex so old browsers still get the chosen color.
  const dark = `color-mix(in srgb, ${p} 72%, #fff)`;

  return `
html:root{
  --brand-primary:${p};
  --brand-primary-hover:color-mix(in srgb, ${p} 86%, #000);
  --brand-primary-soft:color-mix(in srgb, ${p} 12%, #fff);
  --primary:${p};
  --ring:${p};
  --accent:color-mix(in srgb, ${p} 12%, #fff);
  --accent-foreground:${p};
  --sidebar-primary:${p};
  --sidebar-accent:color-mix(in srgb, ${p} 12%, #fff);
  --sidebar-accent-foreground:${p};
  --font-display:${f};
  --radius:${r};
}
html.dark{
  --brand-primary:${p};
  --brand-primary-hover:${p};
  --brand-primary-soft:color-mix(in srgb, ${p} 18%, transparent);
  --primary:${dark};
  --ring:${dark};
  --accent:color-mix(in srgb, ${p} 18%, #1a1a1a);
  --accent-foreground:${dark};
}
`.trim();
}
