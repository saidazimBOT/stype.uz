"use client";

import { useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../../convex/_generated/api";
import { getConvexClient } from "../../lib/battle";
import { useProfile, usernameFromProfile } from "../../hooks/useProfile";

const COINS_KEY = "typeuz_coins";
const XP_KEY = "typeuz_xp";
/** Serverda oxirgi ko'rgan coin qiymati — sovg'a deltasini hisoblash uchun marker */
const SERVER_COINS_KEY = "typeuz_coins_server";
/** Hamyon sinxronlash hodisasi — useCoins shuni tinglaydi */
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
  } catch {
    /* ignore */
  }
  return "avatar_default";
}

/**
 * Foydalanuvchi profili va coinlarini Convex bilan sinxronlaydi:
 * 1) Sign up qilingan profil → Convex `users` jadvaliga (haqiqiy admin panelda ko'rinadi).
 * 2) Admin sovg'a qilgan coinlar → localStorage hamyonga avtomatik o'tadi.
 *
 * Faqat Convex sozlangan (NEXT_PUBLIC_CONVEX_URL) va provider ichida ishlaydi;
 * aks holda hech narsa qilmaydi.
 */
export default function AccountSyncBridge() {
  const configured = useMemo(() => {
    const client = getConvexClient();
    if (!client) return false;
    return typeof (api as any)?.users?.me === "function";
  }, []);

  if (!configured) return null;
  return <AccountSyncBridgeInner />;
}

function AccountSyncBridgeInner() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signIn } = useAuthActions();
  const me = useQuery(api.users.me);
  const setUsername = useMutation(api.users.setUsername);
  const { profile } = useProfile();
  const lastSyncRef = useRef("");

  // Anonim kirish — har bir brauzer uchun barqaror identifikator
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      signIn("anonymous").catch(() => {
        /* backend sozlanmagan yoki oflayn */
      });
    }
  }, [isLoading, isAuthenticated, signIn]);

  // Profilni Convex'ga yuborish (sign up bo'lganda admin panelda ko'rinadi)
  useEffect(() => {
    if (isLoading || !isAuthenticated || !profile) return;
    const username = usernameFromProfile(profile);
    const avatar = readActiveAvatar();
    const sig = JSON.stringify({ username, avatar });
    if (lastSyncRef.current === sig) return;
    lastSyncRef.current = sig;
    setUsername({
      username,
      avatar,
      coins: readLocalNumber(COINS_KEY) || 50,
      xp: readLocalNumber(XP_KEY),
    }).catch(() => {
      lastSyncRef.current = "";
    });
  }, [isLoading, isAuthenticated, profile, setUsername]);

  // Admin sovg'a qilgan coinlarni hamyonga o'tkazish (delta usulida).
  // Nega max() emas? Coins asosan localStorage'da yashaydi (type test, daily,
  // games — hammasi local). Server coinlari faqat Battle orqali bor. Agar
  // foydalanuvchida local 1000, server 0 bo'lsa va admin +100 yuborsa,
  // max() hech narsa qilmaydi (100 < 1000) — sovg'a ko'rinmay qoladi.
  // Shuning uchun server qiymatining O'SISH deltasini localga qo'shamiz:
  // har bir sovg'a (yoki battle yutug'i) local hamyonga additiv tushadi.
  useEffect(() => {
    if (!me) return;
    const server = me.coins;
    try {
      const raw = window.localStorage.getItem(SERVER_COINS_KEY);
      if (raw === null) {
        // Birinchi marta ko'rish: bazaviy qiymat, hech narsa qo'shmaymiz
        // (aks holda Battle'dan allaqachon o'tgan balans 2 marta hisoblanadi).
        window.localStorage.setItem(SERVER_COINS_KEY, String(server));
        return;
      }
      const lastServer = parseInt(raw, 10) || 0;
      window.localStorage.setItem(SERVER_COINS_KEY, String(server));
      const delta = server - lastServer;
      if (delta <= 0) return; // server kamaygan — localdan olib tashlamaymiz
      const local = readLocalNumber(COINS_KEY);
      const next = local + delta;
      window.localStorage.setItem(COINS_KEY, String(next));
      window.dispatchEvent(new CustomEvent(COINS_SYNC_EVENT, { detail: next }));
    } catch {
      /* ignore */
    }
  }, [me?.coins]);

  return null;
}
