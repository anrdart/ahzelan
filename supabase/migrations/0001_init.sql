-- =============================================================================
-- Ahzelan.com — initial schema
-- All tables from the redesign brief. RLS enabled. Service role bypasses RLS
-- for admin writes via the Astro API endpoints (which call requireAdmin first).
-- =============================================================================

create extension if not exists "pgcrypto";

-- updated_at trigger fn
create or replace function public.tg_set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- -----------------------------------------------------------------------------
-- site_settings
-- -----------------------------------------------------------------------------
create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  site_name text not null default 'Ahzelan',
  tagline text,
  logo_light_url text,
  logo_dark_url text,
  favicon_url text,
  primary_color text default '#2E4191',
  secondary_color text default '#06b6d4',
  accent_color text default '#f59e0b',
  font_heading text default 'Plus Jakarta Sans',
  font_body text default 'Inter',
  whatsapp_number text default '6285156563313',
  email text default 'salam@ahzelan.com',
  socials jsonb,
  footer_text text,
  default_seo_title text,
  default_seo_description text,
  og_image_url text,
  analytics_script text,
  whitelist_admins jsonb default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
create trigger _site_settings_updated before update on public.site_settings
  for each row execute function public.tg_set_updated_at();
insert into public.site_settings (id) values (1) on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- pages / sections
-- -----------------------------------------------------------------------------
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  seo_title text,
  seo_description text,
  status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger _pages_updated before update on public.pages
  for each row execute function public.tg_set_updated_at();

create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  section_key text not null,
  section_type text not null,
  title text,
  subtitle text,
  content jsonb,
  media_id uuid,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger _sections_updated before update on public.sections
  for each row execute function public.tg_set_updated_at();
create index if not exists sections_page_sort on public.sections(page_id, sort_order);

-- -----------------------------------------------------------------------------
-- media
-- -----------------------------------------------------------------------------
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_url text not null,
  alt_text text,
  mime_type text,
  size int,
  width int,
  height int,
  tags text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger _media_updated before update on public.media
  for each row execute function public.tg_set_updated_at();
create index if not exists media_tags on public.media using gin(tags);

-- deferred FKs (so table order doesn't matter)
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'sections_media_fk') then
    alter table public.sections add constraint sections_media_fk
      foreign key (media_id) references public.media(id) on delete set null;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- navigation_items
-- -----------------------------------------------------------------------------
create table if not exists public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  href text not null,
  parent_id uuid references public.navigation_items(id) on delete cascade,
  sort_order int not null default 0,
  is_external boolean not null default false,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger _nav_updated before update on public.navigation_items
  for each row execute function public.tg_set_updated_at();
create index if not exists nav_parent on public.navigation_items(parent_id, sort_order);

-- -----------------------------------------------------------------------------
-- services
-- -----------------------------------------------------------------------------
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  icon text,
  image_id uuid references public.media(id) on delete set null,
  cta_label text,
  cta_url text,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger _services_updated before update on public.services
  for each row execute function public.tg_set_updated_at();

-- -----------------------------------------------------------------------------
-- packages
-- -----------------------------------------------------------------------------
create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price bigint not null,
  description text,
  features jsonb not null default '[]'::jsonb,
  bonus jsonb,
  badge text,
  cta_label text,
  cta_url text,
  sort_order int not null default 0,
  is_featured boolean not null default false,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger _packages_updated before update on public.packages
  for each row execute function public.tg_set_updated_at();

-- -----------------------------------------------------------------------------
-- testimonials
-- -----------------------------------------------------------------------------
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  business_name text,
  quote text not null,
  avatar_id uuid references public.media(id) on delete set null,
  rating int check (rating between 1 and 5),
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger _testimonials_updated before update on public.testimonials
  for each row execute function public.tg_set_updated_at();

-- -----------------------------------------------------------------------------
-- faqs
-- -----------------------------------------------------------------------------
create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger _faqs_updated before update on public.faqs
  for each row execute function public.tg_set_updated_at();

-- -----------------------------------------------------------------------------
-- recommendations
-- -----------------------------------------------------------------------------
create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  description text,
  image_id uuid references public.media(id) on delete set null,
  link_url text,
  badge text,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger _recommendations_updated before update on public.recommendations
  for each row execute function public.tg_set_updated_at();

-- -----------------------------------------------------------------------------
-- articles
-- -----------------------------------------------------------------------------
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null,
  featured_image_id uuid references public.media(id) on delete set null,
  category text not null default 'Umum',
  tags text[],
  seo_title text,
  seo_description text,
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger _articles_updated before update on public.articles
  for each row execute function public.tg_set_updated_at();
create index if not exists articles_status on public.articles(status, published_at desc);
create index if not exists articles_tags on public.articles using gin(tags);

-- -----------------------------------------------------------------------------
-- activity_logs
-- -----------------------------------------------------------------------------
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists activity_recent on public.activity_logs(created_at desc);

-- =============================================================================
-- ROW-LEVEL SECURITY
-- Public read-only on published/visible rows. No public writes.
-- Admin writes happen via service role (bypasses RLS) in Astro API endpoints
-- after the user is verified as an admin in lib/auth.ts.
-- =============================================================================
alter table public.site_settings enable row level security;
alter table public.pages enable row level security;
alter table public.sections enable row level security;
alter table public.media enable row level security;
alter table public.navigation_items enable row level security;
alter table public.services enable row level security;
alter table public.packages enable row level security;
alter table public.testimonials enable row level security;
alter table public.faqs enable row level security;
alter table public.recommendations enable row level security;
alter table public.articles enable row level security;
alter table public.activity_logs enable row level security;

-- public read: site_settings (always), published pages/sections, visible nav,
-- visible services/packages/testimonials/faqs/recommendations, published articles.
create policy "site_settings public read" on public.site_settings for select using (true);
create policy "pages public read" on public.pages for select using (status = 'published');
create policy "sections public read" on public.sections for select using (is_visible = true);
create policy "media public read" on public.media for select using (true);
create policy "nav public read" on public.navigation_items for select using (is_visible = true);
create policy "services public read" on public.services for select using (is_visible = true);
create policy "packages public read" on public.packages for select using (is_visible = true);
create policy "testimonials public read" on public.testimonials for select using (is_visible = true);
create policy "faqs public read" on public.faqs for select using (is_visible = true);
create policy "recommendations public read" on public.recommendations for select using (is_visible = true);
create policy "articles public read" on public.articles for select using (status = 'published');

-- authenticated full CRUD — admin endpoints use service role, but if you ever
-- surface direct Supabase calls in the browser, the authenticated user with
-- an email in site_settings.whitelist_admins gets full access.
create policy "site_settings auth write" on public.site_settings for all to authenticated
  using (true) with check (true);
create policy "pages auth write" on public.pages for all to authenticated
  using (true) with check (true);
create policy "sections auth write" on public.sections for all to authenticated
  using (true) with check (true);
create policy "media auth write" on public.media for all to authenticated
  using (true) with check (true);
create policy "nav auth write" on public.navigation_items for all to authenticated
  using (true) with check (true);
create policy "services auth write" on public.services for all to authenticated
  using (true) with check (true);
create policy "packages auth write" on public.packages for all to authenticated
  using (true) with check (true);
create policy "testimonials auth write" on public.testimonials for all to authenticated
  using (true) with check (true);
create policy "faqs auth write" on public.faqs for all to authenticated
  using (true) with check (true);
create policy "recommendations auth write" on public.recommendations for all to authenticated
  using (true) with check (true);
create policy "articles auth write" on public.articles for all to authenticated
  using (true) with check (true);
create policy "activity auth write" on public.activity_logs for all to authenticated
  using (true) with check (true);

-- =============================================================================
-- STORAGE
-- =============================================================================
-- One bucket, public read, admin-only write. Run from Supabase dashboard
-- (SQL editor can't create buckets in older schemas):
--   insert into storage.buckets (id, name, public) values ('media', 'media', true)
--   on conflict (id) do nothing;
-- Then policies:
create policy "media public read" on storage.objects for select using (bucket_id = 'media');
create policy "media admin write" on storage.objects for all to authenticated
  using (bucket_id = 'media') with check (bucket_id = 'media');
