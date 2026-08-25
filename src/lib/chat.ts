/**
 * Onlayn chat — Supabase Realtime.
 *
 * Jadval va RLS siyosatlari: supabase/chat.sql
 *  - o'qish: hamma (mehmon ham ko'radi),
 *  - yozish: faqat login qilgan va bloklanmagan foydalanuvchi o'z nomidan,
 *  - o'chirish: o'z xabari yoki admin (soft delete — `deleted = true`).
 */
import { supabase } from "./supabase";
import { getCurrentUserId, getMyProfile } from "./db";

export interface ChatMessage {
  id: number;
  user_id: string;
  username: string;
  body: string;
  deleted: boolean;
  created_at: number;
}

/** Chat a'zosi haqida qisqa ma'lumot — nishon (Owner/Admin) ko'rsatish uchun */
export interface ChatAuthor {
  username: string;
  role: "user" | "admin" | "owner";
}

/** Bir marta yuborish oralig'i (millisekund) — spamdan himoya */
export const CHAT_COOLDOWN_MS = 1500;
/** Xabarning maksimal uzunligi — bazadagi cheklov bilan bir xil */
export const CHAT_MAX_LEN = 500;

/** Oxirgi xabarlar — eskisidan yangisiga qarab tartiblangan */
export async function fetchRecentMessages(limit = 100): Promise<ChatMessage[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, user_id, username, body, deleted, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  // So'rov yangisidan eskisiga keldi — ko'rsatish uchun teskarisiga aylantiramiz
  return ((data ?? []) as ChatMessage[]).slice().reverse();
}

/** Xabar mualliflari (rol nishonlari uchun) */
export async function fetchChatAuthors(userIds: string[]): Promise<Map<string, ChatAuthor>> {
  const map = new Map<string, ChatAuthor>();
  if (!supabase || userIds.length === 0) return map;
  const { data } = await supabase
    .from("profiles")
    .select("id, username, first_name, role")
    .in("id", userIds);
  for (const p of (data ?? []) as { id: string; username: string | null; first_name: string | null; role: ChatAuthor["role"] }[]) {
    map.set(p.id, { username: p.username || p.first_name || "player", role: p.role });
  }
  return map;
}

/** Xabar yuborish. Login qilmagan bo'lsa yoki matn bo'sh bo'lsa xato tashlaydi. */
export async function sendChatMessage(body: string): Promise<void> {
  if (!supabase) throw new Error("Supabase sozlanmagan");
  const text = body.trim();
  if (!text) throw new Error("Xabar bo'sh");
  if (text.length > CHAT_MAX_LEN) throw new Error(`Xabar ${CHAT_MAX_LEN} belgidan uzun bo'lmasin`);

  const uid = await getCurrentUserId();
  if (!uid) throw new Error("Chatda yozish uchun avval tizimga kiring");

  const profile = await getMyProfile();
  const username = profile?.username || profile?.first_name || "player";

  const { error } = await supabase.from("chat_messages").insert({
    user_id: uid,
    username,
    body: text,
    created_at: Date.now(),
  });
  if (error) throw error;
}

/** Xabarni o'chirish (soft delete) — o'z xabari yoki admin */
export async function deleteChatMessage(id: number): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("chat_messages").update({ deleted: true }).eq("id", id);
  if (error) throw error;
}

/**
 * Realtime obuna — yangi xabar va o'zgarishlar (o'chirilgan xabarlar).
 *
 * `onStatus` obuna haqiqatan ulanganini bildiradi. Agar jadval
 * `supabase_realtime` publication'iga qo'shilmagan bo'lsa yoki ulanish
 * uzilsa — chaqiruvchi tomon so'rov bilan yangilashga (polling) o'tadi,
 * shunda chat baribir ishlaydi.
 *
 * Qaytgan funksiya obunani bekor qiladi.
 */
export function subscribeToChat(
  onInsert: (msg: ChatMessage) => void,
  onUpdate: (msg: ChatMessage) => void,
  onStatus?: (connected: boolean) => void,
): () => void {
  if (!supabase) return () => {};
  const client = supabase;
  const channel = client
    .channel("public:chat_messages")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "chat_messages" },
      (payload) => onInsert(payload.new as ChatMessage),
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "chat_messages" },
      (payload) => onUpdate(payload.new as ChatMessage),
    )
    .subscribe((status) => {
      onStatus?.(status === "SUBSCRIBED");
    });

  return () => {
    void client.removeChannel(channel);
  };
}
