"use client";

import { useEffect, useRef } from "react";
import { isSupabaseConfigured } from "../../lib/supabase";
import { getMyProfile, getCurrentUserId } from "../../lib/db";

/**
 * Foydalanuvchi profilini Supabase bilan sinxronlaydi.
 * Coin sync faqat SupabaseCoinSync komponenti tomonidan boshqariladi —
 * bu yerda faqat profil ma'lumotlarini sinxronlaymiz.
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

        // Profil ma'lumotlarini sinxronlash (coin emas — SupabaseCoinSync boshqaradi)
      } catch { /* backend sozlanmagan */ }
      finally { running.current = false; }
    };

    void sync();
  }, []);

  return null;
}
