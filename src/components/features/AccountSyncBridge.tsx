"use client";

import { useEffect, useRef } from "react";
import { isSupabaseConfigured } from "../../lib/supabase";
import { getMyProfile, updateProfile, getCurrentUserId } from "../../lib/db";

const COINS_KEY = "typeuz_coins";
const XP_KEY = "typeuz_xp";
const SERVER_COINS_KEY = "typeuz_coins_supabase_server";
export const COINS_SYNC_EVENT = "typeuz-coins-sync";

function readLocalNumber(key: string): number {
  try {
    return parseInt(window.localStorage.getItem(key) || "0", 10) || 0;
  } catch {
    return 0;
  }
}

function readActiveAvatar(): string {
  try {
    const raw = window.localStorage.getItem("typeuz_effects");
    if (raw) {
      const e = JSON.parse(raw) as { activeAvatar?: string };
      return e.activeAvatar || "avatar_default";
    }
  } catch { /* ignore */ }
  return "avatar_default";
}

/**
 * Foydalanuvchi profilini Supabase bilan sinxronlaydi:
 * 1) Sign up bo'lgan profil → Supabase profiles jadvaliga
 * 2) Admin sovg'a qilgan coinlar → localStorage hamyonga
 */
export default function AccountSyncBridge() {
  const running = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const sync = async () => {
      if (running.current) return;
      running.current = true;
      try {
        const uid = await getCurrentUserId();
        if (!uid) return;

        const profile = await getMyProfile();
        if (!profile) return;

        // Server coinlarini local bilan sinxronlash
        const server = profile.coins ?? 0;
        const local = readLocalNumber(COINS_KEY);
        const rawMarker = window.localStorage.getItem(SERVER_COINS_KEY);
        const marker = rawMarker === null ? Math.max(server, local) : parseInt(rawMarker, 10) || 0;

        const delta = Math.max(0, server - marker);
        const localNew = local + delta;

        if (localNew > server) {
          await updateProfile({ coins: localNew }).catch(() => {});
        }

        window.localStorage.setItem(SERVER_COINS_KEY, String(Math.max(marker, server, localNew)));

        if (delta > 0 && localNew > local) {
          window.localStorage.setItem(COINS_KEY, String(localNew));
          window.dispatchEvent(new CustomEvent(COINS_SYNC_EVENT, { detail: localNew }));
        }
      } catch { /* backend sozlanmagan */ }
      finally { running.current = false; }
    };

    void sync();
    const iv = window.setInterval(() => void sync(), 30_000);
    return () => window.clearInterval(iv);
  }, []);

  return null;
}
