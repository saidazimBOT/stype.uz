"use client";

import { useMemo } from "react";
import { FiAward, FiGlobe, FiMoon, FiSmile, FiStar, FiSun, FiTarget, FiUser, FiZap } from "react-icons/fi";
import { FaFire, FaGem, FaTrophy } from "react-icons/fa6";
import type { IconType } from "react-icons";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { getAvatarInfo } from "../../data/shop";
import type { ThemeColors, TestResult } from "../../types";

interface ProfileViewProps {
  t: ThemeColors;
  onClose: () => void;
  history: TestResult[];
  activeAvatar?: string;
}

const BADGES_DB: { icon: IconType; name: string; desc: string; check: (h: TestResult[]) => boolean }[] = [
  { icon: FiZap, name: "Speed Demon", desc: "100+ WPM", check: (h: TestResult[]) => Math.max(...h.map((t) => t.wpm), 0) >= 100 },
  { icon: FiTarget, name: "Sharpshooter", desc: "98%+ accuracy", check: (h: TestResult[]) => h.length > 0 && Math.round(h.reduce((a, t) => a + t.accuracy, 0) / h.length) >= 98 },
  { icon: FaFire, name: "On Fire", desc: "5 tests done", check: (h: TestResult[]) => h.length >= 5 },
  { icon: FaTrophy, name: "Champion", desc: "150+ WPM", check: (h: TestResult[]) => Math.max(...h.map((t) => t.wpm), 0) >= 150 },
  { icon: FaGem, name: "Diamond", desc: "200+ WPM", check: (h: TestResult[]) => Math.max(...h.map((t) => t.wpm), 0) >= 200 },
  { icon: FiMoon, name: "Night Owl", desc: "10 tests done", check: (h: TestResult[]) => h.length >= 10 },
  { icon: FiSun, name: "Daily Player", desc: "3 day streak", check: () => {
    try { const d = JSON.parse(localStorage.getItem("typeuz_daily") || "{}"); return (d.streak || 0) >= 3; }
    catch { return false; }
  }},
  { icon: FiStar, name: "Week Warrior", desc: "7 day streak", check: () => {
    try { const d = JSON.parse(localStorage.getItem("typeuz_daily") || "{}"); return (d.streak || 0) >= 7; }
    catch { return false; }
  }},
  { icon: FiGlobe, name: "Polyglot", desc: "3 languages", check: (h: TestResult[]) => new Set(h.map((t) => t.lang)).size >= 3 },
];

export default function ProfileView({ t, onClose, history, activeAvatar = "avatar_default" }: ProfileViewProps) {
  const [xp] = useLocalStorage("typeuz_xp", 0);

  const stats = useMemo(() => {
    if (!history || history.length === 0) return { best: 0, avgWpm: 0, avgAcc: 100, tests: 0 };
    const best = Math.max(...history.map((h) => h.wpm));
    const avgWpm = Math.round(history.reduce((a, h) => a + h.wpm, 0) / history.length);
    const avgAcc = Math.round(history.reduce((a, h) => a + h.accuracy, 0) / history.length);
    return { best, avgWpm, avgAcc, tests: history.length };
  }, [history]);

  const badges = useMemo(() => {
    return BADGES_DB.map((b) => ({
      ...b,
      earned: b.check(history),
    }));
  }, [history]);

  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto w-full overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FiUser />
          Profile
        </h2>
        <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400">
          ← Back
        </button>
      </div>

      {/* Avatar & info card */}
      <div
        className="flex items-center gap-6 p-6 rounded-2xl mb-6"
        style={{ background: t.surface, border: `1px solid ${t.accent}22` }}
      >
        {(() => {
          const av = getAvatarInfo(activeAvatar);
          const AvIcon = av.icon;
          return (
            <div className="relative group">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold transition-all duration-300 group-hover:scale-110"
                style={{
                  background: `linear-gradient(135deg, ${av.color}44, ${av.color}88)`,
                  border: `2px solid ${av.color}`,
                  boxShadow: `0 0 24px ${av.color}44`,
                }}
              >
                <AvIcon size={32} style={{ color: av.color }} />
              </div>
              {/* Rarity indicator ring */}
              <div
                className="absolute inset-0 rounded-full animate-ping opacity-20"
                style={{ border: `2px solid ${av.color}` }}
              />
              <div
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs animate-bounce"
                style={{ background: av.color }}
              >
                🇺🇿
              </div>
            </div>
          );
        })()}
        <div className="flex-1">
          <div className="text-xl font-bold text-white">Typist #888</div>
          <div className="text-sm mb-2 flex items-center gap-1.5" style={{ color: t.accent }}>
            <FiAward size={14} />
            Precision Pro · {xp.toLocaleString()} XP
          </div>
          <div className="flex gap-2 flex-wrap">
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: t.accent + "22", color: t.accent }}
            >
              🇺🇿 Uzbekistan
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
              Member since 2024
            </span>
            {stats.tests > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                {stats.tests} tests
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Best WPM", value: stats.best || "—", color: t.accent },
          { label: "Avg WPM", value: stats.avgWpm || "—", color: "#e5e7eb" },
          { label: "Accuracy", value: stats.avgAcc + "%", color: "#22c55e" },
          { label: "Tests", value: stats.tests, color: "#38bdf8" },
          { label: "XP", value: xp.toLocaleString(), color: "#f59e0b" },
          { label: "Rank", value: "#5", color: "#ec4899" },
        ].map((s) => (
          <div
            key={s.label}
            className="p-4 rounded-xl text-center"
            style={{ background: t.surface }}
          >
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">
              {s.label}
            </div>
            <div className="text-2xl font-bold" style={{ color: s.color }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="mb-2 text-xs text-gray-500 uppercase tracking-widest">Badges</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {badges.map((b) => (
          <div
            key={b.name}
            className="p-3 rounded-xl flex items-center gap-3 transition-all hover:scale-105"
            style={{
              background: b.earned ? t.surface : "#ffffff05",
              border: `1px solid ${b.earned ? t.accent + "33" : "#ffffff0a"}`,
              opacity: b.earned ? 1 : 0.4,
            }}
          >
            <b.icon size={24} className="flex-shrink-0" />
            <div>
              <div className="text-xs font-medium text-white">{b.name}</div>
              <div className="text-xs text-gray-500">{b.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
