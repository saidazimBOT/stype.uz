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
  const loadedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);

  // 1) localStorage'dan o'qish (tez) + Supabase'dan o'qish (bir marta)
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    // localStorage
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        const parsed = JSON.parse(item) as T;
        setValue(parsed);
        // localStorage'ga yozish kerak emas — allaqachon bor
      }
    } catch {}

    // Supabase (async, keyinroq)
    if (isSupabaseConfigured()) {
      void (async () => {
        try {
          const uid = await getCurrentUserId();
          if (!uid) return;
          const settings = await getMySettings();
          const dbValue = settings[key as keyof typeof settings];
          if (dbValue !== undefined && dbValue !== null) {
            const currentStr = JSON.stringify(value);
            const dbStr = JSON.stringify(dbValue);
            if (currentStr !== dbStr) {
              setValue(dbValue as T);
              try { window.localStorage.setItem(key, dbStr); } catch {}
            }
          }
        } catch {}
        loadedRef.current = true;
      })();
    } else {
      loadedRef.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // 2) localStorage'ga yozish — faqat user o'zgartirganda
  useEffect(() => {
    if (!mountedRef.current) return;
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, [key, value]);

  // 3) Supabase'ga yozish — debounce (2 soniya), faqat loaded bo'lgandan keyin
  const setValueAndSync: Dispatch<SetStateAction<T>> = useCallback((v) => {
    setValue((prev) => {
      const next = typeof v === "function" ? (v as (prev: T) => T)(prev) : v;
      // localStorage
      try { window.localStorage.setItem(key, JSON.stringify(next)); } catch {}
      // Supabase debounce
      if (loadedRef.current && isSupabaseConfigured()) {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
          void (async () => {
            try {
              const uid = await getCurrentUserId();
              if (!uid) return;
              const update: Record<string, unknown> = {};
              update[key] = next;
              await saveMySettings(update);
            } catch {}
          })();
        }, 2000);
      }
      return next;
    });
  }, [key]);

  return [value, setValueAndSync];
}
