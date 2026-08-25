import { supabase } from '../lib/supabase';
import type { LeaderboardEntry } from '../types';

// Fetch real leaderboard from Supabase
export async function fetchLeaderboard(lang?: string): Promise<LeaderboardEntry[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('username, best_wpm, xp, role')
    .eq('status', 'active')
    .eq('banned', false)
    .not('best_wpm', 'is', null)
    .order('best_wpm', { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return data.map((p: { username: string | null; best_wpm: number | null; xp: number | null; role: string }, i: number) => ({
    rank: i + 1,
    name: p.username || 'Anonymous',
    country: '🌍',
    countryName: 'Global',
    wpm: p.best_wpm || 0,
    acc: 95,
    lang: lang || 'all',
    avatar: (p.username || 'A').slice(0, 2).toUpperCase(),
    color: ['#a78bfa', '#22c55e', '#f59e0b', '#38bdf8', '#ec4899', '#f97316'][i % 6],
  }));
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
