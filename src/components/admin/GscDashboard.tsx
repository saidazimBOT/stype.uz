"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle, FiCheckCircle, FiEye, FiExternalLink, FiFileText,
  FiLink, FiMousePointer, FiPercent, FiRefreshCw, FiSearch, FiSettings, FiTarget,
  FiTrash2, FiUpload, FiX,
} from "react-icons/fi";
import { FaDesktop, FaMobile, FaTablet } from "react-icons/fa6";
import type { ThemeColors } from "../../types";
import {
  dataRange, dailySeries, filterByDays, flagFor, fmtCtr, fmtNum, fmtPos,
  groupBy, longDate, parseGscCsv, totals,
  type GscGroup, type GscRow, type GscSeriesPoint, type GscTabKey,
} from "../../data/gsc";
import {
  apiRange, clearSid, fetchSearchAnalytics, getProxyUrl, getSid, setProxyUrl, startGoogleAuth,
} from "../../lib/gscApi";

interface GscDashboardProps {
  t: ThemeColors;
}

type PeriodKey = 7 | 28 | 90;

const PERIODS: { days: PeriodKey; label: string }[] = [
  { days: 7, label: "7 kun" },
  { days: 28, label: "28 kun" },
  { days: 90, label: "3 oy" },
];

const TABS: { key: GscTabKey; label: string }[] = [
  { key: "query", label: "So'rovlar" },
  { key: "page", label: "Sahifalar" },
  { key: "country", label: "Mamlakatlar" },
  { key: "device", label: "Qurilmalar" },
  { key: "days", label: "Kunlar" },
];

const DEVICE_ICON: Record<string, typeof FaDesktop> = {
  Desktop: FaDesktop,
  Mobile: FaMobile,
  Tablet: FaTablet,
};

const CSV_CACHE_KEY = "typeuz_gsc_csv";

function cacheCsv(rows: GscRow[]): void {
  try {
    const s = JSON.stringify(rows);
    if (s.length < 1_500_000) window.localStorage.setItem(CSV_CACHE_KEY, s);
  } catch {
    // ignore
  }
}

function loadCachedCsv(): GscRow[] | null {
  try {
    const s = window.localStorage.getItem(CSV_CACHE_KEY);
    if (!s) return null;
    const rows = JSON.parse(s) as GscRow[];
    return Array.isArray(rows) && rows.length ? rows : null;
  } catch {
    return null;
  }
}

function clearCachedCsv(): void {
  try {
    window.localStorage.removeItem(CSV_CACHE_KEY);
  } catch {
    // ignore
  }
}

interface GscModel {
  tot: { clicks: number; impressions: number; ctr: number; position: number };
  series: GscSeriesPoint[];
  groups: GscGroup[];
  range: { start: string; end: string };
}

// ── SVG chiziqli grafik (kliklar + ko'rsatuvlar) ─────────────────────────
function LineChart({ series, t }: { series: GscSeriesPoint[]; t: ThemeColors }) {
  if (series.length < 2) {
    return (
      <div className="h-40 flex items-center justify-center text-xs text-gray-600">
        Grafik uchun yetarli kunlik ma'lumot yo'q
      </div>
    );
  }
  const W = 640;
  const H = 220;
  const PL = 44;
  const PR = 12;
  const PT = 16;
  const PB = 28;
  const iw = W - PL - PR;
  const ih = H - PT - PB;
  const maxV = Math.max(...series.map((s) => Math.max(s.clicks, s.impressions)), 1) * 1.15;
  const x = (i: number) => PL + (series.length === 1 ? iw / 2 : (i * iw) / (series.length - 1));
  const y = (v: number) => PT + ih - (v / maxV) * ih;
  const poly = (sel: (s: GscSeriesPoint) => number) =>
    series.map((s, i) => `${x(i).toFixed(1)},${y(sel(s)).toFixed(1)}`).join(" ");
  const grid = [0.25, 0.5, 0.75, 1];
  const labelIdx =
    series.length > 8
      ? [0, Math.floor((series.length - 1) / 2), series.length - 1]
      : series.map((_, i) => i);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Kliklar va ko'rsatuvlar grafigi">
      {grid.map((g) => {
        const gy = PT + ih - g * ih;
        return (
          <g key={g}>
            <line x1={PL} x2={W - PR} y1={gy} y2={gy} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
            <text x={PL - 8} y={gy + 3} textAnchor="end" fontSize={9} fill="#6b7280">
              {Math.round(maxV * g)}
            </text>
          </g>
        );
      })}
      {labelIdx.map((i) => (
        <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize={9} fill="#6b7280">
          {series[i].label}
        </text>
      ))}
      {/* Ko'rsatuvlar (binafsha) */}
      <polyline
        points={poly((s) => s.impressions)}
        fill="none"
        stroke="#a78bfa"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.85}
      />
      {/* Kliklar (aktsent rang) */}
      <polyline
        points={poly((s) => s.clicks)}
        fill="none"
        stroke={t.accent}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {series.map((s, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(s.clicks)} r={2.5} fill={t.accent}>
            <title>{`${s.label}: ${fmtNum(s.clicks)} klik`}</title>
          </circle>
          <circle cx={x(i)} cy={y(s.impressions)} r={2.5} fill="#a78bfa">
            <title>{`${s.label}: ${fmtNum(s.impressions)} ko'rsatuv`}</title>
          </circle>
        </g>
      ))}
    </svg>
  );
}

// ── Umumiy jadval (so'rovlar/sahifalar/mamlakatlar/kunlar) ───────────────
interface MetricRow {
  id: string;
  label: string;
  sub?: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

function MetricsTable({ rows, t }: { rows: MetricRow[]; t: ThemeColors }) {
  const maxClicks = Math.max(...rows.map((r) => r.clicks), 1);
  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="text-gray-600 uppercase tracking-widest text-[10px]">
            <th className="py-2 pr-3 w-1/2">Element</th>
            <th className="py-2 pr-3 text-right">Kliklar</th>
            <th className="py-2 pr-3 text-right">Ko'rsatuvlar</th>
            <th className="py-2 pr-3 text-right">CTR</th>
            <th className="py-2 text-right">Pozitsiya</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-white/5 hover:bg-white/[0.03] transition-colors">
              <td className="py-2.5 pr-3">
                <div className="text-gray-200 truncate max-w-[260px]">{r.label}</div>
                {r.sub && <div className="text-[10px] text-gray-600 truncate max-w-[260px]">{r.sub}</div>}
                <div className="h-1 rounded-full bg-white/5 mt-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bar-fill"
                    style={{
                      width: `${Math.max((r.clicks / maxClicks) * 100, 4)}%`,
                      background: `linear-gradient(90deg, ${t.accent}66, ${t.accent})`,
                    }}
                  />
                </div>
              </td>
              <td className="py-2.5 pr-3 text-right font-bold text-white">{fmtNum(r.clicks)}</td>
              <td className="py-2.5 pr-3 text-right text-gray-400">{fmtNum(r.impressions)}</td>
              <td className="py-2.5 pr-3 text-right" style={{ color: t.accent }}>{fmtCtr(r.ctr)}</td>
              <td className="py-2.5 text-right text-gray-400">{fmtPos(r.position)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Asosiy komponent ─────────────────────────────────────────────────────
export default function GscDashboard({ t }: GscDashboardProps) {
  const [period, setPeriod] = useState<PeriodKey>(90);
  const [tab, setTab] = useState<GscTabKey>("query");
  const [source, setSource] = useState<"csv" | "api" | null>(null);
  const [csvRows, setCsvRows] = useState<GscRow[] | null>(null);
  const [apiData, setApiData] = useState<{
    tot: { clicks: number; impressions: number; ctr: number; position: number };
    series: GscSeriesPoint[];
    groups: Partial<Record<GscTabKey, GscGroup[]>>;
    range: { start: string; end: string };
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [setupOpen, setSetupOpen] = useState(false);
  const [proxyUrl, setProxyUrlInput] = useState(getProxyUrl());

  // Mount: avval API ulanish, yo'q bo'lsa CSV cache
  useEffect(() => {
    if (getSid()) {
      setSource("api");
      return;
    }
    const cached = loadCachedCsv();
    if (cached) {
      setCsvRows(cached);
      setSource("csv");
    }
  }, []);

  // API ma'lumotlarni yuklash (davr yoki bo'lim o'zgarganda)
  useEffect(() => {
    if (source !== "api") return;
    let alive = true;
    setLoading(true);
    setError("");
    const { startDate, endDate } = apiRange(period);
    const dims: Record<GscTabKey, string[]> = {
      query: ["query"],
      page: ["page"],
      country: ["country"],
      device: ["device"],
      days: ["date"],
    };
    Promise.all([
      fetchSearchAnalytics({ startDate, endDate, dimensions: ["date"] }),
      fetchSearchAnalytics({ startDate, endDate, dimensions: dims[tab] }),
    ])
      .then(([seriesRows, groupRows]) => {
        if (!alive) return;
        const series = dailySeries(seriesRows);
        setApiData((prev) => ({
          tot: totals(seriesRows),
          series,
          groups: { ...(prev?.groups || {}), [tab]: groupBy(groupRows, tab === "days" ? "date" : tab) },
          range: { start: startDate, end: endDate },
        }));
        setUpdatedAt(Date.now());
      })
      .catch((e: Error) => {
        if (alive) setError(String(e.message || e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [source, period, tab, refreshKey]);

  // ── Model (CSV yoki API — umumiy ko'rinish) ──────────────────────────
  const model: GscModel | null = useMemo(() => {
    if (source === "csv" && csvRows) {
      const rows = filterByDays(csvRows, period);
      const range = dataRange(rows);
      return {
        tot: totals(rows),
        series: dailySeries(rows),
        groups: groupBy(rows, tab === "days" ? "date" : tab),
        range,
      };
    }
    if (source === "api" && apiData) {
      return {
        tot: apiData.tot,
        series: apiData.series,
        groups: apiData.groups[tab] || [],
        range: apiData.range,
      };
    }
    return null;
  }, [source, csvRows, period, tab, apiData]);

  // ── CSV import ────────────────────────────────────────────────────────
  const handleCsvImport = () => {
    const parsed = parseGscCsv(csvText);
    if (!parsed.length) {
      setError("CSV topilmadi. Search Console → Performance → Eksport qilingan CSV matnini joylang.");
      return;
    }
    setCsvRows(parsed);
    setSource("csv");
    setApiData(null);
    cacheCsv(parsed);
    setImportOpen(false);
    setCsvText("");
    setError("");
    setUpdatedAt(Date.now());
  };

  const handleCsvFile = (f: File | null) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result ?? ""));
    reader.readAsText(f);
  };

  // ── API ulash ─────────────────────────────────────────────────────────
  const handleApiConnect = async () => {
    setProxyUrl(proxyUrl);
    setError("");
    try {
      const url = await startGoogleAuth();
      window.location.href = url;
    } catch (e) {
      setError(String((e as Error).message || e));
    }
  };

  const handleApiDisconnect = () => {
    clearSid();
    setApiData(null);
    const cached = loadCachedCsv();
    if (cached) {
      setCsvRows(cached);
      setSource("csv");
    } else {
      setSource(null);
    }
    setError("");
  };

  const metricCards = [
    { label: "Kliklar", value: fmtNum(model?.tot.clicks ?? 0), icon: FiMousePointer, color: t.accent },
    { label: "Ko'rsatuvlar", value: fmtNum(model?.tot.impressions ?? 0), icon: FiEye, color: "#a78bfa" },
    { label: "O'rtacha CTR", value: fmtCtr(model?.tot.ctr ?? 0), icon: FiPercent, color: "#22c55e" },
    { label: "O'rtacha pozitsiya", value: fmtPos(model?.tot.position ?? 0), icon: FiTarget, color: "#f59e0b" },
  ];

  // Bo'lim jadvali uchun qatorlar
  const metricRows: MetricRow[] = useMemo(() => {
    if (!model) return [];
    if (tab === "days") {
      return [...model.series]
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((s) => ({
          id: s.date,
          label: longDate(s.date),
          clicks: s.clicks,
          impressions: s.impressions,
          ctr: s.impressions ? s.clicks / s.impressions : 0,
          position: s.position,
        }));
    }
    return model.groups.slice(0, 10).map((g) => ({
      id: g.key,
      label: g.key,
      sub: tab === "page" ? hostname(g.key) : undefined,
      clicks: g.clicks,
      impressions: g.impressions,
      ctr: g.ctr,
      position: g.position,
    }));
  }, [model, tab]);

  const isApi = source === "api";

  return (
    <div className="p-5 rounded-2xl animate-fade-in" style={{ background: t.surface, border: `1px solid ${t.accent}1a` }}>
      {/* Sarlavha */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <FiSearch style={{ color: t.accent }} />
          Google Search (Search Console)
          {model && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ background: t.accent + "22", color: t.accent }}
            >
              {isApi ? <FiLink size={9} /> : <FiFileText size={9} />}
              {isApi ? "API · avto-sinxron" : "CSV import"}
            </span>
          )}
        </div>

        {model && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {PERIODS.map((p) => (
              <button
                key={p.days}
                onClick={() => setPeriod(p.days)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
                style={{
                  background: period === p.days ? t.accent + "22" : "transparent",
                  color: period === p.days ? t.accent : "#6b7280",
                  border: `1px solid ${period === p.days ? t.accent + "44" : "transparent"}`,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Xato xabari */}
      {error && (
        <div className="mb-4 px-3 py-2.5 rounded-xl text-xs text-red-400 bg-red-500/10 border border-red-500/30 flex items-start gap-2 animate-pop-in">
          <FiAlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-auto text-red-400/70 hover:text-red-300" aria-label="Yopish">
            <FiX size={13} />
          </button>
        </div>
      )}

      {!model ? (
        /* ── Ulanish paneli ── */
        <div className="text-center py-6">
          <div
            className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: t.accent + "1f", color: t.accent, border: `1px solid ${t.accent}44` }}
          >
            <FiSearch size={26} />
          </div>
          <div className="text-white font-bold text-base mb-1">Google Search ma'lumotlarini ulang</div>
          <p className="text-xs text-gray-500 max-w-md mx-auto mb-5 leading-relaxed">
            Bu bo'lim Search Console'dagi <strong className="text-gray-300">haqiqiy</strong> Google
            qidiruv statistikasini ko'rsatadi — kliklar, ko'rsatuvlar, CTR, pozitsiya, so'rovlar va
            sahifalar. Ikkita usul bor:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 max-w-xl mx-auto text-left">
            {/* CSV yo'li */}
            <button
              onClick={() => setImportOpen(true)}
              className="p-4 rounded-2xl text-left transition-all hover:scale-[1.02] border border-white/10"
              style={{ background: "#ffffff06" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: t.accent + "22", color: t.accent }}>
                  <FiUpload size={16} />
                </span>
                <div className="font-semibold text-sm text-white">CSV import</div>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Search Console → Performance → <strong className="text-gray-400">Eksport</strong>
                tugmasini bosing va CSV'ni shu yerga joylang. Darhol ishlaydi, hech qanday sozlash
                kerak emas.
              </p>
              <div className="text-[10px] mt-2 font-bold" style={{ color: t.accent }}>Darhol ishlaydi →</div>
            </button>

            {/* API yo'li */}
            <button
              onClick={() => setSetupOpen(true)}
              className="p-4 rounded-2xl text-left transition-all hover:scale-[1.02] border border-white/10"
              style={{ background: "#ffffff06" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#a78bfa22", color: "#a78bfa" }}>
                  <FiLink size={16} />
                </span>
                <div className="font-semibold text-sm text-white">API · avto-sinxron</div>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Google Search Console API orqali ma'lumotlar <strong className="text-gray-400">avtomatik</strong>{" "}
                yangilanadi. Cloudflare Worker proxy o'rnatish kerak (qo'llanma beriladi).
              </p>
              <div className="text-[10px] mt-2 font-bold" style={{ color: "#a78bfa" }}>Avtomatik yangilanadi →</div>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Manba + amallar */}
          <div className="flex flex-wrap items-center gap-2 mb-4 text-[11px] text-gray-500">
            {model.range.start && (
              <span>
                {longDate(model.range.start)} — {longDate(model.range.end)}
              </span>
            )}
            {updatedAt && (
              <span>
                · Yangilandi {new Date(updatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <span className="flex-1" />
            <button
              onClick={() => (isApi ? setRefreshKey((k) => k + 1) : setImportOpen(true))}
              className="px-2.5 py-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all flex items-center gap-1"
            >
              {isApi ? <FiRefreshCw size={11} className={loading ? "animate-spin" : ""} /> : <FiUpload size={11} />}
              {isApi ? "Yangilash" : "CSV yangilash"}
            </button>
            {isApi ? (
              <button
                onClick={handleApiDisconnect}
                className="px-2.5 py-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-red-400 transition-all flex items-center gap-1"
              >
                <FiLink size={11} /> O'chirish
              </button>
            ) : (
              <button
                onClick={() => {
                  clearCachedCsv();
                  setCsvRows(null);
                  setSource(getSid() ? "api" : null);
                }}
                className="px-2.5 py-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-red-400 transition-all flex items-center gap-1"
              >
                <FiTrash2 size={11} /> O'chirish
              </button>
            )}
          </div>

          {/* Metrik kartalar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {metricCards.map((s) => (
              <div
                key={s.label}
                className="p-3.5 rounded-xl transition-all hover:scale-[1.02]"
                style={{ background: "#ffffff06", border: `1px solid ${s.color}22` }}
              >
                <s.icon size={14} style={{ color: s.color }} className="mb-1.5" />
                <div className="text-xl sm:text-2xl font-bold text-white">{s.value}</div>
                <div className="text-[10px] text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Grafik */}
          <div className="mb-4">
            <div className="flex flex-wrap items-center gap-4 mb-2 text-[10px] text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded-full" style={{ background: t.accent }} /> Kliklar
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded-full" style={{ background: "#a78bfa" }} /> Ko'rsatuvlar
              </span>
            </div>
            <LineChart series={model.series} t={t} />
          </div>

          {/* Bo'limlar (tabs) */}
          <div className="flex gap-1 border-b border-white/5 mb-3 overflow-x-auto">
            {TABS.map((tb) => (
              <button
                key={tb.key}
                onClick={() => setTab(tb.key)}
                className="px-3 py-2 text-[11px] font-medium whitespace-nowrap transition-all border-b-2 -mb-px"
                style={{
                  color: tab === tb.key ? t.accent : "#6b7280",
                  borderColor: tab === tb.key ? t.accent : "transparent",
                }}
              >
                {tb.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-10 text-center text-xs text-gray-500 animate-pulse">Ma'lumotlar yuklanmoqda...</div>
          ) : metricRows.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-600">
              {isApi
                ? "Bu bo'limda ma'lumot yo'q."
                : `Bu bo'limda ma'lumot yo'q${tab === "query" || tab === "page" || tab === "country" || tab === "device" ? " — CSV'da " + tab + " ustuni bo'lmasligi mumkin (Eksportda barcha o'lchamlarni yoqib chiqing)" : ""}.`}
            </div>
          ) : tab === "device" ? (
            /* Qurilmalar — alohida ko'rinish */
            <div className="space-y-3">
              {model.groups.slice(0, 6).map((g) => {
                const Icon = DEVICE_ICON[g.key] || FaDesktop;
                return (
                  <div key={g.key} className="row-in">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-300 flex items-center gap-2">
                        <Icon size={13} style={{ color: t.accent }} />
                        {g.key}
                      </span>
                      <span className="text-gray-500">
                        <strong className="text-white">{fmtNum(g.clicks)}</strong> klik · {fmtNum(g.impressions)} ko'rsatuv ·{" "}
                        <span style={{ color: t.accent }}>{fmtCtr(g.ctr)}</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bar-fill"
                        style={{
                          width: `${Math.max((g.clicks / model.groups[0].clicks) * 100, 6)}%`,
                          background: `linear-gradient(90deg, ${t.accent}66, ${t.accent})`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : tab === "country" ? (
            <MetricsTable
              t={t}
              rows={metricRows.map((r) => ({ ...r, label: `${flagFor(r.label)} ${r.label}` }))}
            />
          ) : (
            <MetricsTable t={t} rows={metricRows} />
          )}
        </>
      )}

      {/* ── CSV import paneli ── */}
      {importOpen && (
        <div className="mt-4 p-4 rounded-2xl animate-pop-in" style={{ background: "#ffffff05", border: `1px solid ${t.accent}33` }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-white flex items-center gap-2">
              <FiUpload size={14} style={{ color: t.accent }} />
              CSV import
            </div>
            <button onClick={() => setImportOpen(false)} className="text-gray-500 hover:text-white transition-all" aria-label="Yopish">
              <FiX size={16} />
            </button>
          </div>
          <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">
            Search Console → <strong className="text-gray-300">Эффективность</strong> →{" "}
            <strong className="text-gray-300">ЭКСПОРТИРОВАТЬ</strong> → CSV faylni yuklab, shu yerga
            joylang yoki matnini ko'chirib qo'ying. Format:{" "}
            <code className="text-[10px] px-1 py-0.5 rounded" style={{ background: "#ffffff0d", color: t.accent }}>
              Date,Query,Page,Country,Device,Search type,Clicks,Impressions,CTR,Position
            </code>
          </p>
          <label
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all hover:scale-[1.02] mb-3"
            style={{ background: t.accent + "22", color: t.accent, border: `1px solid ${t.accent}44` }}
          >
            <FiFileText size={13} />
            CSV fayl tanlash
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => handleCsvFile(e.target.files?.[0] ?? null)} />
          </label>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={"Date,Query,Page,Country,Device,Search type,Clicks,Impressions,CTR,Position\n2026-07-29,stypeuz,https://styping.uz/,UZB,Mobile,web,1,3,0.333,1.5"}
            rows={6}
            className="w-full px-3 py-2.5 rounded-xl text-[11px] font-mono outline-none mb-3 resize-y"
            style={{ background: "#ffffff06", border: "1px solid #ffffff14", color: "#d1d5db" }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleCsvImport}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-95"
              style={{ background: t.accent, color: "#000" }}
            >
              Import qilish
            </button>
            <button
              onClick={() => setImportOpen(false)}
              className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:bg-white/5 transition-all"
            >
              Bekor qilish
            </button>
          </div>
        </div>
      )}

      {/* ── API sozlash paneli ── */}
      {setupOpen && (
        <div className="mt-4 p-4 rounded-2xl animate-pop-in" style={{ background: "#ffffff05", border: `1px solid #a78bfa44` }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-white flex items-center gap-2">
              <FiLink size={14} style={{ color: "#a78bfa" }} />
              API orqali ulash (avto-sinxron)
            </div>
            <button onClick={() => setSetupOpen(false)} className="text-gray-500 hover:text-white transition-all" aria-label="Yopish">
              <FiX size={16} />
            </button>
          </div>

          <label className="block text-[11px] text-gray-500 mb-1.5">Cloudflare Worker manzili</label>
          <input
            type="url"
            value={proxyUrl}
            onChange={(e) => setProxyUrlInput(e.target.value)}
            placeholder="https://gsc-proxy.workers.dev"
            className="w-full px-3 py-2.5 rounded-xl text-xs outline-none mb-2"
            style={{ background: "#ffffff06", border: `1px solid ${proxyUrl ? "#a78bfa55" : "#ffffff14"}`, color: "#fff" }}
          />
          <button
            onClick={handleApiConnect}
            disabled={!proxyUrl}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-95 mb-4 disabled:opacity-40 disabled:hover:scale-100"
            style={{ background: "#a78bfa", color: "#000" }}
          >
            Google hisobiga ulash →
          </button>

          <div className="text-[11px] text-gray-500 leading-relaxed">
            <div className="flex items-center gap-1.5 mb-2" style={{ color: "#a78bfa" }}>
              <FiSettings size={12} /> O'rnatish qo'llanmasi (bir marta)
            </div>
            <ol className="list-decimal pl-4 space-y-1.5">
              <li>
                Google Cloud Console → yangi loyiha → <strong className="text-gray-300">Search Console API</strong>{" "}
                ni yoqing.
              </li>
              <li>
                OAuth client (Web application) yarating va redirect URI sifatida{" "}
                <code className="text-[10px] px-1 py-0.5 rounded" style={{ background: "#ffffff0d", color: "#a78bfa" }}>
                  https://&lt;worker&gt;.workers.dev/callback
                </code>{" "}
                ni qo'shing.
              </li>
              <li>
                Cloudflare → Workers → Create Worker → repo'dagi{" "}
                <code className="text-[10px] px-1 py-0.5 rounded" style={{ background: "#ffffff0d", color: "#a78bfa" }}>
                  gsc-proxy/worker.js
                </code>{" "}
                kodini joylang.
              </li>
              <li>
                KV namespace yarating, binding nomi <strong className="text-gray-300">GSC_KV</strong> bo'lsin.
              </li>
              <li>
                Secrets: <strong className="text-gray-300">CLIENT_ID</strong>,{" "}
                <strong className="text-gray-300">CLIENT_SECRET</strong>,{" "}
                <strong className="text-gray-300">SITE_URL</strong> (https://styping.uz/),{" "}
                <strong className="text-gray-300">GSC_PROPERTY</strong> (https://styping.uz/).
              </li>
              <li>
                Worker manzilini yuqoridagi maydonga yozing va <strong className="text-gray-300">Google hisobiga ulash</strong>{" "}
                tugmasini bosing.
              </li>
            </ol>
            <p className="mt-3 text-[10px] text-gray-600 flex items-start gap-1.5">
              <FiAlertCircle size={12} className="mt-0.5 flex-shrink-0" />
              OAuth app "Testing" rejimda bo'lsa, token 7 kunda o'ladi. Doimiy ishlashi uchun Google
              Cloud'da app'ni "In production" ga o'tkazing (buning uchun{" "}
              <a href="https://t.me/said_khujayev" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "#5fb8e8" }}>
                @said_khujayev
              </a>{" "}
              ga yozing).
            </p>
          </div>
        </div>
      )}

      {/* Haqiqiylik belgisi */}
      {model && (
        <div className="mt-4 flex items-center gap-1.5 text-[10px] text-gray-600">
          <FiCheckCircle size={11} style={{ color: "#22c55e" }} />
          Ma'lumotlar Google Search Console'dan —{" "}
          {isApi ? "API orqali avtomatik yangilanadi" : "CSV eksport orqali yuklandi"}
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 hover:underline"
            style={{ color: t.accent }}
          >
            <FiExternalLink size={10} /> Search Console
          </a>
        </div>
      )}
    </div>
  );
}

function hostname(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname + (u.pathname.length > 1 ? u.pathname : "");
  } catch {
    return "";
  }
}
