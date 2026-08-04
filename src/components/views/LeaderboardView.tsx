"use client";

import { useState } from "react";
import { FaMedal, FaTrophy } from "react-icons/fa6";
import { LEADERBOARD } from "../../data/leaderboard";
import type { ThemeColors } from "../../types";

interface LeaderboardViewProps {
  t: ThemeColors;
  onClose: () => void;
}

export default function LeaderboardView({ t, onClose }: LeaderboardViewProps) {
  const [filter, setFilter] = useState("all");
  const medalColors = ["#fbbf24", "#cbd5e1", "#d97706"];
  const filtered = filter === "all" ? LEADERBOARD : LEADERBOARD.filter((p) => p.lang === filter);

  const langFilters = ["all", ...new Set(LEADERBOARD.map((p) => p.lang))];

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
            {f === "all" ? "All" : f.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[28px_1fr_48px_48px_40px] sm:grid-cols-[36px_1fr_70px_70px_60px] gap-1.5 sm:gap-2 px-3 pb-2 text-[10px] sm:text-xs text-gray-600 uppercase tracking-widest">
        <span />
        <span />
        <span className="text-right">WPM</span>
        <span className="text-right">Acc</span>
        <span className="text-right">Lang</span>
      </div>

      <div className="flex flex-col gap-1">
        {filtered.map((p, i) => (
          <div
            key={p.rank}
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
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: p.color + "22", color: p.color }}
              >
                {p.avatar}
              </div>
              <div>
                <div className="text-sm font-medium text-white flex items-center gap-1.5">
                  {p.name}
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
            <div className="text-right text-sm text-gray-400">{p.acc}%</div>
            <div className="text-right">
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "#ffffff0d", color: "#9ca3af" }}
              >
                {p.lang.toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
