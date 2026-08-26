"use client";

import { useEffect, useState } from "react";
import { FiShield, FiX } from "react-icons/fi";
import type { ThemeColors } from "../../types";
import { getT } from "../../data/i18n";
import { signInWithGoogle } from "../../lib/supabaseService";

interface LoginModalProps {
  t: ThemeColors;
  lang: string;
  onClose: () => void;
}

/**
 * Kirish oynasi — faqat Google OAuth orqali kirish.
 * Email + parol bilan kirish o'chirildi.
 */
export default function LoginModal({ t, lang, onClose }: LoginModalProps) {
  const T = getT(lang);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, []);

  const handleGoogle = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch {
      setError("Google bilan kirishda xatolik yuz berdi");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto" onClick={onClose}>
      <div
        className="w-full max-w-sm my-auto rounded-3xl overflow-hidden animate-pop-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: t.surface,
          border: `1px solid ${t.accent}44`,
          boxShadow: `0 0 60px ${t.accent}33`,
        }}
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 text-center" style={{ background: `${t.accent}11` }}>
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ background: `linear-gradient(90deg, ${t.accent}, #f59e0b, ${t.accent})` }}
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 transition-all"
            aria-label="Yopish"
          >
            <FiX size={18} className="text-gray-400" />
          </button>
          <div
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-3"
            style={{ background: `${t.accent}22`, border: `1px solid ${t.accent}55`, color: t.accent }}
          >
            <FiShield size={30} />
          </div>
          <h2 className="text-xl font-bold text-white">STypeUz ga kirish</h2>
          <p className="text-xs text-gray-500 mt-1">Google akkauntingiz orqali kiring</p>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-4">
          {/* Google Sign-In */}
          <button
            onClick={() => void handleGoogle()}
            disabled={busy}
            className="w-full px-6 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-3"
            style={{ background: "#ffffff0d", color: "#fff", border: "1px solid #ffffff22" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {busy ? "Yuklanmoqda..." : "Continue with Google"}
          </button>

          {error && (
            <div className="text-xs text-red-400 animate-pop-in px-1 text-center">{error}</div>
          )}

          <p className="text-center text-[10px] text-gray-600 leading-relaxed">
            Kirish orqali sizning Google akkauntingiz yangi STypeUz akkaunti yaratiladi
          </p>

          <button type="button" onClick={onClose}
            className="w-full text-center text-xs text-gray-500 hover:text-gray-300 transition-all">
            ← Orqaga
          </button>
        </div>
      </div>
    </div>
  );
}
