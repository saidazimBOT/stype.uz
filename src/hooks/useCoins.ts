import { useState, useCallback, useEffect } from "react";

const STORAGE_COINS = "typeuz_coins";
const STORAGE_PURCHASED = "typeuz_purchased";
const STORAGE_EFFECTS = "typeuz_effects";

export interface CoinsState {
  coins: number;
  purchased: string[];       // IDs of purchased items (themes, avatars)
  activeEffects: string[];   // IDs of currently active effects
  activeAvatar: string;      // ID of currently active avatar
}

export interface CoinsReturn extends CoinsState {
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  purchase: (itemId: string, price: number) => boolean;
  isPurchased: (itemId: string) => boolean;
  equipAvatar: (avatarId: string) => void;
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
  };
}

export function useCoins(): CoinsReturn {
  const [state, setState] = useState<CoinsState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_COINS);
      const purchased = localStorage.getItem(STORAGE_PURCHASED);
      const effects = localStorage.getItem(STORAGE_EFFECTS);
      const coins = saved ? parseInt(saved, 10) || 50 : 50;
      const pItems = purchased ? JSON.parse(purchased) : [];
      const eItems = effects ? JSON.parse(effects) : { activeEffects: ["fx_sparkle"], activeAvatar: "avatar_default" };
      return {
        coins,
        purchased: pItems,
        activeEffects: eItems.activeEffects || ["fx_sparkle"],
        activeAvatar: eItems.activeAvatar || "avatar_default",
      };
    } catch {
      return getDefaultState();
    }
  });

  // Persist coins
  useEffect(() => {
    localStorage.setItem(STORAGE_COINS, String(state.coins));
  }, [state.coins]);

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
    toggleEffect,
    hasEffect,
    setCoins: (v) => setState((s) => ({
      ...s,
      coins: typeof v === "function" ? v(s.coins) : v,
    })),
  };
}
