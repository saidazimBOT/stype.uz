"use client";

import { useEffect, useRef } from "react";
import { isSupabaseConfigured } from "../../lib/supabase";
import { getMyProfile, setMyCoins } from "../../lib/supabaseService";

const COINS_KEY = "typeuz_coins";
/** Serverda oxirgi ko'rgan coin qiymati — sovg'a deltasini hisoblash uchun marker */
const MARKER_KEY = "typeuz_coins_supabase_server";
/** useCoins shu eventni tinglaydi (max() usulida yangilaydi) */
const SYNC_EVENT = "typeuz-coins-sync";

function readLocal(key: string): number {
  try {
    return parseInt(window.localStorage.getItem(key) || "0", 10) || 0;
  } catch {
    return 0;
  }
}

/**
 * Supabase'da saqlangan tangalarni localStorage hamyon bilan sinxronlaydi:
 *  1) Push-up: foydalanuvchi yutgan coinlar serverga boradi (admin balansni ko'radi).
 *  2) Delta-down: admin sovg'a qilgan (yoki boshqa serverga tushgan) coinlar
 *     farqi lokal hamyonga QO'SHILADI va `typeuz-coins-sync` eventi chiqariladi.
 *
 * Faqat Supabase sozlangan VA foydalanuvchi kirgan bo'lsa ishlaydi; aks holda
 * hammasi avvalgidek lokal bo'lib qoladi (hech narsa buzilmaydi).
 */
export default function SupabaseCoinSync() {
  const running = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const sync = async () => {
      if (running.current) return;
      running.current = true;
      try {
        const me = await getMyProfile();
        if (!me) return; // foydalanuvchi kirmagan — lokal rejim

        const server = me.coins ?? 0;
        const local = readLocal(COINS_KEY);
        const rawMarker = window.localStorage.getItem(MARKER_KEY);

        // Marker — bazaviy qiymat: undan oshgan server o'sishi = sovg'a (delta).
        // Birinchi sinxronlashda marker server va lokalning kattasi qilib olinadi
        // (aks holda eski balans yangi sovg'a deb hisoblanib qoladi).
        const marker =
          rawMarker === null ? Math.max(server, local) : parseInt(rawMarker, 10) || 0;

        // 1) Delta-down: admin sovg'a qilgan coinlar hamyonga tushadi.
        const delta = Math.max(0, server - marker);
        const localNew = local + delta;

        // 2) Push-up: yangi lokal balans serverdan katta bo'lsa — yuboramiz
        //    (max() mantiqi admin sovg'asini hech qachon o'chirmaydi).
        if (localNew > server) {
          await setMyCoins(localNew).catch(() => {});
        }

        // Marker'ni hozirgi holatga yangilaymiz — keyingi delta faqat yangi
        // sovg'alar uchun hisoblanadi (ikkilamchi qo'shilish bo'lmaydi).
        window.localStorage.setItem(MARKER_KEY, String(Math.max(marker, server, localNew)));

        if (delta > 0 && localNew > local) {
          window.localStorage.setItem(COINS_KEY, String(localNew));
          window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: localNew }));
        }
      } catch {
        /* backend sozlanmagan yoki xatolik — lokal rejimda qolamiz */
      } finally {
        running.current = false;
      }
    };

    void sync();
    const iv = window.setInterval(() => void sync(), 30_000);
    return () => window.clearInterval(iv);
  }, []);

  return null;
}
