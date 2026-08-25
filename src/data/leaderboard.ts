import { supabase } from '../lib/supabase';
import type { LeaderboardEntry } from '../types';

interface ResultRow {
  user_id: string;
  username: string | null;
  wpm: number | null;
  accuracy: number | null;
  lang: string | null;
}

interface ProfileRow {
  id: string;
  username: string | null;
  first_name: string | null;
  best_wpm: number | null;
  role: string;
  status: string | null;
  banned: boolean | null;
}

const PALETTE = ['#a78bfa', '#22c55e', '#38bdf8', '#ec4899', '#f97316'];

function entryColor(role: string, index: number): string {
  return role === 'admin' || role === 'owner' ? '#f59e0b' : PALETTE[index % PALETTE.length];
}

/**
 * Global leaderboard — HAMMA foydalanuvchi (oddiy, admin, owner) ko'radi va
 * ro'yxatda HAR BIR ro'yxatdan o'tgan foydalanuvchi turadi.
 *
 * Hali test topshirmaganlar ham chiqadi — 0 WPM bilan, ro'yxat oxirida.
 * Shunday qilib yangi user ro'yxatdan o'tishi bilan leaderboard'da paydo
 * bo'ladi va birinchi testidan keyin o'z o'rniga ko'tariladi.
 *
 * WPM manbai `typing_results` — har bir foydalanuvchining eng yaxshi natijasi,
 * shuning uchun aniqlik (acc) va til ham haqiqiy qiymat. Til filtri tanlanganda
 * faqat o'sha tildagi natijalar hisobga olinadi (o'sha tilda yozmaganlar 0 bilan
 * qoladi).
 *
 * RLS: `profiles` va `typing_results` uchun "hamma o'qiy oladi" siyosati bor —
 * supabase/schema.sql ga qarang.
 */
export async function fetchLeaderboard(lang?: string): Promise<LeaderboardEntry[]> {
  if (!supabase) return [];

  // "you" belgisi uchun joriy foydalanuvchi
  const { data: { user } } = await supabase.auth.getUser();
  const myId = user?.id ?? null;

  // ── 1. Barcha profillar ──
  const { data: profileData } = await supabase
    .from('profiles')
    .select('id, username, first_name, best_wpm, role, status, banned')
    .limit(1000);
  const profiles = ((profileData ?? []) as ProfileRow[])
    .filter((p) => p.status !== 'blocked' && p.banned !== true);

  // ── 2. Natijalar — eng yuqori WPM birinchi ──
  let query = supabase
    .from('typing_results')
    .select('user_id, username, wpm, accuracy, lang')
    .order('wpm', { ascending: false })
    .limit(2000);
  if (lang) query = query.eq('lang', lang);
  const { data: resultData } = await query;

  // Har bir foydalanuvchidan faqat eng yaxshi natija (ro'yxat allaqachon saralangan)
  const best = new Map<string, ResultRow>();
  for (const r of (resultData ?? []) as ResultRow[]) {
    if (!r.user_id || !r.wpm || r.wpm <= 0) continue;
    if (!best.has(r.user_id)) best.set(r.user_id, r);
  }

  return profiles
    .map((p) => {
      const row = best.get(p.id);
      // Filtrsiz ko'rinishda profildagi best_wpm ham hisobga olinadi — eski
      // akkauntlarda natija qatori bo'lmasligi mumkin. Til filtri bilan esa
      // faqat o'sha tildagi natija hisoblanadi (best_wpm tilga bog'liq emas).
      const wpm = lang ? (row?.wpm ?? 0) : Math.max(row?.wpm ?? 0, p.best_wpm ?? 0);
      const name = p.username || p.first_name || row?.username || 'Anonymous';
      return {
        name,
        wpm,
        acc: row?.accuracy ?? 0,
        lang: row?.lang || '',
        hasResult: wpm > 0,
        country: '🌍',
        countryName: 'Global',
        avatar: name.slice(0, 2).toUpperCase(),
        role: p.role,
        id: p.id,
        isMe: p.id === myId,
      };
    })
    // Yuqori WPM tepada; teng bo'lsa ism bo'yicha — tartib har yuklashda bir xil
    .sort((a, b) => b.wpm - a.wpm || a.name.localeCompare(b.name))
    .map((e, i) => ({ ...e, rank: i + 1, color: entryColor(e.role, i) }));
}

/**
 * Leaderboard'da mavjud tillar ro'yxati (chip'lar uchun).
 *
 * Ataylab tanlangan filtrdan MUSTAQIL: avval chip'lar ko'rinib turgan
 * natijalardan yasalardi, shuning uchun bitta tilni tanlash bilanoq qolgan
 * chip'lar yo'q bo'lib, boshqa tilga to'g'ridan-to'g'ri o'tib bo'lmasdi.
 * Ro'yxat bo'sh bo'lsa esa faqat "All" qolib ketardi.
 */
export async function fetchLeaderboardLangs(): Promise<string[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('typing_results')
    .select('lang')
    .not('lang', 'is', null)
    .limit(2000);
  const langs = new Set<string>();
  for (const row of (data ?? []) as { lang: string | null }[]) {
    if (row.lang) langs.add(row.lang);
  }
  return [...langs].sort();
}

// Country ranking from real data
export async function fetchCountryRanking(): Promise<{ country: string; flag: string; avgWpm: number; players: number }[]> {
  if (!supabase) return [];

  const { data } = await supabase
    .from('profiles')
    .select('best_wpm')
    .not('best_wpm', 'is', null)
    .eq('status', 'active');

  if (!data || data.length === 0) return [];
  const avgWpm = data.reduce((s: number, r: { best_wpm: number | null }) => s + (r.best_wpm || 0), 0) / data.length;
  return [{ country: 'Global', flag: '🌍', avgWpm: Math.round(avgWpm), players: data.length }];
}

export const LANG_FILTERS: string[] = ['all', 'en', 'ru', 'uz', 'de', 'es', 'fr'];
