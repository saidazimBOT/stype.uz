/**
 * STypeUz — Multiplayer Challenge Bridge
 *
 * Do'stlarni o'yinga chaqirish tizimi — Supabase Realtime channel orqali.
 * Foydalanuvchi do'stiga challenge yuboradi, do'sti tepada bildirishnoma oladi,
 * qabul qilsa — bir xil matn bilan yozish boshlanadi.
 */
import { supabase, isSupabaseConfigured } from "./supabase";
import { getCurrentUserId } from "./db";
import type { ChallengeInvite, ChallengeStatus } from "../types";

// ═══════════════════════════════════════════════════════════════════════
// CHANNEL NOMI — har bir foydalanuvchi uchun noyob
// ═══════════════════════════════════════════════════════════════════════

function userChannelName(userId: string): string {
  return `challenge:${userId}`;
}

// ═══════════════════════════════════════════════════════════════════════
// HANDLER TYPELARI
// ═══════════════════════════════════════════════════════════════════════

type InviteHandler = (invite: ChallengeInvite) => void;
type StatusHandler = (inviteId: string, status: ChallengeStatus, result?: { wpm: number; accuracy: number }) => void;

let currentChannel: { unsubscribe: () => void } | null = null;
let inviteHandlers: InviteHandler[] = [];
let statusHandlers: StatusHandler[] = [];

// ═══════════════════════════════════════════════════════════════════════
// CHANNELNI IZLAGA QO'SHISH (Listening)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Joriy foydalanuvchi uchun Realtime channel'ni ochadi.
 * Challenge invite kelganda handler'lar chaqiriladi.
 */
export function subscribeToChallenges(
  onInvite: InviteHandler,
  onStatus: StatusHandler
): () => void {
  if (!isSupabaseConfigured()) return () => {};

  // Avvalgi channel'ni tozalaymiz
  unsubscribeFromChallenges();

  inviteHandlers.push(onInvite);
  statusHandlers.push(onStatus);

  // Async ish — userId olish va channel ochish
  void (async () => {
    const uid = await getCurrentUserId();
    if (!uid) return;

    const channelName = userChannelName(uid);
    const channel = supabase!.channel(channelName);

    // Challenge invite qabul qilish
    channel.on("broadcast", { event: "challenge_invite" }, ({ payload }) => {
      const invite = payload as ChallengeInvite;
      if (invite.toUserId === uid) {
        inviteHandlers.forEach((h) => h(invite));
      }
    });

    // Challenge status yangilanishi (qabul qildi / rad etdi / natija)
    channel.on("broadcast", { event: "challenge_status" }, ({ payload }) => {
      const data = payload as { inviteId: string; status: ChallengeStatus; result?: { wpm: number; accuracy: number }; fromUserId?: string };
      if (data.fromUserId !== uid) {
        statusHandlers.forEach((h) => h(data.inviteId, data.status, data.result));
      }
    });

    channel.subscribe();
    currentChannel = channel;
  })();

  return () => {
    unsubscribeFromChallenges();
  };
}

/**
 * Channel'dan chiqish
 */
export function unsubscribeFromChallenges() {
  if (currentChannel) {
    currentChannel.unsubscribe();
    currentChannel = null;
  }
  inviteHandlers = [];
  statusHandlers = [];
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

  const invite: ChallengeInvite = {
    id: inviteId,
    fromUserId: uid,
    fromUsername: username,
    toUserId: params.toUserId,
    toUsername: params.toUsername,
    status: "pending",
    textSeed,
    lang: params.lang,
    duration: params.duration,
    createdAt: Date.now(),
  };

  // Ma'lumotlar bazasiga saqlaymiz (referans uchun)
  try {
    await supabase!.from("challenge_invites").insert({
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
  } catch {
    // Jadval hali yaratilmagan bo'lsa — jim o'tkazamiz
  }

  // Realtime orqali yuboramiz — maqsad: qabul qiluvchining ekranida banner chiqishi
  const targetChannel = supabase!.channel(userChannelName(params.toUserId));
  await targetChannel.send({
    type: "broadcast",
    event: "challenge_invite",
    payload: invite,
  });

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

  // Bazani yangilaymiz
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
  } catch {}

  // Yuboruvchiga xabar beramiz
  // Buning uchun invite dan from_user_id ni olishimiz kerak
  const { data: invite } = await supabase!.from("challenge_invites")
    .select("from_user_id")
    .eq("id", params.inviteId)
    .maybeSingle();

  if (invite?.from_user_id) {
    const senderChannel = supabase!.channel(userChannelName(invite.from_user_id));
    await senderChannel.send({
      type: "broadcast",
      event: "challenge_status",
      payload: {
        inviteId: params.inviteId,
        status: params.status,
        result: params.result,
        fromUserId: uid,
      },
    });
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

  // Bazani yangilaymiz
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
  } catch {}

  // Qabul qiluvchiga xabar beramiz
  const receiverChannel = supabase!.channel(userChannelName(params.toUserId));
  await receiverChannel.send({
    type: "broadcast",
    event: "challenge_status",
    payload: {
      inviteId: params.inviteId,
      status: "finished",
      result: params.result,
      fromUserId: uid,
    },
  });
}
