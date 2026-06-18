// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";

const SITE = process.env.PUBLIC_SITE_URL || "https://ahzelan.com";

// True for `astro build` (and preview), false for `astro dev`.
// import.meta.env is undefined when this config module is loaded, so detect via argv.
const isBuild = process.argv.includes("build") || process.argv.includes("preview");

// https://astro.build/config
export default defineConfig({
  site: SITE,
  output: "server",
  adapter: cloudflare({
    imageService: "compile",
    platformProxy: { enabled: true },
    // Cloudflare Pages mode (no wrangler worker entry needed; deploy via Pages).
    // For pure Workers deploy, set mode: 'directory' and configure wrangler.toml.
  }),
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      // React 19 on Cloudflare Workers: react-dom/server.browser pulls in
      // MessageChannel (not in workerd). Swap to the edge entry for the build.
      // Dev stays on the default (Node) entry so HMR is unaffected.
      alias: isBuild ? { "react-dom/server": "react-dom/server.edge" } : {},
    },
  },
  prefetch: { prefetchAll: true, defaultStrategy: "viewport" },
  session: {
    // We use Supabase for auth, not Astro sessions. Configure a no-op-ish
    // driver so the Cloudflare adapter doesn't require a SESSION KV binding.
    driver: "memory",
  },
});
