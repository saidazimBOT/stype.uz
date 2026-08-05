"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { GiSnake } from "react-icons/gi";
import type { ThemeColors } from "../../types";

interface SnakeGameProps {
  t: ThemeColors;
  onCoinEarned?: (amount: number) => void;
}

const SZ = 20, SC = 20, SR = 18;

interface Point {
  x: number;
  y: number;
}

interface GameState {
  snake: Point[];
  dir: Point;
  nd: Point;
  food: Point;
  score: number;
  alive: boolean;
  started: boolean;
}

export default function SnakeGame({ t, onCoinEarned }: SnakeGameProps) {
  const cvs = useRef<HTMLCanvasElement>(null);
  const G = useRef<GameState>({ snake: [{ x: 10, y: 9 }], dir: { x: 1, y: 0 }, nd: { x: 1, y: 0 }, food: { x: 5, y: 5 }, score: 0, alive: true, started: false });
  const [score, setScore] = useState(0);
  const raf = useRef<number | null>(null);
  const last = useRef(0);

  const rndFood = (s: Point[]): Point => {
    let f: Point;
    do {
      f = { x: Math.floor(Math.random() * SC), y: Math.floor(Math.random() * SR) };
    } while (s.some((a) => a.x === f.x && a.y === f.y));
    return f;
  };

  const draw = useCallback(() => {
    const c = cvs.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const g = G.current;
    ctx.fillStyle = "#0f0f13";
    ctx.fillRect(0, 0, SC * SZ, SR * SZ);
    ctx.strokeStyle = "#ffffff06";
    for (let x = 0; x <= SC; x++) {
      ctx.beginPath();
      ctx.moveTo(x * SZ, 0);
      ctx.lineTo(x * SZ, SR * SZ);
      ctx.stroke();
    }
    for (let y = 0; y <= SR; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * SZ);
      ctx.lineTo(SC * SZ, y * SZ);
      ctx.stroke();
    }
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(g.food.x * SZ + SZ / 2, g.food.y * SZ + SZ / 2, SZ / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    g.snake.forEach((seg, i) => {
      const a = i === 0 ? 1 : Math.max(0.3, 1 - i / (g.snake.length + 5));
      const alpha = Math.floor(a * 255).toString(16).padStart(2, "0");
      ctx.fillStyle = i === 0 ? t.accent : t.accent + alpha;
      ctx.beginPath();
      ctx.roundRect(seg.x * SZ + 1, seg.y * SZ + 1, SZ - 2, SZ - 2, 4);
      ctx.fill();
    });
    if (!g.started) {
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.fillRect(0, 0, SC * SZ, SR * SZ);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 18px Inter";
      ctx.textAlign = "center";
      ctx.fillText("Press SPACE or click to start", SC * SZ / 2, SR * SZ / 2);
    }
    if (!g.alive) {
      ctx.fillStyle = "rgba(0,0,0,0.72)";
      ctx.fillRect(0, 0, SC * SZ, SR * SZ);
      ctx.fillStyle = t.accent;
      ctx.font = "bold 24px Inter";
      ctx.textAlign = "center";
      ctx.fillText("Game Over!", SC * SZ / 2, SR * SZ / 2 - 18);
      ctx.fillStyle = "#fff";
      ctx.font = "16px Inter";
      ctx.fillText("Score: " + g.score, SC * SZ / 2, SR * SZ / 2 + 8);
      ctx.fillText("SPACE / click to restart", SC * SZ / 2, SR * SZ / 2 + 32);
    }
  }, [t]);

  const tick = useCallback(
    (ts: number) => {
      const g = G.current;
      if (!g.started || !g.alive) { draw(); return; }
      if (ts - last.current < 140) { raf.current = requestAnimationFrame(tick); return; }
      last.current = ts;
      g.dir = g.nd;
      const h: Point = { x: g.snake[0].x + g.dir.x, y: g.snake[0].y + g.dir.y };
    if (h.x < 0 || h.x >= SC || h.y < 0 || h.y >= SR || g.snake.some((s) => s.x === h.x && s.y === h.y)) {
      g.alive = false;
      if (g.score > 0 && onCoinEarned) {
        onCoinEarned(g.score);
      }
      draw();
      return;
    }
      g.snake.unshift(h);
      if (h.x === g.food.x && h.y === g.food.y) {
        g.score++;
        setScore(g.score);
        g.food = rndFood(g.snake);
      } else g.snake.pop();
      draw();
      raf.current = requestAnimationFrame(tick);
    },
    [draw]
  );

  const reset = useCallback(() => {
    G.current = { snake: [{ x: 10, y: 9 }], dir: { x: 1, y: 0 }, nd: { x: 1, y: 0 }, food: { x: 5, y: 5 }, score: 0, alive: true, started: true };
    setScore(0);
    last.current = 0;
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(tick);
  }, [tick]);

  const start = useCallback(() => {
    const g = G.current;
    if (!g.alive) { reset(); return; }
    g.started = true;
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(tick);
  }, [tick, reset]);

  useEffect(() => {
    draw();
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [tick, draw]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const g = G.current;
      if (e.code === "Space") { e.preventDefault(); start(); return; }
      if (!g.started || !g.alive) return;
      const m: Record<string, Point> = { ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, KeyW: { x: 0, y: -1 }, KeyS: { x: 0, y: 1 }, KeyA: { x: -1, y: 0 }, KeyD: { x: 1, y: 0 } };
      const nd = m[e.code];
      if (nd && !(nd.x === -g.dir.x && nd.y === -g.dir.y)) { g.nd = nd; e.preventDefault(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [start]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full max-w-full" style={{ maxWidth: SC * SZ }}>
        <span className="text-gray-400 text-sm flex items-center gap-1.5"><GiSnake size={14} /> Snake</span>
        <span className="font-bold" style={{ color: t.accent }}>Score: {score}</span>
      </div>
      <canvas
        ref={cvs}
        width={SC * SZ}
        height={SR * SZ}
        className="rounded-xl cursor-pointer max-w-full h-auto"
        style={{ border: `1px solid ${t.accent}33` }}
        onClick={start}
      />
      <p className="text-xs text-gray-600">Arrow keys / WASD to move · SPACE / click to start</p>
    </div>
  );
}
