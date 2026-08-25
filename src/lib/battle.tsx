/**
 * Battle lib — Convex o'chirildi, hozircha placeholder.
 * Multiplayer tizimi Supabase Realtime ga o'tkazilganda qayta yoziladi.
 */

// Placeholder — BattleHub import qiladi
export const CONVEX_URL = "";

export function getConvexClient(): null {
  return null;
}

/** ConvexClientProvider o'rniga — faqat children qaytaradi */
export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export const USERNAME_KEY = "typeuz_username";

export function getStoredUsername(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(USERNAME_KEY) || "";
  } catch {
    return "";
  }
}

export function storeUsername(name: string) {
  try {
    localStorage.setItem(USERNAME_KEY, name);
  } catch {
    /* ignore */
  }
}
