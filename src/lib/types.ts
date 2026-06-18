/** Row types for every Supabase table. Matches supabase/migrations/0001_init.sql. */
export type Visibility = { is_visible?: boolean; status?: "draft" | "published" };

export type SiteSetting = {
  id: 1;
  site_name: string;
  tagline: string | null;
  logo_light_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  font_heading: string | null;
  font_body: string | null;
  whatsapp_number: string | null;
  email: string | null;
  socials: { instagram?: string; youtube?: string; facebook?: string; twitter?: string; telegram?: string } | null;
  footer_text: string | null;
  default_seo_title: string | null;
  default_seo_description: string | null;
  og_image_url: string | null;
  analytics_script: string | null;
  updated_at: string;
};

export type Page = {
  id: string;
  title: string;
  slug: string;
  seo_title: string | null;
  seo_description: string | null;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
};

export type Section = {
  id: string;
  page_id: string;
  section_key: string;
  section_type: string;
  title: string | null;
  subtitle: string | null;
  content: Record<string, unknown> | null;
  media_id: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
};

export type Media = {
  id: string;
  file_name: string;
  file_url: string;
  alt_text: string | null;
  mime_type: string | null;
  size: number | null;
  width: number | null;
  height: number | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
};

export type NavItem = {
  id: string;
  label: string;
  href: string;
  parent_id: string | null;
  sort_order: number;
  is_external: boolean;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
};

export type Service = {
  id: string;
  title: string;
  slug: string;
  description: string;
  icon: string | null;
  image_id: string | null;
  cta_label: string | null;
  cta_url: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
};

export type Package = {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  bonus: string[] | null;
  badge: string | null;
  cta_label: string | null;
  cta_url: string | null;
  sort_order: number;
  is_featured: boolean;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
};

export type Testimonial = {
  id: string;
  name: string;
  role: string | null;
  business_name: string | null;
  quote: string;
  avatar_id: string | null;
  rating: number | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
};

export type Recommendation = {
  id: string;
  title: string;
  category: string;
  description: string;
  image_id: string | null;
  link_url: string | null;
  badge: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
};

export type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image_id: string | null;
  category: string;
  tags: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ActivityLog = {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};
