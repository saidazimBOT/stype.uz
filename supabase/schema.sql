-- ═══════════════════════════════════════════════════════════════════════
-- STypeUz — Supabase schema (SQL Editor'da bir marta ishga tushiring)
--
-- Bu skript:
--   1) `profiles` jadvalini yaratadi (Supabase Auth bilan bog'langan)
--   2) Yangi foydalanuvchi ro'yxatdan o'tganda profil qatorini avtomatik yaratadi
--   3) Row Level Security (RLS) ni yoqadi — ma'lumotlar himoyalanadi
--   4) Egasi (owner) profilini admin qilish uchun ko'rsatma beradi
--
-- XAVFSIZLIK: Frontendda FAQAT anon kalit ishlatiladi. Barcha himoya RLS
-- qoidalarida — oddiy foydalanuvchi faqat O'Z qatorini, admin esa hammasini ko'radi.
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. PROFILLAR JADVALI ───────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  first_name text,
  last_name text,
  email text,
  avatar_id text not null default 'avatar_default',
  photo text,
  role text not null default 'user' check (role in ('user', 'admin', 'owner')),
  status text not null default 'active' check (status in ('active', 'blocked')),
  created_at timestamptz not null default now(),   -- ro'yxatdan o'tgan sana
  last_login timestamptz,                           -- oxirgi kirish
  updated_at timestamptz not null default now()
);

create index if not exists profiles_created_at_idx on public.profiles (created_at desc);
create index if not exists profiles_email_idx on public.profiles (email);

-- ── 2. YANGI FOYDALANUVCHI → PROFIL (avtomatik) ────────────────────────
-- Sayt orqali ro'yxatdan o'tgan har bir odam uchun avtomatik qator yaratiladi —
-- admin panelda darhol ko'rinadi.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, first_name, last_name, email, avatar_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'firstName',
    new.raw_user_meta_data ->> 'lastName',
    new.email,
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

-- ── 3. ROW LEVEL SECURITY ──────────────────────────────────────────────
alter table public.profiles enable row level security;

-- Adminlikni tekshirish uchun helper (security definer — RLS cheklovlarini aylanib o'tadi,
-- lekin faqat rolni o'qish uchun, hech qanday o'zgartirish qila olmaydi)
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

-- Har bir foydalanuvchi faqat O'Z profilini ko'ra oladi
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Adminlar barcha profillarni ko'ra oladi (admin panel "DB Users" bo'limi)
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

-- Foydalanuvchi o'z qatorini qo'shishi mumkin (agar trigger sabab bo'lmasa),
-- lekin o'ziga admin/owner roli yoki blocked holat bera olmaydi
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (
    auth.uid() = id
    and role = 'user'
    and status = 'active'
  );

-- Foydalanuvchi o'z qatorining XAVFSIZ maydonlarini yangilay oladi
-- (username, ism, familiya, avatar, last_login...). Roli va statusi o'zgarmaydi.
create or replace function public.profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

drop policy if exists "Users can update own safe fields" on public.profiles;
create policy "Users can update own safe fields"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = public.profile_role()   -- rolni oshirish mumkin emas
    and status = 'active'              -- blocked foydalanuvchi o'zini tiklay olmaydi
  );

-- ── 4. EGANI (OWNER) NI ADMIN QILISH ──────────────────────────────────
-- Supabase Auth'da o'z hisobingizni ochgandan so'ng quyidagi so'rovni ishga
-- tushiring (email'ni o'zingiznikiga almashtiring):
--
--   update public.profiles
--   set role = 'owner'
--   where email = 'adminstype@gmail.com';
--
-- Shundan keyin shu email bilan sayt orqali kirganingizda admin panelning
-- "DB Users" bo'limida barcha ro'yxatdan o'tganlar ko'rinadi.
