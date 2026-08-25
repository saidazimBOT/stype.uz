"use client";

import { useState, useEffect, useRef } from "react";
import { isSupabaseConfigured } from "../lib/supabase";
import { getMyProfile, updateProfile, getCurrentUserId } from "../lib/db";

export interface UserProfile {
  firstName: string;
  lastName: string;
  photo: string;
  avatarId: string;
  signedUpAt: number;
}

export const PROFILE_KEY = "typeuz_profile";

export function fullName(p: UserProfile | null | undefined): string {
  if (!p) return "";
  return [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
}

export function usernameFromProfile(p: UserProfile): string {
  const base = p.firstName.trim().toLowerCase();
  const clean = base.replace(/[^a-zA-Z0-9_\u0400-\u04FF]/g, "");
  if (clean.length >= 2) return clean.slice(0, 20);
  const last = p.lastName.trim().toLowerCase().replace(/[^a-zA-Z0-9_\u0400-\u04FF]/g, "");
  if ((clean + last).length >= 2) return (clean + last).slice(0, 20);
  return `user${Math.floor(1000 + Math.random() * 9000)}`;
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const loadedRef = useRef(false);

  // Supabase'dan yuklash
  useEffect(() => {
    if (!isSupabaseConfigured() || loadedRef.current) return;
    (async () => {
      const uid = await getCurrentUserId();
      if (!uid) {
        // Lokaldan ham tekshiramiz (Supabase sozlanmagan bo'lsa)
        try {
          const raw = window.localStorage.getItem(PROFILE_KEY);
          if (raw) setProfile(JSON.parse(raw));
        } catch {}
        loadedRef.current = true;
        return;
      }
      try {
        const p = await getMyProfile();
        if (p) {
          setProfile({
            firstName: p.first_name || "",
            lastName: p.last_name || "",
            photo: p.photo || "",
            avatarId: p.avatar_id || "avatar_default",
            signedUpAt: new Date(p.created_at).getTime(),
          });
        }
      } catch {}
      loadedRef.current = true;
    })();
  }, []);

  const saveProfile = async (p: UserProfile) => {
    setProfile(p);
    // Supabase'ga saqlash
    if (isSupabaseConfigured()) {
      const uid = await getCurrentUserId();
      if (uid) {
        await updateProfile({
          first_name: p.firstName,
          last_name: p.lastName,
          avatar_id: p.avatarId,
          avatar: p.avatarId,
        }).catch(() => {});
      }
    }
    // Lokalga ham saqlash (fallback)
    try { window.localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch {}
  };

  const clearProfile = () => setProfile(null);

  return { profile, saveProfile, clearProfile, isSignedUp: !!profile };
}
