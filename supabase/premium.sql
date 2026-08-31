-- ═══════════════════════════════════════════════════════════════════════
-- PREMIUM — Foydalanuvchilarga Premium (admin) huquqlarini berish
--
-- Telegram orqali to'lov qilgan foydalanuvchilarga muddatli admin huquqi.
-- Admin (owner) boshqa foydalanuvchini Premium qiladi — avtomatik role
-- o'zgaradi va muddati tugaganda qaytariladi.
--
-- Supabase Dashboard → SQL Editor → paste → Run
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Profiles ga premium ustunlarini qo'shish
do $$ begin
  alter table public.profiles add column if not exists premium_until timestamptz;
  alter table public.profiles add column if not exists premium_plan text;  -- '1month', '2month', '1year'
exception when duplicate_column then null;
end $$;

-- 2. Premium foydalanuvchilarni topish uchun indeks
create index if not exists profiles_premium_idx on public.profiles (premium_until) where premium_until is not null;

-- 3. Admin: foydalanuvchini Premium qilish (role = 'admin' + muddat belgilash)
--    Faqat owner/admin chaqira oladi (is_admin() tekshiriladi).
--    Agar foydalanuvchi allaqachon admin bo'lsa — faqat muddatni yangilaydi.
create or replace function public.admin_activate_premium(
  target_id uuid,
  plan text,
  months integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_until timestamptz;
begin
  if not public.is_admin() then
    raise exception 'Ruxsat yo''q — faqat admin/owner';
  end if;

  if plan not in ('1month', '2month', '1year') then
    raise exception 'Noto''g''ri reja: %', plan;
  end if;

  if months <= 0 or months > 24 then
    raise exception 'Noto''g''ri muddat: % oy', months;
  end if;

  -- Agar allaqachon premium bo'lsa — qo'shib boramiz, yangidan emas
  v_until := greatest(
    coalesce((select premium_until from public.profiles where id = target_id), now()),
    now()
  ) + (months || ' months')::interval;

  update public.profiles
  set
    role = 'admin',
    premium_until = v_until,
    premium_plan = plan,
    updated_at = now()
  where id = target_id;

  -- Log yozish
  insert into public.admin_logs (admin_name, action, target, details, created_at)
  values (
    (select coalesce(username, email, '?') from public.profiles where id = auth.uid()),
    'premium_activate',
    (select coalesce(username, email, '?') from public.profiles where id = target_id),
    json_build_object('plan', plan, 'months', months, 'until', v_until)::text,
    (extract(epoch from now()) * 1000)::bigint
  );
end;
$$;

revoke all on function public.admin_activate_premium(uuid, text, integer) from public;
grant execute on function public.admin_activate_premium(uuid, text, integer) to authenticated;

-- 4. Admin: Premiumni bekor qilish (role ni 'user' ga qaytarish)
create or replace function public.admin_revoke_premium(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Ruxsat yo''q — faqat admin/owner';
  end if;

  update public.profiles
  set
    role = 'user',
    premium_until = null,
    premium_plan = null,
    updated_at = now()
  where id = target_id;

  insert into public.admin_logs (admin_name, action, target, details, created_at)
  values (
    (select coalesce(username, email, '?') from public.profiles where id = auth.uid()),
    'premium_revoke',
    (select coalesce(username, email, '?') from public.profiles where id = target_id),
    'Premium bekor qilindi',
    (extract(epoch from now()) * 1000)::bigint
  );
end;
$$;

revoke all on function public.admin_revoke_premium(uuid) from public;
grant execute on function public.admin_revoke_premium(uuid) to authenticated;

-- 5. Premium muddati tugagan foydalanuvchilarni avtomatik 'user' ga qaytarish
--    (Bu funksiyani cron yoki har bir kirishda chaqirish mumkin)
create or replace function public.expire_premium_users()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.profiles
  set
    role = 'user',
    premium_until = null,
    premium_plan = null,
    updated_at = now()
  where role = 'admin'
    and premium_until is not null
    and premium_until < now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.expire_premium_users() from public;
grant execute on function public.expire_premium_users() to authenticated;
