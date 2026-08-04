"use client";

import { FiCheckCircle, FiMoon, FiStar, FiSun, FiZap } from "react-icons/fi";
import { FaCrown } from "react-icons/fa6";
import { GiSparkles } from "react-icons/gi";
import type { IconType } from "react-icons";
import type { ThemeColors, DailyState } from "../../types";

interface DailyLoginViewProps {
  t: ThemeColors;
  onClose: () => void;
  daily: DailyState & {
    checkDaily: () => DailyState;
    claimReward: () => void;
  };
}

const DAYS = [1, 2, 3, 4, 5, 6, 7];
const REWARDS: { day: number; xp: number; coins: number; icon: IconType; bonus?: IconType }[] = [
  { day: 1, xp: 50, coins: 10, icon: FiSun },
  { day: 2, xp: 75, coins: 15, icon: FiStar },
  { day: 3, xp: 100, coins: 25, icon: FiZap, bonus: FiSun },
  { day: 4, xp: 125, coins: 30, icon: GiSparkles },
  { day: 5, xp: 150, coins: 40, icon: FiZap, bonus: FiZap },
  { day: 6, xp: 175, coins: 45, icon: FiMoon },
  { day: 7, xp: 500, coins: 100, icon: FaCrown, bonus: FiStar },
];

export default function DailyLoginView({ t, onClose, daily }: DailyLoginViewProps) {
  const { streak, claimedToday, totalLogins, checkDaily, claimReward } = daily;
  const progress = Math.min((streak / 7) * 100, 100);

  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto w-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FiZap />
            Daily Login
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalLogins} total logins · {streak} day streak
          </p>
        </div>
        <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400">
          ← Back
        </button>
      </div>

      {/* Streak banner */}
      <div
        className="p-6 rounded-2xl mb-6 text-center relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${t.accent}33, ${t.accent}66)`,
          border: `1px solid ${t.accent}`,
        }}
      >
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-32 h-32 rounded-full bg-white blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-24 h-24 rounded-full bg-white blur-2xl animate-pulse" />
        </div>
        <div className="relative">
          <FiZap size={44} className="mx-auto mb-2" style={{ color: t.accent }} />
          <div className="text-3xl font-bold text-white mb-1">{streak}-Day Streak!</div>
          <p className="text-sm text-gray-300">
            {claimedToday ? "Come back tomorrow for more rewards!" : "Login today to claim your reward!"}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Day 1</span>
          <span>Day 7</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 relative">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: t.accent }}
          />
        </div>
      </div>

      {/* Rewards grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-6">
        {REWARDS.map((reward) => {
          const isUnlocked = streak >= reward.day;
          const isCurrent = streak === reward.day;
          const isClaimed = claimedToday && isCurrent;

          return (
            <div
              key={reward.day}
              className={`p-1.5 sm:p-2 rounded-xl text-center transition-all ${
                isCurrent ? "scale-110" : ""
              }`}
              style={{
                background: isClaimed ? t.accent + "33" : isUnlocked ? t.surface : "#ffffff05",
                border: `2px solid ${
                  isCurrent
                    ? t.accent
                    : isClaimed
                    ? t.accent + "66"
                    : isUnlocked
                    ? t.accent + "22"
                    : "transparent"
                }`,
                opacity: isUnlocked ? 1 : 0.4,
              }}
            >
              <div className="flex justify-center mb-0.5">
                <reward.icon size={18} />
              </div>
              <div className="text-[10px] font-bold" style={{ color: t.accent }}>
                +{reward.xp}
              </div>
              <div className="text-[8px] text-gray-500">XP</div>
              {reward.bonus && (
                <div className="flex justify-center mt-0.5">
                  <reward.bonus size={12} />
                </div>
              )}
              <div className="text-[8px] text-gray-600 mt-0.5">Day {reward.day}</div>
            </div>
          );
        })}
      </div>

      {/* Claim button */}
      <button
        onClick={claimReward}
        disabled={claimedToday}
        className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ background: t.accent, color: "#000" }}
      >
        {claimedToday ? (
          <><FiCheckCircle size={16} /> Claimed Today</>
        ) : (
          <><FiZap size={16} /> Claim Day {streak} Reward</>
        )}
      </button>

      {/* Info */}
      <div className="mt-4 text-xs text-gray-600 text-center">
        Your streak resets if you miss a day. Maximum streak: 7 days.
      </div>
    </div>
  );
}
