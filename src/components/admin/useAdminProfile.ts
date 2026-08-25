/**
 * useAdminProfile — admin profilini Supabase'dan oladi.
 */
"use client";

import { useSupabaseQuery } from "../../hooks/useSupabaseQuery";
import { getMyProfile } from "../../lib/db";

export default function useAdminProfile() {
  const { data: me, loading: isLoading, refetch } = useSupabaseQuery(() => getMyProfile());

  return {
    me: me as { role?: string; username?: string } | null | undefined,
    isLoading,
    refetch,
  };
}
