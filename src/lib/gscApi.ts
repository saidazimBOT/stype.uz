// ── Search Console API (Cloudflare Worker proxy orqali) ──────────────────
// Nega proxy? Statik sayt (GitHub Pages) Google OAuth client-secret'ni
// xavfsiz saqlay olmaydi va brauzerdan to'g'ridan-to'g'ri token almasha olmaydi.
// Shuning uchun barcha OAuth + token yangilash ishi Cloudflare Worker'da
// bajariladi (qarang: gsc-proxy/worker.js). Bu yerga faqat sessiya ID (sid)
// va proxy manzili saqlanadi.

import type { GscRow } from "../data/gsc";

const SID_KEY = "typeuz_gsc_sid";
const PROXY_KEY = "typeuz_gsc_proxy";

// ── Sozlamalar ───────────────────────────────────────────────────────────
export function getProxyUrl(): string {
  try {
    return window.localStorage.getItem(PROXY_KEY) || "";
  } catch {
    return "";
  }
}

export function setProxyUrl(url: string): void {
  try {
    window.localStorage.setItem(PROXY_KEY, url.trim().replace(/\/+$/, ""));
  } catch {
    // ignore
  }
}

export function getSid(): string {
  try {
    return window.localStorage.getItem(SID_KEY) || "";
  } catch {
    return "";
  }
}

export function setSid(sid: string): void {
  try {
    window.localStorage.setItem(SID_KEY, sid);
  } catch {
    // ignore
  }
}

export function clearSid(): void {
  try {
    window.localStorage.removeItem(SID_KEY);
  } catch {
    // ignore
  }
}

// ── OAuth boshlash ───────────────────────────────────────────────────────
/** Google consent sahifasiga yo'naltiruvchi URLni proxy'dan oladi. */
export async function startGoogleAuth(): Promise<string> {
  const proxy = getProxyUrl();
  if (!proxy) throw new Error("Proxy manzili kiritilmagan!");
  const state = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const r = await fetch(`${proxy}/auth-url?state=${encodeURIComponent(state)}`);
  if (!r.ok) throw new Error("Proxy javob bermayapti. Manzilni tekshiring.");
  const j = await r.json();
  if (!j.url) throw new Error("Google auth URL olinmadi.");
  try {
    sessionStorage.setItem("typeuz_gsc_state", state);
  } catch {
    // ignore
  }
  return j.url as string;
}

// ── Ma'lumot olish ───────────────────────────────────────────────────────
interface AnalyticsRequest {
  startDate: string;
  endDate: string;
  dimensions: string[]; // ["date"] | ["query"] | ["page"] | ["country"] | ["device"]
  rowLimit?: number;
}

/** Proxy orqali Search Console'dan qatorlarni oladi. */
export async function fetchSearchAnalytics(req: AnalyticsRequest): Promise<GscRow[]> {
  const proxy = getProxyUrl();
  const sid = getSid();
  if (!proxy || !sid) throw new Error("Google ulanishi topilmadi. Qayta ulaning.");

  const r = await fetch(`${proxy}/analytics`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sid,
      startDate: req.startDate,
      endDate: req.endDate,
      dimensions: req.dimensions,
      rowLimit: req.rowLimit ?? 1000,
    }),
  });
  const j = await r.json().catch(() => null);
  if (!r.ok) {
    const msg = j?.error || `API xatosi (${r.status})`;
    if (r.status === 401) clearSid();
    throw new Error(String(msg));
  }
  if (!j?.rows) return [];
  // Bitta o'lchovli so'rovda Google keys[0]'ga shu o'lchovning qiymatini qo'yadi
  // (masalan dimensions:["page"] → keys:["https://..."]). Qaysi o'lchov so'ralgan
  // bo'lsa, keys[0]'ni AYNAN shu maydonga joylashtiramiz — aks holda bo'limlar
  // "Noma'lum" bo'lib qolardi.
  const dim = (req.dimensions[0] || "date").toLowerCase();
  return (j.rows as unknown[]).map((row) => {
    const rw = row as Record<string, unknown>;
    const k0 = ((rw.keys as string[]) || (rw.date ? [rw.date] : []))[0] ?? "";
    return {
      date: dim === "date" ? k0 : "",
      query: dim === "query" ? k0 : "",
      page: dim === "page" ? k0 : "",
      country: dim === "country" ? k0 : "",
      device: dim === "device" ? k0 : "",
      searchType: "web",
      clicks: Number(rw.clicks ?? 0),
      impressions: Number(rw.impressions ?? 0),
      ctr: Number(rw.ctr ?? 0),
      position: Number(rw.position ?? 0),
    } as GscRow;
  });
}

/** API uchun sana diapazonini qaytaradi (max 16 oy). */
export function apiRange(days: number): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}
