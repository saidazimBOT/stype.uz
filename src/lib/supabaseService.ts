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
import { GOOGLE_POPUP_NAME } from "./oauthPopup";
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
  premium_until: string | null;
  premium_plan: string | null;
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
  // scope: 'local' — faqat local session'ni tozalaydi, serverga redirect qilmaydi.
  // Bu 404 xatosini va qayta avtomatik kirishni oldini oladi.
  await supabase.auth.signOut({ scope: 'local' });
  // Supabase session'ni localStorage'dan ham majburiy o'chiramiz.
  // Ba'zan signOut() token'ni to'liq o'chirmaydi — reload'da qaytadan kirib kelish
  // muammosini oldini oladi.
  try {
    const keys = Object.keys(localStorage);
    for (const k of keys) {
      if (k.startsWith('sb-') && k.endsWith('-auth-token')) {
        localStorage.removeItem(k);
      }
    }
  } catch {}
}

/**
 * Google orqali kirish — Supabase OAuth, POPUP oynada.
 *
 * Asosiy sahifa joyida qoladi (hard refresh bo'lmaydi): Google alohida
 * kichik oynada ochiladi, sessiya localStorage'ga yozilgach supabase-js
 * BroadcastChannel orqali asosiy oynaga SIGNED_IN hodisasini yuboradi.
 * Popup bloklangan bo'lsa — eski to'liq redirect rejimiga qaytamiz.
 */
export async function signInWithGoogle() {
  if (!supabase) throw new Error("Supabase not configured");
  const options = {
    redirectTo: `${window.location.origin}/`,
    queryParams: {
      access_type: "offline",
      prompt: "consent",
    },
  };

  // Popup FAQAT bosish hodisasi ichida ochilsa bloklanmaydi — shuning uchun
  // avval bo'sh oyna ochamiz, manzilni keyin (so'rov qaytgach) qo'yamiz.
  const w = 480;
  const h = 640;
  const left = window.screenX + Math.max(0, (window.outerWidth - w) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - h) / 2);
  let popup: Window | null = null;
  try {
    popup = window.open(
      "about:blank",
      GOOGLE_POPUP_NAME,
      `width=${w},height=${h},left=${Math.round(left)},top=${Math.round(top)},resizable=yes,scrollbars=yes`,
    );
  } catch {
    popup = null;
  }

  if (!popup) {
    // Popup bloklangan — avvalgidek to'liq redirect (sahifa yangilanadi)
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options });
    if (error) throw error;
    return;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { ...options, skipBrowserRedirect: true },
  });
  if (error || !data?.url) {
    popup.close();
    throw error ?? new Error("OAuth manzili olinmadi");
  }
  popup.location.href = data.url;
  popup.focus();
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

// ═══════════════════════════════════════════════════════════════════════
// PREMIUM — Telegram orqali to'lov qilgan foydalanuvchilarni admin qilish
// ═══════════════════════════════════════════════════════════════════════

export type PremiumPlan = "1month" | "2month" | "1year";

/** Premium reja muddatini oy soniga aylantirish */
export function planToMonths(plan: PremiumPlan): number {
  switch (plan) {
    case "1month": return 1;
    case "2month": return 2;
    case "1year": return 12;
  }
}

/** Foydalanuvchini Premium (admin) qilish — RPC orqali */
export async function activatePremium(targetId: string, plan: PremiumPlan): Promise<void> {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.rpc("admin_activate_premium", {
    target_id: targetId,
    plan,
    months: planToMonths(plan),
  });
  if (error) throw error;
}

/** Premiumni bekor qilish — RPC orqali */
export async function revokePremium(targetId: string): Promise<void> {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.rpc("admin_revoke_premium", {
    target_id: targetId,
  });
  if (error) throw error;
}

/** Premium muddati tugagan foydalanuvchilarni avtomatik bekor qilish */
export async function expirePremiumUsers(): Promise<number> {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase.rpc("expire_premium_users");
  if (error) throw error;
  return data as number;
}

/** Joriy foydalanuvchining premium holatini tekshirish */
export function isPremiumActive(profile: SupabaseProfileRow): boolean {
  if (profile.role !== "admin" && profile.role !== "owner") return false;
  if (!profile.premium_until) return false;
  return new Date(profile.premium_until) > new Date();
}

/** Premium muddatini formatlangan holda qaytarish */
export function formatPremiumUntil(isoDate: string | null): string {
  if (!isoDate) return "Cheksiz";
  const d = new Date(isoDate);
  return d.toLocaleDateString("uz-UZ", { year: "numeric", month: "long", day: "numeric" });
}
