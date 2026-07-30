"use client";

import { useState, useMemo } from "react";
import { SEASONS } from "../../data/missions";
import type { ThemeColors, ActiveMission } from "../../types";

interface SeasonalEventProps {
  t: ThemeColors;
  onClose: () => void;
  missions: ActiveMission[];
  updateProgress: (type: string, value: number) => void;
}

export default function SeasonalEvent({ t, onClose, missions, updateProgress }: SeasonalEventProps) {
  const [activeSeason, setActiveSeason] = useState<string | null>(null);

  const activeSeasons = useMemo(() => {
    const now = new Date();
    return SEASONS.filter((s) => {
      try {
        return now >= new Date(s.start) && now <= new Date(s.end);
      } catch {
        return false;
      }
    });
  }, []);

  const currentSeason = activeSeason ? SEASONS.find((s) => s.id === activeSeason) : activeSeasons[0] || null;

  if (activeSeasons.length === 0 && !currentSeason) {
    // Show upcoming seasons
    const upcoming = SEASONS.filter((s) => {
      try {
        return new Date(s.start) > new Date();
      } catch {
        return false;
      }
    });

    return (
      <div className="flex-1 px-8 py-8 max-w-2xl mx-auto w-full overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">🎖️ Seasonal Events</h2>
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400">
            ← Back
          </button>
        </div>

        <div className="text-center py-12">
          <div className="text-6xl mb-4">📅</div>
          <div className="text-lg text-gray-400 mb-2">No active events right now</div>
          <div className="text-sm text-gray-600">Check back soon for new events!</div>
        </div>

        {upcoming.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">Upcoming Events</div>
            {upcoming.map((s) => {
              const startDate = new Date(s.start);
              const daysUntil = Math.ceil((startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div
                  key={s.id}
                  className="p-4 rounded-xl flex items-center gap-4"
                  style={{ background: t.surface, border: `1px solid ${t.accent}22` }}
                >
                  <div className="text-3xl">📅</div>
                  <div>
                    <div className="text-sm font-medium text-white">{s.name}</div>
                    <div className="text-xs text-gray-500">
                      Starts in {daysUntil} days · {s.desc}
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

  const eventMissions = currentSeason?.missions || [];
  const completed = eventMissions.filter((m) => {
    const missionProgress = missions.find((ms) => ms.id === m.id);
    return missionProgress?.completed;
  }).length;

  return (
    <div className="flex-1 px-8 py-8 max-w-2xl mx-auto w-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">🎖️ Seasonal Events</h2>
        <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400">
          ← Back
        </button>
      </div>

      {/* Active season banner */}
      {currentSeason && (
        <div
          className="p-6 rounded-2xl mb-6 text-center"
          style={{
            background: `linear-gradient(135deg, ${t.accent}22, ${t.accent}44)`,
            border: `2px solid ${t.accent}`,
          }}
        >
          <div className="text-5xl mb-3">
            {currentSeason.name.split(" ").pop()}
          </div>
          <div className="text-xl font-bold text-white mb-1">{currentSeason.name}</div>
          <div className="text-sm text-gray-400 mb-3">{currentSeason.desc}</div>
          <div className="flex justify-center gap-4 text-sm">
            <div>
              <div className="text-xs text-gray-500">Missions</div>
              <div className="font-bold" style={{ color: t.accent }}>
                {completed}/{eventMissions.length}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Time Left</div>
              <div className="font-bold text-white">
                {Math.max(0, Math.ceil((new Date(currentSeason.end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}{" "}
                days
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seasonal missions */}
      <div className="flex flex-col gap-2">
        {eventMissions.map((m) => {
          const missionProgress = missions.find((ms) => ms.id === m.id);
          const progress = missionProgress?.progress || 0;
          const isCompleted = missionProgress?.completed || false;

          return (
            <div
              key={m.id}
              className="p-4 rounded-xl flex items-center gap-4"
              style={{
                background: isCompleted ? t.surface : "#ffffff05",
                border: `1px solid ${isCompleted ? t.accent + "44" : "#ffffff0a"}`,
              }}
            >
              <div className="text-2xl w-10 text-center">{m.icon}</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{m.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{m.desc}</div>
                <div className="mt-2 h-1.5 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (progress / m.goal) * 100)}%`,
                      background: isCompleted ? t.accent : "#6b7280",
                    }}
                  />
                </div>
                <div className="text-[10px] text-gray-600 mt-0.5">
                  {progress}/{m.goal} · +{m.reward.xp} XP
                </div>
              </div>
              {isCompleted && (
                <div className="text-xl" style={{ color: t.accent }}>
                  ✅
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
