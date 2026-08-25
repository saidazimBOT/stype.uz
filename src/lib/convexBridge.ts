/**
 * App.tsx uchun typing recorder ko'prigi.
 * SiteOverlays ichidagi TypingRecorderBridge komponenti
 * recordTypingResult funksiyasini window ga o'rnatadi.
 */
export interface RecordTypingArgs {
  wpm: number;
  accuracy: number;
  errors: number;
  correct?: number;
  total?: number;
  time?: number;
  lang: string;
  duration: number;
  username?: string;
}

type Recorder = (args: RecordTypingArgs) => Promise<unknown>;

/** Typing recorder funksiyasini olish (SiteOverlays o'rnatadi) */
export function getTypingRecorder(): Recorder | null {
  try {
    return (window as Record<string, unknown>).__typingRecorder as Recorder | null;
  } catch {
    return null;
  }
}

/** Joriy foydalanuvchining ID si (Supabase Auth) */
export function getUserToken(): string | null {
  try {
    return (window as Record<string, unknown>).__userToken as string | null;
  } catch {
    return null;
  }
}
