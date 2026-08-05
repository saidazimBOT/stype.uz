// ── Typing DNA — yozish uslubining shaxsiy profili ───────────────────────
// Bu modul foydalanuvchining type tarixi (history), klaviatura hodisalari
// (recordings), kunlik login va ishlatilgan tillardan uning "yozish DNK'sini"
// hisoblab chiqadi. Barcha hisob-kitoblar deterministik — xuddi shu ma'lumot
// bilan har safar bir xil natija chiqadi.

import type { DailyState, ReplayRecording, TestResult } from "../types";
import { LANG_LABELS } from "./texts";

// ── Deterministik PRNG + hash (DNK chizig'i uchun) ──────────────────────
function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Turlar ───────────────────────────────────────────────────────────────
export interface DnaArchetype {
  id: string;
  name: string;
  icon: string;
  desc: string;
  color: string;
}

export interface DnaTrait {
  key: "consistency" | "speed" | "accuracy" | "rhythm";
  label: string;
  value: number; // 0..100
  color: string;
  hint: string;
}

export interface DnaProfile {
  ready: boolean;
  dnaString: string; // "ATCG-GTAC-..."
  bars: number[]; // barcode balandliklari (0..1)
  archetype: DnaArchetype;
  stats: {
    tests: number;
    avgWpm: number;
    bestWpm: number;
    avgAcc: number;
    errorRate: number;
    totalLogins: number;
    streak: number;
  };
  traits: DnaTrait[];
  prefDuration: string;
  prefLang: string;
  activeHour: number;
  rhythm: { avgInterval: number; burstWpm: number; cv: number };
  errorKeys: { key: string; count: number }[];
  summary: string;
}

const EMPTY_ARCHETYPE: DnaArchetype = {
  id: "empty",
  name: "Shakllanmagan",
  icon: "🌱",
  desc: "DNK hali shakllanmoqda — bir nechta test topshiring.",
  color: "#22c55e",
};

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

function mean(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(mean(arr.map((x) => (x - m) ** 2)));
}

/** "14:05:21" yoki "2:05:21 PM" kabi vaqt matnidan soatni chiqaradi. */
function parseHour(s: string): number {
  const m = s.match(/(\d{1,2}):/);
  if (!m) return -1;
  let h = parseInt(m[1], 10);
  if (isNaN(h)) return -1;
  if (/PM/i.test(s) && h < 12) h += 12;
  if (/AM/i.test(s) && h === 12) h = 0;
  return h;
}

function mode<T>(arr: T[]): T | null {
  const m = new Map<T, number>();
  let best: T | null = null;
  let bestN = 0;
  for (const x of arr) {
    const n = (m.get(x) ?? 0) + 1;
    m.set(x, n);
    if (n > bestN) {
      bestN = n;
      best = x;
    }
  }
  return best;
}

// ── Arxetip aniqlash ─────────────────────────────────────────────────────
function pickArchetype(opts: {
  tests: number;
  avgWpm: number;
  avgAcc: number;
  consistency: number;
  prefDuration: number | string | null;
}): DnaArchetype {
  if (opts.tests < 3) {
    return { id: "newbie", name: "Rivojlanayotgan", icon: "🌱", desc: "Yozish DNK'ingiz endi shakllanmoqda. Har bir test uni o'zgartiradi — davom eting!", color: "#22c55e" };
  }
  if (opts.avgWpm >= 80 && opts.avgAcc >= 95) {
    return { id: "master", name: "Usta", icon: "🚀", desc: "Tezlik va aniqlik uyg'unligi — professional daraja. Sizning DNK'ingiz boshqalardan ajralib turadi.", color: "#f59e0b" };
  }
  if (opts.avgAcc >= 97) {
    return { id: "precise", name: "Aniq (Perfectionist)", icon: "🎯", desc: "Har bir tugmani mukammal bosasiz. Tezlikdan ko'ra to'g'rilikni qadrlaysiz.", color: "#22d3ee" };
  }
  if (opts.avgWpm >= 70) {
    return { id: "sprinter", name: "Sprinter", icon: "⚡", desc: "Yuqori tezlik — qisqa masofalarga kuchli. Tugmalar barmoqlaringiz ostida yonadi!", color: "#a78bfa" };
  }
  if (opts.prefDuration === 60 || opts.prefDuration === "∞") {
    return { id: "marathoner", name: "Marafonchi", icon: "🏃", desc: "Uzoq testlarni yaxshi ko'rasiz — chidam va barqaror tezlik sizning kuchingiz.", color: "#38bdf8" };
  }
  if (opts.consistency >= 85) {
    return { id: "steady", name: "Barqaror", icon: "🧱", desc: "Tezlikni bir tekisda ushlaysiz — kam o'zgaruvchan, ishonchli uslub.", color: "#4ade80" };
  }
  return { id: "learner", name: "O'rganuvchi", icon: "📈", desc: "O'sish bosqichida — har bir test sizni oldinga olg'a suradi.", color: "#f472b6" };
}

// ── Asosiy profili ───────────────────────────────────────────────────────
export function buildDnaProfile(
  history: TestResult[],
  recordings: ReplayRecording[],
  daily: DailyState,
  usedLangs: string[]
): DnaProfile {
  const wpms = history.map((h) => h.wpm);
  const accs = history.map((h) => h.accuracy);
  const errors = history.map((h) => h.errors);
  const avgWpm = Math.round(mean(wpms));
  const bestWpm = wpms.length ? Math.max(...wpms) : 0;
  const avgAcc = Math.round(mean(accs));
  const tests = history.length;

  if (tests === 0) {
    return {
      ready: false,
      dnaString: "----",
      bars: [],
      archetype: EMPTY_ARCHETYPE,
      stats: { tests: 0, avgWpm: 0, bestWpm: 0, avgAcc: 0, errorRate: 0, totalLogins: daily.totalLogins, streak: daily.streak },
      traits: [],
      prefDuration: "",
      prefLang: "",
      activeHour: -1,
      rhythm: { avgInterval: 0, burstWpm: 0, cv: 0 },
      errorKeys: [],
      summary: "Yozish DNK'ingiz hali shakllanmagan. Bir nechta test topshirganingizdan so'ng shaxsiy profilingiz paydo bo'ladi — tezlik, aniqlik, ritm va xato xaritangiz shu yerda ko'rinadi.",
    };
  }

  // Barqarorlik (consistency): WPM o'zgaruvchanligi (cv) asosida
  const cv = wpms.length > 1 ? stdDev(wpms) / (mean(wpms) || 1) : 0;
  const consistency = Math.round(clamp(100 - cv * 100));

  // Eng ko'p ishlatilgan davomiylik va til
  const prefDurationRaw = mode(history.map((h) => h.duration));
  const prefDuration =
    prefDurationRaw === 15
      ? "Qisqa sprint (15s)"
      : prefDurationRaw === 30
        ? "O'rta masofa (30s)"
        : prefDurationRaw === 60
          ? "Uzoq masofa (60s)"
          : prefDurationRaw === "∞"
            ? "Erkin rejim"
            : "Aralash";
  const prefLangRaw = mode(history.map((h) => h.lang)) ?? usedLangs[0] ?? "";
  const prefLang = LANG_LABELS[prefLangRaw] ? `${LANG_LABELS[prefLangRaw]} (${prefLangRaw})` : prefLangRaw || "—";

  // Eng faol soat (history.date toLocaleTimeString formatda — 24s yoki 12s bo'lishi mumkin)
  const hourCount = new Map<number, number>();
  for (const h of history) {
    const hh = parseHour(h.date);
    if (hh >= 0) hourCount.set(hh, (hourCount.get(hh) ?? 0) + 1);
  }
  let activeHour = -1;
  let maxH = 0;
  for (const [hh, n] of hourCount) {
    if (n > maxH) {
      maxH = n;
      activeHour = hh;
    }
  }

  // ── Ritm (recordings dan) ──
  const intervals: number[] = [];
  let errCount = 0;
  const errMap = new Map<string, number>();
  for (const rec of recordings) {
    let prev: number | null = null;
    for (const e of rec.events) {
      if (e.type !== "keydown") continue;
      if (prev !== null && e.time > prev) intervals.push(e.time - prev);
      prev = e.time;
      if (e.correct === false) {
        errCount++;
        const k = e.key || "?";
        errMap.set(k, (errMap.get(k) ?? 0) + 1);
      }
    }
  }
  const avgInterval = Math.round(mean(intervals));
  const intervalCv = intervals.length > 1 ? stdDev(intervals) / (mean(intervals) || 1) : 0;
  // Burst: eng tez 5-tugma oynasi (WPM ga aylantirilgan)
  let burstWpm = 0;
  if (intervals.length >= 5) {
    let bestBurst = Infinity;
    for (let i = 0; i <= intervals.length - 5; i++) {
      const window = intervals.slice(i, i + 5);
      const avg5 = mean(window);
      if (avg5 > 0 && avg5 < bestBurst) bestBurst = avg5;
    }
    if (bestBurst < Infinity) burstWpm = Math.round(60000 / (bestBurst * 5));
  }
  // Replay yozuvlari bo'lmasa ritmni 100% ko'rsatib adashtirmaymiz — 0 qilamiz
  const rhythmScore = intervals.length ? Math.round(clamp(100 - intervalCv * 100)) : 0;
  const errorKeys = [...errMap.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // ── Arxetip ──
  const archetype = pickArchetype({ tests, avgWpm, avgAcc, consistency, prefDuration: prefDurationRaw ?? null });

  // ── DNK chizig'i (deterministik) ──
  const seedInput = `${avgWpm}|${avgAcc}|${bestWpm}|${tests}|${activeHour}|${Math.round(rhythmScore)}|${errorKeys.map((e) => e.key).join("")}`;
  const seed = fnv1a(seedInput);
  const rand = mulberry32(seed);
  const alphabet = "ATCG";
  const dnaGroups: string[] = [];
  for (let g = 0; g < 8; g++) {
    let s = "";
    for (let i = 0; i < 4; i++) s += alphabet[Math.floor(rand() * alphabet.length)];
    dnaGroups.push(s);
  }
  const bars = Array.from({ length: 48 }, () => 0.15 + rand() * 0.85);

  // ── Xususiyatlar (traits) ──
  const speedScore = Math.round(clamp((avgWpm / 120) * 100));
  const traits: DnaTrait[] = [
    { key: "consistency", label: "Barqarorlik", value: consistency, color: "#4ade80", hint: "WPM o'zgaruvchanligi — qancha yuqori bo'lsa, tezlik shuncha bir tekis." },
    { key: "speed", label: "Tezlik", value: speedScore, color: "#a78bfa", hint: `${avgWpm} WPM o'rtacha (120 WPM = 100%)` },
    { key: "accuracy", label: "Aniqlik", value: avgAcc, color: "#22d3ee", hint: `${avgAcc}% o'rtacha aniqlik` },
    { key: "rhythm", label: "Ritm", value: rhythmScore, color: "#f59e0b", hint: intervals.length ? `O'rtacha ${avgInterval} ms tugma oralig'i` : "Ritm uchun replay yozuvlari kerak" },
  ];

  // ── Xulosa matni ──
  const parts: string[] = [];
  parts.push(`Sizning yozish DNK'ingiz — ${archetype.name.toLowerCase()} profil.`);
  parts.push(`O'rtacha ${avgWpm} WPM tezlik va ${avgAcc}% aniqlik.`);
  if (consistency >= 80) parts.push("Tezlikni juda barqaror ushlaysiz.");
  else if (consistency < 50) parts.push("Tezlik o'zgaruvchan — ba'zan juda tez, ba'zan sekin.");
  if (avgAcc >= 96) parts.push("Xatolar juda kam — aniqlik sizning kuchli tomoningiz.");
  if (bestWpm > 0) parts.push(`Eng yaxshi natijangiz ${bestWpm} WPM.`);
  if (activeHour >= 0) parts.push(`Eng faol vaqtingiz ${activeHour}:00 atrofida.`);
  if (errorKeys.length) parts.push(`Eng ko'p xato qiladigan tugmalar: ${errorKeys.map((e) => e.key).join(", ")}.`);
  const summary = parts.join(" ");

  return {
    ready: true,
    dnaString: dnaGroups.join("-"),
    bars,
    archetype,
    stats: {
      tests,
      avgWpm,
      bestWpm,
      avgAcc,
      errorRate: tests ? Math.round((mean(errors) / (mean(wpms) || 1)) * 100) : 0,
      totalLogins: daily.totalLogins,
      streak: daily.streak,
    },
    traits,
    prefDuration,
    prefLang,
    activeHour,
    rhythm: { avgInterval, burstWpm, cv: Math.round(intervalCv * 100) },
    errorKeys,
    summary,
  };
}
