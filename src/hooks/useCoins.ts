import { useState, useCallback, useEffect, useRef } from "react";
import { DEFAULT_HERO_EQUIP, type HeroEquip, type HeroSlot } from "../data/shop";

/** Qahramon kiyimlari localStorage kaliti — ProfileAvatar ham ishlatadi */
export const STORAGE_HERO = "typeuz_hero";
import { isSupabaseConfigured } from "../lib/supabase";
import { getMyCosmetics, saveMyCosmetics, getMyProfile, getCurrentUserId } from "../lib/db";
import type { UserCosmetics } from "../lib/db";

export interface CoinsState {
  coins: number;
  purchased: string[];
  activeEffects: string[];
  activeAvatar: string;
  heroEquip: HeroEquip;
}

export interface CoinsReturn extends CoinsState {
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  purchase: (itemId: string, price: number) => boolean;
  isPurchased: (itemId: string) => boolean;
  equipAvatar: (avatarId: string) => void;
  equipHero: (slot: HeroSlot, itemId: string) => void;
  toggleEffect: (effectId: string) => void;
  hasEffect: (effectId: string) => boolean;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
}

export function useCoins(): CoinsReturn {
  const [state, setState] = useState<CoinsState>({
    coins: 50,
    purchased: [],
    activeEffects: ["fx_sparkle"],
    activeAvatar: "avatar_default",
    heroEquip: { ...DEFAULT_HERO_EQUIP },
  });
  const loadedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Supabase'dan yuklash
  useEffect(() => {
    if (!isSupabaseConfigured() || loadedRef.current) return;
    (async () => {
      const uid = await getCurrentUserId();
      if (!uid) { loadedRef.current = true; return; }
      try {
        const [profile, cosmetics] = await Promise.all([getMyProfile(), getMyCosmetics()]);
        setState({
          coins: profile?.coins ?? 50,
          purchased: cosmetics.purchased,
          activeEffects: cosmetics.activeEffects,
          activeAvatar: cosmetics.activeAvatar,
          heroEquip: { ...DEFAULT_HERO_EQUIP, ...(cosmetics.heroEquip as Record<string, string>) },
        });
      } catch {}
      loadedRef.current = true;
    })();
  }, []);

  // Cosmetics saqlash — debounce (500ms)
  useEffect(() => {
    if (!loadedRef.current || !isSupabaseConfigured()) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveMyCosmetics({
        purchased: state.purchased,
        activeEffects: state.activeEffects,
        activeAvatar: state.activeAvatar,
        heroEquip: state.heroEquip,
      }).catch(() => {});
    }, 500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [state.purchased, state.activeEffects, state.activeAvatar, state.heroEquip]);

  // Coins sync event (admin sovg'a)
  useEffect(() => {
    const onSync = (e: Event) => {
      const detail = (e as CustomEvent<number>).detail;
      if (typeof detail === "number" && Number.isFinite(detail) && detail > 0) {
        setState((s) => (detail > s.coins ? { ...s, coins: detail } : s));
      }
    };
    window.addEventListener("typeuz-coins-sync", onSync);
    return () => window.removeEventListener("typeuz-coins-sync", onSync);
  }, []);

  const addCoins = useCallback((amount: number) => {
    setState((s) => ({ ...s, coins: s.coins + amount }));
  }, []);

  const spendCoins = useCallback((amount: number): boolean => {
    let success = false;
    setState((s) => {
      if (s.coins >= amount) { success = true; return { ...s, coins: s.coins - amount }; }
      return s;
    });
    return success;
  }, []);

  const purchase = useCallback((itemId: string, price: number): boolean => {
    let success = false;
    setState((s) => {
      if (s.purchased.includes(itemId)) return s;
      if (s.coins < price) return s;
      success = true;
      return { ...s, coins: s.coins - price, purchased: [...s.purchased, itemId] };
    });
    return success;
  }, []);

  const isPurchased = useCallback((itemId: string): boolean => state.purchased.includes(itemId), [state.purchased]);
  const equipAvatar = useCallback((avatarId: string) => setState((s) => ({ ...s, activeAvatar: avatarId })), []);
  const equipHero = useCallback((slot: HeroSlot, itemId: string) => setState((s) => ({ ...s, heroEquip: { ...s.heroEquip, [slot]: itemId } })), []);
  const toggleEffect = useCallback((effectId: string) => {
    setState((s) => {
      const active = s.activeEffects.includes(effectId) ? s.activeEffects.filter((e) => e !== effectId) : [...s.activeEffects, effectId];
      return { ...s, activeEffects: active };
    });
  }, []);
  const hasEffect = useCallback((effectId: string): boolean => state.activeEffects.includes(effectId), [state.activeEffects]);

  return {
    ...state, addCoins, spendCoins, purchase, isPurchased, equipAvatar, equipHero, toggleEffect, hasEffect,
    setCoins: (v) => setState((s) => ({ ...s, coins: typeof v === "function" ? v(s.coins) : v })),
  };
}
