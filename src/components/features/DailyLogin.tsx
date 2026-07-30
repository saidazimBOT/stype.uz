import { useState, useEffect, useCallback } from "react";
import type { DailyState } from "../../types";

const STORAGE_KEY = "typeuz_daily";

interface DailyRewardResult {
  xp: number;
  coins: number;
  bonus?: string;
}

interface DailyReturn extends DailyState {
  checkDaily: () => DailyState;
  claimReward: () => DailyRewardResult | undefined;
}

function getToday(): string {
  return new Date().toDateString();
}

function getDefaultState(): DailyState {
  return { lastLogin: null, streak: 0, claimedToday: false, totalLogins: 0, rewards: {} };
}

export function useDailyReward(): DailyReturn {
  const [state, setState] = useState<DailyState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return getDefaultState();
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const checkDaily = useCallback((): DailyState => {
    const today = getToday();
    if (state.lastLogin === today) return state;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const newStreak = state.lastLogin === yesterdayStr ? state.streak + 1 : 1;
    const newState: DailyState = {
      ...state,
      lastLogin: today,
      streak: newStreak,
      claimedToday: false,
      totalLogins: state.totalLogins + 1,
    };
    setState(newState);
    return newState;
  }, [state]);

  const claimReward = useCallback((): DailyRewardResult | undefined => {
    if (state.claimedToday) return;
    const rewards: Record<string, DailyRewardResult> = {
      day1: { xp: 50, coins: 10 },
      day2: { xp: 75, coins: 15 },
      day3: { xp: 100, coins: 25, bonus: "☀️" },
      day4: { xp: 125, coins: 30 },
      day5: { xp: 150, coins: 40, bonus: "⚡" },
      day6: { xp: 175, coins: 45 },
      day7: { xp: 500, coins: 100, bonus: "⭐" },
    };
    const dayKey = `day${Math.min(state.streak, 7)}`;
    const reward = rewards[dayKey] || rewards.day1;
    setState((s) => ({
      ...s,
      claimedToday: true,
      rewards: {
        ...s.rewards,
        [state.streak]: (s.rewards[state.streak] || 0) + 1,
      },
      totalXp: (s.totalXp || 0) + reward.xp,
      totalCoins: (s.totalCoins || 0) + reward.coins,
    }));
    return reward;
  }, [state.streak, state.claimedToday]);

  // Initialize on mount
  useEffect(() => {
    checkDaily();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ...state, checkDaily, claimReward };
}
