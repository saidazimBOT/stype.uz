/**
 * useUserSettings — localStorage + Supabase dual-sync.
 * 
 * - Kirilmagan → localStorage (avvalgidek ishlaydi)
 * - Kirilgan → localStorage + Supabase (qurilmalararo sinxronlash)
 * 
 * Har qanday holatda localStorage birinchi o'qiladi (tezlik uchun),
 * keyin Supabase'dan yangilanadi (agar farq bo'lsa).
 */
"use client";

import { useState, useEffect, useRef, useCallback, type Dispatch, type SetStateAction } from "react";
import { isSupabaseConfigured } from "../lib/supabase";
import { getMySettings, saveMySettings, getCurrentUserId } from "../lib/db";

export function useSyncedSettings<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initialValue);
  const [ready, setReady] = useState(false);
  const syncedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1) localStorage'dan o'qish (tez)
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) setValue(JSON.parse(item) as T);
    } catch {}
    setReady(true);
  }, [key]);

  // 2) Supabase'dan o'qish (keyinroq — agar kirilgan bo'lsa)
  useEffect(() => {
    if (!isSupabaseConfigured() || syncedRef.current || !ready) return;
    (async () => {
      const uid = await getCurrentUserId();
      if (!uid) { syncedRef.current = true; return; }
      try {
        const settings = await getMySettings();
        // Settings obyektidan key bo'yicha qiymatni olamiz
        const dbValue = settings[key as keyof typeof settings];
        if (dbValue !== undefined && dbValue !== null) {
          setValue(dbValue as T);
          // localStorage'ni ham yangilaymiz
          window.localStorage.setItem(key, JSON.stringify(dbValue));
        }
      } catch {}
      syncedRef.current = true;
    })();
  }, [key, ready]);

  // 3) localStorage'ga yozish
  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, [key, value, ready]);

  // 4) Supabase'ga yozish — debounce (2 soniya)
  useEffect(() => {
    if (!ready || !isSupabaseConfigured() || !syncedRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const uid = getCurrentUserId();
      uid.then((id) => {
        if (!id) return;
        const update: Record<string, unknown> = {};
        update[key] = value;
        saveMySettings(update).catch(() => {});
      });
    }, 2000);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [key, value, ready]);

  return [value, setValue];
}
