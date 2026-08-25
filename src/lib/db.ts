/**
 * STypeUz — Supabase Database Service Layer
 *
 * Replaces ALL Convex API calls (queries + mutations) with Supabase client calls.
 * Every function uses the anon client + RLS — no service_role key on frontend.
 */
import { supabase, isSupabaseConfigured } from "./supabase";

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

export interface ProfileRow {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar: string;
  avatar_id: string;
  coins: number;
  xp: number;
  wins: number;
  losses: number;
  draws: number;
  races: number;
  best_wpm: number | null;
  role: "user" | "admin" | "owner";
  status: "active" | "blocked";
  banned: boolean;
  banned_reason: string | null;
  last_seen: number;
  created_at: string;
  last_login: string | null;
  updated_at: string;
}

export interface TypingResultRow {
  id: number;
  user_id: string;
  username: string;
  wpm: number;
  accuracy: number;
  errors: number;
  correct: number;
  total: number;
  time: number;
  lang: string;
  duration: number;
  created_at: number;
}

export interface AchievementRow {
  id: number;
  key: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  req_type: string;
  req_goal: number;
  xp_reward: number;
  coin_reward: number;
  enabled: boolean;
  sort_order: number;
}

export interface UserAchievementRow {
  id: number;
  user_id: string;
  achievement_key: string;
  unlocked_at: number;
}

export interface CoinTransactionRow {
  id: number;
  user_id: string;
  username: string;
  kind: "coins" | "xp";
  amount: number;
  balance_after: number;
  reason: string;
  admin_name: string;
  created_at: number;
}

export interface ReportRow {
  id: number;
  reporter_id: string;
  reporter_name: string;
  target_id: string;
  target_name: string;
  reason: string;
  details: string | null;
  status: "pending" | "reviewed" | "resolved";
  admin_note: string | null;
  admin_name: string | null;
  created_at: number;
  updated_at: number;
}

export interface AnnouncementRow {
  id: number;
  title: string;
  body: string;
  enabled: boolean;
  scheduled_for: number | null;
  expires_at: number | null;
  created_by_name: string;
  created_at: number;
  updated_at: number;
}

export interface AdminLogRow {
  id: number;
  admin_name: string;
  action: string;
  target: string | null;
  details: string | null;
  created_at: number;
}

export interface TypingTextRow {
  id: number;
  text: string;
  lang: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  enabled: boolean;
  created_by_name: string;
  created_at: number;
}

export interface SiteSettingsRow {
  id: number;
  site_name: string;
  logo: string;
  maintenance_mode: boolean;
  maintenance_message: string;
  registration_open: boolean;
  announcements_enabled: boolean;
  updated_at: number;
  updated_by_name: string;
}

// ═══════════════════════════════════════════════════════════════════════
// AUTH HELPERS
// ═══════════════════════════════════════════════════════════════════════

/** Joriy foydalanuvchi Supabase Auth session */
export async function getCurrentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const { data } = await supabase!.auth.getSession();
  return data.session?.user?.id ?? null;
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured()) return null;
  const { data } = await supabase!.auth.getUser();
  return data.user ?? null;
}

// ═══════════════════════════════════════════════════════════════════════
// PROFILES
// ═══════════════════════════════════════════════════════════════════════

/** Joriy foydalanuvchining profil qatori */
export async function getMyProfile(): Promise<ProfileRow | null> {
  if (!isSupabaseConfigured()) return null;
  const uid = await getCurrentUserId();
  if (!uid) return null;
  const { data } = await supabase!.from("profiles").select("*").eq("id", uid).maybeSingle();
  return (data as ProfileRow) ?? null;
}

/** ID bo'yicha profil olish (admin uchun) */
export async function getProfileById(id: string): Promise<ProfileRow | null> {
  if (!isSupabaseConfigured()) return null;
  const { data } = await supabase!.from("profiles").select("*").eq("id", id).maybeSingle();
  return (data as ProfileRow) ?? null;
}

/** Barcha profillar (faqat admin) */
export async function listAllProfiles(search?: string): Promise<ProfileRow[]> {
  if (!isSupabaseConfigured()) return [];
  let query = supabase!.from("profiles").select("*").order("created_at", { ascending: false }).limit(500);
  if (search?.trim()) {
    const s = search.trim();
    query = query.or(`username.ilike.%${s}%,first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%`);
  }
  const { data } = await query;
  return (data ?? []) as ProfileRow[];
}

/** Profilni yangilash */
export async function updateProfile(updates: Record<string, unknown>) {
  const uid = await getCurrentUserId();
  if (!uid) return;
  await supabase!.from("profiles").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", uid);
}

/** Heartbeat — last_seen yangilash */
export async function heartbeat() {
  const uid = await getCurrentUserId();
  if (!uid) return;
  const now = Date.now();
  await supabase!.from("profiles").update({ last_seen: now, updated_at: new Date().toISOString() }).eq("id", uid);
}

// ═══════════════════════════════════════════════════════════════════════
// TYPING RESULTS
// ═══════════════════════════════════════════════════════════════════════

/** Test natijasini yozish + yutuqlarni tekshirish */
export async function recordTypingResult(result: {
  wpm: number;
  accuracy: number;
  errors: number;
  correct: number;
  total: number;
  time: number;
  lang: string;
  duration: number;
}) {
  const uid = await getCurrentUserId();
  if (!uid) return;

  const profile = await getMyProfile();
  const username = profile?.username || profile?.first_name || "player";

  await supabase!.from("typing_results").insert({
    user_id: uid,
    username,
    wpm: Math.round(result.wpm),
    accuracy: Math.round(result.accuracy),
    errors: Math.round(result.errors),
    correct: Math.round(result.correct),
    total: Math.round(result.total),
    time: Math.round(result.time),
    lang: result.lang,
    duration: Math.round(result.duration),
    created_at: Date.now(),
  });

  // Profile'ni yangilash (best_wpm, last_seen)
  if (profile) {
    const bestWpm = Math.max(profile.best_wpm ?? 0, Math.round(result.wpm));
    await supabase!.from("profiles").update({
      best_wpm: bestWpm,
      last_seen: Date.now(),
      updated_at: new Date().toISOString(),
    }).eq("id", uid);
  }

  // Yutuqlarni tekshirish
  await checkAchievements(uid);
}

/** Leaderboard uchun — eng yaxshi natijalar (har bir foydalanuvchidan bitta) */
export async function getLeaderboard(limit = 50): Promise<TypingResultRow[]> {
  if (!isSupabaseConfigured()) return [];
  // Har bir user_id bo'yicha eng yuqori WPM natijasini olish
  const { data } = await supabase!.rpc("get_leaderboard", { lim: limit }).maybeSingle();
  // Agar RPC yo'q bo'lsa, oddiy query
  if (!data) {
    const { data: rows } = await supabase!.from("typing_results").select("*").order("wpm", { ascending: false }).limit(limit);
    return (rows ?? []) as TypingResultRow[];
  }
  return data as TypingResultRow[];
}

/** Davlatlar reytingi uchun */
export async function getCountryLeaderboard(): Promise<TypingResultRow[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await supabase!.from("typing_results").select("*").order("wpm", { ascending: false }).limit(200);
  return (data ?? []) as TypingResultRow[];
}

/** Foydalanuvchining barcha natijalari (profile/history uchun) */
export async function getUserResults(userId: string, limit = 50): Promise<TypingResultRow[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await supabase!.from("typing_results")
    .select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
  return (data ?? []) as TypingResultRow[];
}

// ═══════════════════════════════════════════════════════════════════════
// ACHIEVEMENTS
// ═══════════════════════════════════════════════════════════════════════

export async function listAchievements(): Promise<AchievementRow[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await supabase!.from("achievements").select("*").order("sort_order");
  return (data ?? []) as AchievementRow[];
}

export async function saveAchievement(a: Partial<AchievementRow> & { key: string; title: string }) {
  if (!isSupabaseConfigured()) return;
  const existing = await supabase!.from("achievements").select("id").eq("key", a.key).maybeSingle();
  if (existing.data) {
    await supabase!.from("achievements").update(a).eq("id", existing.data.id);
  } else {
    await supabase!.from("achievements").insert(a);
  }
}

export async function deleteAchievement(id: number) {
  if (!isSupabaseConfigured()) return;
  await supabase!.from("user_achievements").delete().eq("achievement_key",
    (await supabase!.from("achievements").select("key").eq("id", id).single()).data?.key ?? ""
  );
  await supabase!.from("achievements").delete().eq("id", id);
}

export async function getUserAchievements(userId: string): Promise<UserAchievementRow[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await supabase!.from("user_achievements").select("*").eq("user_id", userId);
  return (data ?? []) as UserAchievementRow[];
}

/** Avtomatik yutuq ochish — test yozilgandan keyin */
async function checkAchievements(userId: string) {
  const all = await listAchievements();
  if (!all.length) return;

  const unlocked = await getUserAchievements(userId);
  const has = new Set(unlocked.map((u) => u.achievement_key));

  const profile = await getMyProfile();
  if (!profile) return;

  const { count: testCount } = await supabase!.from("typing_results")
    .select("*", { count: "exact", head: true }).eq("user_id", userId);

  const { data: latestResult } = await supabase!.from("typing_results")
    .select("wpm,accuracy").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).single();

  for (const a of all) {
    if (!a.enabled || has.has(a.key)) continue;
    let pass = false;
    switch (a.req_type) {
      case "wpm": pass = (profile.best_wpm ?? 0) >= a.req_goal; break;
      case "accuracy": pass = (latestResult?.accuracy ?? 0) >= a.req_goal; break;
      case "tests": pass = (testCount ?? 0) >= a.req_goal; break;
      case "races": pass = profile.races >= a.req_goal; break;
      case "coins": pass = profile.coins >= a.req_goal; break;
      case "xp": pass = profile.xp >= a.req_goal; break;
    }
    if (!pass) continue;

    await supabase!.from("user_achievements").insert({
      user_id: userId,
      achievement_key: a.key,
      unlocked_at: Date.now(),
    });

    // Mukofot berish
    if (a.xp_reward > 0 || a.coin_reward > 0) {
      const coins = profile.coins + a.coin_reward;
      const xp = profile.xp + a.xp_reward;
      await supabase!.from("profiles").update({ coins, xp, updated_at: new Date().toISOString() }).eq("id", userId);
      if (a.coin_reward > 0) {
        await supabase!.from("coin_transactions").insert({
          user_id: userId, username: profile.username || "?", kind: "coins",
          amount: a.coin_reward, balance_after: coins, reason: `Yutuq: ${a.title}`, admin_name: "",
          created_at: Date.now(),
        });
      }
      if (a.xp_reward > 0) {
        await supabase!.from("coin_transactions").insert({
          user_id: userId, username: profile.username || "?", kind: "xp",
          amount: a.xp_reward, balance_after: xp, reason: `Yutuq: ${a.title}`, admin_name: "",
          created_at: Date.now(),
        });
      }
      profile.coins = coins;
      profile.xp = xp;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// COIN TRANSACTIONS
// ═══════════════════════════════════════════════════════════════════════

export async function listTransactions(search?: string, limit = 120): Promise<CoinTransactionRow[]> {
  if (!isSupabaseConfigured()) return [];
  let query = supabase!.from("coin_transactions").select("*").order("created_at", { ascending: false }).limit(limit);
  if (search?.trim()) {
    const s = search.trim();
    query = query.or(`username.ilike.%${s}%,reason.ilike.%${s}%`);
  }
  const { data } = await query;
  return (data ?? []) as CoinTransactionRow[];
}

export async function addCoins(userId: string, amount: number, reason: string, adminName: string) {
  if (!isSupabaseConfigured()) return;
  const { data: profile } = await supabase!.from("profiles").select("coins").eq("id", userId).single();
  if (!profile) return;
  const next = profile.coins + amount;
  await supabase!.from("profiles").update({ coins: next, updated_at: new Date().toISOString() }).eq("id", userId);
  await supabase!.from("coin_transactions").insert({
    user_id: userId, username: "", kind: "coins", amount, balance_after: next,
    reason, admin_name: adminName, created_at: Date.now(),
  });
}

// ═══════════════════════════════════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════════════════════════════════

export async function fileReport(targetId: string, targetName: string, reason: string, details?: string) {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error("Avval tizimga kiring");
  const profile = await getMyProfile();
  await supabase!.from("reports").insert({
    reporter_id: uid, reporter_name: profile?.username || "?",
    target_id: targetId, target_name: targetName,
    reason, details: details || null,
    status: "pending", created_at: Date.now(), updated_at: Date.now(),
  });
}

export async function listReports(status?: string): Promise<ReportRow[]> {
  if (!isSupabaseConfigured()) return [];
  let query = supabase!.from("reports").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data } = await query;
  return (data ?? []) as ReportRow[];
}

export async function updateReportStatus(id: number, status: string, note?: string) {
  if (!isSupabaseConfigured()) return;
  const profile = await getMyProfile();
  const updates: Record<string, unknown> = {
    status, updated_at: Date.now(), admin_name: profile?.username || "",
  };
  if (note !== undefined) updates.admin_note = note;
  await supabase!.from("reports").update(updates).eq("id", id);
  await logAdminAction("report_update", "", `${status}`);
}

// ═══════════════════════════════════════════════════════════════════════
// ANNOUNCEMENTS
// ═══════════════════════════════════════════════════════════════════════

export async function listAnnouncements(): Promise<AnnouncementRow[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await supabase!.from("announcements").select("*").order("created_at", { ascending: false });
  return (data ?? []) as AnnouncementRow[];
}

export async function getPublicAnnouncements(): Promise<{ id: number; title: string; body: string }[]> {
  if (!isSupabaseConfigured()) return [];
  const settings = await getPublicSettings();
  if (!settings.announcementsEnabled) return [];
  const now = Date.now();
  const { data } = await supabase!.from("announcements").select("*").eq("enabled", true);
  return ((data ?? []) as AnnouncementRow[])
    .filter((a) => (a.scheduled_for ?? 0) <= now && (!a.expires_at || a.expires_at > now))
    .sort((a, b) => (a.scheduled_for ?? a.created_at) - (b.scheduled_for ?? b.created_at))
    .map((a) => ({ id: a.id, title: a.title, body: a.body }));
}

export async function saveAnnouncement(a: { id?: number; title: string; body: string; enabled: boolean; scheduledFor?: number; expiresAt?: number }) {
  if (!isSupabaseConfigured()) return;
  const profile = await getMyProfile();
  const adminName = profile?.username || "";
  if (a.id) {
    await supabase!.from("announcements").update({
      title: a.title, body: a.body, enabled: a.enabled,
      scheduled_for: a.scheduledFor ?? null, expires_at: a.expiresAt ?? null,
      updated_at: Date.now(),
    }).eq("id", a.id);
  } else {
    await supabase!.from("announcements").insert({
      title: a.title, body: a.body, enabled: a.enabled,
      scheduled_for: a.scheduledFor ?? null, expires_at: a.expiresAt ?? null,
      created_by_name: adminName, created_at: Date.now(), updated_at: Date.now(),
    });
  }
  await logAdminAction(a.id ? "announcement_edit" : "announcement_create", a.title, a.enabled ? "faol" : "o'chirilgan");
}

export async function deleteAnnouncement(id: number) {
  if (!isSupabaseConfigured()) return;
  await supabase!.from("announcements").delete().eq("id", id);
  await logAdminAction("announcement_delete", "", "");
}

// ═══════════════════════════════════════════════════════════════════════
// ADMIN LOGS
// ═══════════════════════════════════════════════════════════════════════

export async function logAdminAction(action: string, target?: string, details?: string) {
  if (!isSupabaseConfigured()) return;
  const profile = await getMyProfile();
  await supabase!.from("admin_logs").insert({
    admin_name: profile?.username || profile?.email || "?",
    action, target: target || null, details: details || null,
    created_at: Date.now(),
  });
}

export async function listAdminLogs(limit = 300): Promise<AdminLogRow[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await supabase!.from("admin_logs").select("*").order("created_at", { ascending: false }).limit(limit);
  return (data ?? []) as AdminLogRow[];
}

// ═══════════════════════════════════════════════════════════════════════
// TYPING TEXTS
// ═══════════════════════════════════════════════════════════════════════

export async function listTypingTexts(lang?: string, difficulty?: string, search?: string): Promise<TypingTextRow[]> {
  if (!isSupabaseConfigured()) return [];
  let query = supabase!.from("typing_texts").select("*").order("created_at", { ascending: false });
  if (lang) query = query.eq("lang", lang);
  if (difficulty) query = query.eq("difficulty", difficulty);
  if (search?.trim()) {
    const s = search.trim();
    query = query.or(`text.ilike.%${s}%,category.ilike.%${s}%`);
  }
  const { data } = await query;
  return (data ?? []) as TypingTextRow[];
}

export async function saveTypingText(t: { id?: number; text: string; lang: string; difficulty: string; category: string; enabled: boolean }) {
  if (!isSupabaseConfigured()) return;
  const profile = await getMyProfile();
  if (t.id) {
    await supabase!.from("typing_texts").update({
      text: t.text, lang: t.lang, difficulty: t.difficulty, category: t.category, enabled: t.enabled,
    }).eq("id", t.id);
  } else {
    await supabase!.from("typing_texts").insert({
      text: t.text, lang: t.lang, difficulty: t.difficulty, category: t.category,
      enabled: t.enabled, created_by_name: profile?.username || "", created_at: Date.now(),
    });
  }
  await logAdminAction(t.id ? "text_edit" : "text_create", t.lang, `${t.difficulty} · ${t.category}`);
}

export async function deleteTypingText(id: number) {
  if (!isSupabaseConfigured()) return;
  await supabase!.from("typing_texts").delete().eq("id", id);
  await logAdminAction("text_delete", "", "");
}

// ═══════════════════════════════════════════════════════════════════════
// SITE SETTINGS
// ═══════════════════════════════════════════════════════════════════════

export async function getPublicSettings(): Promise<{
  siteName: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  announcementsEnabled: boolean;
  registrationOpen: boolean;
}> {
  if (!isSupabaseConfigured()) {
    return { siteName: "STypeUz", maintenanceMode: false, maintenanceMessage: "", announcementsEnabled: true, registrationOpen: true };
  }
  const { data } = await supabase!.from("site_settings").select("*").limit(1).single();
  if (!data) {
    return { siteName: "STypeUz", maintenanceMode: false, maintenanceMessage: "", announcementsEnabled: true, registrationOpen: true };
  }
  return {
    siteName: data.site_name,
    maintenanceMode: data.maintenance_mode,
    maintenanceMessage: data.maintenance_message,
    announcementsEnabled: data.announcements_enabled,
    registrationOpen: data.registration_open,
  };
}

export async function getSettings(): Promise<SiteSettingsRow | null> {
  if (!isSupabaseConfigured()) return null;
  const { data } = await supabase!.from("site_settings").select("*").limit(1).maybeSingle();
  return (data as SiteSettingsRow) ?? null;
}

export async function updateSettings(s: {
  siteName: string; logo: string; maintenanceMode: boolean; maintenanceMessage: string;
  registrationOpen: boolean; announcementsEnabled: boolean;
}) {
  if (!isSupabaseConfigured()) return;
  const profile = await getMyProfile();
  const existing = await getSettings();
  const data = {
    site_name: s.siteName || "STypeUz", logo: s.logo, maintenance_mode: s.maintenanceMode,
    maintenance_message: s.maintenanceMessage, registration_open: s.registrationOpen,
    announcements_enabled: s.announcementsEnabled, updated_at: Date.now(),
    updated_by_name: profile?.username || "",
  };
  if (existing) {
    await supabase!.from("site_settings").update(data).eq("id", existing.id);
  } else {
    await supabase!.from("site_settings").insert(data);
  }
  await logAdminAction("settings_update", "", "sayt sozlamalari yangilandi");
}

// ═══════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD STATS
// ═══════════════════════════════════════════════════════════════════════

export async function getAdminStats() {
  if (!isSupabaseConfigured()) return null;

  const DAY = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayMs = todayStart.getTime();

  const { count: totalUsers } = await supabase!.from("profiles").select("*", { count: "exact", head: true });
  const { count: testsToday } = await supabase!.from("typing_results").select("*", { count: "exact", head: true }).gte("created_at", todayMs);

  const sevenDaysAgo = now - 7 * DAY;
  const thirtyDaysAgo = now - 30 * DAY;
  const { count: tests7d } = await supabase!.from("typing_results").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo);
  const { count: tests30d } = await supabase!.from("typing_results").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo);

  // Average WPM
  const { data: avgData } = await supabase!.from("typing_results").select("wpm");
  const avgWpm = avgData?.length ? Math.round(avgData.reduce((a, r) => a + r.wpm, 0) / avgData.length) : 0;

  const { data: r7Data } = await supabase!.from("typing_results").select("wpm,accuracy").gte("created_at", sevenDaysAgo);
  const avgWpm7d = r7Data?.length ? Math.round(r7Data.reduce((a, r) => a + r.wpm, 0) / r7Data.length) : 0;
  const avgAcc7d = r7Data?.length ? Math.round(r7Data.reduce((a, r) => a + r.accuracy, 0) / r7Data.length) : 0;

  // Series (last 30 days)
  const series: { date: string; label: string; tests: number; wpm: number; newUsers: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * DAY);
    d.setHours(0, 0, 0, 0);
    const start = d.getTime();
    const end = start + DAY;
    const { count: dayTests } = await supabase!.from("typing_results").select("*", { count: "exact", head: true }).gte("created_at", start).lt("created_at", end);
    series.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en", { day: "2-digit", month: "short" }),
      tests: dayTests ?? 0,
      wpm: 0,
      newUsers: 0,
    });
  }

  return {
    totals: {
      users: totalUsers ?? 0,
      online: 0,
      newToday: 0,
      testsToday: testsToday ?? 0,
      tests7d: tests7d ?? 0,
      tests30d: tests30d ?? 0,
      newUsers7d: 0,
      newUsers30d: 0,
      avgWpm,
      avgAcc: 0,
      avgWpm7d,
      avgAcc7d,
      avgWpm30d: 0,
      avgAcc30d: 0,
      bestWpm: avgData?.length ? Math.max(...avgData.map((r) => r.wpm)) : 0,
    },
    series,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// USER COSMETICS (sotib olingan narsalar, avatar, effektlar)
// ═══════════════════════════════════════════════════════════════════════

export interface UserCosmetics {
  purchased: string[];
  activeEffects: string[];
  activeAvatar: string;
  heroEquip: Record<string, string>;
}

export async function getMyCosmetics(): Promise<UserCosmetics> {
  const defaults: UserCosmetics = { purchased: [], activeEffects: ["fx_sparkle"], activeAvatar: "avatar_default", heroEquip: {} };
  if (!isSupabaseConfigured()) return defaults;
  const uid = await getCurrentUserId();
  if (!uid) return defaults;
  const { data } = await supabase!.from("user_cosmetics").select("*").eq("user_id", uid).maybeSingle();
  if (!data) return defaults;
  return {
    purchased: (data.purchased as string[]) || [],
    activeEffects: (data.active_effects as string[]) || ["fx_sparkle"],
    activeAvatar: data.active_avatar || "avatar_default",
    heroEquip: (data.hero_equip as Record<string, string>) || {},
  };
}

export async function saveMyCosmetics(cosmetics: UserCosmetics) {
  if (!isSupabaseConfigured()) return;
  const uid = await getCurrentUserId();
  if (!uid) return;
  const { data: existing } = await supabase!.from("user_cosmetics").select("id").eq("user_id", uid).maybeSingle();
  const row = {
    user_id: uid,
    purchased: cosmetics.purchased,
    active_effects: cosmetics.activeEffects,
    active_avatar: cosmetics.activeAvatar,
    hero_equip: cosmetics.heroEquip,
    updated_at: Date.now(),
  };
  if (existing) {
    await supabase!.from("user_cosmetics").update(row).eq("id", existing.id);
  } else {
    await supabase!.from("user_cosmetics").insert(row);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// USER MISSIONS (vazifalar progressi + XP)
// ═══════════════════════════════════════════════════════════════════════

export interface UserMissionsData {
  missions: unknown[];
  xp: number;
}

export async function getMyMissions(): Promise<UserMissionsData> {
  if (!isSupabaseConfigured()) return { missions: [], xp: 0 };
  const uid = await getCurrentUserId();
  if (!uid) return { missions: [], xp: 0 };
  const { data } = await supabase!.from("user_missions").select("*").eq("user_id", uid).maybeSingle();
  if (!data) return { missions: [], xp: 0 };
  return { missions: (data.missions as unknown[]) || [], xp: data.xp || 0 };
}

export async function saveMyMissions(missions: unknown[], xp: number) {
  if (!isSupabaseConfigured()) return;
  const uid = await getCurrentUserId();
  if (!uid) return;
  const { data: existing } = await supabase!.from("user_missions").select("id").eq("user_id", uid).maybeSingle();
  const row = { user_id: uid, missions, xp, updated_at: Date.now() };
  if (existing) {
    await supabase!.from("user_missions").update(row).eq("id", existing.id);
  } else {
    await supabase!.from("user_missions").insert(row);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// USER REPLAYS (yozish replaylari)
// ═══════════════════════════════════════════════════════════════════════

export interface ReplayRow {
  id: number;
  user_id: string;
  text: string;
  events: unknown[];
  wpm: number;
  accuracy: number;
  created_at: number;
}

export async function getMyReplays(limit = 20): Promise<ReplayRow[]> {
  if (!isSupabaseConfigured()) return [];
  const uid = await getCurrentUserId();
  if (!uid) return [];
  const { data } = await supabase!.from("user_replays").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(limit);
  return (data ?? []) as ReplayRow[];
}

export async function saveReplay(replay: { text: string; events: unknown[]; wpm: number; accuracy: number }) {
  if (!isSupabaseConfigured()) return;
  const uid = await getCurrentUserId();
  if (!uid) return;
  await supabase!.from("user_replays").insert({
    user_id: uid, text: replay.text, events: replay.events,
    wpm: replay.wpm, accuracy: replay.accuracy, created_at: Date.now(),
  });
}

// ═══════════════════════════════════════════════════════════════════════
// USER SETTINGS (kunlik login, streak, sozlamalar)
// ═══════════════════════════════════════════════════════════════════════

export interface UserSettingsData {
  dailyState: Record<string, unknown>;
  favorites: string[];
  usedLangs: string[];
  theme: string;
  lang: string;
  duration: number;
  fontSize: string;
  soundEnabled: boolean;
  showKeyboard: boolean;
  showHeatmap: boolean;
  fingerGuide: boolean;
  bgImage: string;
  bgDim: number;
}

const DEFAULT_SETTINGS: UserSettingsData = {
  dailyState: {}, favorites: [], usedLangs: [],
  theme: "blue", lang: "en", duration: 15, fontSize: "md",
  soundEnabled: true, showKeyboard: false, showHeatmap: false,
  fingerGuide: true, bgImage: "", bgDim: 0.55,
};

export async function getMySettings(): Promise<UserSettingsData> {
  if (!isSupabaseConfigured()) return DEFAULT_SETTINGS;
  const uid = await getCurrentUserId();
  if (!uid) return DEFAULT_SETTINGS;
  const { data } = await supabase!.from("user_settings").select("*").eq("user_id", uid).maybeSingle();
  if (!data) return DEFAULT_SETTINGS;
  return {
    dailyState: (data.daily_state as Record<string, unknown>) || {},
    favorites: (data.favorites as string[]) || [],
    usedLangs: (data.used_langs as string[]) || [],
    theme: data.theme || "blue",
    lang: data.lang || "en",
    duration: data.duration || 15,
    fontSize: data.font_size || "md",
    soundEnabled: data.sound_enabled ?? true,
    showKeyboard: data.show_keyboard ?? false,
    showHeatmap: data.show_heatmap ?? false,
    fingerGuide: data.finger_guide ?? true,
    bgImage: data.bg_image || "",
    bgDim: data.bg_dim ?? 0.55,
  };
}

export async function saveMySettings(settings: Partial<UserSettingsData>) {
  if (!isSupabaseConfigured()) return;
  const uid = await getCurrentUserId();
  if (!uid) return;
  const { data: existing } = await supabase!.from("user_settings").select("id").eq("user_id", uid).maybeSingle();
  const row: Record<string, unknown> = { user_id: uid, updated_at: Date.now() };
  if (settings.dailyState !== undefined) row.daily_state = settings.dailyState;
  if (settings.favorites !== undefined) row.favorites = settings.favorites;
  if (settings.usedLangs !== undefined) row.used_langs = settings.usedLangs;
  if (settings.theme !== undefined) row.theme = settings.theme;
  if (settings.lang !== undefined) row.lang = settings.lang;
  if (settings.duration !== undefined) row.duration = settings.duration;
  if (settings.fontSize !== undefined) row.font_size = settings.fontSize;
  if (settings.soundEnabled !== undefined) row.sound_enabled = settings.soundEnabled;
  if (settings.showKeyboard !== undefined) row.show_keyboard = settings.showKeyboard;
  if (settings.showHeatmap !== undefined) row.show_heatmap = settings.showHeatmap;
  if (settings.fingerGuide !== undefined) row.finger_guide = settings.fingerGuide;
  if (settings.bgImage !== undefined) row.bg_image = settings.bgImage;
  if (settings.bgDim !== undefined) row.bg_dim = settings.bgDim;
  if (existing) {
    await supabase!.from("user_settings").update(row).eq("id", existing.id);
  } else {
    await supabase!.from("user_settings").insert(row);
  }
}
