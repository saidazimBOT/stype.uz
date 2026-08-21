

"use client";

import { useState } from "react";
import { FiLock, FiLogIn, FiMail, FiShield, FiX } from "react-icons/fi";
import type { ThemeColors } from "../../types";
import { getT } from "../../data/i18n";
import { PROFILE_KEY, type UserProfile } from "../../hooks/useProfile";
import { signInWithEmail, upsertProfile } from "../../lib/supabaseService";

interface LoginModalProps {
  t: ThemeColors;
  lang: string;
  onSuccess: (profile: UserProfile) => void;
  onSignUpRequest?: () => void;
  onClose: () => void;
}

/** Existing lokal profilni o'qiymiz (login'da uni yo'qotmaymiz) */
function readLocalProfile(): UserProfile | null {
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

/**
 * Kirish oynasi — Supabase Auth orqali (email + parol).
 * Muvaffaqiyatli kirishda:
 *  - last_login avtomatik yangilanadi,
 *  - lokal profil Supabase bilan sinxronlanadi,
 *  - onSuccess(profile) orqali asosiy saytga qaytadi.
 */
export default function LoginModal({ t, lang, onSuccess, onSignUpRequest, onClose }: LoginModalProps) {
  const T = getT(lang);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const submit = async () => {
    if (!emailValid || !password) return;
    setBusy(true);
    setError(null);
    try {
      const res = await signInWithEmail(email.trim(), password);
      const user = res.user;
      if (!user) throw new Error("no user");

      // Metadatadan profil yaratamiz; mavjud lokal profil bo'lsa uni saqlaymiz
      const md = (user.user_metadata || {}) as Record<string, string | undefined>;
      const local = readLocalProfile();
      const profile: UserProfile = local ?? {
        firstName: md.firstName || email.trim().split("@")[0] || "User",
        lastName: md.lastName || "",
        photo: "",
        avatarId: md.avatarId || "avatar_default",
        signedUpAt: Date.now(),
      };
      // Lokal profilni Supabase'ga sinxronlash (ism/familiya/avatar)
      await upsertProfile(profile).catch(() => {});
      onSuccess(profile);
    } catch (e) {
      const msg = (e as Error)?.message?.toLowerCase() || "";
      setError(msg.includes("invalid") || msg.includes("credentials") ? T("login.errInvalid") : T("login.errGeneric"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden animate-pop-in"
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
            aria-label={T("login.close")}
          >
            <FiX size={18} className="text-gray-400" />
          </button>
          <div
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-3"
            style={{ background: `${t.accent}22`, border: `1px solid ${t.accent}55`, color: t.accent }}
          >
            <FiShield size={30} />
          </div>
          <h2 className="text-xl font-bold text-white">{T("login.header")}</h2>
          <p className="text-xs text-gray-500 mt-1">{T("login.subtitle")}</p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1.5">
              {T("login.email")} *
            </label>
            <div className="relative">
              <FiMail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void submit()}
                placeholder="you@mail.com"
                autoComplete="email"
                autoFocus
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2"
                style={{
                  background: "#ffffff0d",
                  border: `1px solid ${emailValid || email === "" ? t.accent + "55" : "#f8717144"}`,
                  color: "#fff",
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1.5">
              {T("login.password")} *
            </label>
            <div className="relative">
              <FiLock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void submit()}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2"
                style={{
                  background: "#ffffff0d",
                  border: `1px solid ${password ? t.accent + "55" : "#ffffff14"}`,
                  color: "#fff",
                }}
              />
            </div>
          </div>

          {error && <div className="text-xs text-red-400 animate-pop-in px-1">{error}</div>}

          <button
            onClick={() => void submit()}
            disabled={!emailValid || !password || busy}
            className="w-full px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: t.accent, color: "#000" }}
          >
            {busy ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                ...
              </>
            ) : (
              <>
                <FiLogIn size={15} />
                {T("login.submit")}
              </>
            )}
          </button>

          <p className="text-center text-[10px] text-gray-600">{T("login.footerNote")}</p>

          {onSignUpRequest && (
            <button
              onClick={onSignUpRequest}
              className="w-full text-center text-xs font-medium transition-all hover:opacity-80"
              style={{ color: t.accent }}
            >
              {T("login.noAccount")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
