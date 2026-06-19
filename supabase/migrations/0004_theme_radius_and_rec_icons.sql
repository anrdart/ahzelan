-- =============================================================================
-- Ahzelan.com — theme radius persistence + recommendation icons
-- IDEMPOTENT: safe to run multiple times.
-- =============================================================================

-- 1) ThemeManager radius persistence (primary_color + font_heading already exist).
--    Stored as a CSS length string, e.g. '12px'. Applied site-wide as `--radius`.
do $$ begin
  alter table public.site_settings add column if not exists radius text default '12px';
exception when others then null; end $$;

-- 2) Per-row icon for recommendations (replaces the brittle title-matching heuristic).
--    Added WITHOUT a default first so the category backfill below actually matches
--    existing rows (a constant default would pre-populate every row and make the
--    `icon is null` guard a no-op). The default for future inserts is set after.
do $$ begin
  alter table public.recommendations add column if not exists icon text;
exception when others then null; end $$;

-- Backfill existing rows with a sensible icon from their category. The
-- `icon is null` guard preserves any admin-chosen icon on re-run.
do $$
begin
  update public.recommendations set icon = 'server'          where icon is null and lower(category) like '%hosting%';
  update public.recommendations set icon = 'puzzle'          where icon is null and lower(category) like '%plugin%';
  update public.recommendations set icon = 'credit-card'     where icon is null and lower(category) like '%payment%';
  update public.recommendations set icon = 'layout-template' where icon is null and lower(category) like '%template%';
  update public.recommendations set icon = 'palette'         where icon is null and lower(category) like '%tools%';
  update public.recommendations set icon = 'layout-template' where icon is null;
exception when others then null;
end $$;

-- Default for FUTURE inserts only (doesn't touch existing/backfilled rows).
do $$ begin
  alter table public.recommendations alter column icon set default 'layout-template';
exception when others then null; end $$;
