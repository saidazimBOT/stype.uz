-- ═══════════════════════════════════════════════════════════════════════
-- FIX: Leaderboard uchun profiles public read + auth trigger
-- Supabase Dashboard → SQL Editor → New query → paste → Run
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Leaderboard uchun: hamma barcha profillarni o'qiy oladi
drop policy if exists "Anyone can read profiles for leaderboard" on public.profiles;
create policy "Anyone can read profiles for leaderboard"
  on public.profiles for select using (true);

-- 2. Google OAuth kelganda profil avtomatik yaratilishi uchun trigger
-- (handle_new_user allaqachon mavjud, lekin Google'dan kelganda metadata boshqacha)
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
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'username',
      split_part(new.email, '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data ->> 'first_name',
      split_part(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), ' ', 1),
      ''
    ),
    coalesce(
      new.raw_user_meta_data ->> 'last_name',
      trim(leading split_part(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), ' ', 1) from coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')),
      ''
    ),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'avatar_url', 'avatar_default'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', 'avatar_default')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 3. Google kirgan foydalanuvchining email'ini ham tasdiqlash (agar kerak bo'lsa)
-- UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL AND email LIKE '%@%';
