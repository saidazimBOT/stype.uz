"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { ThemeColors, TestResult } from "../../types";
import {
  FiActivity, FiBarChart2, FiClock, FiEdit3, FiEye, FiTarget, FiTrendingUp, FiUsers, FiZap,
} from "react-icons/fi";
import {
  readVisits, visitsPerDay, countToday, countThisWeek, uniqueVisitors, readTypingLog,
} from "../../hooks/useVisitTracker";
import { StatCard, Card, SectionHeader, Spinner, EmptyState } from "./adminUi";
import { LineChart, BarChart, type ChartPoint } from "./charts";
import type { AdminStats } from "./types";

interface Props {
  t: ThemeColors;
  serverAdmin: boolean;
  history: TestResult[];
  xp: number;
}

export default function DashboardSection({ t, serverAdmin, history, xp }: Props) {
  // ── Lokal (legacy) statistika — har doim mavjud ─────────────────────
  const local = useMemo(() => {
    const raw = readVisits();
    const typingRaw = readTypingLog();
    const todayKey = new Date().toDateString();
    const typingToday = typingRaw.filter((ty) => new Date(ty.time).toDateString() === todayKey).length;
    const online = raw.filter((v) => Date.now() - (v.lastSeen ?? v.time) < 5 * 60 * 1000).length;

    const countryMap = new Map<string, { flag: string; name: string; count: number }>();
    for (const v of raw) {
      const key = (v.countryCode || v.country || "Noma'lum").toLowerCase();
      const cur = countryMap.get(key);
      if (cur) cur.count++;
      else countryMap.set(key, { flag: v.flag ?? "🌍", name: v.country || "Noma'lum", count: 1 });
    }
    const countries = [...countryMap.values()].sort((a, b) => b.count - a.count).slice(0, 6);

    const live = raw
      .filter((v) => Date.now() - (v.lastSeen ?? v.time) < 30 * 60 * 1000)
      .slice(0, 8)
      .map((v) => ({
        id: v.id,
        flag: v.flag ?? "🌍",
        place: [v.city, v.country].filter(Boolean).join(", ") || "Noma'lum",
        device: v.device,
        minutesAgo: Math.max(0, Math.round((Date.now() - (v.lastSeen ?? v.time)) / 60000)),
      }));

    return {
      total: raw.length,
      today: countToday(raw),
      week: countThisWeek(raw),
      unique: uniqueVisitors(raw),
      chart: visitsPerDay(raw, 14),
      online,
      live,
      countries,
      typingToday,
      typingAvgWpm: typingRaw.length
        ? Math.round(typingRaw.reduce((a, ty) => a + ty.wpm, 0) / typingRaw.length)
        : 0,
      tests: history.length,
      bestWpm: history.length ? Math.max(...history.map((h) => h.wpm)) : 0,
      avgAcc: history.length
        ? Math.round(history.reduce((a, h) => a + h.accuracy, 0) / history.length)
        : 100,
    };
  }, [history]);

  const maxChart = Math.max(...local.chart.map((d) => d.count), 1);

  return (
    <div className="space-y-4">
      {/* ══ SERVER ANALYTICS (faqat Convex rejimda — hooklar xavfsiz mount bo'ladi) ══ */}
      {serverAdmin && <ServerAnalytics t={t} />}

      {/* ══ LEGACY LOCAL STATS (har doim) ══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard t={t} icon={FiEye} label="Jami tashrif" value={local.total} color={t.accent} />
        <StatCard t={t} icon={FiActivity} label="Bugun" value={local.today} color="#22c55e" />
        <StatCard t={t} icon={FiClock} label="7 kun ichida" value={local.week} color="#38bdf8" />
        <StatCard t={t} icon={FiUsers} label="Unikal tashrif" value={local.unique} color="#f59e0b" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Live activity */}
        <Card t={t} className="p-5">
          <SectionHeader
            t={t}
            icon={FiActivity}
            title="Jonli faollik"
            subtitle={`${local.online} onlayn`}
          />
          <p className="text-[11px] text-gray-500 mb-3">
            Eslatma: statik rejimda faollik faqat shu brauzerda kuzatiladi.
          </p>
          {local.live.length === 0 ? (
            <EmptyState t={t} title="So'nggi 30 daqiqada faol tashrif yo'q" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {local.live.map((l, i) => (
                <div
                  key={l.id}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 row-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <span className="text-lg leading-none">{l.flag}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-white truncate">{l.place}</div>
                    <div className="text-[10px] text-gray-500">{l.device}</div>
                  </div>
                  <span className="text-[10px] text-gray-500 whitespace-nowrap">
                    {l.minutesAgo === 0 ? "hozir" : `${l.minutesAgo} daq. oldin`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Countries */}
        <Card t={t} className="p-5">
          <SectionHeader t={t} icon={FiUsers} title="Mamlakatlar bo'yicha" />
          {local.countries.length === 0 ? (
            <EmptyState t={t} title="Hozircha mamlakat ma'lumotlari yo'q" />
          ) : (
            <div className="space-y-3">
              {local.countries.map((c, i) => (
                <div key={c.name} className="row-in" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-300 flex items-center gap-1.5">
                      <span className="text-base leading-none">{c.flag}</span>
                      {c.name}
                    </span>
                    <span className="font-bold" style={{ color: t.accent }}>{c.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bar-fill"
                      style={{
                        width: `${Math.max((c.count / local.countries[0].count) * 100, 8)}%`,
                        background: `linear-gradient(90deg, ${t.accent}66, ${t.accent})`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* 14-day visits chart */}
        <Card t={t} className="p-5">
          <SectionHeader t={t} icon={FiBarChart2} title="So'nggi 14 kun — tashriflar" />
          <div className="flex items-end gap-1.5 h-32">
            {local.chart.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div
                  className="w-full rounded-t transition-all duration-300 group-hover:opacity-80"
                  style={{
                    height: `${Math.max((d.count / maxChart) * 100, d.count > 0 ? 8 : 3)}%`,
                    background: d.count > 0 ? t.accent : "#ffffff12",
                    opacity: d.count > 0 ? 0.55 + (d.count / maxChart) * 0.45 : 1,
                  }}
                  title={`${d.label}: ${d.count}`}
                />
                <span className="text-[8px] text-gray-600 whitespace-nowrap">{d.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Site stats */}
        <Card t={t} className="p-5">
          <SectionHeader t={t} icon={FiActivity} title="Sayt statistikasi" />
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Testlar soni", value: local.tests, color: "#38bdf8" },
              { label: "Eng yaxshi WPM", value: local.bestWpm, color: t.accent },
              { label: "O'rtacha aniqlik", value: local.avgAcc + "%", color: "#22c55e" },
              { label: "Bugun type qilganlar", value: local.typingToday, color: "#f59e0b" },
              { label: "O'rtacha WPM (jurnal)", value: local.typingAvgWpm, color: "#a78bfa" },
              { label: "Umumiy XP", value: xp.toLocaleString(), color: "#ec4899" },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-xl" style={{ background: "#ffffff06" }}>
                <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[11px] text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {!serverAdmin && (
        <div className="text-[11px] text-gray-600 px-1">
          <FiBarChart2 size={11} className="inline mr-1" />
          Real foydalanuvchi statistikasi (jami foydalanuvchilar, onlayn, testlar, WPM) Convex backend
          ulangan va admin rol berilganda ko'rinadi.
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// SERVER ANALYTICS — faqat Convex rejimda mount bo'ladi.
// Bu komponent ajratilgani sababi: legacy rejimda convex hook'larini
// (useQuery) chaqirish butun sahifani qulatadi ("Could not find
// ConvexReactClient in context"). serverAdmin=true bo'lgandagina mount
// bo'lgani uchun hook'lar xavfsiz.
// ══════════════════════════════════════════════════════════════════════
function ServerAnalytics({ t }: { t: ThemeColors }) {
  const stats = useQuery(api.admin.adminStats) as AdminStats | undefined;
  const [range, setRange] = useState<7 | 30>(7);

  const series = stats?.series ?? [];
  const rangeSeries = range === 7 ? series.slice(-7) : series;
  const wpmData: ChartPoint[] = rangeSeries.map((s) => ({
    label: s.label,
    value: s.wpm,
    hint: `${s.tests} test`,
  }));
  const testsData: ChartPoint[] = rangeSeries.map((s) => ({ label: s.label, value: s.tests }));
  const usersData: ChartPoint[] = rangeSeries.map((s) => ({ label: s.label, value: s.newUsers }));

  return (
    <div className="space-y-4">
      <SectionHeader
        t={t}
        icon={FiTrendingUp}
        title="Analytics Dashboard"
        subtitle="Convex ma'lumotlari"
        actions={
          <div className="flex gap-1.5">
            {([7, 30] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
                style={{
                  background: range === r ? t.accent + "22" : "transparent",
                  color: range === r ? t.accent : "#6b7280",
                  border: `1px solid ${range === r ? t.accent + "44" : "transparent"}`,
                }}
              >
                {r} kun
              </button>
            ))}
          </div>
        }
      />

      {!stats ? (
        <Card t={t}>
          <Spinner t={t} label="Statistika yuklanmoqda..." />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <StatCard t={t} icon={FiUsers} label="Jami foydalanuvchilar" value={stats.totals.users} color={t.accent} sub={`+${stats.totals.newUsers7d} (7 kun)`} />
            <StatCard t={t} icon={FiActivity} label="Onlayn (5 daq.)" value={stats.totals.online} color="#22c55e" />
            <StatCard t={t} icon={FiZap} label="Yangi bugun" value={stats.totals.newToday} color="#38bdf8" />
            <StatCard t={t} icon={FiEdit3} label="Testlar bugun" value={stats.totals.testsToday} color="#f59e0b" />
            <StatCard t={t} icon={FiTarget} label="O'rtacha WPM" value={stats.totals.avgWpm7d} color="#a78bfa" sub={`umumiy: ${stats.totals.avgWpm}`} />
            <StatCard t={t} icon={FiBarChart2} label="O'rtacha aniqlik" value={`${stats.totals.avgAcc7d}%`} color="#22c55e" sub={`umumiy: ${stats.totals.avgAcc}%`} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card t={t} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <FiTarget size={13} style={{ color: t.accent }} />
                  O'rtacha WPM ({range} kun)
                </div>
                <span className="text-xs font-bold" style={{ color: t.accent }}>
                  {stats.totals[range === 7 ? "avgWpm7d" : "avgWpm30d"]} WPM
                </span>
              </div>
              <LineChart t={t} data={wpmData} color="#a78bfa" />
            </Card>
            <Card t={t} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <FiEdit3 size={13} style={{ color: t.accent }} />
                  Testlar ({range} kun)
                </div>
                <span className="text-xs font-bold" style={{ color: t.accent }}>
                  {stats.totals[range === 7 ? "tests7d" : "tests30d"]}
                </span>
              </div>
              <BarChart t={t} data={testsData} color={t.accent} height={150} />
            </Card>
            <Card t={t} className="p-5 md:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <FiUsers size={13} style={{ color: "#38bdf8" }} />
                  Yangi foydalanuvchilar ({range} kun)
                </div>
                <span className="text-xs font-bold" style={{ color: "#38bdf8" }}>
                  +{stats.totals[range === 7 ? "newUsers7d" : "newUsers30d"]}
                </span>
              </div>
              <BarChart t={t} data={usersData} color="#38bdf8" height={110} />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
