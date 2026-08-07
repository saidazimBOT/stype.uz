"use client";

import { useLocalStorage } from "./useLocalStorage";
import { storeUsername } from "../lib/battle";

/**
 * Foydalanuvchi profili — localStorage'da saqlanadi.
 * Har bir brauzer (foydalanuvchi) uchun ALOHIDA profil: ism, familiya, rasm/avatar.
 */
export interface UserProfile {
  firstName: string;
  lastName: string;
  /** Yuklangan rasm (data URL) yoki "" agar avatar ishlatilsa */
  photo: string;
  /** Shop avatari ID si (photo bo'lmasa ko'rsatiladi) */
  avatarId: string;
  /** Ro'yxatdan o'tgan vaqt (member since) */
  signedUpAt: number;
}

export const PROFILE_KEY = "typeuz_profile";

export function fullName(p: UserProfile | null | undefined): string {
  if (!p) return "";
  return [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
}

/** Profil uchun "username" — battle va chatda ko'rinadi (faqat lotin/kirill/raqam/_) */
export function usernameFromProfile(p: UserProfile): string {
  const base = p.firstName.trim().toLowerCase();
  const clean = base.replace(/[^a-zA-Z0-9_\u0400-\u04FF]/g, "");
  if (clean.length >= 2) return clean.slice(0, 20);
  // Ism juda qisqa bo'lsa familiya bilan to'ldiramiz
  const last = p.lastName.trim().toLowerCase().replace(/[^a-zA-Z0-9_\u0400-\u04FF]/g, "");
  if ((clean + last).length >= 2) return (clean + last).slice(0, 20);
  return `user${Math.floor(1000 + Math.random() * 9000)}`;
}

export function useProfile() {
  const [profile, setProfile] = useLocalStorage<UserProfile | null>(PROFILE_KEY, null);

  const saveProfile = (p: UserProfile) => {
    setProfile(p);
    // Battle/chat username bilan sinxronlash
    storeUsername(usernameFromProfile(p));
  };

  const clearProfile = () => setProfile(null);

  return { profile, saveProfile, clearProfile, isSignedUp: !!profile };
}
