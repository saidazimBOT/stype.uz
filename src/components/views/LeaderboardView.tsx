"use client";

import { useState, useEffect } from "react";
import { FaMedal, FaTrophy, FaCrown, FaShield } from "react-icons/fa6";
import { fetchLeaderboard, fetchLeaderboardLangs } from "../../data/leaderboard";
import { LANG_FLAGS } from "../../data/texts";
import { DEFAULT_HERO_EQUIP, getAvatarInfo, type HeroEquip } from "../../data/shop";
import HeroAvatar from "../features/HeroAvatar";
import type { ThemeColors, LeaderboardEntry } from "../../types";

interface LeaderboardViewProps {
  t: ThemeColors;
  onClose: () => void;
  activeAvatar?: string;
  heroEquip?: HeroEquip;
}

export default function LeaderboardView({ t, onClose, activeAvatar = "avatar_default", heroEquip }: LeaderboardViewProps) {
  const [filter, setFilter] = useState("all");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [langs, setLangs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const medalColors = ["#fbbf24", "#cbd5e1", "#d97706"];

  useEffect(() => {
    setLoading(true);
    fetchLeaderboard(filter === "all" ? undefined : filter)
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [filter]);

  // Til chip'lari filtrdan mustaqil yuklanadi — bir marta, ochilishda
  useEffect(() => {
    fetchLeaderboardLangs()
      .then(setLangs)
      .catch(() => setLangs([]));
  }, []);

  // Tanlangan til ro'yxatda bo'lmasa ham chip'i yo'qolib qolmasin
  const langFilters = ["all", ...new Set(filter === "all" ? langs : [...langs, filter])];

  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto w-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FaTrophy />
            Global Leaderboard
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Top typists worldwide</p>
        </div>
        <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400">
          ← Back
        </button>
      </div>

      <div className="flex gap-2 mb-5">
        {langFilters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-lg text-sm transition-all"
            style={{
              background: filter === f ? t.accent + "22" : "transparent",
              color: filter === f ? t.accent : "#6b7280",
              border: `1px solid ${filter === f ? t.accent + "44" : "transparent"}`,
            }}
          >
            {f === "all" ? "All" : `${LANG_FLAGS[f] || "🏳️"} ${f.toUpperCase()}`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[28px_1fr_48px_48px_40px] sm:grid-cols-[36px_1fr_70px_70px_60px] gap-1.5 sm:gap-2 px-3 pb-2 text-[10px] sm:text-[11px] text-gray-600 uppercase tracking-widest">
        <span />
        <span />
        <span className="text-right">WPM</span>
        <span className="text-right">Acc</span>
        <span className="text-right">Lang</span>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading leaderboard...</div>
      ) : entries.length === 0 ? (
        <div className="text-center text-gray-500 py-12">No results yet. Be the first!</div>
      ) : (
        <div className="flex flex-col gap-1">
          {entries.map((p, i) => (
            <div
              key={`${p.rank}-${p.id || i}`}
              className="grid grid-cols-[28px_1fr_48px_48px_40px] sm:grid-cols-[36px_1fr_70px_70px_60px] gap-1.5 sm:gap-2 items-center px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all"
              style={{
                background: i < 3 ? t.surface : "transparent",
                border: i < 3 ? `1px solid ${t.accent}22` : "1px solid transparent",
              }}
            >
              <div className="text-center">
                {i < 3 ? (
                  <FaMedal size={20} style={{ color: medalColors[i] }} className="mx-auto" />
                ) : (
                  <span className="text-gray-600 text-sm">{p.rank}</span>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                {p.isMe ? (() => {
                  const av = getAvatarInfo(activeAvatar);
                  return (
                    <div className="w-8 h-8 flex-shrink-0">
                      <HeroAvatar equip={{ ...DEFAULT_HERO_EQUIP, ...heroEquip }} color={av.color} size={32} />
                    </div>
                  );
                })() : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: p.color + "22", color: p.color }}
                  >
                    {p.avatar}
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium text-white flex items-center gap-1.5">
                    {p.name}
                    {p.role === 'owner' && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full flex items-center gap-0.5" style={{ background: '#f59e0b22', color: '#fbbf24' }}>
                        <FaCrown size={9} /> Owner
                      </span>
                    )}
                    {p.role === 'admin' && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full flex items-center gap-0.5" style={{ background: '#38bdf822', color: '#38bdf8' }}>
                        <FaShield size={9} /> Admin
                      </span>
                    )}
                    {p.isMe && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{ background: t.accent + "22", color: t.accent }}
                      >
                        you
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {p.country} {p.countryName}
                  </div>
                </div>
              </div>
              <div className="text-right text-base font-bold" style={{ color: p.color }}>
                {p.wpm}
              </div>
              <div className="text-right text-sm text-gray-400">
                {p.hasResult ? `${p.acc}%` : "—"}
              </div>
              <div className="text-right">
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "#ffffff0d", color: "#9ca3af" }}
                >
                  {/* Hali test topshirmagan foydalanuvchida til ham yo'q */}
                  {p.lang ? `${LANG_FLAGS[p.lang] || "🏳️"} ${p.lang.toUpperCase()}` : "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
