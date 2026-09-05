/**
 * STypeUz — Tournament Database Service Layer
 *
 * Turnir tizimi: turnirlar yaratish, qo'shilish, natijalarni saqlash.
 * Barcha so'rovlar anon kalit + RLS bilan himoyalangan.
 */
import { supabase, isSupabaseConfigured } from "./supabase";
import { getCurrentUserId } from "./db";
import { logAdminAction } from "./db";
import type { Tournament, TournamentParticipant, TournamentMode, TournamentStatus } from "../types";

// ═══════════════════════════════════════════════════════════════════════
// TURNIRLAR RO'YXATI
// ═══════════════════════════════════════════════════════════════════════

/** Barcha turnirlarni olish (holat bo'yicha filterlash mumkin) */
export async function listTournaments(status?: TournamentStatus): Promise<Tournament[]> {
  if (!isSupabaseConfigured()) return [];
  let query = supabase!.from("tournaments").select("*").order("start_time", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data } = await query;
  if (!data) return [];

  const uid = await getCurrentUserId();
  return data.map((row) => ({
    id: String(row.id),
    title: row.title,
    description: row.description || "",
    mode: (row.mode || "sprint") as TournamentMode,
    status: (row.status || "upcoming") as TournamentStatus,
    lang: row.lang || "en",
    duration: row.duration || 15,
    startTime: row.start_time,
    endTime: row.end_time,
    participantCount: row.participant_count || 0,
    prizeCoins: row.prize_coins || 0,
    createdBy: row.created_by || "",
    isJoined: row.participant_user_ids?.includes(uid) || false,
    rewardsDistributed: row.rewards_distributed || false,
  }));
}

/** Faqat bir turnirni olish */
export async function getTournament(id: string): Promise<Tournament | null> {
  if (!isSupabaseConfigured()) return null;
  const { data } = await supabase!.from("tournaments").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  const uid = await getCurrentUserId();
  return {
    id: String(data.id),
    title: data.title,
    description: data.description || "",
    mode: (data.mode || "sprint") as TournamentMode,
    status: (data.status || "upcoming") as TournamentStatus,
    lang: data.lang || "en",
    duration: data.duration || 15,
    startTime: data.start_time,
    endTime: data.end_time,
    participantCount: data.participant_count || 0,
    prizeCoins: data.prize_coins || 0,
    createdBy: data.created_by || "",
    isJoined: data.participant_user_ids?.includes(uid) || false,
    rewardsDistributed: data.rewards_distributed || false,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// TURNIR YARATISH (Admin)
// ═══════════════════════════════════════════════════════════════════════

export async function createTournament(t: {
  title: string;
  description: string;
  mode: TournamentMode;
  lang: string;
  duration: number;
  startTime: number;
  endTime: number;
  prizeCoins: number;
}): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase!.from("tournaments").insert({
    title: t.title,
    description: t.description,
    mode: t.mode,
    status: "upcoming",
    lang: t.lang,
    duration: t.duration,
    start_time: t.startTime,
    end_time: t.endTime,
    participant_count: 0,
    prize_coins: t.prizeCoins,
    participant_user_ids: [],
    created_by: t.title, // Will be replaced with admin name
    created_at: Date.now(),
    updated_at: Date.now(),
  }).select("id").single();
  if (error) throw error;
  await logAdminAction("tournament_create", t.title, `${t.mode} · ${t.lang}`);
  return String(data.id);
}

// ═══════════════════════════════════════════════════════════════════════
// TURNIRNI O'CHIRISH (Admin)
// ═══════════════════════════════════════════════════════════════════════

export async function deleteTournament(id: string) {
  if (!isSupabaseConfigured()) return;
  // Avval turnir ishtirokchilarini ham o'chiramiz
  await supabase!.from("tournament_participants").delete().eq("tournament_id", id);
  await supabase!.from("tournaments").delete().eq("id", id);
  await logAdminAction("tournament_delete", id, "");
}

// ═══════════════════════════════════════════════════════════════════════
// TURNIRGA QO'SHILISH
// ═══════════════════════════════════════════════════════════════════════

export async function joinTournament(tournamentId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const uid = await getCurrentUserId();
  if (!uid) return false;

  // Turnir hali active yoki upcoming bo'lishi kerak
  const { data: t } = await supabase!.from("tournaments").select("*").eq("id", tournamentId).maybeSingle();
  if (!t || (t.status !== "upcoming" && t.status !== "active")) return false;

  // Allaqachon qo'shilganmi?
  const participantUserIds = (t.participant_user_ids as string[]) || [];
  if (participantUserIds.includes(uid)) return true;

  // Yangi participant qo'shamiz
  const { error } = await supabase!.from("tournament_participants").insert({
    tournament_id: tournamentId,
    user_id: uid,
    username: "",
    wpm: 0,
    accuracy: 0,
    errors: 0,
    correct: 0,
    total: 0,
    time: 0,
    joined_at: Date.now(),
    color: "",
    avatar: "",
  });
  if (error) return false;

  // Turnir participant sonini va user ro'yxatini yangilaymiz
  await supabase!.from("tournaments").update({
    participant_count: (t.participant_count || 0) + 1,
    participant_user_ids: [...participantUserIds, uid],
    updated_at: Date.now(),
  }).eq("id", tournamentId);

  return true;
}

// ═══════════════════════════════════════════════════════════════════════
// NATIJANI SAQLASH (Turnir tugaganda)
// ═══════════════════════════════════════════════════════════════════════

export async function submitTournamentResult(
  tournamentId: string,
  result: { wpm: number; accuracy: number; errors: number; correct: number; total: number; time: number }
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const uid = await getCurrentUserId();
  if (!uid) return false;

  // Foydalanuvchi nomini olamiz
  const { data: profile } = await supabase!.from("profiles").select("username, first_name").eq("id", uid).maybeSingle();
  const username = profile?.username || profile?.first_name || "Player";

  // Avval mavjud natijani tekshiramiz
  const { data: existing } = await supabase!.from("tournament_participants")
    .select("id, wpm")
    .eq("tournament_id", tournamentId)
    .eq("user_id", uid)
    .maybeSingle();

  if (existing) {
    // Faqat yaxshiroq natija bo'lsa yangilaymiz
    if (result.wpm > (existing.wpm || 0)) {
      await supabase!.from("tournament_participants").update({
        wpm: result.wpm,
        accuracy: result.accuracy,
        errors: result.errors,
        correct: result.correct,
        total: result.total,
        time: result.time,
        username,
      }).eq("id", existing.id);
    }
  } else {
    await supabase!.from("tournament_participants").insert({
      tournament_id: tournamentId,
      user_id: uid,
      username,
      wpm: result.wpm,
      accuracy: result.accuracy,
      errors: result.errors,
      correct: result.correct,
      total: result.total,
      time: result.time,
      joined_at: Date.now(),
    });
  }
  return true;
}

// ═══════════════════════════════════════════════════════════════════════
// TURNIR NATIJALARI (Leaderboard)
// ═══════════════════════════════════════════════════════════════════════

export async function getTournamentResults(tournamentId: string): Promise<TournamentParticipant[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await supabase!.from("tournament_participants")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("wpm", { ascending: false });
  if (!data) return [];
  return data.map((row, i) => ({
    id: String(row.id),
    tournamentId: row.tournament_id,
    userId: row.user_id,
    username: row.username || "Player",
    wpm: row.wpm || 0,
    accuracy: row.accuracy || 0,
    errors: row.errors || 0,
    correct: row.correct || 0,
    total: row.total || 0,
    time: row.time || 0,
    joinedAt: row.joined_at || Date.now(),
    color: ["#a78bfa", "#22c55e", "#f59e0b", "#38bdf8", "#ec4899", "#f97316", "#06b6d4", "#8b5cf6"][i % 8],
    avatar: (row.username || "P").slice(0, 2).toUpperCase(),
  }));
}

// ═══════════════════════════════════════════════════════════════════════
// AVTOMATIK TURNIRLAR (Har kuni bir nechta turnir yaratish)
// ═══════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════
// Mukofot tarqatish (Turnir tugaganda g'oliblarga coin)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Turnir tugaganda g'oliblarga coin mukofotini tarqatish.
 * 1-o'rin: 100%, 2-o'rin: 60%, 3-o'rin: 30% (prizeCoins dan).
 * Faqat bir marta ishlaydi — `rewards_distributed` flagi bilan tekshiriladi.
 */
export async function distributeTournamentRewards(
  tournamentId: string
): Promise<{ distributed: boolean; winners: { username: string; coins: number }[] }> {
  if (!isSupabaseConfigured()) return { distributed: false, winners: [] };

  // Turnir ma'lumotlarini olamiz
  const { data: t } = await supabase!.from("tournaments")
    .select("*")
    .eq("id", tournamentId)
    .maybeSingle();
  if (!t) return { distributed: false, winners: [] };

  // Allaqa tarqatilgan bo'lsa — qaytamiz
  if (t.rewards_distributed) return { distributed: false, winners: [] };

  // Faqat finished turnirlarga mukofot beramiz
  const now = Date.now();
  if (t.status !== "finished" && now < (t.end_time || 0)) return { distributed: false, winners: [] };

  const prizeCoins = t.prize_coins || 0;
  if (prizeCoins <= 0) {
    await supabase!.from("tournaments").update({ rewards_distributed: true, updated_at: now }).eq("id", tournamentId);
    return { distributed: true, winners: [] };
  }

  // Natijalarni olish (eng yuqori WPM bo'yicha)
  const { data: results } = await supabase!.from("tournament_participants")
    .select("user_id, username, wpm")
    .eq("tournament_id", tournamentId)
    .order("wpm", { ascending: false })
    .limit(10);
  if (!results || results.length === 0) {
    await supabase!.from("tournaments").update({ rewards_distributed: true, updated_at: now }).eq("id", tournamentId);
    return { distributed: true, winners: [] };
  }

  // Mukofot foizlari: 1-o'rin 100%, 2-o'rin 60%, 3-o'rin 30%
  const prizePercents = [1.0, 0.6, 0.3];
  const winners: { username: string; coins: number }[] = [];

  for (let i = 0; i < Math.min(results.length, 3); i++) {
    const r = results[i];
    if (!r.user_id || (r.wpm || 0) <= 0) continue;

    const coins = Math.round(prizeCoins * prizePercents[i]);
    if (coins <= 0) continue;

    // Foydalanuvchi coinsini yangilaymiz
    const { data: profile } = await supabase!.from("profiles")
      .select("coins")
      .eq("id", r.user_id)
      .maybeSingle();
    const currentCoins = profile?.coins || 0;

    await supabase!.from("profiles").update({
      coins: currentCoins + coins,
      updated_at: new Date().toISOString(),
    }).eq("id", r.user_id);

    // Tranzaksiya yozamiz
    await supabase!.from("coin_transactions").insert({
      user_id: r.user_id,
      username: r.username || "Player",
      kind: "coins",
      amount: coins,
      balance_after: currentCoins + coins,
      reason: `🏆 Turnir mukofoti: ${t.title} (${i + 1}-o'rin, ${r.wpm} WPM)`,
      admin_name: "Tournament Bot",
      created_at: now,
    });

    winners.push({ username: r.username || "Player", coins });
  }

  // Flag qo'yamiz — bir marta ishlashi uchun
  await supabase!.from("tournaments").update({
    rewards_distributed: true,
    updated_at: now,
  }).eq("id", tournamentId);

  await logAdminAction("tournament_rewards", t.title, `${winners.length} ga ${winners.map((w) => `${w.username}+${w.coins}`).join(", ")}`);

  return { distributed: true, winners };
}

// ═══════════════════════════════════════════════════════════════════════
// AVTOMATIK TURNIRLAR (Har kuni bir nechta turnir yaratish)
// ═══════════════════════════════════════════════════════════════════════

/** Avtomatik turnirlar — hozirgi kun uchun yaratilgan turnirlar */
export async function ensureDailyTournaments(): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayMs = todayStart.getTime();

  // Bugun yaratilgan turnirlar bormi?
  const { data: existing } = await supabase!.from("tournaments")
    .select("id")
    .gte("created_at", todayMs);

  if (existing && existing.length > 0) return; // allaqachon yaratilgan

  // Har kuni 3 ta turnir yaratamiz
  const nowDate = new Date();
  const dayName = nowDate.toLocaleDateString("en", { weekday: "long" });

  const tournamentTemplates = [
    {
      title: `⚡ Sprint ${dayName}`,
      description: "Tezlik turniri — 15 soniyada eng yuqori WPM!",
      mode: "sprint" as TournamentMode,
      duration: 15,
      lang: "en",
      prizeCoins: 50,
      hourOffset: 10, // 10:00
    },
    {
      title: `🎯 Precision ${dayName}`,
      description: "Aniqlik turniri — eng yuqori aniqlik bilan yozing!",
      mode: "accuracy" as TournamentMode,
      duration: 30,
      lang: "en",
      prizeCoins: 75,
      hourOffset: 14, // 14:00
    },
    {
      title: `🏃 Marathon ${dayName}`,
      description: "Marafon — 60 soniyada eng ko'p so'z yozing!",
      mode: "marathon" as TournamentMode,
      duration: 60,
      lang: "en",
      prizeCoins: 100,
      hourOffset: 18, // 18:00
    },
  ];

  for (const tmpl of tournamentTemplates) {
    const startTime = todayMs + tmpl.hourOffset * 60 * 60 * 1000;
    const endTime = startTime + (tmpl.duration || 60) * 1000 + 5 * 60 * 1000; // +5 daqiqa buffer
    const isStarted = now >= startTime;
    const isFinished = now >= endTime;

    let status: TournamentStatus = "upcoming";
    if (isFinished) status = "finished";
    else if (isStarted) status = "active";

    await supabase!.from("tournaments").insert({
      title: tmpl.title,
      description: tmpl.description,
      mode: tmpl.mode,
      status,
      lang: tmpl.lang,
      duration: tmpl.duration,
      start_time: startTime,
      end_time: endTime,
      participant_count: 0,
      prize_coins: tmpl.prizeCoins,
      participant_user_ids: [],
      created_by: "System",
      created_at: Date.now(),
      updated_at: Date.now(),
    });
  }
}
