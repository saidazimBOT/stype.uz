import { useState, useEffect, Dispatch, SetStateAction } from "react";

/**
 * SSR-safe localStorage hook.
 * - During SSR: returns `initialValue` (no `window` access).
 * - On the client: reads the real value from localStorage lazily on the
 *   FIRST render, so the stored value is correct from the very start and is
 *   never overwritten (clobbered) by the initial value.
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        return JSON.parse(item) as T;
      }
    } catch {
      // Ignore storage errors
    }
    return initialValue;
  });

  // Sync to localStorage on every change. Because `value` already reflects
  // the stored value on the first render, this never writes `initialValue`
  // over an existing value (the previous implementation did exactly that,
  // which wiped saved data on every page load).
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage errors
    }
  }, [key, value]);

  return [value, setValue];
}
