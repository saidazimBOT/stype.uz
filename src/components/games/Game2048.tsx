"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { FaHashtag } from "react-icons/fa6";
import type { ThemeColors } from "../../types";

interface Game2048Props {
  t: ThemeColors;
  onCoinEarned?: (amount: number) => void;
}

const GRID = 4;
const CELL = 72;
const GAP = 8;
const PAD = 14;
const W = GRID * CELL + (GRID - 1) * GAP + PAD * 2;
const H = W;

const TILE_COLORS: Record<number, { bg: string; fg: string }> = {
  0: { bg: "#1e293b", fg: "transparent" },
  2: { bg: "#334155", fg: "#e2e8f0" },
  4: { bg: "#475569", fg: "#f1f5f9" },
  8: { bg: "#f97316", fg: "#fff" },
  16: { bg: "#ea580c", fg: "#fff" },
  32: { bg: "#ef4444", fg: "#fff" },
  64: { bg: "#dc2626", fg: "#fff" },
  128: { bg: "#eab308", fg: "#fff" },
  256: { bg: "#ca8a04", fg: "#fff" },
  512: { bg: "#f59e0b", fg: "#fff" },
  1024: { bg: "#a855f7", fg: "#fff" },
  2048: { bg: "#facc15", fg: "#1e1b4b" },
};

function emptyGrid(): number[][] {
  return Array.from({ length: GRID }, () => Array(GRID).fill(0));
}

function addRandom(grid: number[][]): boolean {
  const empty: [number, number][] = [];
  for (let r = 0; r < GRID; r++)
    for (let c = 0; c < GRID; c++)
      if (grid[r][c] === 0) empty.push([r, c]);
  if (empty.length === 0) return false;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  return true;
}

function cloneGrid(g: number[][]): number[][] {
  return g.map((r) => [...r]);
}

function gridsEqual(a: number[][], b: number[][]): boolean {
  for (let r = 0; r < GRID; r++)
    for (let c = 0; c < GRID; c++)
      if (a[r][c] !== b[r][c]) return false;
  return true;
}

function canMove(grid: number[][]): boolean {
  for (let r = 0; r < GRID; r++)
    for (let c = 0; c < GRID; c++) {
      if (grid[r][c] === 0) return true;
      if (c < GRID - 1 && grid[r][c] === grid[r][c + 1]) return true;
      if (r < GRID - 1 && grid[r][c] === grid[r + 1][c]) return true;
    }
  return false;
}

function slide(row: number[]): { row: number[]; score: number } {
  const filtered = row.filter((v) => v !== 0);
  let score = 0;
  for (let i = 0; i < filtered.length - 1; i++) {
    if (filtered[i] === filtered[i + 1]) {
      filtered[i] *= 2;
      score += filtered[i];
      filtered.splice(i + 1, 1);
    }
  }
  while (filtered.length < GRID) filtered.push(0);
  return { row: filtered, score };
}

function moveGrid(grid: number[][], dir: "up" | "down" | "left" | "right"): { grid: number[][]; score: number; moved: boolean } {
  const prev = cloneGrid(grid);
  let totalScore = 0;
  const g = cloneGrid(grid);

  if (dir === "left") {
    for (let r = 0; r < GRID; r++) {
      const { row, score } = slide(g[r]);
      g[r] = row;
      totalScore += score;
    }
  } else if (dir === "right") {
    for (let r = 0; r < GRID; r++) {
      const { row, score } = slide([...g[r]].reverse());
      g[r] = row.reverse();
      totalScore += score;
    }
  } else if (dir === "up") {
    for (let c = 0; c < GRID; c++) {
      const col = g.map((r) => r[c]);
      const { row, score } = slide(col);
      for (let r = 0; r < GRID; r++) g[r][c] = row[r];
      totalScore += score;
    }
  } else if (dir === "down") {
    for (let c = 0; c < GRID; c++) {
      const col = g.map((r) => r[c]).reverse();
      const { row, score } = slide(col);
      const rev = row.reverse();
      for (let r = 0; r < GRID; r++) g[r][c] = rev[r];
      totalScore += score;
    }
  }

  return { grid: g, score: totalScore, moved: !gridsEqual(prev, g) };
}

export default function Game2048({ t, onCoinEarned }: Game2048Props) {
  const [grid, setGrid] = useState<number[][]>(() => {
    const g = emptyGrid();
    addRandom(g);
    addRandom(g);
    return g;
  });
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => {
    try { return parseInt(localStorage.getItem("typeuz_2048_best") || "0"); } catch { return 0; }
  });
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const scoreRef = useRef(0);

  const draw = useCallback(() => {
    // We draw via DOM (not canvas) for simplicity
  }, []);

  const doMove = useCallback((dir: "up" | "down" | "left" | "right") => {
    if (gameOver) return;
    const result = moveGrid(grid, dir);
    if (!result.moved) return;
    const newGrid = result.grid;
    addRandom(newGrid);
    const newScore = scoreRef.current + result.score;
    scoreRef.current = newScore;
    setScore(newScore);
    setGrid(newGrid);

    // check for 2048 tile
    if (!won) {
      for (const row of newGrid)
        for (const v of row)
          if (v === 2048) { setWon(true); break; }
    }

    if (!canMove(newGrid)) {
      setGameOver(true);
      setBest((prev) => {
        const nb = Math.max(prev, newScore);
        try { localStorage.setItem("typeuz_2048_best", String(nb)); } catch {}
        return nb;
      });
      if (newScore > 0 && onCoinEarned) onCoinEarned(Math.round(newScore / 20));
    }
  }, [grid, gameOver, won, onCoinEarned]);

  const restart = useCallback(() => {
    const g = emptyGrid();
    addRandom(g);
    addRandom(g);
    setGrid(g);
    scoreRef.current = 0;
    setScore(0);
    setGameOver(false);
    setWon(false);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const map: Record<string, "up" | "down" | "left" | "right"> = {
        ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
        KeyW: "up", KeyS: "down", KeyA: "left", KeyD: "right",
      };
      if (map[e.code]) { e.preventDefault(); doMove(map[e.code]); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [doMove]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    const absDx = Math.abs(dx), absDy = Math.abs(dy);
    if (Math.max(absDx, absDy) < 20) return;
    if (absDx > absDy) doMove(dx > 0 ? "right" : "left");
    else doMove(dy > 0 ? "down" : "up");
    touchStart.current = null;
  }, [doMove]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full max-w-full" style={{ maxWidth: W }}>
        <span className="text-gray-400 text-sm flex items-center gap-1.5">
          <FaHashtag size={14} style={{ color: t.accent }} /> 2048
        </span>
        <div className="flex gap-3">
          <span className="font-bold" style={{ color: t.accent }}>Score: {score}</span>
          <span className="font-bold text-gray-500">Best: {best}</span>
        </div>
      </div>
      <div
        className="rounded-xl overflow-hidden relative select-none"
        style={{
          width: W, height: H,
          background: "#0f172a",
          border: `1px solid ${t.accent}33`,
          padding: PAD,
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* grid background cells */}
        {Array.from({ length: GRID }).map((_, r) =>
          Array.from({ length: GRID }).map((_, c) => (
            <div
              key={`${r}-${c}`}
              className="absolute rounded-lg"
              style={{
                left: PAD + c * (CELL + GAP),
                top: PAD + r * (CELL + GAP),
                width: CELL,
                height: CELL,
                background: "#1e293b",
              }}
            />
          ))
        )}
        {/* tiles */}
        {grid.map((row, r) =>
          row.map((val, c) => {
            if (val === 0) return null;
            const tc = TILE_COLORS[val] || TILE_COLORS[2048];
            const fontSize = val >= 1024 ? 20 : val >= 128 ? 26 : 30;
            return (
              <div
                key={`t-${r}-${c}`}
                className="absolute rounded-lg flex items-center justify-center font-bold transition-all duration-100"
                style={{
                  left: PAD + c * (CELL + GAP),
                  top: PAD + r * (CELL + GAP),
                  width: CELL,
                  height: CELL,
                  background: tc.bg,
                  color: tc.fg,
                  fontSize,
                  boxShadow: val >= 8 ? `0 0 12px ${tc.bg}66` : undefined,
                }}
              >
                {val}
              </div>
            );
          })
        )}
        {/* overlay */}
        {(gameOver || won) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl z-10"
            style={{ background: "rgba(8,10,16,0.82)" }}>
            <div className="text-3xl font-bold mb-2" style={{ color: won ? "#facc15" : t.accent }}>
              {won ? "🎉 You Win!" : "Game Over"}
            </div>
            <div className="text-white font-bold mb-4">Score: {score}</div>
            <button
              onClick={restart}
              className="px-6 py-2 rounded-lg font-bold text-sm transition-all hover:scale-105"
              style={{ background: t.accent, color: "#fff" }}
            >
              Play Again
            </button>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-600">Arrow keys / WASD / swipe to move tiles</p>
    </div>
  );
}
