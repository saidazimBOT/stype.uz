-- ═══════════════════════════════════════════════════════════════════════
-- STypeUz — Full Supabase Schema (Convex → Supabase migration)
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. PROFILES (auth.users bilan bog'langan) ────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  first_name text,
  last_name text,
  email text,
  avatar_id text not null default 'avatar_default',
  avatar text not null default 'avatar_default',
  photo text,
  coins integer not null default 0,
  xp integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  draws integer not null default 0,
  races integer not null default 0,
  best_wpm integer,
  role text not null default 'user' check (role in ('user', 'admin', 'owner')),
  status text not null default 'active' check (status in ('active', 'blocked')),
  banned boolean not null default false,
  banned_reason text,
  last_seen bigint not null default 0,
  created_at timestamptz not null default now(),
  last_login timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists profiles_created_at_idx on public.profiles (created_at desc);
create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists profiles_username_idx on public.profiles (username);

-- ── 2. TYPING RESULTS ───────────────────────────────────────────────
create table if not exists public.typing_results (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  username text not null default '?',
  wpm integer not null,
  accuracy integer not null,
  errors integer not null default 0,
  correct integer not null default 0,
  total integer not null default 0,
  time integer not null default 0,
  lang text not null default 'en',
  duration integer not null default 15,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create index if not exists tr_user_id_idx on public.typing_results (user_id);
create index if not exists tr_created_at_idx on public.typing_results (created_at desc);

-- ── 3. ACHIEVEMENTS ─────────────────────────────────────────────────
create table if not exists public.achievements (
  id bigint generated always as identity primary key,
  key text not null unique,
  title text not null,
  description text not null default '',
  icon text not null default '🏆',
  color text not null default '#fbbf24',
  req_type text not null check (req_type in ('wpm','accuracy','tests','races','coins','xp')),
  req_goal integer not null default 0,
  xp_reward integer not null default 0,
  coin_reward integer not null default 0,
  enabled boolean not null default true,
  sort_order integer not null default 0
);

-- ── 4. USER ACHIEVEMENTS ────────────────────────────────────────────
create table if not exists public.user_achievements (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  achievement_key text not null,
  unlocked_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create index if not exists ua_user_idx on public.user_achievements (user_id);
create index if not exists ua_achievement_idx on public.user_achievements (achievement_key);
create unique index if not exists ua_user_achievement_idx on public.user_achievements (user_id, achievement_key);

-- ── 5. COIN TRANSACTIONS ────────────────────────────────────────────
create table if not exists public.coin_transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  username text not null default '?',
  kind text not null check (kind in ('coins', 'xp')),
  amount integer not null,
  balance_after integer not null,
  reason text not null default '',
  admin_name text not null default '',
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create index if not exists ct_user_idx on public.coin_transactions (user_id);
create index if not exists ct_created_at_idx on public.coin_transactions (created_at desc);

-- ── 6. REPORTS ──────────────────────────────────────────────────────
create table if not exists public.reports (
  id bigint generated always as identity primary key,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reporter_name text not null default '?',
  target_id uuid not null references auth.users (id) on delete cascade,
  target_name text not null default '?',
  reason text not null,
  details text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'resolved')),
  admin_note text,
  admin_name text,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  updated_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create index if not exists reports_status_idx on public.reports (status, created_at desc);

-- ── 7. ANNOUNCEMENTS ────────────────────────────────────────────────
create table if not exists public.announcements (
  id bigint generated always as identity primary key,
  title text not null,
  body text not null,
  enabled boolean not null default true,
  scheduled_for bigint,
  expires_at bigint,
  created_by_name text not null default '',
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  updated_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create index if not exists ann_enabled_idx on public.announcements (enabled, scheduled_for);

-- ── 8. ADMIN LOGS ───────────────────────────────────────────────────
create table if not exists public.admin_logs (
  id bigint generated always as identity primary key,
  admin_name text not null,
  action text not null,
  target text,
  details text,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create index if not exists admin_logs_created_idx on public.admin_logs (created_at desc);

-- ── 9. TYPING TEXTS ─────────────────────────────────────────────────
create table if not exists public.typing_texts (
  id bigint generated always as identity primary key,
  text text not null,
  lang text not null default 'en',
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  category text not null default 'general',
  enabled boolean not null default true,
  created_by_name text not null default '',
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create index if not exists tt_lang_idx on public.typing_texts (lang);

-- ── 10. SETTINGS ────────────────────────────────────────────────────
create table if not exists public.site_settings (
  id bigint generated always as identity primary key,
  site_name text not null default 'STypeUz',
  logo text not null default '',
  maintenance_mode boolean not null default false,
  maintenance_message text not null default '',
  registration_open boolean not null default true,
  announcements_enabled boolean not null default true,
  updated_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  updated_by_name text not null default ''
);

-- ═══════════════════════════════════════════════════════════════════════
-- FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════

-- Yangi foydalanuvchi ro'yxatdan o'tganda profil qatorini avtomatik yaratish
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, first_name, last_name, email, avatar_id, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'firstName',
    new.raw_user_meta_data ->> 'lastName',
    new.email,
    coalesce(new.raw_user_meta_data ->> 'avatarId', 'avatar_default'),
    coalesce(new.raw_user_meta_data ->> 'avatarId', 'avatar_default')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Admin tekshirish helper
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'owner')
  );
$$;

-- ═══════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════

alter table public.profiles enable row level security;
alter table public.typing_results enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.coin_transactions enable row level security;
alter table public.reports enable row level security;
alter table public.announcements enable row level security;
alter table public.admin_logs enable row level security;
alter table public.typing_texts enable row level security;
alter table public.site_settings enable row level security;

-- ── PROFILES ─────────────────────────────────────────────────────────
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select using (public.is_admin());

-- Leaderboard uchun: hamma barcha profillarni o'qiy oladi (faqat o'qish)
drop policy if exists "Anyone can read profiles for leaderboard" on public.profiles;
create policy "Anyone can read profiles for leaderboard"
  on public.profiles for select using (true);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id and role = 'user' and status = 'active');

create or replace function public.profile_role()
returns text language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid(); $$;

drop policy if exists "Users can update own safe fields" on public.profiles;
create policy "Users can update own safe fields"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = public.profile_role() and status = 'active');

-- ── TYPING RESULTS ──────────────────────────────────────────────────
drop policy if exists "Users can view own results" on public.typing_results;
create policy "Users can view own results"
  on public.typing_results for select using (auth.uid() = user_id);

drop policy if exists "Admins can view all results" on public.typing_results;
create policy "Admins can view all results"
  on public.typing_results for select using (public.is_admin());

-- Leaderboard uchun: hamma barcha natijalarni ko'ra oladi (faqat o'qish)
drop policy if exists "Anyone can read results for leaderboard" on public.typing_results;
create policy "Anyone can read results for leaderboard"
  on public.typing_results for select using (true);

drop policy if exists "Authenticated users can insert results" on public.typing_results;
create policy "Authenticated users can insert results"
  on public.typing_results for insert
  with check (auth.uid() = user_id);

-- ── ACHIEVEMENTS ────────────────────────────────────────────────────
drop policy if exists "Anyone can read achievements" on public.achievements;
create policy "Anyone can read achievements"
  on public.achievements for select using (true);

-- ── USER ACHIEVEMENTS ───────────────────────────────────────────────
drop policy if exists "Users can view own achievements" on public.user_achievements;
create policy "Users can view own achievements"
  on public.user_achievements for select using (auth.uid() = user_id);

drop policy if exists "Anyone can read user achievements" on public.user_achievements;
create policy "Anyone can read user achievements"
  on public.user_achievements for select using (true);

drop policy if exists "Authenticated users can insert achievements" on public.user_achievements;
create policy "Authenticated users can insert achievements"
  on public.user_achievements for insert
  with check (auth.uid() = user_id);

-- ── COIN TRANSACTIONS ───────────────────────────────────────────────
drop policy if exists "Users can view own transactions" on public.coin_transactions;
create policy "Users can view own transactions"
  on public.coin_transactions for select using (auth.uid() = user_id);

drop policy if exists "Admins can view all transactions" on public.coin_transactions;
create policy "Admins can view all transactions"
  on public.coin_transactions for select using (public.is_admin());

drop policy if exists "Authenticated users can insert transactions" on public.coin_transactions;
create policy "Authenticated users can insert transactions"
  on public.coin_transactions for insert
  with check (auth.uid() = user_id);

-- ── REPORTS ──────────────────────────────────────────────────────────
drop policy if exists "Users can view own reports" on public.reports;
create policy "Users can view own reports"
  on public.reports for select using (auth.uid() = reporter_id or auth.uid() = target_id);

drop policy if exists "Admins can view all reports" on public.reports;
create policy "Admins can view all reports"
  on public.reports for select using (public.is_admin());

drop policy if exists "Authenticated users can insert reports" on public.reports;
create policy "Authenticated users can insert reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

-- ── ANNOUNCEMENTS ────────────────────────────────────────────────────
drop policy if exists "Anyone can read announcements" on public.announcements;
create policy "Anyone can read announcements"
  on public.announcements for select using (true);

-- ── ADMIN LOGS ───────────────────────────────────────────────────────
drop policy if exists "Admins can view logs" on public.admin_logs;
create policy "Admins can view logs"
  on public.admin_logs for select using (public.is_admin());

-- ── TYPING TEXTS ─────────────────────────────────────────────────────
drop policy if exists "Anyone can read typing texts" on public.typing_texts;
create policy "Anyone can read typing texts"
  on public.typing_texts for select using (true);

-- ── SITE SETTINGS ────────────────────────────────────────────────────
drop policy if exists "Anyone can read settings" on public.site_settings;
create policy "Anyone can read settings"
  on public.site_settings for select using (true);

-- ═══════════════════════════════════════════════════════════════════════
-- ADMIN RPC FUNCTIONS (xavfsiz server-side operatsiyalar)
-- ═══════════════════════════════════════════════════════════════════════

-- Admin boshqa foydalanuvchiga coin berish
create or replace function public.admin_add_coins(target_id uuid, amount integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if amount <= 0 or amount > 1000000 then
    raise exception 'Noto''g''ri miqdor';
  end if;
  if not public.is_admin() then
    raise exception 'Ruxsat yo''q';
  end if;
  update public.profiles set coins = coins + amount, updated_at = now() where id = target_id;
end;
$$;

revoke all on function public.admin_add_coins(uuid, integer) from public;
grant execute on function public.admin_add_coins(uuid, integer) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- USER DATA TABLES (localStorage → Supabase)
-- ═══════════════════════════════════════════════════════════════════════

-- ── 11. USER COSMETICS (sotib olingan narsalar, avatar, effektlar, qahramon) ──
create table if not exists public.user_cosmetics (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade unique,
  purchased jsonb not null default '[]'::jsonb,
  active_effects jsonb not null default '["fx_sparkle"]'::jsonb,
  active_avatar text not null default 'avatar_default',
  hero_equip jsonb not null default '{}'::jsonb,
  updated_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create index if not exists uc_user_idx on public.user_cosmetics (user_id);

-- ── 12. USER MISSIONS (vazifalar progressi + XP) ───────────────────
create table if not exists public.user_missions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade unique,
  missions jsonb not null default '[]'::jsonb,
  xp integer not null default 0,
  updated_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create index if not exists um_user_idx on public.user_missions (user_id);

-- ── 13. USER REPLAYS (yozish replaylari) ──────────────────────────
create table if not exists public.user_replays (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  text text not null,
  events jsonb not null default '[]'::jsonb,
  wpm integer not null default 0,
  accuracy integer not null default 100,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create index if not exists ur_user_idx on public.user_replays (user_id);
create index if not exists ur_created_idx on public.user_replays (created_at desc);

-- ── 14. USER SETTINGS (kunlik login, streak, sozlamalar) ──────────
create table if not exists public.user_settings (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade unique,
  daily_state jsonb not null default '{}'::jsonb,
  favorites jsonb not null default '[]'::jsonb,
  used_langs jsonb not null default '[]'::jsonb,
  theme text not null default 'blue',
  lang text not null default 'en',
  duration integer not null default 15,
  font_size text not null default 'md',
  sound_enabled boolean not null default true,
  show_keyboard boolean not null default false,
  show_heatmap boolean not null default false,
  finger_guide boolean not null default true,
  bg_image text not null default '',
  bg_dim double precision not null default 0.55,
  updated_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create index if not exists us_user_idx on public.user_settings (user_id);

-- ═══════════════════════════════════════════════════════════════════════
-- RLS FOR NEW TABLES
-- ═══════════════════════════════════════════════════════════════════════

alter table public.user_cosmetics enable row level security;
alter table public.user_missions enable row level security;
alter table public.user_replays enable row level security;
alter table public.user_settings enable row level security;

-- user_cosmetics
create policy "Users can view own cosmetics" on public.user_cosmetics for select using (auth.uid() = user_id);
create policy "Users can upsert own cosmetics" on public.user_cosmetics for insert with check (auth.uid() = user_id);
create policy "Users can update own cosmetics" on public.user_cosmetics for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- user_missions
create policy "Users can view own missions" on public.user_missions for select using (auth.uid() = user_id);
create policy "Users can upsert own missions" on public.user_missions for insert with check (auth.uid() = user_id);
create policy "Users can update own missions" on public.user_missions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- user_replays
create policy "Users can view own replays" on public.user_replays for select using (auth.uid() = user_id);
create policy "Users can insert own replays" on public.user_replays for insert with check (auth.uid() = user_id);

-- user_settings
create policy "Users can view own settings" on public.user_settings for select using (auth.uid() = user_id);
create policy "Users can upsert own settings" on public.user_settings for insert with check (auth.uid() = user_id);
create policy "Users can update own settings" on public.user_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Owner'ni admin qilish — SQLEditor'da ishga tushiring:
-- update public.profiles set role = 'owner' where email = 'adminstype@gmail.com';
