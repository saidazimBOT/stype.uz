"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

/**
 * Google OAuth popup oynasida ko'rsatiladigan mitti ekran.
 *
 * Bu yerda butun ilova yuklanmaydi — sessiya localStorage'ga yozilishi bilan
 * (supabase `detectSessionInUrl` avtomatik bajaradi) oyna o'zini yopadi.
 * Asosiy oyna SIGNED_IN hodisasini BroadcastChannel orqali oladi.
 */
export default function OAuthPopupClosing() {
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    let done = false;
    const close = () => {
      if (done) return;
      done = true;
      // Asosiy oynaga xabar yetib ulgursin
      setTimeout(() => window.close(), 250);
    };

    const sub = supabase?.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) close();
    });

    // Sessiya popup ochilgunga qadar tayyor bo'lib qolgan holat
    void supabase?.auth.getSession().then(({ data }) => {
      if (data.session) close();
    });

    // 12 soniyada yopilmasa — foydalanuvchiga qo'lda yopishni aytamiz
    const t = setTimeout(() => setStuck(true), 12000);

    return () => {
      clearTimeout(t);
      sub?.data.subscription.unsubscribe();
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        background: "#0f0f14",
        color: "#e6e6ea",
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        textAlign: "center",
        padding: 24,
      }}
    >
      <div>{stuck ? "Bu oynani yopishingiz mumkin." : "Kirish yakunlanmoqda…"}</div>
    </div>
  );
}
