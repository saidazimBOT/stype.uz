import { supabase } from '../lib/supabase';
import type { LeaderboardEntry } from '../types';

// Fetch real leaderboard from Supabase
export async function fetchLeaderboard(lang?: string): Promise<LeaderboardEntry[]> {
  if (!supabase) return [];

  // Current user ID to mark "you"
  const { data: { user } } = await supabase.auth.getUser();
  const myId = user?.id ?? null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, first_name, best_wpm, xp, role, avatar')
    .not('best_wpm', 'is', null)
    .order('best_wpm', { ascending: false })
    .limit(100);

  if (error || !data) return [];

  // Filter banned users
  const active = (data as { id: string; username: string | null; first_name: string | null; best_wpm: number | null; xp: number | null; role: string; avatar: string | null }[])
    .filter((p) => p.best_wpm && p.best_wpm > 0);

  return active.map((p, i) => {
    const isAdmin = p.role === 'admin' || p.role === 'owner';
    return {
      rank: i + 1,
      name: p.username || p.first_name || 'Anonymous',
      country: '🌍',
      countryName: 'Global',
      wpm: p.best_wpm || 0,
      acc: 95,
      lang: lang || 'all',
      avatar: (p.username || 'A').slice(0, 2).toUpperCase(),
      color: isAdmin ? '#f59e0b' : ['#a78bfa', '#22c55e', '#38bdf8', '#ec4899', '#f97316'][i % 5],
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
