/**
 * App.tsx (provider tashqarisida) Convex'ga natija yozish uchun ko'prik.
 * SiteOverlays ichidagi TypingRecorderBridge komponenti ro'yxatga olish
 * funksiyasini shu yerga ulaydi — Convex sozlanmagan bo'lsa hech narsa qilmaydi.
 */
export interface RecordTypingArgs {
  wpm: number;
  accuracy: number;
  errors: number;
  /** To'g'ri yozilgan belgilar soni */
  correct?: number;
  /** Jami bosilgan belgilar (xatolar bilan) */
  total?: number;
  /** Test davomiyligi — soniyalarda */
  time?: number;
  lang: string;
  duration: number;
  username?: string;
}

type Recorder = (args: RecordTypingArgs) => Promise<unknown>;

let recorder: Recorder | null = null;
let userToken: string | null = null;

export function setTypingRecorder(fn: Recorder | null): void {
  recorder = fn;
}

export function getTypingRecorder(): Recorder | null {
  return recorder;
}

/** Joriy foydalanuvchining token ID si (Convex orqali, login qilingan bo'lsa). */
export function setUserToken(t: string | null): void {
  userToken = t;
}

export function getUserToken(): string | null {
  return userToken;
}
