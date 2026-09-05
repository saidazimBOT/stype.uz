/**
 * STypeUz — Multiplayer Challenge Bridge
 *
 * Do'stlarni o'yinga chaqirish tizimi — database polling orqali.
 * Foydalanuvchi do'stiga challenge yuboradi, do'sti tepada bildirishnoma oladi,
 * qabul qilsa — bir xil matn bilan yozish boshlanadi.
 *
 * Realtime broadcast o'rniga POLLING ishlatiladi — bu ancha ishonchli.
 */
import { supabase, isSupabaseConfigured } from "./supabase";
import { getCurrentUserId } from "./db";
import type { ChallengeInvite, ChallengeStatus } from "../types";

// ═══════════════════════════════════════════════════════════════════════
// HANDLER TYPELARI
// ═══════════════════════════════════════════════════════════════════════

type InviteHandler = (invite: ChallengeInvite) => void;
type StatusHandler = (inviteId: string, status: ChallengeStatus, result?: { wpm: number; accuracy: number }) => void;

let pollInterval: ReturnType<typeof setInterval> | null = null;
let inviteHandlers: InviteHandler[] = [];
let statusHandlers: StatusHandler[] = [];
let lastPollTime = 0;

// ═══════════════════════════════════════════════════════════════════════
// POLLING — Har 2 soniyada yangi invitation'larni tekshirish
// ═══════════════════════════════════════════════════════════════════════

/**
 * Joriy foydalanuvchi uchun challenge invitation'larni poll qiladi.
 * Har 2 soniyada database'dan yangi invitation'lar tekshiriladi.
 */
export function subscribeToChallenges(
  onInvite: InviteHandler,
  onStatus: StatusHandler
): () => void {
  if (!isSupabaseConfigured()) return () => {};

  // Avvalgi polling'ni tozalaymiz
  unsubscribeFromChallenges();

  inviteHandlers.push(onInvite);
  statusHandlers.push(onStatus);

  // Darhol bir marta tekshiramiz
  void pollForInvites();

  // Har 2 soniyada polling
  pollInterval = setInterval(() => {
    void pollForInvites();
  }, 2000);

  return () => {
    unsubscribeFromChallenges();
  };
}

/**
 * Database'dan pending invitation'larni olish
 */
async function pollForInvites() {
  if (!isSupabaseConfigured()) return;

  const uid = await getCurrentUserId();
  if (!uid) return;

  try {
    // O'zimga yuborilgan pending invitation'larni qidiramiz
    const { data: invites } = await supabase!
      .from("challenge_invites")
      .select("*")
      .eq("to_user_id", uid)
      .eq("status", "pending")
      .gt("created_at", Date.now() - 60000); // Faqat oxirgi 60 soniyadagilar

    if (invites && invites.length > 0) {
      for (const row of invites) {
        const invite: ChallengeInvite = {
          id: row.id,
          fromUserId: row.from_user_id,
          fromUsername: row.from_username || "Player",
          toUserId: row.to_user_id,
          toUsername: row.to_username || "Player",
          status: row.status,
          textSeed: row.text_seed || "",
          lang: row.lang || "en",
          duration: row.duration || 15,
          createdAt: row.created_at,
        };

        // Handler'larga xabar beramiz
        inviteHandlers.forEach((h) => h(invite));
      }
    }

    // O'zi yuborga finished invitation'larni ham tekshiramiz
    const { data: results } = await supabase!
      .from("challenge_invites")
      .select("*")
      .eq("from_user_id", uid)
      .eq("status", "finished")
      .gt("created_at", lastPollTime);

    if (results && results.length > 0) {
      for (const row of results) {
        statusHandlers.forEach((h) =>
          h(row.id, "finished", { wpm: row.to_wpm || 0, accuracy: row.to_accuracy || 0 })
        );
      }
    }

    lastPollTime = Date.now();
  } catch {
    // Xatolik — keyingi polling'da qayta uriniladi
  }
}

/**
 * Channel'dan chiqish
 */
export function unsubscribeFromChallenges() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  inviteHandlers = [];
  statusHandlers = [];
  lastPollTime = 0;
}

// ═══════════════════════════════════════════════════════════════════════
// CHALLENGE YUBORISH (Sending)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Do'stga challenge invite yuborish.
 */
export async function sendChallengeInvite(params: {
  toUserId: string;
  toUsername: string;
  lang: string;
  duration: number;
}): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  const uid = await getCurrentUserId();
  if (!uid) return null;

  // Foydalanuvchi nomini olamiz
  const { data: profile } = await supabase!.from("profiles")
    .select("username, first_name")
    .eq("id", uid)
    .maybeSingle();
  const username = profile?.username || profile?.first_name || "Player";

  const inviteId = `ch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const textSeed = Math.random().toString(36).slice(2, 10);

  // Database'ga yozamiz — qabul qiluvchi polling orqali topadi
  try {
    const { error } = await supabase!.from("challenge_invites").insert({
      id: inviteId,
      from_user_id: uid,
      from_username: username,
      to_user_id: params.toUserId,
      to_username: params.toUsername,
      status: "pending",
      text_seed: textSeed,
      lang: params.lang,
      duration: params.duration,
      created_at: Date.now(),
    });

    if (error) {
      console.error("[Challenge] insert error:", error);
      return null;
    }
  } catch (e) {
    console.error("[Challenge] insert failed:", e);
    return null;
  }

  return inviteId;
}

/**
 * Challenge statusini yangilash (qabul qildi / rad etdi / natija)
 */
export async function updateChallengeStatus(params: {
  inviteId: string;
  toUserId: string;
  status: ChallengeStatus;
  result?: { wpm: number; accuracy: number };
}): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const uid = await getCurrentUserId();
  if (!uid) return;

  const updates: Record<string, unknown> = {
    status: params.status,
    updated_at: Date.now(),
  };

  if (params.result) {
    if (params.status === "finished") {
      updates.to_wpm = params.result.wpm;
      updates.to_accuracy = params.result.accuracy;
      updates.to_finished_at = Date.now();
    }
  }

  try {
    await supabase!.from("challenge_invites")
      .update(updates)
      .eq("id", params.inviteId);
  } catch (e) {
    console.error("[Challenge] update error:", e);
  }
}

/**
 * Challenge tugallanganini bildirish (yuboruvchi tomonidan)
 */
export async function submitChallengeResult(params: {
  inviteId: string;
  toUserId: string;
  result: { wpm: number; accuracy: number };
}): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const uid = await getCurrentUserId();
  if (!uid) return;

  try {
    await supabase!.from("challenge_invites")
      .update({
        from_wpm: params.result.wpm,
        from_accuracy: params.result.accuracy,
        from_finished_at: Date.now(),
        status: "finished",
        updated_at: Date.now(),
      })
      .eq("id", params.inviteId);
  } catch (e) {
    console.error("[Challenge] submit error:", e);
  }
}

/**
 * Pending invitationlarni tozalash (eski invitation'larni expired qilish)
 */
export async function cleanupOldInvites(): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    await supabase!.from("challenge_invites")
      .update({ status: "expired", updated_at: Date.now() })
      .eq("status", "pending")
      .lt("created_at", Date.now() - 60000); // 60 soniyadan eski
  } catch {}
}
