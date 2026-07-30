import { useState, useEffect, Dispatch, SetStateAction } from "react";

/**
 * SSR-safe localStorage hook.
 * - During SSR: always returns `initialValue` (no `window` access).
 * - During hydration: also returns `initialValue` so server & client match
 *   exactly — no hydration mismatch.
 * - After hydration (useEffect): reads the real value from localStorage.
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initialValue);

  // After hydration, read the actual value from localStorage
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setValue(JSON.parse(item));
      }
    } catch {
      // Ignore storage errors
    }
  }, [key]);

  // Sync to localStorage on every change
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage errors
    }
  }, [key, value]);

  return [value, setValue];
}
