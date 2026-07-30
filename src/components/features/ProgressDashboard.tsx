"use client";

import { useMemo } from "react";
import type { ThemeColors, TestResult } from "../../types";

interface ProgressDashboardProps {
  t: ThemeColors;
  onClose: () => void;
  history: TestResult[];
}

export default function ProgressDashboard({ t, onClose, history }: ProgressDashboardProps) {
  const stats = useMemo(() => {
    if (!history || history.length === 0) return null;
    const sorted = [...history].reverse();
    const recent = sorted.slice(0, 10);
    const avgWpm = Math.round(sorted.reduce((a, h) => a + h.wpm, 0) / sorted.length);
    const avgAcc = Math.round(sorted.reduce((a, h) => a + h.accuracy, 0) / sorted.length);
    const bestWpm = Math.max(...sorted.map((h) => h.wpm));
    const wpmHistory = sorted.slice(-30).map((h) => h.wpm);
    const accHistory = sorted.slice(-30).map((h) => h.accuracy);
    return { avgWpm, avgAcc, bestWpm, total: sorted.length, recent, wpmHistory, accHistory };
  }, [history]);

  return (
    <div className="flex-1 px-8 py-8 max-w-2xl mx-auto w-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">📈 Progress Dashboard</h2>
          <p className="text-sm text-gray-500 mt-0.5">Track your typing improvement over time</p>
        </div>
        <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400">
          ← Back
        </button>
      </div>

      {!stats ? (
        <div className="text-center text-gray-600 py-16">
          <div className="text-5xl mb-3">📈</div>
          <div>No data yet. Complete some tests to see your progress!</div>
        </div>
      ) : (
        <>
          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: "Tests", value: stats.total, color: "#38bdf8" },
              { label: "Best WPM", value: stats.bestWpm, color: t.accent },
              { label: "Avg WPM", value: stats.avgWpm, color: "#22c55e" },
              { label: "Avg Acc", value: `${stats.avgAcc}%`, color: "#f59e0b" },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-xl text-center" style={{ background: t.surface }}>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest">{s.label}</div>
                <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* WPM Progress Chart */}
          <div className="mb-6">
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">WPM Progress (Last 30)</div>
            <div className="p-4 rounded-xl" style={{ background: t.surface }}>
              <div className="flex items-end gap-1 h-32">
                {stats.wpmHistory.map((wpm, i) => {
                  const height = Math.max(4, (wpm / Math.max(...stats.wpmHistory, 1)) * 100);
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-t transition-all hover:opacity-80 relative group"
                      style={{
                        height: `${height}%`,
                        background: `linear-gradient(to top, ${t.accent}66, ${t.accent})`,
                        minWidth: "4px",
                      }}
                      title={`${wpm} WPM`}
                    />
                  );
                })}
              </div>
              {/* Y-axis labels */}
              <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                <span>0</span>
                <span>{Math.max(...stats.wpmHistory, 0)} WPM</span>
              </div>
            </div>
          </div>

          {/* Accuracy Progress Chart */}
          <div className="mb-6">
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Accuracy Progress (Last 30)</div>
            <div className="p-4 rounded-xl" style={{ background: t.surface }}>
              <div className="flex items-end gap-1 h-24">
                {stats.accHistory.map((acc, i) => {
                  const height = Math.max(4, (acc / 100) * 100);
                  const color = acc >= 98 ? "#22c55e" : acc >= 90 ? "#f59e0b" : "#ef4444";
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-t transition-all"
                      style={{
                        height: `${height}%`,
                        background: color,
                        minWidth: "4px",
                        opacity: 0.7,
                      }}
                      title={`${acc}%`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Recent tests */}
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Recent Tests</div>
            <div className="flex flex-col gap-1.5">
              {stats.recent.slice(0, 5).map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-sm"
                  style={{ background: t.surface }}
                >
                  <span className="text-gray-400">{new Date(h.date).toLocaleDateString?.() || h.date}</span>
                  <div className="flex gap-3">
                    <span style={{ color: t.accent }} className="font-bold">{h.wpm} wpm</span>
                    <span className="text-gray-400">{h.accuracy}%</span>
                    <span className="text-xs text-gray-600">{h.errors} err</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
