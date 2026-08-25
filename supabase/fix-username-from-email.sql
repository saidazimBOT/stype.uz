-- ═══════════════════════════════════════════════════════════════════════
-- FIX: Google'dan kirganda username email prefix'dan yaratiladi
-- Supabase Dashboard → SQL Editor → New query → paste → Run
-- ═══════════════════════════════════════════════════════════════════════

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  email_prefix text;
begin
  -- Email prefix'dan username yaratish (masalan: sardor@gmail.com → sardor)
  email_prefix := lower(replace(split_part(new.email, '@', 1), '.', ''));
  email_prefix := regexp_replace(email_prefix, '[^a-z0-9]', '', 'g');
  if length(email_prefix) < 2 then
    email_prefix := 'user' || floor(random() * 9000 + 1000)::text;
  end if;

  insert into public.profiles (id, username, first_name, last_name, email, avatar_id, avatar)
  values (
    new.id,
    email_prefix,
    email_prefix,
    '',
    new.email,
    coalesce(new.raw_user_meta_data ->> 'avatar_url', 'avatar_default'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', 'avatar_default')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
