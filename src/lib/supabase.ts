/**
 * Supabase mijoz — faqat `.env.local` da NEXT_PUBLIC_SUPABASE_URL va
 * NEXT_PUBLIC_SUPABASE_ANON_KEY yozilgan bo'lsa yoqiladi. Agar env yo'q bo'lsa,
 * sayt avvalgidek to'liq lokal rejimda ishlaydi (hech narsa buzilmaydi).
 *
 * XAVFSIZLIK: Bu yerda FAQAT anon (public) kalit ishlatiladi — u RLS bilan
 * himoyalangan. Service role / secret kalitlar frontendga hech qachon
 * qo'yilmaydi (ular faqat Supabase dashboard/SQL da ishlatiladi).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export function isSupabaseConfigured(): boolean {
  return !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
}

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;
