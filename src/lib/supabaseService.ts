/**
 * Supabase auth + profile xizmatlari.
 *
 * Ushbu funksiyalar faqat Supabase sozlangan bo'lsa ishlaydi (isSupabaseConfigured()).
 * Barcha ma'lumotlar so'rovlari anon kalit bilan boradi va Supabase RLS
 * qoidalari orqali himoyalanadi:
 *  - foydalanuvchi faqat O'Z profilini ko'ra/sozlashi mumkin,
 *  - administrator (role = admin | owner) barcha profillarni ko'ra oladi.
 */
import { supabase } from "./supabase";
import type { UserProfile } from "../hooks/useProfile";
import { usernameFromProfile } from "../hooks/useProfile";

export interface SupabaseProfileRow {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_id: string | null;
  coins?: number;
  role: "user" | "admin" | "owner";
  status: "active" | "blocked";
  created_at: string;
  last_login: string | null;
  updated_at: string;
}

/** Ro'yxatdan o'tish — Supabase Auth (email + parol) */
export async function signUpWithEmail(email: string, password: string, profile: UserProfile) {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatarId: profile.avatarId || "avatar_default",
        username: usernameFromProfile(profile),
      },
    },
  });
  if (error) throw error;
  // Profil qatori avtomatik yaratiladi (supabase/schema.sql dagi trigger orqali)
  return data;
}

/** Kirish — Supabase Auth (email + parol), so'ng last_login yangilanadi */
export async function signInWithEmail(email: string, password: string) {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  // last_login yangilash — muhim emas: bazadagi jadval hali yaratilmagan bo'lsa ham
  // kirish muvaffaqiyatli bo'lishi kerak (xato login'ni buzmasligi uchun)
  if (data.session?.user) {
    await touchLastLogin(data.session.user.id).catch(() => {});
  }
  return data;
}

export async function signOutSupabase() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

/** Google orqali kirish — Supabase OAuth */
export async function signInWithGoogle() {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
    },
  });
  if (error) throw error;
}

/** Joriy Supabase foydalanuvchisi (agar kirgan bo'lsa) */
export async function getSupabaseUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

/**
 * last_login ustunini yangilash (RLS: foydalanuvchi o'z qatorini yangilay oladi).
 * Agar profiles jadvali hali yaratilmagan bo'lsa — jim o'tkazib yuboriladi.
 */
export async function touchLastLogin(userId: string) {
  if (!supabase) return;
  await supabase
    .from("profiles")
    .update({ last_login: new Date().toISOString() })
    .eq("id", userId);
}

/**
 * Profilni Supabase'ga sinxronlash (register yoki login bo'lganda chaqiriladi).
 * RLS faqat O'Z qatorini yozishga ruxsat beradi — boshqa odamlar
 * sizning profilingizni o'zgartira olmaydi.
 */
export async function upsertProfile(profile: UserProfile) {
  if (!supabase) return;
  const user = await getSupabaseUser();
  if (!user) return;
  await supabase.from("profiles").upsert(
    {
      id: user.id,
      username: usernameFromProfile(profile),
      first_name: profile.firstName,
      last_name: profile.lastName,
      avatar_id: profile.avatarId || "avatar_default",
      email: user.email,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
}

/** Joriy foydalanuvchining profil qatori (rol/status uchun) */
export async function getMyProfile(): Promise<SupabaseProfileRow | null> {
  if (!supabase) return null;
  const user = await getSupabaseUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return (data as SupabaseProfileRow) ?? null;
}

export function isAdminRole(role?: string | null): boolean {
  return role === "admin" || role === "owner";
}

/**
 * Admin boshqa foydalanuvchiga coin beradi.
 * XAVFSIZLIK: bu Supabase RPC (`admin_add_coins`) security definer funksiya —
 * ichida is_admin() tekshiriladi, ya'ni faqat admin/owner chaqira oladi.
 */
export async function adminAddCoins(targetId: string, amount: number) {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.rpc("admin_add_coins", {
    target_id: targetId,
    amount: Math.floor(amount),
  });
  if (error) throw error;
}

/**
 * Joriy foydalanuvchi o'z tangalarini serverga yuboradi (push-up).
 * RLS: faqat o'z qatorini yangilay oladi (coins — xavfsiz maydon).
 */
export async function setMyCoins(coins: number) {
  if (!supabase) return;
  const user = await getSupabaseUser();
  if (!user) return;
  await supabase
    .from("profiles")
    .update({ coins, updated_at: new Date().toISOString() })
    .eq("id", user.id);
}

/**
 * Barcha ro'yxatdan o'tgan foydalanuvchilar (faqat admin).
 * RLS: anon kalit bilan so'rov faqat admin rolidagi foydalanuvchi uchun
 * to'liq ro'yxat qaytaradi; oddiy foydalanuvchiga faqat o'z qatori tushadi.
 */
export async function fetchAdminUsers(search?: string): Promise<SupabaseProfileRow[]> {
  if (!supabase) throw new Error("Supabase not configured");
  let query = supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  const s = search?.trim();
  if (s) {
    query = query.or(`username.ilike.%${s}%,first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as SupabaseProfileRow[];
}
