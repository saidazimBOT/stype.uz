// ── Google Search Console ma'lumotlari (REAL) ───────────────────────────
// Manba: Search Console "Performance" eksporti (CSV) yoki Search Console API
// (Cloudflare Worker proxy orqali). Bu ma'lumotlar Google'dan keladi —
// localStorage'da saqlanadigan sayt tashriflaridan FARQ qiladi.
//
// Eksport CSV formati (Search Console → Эффективность → ЭКСПОРТИРОВАТЬ):
//   Date,Query,Page,Country,Device,Search type,Clicks,Impressions,CTR,Position

export interface GscRow {
  date: string; // YYYY-MM-DD
  query: string;
  page: string;
  country: string; // mamlakat nomi yoki ISO-3166 kodi
  device: string; // Desktop / Mobile / Tablet
  searchType: string; // web / image / video / discover / news
  clicks: number;
  impressions: number;
  ctr: number; // 0..1 (0.05 = 5%)
  position: number; // o'rtacha pozitsiya
}

export interface GscTotals {
  clicks: number;
  impressions: number;
  ctr: number; // 0..1
  position: number; // impression-weighted o'rtacha
}

export interface GscSeriesPoint {
  date: string;
  label: string; // "29 Jul"
  clicks: number;
  impressions: number;
  position: number; // impression-weighted o'rtacha pozitsiya
}

export interface GscGroup {
  key: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export type GscTabKey = "query" | "page" | "country" | "device" | "days";

// ── CSV parse ────────────────────────────────────────────────────────────
// Qo'shtirnoq ichidagi vergullar va qochirilgan "" larni to'g'ri o'qiydi.
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQ = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function parseNum(s: string | undefined): number {
  if (s === undefined || s === "") return 0;
  const v = parseFloat(s.replace(/%/g, "").replace(/\s/g, ""));
  return isNaN(v) ? 0 : v;
}

/** Search Console CSV eksportini qatorlarga aylantiradi. */
export function parseGscCsv(text: string): GscRow[] {
  const lines = text
    .replace(/^\uFEFF/, "") // BOM
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const iDate = idx("date");
  const iClicks = idx("clicks");
  if (iDate === -1 || iClicks === -1) return [];

  const iQuery = idx("query");
  const iPage = idx("page");
  const iCountry = idx("country");
  const iDevice = idx("device");
  const iType = idx("search type");
  const iImpr = idx("impressions");
  const iCtr = idx("ctr");
  const iPos = idx("position");

  const rows: GscRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const c = splitCsvLine(lines[i]);
    const get = (j: number) => (j >= 0 ? (c[j] ?? "").trim() : "");
    const clicks = parseNum(get(iClicks));
    const impressions = parseNum(get(iImpr));
    const rawCtr = parseNum(get(iCtr));
    rows.push({
      date: get(iDate),
      query: iQuery >= 0 ? get(iQuery) : "",
      page: iPage >= 0 ? get(iPage) : "",
      country: iCountry >= 0 ? get(iCountry) : "",
      device: iDevice >= 0 ? get(iDevice) : "",
      searchType: iType >= 0 ? get(iType) : "web",
      clicks,
      impressions,
      ctr: rawCtr > 1 ? rawCtr / 100 : rawCtr,
      position: parseNum(get(iPos)),
    });
  }
  return rows;
}

// ── Davr filtri ──────────────────────────────────────────────────────────
// Davr eksportdagi ENG OXIRGI sanaga nisbatan hisoblanadi (bugungi kunga emas),
// chunki eski eksport yuklansa ham barcha ma'lumotlar ko'rinadi.
export function filterByDays(rows: GscRow[], days: number): GscRow[] {
  if (days <= 0 || rows.length === 0) return rows;
  const max = rows.reduce((m, r) => (r.date > m ? r.date : m), rows[0].date);
  const end = new Date(max + "T00:00:00");
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  const startStr = start.toISOString().slice(0, 10);
  return rows.filter((r) => r.date >= startStr && r.date <= max);
}

export function dataRange(rows: GscRow[]): { start: string; end: string } {
  if (rows.length === 0) return { start: "", end: "" };
  let min = rows[0].date;
  let max = rows[0].date;
  for (const r of rows) {
    if (r.date < min) min = r.date;
    if (r.date > max) max = r.date;
  }
  return { start: min, end: max };
}

// ── Agregatsiya ──────────────────────────────────────────────────────────
export function totals(rows: GscRow[]): GscTotals {
  let clicks = 0;
  let impressions = 0;
  let posW = 0;
  for (const r of rows) {
    clicks += r.clicks;
    impressions += r.impressions;
    posW += r.position * r.impressions;
  }
  return {
    clicks,
    impressions,
    ctr: impressions ? clicks / impressions : 0,
    position: impressions ? posW / impressions : 0,
  };
}

export function dailySeries(rows: GscRow[]): GscSeriesPoint[] {
  const map = new Map<string, GscSeriesPoint>();
  for (const r of rows) {
    const cur = map.get(r.date);
    if (cur) {
      cur.clicks += r.clicks;
      cur.impressions += r.impressions;
      cur.position += r.position * r.impressions;
    } else {
      map.set(r.date, {
        date: r.date,
        label: shortDate(r.date),
        clicks: r.clicks,
        impressions: r.impressions,
        position: r.position * r.impressions,
      });
    }
  }
  return [...map.values()]
    .map((s) => ({ ...s, position: s.impressions ? s.position / s.impressions : 0 }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Key bo'yicha guruhlaydi (query/page/country/device/date) va kliklar bo'yicha saralaydi. */
export function groupBy(rows: GscRow[], key: "query" | "page" | "country" | "device" | "date"): GscGroup[] {
  const map = new Map<string, GscGroup>();
  for (const r of rows) {
    const k = (r[key] || "").trim() || "Noma'lum";
    const cur = map.get(k);
    if (cur) {
      cur.clicks += r.clicks;
      cur.impressions += r.impressions;
      cur.position += r.position * r.impressions;
    } else {
      map.set(k, { key: k, clicks: r.clicks, impressions: r.impressions, ctr: 0, position: r.position * r.impressions });
    }
  }
  const out = [...map.values()];
  for (const g of out) {
    g.ctr = g.impressions ? g.clicks / g.impressions : 0;
    g.position = g.impressions ? g.position / g.impressions : 0;
  }
  return out.sort((a, b) => b.clicks - a.clicks);
}

// ── Formatlash ───────────────────────────────────────────────────────────
export function fmtCtr(ctr: number): string {
  return `${(ctr * 100).toFixed(1)}%`;
}

export function fmtPos(pos: number): string {
  return pos.toFixed(1);
}

export function fmtNum(n: number): string {
  return n.toLocaleString("en-US");
}

function shortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en", { day: "2-digit", month: "short" });
}

export function longDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** Mamlakat nomi/kodi → bayroq emoji (agar tanib olsa). */
const NAME_TO_CODE: Record<string, string> = {
  uzbekistan: "uz", russia: "ru", "united states": "us", usa: "us", "united kingdom": "gb",
  germany: "de", france: "fr", spain: "es", italy: "it", turkey: "tr", china: "cn",
  japan: "jp", korea: "kr", india: "in", kazakhstan: "kz", kyrgyzstan: "kg",
  tajikistan: "tj", turkmenistan: "tm", azerbaijan: "az", ukraine: "ua", poland: "pl",
  netherlands: "nl", canada: "ca", australia: "au", brazil: "br", uae: "ae",
};

/** ISO-3166 alfa-3 → alfa-2 (GSC API alfa-3 kod qaytaradi, masalan "UZB"). */
const CODE3_TO_CODE2: Record<string, string> = {
  uzb: "uz", rus: "ru", usa: "us", gbr: "gb", deu: "de", fra: "fr", esp: "es",
  ita: "it", tur: "tr", chn: "cn", jpn: "jp", kor: "kr", ind: "in", kaz: "kz",
  kgz: "kg", tjk: "tj", tkm: "tm", aze: "az", ukr: "ua", pol: "pl", nld: "nl",
  can: "ca", aus: "au", bra: "br", are: "ae", sau: "sa", idn: "id", pak: "pk",
  bgd: "bd", irn: "ir", isr: "il", egypt: "eg", zaf: "za", mex: "mx", arg: "ar",
  swe: "se", nor: "no", fin: "fi", dnk: "dk", che: "ch", aut: "at", bel: "be",
  grc: "gr", prt: "pt", cze: "cz", svk: "sk", hun: "hu", rou: "ro", bgr: "bg",
  hrv: "hr", srb: "rs", svn: "si", ltu: "lt", lva: "lv", est: "ee", blr: "by",
  geo: "ge", arm: "am", mn: "mn", vnm: "vn", tha: "th", mys: "my", sgp: "sg",
  phl: "ph", nzl: "nz", irq: "iq", syr: "sy", jor: "jo", lby: "ly", mar: "ma",
  dza: "dz", tun: "tn", ken: "ke", nga: "ng", gha: "gh", eth: "et",
};

export function flagFor(country: string): string {
  const s = (country || "").trim().toLowerCase();
  if (!s) return "🌍";
  const toEmoji = (code: string) => {
    const cps = [...code.toUpperCase()].map((ch) => 127397 + ch.charCodeAt(0));
    return String.fromCodePoint(...cps);
  };
  if (/^[a-z]{2}$/.test(s)) return toEmoji(s); // alfa-2
  if (/^[a-z]{3}$/.test(s)) {
    const c2 = CODE3_TO_CODE2[s];
    return c2 ? toEmoji(c2) : "🌍"; // alfa-3
  }
  const c2 = NAME_TO_CODE[s];
  return c2 ? toEmoji(c2) : "🌍"; // to'liq nom
}
