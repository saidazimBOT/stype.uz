/**
 * Custom hooks that replace Convex's useQuery/useMutation with Supabase.
 *
 * Usage:
 *   const { data, loading, refetch } = useSupabaseQuery(() => listAllProfiles());
 *   const mutate = useSupabaseMutation();
 *   await mutate(() => saveAnnouncement({...}));
 */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { isSupabaseConfigured } from "../lib/supabase";

/**
 * Convex useQuery o'rniga — Supabase'dan ma'lumot olish.
 * queryFn har render/refresh'da qayta chaqiriladi.
 */
export function useSupabaseQuery<T>(
  queryFn: () => Promise<T>,
  deps: unknown[] = []
): { data: T | null; loading: boolean; error: Error | null; refetch: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const result = await queryFn();
      if (mountedRef.current) {
        setData(result);
        setError(null);
      }
    } catch (e) {
      if (mountedRef.current) setError(e as Error);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    void fetchData();
    return () => { mountedRef.current = false; };
  }, [fetchData]);

  const refetch = useCallback(() => { void fetchData(); }, [fetchData]);

  return { data, loading, error, refetch };
}

/**
 * Convex useMutation o'rniga — async funksiya chaqirish + loading/error state.
 *
 * Usage:
 *   const mutate = useSupabaseMutation();
 *   await mutate(() => saveAnnouncement({...}));
 */
export function useSupabaseMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      return result;
    } catch (e) {
      setError(e as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, loading, error };
}
