/**
 * Static fallback content — real ahzelan.com material (scraped) blended with
 * brand-voice placeholder copy from the design kit for details not exposed
 * publicly (package pricing, FAQ answers, privacy text).
 * Used verbatim when Supabase env vars are absent; otherwise the DB wins.
 * Everything here is editable from /admin once Supabase is wired.
 */
import type {
  Service,
  Package,
  Testimonial,
  Faq,
  Recommendation,
  Article,
  SiteSetting,
} from "./types";

const now = "2026-06-17T00:00:00Z";
const base = { created_at: now, updated_at: now, is_visible: true } as const;

export const FALLBACK_SETTINGS: Partial<SiteSetting> = {
  site_name: "Ahzelan",
  tagline: "Siap Bantu Kamu Tumbuh Di Era Digital",
  whatsapp_number: "6285156563313",
  email: "salam@ahzelan.com",
  primary_color: "#2E4191",
  secondary_color: "#06b6d4",
  accent_color: "#f59e0b",
  radius: "12px",
  footer_text: "Ahzelan merupakan salah satu makhluk hidup yang tumbuh dan berkembang di era digital.",
  default_seo_title: "Ahzelan — Bantu Kamu Tumbuh di Era Digital",
  default_seo_description:
    "Sudah bantu banyak individu & perusahaan supaya bisa 10X jauh lebih maju di era industri 4.0 dengan digital marketing.",
  socials: {
    instagram: "https://instagram.com/ahzelanx",
    youtube: "https://youtube.com/@ahzelanx",
    facebook: "https://facebook.com/ahzelanx",
    twitter: "https://x.com/ahzelanx",
    telegram: "https://t.me/jadinaonn",
  },
};

export const FALLBACK_SERVICES: Service[] = [
  {
    id: "svc-landing",
    title: "Jasa Landing Page",
    slug: "jasa-landing-page",
    description: "Landing page yang fokus ngonversi, bukan cuma cakep dilihat.",
    icon: "layout-template",
    image_id: null,
    cta_label: "Lihat Paket",
    cta_url: "/jasa-pembuatan-landing-page",
    sort_order: 0,
    ...base,
  },
  {
    id: "svc-website",
    title: "Website & SEO",
    slug: "website",
    description:
      "Mengerjakan pembuatan website & landing page buat kebutuhan bisnis sampai optimasi supaya loading bisa ngebut++",
    icon: "globe",
    image_id: null,
    cta_label: "Konsultasi",
    cta_url: null,
    sort_order: 1,
    ...base,
  },
  {
    id: "svc-ads",
    title: "Advertising & Sosial Media",
    slug: "advertising",
    description:
      "Saya aktif ngiklan di berbagai platform untuk bantu bisnis biar lebih gacor lewat Google Ads, Meta Ads, Tiktok Ads & platform tempat ngiklan lainnya",
    icon: "megaphone",
    image_id: null,
    cta_label: "Konsultasi",
    cta_url: null,
    sort_order: 2,
    ...base,
  },
  {
    id: "svc-copy",
    title: "Copywriting",
    slug: "copywriting",
    description:
      "Buat kata-kata yang gak bisa ditolak client & customer supaya bisnis bisa dapetin jauh lebih banyak closingan",
    icon: "type",
    image_id: null,
    cta_label: "Konsultasi",
    cta_url: null,
    sort_order: 3,
    ...base,
  },
  {
    id: "svc-marketing",
    title: "Digital Marketing",
    slug: "digital-marketing",
    description: "Strategi marketing yang pas sama bisnis dan budget kamu.",
    icon: "trending-up",
    image_id: null,
    cta_label: "Konsultasi",
    cta_url: null,
    sort_order: 4,
    ...base,
  },
  {
    id: "svc-product",
    title: "Produk Digital",
    slug: "produk-digital",
    description: "Template, plugin & tools premium dengan harga murah.",
    icon: "package",
    image_id: null,
    cta_label: "Lihat Produk",
    cta_url: "https://naon.id",
    sort_order: 5,
    ...base,
  },
];

export const FALLBACK_PACKAGES: Package[] = [
  {
    id: "pkg-basic",
    name: "Basic",
    price: 350000,
    description: "Buat yang baru mulai.",
    features: ["1 halaman landing", "Mobile friendly", "Form WhatsApp", "1x revisi"],
    bonus: null,
    badge: null,
    cta_label: "Pesan Basic",
    cta_url: null,
    sort_order: 0,
    is_featured: false,
    ...base,
  },
  {
    id: "pkg-pro",
    name: "Pro",
    price: 750000,
    description: "Pilihan paling pas.",
    features: ["Sampai 6 section", "Copywriting persuasif", "Animasi ringan", "SEO dasar", "3x revisi"],
    bonus: ["Konsultasi strategi gratis"],
    badge: "Paling Populer",
    cta_label: "Pesan Pro",
    cta_url: null,
    sort_order: 1,
    is_featured: true,
    ...base,
  },
  {
    id: "pkg-bisnis",
    name: "Bisnis",
    price: 1500000,
    description: "Buat yang serius scaling.",
    features: [
      "Section unlimited",
      "Copywriting + struktur funnel",
      "Setup ads dasar",
      "Integrasi tools",
      "Priority support",
    ],
    bonus: null,
    badge: null,
    cta_label: "Pesan Bisnis",
    cta_url: null,
    sort_order: 2,
    is_featured: false,
    ...base,
  },
];

export const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    id: "t-adit",
    name: "Adit Pritno",
    role: "Client Website",
    business_name: null,
    quote: "Luar biasa after sales jasa pembuatan website nya mantap dan tidak diragukan lagi",
    avatar_id: null,
    rating: 5,
    sort_order: 0,
    ...base,
  },
  {
    id: "t-anura",
    name: "Anura",
    role: "Marketing",
    business_name: null,
    quote: "Mentor terbaik buat belajar website developer bagi pemula",
    avatar_id: null,
    rating: 5,
    sort_order: 1,
    ...base,
  },
  {
    id: "t-ramdhan",
    name: "Ramdhan",
    role: "Seller Sepatu",
    business_name: null,
    quote: "Belajar cara membuat website paling lengkap, materi rapi dan after salesnya terbaik",
    avatar_id: null,
    rating: 5,
    sort_order: 2,
    ...base,
  },
  {
    id: "t-alfina",
    name: "Alfina",
    role: "Seller Madu",
    business_name: null,
    quote: "Belajar wordpress untuk facebook ads jadi lebih optimal",
    avatar_id: null,
    rating: 5,
    sort_order: 3,
    ...base,
  },
];

export const FALLBACK_FAQS: Faq[] = [
  {
    id: "faq-1",
    question: "Berapa lama pengerjaan landing page?",
    answer: "Rata-rata 3–5 hari kerja, tergantung kompleksitas dan kecepatan revisi dari kamu.",
    category: "Umum",
    sort_order: 0,
    ...base,
  },
  {
    id: "faq-2",
    question: "Apakah bisa revisi?",
    answer: "Bisa. Tiap paket sudah termasuk jatah revisi. Santai aja, kita kerjain sampai pas.",
    category: "Umum",
    sort_order: 1,
    ...base,
  },
  {
    id: "faq-3",
    question: "Pembayaran gimana?",
    answer: "DP 50% di awal buat mulai, pelunasan setelah landing page selesai dan kamu approve.",
    category: "Pembayaran",
    sort_order: 2,
    ...base,
  },
  {
    id: "faq-4",
    question: "Domain & hosting disediakan?",
    answer: "Bisa aku bantu setup, atau pakai punya kamu. Aku kasih rekomendasi yang murah & cepat.",
    category: "Teknis",
    sort_order: 3,
    ...base,
  },
];

export const FALLBACK_RECOMMENDATIONS: Recommendation[] = [
  { id: "r-1", title: "Niagahoster", category: "Hosting", description: "Hosting cepat & murah buat website pertama kamu.", image_id: null, icon: "server", link_url: "#", badge: "Rekomendasi", sort_order: 0, ...base },
  { id: "r-2", title: "Elementor Pro", category: "Plugin", description: "Page builder WordPress paling fleksibel.", image_id: null, icon: "puzzle", link_url: "#", badge: null, sort_order: 1, ...base },
  { id: "r-3", title: "Midtrans", category: "Payment", description: "Payment gateway lengkap buat toko online.", image_id: null, icon: "credit-card", link_url: "#", badge: null, sort_order: 2, ...base },
  { id: "r-4", title: "Canva Pro", category: "Tools", description: "Desain konten marketing tanpa ribet.", image_id: null, icon: "palette", link_url: "#", badge: "Favorit", sort_order: 3, ...base },
  { id: "r-5", title: "Landing Kit", category: "Template", description: "Template landing page siap pakai & convert.", image_id: null, icon: "layout-template", link_url: "https://naon.id", badge: null, sort_order: 4, ...base },
  { id: "r-6", title: "Ubersuggest", category: "Tools", description: "Riset keyword & analisa SEO kompetitor.", image_id: null, icon: "search", link_url: "#", badge: null, sort_order: 5, ...base },
];

const article = (
  id: string,
  title: string,
  slug: string,
  category: string,
  excerpt: string,
  published_at: string,
  content: string,
): Article => ({
  id,
  title,
  slug,
  excerpt,
  content,
  featured_image_id: null,
  category,
  tags: [category],
  seo_title: title,
  seo_description: excerpt,
  status: "published",
  published_at,
  created_at: published_at,
  updated_at: published_at,
});

export const FALLBACK_ARTICLES: Article[] = [
  article(
    "a-1",
    "7 Peluang Usaha dan Bisnis Rumahan Modal Kecil yang Menjanjikan",
    "peluang-usaha-bisnis-rumahan-modal-kecil",
    "Bisnis",
    "Mau mulai bisnis dari rumah tapi modal pas-pasan? Ini 7 ide yang beneran bisa kamu jalanin.",
    "2024-09-01T00:00:00Z",
    "<p>Memulai bisnis rumahan nggak harus nunggu modal gede. Banyak peluang usaha yang bisa kamu mulai dari rumah dengan modal kecil tapi punya potensi cuan yang menjanjikan.</p><h2>1. Jasa Digital Marketing</h2><p>Kalau kamu punya skill marketing, ini bisa jadi sumber penghasilan tanpa modal besar.</p><h2>2. Reseller Produk Digital</h2><p>Jualan template, plugin, dan tools premium tanpa perlu stok.</p>",
  ),
  article(
    "a-2",
    "7 Barang Sembako Paling Laris dan Banyak Diminati Masyarakat Luas",
    "barang-sembako-paling-laris",
    "Bisnis",
    "Sembako selalu dibutuhkan. Ini daftar barang yang perputarannya paling cepat.",
    "2024-08-20T00:00:00Z",
    "<p>Bisnis sembako termasuk yang paling stabil karena selalu dibutuhkan masyarakat setiap hari.</p>",
  ),
  article(
    "a-3",
    "6 Ide Peluang Bisnis di Desa yang Menguntungkan",
    "ide-peluang-bisnis-di-desa",
    "Bisnis",
    "Tinggal di desa bukan halangan buat sukses. Ini peluang bisnis yang cocok di kawasan pedesaan.",
    "2024-08-10T00:00:00Z",
    "<p>Potensi bisnis di desa sering kali diremehkan, padahal banyak peluang yang menguntungkan.</p>",
  ),
  article(
    "a-4",
    "5 Peluang Bisnis Paling Menjanjikan Ketika Bulan Ramadhan",
    "peluang-bisnis-bulan-ramadhan",
    "Bisnis",
    "Momentum Ramadhan bisa jadi ladang rezeki. Ini bisnis musiman yang paling laris.",
    "2024-08-05T00:00:00Z",
    "<p>Bulan Ramadhan selalu membawa peluang bisnis musiman yang menguntungkan.</p>",
  ),
  article(
    "a-5",
    "3 Alasan Mengapa Banyak Blogger Membuat Tutorial Tentang Blog",
    "alasan-blogger-membuat-tutorial-blog",
    "Informasi",
    "Kenapa sih blogger suka bikin tutorial soal ngeblog? Ini alasannya.",
    "2024-08-01T00:00:00Z",
    "<p>Tutorial tentang blog jadi konten favorit banyak blogger karena beberapa alasan strategis.</p>",
  ),
  article(
    "a-6",
    "4 Kegiatan yang Dilakukan Setelah Pensiun Jadi Blogger (Tips Investasi Blog)",
    "kegiatan-setelah-pensiun-jadi-blogger",
    "Informasi",
    "Pensiun ngeblog bukan berarti berhenti cuan. Ini tips investasi dari aset blog kamu.",
    "2023-11-15T00:00:00Z",
    "<p>Setelah lama ngeblog, banyak yang memilih 'pensiun' tapi tetap menjadikan blog sebagai aset investasi.</p>",
  ),
];

export const FALLBACK_PROCESS = [
  { id: "fp-1", icon: "message-circle", title: "Konsultasi", description: "Ngobrol dulu soal kebutuhan & target kamu. Gratis, santai.", sort_order: 1, is_visible: true, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
  { id: "fp-2", icon: "credit-card", title: "Deal & Pembayaran", description: "Sepakat scope dan harga, DP 50% buat mulai pengerjaan.", sort_order: 2, is_visible: true, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
  { id: "fp-3", icon: "wrench", title: "Pengerjaan", description: "Aku kerjain sesuai brief, kamu pantau progresnya.", sort_order: 3, is_visible: true, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
  { id: "fp-4", icon: "zap", title: "Launch & Support", description: "Online, revisi sesuai jatah, plus support setelah jadi.", sort_order: 4, is_visible: true, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
];

export const FALLBACK_SKILLS = [
  { id: "fs-1", icon: "globe", label: "Website", sort_order: 1, is_visible: true, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
  { id: "fs-2", icon: "trending-up", label: "SEO", sort_order: 2, is_visible: true, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
  { id: "fs-3", icon: "type", label: "Copywriting", sort_order: 3, is_visible: true, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
  { id: "fs-4", icon: "megaphone", label: "Advertising", sort_order: 4, is_visible: true, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
  { id: "fs-5", icon: "layout-template", label: "Landing Page", sort_order: 5, is_visible: true, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
];

export const FALLBACK_BIO = [
  { id: "fb-1", icon: "message-circle", label: "Chat WhatsApp", sub_text: "Konsultasi gratis", is_accent: true, href: "wa", sort_order: 1, is_visible: true, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
  { id: "fb-2", icon: "layout-template", label: "Jasa Landing Page", sub_text: "Lihat paket & harga", is_accent: false, href: "/jasa-pembuatan-landing-page", sort_order: 2, is_visible: true, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
  { id: "fb-3", icon: "package", label: "Naon.id — Produk Digital", sub_text: "Produk premium digital marketing", is_accent: false, href: "https://naon.id", sort_order: 3, is_visible: true, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
  { id: "fb-4", icon: "graduation-cap", label: "Berilmu.id — Belajar", sub_text: "Belajar digital marketing", is_accent: false, href: "https://berilmu.id", sort_order: 4, is_visible: true, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
  { id: "fb-5", icon: "file-text", label: "Blog & Tutorial", sub_text: "Artikel & tips", is_accent: false, href: "/blog", sort_order: 5, is_visible: true, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
  { id: "fb-6", icon: "instagram", label: "Instagram", sub_text: "@ahzelanx", is_accent: false, href: "https://instagram.com/ahzelanx", sort_order: 6, is_visible: true, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
  { id: "fb-7", icon: "youtube", label: "YouTube", sub_text: "@ahzelanx", is_accent: false, href: "https://youtube.com/@ahzelanx", sort_order: 7, is_visible: true, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
  { id: "fb-8", icon: "send", label: "Telegram", sub_text: "@jadinaonn", is_accent: false, href: "https://t.me/jadinaonn", sort_order: 8, is_visible: true, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
];

export const FALLBACK_GALLERY = [
  { id: "fg-1", media_id: null, image_url: "/img/ahzelan-portrait.webp", caption: "Ahzelan", aspect_w: 4, aspect_h: 5, sort_order: 1, is_visible: true, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
  { id: "fg-2", media_id: null, image_url: "/img/ahzelan-di-dieng-1.webp", caption: "Di Dieng", aspect_w: 4, aspect_h: 5, sort_order: 2, is_visible: true, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
  { id: "fg-3", media_id: null, image_url: "/img/naon.webp", caption: "Naon.id", aspect_w: 16, aspect_h: 9, sort_order: 3, is_visible: true, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
  { id: "fg-4", media_id: null, image_url: "/img/sandaran-digital.webp", caption: "Sandaran Digital", aspect_w: 16, aspect_h: 4, sort_order: 4, is_visible: true, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
  { id: "fg-5", media_id: null, image_url: "/img/berilmu.webp", caption: "Berilmu.id", aspect_w: 16, aspect_h: 9, sort_order: 5, is_visible: true, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
];
