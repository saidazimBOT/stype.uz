"use client";

import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../../convex/_generated/api";
import type { AdminUser } from "./types";

/**
 * Admin panel uchun auth holati.
 * Faqat Convex sozlangan (NEXT_PUBLIC_CONVEX_URL) va provider ichida ishlatiladi.
 */
export function useAdminProfile() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me) as (AdminUser & { tokenIdentifier?: string }) | null | undefined;
  const myToken = useQuery(api.users.myToken) as string | null | undefined;
  const claim = useMutation(api.admin.claimAdmin);
  const { signIn, signOut } = useAuthActions();

  return {
    authLoading: isLoading,
    isAuthenticated,
    me: me ?? null,
    myToken: myToken ?? null,
    isServerAdmin: !!me && (me.role === "admin" || me.role === "owner"),
    signIn: () => signIn("anonymous"),
    signOut: () => signOut(),
    claimAdmin: claim,
  };
}

export function errMsg(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  return "Xatolik yuz berdi";
}
