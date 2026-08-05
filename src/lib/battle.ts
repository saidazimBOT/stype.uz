"use client";

import { type ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";

export const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";

let client: ConvexReactClient | null = null;

export function getConvexClient(): ConvexReactClient | null {
  if (!CONVEX_URL) return null;
  if (!client) client = new ConvexReactClient(CONVEX_URL);
  return client;
}

/**
 * Multiplayer konfiguratsiya qilingan bo'lsa ConvexAuthProvider bilan,
 * aks holda oddiy children qaytaradi (saytning qolgan qismi buzilmaydi).
 */
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const c = getConvexClient();
  if (!c) return <>{children}</>;
  return <ConvexAuthProvider client={c}>{children}</ConvexAuthProvider>;
}

export const USERNAME_KEY = "typeuz_username";

export function getStoredUsername(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(USERNAME_KEY) || "";
  } catch {
    return "";
  }
}

export function storeUsername(name: string) {
  try {
    localStorage.setItem(USERNAME_KEY, name);
  } catch {
    /* ignore */
  }
}
