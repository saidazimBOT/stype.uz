"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { FiActivity, FiFlag, FiRefreshCw, FiSend } from "react-icons/fi";
import { FaMedal, FaTrophy } from "react-icons/fa6";
import type { ThemeColors, BotRacer, RaceState } from "../../types";

const BOT_NAMES = [
  "SpeedBot", "TypeMaster", "QuickFox", "KeyNinja", "TurboTyper",
  "AlphaFingers", "RapidFire", "ByteRacer", "FlashKeys", "NitroType",
];

const BOT_COLORS = ["#a78bfa", "#22c55e", "#f59e0b", "#38bdf8", "#ec4899", "#f97316", "#10b981", "#6366f1"];

function getRandomText(): string {
  const texts = [
    "The quick brown fox jumps over the lazy dog near the river bank",
    "Practice makes perfect when you type with precision and grace",
    "Speed without accuracy is just noise in the digital world",
    "Every master typist was once a beginner who never gave up",
    "The keyboard is your instrument play it with skill and passion",
    "In the world of typing consistency beats raw speed every time",
    "Focus on accuracy first and speed will follow naturally",
    "Your fingers have memory trust them to find the right keys",
  ];
  return texts[Math.floor(Math.random() * texts.length)];
}

function BotProgress({ name, color, progress, wpm }: { name: string; color: string; progress: number; wpm: number }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
        style={{ background: color + "33", color }}
      >
        {name.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">{name}</span>
          <span style={{ color }} className="font-bold">
            {wpm} wpm
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, background: color }}
          />
        </div>
      </div>
    </div>
  );
}

interface MultiplayerRaceProps {
  t: ThemeColors;
  onClose: () => void;
  currentWpm: number;
  isPlaying: boolean;
}

export default function MultiplayerRace({ t, onClose, currentWpm, isPlaying }: MultiplayerRaceProps) {
  const [raceState, setRaceState] = useState<RaceState>("idle");
  const [bots, setBots] = useState<BotRacer[]>([]);
  const [playerProgress, setPlayerProgress] = useState(0);
  const [raceText, setRaceText] = useState("");
  const [countdown, setCountdown] = useState(3);
  const [position, setPosition] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRace = useCallback(() => {
    setRaceState("waiting");
    setCountdown(3);
    setPlayerProgress(0);

    // Generate bots
    const newBots: BotRacer[] = Array.from({ length: 4 }, (_, i) => ({
      id: i,
      name: BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)],
      color: BOT_COLORS[i % BOT_COLORS.length],
      progress: 0,
      wpm: 80 + Math.floor(Math.random() * 100),
      speed: 0.5 + Math.random() * 1.5,
      finished: false,
      finishTime: 0,
    }));
    setBots(newBots);

    const text = getRandomText();
    setRaceText(text);

    // Countdown
    let count = 3;
    setCountdown(count);
    const countInterval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(countInterval);
        setCountdown(0);
        setRaceState("racing");
        startBotRacing(newBots, text);
      } else {
        setCountdown(count);
      }
    }, 1000);
  }, []);

  const startBotRacing = (botList: BotRacer[], text: string) => {
    const startTime = Date.now();
    const textLen = text.length;

    intervalRef.current = setInterval(() => {
      setBots((prev) => {
        const updated = prev.map((bot) => {
          if (bot.finished) return bot;
          const elapsed = (Date.now() - startTime) / 1000;
          const progress = Math.min(100, (elapsed * bot.speed * (bot.wpm / 100) * 2));
          const charsTyped = Math.floor((progress / 100) * textLen);
          const wpm = Math.round((charsTyped / 5) / (elapsed / 60));

          if (progress >= 100) {
            return { ...bot, progress: 100, finished: true, finishTime: elapsed, wpm };
          }
          return { ...bot, progress, wpm };
        });

        // Check if all bots finished
        if (updated.every((b) => b.finished)) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setRaceState("finished");
        }

        return updated;
      });
    }, 200);
  };

  // Player progress update
  useEffect(() => {
    if (raceState === "racing" && isPlaying) {
      setPlayerProgress(Math.min(100, (currentWpm / 250) * 100));
    }
  }, [currentWpm, raceState, isPlaying]);

  // Calculate position
  useEffect(() => {
    if (raceState === "racing") {
      const allProgress = [
        ...bots.map((b) => ({ name: b.name, progress: b.progress, isBot: true })),
        { name: "You", progress: playerProgress, isBot: false },
      ].sort((a, b) => b.progress - a.progress);

      const myPos = allProgress.findIndex((p) => !p.isBot) + 1;
      setPosition(myPos);
    }
  }, [bots, playerProgress, raceState]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto w-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FiSend />
          Multiplayer Race
        </h2>
        <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400">
          ← Back
        </button>
      </div>

      {raceState === "idle" && (
        <div className="text-center py-12">
          <FiFlag size={52} className="mx-auto mb-6" style={{ color: t.accent }} />
          <p className="text-gray-400 mb-6">
            Race against AI opponents! Type faster than them to win!
          </p>
          <button
            onClick={startRace}
            className="px-8 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 flex items-center gap-2 mx-auto"
            style={{ background: t.accent, color: "#000" }}
          >
            <FiSend size={16} />
            Start Race!
          </button>
        </div>
      )}

      {raceState === "waiting" && (
        <div className="text-center py-16">
          <div className="text-7xl font-bold mb-4 animate-bounce" style={{ color: t.accent }}>
            {countdown}
          </div>
          <div className="text-gray-400">Get ready to type!</div>
        </div>
      )}

      {(raceState === "racing" || raceState === "finished") && (
        <>
          {/* Position indicator */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="text-center">
              <div className="text-xs text-gray-500 uppercase">Position</div>
              <div className="text-3xl font-bold" style={{ color: t.accent }}>
                #{position}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 uppercase">Racers</div>
              <div className="text-3xl font-bold text-white">{bots.length + 1}</div>
            </div>
          </div>

          {/* Race text preview */}
          <div
            className="p-4 rounded-xl mb-4 text-sm text-gray-500 text-center"
            style={{ background: t.surface, border: `1px solid ${t.accent}22` }}
          >
            {raceText}
          </div>

          {/* Progress bars */}
          <div className="mb-6">
            {/* Player */}
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={{ background: t.accent + "33", color: t.accent }}
              >
                YOU
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white font-medium">You</span>
                  <span style={{ color: t.accent }} className="font-bold">
                    {currentWpm} wpm
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-white/10 relative overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${playerProgress}%`,
                      background: `linear-gradient(90deg, ${t.accent}, ${t.accent}88)`,
                      boxShadow: `0 0 10px ${t.accent}44`,
                    }}
                  />
                  {position === 1 && playerProgress > 0 && (
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 text-xs">
                      <FaTrophy size={12} className="text-yellow-400" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bots */}
            {bots.map((bot) => (
              <BotProgress
                key={bot.id}
                name={bot.name}
                color={bot.color}
                progress={bot.progress}
                wpm={bot.wpm}
              />
            ))}
          </div>

          {/* Results */}
          {raceState === "finished" && (
            <div
              className="p-5 rounded-xl text-center"
              style={{ background: t.surface, border: `2px solid ${t.accent}` }}
            >
              <div className="flex justify-center mb-2" style={{ color: t.accent }}>
                {position === 1 ? (
                  <FaTrophy size={36} className="text-yellow-400" />
                ) : position <= 3 ? (
                  <FaMedal size={36} />
                ) : (
                  <FiActivity size={36} />
                )}
              </div>
              <div className="text-xl font-bold text-white mb-1">
                {position === 1 ? "You Win!" : position <= 3 ? "Top 3!" : "Good Effort!"}
              </div>
              <div className="text-sm" style={{ color: t.accent }}>
                You placed #{position} out of {bots.length + 1}
              </div>
              <button
                onClick={startRace}
                className="mt-4 px-6 py-2 rounded-xl text-sm transition-all hover:scale-105 flex items-center gap-2 mx-auto"
                style={{ background: t.accent, color: "#000" }}
              >
                <FiRefreshCw size={14} />
                Race Again
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
