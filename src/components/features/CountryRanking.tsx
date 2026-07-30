"use client";

import { useState, useMemo } from "react";
import { LEADERBOARD } from "../../data/leaderboard";
import type { ThemeColors, CountryStats } from "../../types";

interface CountryRankingProps {
  t: ThemeColors;
  onClose: () => void;
}

export default function CountryRanking({ t, onClose }: CountryRankingProps) {
  const [sortBy, setSortBy] = useState<"wpm" | "count">("wpm");

  const countryStats: CountryStats[] = useMemo(() => {
    const stats: Record<string, CountryStats> = {};
    LEADERBOARD.forEach((p) => {
      if (!stats[p.countryName]) {
        stats[p.countryName] = {
          flag: p.country,
          name: p.countryName,
          totalWpm: 0,
          count: 0,
          bestWpm: 0,
          players: [],
          avgWpm: 0,
        };
      }
      stats[p.countryName].totalWpm += p.wpm;
      stats[p.countryName].count++;
      stats[p.countryName].bestWpm = Math.max(stats[p.countryName].bestWpm, p.wpm);
      stats[p.countryName].players.push(p);
    });

    return Object.values(stats)
      .map((s) => ({
        ...s,
        avgWpm: Math.round(s.totalWpm / s.count),
      }))
      .sort((a, b) =>
        sortBy === "wpm" ? b.avgWpm - a.avgWpm : b.count - a.count
      );
  }, [sortBy]);

  return (
    <div className="flex-1 px-8 py-8 max-w-2xl mx-auto w-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">🏅 Country Rankings</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {countryStats.length} countries represented
          </p>
        </div>
        <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400">
          ← Back
        </button>
      </div>

      {/* Sort options */}
      <div className="flex gap-2 mb-5">
        {[
          { id: "wpm" as const, label: "By WPM" },
          { id: "count" as const, label: "By Players" },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setSortBy(s.id)}
            className="px-4 py-1.5 rounded-lg text-sm transition-all"
            style={{
              background: sortBy === s.id ? t.accent + "22" : "transparent",
              color: sortBy === s.id ? t.accent : "#6b7280",
              border: `1px solid ${sortBy === s.id ? t.accent + "44" : "transparent"}`,
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Country list */}
      <div className="flex flex-col gap-2">
        {countryStats.map((country, i) => {
          const medals = ["🥇", "🥈", "🥉"];
          return (
            <div
              key={country.name}
              className="p-4 rounded-xl transition-all hover:scale-[1.01]"
              style={{
                background: i < 3 ? t.surface : "transparent",
                border: `1px solid ${i < 3 ? t.accent + "33" : "#ffffff0a"}`,
              }}
            >
              <div className="flex items-center gap-4">
                <div className="text-center w-8">
                  <div className="text-lg">{i < 3 ? medals[i] : `${i + 1}`}</div>
                </div>
                <div className="text-3xl">{country.flag}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{country.name}</span>
                    <div className="flex gap-3 text-sm">
                      <span style={{ color: t.accent }} className="font-bold">
                        {country.avgWpm} <span className="text-gray-500 font-normal">avg</span>
                      </span>
                      <span className="text-gray-400">
                        {country.bestWpm} <span className="text-gray-600">best</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-gray-500">
                      {country.count} player{country.count > 1 ? "s" : ""}
                    </span>
                    <div className="flex gap-1">
                      {country.players.map((p) => (
                        <div
                          key={p.name}
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold"
                          style={{ background: p.color + "33", color: p.color }}
                          title={`${p.name}: ${p.wpm} WPM`}
                        >
                          {p.avatar}
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Bar chart */}
                  <div className="mt-2 h-1.5 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(country.avgWpm / 250) * 100}%`,
                        background: `linear-gradient(90deg, ${t.accent}, ${t.accent}88)`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
