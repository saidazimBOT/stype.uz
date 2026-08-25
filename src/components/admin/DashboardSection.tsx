"use client";

import { useMemo, useState } from "react";
import type { ThemeColors, TestResult } from "../../types";
import {
  FiActivity, FiBarChart2, FiClock, FiDollarSign, FiEdit3, FiEye, FiPlus, FiTarget, FiTrendingUp, FiUsers, FiZap,
} from "react-icons/fi";
import { readVisits, visitsPerDay, countToday, countThisWeek, uniqueVisitors, readTypingLog } from "../../hooks/useVisitTracker";
import { StatCard, Card, SectionHeader, Spinner, EmptyState, PrimaryBtn, TextInput } from "./adminUi";
import { formatCoin } from "../../utils/formatCoin";
import { useSupabaseQuery } from "../../hooks/useSupabaseQuery";
import { getAdminStats } from "../../lib/db";

interface Props {
  t: ThemeColors;
  serverAdmin: boolean;
  history: TestResult[];
  xp: number;
}

export default function DashboardSection({ t, serverAdmin, history, xp }: Props) {
  const [myCoins, setMyCoins] = useState(0);
  const [coinAmount, setCoinAmount] = useState("");
  const [coinMsg, setCoinMsg] = useState("");

  useMemo(() => {
    const read = () => {
      const raw = localStorage.getItem("typeuz_coins");
      setMyCoins(raw ? parseInt(raw, 10) || 0 : 0);
    };
    read();
  }, []);

  const addMyCoins = (amount: number) => {
    if (!amount || amount <= 0) return;
    const total = myCoins + amount;
    localStorage.setItem("typeuz_coins", String(total));
    window.dispatchEvent(new CustomEvent("typeuz-coins-sync", { detail: total }));
    setMyCoins(total);
    setCoinMsg(`✓ ${amount} coin qo'shildi — hozirgi balans: ${total}`);
    setTimeout(() => setCoinMsg(""), 2500);
  };

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
    const live = raw.filter((v) => Date.now() - (v.lastSeen ?? v.time) < 30 * 60 * 1000).slice(0, 8).map((v) => ({
      id: v.id, flag: v.flag ?? "🌍", place: [v.city, v.country].filter(Boolean).join(", ") || "Noma'lum",
      device: v.device, minutesAgo: Math.max(0, Math.round((Date.now() - (v.lastSeen ?? v.time)) / 60000)),
    }));
    return {
      total: raw.length, today: countToday(raw), week: countThisWeek(raw), unique: uniqueVisitors(raw),
      chart: visitsPerDay(raw, 14), online, live, countries, typingToday,
      typingAvgWpm: typingRaw.length ? Math.round(typingRaw.reduce((a, ty) => a + ty.wpm, 0) / typingRaw.length) : 0,
      tests: history.length,
      bestWpm: history.length ? Math.max(...history.map((h) => h.wpm)) : 0,
      avgAcc: history.length ? Math.round(history.reduce((a, h) => a + h.accuracy, 0) / history.length) : 100,
    };
  }, [history]);

  const maxChart = Math.max(...local.chart.map((d) => d.count), 1);

  return (
    <div className="space-y-4">
      {/* O'zimga coin berish */}
      <Card t={t} className="p-5" style={{ background: `linear-gradient(135deg, #f59e0b11, #f59e0b05)`, border: "1px solid #f59e0b33" }}>
        <SectionHeader t={t} icon={FiDollarSign} title="O'zimga coin berish" subtitle="Faqat siz (admin) ko'rasiz" />
        <div className="mt-3 flex items-center gap-4 flex-wrap">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold" style={{ color: "#fbbf24" }}>{formatCoin(myCoins)}</span>
            <span className="text-xs text-gray-500">🪙 coin</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {[100, 500, 1000, 5000].map((n) => (
              <button key={n} onClick={() => addMyCoins(n)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:scale-105"
                style={{ background: "#22c55e1a", color: "#4ade80", border: "1px solid #22c55e44" }}>
                <FiPlus size={10} className="inline mr-0.5" />{n}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <TextInput t={t} value={coinAmount} onChange={setCoinAmount} type="number" placeholder="Boshqa miqdor" className="w-28" accent />
            <PrimaryBtn t={t} onClick={() => addMyCoins(Math.round(Number(coinAmount) || 0))} disabled={!(Math.round(Number(coinAmount) || 0) > 0)}>
              <FiPlus size={12} /> Qo'shish
            </PrimaryBtn>
          </div>
        </div>
        {coinMsg && (
          <div className="mt-3 px-3 py-2 rounded-xl text-xs text-green-400 bg-green-500/10 border border-green-500/30 animate-pop-in">{coinMsg}</div>
        )}
      </Card>

      {/* Server Analytics */}
      {serverAdmin && <ServerAnalytics t={t} />}

      {/* Local Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 admin-stagger">
        <StatCard t={t} icon={FiEye} label="Jami tashrif" value={local.total} color={t.accent} />
        <StatCard t={t} icon={FiActivity} label="Bugun" value={local.today} color="#22c55e" />
        <StatCard t={t} icon={FiClock} label="7 kun ichida" value={local.week} color="#38bdf8" />
        <StatCard t={t} icon={FiUsers} label="Unikal tashrif" value={local.unique} color="#f59e0b" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card t={t} className="p-5">
          <SectionHeader t={t} icon={FiActivity} title="Jonli faollik" subtitle={`${local.online} onlayn`} />
          {local.live.length === 0 ? (
            <EmptyState t={t} title="So'nggi 30 daqiqada faol tashrif yo'q" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {local.live.map((l, i) => (
                <div key={l.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 row-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <span className="text-lg leading-none">{l.flag}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-white truncate">{l.place}</div>
                    <div className="text-[10px] text-gray-500">{l.device}</div>
                  </div>
                  <span className="text-[10px] text-gray-500 whitespace-nowrap">{l.minutesAgo === 0 ? "hozir" : `${l.minutesAgo} daq. oldin`}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card t={t} className="p-5">
          <SectionHeader t={t} icon={FiUsers} title="Mamlakatlar bo'yicha" />
          {local.countries.length === 0 ? (
            <EmptyState t={t} title="Hozircha mamlakat ma'lumotlari yo'q" />
          ) : (
            <div className="space-y-3">
              {local.countries.map((c, i) => (
                <div key={c.name} className="row-in" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-300 flex items-center gap-1.5"><span className="text-base leading-none">{c.flag}</span>{c.name}</span>
                    <span className="font-bold" style={{ color: t.accent }}>{c.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full bar-fill" style={{ width: `${Math.max((c.count / local.countries[0].count) * 100, 8)}%`, background: `linear-gradient(90deg, ${t.accent}66, ${t.accent})` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card t={t} className="p-5">
          <SectionHeader t={t} icon={FiBarChart2} title="So'nggi 14 kun — tashriflar" />
          <div className="flex items-end gap-1.5 h-32">
            {local.chart.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="w-full rounded-t transition-all duration-300 group-hover:opacity-80"
                  style={{ height: `${Math.max((d.count / maxChart) * 100, d.count > 0 ? 8 : 3)}%`, background: d.count > 0 ? t.accent : "#ffffff12", opacity: d.count > 0 ? 0.55 + (d.count / maxChart) * 0.45 : 1 }}
                  title={`${d.label}: ${d.count}`} />
                <span className="text-[8px] text-gray-600 whitespace-nowrap">{d.label}</span>
              </div>
            ))}
          </div>
        </Card>
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
    </div>
  );
}

// Server Analytics — Supabase'dan
function ServerAnalytics({ t }: { t: ThemeColors }) {
  const { data: stats, loading } = useSupabaseQuery(() => getAdminStats());
  const [range, setRange] = useState<7 | 30>(7);

  return (
    <div className="space-y-4">
      <SectionHeader t={t} icon={FiTrendingUp} title="Analytics Dashboard" subtitle="Supabase ma'lumotlari"
        actions={
          <div className="flex gap-1.5">
            {([7, 30] as const).map((r) => (
              <button key={r} onClick={() => setRange(r)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
                style={{ background: range === r ? t.accent + "22" : "transparent", color: range === r ? t.accent : "#6b7280", border: `1px solid ${range === r ? t.accent + "44" : "transparent"}` }}>
                {r} kun
              </button>
            ))}
          </div>
        } />
      {!stats ? (
        <Card t={t}><Spinner t={t} label="Statistika yuklanmoqda..." /></Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 admin-stagger">
          <StatCard t={t} icon={FiUsers} label="Jami foydalanuvchilar" value={stats.totals.users} color={t.accent} sub={`+${stats.totals.newUsers7d} (7 kun)`} />
          <StatCard t={t} icon={FiZap} label="Testlar bugun" value={stats.totals.testsToday} color="#f59e0b" />
          <StatCard t={t} icon={FiTarget} label="O'rtacha WPM" value={stats.totals.avgWpm7d} color="#a78bfa" />
          <StatCard t={t} icon={FiBarChart2} label="O'rtacha aniqlik" value={`${stats.totals.avgAcc7d}%`} color="#22c55e" />
          <StatCard t={t} icon={FiEdit3} label="Testlar (7 kun)" value={stats.totals.tests7d} color="#38bdf8" />
          <StatCard t={t} icon={FiEye} label="Eng yuqori WPM" value={stats.totals.bestWpm} color="#f59e0b" />
        </div>
      )}
    </div>
  );
}
