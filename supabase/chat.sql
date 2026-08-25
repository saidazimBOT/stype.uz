-- ═══════════════════════════════════════════════════════════════════════
-- ONLAYN CHAT — chat_messages jadvali, RLS va Realtime
--
-- Supabase Dashboard -> SQL Editor da bir marta ishga tushiriladi.
-- Qayta ishga tushirish xavfsiz (idempotent).
--
-- HOLAT: `chat_messages` jadvali va o'qish/yozish siyosatlari bazada
-- ALLAQACHON mavjud, Realtime ham ulangan (tekshirilgan). Bu fayl qo'shimcha
-- qiladi:
--   1. `chat_body_len` cheklovi — bo'sh va 500 belgidan uzun xabar bloklanadi;
--   2. indekslar;
--   3. UPDATE siyosatlari — xabarni o'chirish (soft delete) shusiz ISHLAMAYDI.
--
-- DIQQAT: Postgres'da bir nechta permissive siyosat OR bilan birlashadi.
-- Ya'ni bu yerdagi INSERT siyosati mavjud (boshqa nomdagi) siyosatni
-- QATTIQLASHTIRMAYDI. Bloklangan foydalanuvchini chatdan to'sish kerak bo'lsa,
-- Dashboard -> Authentication -> Policies da eski INSERT siyosatini ko'rib
-- chiqing va keraksizini o'chiring.
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists public.chat_messages (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  username text not null default 'player',
  body text not null,
  deleted boolean not null default false,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

-- Xabar uzunligi chegarasi (bo'sh xabar va spam bloklanadi)
alter table public.chat_messages drop constraint if exists chat_body_len;
alter table public.chat_messages
  add constraint chat_body_len
  check (char_length(btrim(body)) between 1 and 500);

create index if not exists chat_created_idx on public.chat_messages (created_at desc);
create index if not exists chat_user_idx on public.chat_messages (user_id);

alter table public.chat_messages enable row level security;

-- ── O'QISH: hamma ko'radi (mehmon ham) ───────────────────────────────
drop policy if exists "Anyone can read chat" on public.chat_messages;
create policy "Anyone can read chat"
  on public.chat_messages for select using (true);

-- ── YOZISH: faqat login qilgan, bloklanmagan foydalanuvchi o'z nomidan ──
drop policy if exists "Active users can send chat" on public.chat_messages;
create policy "Active users can send chat"
  on public.chat_messages for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.status = 'active' and p.banned = false
    )
  );

-- ── O'CHIRISH (soft delete): o'z xabari yoki admin ───────────────────
drop policy if exists "Users can soft delete own chat" on public.chat_messages;
create policy "Users can soft delete own chat"
  on public.chat_messages for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Admins can moderate chat" on public.chat_messages;
create policy "Admins can moderate chat"
  on public.chat_messages for update
  using (public.is_admin()) with check (public.is_admin());

-- ── REALTIME: jadvalni publication'ga qo'shamiz ──────────────────────
-- (allaqachon qo'shilgan bo'lsa xato bermaydi)
do $$
begin
  alter publication supabase_realtime add table public.chat_messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;
