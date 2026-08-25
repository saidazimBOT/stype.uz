/**
 * useBattleProfile — foydalanuvchi profilini Supabase'dan oladi.
 * Avval Convex useQuery/api.users.me ishlatgan, endi Supabase.
 */
"use client";

import { useSupabaseQuery } from "./useSupabaseQuery";
import { getMyProfile, updateProfile } from "../lib/db";
import type { ProfileRow } from "../lib/db";

export function useBattleProfile() {
  const { data: me, loading, refetch } = useSupabaseQuery(() => getMyProfile());

  const setUsername = async (updates: {
    username: string;
    avatar?: string;
    firstName?: string;
    lastName?: string;
    signedUpAt?: number;
    coins?: number;
    xp?: number;
  }) => {
    await updateProfile({
      username: updates.username,
      avatar: updates.avatar,
      first_name: updates.firstName,
      last_name: updates.lastName,
      coins: updates.coins,
      xp: updates.xp,
    });
    refetch();
  };

  return {
    me: me as ProfileRow | null | undefined,
    isLoading: loading,
    setUsername,
    refetch,
  };
}
