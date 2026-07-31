"use client";

import type { ThemeColors, TestResult } from "../../types";

interface HistoryViewProps {
  t: ThemeColors;
  onClose: () => void;
  history: TestResult[];
  onFavorite: (txt: string) => void;
  favorites: string[];
  showReplay?: (id: number) => void;
}

export default function HistoryView({ t, onClose, history, favorites, onFavorite, showReplay }: HistoryViewProps) {
  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto w-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">📋 History</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {history.length} test{history.length !== 1 ? "s" : ""} completed
          </p>
        </div>
        <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400">
          ← Back
        </button>
      </div>

      {favorites.length > 0 && (
        <div className="mb-6">
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">
            Saved Texts ❤️
          </div>
          <div className="flex flex-col gap-2">
            {favorites.map((txt, i) => (
              <div
                key={i}
                className="p-3 rounded-xl text-sm text-gray-300 flex justify-between items-start gap-3"
                style={{
                  background: t.surface,
                  border: `1px solid ${t.accent}22`,
                }}
              >
                <span
                  className="flex-1"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {txt}
                </span>
                <button
                  onClick={() => onFavorite(txt)}
                  className="text-red-400 hover:text-red-300 text-lg flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {history.length === 0 ? (
        <div className="text-center text-gray-600 py-16">
          <div className="text-5xl mb-3">📋</div>
          <div>No tests yet. Start typing!</div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {history.map((h, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_48px_48px_44px_40px_32px] sm:grid-cols-[1fr_70px_70px_60px_50px_40px] items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-xl hover:bg-white/5 transition-all"
              style={{
                background: t.surface,
                border: `1px solid ${t.accent}11`,
              }}
            >
              <div>
                <div className="text-xs text-gray-500">{h.date}</div>
                <div className="text-xs text-gray-600 mt-0.5">
                  {h.lang?.toUpperCase()} · {h.duration === "∞" ? "Free" : `${h.duration}s`}
                </div>
              </div>
              <div className="text-right font-bold" style={{ color: t.accent }}>
                {h.wpm}{" "}
                <span className="text-xs text-gray-500">wpm</span>
              </div>
              <div className="text-right text-sm text-gray-400">{h.accuracy}%</div>
              <div className="text-right">
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "#ffffff0d", color: "#9ca3af" }}
                >
                  {h.lang?.toUpperCase()}
                </span>
              </div>
              <div
                className="text-right text-xs"
                style={{ color: h.errors > 5 ? "#ef4444" : "#22c55e" }}
              >
                {h.errors} err
              </div>
              {showReplay && h.recordingId != null && (
                <button
                  onClick={() => showReplay(h.recordingId!)}
                  className="text-xs px-2 py-1 rounded hover:bg-white/5"
                  style={{ color: t.accent }}
                >
                  ▶
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
