/**
 * Site-wide constants — sourced from ahzelan.com live scrape.
 * Editable from /admin/settings once Supabase is wired; fallback here so the
 * site renders even with no env vars.
 */
export { waLink } from "./utils";
export const SITE = {
  name: "Ahzelan",
  tagline: "Bantu kamu tumbuh di era digital",
  description:
    "Sudah bantu banyak individu & perusahaan supaya bisa 10X jauh lebih maju di era industri 4.0 dengan digital marketing.",
  url: import.meta.env.PUBLIC_SITE_URL || "https://ahzelan.com",
  whatsapp: import.meta.env.PUBLIC_WHATSAPP_NUMBER || "6285156563313",
  whatsappDisplay: "+62 851-5656-3313",
  email: import.meta.env.PUBLIC_CONTACT_EMAIL || "salam@ahzelan.com",
  author: "Ahzelan",
  founded: 2026,
} as const;

export const SOCIALS = {
  instagram: { handle: "@ahzelanx", href: "https://instagram.com/ahzelanx" },
  youtube: { handle: "@ahzelanx", href: "https://youtube.com/@ahzelanx" },
  facebook: { handle: "ahzelanx", href: "https://facebook.com/ahzelanx" },
  twitter: { handle: "@ahzelanx", href: "https://x.com/ahzelanx" },
  telegram: { handle: "@jadinaonn", href: "https://t.me/jadinaonn" },
} as const;

export const BRAND_UNITS = [
  {
    name: "Naon.id",
    href: "https://naon.id",
    desc: "Tempat kamu cari produk premium untuk kebutuhan digital marketing",
  },
  {
    name: "Sandaran Digital",
    href: "https://sandarandigital.com",
    desc: "Jasa pembuatan website terbaik dengan layanan after sales yang tiada duanya",
  },
  {
    name: "Berilmu.id",
    href: "https://berilmu.id",
    desc: "Tempat terbaik buat belajar ilmu baru seputar digital marketing dan sejenisnya",
  },
] as const;

export const NAV_DEFAULT = [
  { label: "Beranda", href: "/" },
  { label: "Tentang", href: "/tentang" },
  { label: "Layanan", href: "/layanan", children: [
    { label: "Jasa Landing Page", href: "/jasa-pembuatan-landing-page" },
    { label: "Digital Marketing", href: "/layanan#digital-marketing" },
    { label: "Website", href: "/layanan#website" },
    { label: "Copywriting", href: "/layanan#copywriting" },
    { label: "Advertising", href: "/layanan#advertising" },
  ]},
  { label: "Rekomendasi", href: "/rekomendasi" },
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "/faq" },
] as const;
