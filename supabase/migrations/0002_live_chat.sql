-- =============================================================================
-- Ahzelan.com — live chat (AI bot + escalate to human)
-- IDEMPOTENT: safe to run multiple times. Drops trigger/function/policy if they
-- already exist before recreating.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- chat_sessions
-- -----------------------------------------------------------------------------
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  guest_token text not null unique,
  guest_name text,
  guest_email text,
  status text not null default 'bot' check (status in ('bot','live_requested','live','closed')),
  bot_mode boolean not null default true,
  last_message_at timestamptz not null default now(),
  admin_unread int not null default 0,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- backfill columns added later (idempotent) so older schemas catch up
do $$ begin
  alter table public.chat_sessions add column if not exists admin_unread int not null default 0;
  alter table public.chat_sessions add column if not exists guest_unread int not null default 0;
  alter table public.chat_sessions add column if not exists summary text;
exception when others then null; end $$;

drop trigger if exists _chat_sessions_updated on public.chat_sessions;
create trigger _chat_sessions_updated before update on public.chat_sessions
  for each row execute function public.tg_set_updated_at();
create index if not exists chat_sessions_status on public.chat_sessions(status, last_message_at desc);
create index if not exists chat_sessions_token on public.chat_sessions(guest_token);

-- -----------------------------------------------------------------------------
-- chat_messages
-- -----------------------------------------------------------------------------
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant','system','admin')),
  actor text not null default 'guest' check (actor in ('guest','bot','admin')),
  content text not null,
  created_at timestamptz not null default now()
);
drop trigger if exists _chat_messages_updated on public.chat_messages;
create trigger _chat_messages_updated before update on public.chat_messages
  for each row execute function public.tg_set_updated_at();
create index if not exists chat_messages_session on public.chat_messages(session_id, created_at);

-- -----------------------------------------------------------------------------
-- RLS (idempotent: drop policy if exists before create)
-- -----------------------------------------------------------------------------
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

-- -----------------------------------------------------------------------------
-- GRANTs — ensure all roles can access (Supabase auto-grants sometimes miss
-- when a migration partially failed; this is the explicit belt-and-suspenders).
-- -----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;
grant all on public.chat_sessions to anon, authenticated, service_role;
grant all on public.chat_messages to anon, authenticated, service_role;

drop policy if exists "chat_session owner read" on public.chat_sessions;
drop policy if exists "chat_session owner update" on public.chat_sessions;
drop policy if exists "chat_session insert" on public.chat_sessions;
drop policy if exists "chat_messages read" on public.chat_messages;
drop policy if exists "chat_messages guest insert" on public.chat_messages;
drop policy if exists "chat_messages auth write" on public.chat_messages;

create policy "chat_session owner read" on public.chat_sessions
  for select to anon, authenticated using (true);
create policy "chat_session owner update" on public.chat_sessions
  for update to anon, authenticated using (true) with check (true);
create policy "chat_session insert" on public.chat_sessions
  for insert to anon, authenticated with check (true);
create policy "chat_messages read" on public.chat_messages
  for select to anon, authenticated using (true);
create policy "chat_messages guest insert" on public.chat_messages
  for insert to anon, authenticated
  with check (role in ('user','system') and actor = 'guest');
create policy "chat_messages auth write" on public.chat_messages
  for all to authenticated using (true) with check (true);

-- -----------------------------------------------------------------------------
-- Realtime publication (idempotent)
-- -----------------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.chat_sessions;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.chat_messages;
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- Unread-counter triggers (idempotent)
-- -----------------------------------------------------------------------------
drop function if exists public.tg_chat_guest_unread() cascade;
create or replace function public.tg_chat_guest_unread()
returns trigger language plpgsql as $$
begin
  if new.actor = 'guest' then
    update public.chat_sessions
      set admin_unread = admin_unread + 1,
          last_message_at = now(),
          summary = left(new.content, 80)
      where id = new.session_id;
  end if;
  return new;
end $$;
drop trigger if exists _chat_guest_unread on public.chat_messages;
create trigger _chat_guest_unread after insert on public.chat_messages
  for each row execute function public.tg_chat_guest_unread();

drop function if exists public.tg_chat_guest_unread_reply() cascade;
create or replace function public.tg_chat_guest_unread_reply()
returns trigger language plpgsql as $$
begin
  if new.actor in ('admin','bot') then
    update public.chat_sessions
      set guest_unread = guest_unread + 1,
          last_message_at = now()
      where id = new.session_id;
  end if;
  return new;
end $$;
drop trigger if exists _chat_reply_unread on public.chat_messages;
create trigger _chat_reply_unread after insert on public.chat_messages
  for each row execute function public.tg_chat_guest_unread_reply();
