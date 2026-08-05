"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";

/**
 * Battle uchun profil: avtomatik anonim kirish + Convex'dagi user profili.
 */
export function useBattleProfile() {
  const { isLoading, isAuthenticated, error } = useConvexAuth();
  const { signIn } = useAuthActions();
  const me = useQuery(api.users.me);
  const setUsername = useMutation(api.users.setUsername);

  // Anonim tarzda avtomatik kirish (har bir brauzer uchun barqaror identifikator)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      signIn("anonymous").catch(() => {
        /* offlayn yoki backend sozlanmagan */
      });
    }
  }, [isLoading, isAuthenticated, signIn]);

  return {
    authLoading: isLoading,
    isAuthenticated,
    authError: error,
    me,
    setUsername,
  };
}
