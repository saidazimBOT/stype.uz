"use client";

import { useState, useEffect, useRef, useCallback, type Dispatch, type SetStateAction } from "react";

/**
 * useSyncedSettings — faqat localStorage bilan ishlaydi.
 * Supabase sync — alohida AccountSyncBridge komponenti tomonidan boshqariladi.
 * Bu tuzatish React #310 (infinite render loop) xatosini oldini oladi.
 */
export function useSyncedSettings<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      if (typeof window !== "undefined") {
        const item = window.localStorage.getItem(key);
        if (item !== null) return JSON.parse(item) as T;
      }
    } catch {}
    return initialValue;
  });

  // localStorage'ga yozish — faqat value o'zgarganda
  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, [key, value]);

  return [value, setValue];
}
