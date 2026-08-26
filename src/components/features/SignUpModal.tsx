"use client";

import { useEffect, useState } from "react";
import { FiCheck, FiSmile, FiUser, FiX } from "react-icons/fi";
import type { ThemeColors } from "../../types";
import { AVATAR_SHOP, getAvatarInfo } from "../../data/shop";
import { getT } from "../../data/i18n";
import type { IconType } from "react-icons";
import ProfileAvatar from "./ProfileAvatar";
import { signInWithGoogle } from "../../lib/supabaseService";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";

interface SignUpModalProps {
  t: ThemeColors;
  lang: string;
  initial?: {
    firstName?: string;
    lastName?: string;
    photo?: string;
    avatarId?: string;
    signedUpAt?: number;
  };
  onSave: (profile: {
    firstName: string;
    lastName: string;
    photo: string;
    avatarId: string;
    signedUpAt: number;
  }) => void;
  onClose?: () => void;
  required?: boolean;
}

/**
 * Ro'yxatdan o'tish oynasi — faqat Google OAuth + unikal username.
 * Email + parol bilan ro'yxatdan o'tish o'chirildi.
 */
export default function SignUpModal({ t, lang, initial, onSave, onClose, required = true }: SignUpModalProps) {
  const T = getT(lang);

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

  const [firstName, setFirstName] = useState(initial?.firstName || "");
  const [lastName, setLastName] = useState(initial?.lastName || "");
  const [photo, setPhoto] = useState(initial?.photo || "");
  const [avatarId, setAvatarId] = useState(initial?.avatarId || "avatar_default");
  const [tab, setTab] = useState<"photo" | "avatar">("avatar");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const firstNameValid = firstName.trim().length >= 2;

  // Username tekshirish — Supabase'da mavjudligini check qilish
  const checkUsername = async (name: string) => {
    if (!supabase || !isSupabaseConfigured()) return;
    const clean = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (clean.length < 2) {
      setUsernameAvailable(null);
      return;
    }
    setCheckingUsername(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", clean)
        .maybeSingle();
      setUsernameAvailable(!data);
    } catch {
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  // Username o'zgarganda tekshirish (debounce)
  useEffect(() => {
    if (!firstName.trim()) {
      setUsernameAvailable(null);
      return;
    }
    const timeout = setTimeout(() => void checkUsername(firstName), 400);
    return () => clearTimeout(timeout);
  }, [firstName]);

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

  const save = () => {
    if (!firstNameValid) {
      setError("Ism kamida 2 ta belgi bo'lishi kerak");
      return;
    }
    if (usernameAvailable === false) {
      setError("Bu username allaqachon band boshqasini kiriting");
      return;
    }
    onSave({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      photo,
      avatarId,
      signedUpAt: initial?.signedUpAt ?? Date.now(),
    });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto" onClick={onClose}>
      <div
        className="w-full max-w-md my-auto rounded-3xl overflow-hidden animate-pop-in"
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
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 transition-all"
              aria-label="Yopish"
            >
              <FiX size={18} className="text-gray-400" />
            </button>
          )}
          <div
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-3"
            style={{ background: `${t.accent}22`, border: `1px solid ${t.accent}55`, color: t.accent }}
          >
            <FiUser size={30} />
          </div>
          <h2 className="text-xl font-bold text-white">STypeUz ga qo'shilish</h2>
          <p className="text-xs text-gray-500 mt-1">Google orqali kiring, username tanlang</p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Google Sign-In — birinchi qadam */}
          <button
            onClick={() => void handleGoogle()}
            disabled={busy}
            className="w-full px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
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

          {/* Ikkinchi qadam — username + avatar (faqat Google kirgan bo'lsa) */}
          <div className="pt-2 border-t border-white/5 space-y-4">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest text-center">
              2-qadam: Username tanlang
            </div>

            {/* Username */}
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1.5">
                Username *
              </label>
              <div className="relative">
                <input
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    setError(null);
                  }}
                  placeholder="masalan: sardor"
                  maxLength={20}
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: "#ffffff0d",
                    border: `1px solid ${
                      usernameAvailable === false ? "#f8717144" :
                      usernameAvailable === true ? "#22c55e44" :
                      firstNameValid ? t.accent + "55" : "#ffffff14"
                    }`,
                    color: "#fff",
                  }}
                />
                {checkingUsername && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-600 border-t-gray-400 animate-spin" />
                  </div>
                )}
                {!checkingUsername && usernameAvailable === true && (
                  <FiCheck size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400" />
                )}
                {!checkingUsername && usernameAvailable === false && (
                  <FiX size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400" />
                )}
              </div>
              {usernameAvailable === false && (
                <div className="text-[10px] text-red-400 mt-1">Bu username band — boshqasini kiriting</div>
              )}
              {usernameAvailable === true && (
                <div className="text-[10px] text-green-400 mt-1">Username mavjud!</div>
              )}
            </div>

            {/* Avatar tanlash */}
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1.5">
                Avatar
              </label>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_SHOP.map((a) => {
                  const info = getAvatarInfo(a.id);
                  const AvIcon = info.icon as IconType;
                  const selected = avatarId === a.id;
                  return (
                    <button
                      key={a.id}
                      onClick={() => setAvatarId(a.id)}
                      title={a.name}
                      className="relative aspect-square rounded-xl flex items-center justify-center transition-all hover:scale-110"
                      style={{
                        background: selected ? `${a.color}33` : "#ffffff0d",
                        border: `2px solid ${selected ? a.color : "#ffffff14"}`,
                        boxShadow: selected ? `0 0 14px ${a.color}55` : undefined,
                      }}
                    >
                      <AvIcon size={20} style={{ color: a.color }} />
                      {selected && (
                        <span
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ background: a.color, color: "#000" }}
                        >
                          <FiCheck size={10} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-xs text-red-400 animate-pop-in px-1 text-center">{error}</div>
          )}

          {/* Submit */}
          <button
            onClick={() => void save()}
            disabled={!firstNameValid || usernameAvailable === false || busy}
            className="w-full px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: t.accent, color: "#000" }}
          >
            <FiCheck size={15} />
            {initial ? "Saqlash" : "Ro'yxatdan o'tish"}
          </button>

          <p className="text-center text-[10px] text-gray-600">
            Google orqali kirib, username tanlang — shu bilan akkaunt yaratiladi
          </p>

          {onClose && (
            <button type="button" onClick={onClose}
              className="w-full text-center text-xs text-gray-500 hover:text-gray-300 transition-all">
              ← Orqaga
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
