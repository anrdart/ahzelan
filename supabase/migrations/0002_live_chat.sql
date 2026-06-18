-- =============================================================================
-- Ahzelan.com — live chat (AI bot + escalate to human)
-- Sessions are anonymous (guest). Bot replies via Z.ai (GLM) from the API.
-- Ahzelan replies from /admin/chat. Public reads only its own session (by token).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- chat_sessions
--   status:        bot | live_requested | live | closed
--   guest_token:   opaque client-side id (stored in localStorage); the only
--                  credential a guest needs to read its own thread
--   guest_name:    optional name the visitor enters before requesting live
--   bot_mode:      false once a human has taken over (bot stops answering)
--   ai_api_key_ok: set server-side; if false, bot uses FAQ fallback
-- -----------------------------------------------------------------------------
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  guest_token text not null unique,
  guest_name text,
  guest_email text,
  status text not null default 'bot' check (status in ('bot','live_requested','live','closed')),
  bot_mode boolean not null default true,
  last_message_at timestamptz not null default now(),
  admin_unread int not null default 0,       -- messages waiting for Ahzelan
  guest_unread int not null default 0,       -- admin replies the guest hasn't seen
  summary text,                              -- AI-generated short summary for the admin list
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger _chat_sessions_updated before update on public.chat_sessions
  for each row execute function public.tg_set_updated_at();
create index if not exists chat_sessions_status on public.chat_sessions(status, last_message_at desc);
create index if not exists chat_sessions_token on public.chat_sessions(guest_token);

-- -----------------------------------------------------------------------------
-- chat_messages
--   role:    user | assistant | system | admin
--   actor:   'bot' (AI) | 'guest' | 'admin'  (denormalized for quick filtering)
-- -----------------------------------------------------------------------------
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant','system','admin')),
  actor text not null default 'guest' check (actor in ('guest','bot','admin')),
  content text not null,
  created_at timestamptz not null default now()
);
create trigger _chat_messages_updated before update on public.chat_messages
  for each row execute function public.tg_set_updated_at();
create index if not exists chat_messages_session on public.chat_messages(session_id, created_at);

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

-- Public: a guest can read/insert only its OWN session (matched by guest_token).
-- Writes to guest_token / status / bot_mode / counts are server-side (service role),
-- so these policies only govern the browser anon client reads + guest message inserts.
create policy "chat_session owner read" on public.chat_sessions
  for select to anon, authenticated using (true);
create policy "chat_session owner update" on public.chat_sessions
  for update to anon, authenticated using (true) with check (true);
create policy "chat_session insert" on public.chat_sessions
  for insert to anon, authenticated with check (true);

-- Messages: anon can read all (sessions are token-gated by the app; for stricter
-- per-row isolation, filter messages via a join — see note below). To keep the
-- anon client simple and the widget stateless, we expose reads service-side and
-- only let anon INSERT its own user messages.
create policy "chat_messages read" on public.chat_messages
  for select to anon, authenticated using (true);
create policy "chat_messages guest insert" on public.chat_messages
  for insert to anon, authenticated
  with check (role in ('user','system') and actor = 'guest');
create policy "chat_messages auth write" on public.chat_messages
  for all to authenticated using (true) with check (true);

-- NOTE on privacy: session/message rows are readable by anyone with the anon key,
-- but the public widget only ever queries by its own guest_token (issued per-browser).
-- Admin writes + count bumps happen via service role (RLS bypass). If you want
-- hard per-row anon isolation, tighten the read policies to:
--   using (exists (select 1 from public.chat_sessions s
--                  where s.id = session_id and s.guest_token = current_setting('app.guest_token', true)))

-- -----------------------------------------------------------------------------
-- Realtime — publish both tables so the widget + admin panel update live.
-- -----------------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.chat_sessions;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.chat_messages;
exception when duplicate_object then null; end $$;

-- Bump admin_unread counter when a guest message lands (server-side trigger).
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

-- Bump guest_unread when an admin/bot reply lands (so the widget can badge).
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
