"use client";

import { useState } from "react";
import { FiGrid, FiPlay } from "react-icons/fi";
import { FaCar, FaDove, FaPuzzlePiece } from "react-icons/fa6";
import { GiSnake } from "react-icons/gi";
import type { IconType } from "react-icons";
import SnakeGame from "../games/SnakeGame";
import TetrisGame from "../games/TetrisGame";
import FlappyBird from "../games/FlappyBird";
import CarGame from "../games/CarGame";
import type { ThemeColors } from "../../types";

interface GamesViewProps {
  t: ThemeColors;
  onClose: () => void;
  onCoinEarned?: (amount: number) => void;
}

const GAMES: { id: string; icon: IconType; name: string; desc: string }[] = [
  { id: "snake", icon: GiSnake, name: "Snake", desc: "Eat apples, grow longer, don't crash!" },
  { id: "tetris", icon: FaPuzzlePiece, name: "Tetris", desc: "Clear lines before they reach the top!" },
  { id: "flappy", icon: FaDove, name: "Flappy Bird", desc: "Tap to fly through the pipes!" },
  { id: "car", icon: FaCar, name: "Car Race", desc: "Dodge traffic and drive as far as you can!" },
];

export default function GamesView({ t, onClose, onCoinEarned }: GamesViewProps) {
  const [game, setGame] = useState<string | null>(null);

  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto w-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FiGrid />
          {game ? GAMES.find((g) => g.id === game)?.name : "Mini Games"}
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
              <g.icon size={38} className="flex-shrink-0" style={{ color: t.accent }} />
              <div className="flex-1">
                <div className="font-bold text-white text-lg">{g.name}</div>
                <div className="text-sm text-gray-400">{g.desc}</div>
              </div>
              <FiPlay size={20} style={{ color: t.accent }} />
            </button>
          ))}
        </div>
      ) : (
        <div className="flex justify-center pt-2">
          {game === "snake" && <SnakeGame t={t} onCoinEarned={onCoinEarned} />}
          {game === "tetris" && <TetrisGame t={t} onCoinEarned={onCoinEarned} />}
          {game === "flappy" && <FlappyBird t={t} onCoinEarned={onCoinEarned} />}
          {game === "car" && <CarGame t={t} onCoinEarned={onCoinEarned} />}
        </div>
      )}
    </div>
  );
}
