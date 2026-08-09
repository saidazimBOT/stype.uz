"use client";

import { useRef, useState } from "react";
import { FiCamera, FiCheck, FiImage, FiLock, FiMail, FiSmile, FiUser, FiX } from "react-icons/fi";
import type { ThemeColors } from "../../types";
import { AVATAR_SHOP, getAvatarInfo } from "../../data/shop";
import { getT } from "../../data/i18n";
import type { IconType } from "react-icons";
import ProfileAvatar from "./ProfileAvatar";
import { isSupabaseConfigured } from "../../lib/supabase";
import { signUpWithEmail } from "../../lib/supabaseService";

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
  /** Kirish oynasiga o'tish (Supabase sozlangan bo'lsa) */
  onLoginRequest?: () => void;
  /** Birinchi kirishda majburiy bo'lsa close tugmasi yashiriladi */
  required?: boolean;
}

/**
 * Sign up oynasi — ism, familiya va profil rasmi so'raydi.
 * Rasmni qurilmadan yuklash (galereya) yoki tayyor avatar tanlash mumkin.
 */
export default function SignUpModal({ t, lang, initial, onSave, onClose, onLoginRequest, required = true }: SignUpModalProps) {
  const T = getT(lang);
  const cloud = isSupabaseConfigured();
  const registering = !initial;
  const [firstName, setFirstName] = useState(initial?.firstName || "");
  const [lastName, setLastName] = useState(initial?.lastName || "");
  const [photo, setPhoto] = useState(initial?.photo || "");
  const [avatarId, setAvatarId] = useState(initial?.avatarId || "avatar_default");
  const [tab, setTab] = useState<"photo" | "avatar">(initial?.photo ? "photo" : "avatar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const firstNameValid = firstName.trim().length >= 2;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordValid = password.length >= 6;

  // Supabase'da ro'yxatdan o'tish (register) — email + parol bilan
  const registerCloud = async (): Promise<string | null> => {
    if (!emailValid) return T("signup.errEmail");
    if (!passwordValid) return T("signup.errPassword");
    try {
      const res = await signUpWithEmail(
        email.trim(),
        password,
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          photo,
          avatarId,
          signedUpAt: initial?.signedUpAt ?? Date.now(),
        }
      );
      // Email tasdiqlash yoqilgan bo'lsa session bo'lmaydi — foydalanuvchiga aytamiz
      if (res.user && !res.session) {
        setInfo(T("signup.confirmEmail"));
      }
      return null;
    } catch (e) {
      const msg = (e as Error)?.message?.toLowerCase() || "";
      if (msg.includes("already")) return T("signup.errAuth");
      if (msg.includes("network") || msg.includes("fetch") || msg.includes("failed")) {
        return T("signup.errNetwork");
      }
      return `${T("signup.errAuth")}${(e as Error)?.message ? ` — ${(e as Error).message}` : ""}`;
    }
  };

  // Rasmni yuklash + kichiklashtirish (localStorage uchun) → data URL
  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(T("signup.errPhotoType"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(T("signup.errPhotoSize"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // 256px gacha kichiklashtiramiz (localStorage chegarasi uchun)
        const max = 256;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        try {
          const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
          setPhoto(dataUrl);
          setError(null);
        } catch {
          setError(T("signup.errProcess"));
        }
      };
      img.onerror = () => setError(T("signup.errRead"));
      img.src = String(reader.result);
    };
    reader.onerror = () => setError(T("signup.errFile"));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!firstNameValid) {
      setError(T("signup.errName"));
      return;
    }
    // Ro'yxatdan o'tishda Supabase'ga ham yozamiz (email + parol bilan)
    if (cloud && registering) {
      setBusy(true);
      setError(null);
      const err = await registerCloud();
      setBusy(false);
      if (err) {
        setError(err);
        return;
      }
    }
    onSave({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      photo,
      avatarId,
      // Tahrirlashda "member since" sanasi saqlanadi (qayta yozilmaydi)
      signedUpAt: initial?.signedUpAt ?? Date.now(),
    });
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
          {!required && onClose && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 transition-all"
              aria-label={T("signup.close")}
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
          <h2 className="text-xl font-bold text-white">{T("signup.header")}</h2>
          <p className="text-xs text-gray-500 mt-1">
            {T("signup.subtitle")}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Ism / Familiya */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1.5">
                {T("signup.firstName")}
              </label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={T("signup.fnPlaceholder")}
                maxLength={30}
                autoFocus={!initial}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2"
                style={{
                  background: "#ffffff0d",
                  border: `1px solid ${firstNameValid ? t.accent + "55" : "#ffffff14"}`,
                  color: "#fff",
                }}
                onFocus={(e) => (e.target.style.boxShadow = `0 0 0 3px ${t.accent}22`)}
                onBlur={(e) => (e.target.style.boxShadow = "")}
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1.5">
                {T("signup.lastName")}
              </label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={T("signup.lnPlaceholder")}
                maxLength={30}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "#ffffff0d", border: "1px solid #ffffff14", color: "#fff" }}
              />
            </div>
          </div>

          {/* Account (Supabase sozlangan bo'lsa — email + parol) */}
          {cloud && registering && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest">
                  {T("signup.accountSection")}
                </span>
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1.5">
                  {T("signup.email")} *
                </label>
                <div className="relative">
                  <FiMail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={T("signup.emailPlaceholder")}
                    autoComplete="email"
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
                  {T("signup.password")} *
                </label>
                <div className="relative">
                  <FiLock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={T("signup.passwordPlaceholder")}
                    autoComplete="new-password"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2"
                    style={{
                      background: "#ffffff0d",
                      border: `1px solid ${passwordValid || password === "" ? t.accent + "55" : "#f8717144"}`,
                      color: "#fff",
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Rasm / Avatar tabs */}
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1.5">
              {T("signup.profilePhoto")}
            </label>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setTab("photo")}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: tab === "photo" ? `${t.accent}22` : "#ffffff0d",
                  color: tab === "photo" ? t.accent : "#9ca3af",
                  border: `1px solid ${tab === "photo" ? t.accent + "55" : "#ffffff14"}`,
                }}
              >
                <FiCamera size={13} /> {T("signup.uploadPhoto")}
              </button>
              <button
                onClick={() => setTab("avatar")}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: tab === "avatar" ? `${t.accent}22` : "#ffffff0d",
                  color: tab === "avatar" ? t.accent : "#9ca3af",
                  border: `1px solid ${tab === "avatar" ? t.accent + "55" : "#ffffff14"}`,
                }}
              >
                <FiSmile size={13} /> {T("signup.chooseAvatar")}
              </button>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-4 mb-3">
              <div className="flex-shrink-0">
                {tab === "photo" && photo ? (
                  <img
                    src={photo}
                    alt={T("signup.photoAlt")}
                    width={72}
                    height={72}
                    className="rounded-full object-cover"
                    style={{ width: 72, height: 72, border: `2px solid ${t.accent}` }}
                  />
                ) : (
                  <ProfileAvatar
                    profile={{ firstName, lastName, photo: "", avatarId, signedUpAt: 0 }}
                    size={72}
                  />
                )}
              </div>
              {tab === "photo" ? (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                  style={{ background: `${t.accent}22`, border: `1px solid ${t.accent}55`, color: t.accent }}
                >
                  <FiImage size={14} />
                  {photo ? T("signup.changePhoto") : T("signup.selectPhoto")}
                </button>
              ) : (
                <div className="flex-1 text-xs text-gray-500">
                  {T("signup.avatarHint")}
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>

            {/* Avatar grid */}
            {tab === "avatar" && (
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
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="text-xs text-red-400 animate-pop-in px-1">{error}</div>
          )}
          {/* Info (masalan: email tasdiqlash kerak) */}
          {info && (
            <div
              className="text-xs animate-pop-in px-3 py-2.5 rounded-xl"
              style={{ background: "#22c55e11", border: "1px solid #22c55e33", color: "#4ade80" }}
            >
              {info}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={() => void save()}
            disabled={!firstNameValid || (cloud && registering ? !emailValid || !passwordValid || busy : false)}
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
                <FiCheck size={15} />
                {initial ? T("signup.save") : T("signup.register")}
              </>
            )}
          </button>
          <p className="text-center text-[10px] text-gray-600">
            {cloud && registering ? T("signup.accountNote") : T("signup.footerNote")}
          </p>
          {cloud && registering && onLoginRequest && (
            <button
              onClick={onLoginRequest}
              className="w-full text-center text-xs font-medium transition-all hover:opacity-80"
              style={{ color: t.accent }}
            >
              {T("signup.haveAccount")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
