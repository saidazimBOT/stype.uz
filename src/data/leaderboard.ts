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
 * Global leaderboard — HAMMA foydalanuvchi (oddiy, admin, owner) ko'radi.
 *
 * Asosiy manba `typing_results`: har bir foydalanuvchining eng yaxshi natijasi
 * olinadi, shuning uchun WPM bilan birga haqiqiy aniqlik (acc) va til ham
 * ko'rsatiladi. Agar natijalar jadvali hali bo'sh bo'lsa (eski akkauntlar),
 * `profiles.best_wpm` zaxira sifatida ishlatiladi.
 *
 * RLS: `typing_results` va `profiles` uchun "hamma o'qiy oladi" (select) siyosati
 * bor — supabase/schema.sql ga qarang.
 */
export async function fetchLeaderboard(lang?: string): Promise<LeaderboardEntry[]> {
  if (!supabase) return [];

  // "you" belgisi uchun joriy foydalanuvchi
  const { data: { user } } = await supabase.auth.getUser();
  const myId = user?.id ?? null;

  // ── 1. Profillar (ism, rol, holat) ──
  const { data: profileData } = await supabase
    .from('profiles')
    .select('id, username, first_name, best_wpm, role, status, banned')
    .limit(1000);
  const profiles = (profileData ?? []) as ProfileRow[];
  const profById = new Map(profiles.map((p) => [p.id, p]));
  const isBlocked = (p?: ProfileRow) => !!p && (p.status === 'blocked' || p.banned === true);

  // ── 2. Natijalar — eng yuqori WPM birinchi ──
  let query = supabase
    .from('typing_results')
    .select('user_id, username, wpm, accuracy, lang')
    .order('wpm', { ascending: false })
    .limit(1000);
  if (lang) query = query.eq('lang', lang);
  const { data: resultData } = await query;

  // Har bir foydalanuvchidan faqat eng yaxshi natija (ro'yxat allaqachon saralangan)
  const best = new Map<string, ResultRow>();
  for (const r of (resultData ?? []) as ResultRow[]) {
    if (!r.user_id || !r.wpm || r.wpm <= 0) continue;
    if (isBlocked(profById.get(r.user_id))) continue;
    if (!best.has(r.user_id)) best.set(r.user_id, r);
  }

  if (best.size > 0) {
    return [...best.values()]
      .sort((a, b) => (b.wpm ?? 0) - (a.wpm ?? 0))
      .map((r, i) => {
        const p = profById.get(r.user_id);
        const role = p?.role ?? 'user';
        const name = p?.username || p?.first_name || r.username || 'Anonymous';
        return {
          rank: i + 1,
          name,
          country: '🌍',
          countryName: 'Global',
          wpm: r.wpm ?? 0,
          acc: r.accuracy ?? 0,
          lang: r.lang || 'en',
          avatar: name.slice(0, 2).toUpperCase(),
          color: entryColor(role, i),
          isMe: r.user_id === myId,
          role,
          id: r.user_id,
        };
      });
  }

  // ── 3. Zaxira: natijalar jadvali bo'sh bo'lsa — profildagi best_wpm ──
  // (til bo'yicha filtr bunda qo'llanmaydi — profilda til saqlanmaydi)
  if (lang) return [];
  return profiles
    .filter((p) => !isBlocked(p) && (p.best_wpm ?? 0) > 0)
    .sort((a, b) => (b.best_wpm ?? 0) - (a.best_wpm ?? 0))
    .map((p, i) => {
      const name = p.username || p.first_name || 'Anonymous';
      return {
        rank: i + 1,
        name,
        country: '🌍',
        countryName: 'Global',
        wpm: p.best_wpm ?? 0,
        acc: 0,
        lang: 'en',
        avatar: name.slice(0, 2).toUpperCase(),
        color: entryColor(p.role, i),
        isMe: p.id === myId,
        role: p.role,
        id: p.id,
      };
    });
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
