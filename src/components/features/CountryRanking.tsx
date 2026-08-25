"use client";

import { useState, useEffect } from "react";
import { FiAward } from "react-icons/fi";
import { FaMedal } from "react-icons/fa6";
import { supabase } from "../../lib/supabase";
import type { ThemeColors, CountryStats } from "../../types";

interface CountryRankingProps {
  t: ThemeColors;
  onClose: () => void;
}

export default function CountryRanking({ t, onClose }: CountryRankingProps) {
  const [sortBy, setSortBy] = useState<"wpm" | "count">("wpm");
  const [countryStats, setCountryStats] = useState<CountryStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase
      ?.from("profiles")
      .select("username, best_wpm, role")
      .eq("status", "active")
      .eq("banned", false)
      .not("best_wpm", "is", null)
      .then(({ data }) => {
        if (!data) return setCountryStats([]);
        const avgWpm = data.reduce((s, r) => s + (r.best_wpm || 0), 0) / (data.length || 1);
        setCountryStats([{
          flag: "🌍",
          name: "Global",
          totalWpm: data.reduce((s, r) => s + (r.best_wpm || 0), 0),
          count: data.length,
          bestWpm: Math.max(...data.map(r => r.best_wpm || 0)),
          players: data.slice(0, 10).map((p, i) => ({
            rank: i + 1,
            name: p.username || "A",
            country: "🌍",
            countryName: "Global",
            wpm: p.best_wpm || 0,
            acc: 95,
            lang: "en",
            avatar: (p.username || "A").slice(0, 2).toUpperCase(),
            color: ["#a78bfa", "#22c55e", "#f59e0b", "#38bdf8", "#ec4899"][i % 5],
          })),
          avgWpm: Math.round(avgWpm),
        }]);
      })
      .then(
        () => setLoading(false),
        () => setLoading(false)
      );
  }, []);

  const sorted = [...countryStats].sort((a, b) =>
    sortBy === "wpm" ? b.avgWpm - a.avgWpm : b.count - a.count
  );

  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto w-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FiAward />
            Country Rankings
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {countryStats.length} countries represented
          </p>
        </div>
        <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400">
          ← Back
        </button>
      </div>

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

      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading rankings...</div>
      ) : sorted.length === 0 ? (
        <div className="text-center text-gray-500 py-12">No rankings yet.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((country, i) => {
            const medalColors = ["#fbbf24", "#cbd5e1", "#d97706"];
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
                    {i < 3 ? (
                      <FaMedal size={20} style={{ color: medalColors[i] }} className="mx-auto" />
                    ) : (
                      <div className="text-lg">{i + 1}</div>
                    )}
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
      )}
    </div>
  );
}
