/**
 * App.tsx (provider tashqarisida) Convex'ga natija yozish uchun ko'prik.
 * SiteOverlays ichidagi TypingRecorderBridge komponenti ro'yxatga olish
 * funksiyasini shu yerga ulaydi — Convex sozlanmagan bo'lsa hech narsa qilmaydi.
 */
export interface RecordTypingArgs {
  wpm: number;
  accuracy: number;
  errors: number;
  lang: string;
  duration: number;
  username?: string;
}

type Recorder = (args: RecordTypingArgs) => Promise<unknown>;

let recorder: Recorder | null = null;

export function setTypingRecorder(fn: Recorder | null): void {
  recorder = fn;
}

export function getTypingRecorder(): Recorder | null {
  return recorder;
}
