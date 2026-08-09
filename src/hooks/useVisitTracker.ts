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
  referrer?: string; // qaysi saytdan kelgani
  country?: string; // mamlakat nomi (IP orqali)
  countryCode?: string;
  city?: string;
  flag?: string; // 🇺🇿 kabi emoji
  pageViews?: number; // bu brauzer necha marta ochgan
  duration?: number; // tashrif davomiyligi (soniyalarda)
  lastSeen?: number; // oxirgi faollik vaqti (onlayn status uchun)
}

const KEY = "typeuz_visits";
const MAX = 500;
const VIEWS_KEY = "typeuz_pageviews";
const GEO_KEY = "typeuz_geo";
const GEO_TTL = 24 * 60 * 60 * 1000; // geo cache — kuniga 1 marta so'raymiz

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

function saveVisits(visits: VisitRecord[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(visits.slice(0, MAX)));
  } catch {
    // ignore
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

// ── IP orqali mamlakat/shahar (bepul, kalitsiz API) ───────────────────────
interface GeoInfo {
  country: string;
  countryCode: string;
  city: string;
  flag: string;
}

function readCachedGeo(): GeoInfo | null {
  try {
    const raw = window.localStorage.getItem(GEO_KEY);
    if (!raw) return null;
    const { data, at } = JSON.parse(raw) as { data: GeoInfo; at: number };
    if (Date.now() - at > GEO_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function cacheGeo(geo: GeoInfo): void {
  try {
    window.localStorage.setItem(GEO_KEY, JSON.stringify({ data: geo, at: Date.now() }));
  } catch {
    // ignore
  }
}

async function fetchGeo(): Promise<GeoInfo | null> {
  const cached = readCachedGeo();
  if (cached) return cached;

  const providers: (() => Promise<GeoInfo | null>)[] = [
    async () => {
      // ipwho.is — bepul, HTTPS, kalitsiz
      const r = await fetch("https://ipwho.is/");
      const j = await r.json();
      if (j?.success && j.country) {
        return {
          country: String(j.country),
          countryCode: String(j.country_code ?? "").toLowerCase(),
          city: String(j.city ?? ""),
          flag: String(j.flag?.emoji ?? "🌍"),
        };
      }
      return null;
    },
    async () => {
      // zaxira: ipapi.co — bepul HTTPS (kuniga ~1000 so'rov)
      const r = await fetch("https://ipapi.co/json/");
      const j = await r.json();
      if (j?.country_name) {
        return {
          country: String(j.country_name),
          countryCode: String(j.country_code ?? "").toLowerCase(),
          city: String(j.city ?? ""),
          flag: String(j.country_flag_emoji ?? "🌍"),
        };
      }
      return null;
    },
  ];

  for (const provider of providers) {
    try {
      const geo = await provider();
      if (geo) {
        cacheGeo(geo);
        return geo;
      }
    } catch {
      // keyingisiga o'tamiz
    }
  }
  return null;
}

/** Har bir brauzer necha marta ochilganini sanaydi. */
function nextPageViews(): number {
  try {
    const cur = parseInt(window.localStorage.getItem(VIEWS_KEY) || "0", 10) || 0;
    const next = cur + 1;
    window.localStorage.setItem(VIEWS_KEY, String(next));
    return next;
  } catch {
    return 1;
  }
}

export function recordVisit(lang: string, theme: string): void {
  try {
    if (typeof window === "undefined") return;
    const { device, deviceType } = getDevice();
    const referrer = document.referrer || "";
    const now = Date.now();
    const record: VisitRecord = {
      id: makeId(),
      time: now,
      browser: getBrowser(),
      device,
      deviceType,
      lang,
      theme,
      screen: `${window.screen?.width ?? 0}x${window.screen?.height ?? 0}`,
      referrer,
      pageViews: nextPageViews(),
      lastSeen: now,
    };

    const visits = readVisits();
    visits.unshift(record);
    saveVisits(visits);

    // IP orqali mamlakat/shahar — asinxron, xato bo'lsa jim o'tkazamiz
    void fetchGeo().then((geo) => {
      if (!geo) return;
      try {
        const list = readVisits();
        const idx = list.findIndex((v) => v.id === record.id);
        if (idx === -1) return;
        list[idx] = { ...list[idx], ...geo };
        saveVisits(list);
      } catch {
        // ignore
      }
    });
  } catch {
    // ignore
  }
}

/** Sayt ochilganda bir marta tashrifni qayd qiladi va onlayn statusni yangilab turadi. */
export function useVisitTracker(lang: string, theme: string): void {
  useEffect(() => {
    recordVisit(lang, theme);

    // Onlayn status / tashrif davomiyligi — har 20 soniyada yangilanadi
    const touch = () => {
      try {
        const list = readVisits();
        if (!list.length) return;
        const now = Date.now();
        const top = list[0];
        list[0] = {
          ...top,
          lastSeen: now,
          duration: Math.max(0, Math.round((now - top.time) / 1000)),
        };
        saveVisits(list);
      } catch {
        // ignore
      }
    };
    const iv = window.setInterval(touch, 20_000);
    document.addEventListener("visibilitychange", touch);
    window.addEventListener("beforeunload", touch);
    return () => {
      window.clearInterval(iv);
      document.removeEventListener("visibilitychange", touch);
      window.removeEventListener("beforeunload", touch);
    };
    // Faqat mount da bir marta ishga tushiramiz
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
  /** To'g'ri yozilgan belgilar soni */
  correct?: number;
  /** Jami bosilgan belgilar (xatolar bilan) */
  total?: number;
  /** Test davomiyligi — soniyalarda */
  elapsed?: number;
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
  correct?: number;
  total?: number;
  elapsed?: number;
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
      correct: result.correct,
      total: result.total,
      elapsed: result.elapsed,
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
