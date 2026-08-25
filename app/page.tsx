"use client";

import { useEffect, useState } from "react";
import App from "@/App";
import LenisProvider from "@/components/layout/LenisProvider";
import OAuthPopupClosing from "@/components/features/OAuthPopupClosing";
import { isOAuthPopup } from "@/lib/oauthPopup";

export default function Home() {
  // Google OAuth popup oynasida butun ilova emas, mitti "yopilmoqda" ekrani
  // ko'rsatiladi. Tekshiruv effekt ichida — server HTML bilan mos kelishi uchun.
  const [popup, setPopup] = useState(false);
  useEffect(() => {
    if (isOAuthPopup()) setPopup(true);
  }, []);

  if (popup) return <OAuthPopupClosing />;

  return (
    <LenisProvider>
      <App />
    </LenisProvider>
  );
}
