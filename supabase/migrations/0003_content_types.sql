-- =============================================================================
-- Ahzelan.com — additional content types (gallery, bio links, process, skills)
-- IDEMPOTENT: safe to run multiple times.
-- =============================================================================

-- gallery_items
create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  media_id uuid references public.media(id) on delete set null,
  image_url text not null,
  caption text,
  aspect_w int not null default 4,
  aspect_h int not null default 5,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists _gallery_items_updated on public.gallery_items;
create trigger _gallery_items_updated before update on public.gallery_items
  for each row execute function public.tg_set_updated_at();
create index if not exists gallery_items_sort on public.gallery_items(sort_order);

-- bio_links
create table if not exists public.bio_links (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  sub_text text,
  icon text not null default 'link',
  href text not null,
  is_accent boolean not null default false,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists _bio_links_updated on public.bio_links;
create trigger _bio_links_updated before update on public.bio_links
  for each row execute function public.tg_set_updated_at();
create index if not exists bio_links_sort on public.bio_links(sort_order);

-- process_steps
create table if not exists public.process_steps (
  id uuid primary key default gen_random_uuid(),
  icon text not null default 'circle',
  title text not null,
  description text not null,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists _process_steps_updated on public.process_steps;
create trigger _process_steps_updated before update on public.process_steps
  for each row execute function public.tg_set_updated_at();
create index if not exists process_steps_sort on public.process_steps(sort_order);

-- skills
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  icon text not null default 'star',
  label text not null,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists _skills_updated on public.skills;
create trigger _skills_updated before update on public.skills
  for each row execute function public.tg_set_updated_at();
create index if not exists skills_sort on public.skills(sort_order);

-- RLS policies
do $$ begin
  alter table public.gallery_items enable row level security;
  alter table public.bio_links enable row level security;
  alter table public.process_steps enable row level security;
  alter table public.skills enable row level security;
exception when others then null; end $$;

-- Public read (visible only)
do $$ begin
  drop policy if exists "gallery_public_read" on public.gallery_items;
  create policy "gallery_public_read" on public.gallery_items for select using (is_visible = true);
  drop policy if exists "bio_links_public_read" on public.bio_links;
  create policy "bio_links_public_read" on public.bio_links for select using (is_visible = true);
  drop policy if exists "process_steps_public_read" on public.process_steps;
  create policy "process_steps_public_read" on public.process_steps for select using (is_visible = true);
  drop policy if exists "skills_public_read" on public.skills;
  create policy "skills_public_read" on public.skills for select using (is_visible = true);
end $$;

-- Authenticated full CRUD
do $$ begin
  drop policy if exists "gallery_auth_all" on public.gallery_items;
  create policy "gallery_auth_all" on public.gallery_items for all to authenticated using (true) with check (true);
  drop policy if exists "bio_links_auth_all" on public.bio_links;
  create policy "bio_links_auth_all" on public.bio_links for all to authenticated using (true) with check (true);
  drop policy if exists "process_steps_auth_all" on public.process_steps;
  create policy "process_steps_auth_all" on public.process_steps for all to authenticated using (true) with check (true);
  drop policy if exists "skills_auth_all" on public.skills;
  create policy "skills_auth_all" on public.skills for all to authenticated using (true) with check (true);
end $$;
