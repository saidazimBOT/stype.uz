"use client";

import { useMemo, useState } from "react";
import {
  FiActivity, FiBarChart2, FiClock, FiEdit3, FiEye, FiLock, FiLogOut,
  FiMonitor, FiSend, FiShield, FiSmartphone, FiTrash2, FiUser, FiUsers,
} from "react-icons/fi";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import {
  readVisits, clearVisits, visitsPerDay, countToday, countThisWeek, uniqueVisitors,
  readTypingLog, clearTypingLog,
} from "../../hooks/useVisitTracker";
import type { ThemeColors, TestResult } from "../../types";

// Telegram: admin bo'lish yoki savollar uchun
const ADMIN_TELEGRAM = "@said_khujayev";
const ADMIN_TELEGRAM_URL = "https://t.me/said_khujayev";

// ── ADMIN CREDENTIALS (faqat bitta admin) ────────────────────────────────
// Diqqat: sayt statik bo'lgani uchun bu ma'lumot kod ichida ochiq turadi.
// Real xavfsizlik uchun backend (Supabase auth) kerak bo'ladi.
const ADMIN_LOGIN = "admin";
const ADMIN_EMAIL = "saidazim@gmail.com";
const ADMIN_PASSWORD = "0111954";
const SESSION_KEY = "typeuz_admin_session";

interface AdminPanelProps {
  t: ThemeColors;
  onClose: () => void;
  history: TestResult[];
  xp: number;
}

interface VisitLogRow {
  id: string;
  time: string;
  device: string;
  deviceType: string;
  browser: string;
  lang: string;
  theme: string;
  screen: string;
}

const DEVICE_ICONS: Record<string, typeof FiMonitor> = {
  Mobile: FiSmartphone,
  Tablet: FiSmartphone,
  Desktop: FiMonitor,
};

export default function AdminPanel({ t, onClose, history, xp }: AdminPanelProps) {
  const [loggedIn, setLoggedIn] = useLocalStorage(SESSION_KEY, false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // ── LOGIN ────────────────────────────────────────────────────────────
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const login = email.trim().toLowerCase();
    if ((login === ADMIN_LOGIN || login === ADMIN_EMAIL) && password === ADMIN_PASSWORD) {
      setLoggedIn(true);
      setError("");
      setPassword("");
    } else {
      setError("Login yoki parol noto'g'ri!");
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setEmail("");
    setPassword("");
  };

  // ── DATA (faqat admin kirganda yuklanadi) ────────────────────────────
  const data = useMemo(() => {
    if (!loggedIn) return null;
    const raw = readVisits();
    const rows: VisitLogRow[] = raw.map((v) => ({
      id: v.id,
      time: new Date(v.time).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
      device: v.device,
      deviceType: v.deviceType,
      browser: v.browser,
      lang: v.lang.toUpperCase(),
      theme: v.theme,
      screen: v.screen,
    }));
    const typingRaw = readTypingLog();
    const typingRows = typingRaw.map((ty) => ({
      id: ty.id,
      time: new Date(ty.time).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
      wpm: ty.wpm,
      accuracy: ty.accuracy,
      errors: ty.errors,
      lang: ty.lang.toUpperCase(),
      browser: ty.browser,
      device: ty.device,
      deviceType: ty.deviceType,
    }));
    const todayKey = new Date().toDateString();
    const typingToday = typingRaw.filter((ty) => new Date(ty.time).toDateString() === todayKey).length;
    return {
      rows,
      total: rows.length,
      today: countToday(raw),
      week: countThisWeek(raw),
      unique: uniqueVisitors(raw),
      chart: visitsPerDay(raw, 14),
      typingRows,
      typingToday,
      typingAvgWpm: typingRaw.length
        ? Math.round(typingRaw.reduce((a, ty) => a + ty.wpm, 0) / typingRaw.length)
        : 0,
      tests: history.length,
      bestWpm: history.length ? Math.max(...history.map((h) => h.wpm)) : 0,
      avgAcc: history.length
        ? Math.round(history.reduce((a, h) => a + h.accuracy, 0) / history.length)
        : 100,
      langs: new Set(history.map((h) => h.lang)).size,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn, refreshKey, history, xp]);

  const refresh = () => setRefreshKey((k) => k + 1);

  // ── LOGIN SCREEN ─────────────────────────────────────────────────────
  if (!loggedIn) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-10 overflow-y-auto">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm p-8 rounded-3xl animate-pop-in"
          style={{ background: t.surface, border: `1px solid ${t.accent}33`, boxShadow: `0 0 60px ${t.accent}22` }}
        >
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: t.accent + "22", color: t.accent, border: `1px solid ${t.accent}44` }}
            >
              <FiShield size={30} />
            </div>
            <h2 className="text-xl font-bold text-white">Admin Panel</h2>
            <p className="text-xs text-gray-500 mt-1">Faqat administratorlar uchun</p>
          </div>

          <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">Login</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin"
            autoComplete="username"
            required
            className="w-full px-4 py-2.5 rounded-xl text-sm mb-4 outline-none transition-all"
            style={{
              background: "#ffffff08",
              border: `1px solid ${email ? t.accent + "55" : "transparent"}`,
              color: "#fff",
            }}
          />

          <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">Parol</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            className="w-full px-4 py-2.5 rounded-xl text-sm mb-5 outline-none transition-all"
            style={{
              background: "#ffffff08",
              border: `1px solid ${password ? t.accent + "55" : "transparent"}`,
              color: "#fff",
            }}
          />

          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg text-xs text-red-400 bg-red-500/10 border border-red-500/30 animate-pop-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
            style={{ background: t.accent, color: "#000" }}
          >
            <FiLock size={14} />
            Kirish
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full mt-3 py-2 rounded-xl text-xs text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all"
          >
            ← Saytga qaytish
          </button>

          <a
            href={ADMIN_TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs transition-all hover:scale-[1.02] active:scale-95"
            style={{
              background: "#229ed918",
              border: "1px solid #229ed933",
              color: "#5fb8e8",
            }}
            title={`Telegram: ${ADMIN_TELEGRAM}`}
          >
            <FiSend size={13} />
            <span>
              Admin bo'lishni xohlaysizmi? <strong>Telegram: {ADMIN_TELEGRAM}</strong>
            </span>
          </a>
        </form>
      </div>
    );
  }

  // ── DASHBOARD ────────────────────────────────────────────────────────
  const maxChart = Math.max(...data!.chart.map((d) => d.count), 1);

  const statCards = [
    { label: "Jami tashrif", value: data!.total, icon: FiEye, color: t.accent },
    { label: "Bugun", value: data!.today, icon: FiActivity, color: "#22c55e" },
    { label: "7 kun ichida", value: data!.week, icon: FiClock, color: "#38bdf8" },
    { label: "Unikal tashrif", value: data!.unique, icon: FiUsers, color: "#f59e0b" },
  ];

  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-4xl mx-auto w-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FiShield style={{ color: t.accent }} />
            Admin Panel
          </h2>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
            <FiUser size={12} style={{ color: t.accent }} />
            {ADMIN_LOGIN} · {ADMIN_EMAIL}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="px-3 py-1.5 rounded-lg text-xs hover:bg-white/5 text-gray-400 transition-all"
          >
            ⟳ Yangilash
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 flex items-center gap-1.5"
            style={{ background: t.accent + "22", color: t.accent }}
          >
            <FiLogOut size={12} />
            Chiqish
          </button>
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:bg-white/5 transition-all">
            ← Orqaga
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="p-4 rounded-2xl transition-all hover:scale-[1.03]"
            style={{ background: t.surface, border: `1px solid ${s.color}22` }}
          >
            <s.icon size={16} style={{ color: s.color }} className="mb-2" />
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Chart */}
        <div className="p-5 rounded-2xl" style={{ background: t.surface, border: `1px solid ${t.accent}1a` }}>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-4">
            <FiBarChart2 style={{ color: t.accent }} />
            So'nggi 14 kun — tashriflar
          </div>
          <div className="flex items-end gap-1.5 h-32">
            {data!.chart.map((d, i) => (
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
        </div>

        {/* Site stats */}
        <div className="p-5 rounded-2xl" style={{ background: t.surface, border: `1px solid ${t.accent}1a` }}>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-4">
            <FiActivity style={{ color: t.accent }} />
            Sayt statistikasi
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Testlar soni", value: data!.tests, color: "#38bdf8" },
              { label: "Eng yaxshi WPM", value: data!.bestWpm, color: t.accent },
              { label: "O'rtacha aniqlik", value: data!.avgAcc + "%", color: "#22c55e" },
              { label: "Bugun type qilganlar", value: data!.typingToday, color: "#f59e0b" },
              { label: "O'rtacha WPM (jurnal)", value: data!.typingAvgWpm, color: "#a78bfa" },
              { label: "Umumiy XP", value: xp.toLocaleString(), color: "#ec4899" },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-xl" style={{ background: "#ffffff06" }}>
                <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[11px] text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visitors log */}
      <div className="p-5 rounded-2xl mb-6" style={{ background: t.surface, border: `1px solid ${t.accent}1a` }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
            <FiEye style={{ color: t.accent }} />
            Tashriflar jurnali
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: t.accent + "22", color: t.accent }}>
              {data!.rows.length}
            </span>
          </div>
          <button
            onClick={() => {
              clearVisits();
              refresh();
            }}
            className="text-[11px] px-2.5 py-1 rounded-lg text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-1"
          >
            <FiTrash2 size={11} />
            Tozalash
          </button>
        </div>

        {data!.rows.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-600">
            Hozircha tashriflar yo'q. Saytga kirganlar shu yerda ko'rinadi.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-600 uppercase tracking-widest text-[10px]">
                  <th className="py-2 pr-3">Vaqt</th>
                  <th className="py-2 pr-3">Qurilma</th>
                  <th className="py-2 pr-3">Brauzer</th>
                  <th className="py-2 pr-3">Til</th>
                  <th className="py-2 pr-3">Tema</th>
                  <th className="py-2">Ekran</th>
                </tr>
              </thead>
              <tbody>
                {data!.rows.slice(0, 40).map((v) => {
                  const Icon = DEVICE_ICONS[v.deviceType] || FiMonitor;
                  return (
                    <tr key={v.id} className="border-t border-white/5 hover:bg-white/[0.03] transition-colors">
                      <td className="py-2 pr-3 text-gray-400 whitespace-nowrap">{v.time}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Icon size={11} style={{ color: t.accent }} />
                          {v.device}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-gray-300">{v.browser}</td>
                      <td className="py-2 pr-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: "#ffffff0d", color: "#9ca3af" }}>
                          {v.lang}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-gray-400">{v.theme}</td>
                      <td className="py-2 text-gray-600 whitespace-nowrap">{v.screen}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Typing log */}
      <div className="p-5 rounded-2xl mb-6" style={{ background: t.surface, border: `1px solid ${t.accent}1a` }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
            <FiEdit3 style={{ color: t.accent }} />
            Type qilganlar jurnali
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: t.accent + "22", color: t.accent }}>
              {data!.typingRows.length}
            </span>
          </div>
          <button
            onClick={() => {
              clearTypingLog();
              refresh();
            }}
            className="text-[11px] px-2.5 py-1 rounded-lg text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-1"
          >
            <FiTrash2 size={11} />
            Tozalash
          </button>
        </div>

        {data!.typingRows.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-600">
            Hozircha type qilingan testlar yo'q. Foydalanuvchilar test tugatganda shu yerda ko'rinadi.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-600 uppercase tracking-widest text-[10px]">
                  <th className="py-2 pr-3">Vaqt</th>
                  <th className="py-2 pr-3">Qurilma</th>
                  <th className="py-2 pr-3">Til</th>
                  <th className="py-2 pr-3">WPM</th>
                  <th className="py-2 pr-3">Aniqlik</th>
                  <th className="py-2">Xatolar</th>
                </tr>
              </thead>
              <tbody>
                {data!.typingRows.slice(0, 40).map((ty) => {
                  const Icon = DEVICE_ICONS[ty.deviceType] || FiMonitor;
                  return (
                    <tr key={ty.id} className="border-t border-white/5 hover:bg-white/[0.03] transition-colors">
                      <td className="py-2 pr-3 text-gray-400 whitespace-nowrap">{ty.time}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Icon size={11} style={{ color: t.accent }} />
                          {ty.device} · {ty.browser}
                        </span>
                      </td>
                      <td className="py-2 pr-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: "#ffffff0d", color: "#9ca3af" }}>
                          {ty.lang}
                        </span>
                      </td>
                      <td className="py-2 pr-3 font-bold" style={{ color: t.accent }}>{ty.wpm}</td>
                      <td className="py-2 pr-3">
                        <span style={{ color: ty.accuracy >= 95 ? "#22c55e" : ty.accuracy >= 80 ? "#f59e0b" : "#ef4444" }}>
                          {ty.accuracy}%
                        </span>
                      </td>
                      <td className="py-2 text-gray-500">{ty.errors}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Note about emails */}
      <div
        className="p-5 rounded-2xl text-sm leading-relaxed"
        style={{ background: "#ffffff05", border: `1px solid ${"#f59e0b"}33` }}
      >
        <div className="flex items-center gap-2 font-medium mb-2" style={{ color: "#f59e0b" }}>
          <FiShield size={15} />
          Foydalanuvchilar emaili haqida
        </div>
        <p className="text-gray-400">
          Saytda ro'yxatdan o'tish tizimi yo'q, shuning uchun tashrif buyuruvchilarning email
          manzillarini yig'ib bo'lmaydi. Hozircha tashriflar soni, qurilma, brauzer va type
          faolligi kuzatilmoqda. <span className="text-gray-300">Real email yig'ish</span> uchun
          Supabase database yoki Simple Analytics xizmatini ulash kerak bo'ladi.
        </p>
        <p className="text-gray-500 mt-3 flex items-center gap-1.5">
          <FiSend size={12} style={{ color: "#5fb8e8" }} />
          Savol yoki admin ruxsati uchun:{" "}
          <a
            href={ADMIN_TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:underline"
            style={{ color: "#5fb8e8" }}
          >
            {ADMIN_TELEGRAM}
          </a>
        </p>
      </div>
    </div>
  );
}
