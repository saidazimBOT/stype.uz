import { useEffect } from "react";

// ── Visit Tracking (localStorage-based) ──────────────────────────────────
// Eslatma: Bu statik sayt — server/database yo'q. Shuning uchun tashriflar
// shu brauzerda (localStorage) kuzatiladi. Har bir brauzer = alohida "tashrifchi".
// Barcha qurilmalar bo'ylab real statistika uchun Simple Analytics kabi
// xizmat yoki Supabase database kerak bo'ladi.

export interface VisitRecord {
  id: string;
  time: number;
  browser: string;
  device: string; // Android / iOS / Windows / macOS / Linux
  deviceType: "Mobile" | "Tablet" | "Desktop";
  lang: string;
  theme: string;
  screen: string;
}

const KEY = "typeuz_visits";
const MAX = 500;

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function readVisits(): VisitRecord[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as VisitRecord[]) : [];
  } catch {
    return [];
  }
}

export function clearVisits(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

function getBrowser(): string {
  const ua = navigator.userAgent;
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\//i.test(ua) || /opera/i.test(ua)) return "Opera";
  if (/chrome|crios/i.test(ua)) return "Chrome";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua)) return "Safari";
  return "Other";
}

function getDevice(): { device: string; deviceType: "Mobile" | "Tablet" | "Desktop" } {
  const ua = navigator.userAgent;
  const isTablet = /ipad|tablet/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua));
  const isMobile = /iphone|ipod|android.*mobile|mobile/i.test(ua);
  if (isTablet) return { device: /ipad/i.test(ua) ? "iPad" : "Android Tablet", deviceType: "Tablet" };
  if (isMobile) return { device: /iphone|ipod/i.test(ua) ? "iPhone" : "Android", deviceType: "Mobile" };
  if (/windows/i.test(ua)) return { device: "Windows", deviceType: "Desktop" };
  if (/mac/i.test(ua)) return { device: "macOS", deviceType: "Desktop" };
  if (/linux/i.test(ua)) return { device: "Linux", deviceType: "Desktop" };
  return { device: "Other", deviceType: "Desktop" };
}

export function recordVisit(lang: string, theme: string): void {
  try {
    if (typeof window === "undefined") return;
    const { device, deviceType } = getDevice();
    const record: VisitRecord = {
      id: makeId(),
      time: Date.now(),
      browser: getBrowser(),
      device,
      deviceType,
      lang,
      theme,
      screen: `${window.screen?.width ?? 0}x${window.screen?.height ?? 0}`,
    };
    const visits = readVisits();
    visits.unshift(record);
    window.localStorage.setItem(KEY, JSON.stringify(visits.slice(0, MAX)));
  } catch {
    // ignore
  }
}

/** Sayt ochilganda bir marta tashrifni qayd qiladi. */
export function useVisitTracker(lang: string, theme: string): void {
  useEffect(() => {
    recordVisit(lang, theme);
    // Faqat mount da bir marta yozamiz (lang/theme o'zgarishi qayta yozmaydi)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// ── Typing Log (kim type qilgani) ────────────────────────────────────────
export interface TypingRecord {
  id: string;
  time: number;
  wpm: number;
  accuracy: number;
  errors: number;
  lang: string;
  browser: string;
  device: string;
  deviceType: "Mobile" | "Tablet" | "Desktop";
}

const TYPING_KEY = "typeuz_typing_log";
const TYPING_MAX = 300;

export function readTypingLog(): TypingRecord[] {
  try {
    const raw = window.localStorage.getItem(TYPING_KEY);
    return raw ? (JSON.parse(raw) as TypingRecord[]) : [];
  } catch {
    return [];
  }
}

export function clearTypingLog(): void {
  try {
    window.localStorage.removeItem(TYPING_KEY);
  } catch {
    // ignore
  }
}

/** Test yakunlanganda bitta yozuv qo'shadi (device/browser ma'lumotlari bilan). */
export function recordTyping(result: {
  wpm: number;
  accuracy: number;
  errors: number;
  lang: string;
}): void {
  try {
    if (typeof window === "undefined") return;
    const { device, deviceType } = getDevice();
    const record: TypingRecord = {
      id: makeId(),
      time: Date.now(),
      wpm: result.wpm,
      accuracy: result.accuracy,
      errors: result.errors,
      lang: result.lang,
      browser: getBrowser(),
      device,
      deviceType,
    };
    const log = readTypingLog();
    log.unshift(record);
    window.localStorage.setItem(TYPING_KEY, JSON.stringify(log.slice(0, TYPING_MAX)));
  } catch {
    // ignore
  }
}

// ── Statistika yordamchilari ─────────────────────────────────────────────
export function visitsPerDay(visits: VisitRecord[], days = 14): { label: string; count: number }[] {
  const result: { label: string; count: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    const count = visits.filter((v) => new Date(v.time).toDateString() === key).length;
    result.push({
      label: d.toLocaleDateString("en", { day: "2-digit", month: "short" }),
      count,
    });
  }
  return result;
}

export function countToday(visits: VisitRecord[]): number {
  const today = new Date().toDateString();
  return visits.filter((v) => new Date(v.time).toDateString() === today).length;
}

export function countThisWeek(visits: VisitRecord[]): number {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 7);
  return visits.filter((v) => v.time >= start.getTime()).length;
}

export function uniqueVisitors(visits: VisitRecord[]): number {
  return new Set(visits.map((v) => `${v.device}|${v.browser}|${v.screen}`)).size;
}
