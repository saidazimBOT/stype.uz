"use client";

import { useState } from "react";
import SnakeGame from "../games/SnakeGame";
import TetrisGame from "../games/TetrisGame";
import FlappyBird from "../games/FlappyBird";
import type { ThemeColors } from "../../types";

interface GamesViewProps {
  t: ThemeColors;
  onClose: () => void;
}

const GAMES = [
  { id: "snake", icon: "🐍", name: "Snake", desc: "Eat apples, grow longer, don't crash!" },
  { id: "tetris", icon: "🧩", name: "Tetris", desc: "Clear lines before they reach the top!" },
  { id: "flappy", icon: "🐦", name: "Flappy Bird", desc: "Tap to fly through the pipes!" },
];

export default function GamesView({ t, onClose }: GamesViewProps) {
  const [game, setGame] = useState<string | null>(null);

  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto w-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">
          {game ? GAMES.find((g) => g.id === game)?.name : "🎮 Mini Games"}
        </h2>
        <button
          onClick={game ? () => setGame(null) : onClose}
          className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400"
        >
          {game ? "← Games" : "← Back"}
        </button>
      </div>

      {!game ? (
        <div className="flex flex-col gap-3">
          {GAMES.map((g) => (
            <button
              key={g.id}
              onClick={() => setGame(g.id)}
              className="flex items-center gap-4 p-5 rounded-2xl text-left transition-all hover:scale-[1.01]"
              style={{ background: t.surface, border: `1px solid ${t.accent}22` }}
            >
              <span className="text-4xl">{g.icon}</span>
              <div className="flex-1">
                <div className="font-bold text-white text-lg">{g.name}</div>
                <div className="text-sm text-gray-400">{g.desc}</div>
              </div>
              <span style={{ color: t.accent }} className="text-xl">
                ▶
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex justify-center pt-2">
          {game === "snake" && <SnakeGame t={t} />}
          {game === "tetris" && <TetrisGame t={t} />}
          {game === "flappy" && <FlappyBird t={t} />}
        </div>
      )}
    </div>
  );
}
