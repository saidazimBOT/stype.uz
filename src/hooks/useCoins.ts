import { useState, useCallback, useEffect } from "react";
import { DEFAULT_HERO_EQUIP, type HeroEquip, type HeroSlot } from "../data/shop";

const STORAGE_COINS = "typeuz_coins";
const STORAGE_PURCHASED = "typeuz_purchased";
const STORAGE_EFFECTS = "typeuz_effects";
/** Qahramon kiyimlari (heroEquip) localStorage kaliti — ProfileAvatar ham ishlatadi */
export const STORAGE_HERO = "typeuz_hero";

export interface CoinsState {
  coins: number;
  purchased: string[];       // IDs of purchased items (themes, avatars)
  activeEffects: string[];   // IDs of currently active effects
  activeAvatar: string;      // ID of currently active avatar
  heroEquip: HeroEquip;      // Qahramon kiyimlari (hat/glasses/outfit)
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

function getDefaultState(): CoinsState {
  return {
    coins: 50, // everyone starts with 50 free coins
    purchased: [],
    activeEffects: ["fx_sparkle"], // default effect always active
    activeAvatar: "avatar_default",
    heroEquip: { ...DEFAULT_HERO_EQUIP },
  };
}

export function useCoins(): CoinsReturn {
  const [state, setState] = useState<CoinsState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_COINS);
      const purchased = localStorage.getItem(STORAGE_PURCHASED);
      const effects = localStorage.getItem(STORAGE_EFFECTS);
      const hero = localStorage.getItem(STORAGE_HERO);
      const coins = saved ? parseInt(saved, 10) || 50 : 50;
      const pItems = purchased ? JSON.parse(purchased) : [];
      const eItems = effects ? JSON.parse(effects) : { activeEffects: ["fx_sparkle"], activeAvatar: "avatar_default" };
      const hItems = hero ? JSON.parse(hero) : {};
      return {
        coins,
        purchased: pItems,
        activeEffects: eItems.activeEffects || ["fx_sparkle"],
        activeAvatar: eItems.activeAvatar || "avatar_default",
        heroEquip: { ...DEFAULT_HERO_EQUIP, ...hItems },
      };
    } catch {
      return getDefaultState();
    }
  });

  // Persist coins
  useEffect(() => {
    localStorage.setItem(STORAGE_COINS, String(state.coins));
  }, [state.coins]);

  // Server (Convex) bilan sinxronlash — admin sovg'a qilgan coinlar hamyonga tushadi
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

  // Persist purchased
  useEffect(() => {
    localStorage.setItem(STORAGE_PURCHASED, JSON.stringify(state.purchased));
  }, [state.purchased]);

  // Persist active effects
  useEffect(() => {
    localStorage.setItem(
      STORAGE_EFFECTS,
      JSON.stringify({ activeEffects: state.activeEffects, activeAvatar: state.activeAvatar })
    );
  }, [state.activeEffects, state.activeAvatar]);

  // Persist hero equip
  useEffect(() => {
    localStorage.setItem(STORAGE_HERO, JSON.stringify(state.heroEquip));
  }, [state.heroEquip]);

  const addCoins = useCallback((amount: number) => {
    setState((s) => ({ ...s, coins: s.coins + amount }));
  }, []);

  const spendCoins = useCallback((amount: number): boolean => {
    let success = false;
    setState((s) => {
      if (s.coins >= amount) {
        success = true;
        return { ...s, coins: s.coins - amount };
      }
      return s;
    });
    return success;
  }, []);

  const purchase = useCallback((itemId: string, price: number): boolean => {
    let success = false;
    setState((s) => {
      if (s.purchased.includes(itemId)) return s; // already owned
      if (s.coins < price) return s; // not enough coins
      success = true;
      return {
        ...s,
        coins: s.coins - price,
        purchased: [...s.purchased, itemId],
      };
    });
    return success;
  }, []);

  const isPurchased = useCallback((itemId: string): boolean => {
    return state.purchased.includes(itemId);
  }, [state.purchased]);

  const equipAvatar = useCallback((avatarId: string) => {
    setState((s) => ({ ...s, activeAvatar: avatarId }));
  }, []);

  const equipHero = useCallback((slot: HeroSlot, itemId: string) => {
    setState((s) => ({ ...s, heroEquip: { ...s.heroEquip, [slot]: itemId } }));
  }, []);

  const toggleEffect = useCallback((effectId: string) => {
    setState((s) => {
      const active = s.activeEffects.includes(effectId)
        ? s.activeEffects.filter((e) => e !== effectId)
        : [...s.activeEffects, effectId];
      return { ...s, activeEffects: active };
    });
  }, []);

  const hasEffect = useCallback((effectId: string): boolean => {
    return state.activeEffects.includes(effectId);
  }, [state.activeEffects]);

  return {
    ...state,
    addCoins,
    spendCoins,
    purchase,
    isPurchased,
    equipAvatar,
    equipHero,
    toggleEffect,
    hasEffect,
    setCoins: (v) => setState((s) => ({
      ...s,
      coins: typeof v === "function" ? v(s.coins) : v,
    })),
  };
}
