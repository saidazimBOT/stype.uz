import { useState, useEffect, Dispatch, SetStateAction } from "react";

/**
 * SSR-safe localStorage hook.
 * - During SSR and the client's FIRST render: returns `initialValue`, so the
 *   server HTML and the hydrated UI always match (no hydration mismatch).
 * - After hydration (useEffect): reads the real value from localStorage and
 *   updates the state — the stored value becomes correct without clobbering.
 * - Writes are gated on `ready`: localStorage is only written AFTER the
 *   stored value has been read, so `initialValue` is never written over an
 *   existing saved value (which wiped user data on every page load).
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initialValue);
  const [ready, setReady] = useState(false);

  // Hydration tugagach haqiqiy qiymatni o'qiymiz — shu paytgacha initialValue
  // ko'rsatiladi, shuning uchun SSR HTML bilan mos tushadi (mismatch yo'q).
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setValue(JSON.parse(item) as T);
      }
    } catch {
      // Ignore storage errors
    }
    setReady(true);
  }, [key]);

  // Faqat stored qiymat o'qilgandan KEYIN yozamiz — aks holda initialValue
  // saqlangan ma'lumotni ustiga yozib qo'yishi mumkin.
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage errors
    }
  }, [key, value, ready]);

  return [value, setValue];
}
