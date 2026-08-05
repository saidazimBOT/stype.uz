"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { FaDove } from "react-icons/fa6";
import type { ThemeColors } from "../../types";

interface FlappyBirdProps {
  t: ThemeColors;
  onCoinEarned?: (amount: number) => void;
}

const FW = 320, FH = 420, PGAP = 130, PW = 46;

interface Pipe {
  x: number;
  top: number;
  passed: boolean;
}

interface GameState {
  y: number;
  vy: number;
  pipes: Pipe[];
  score: number;
  alive: boolean;
  started: boolean;
  frame: number;
}

export default function FlappyBird({ t, onCoinEarned }: FlappyBirdProps) {
  const cvs = useRef<HTMLCanvasElement>(null);
  const G = useRef<GameState>({ y: FH / 2, vy: 0, pipes: [], score: 0, alive: false, started: false, frame: 0 });
  const [score, setScore] = useState(0);
  const raf = useRef<number | null>(null);
  const loopRef = useRef<() => void>(() => {});

  const flap = useCallback(() => {
    const g = G.current;
    if (!g.started || !g.alive) {
      G.current = { y: FH / 2, vy: 0, pipes: [], score: 0, alive: true, started: true, frame: 0 };
      setScore(0);
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(loopRef.current);
      return;
    }
    g.vy = -9;
  }, []);

  const draw = useCallback(() => {
    const c = cvs.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const g = G.current;
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, FW, FH);
    ctx.fillStyle = "#2d2d44";
    ctx.fillRect(0, FH - 36, FW, 36);
    ctx.fillStyle = "#22c55e55";
    ctx.fillRect(0, FH - 38, FW, 4);
    g.pipes.forEach((p) => {
      ctx.fillStyle = t.accent + "bb";
      ctx.beginPath();
      ctx.roundRect(p.x, 0, PW, p.top, 4);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(p.x, p.top + PGAP, PW, FH - p.top - PGAP - 36, 4);
      ctx.fill();
      ctx.fillStyle = t.accent;
      ctx.beginPath();
      ctx.roundRect(p.x - 4, p.top - 12, PW + 8, 12, 4);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(p.x - 4, p.top + PGAP, PW + 8, 12, 4);
      ctx.fill();
    });
    const bx = 70, by = g.y;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(Math.min(Math.max(g.vy * 0.05, -0.5), 0.9));
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(6, -3, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a1a2e";
    ctx.beginPath();
    ctx.arc(7.5, -4, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(24, -3);
    ctx.lineTo(24, 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 26px Inter";
    ctx.textAlign = "center";
    ctx.fillText(String(g.score), FW / 2, 46);
    if (!g.started) {
      ctx.fillStyle = "rgba(0,0,0,0.62)";
      ctx.fillRect(0, 0, FW, FH);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 19px Inter";
      ctx.textAlign = "center";
      ctx.fillText("Tap or SPACE to fly!", FW / 2, FH / 2);
    }
    if (g.started && !g.alive) {
      ctx.fillStyle = "rgba(0,0,0,0.72)";
      ctx.fillRect(0, 0, FW, FH);
      ctx.fillStyle = t.accent;
      ctx.font = "bold 26px Inter";
      ctx.textAlign = "center";
      ctx.fillText("Game Over", FW / 2, FH / 2 - 20);
      ctx.fillStyle = "#fff";
      ctx.font = "17px Inter";
      ctx.fillText("Score: " + g.score, FW / 2, FH / 2 + 8);
      ctx.fillText("Tap / SPACE to restart", FW / 2, FH / 2 + 34);
    }
  }, [t]);

  const loop = useCallback(() => {
    const g = G.current;
    if (!g.started || !g.alive) { draw(); return; }
    g.vy += 0.5;
    g.y += g.vy;
    g.frame++;
    if (g.frame % 85 === 0) { const top = 80 + Math.random() * (FH - PGAP - 120); g.pipes.push({ x: FW, top, passed: false }); }
    g.pipes.forEach((p) => (p.x -= 3));
    g.pipes = g.pipes.filter((p) => p.x > -PW - 10);
    g.pipes.forEach((p) => {
      if (!p.passed && p.x + PW < 70) { p.passed = true; g.score++; setScore(g.score); }
    });
    const bx = 70, by = g.y;
    if (by < 0 || by > FH - 40 || g.pipes.some((p) => bx + 13 > p.x && bx - 13 < p.x + PW && (by - 9 < p.top || by + 9 > p.top + PGAP))) {
      g.alive = false;
      // Award coins based on score
      if (g.score > 0 && onCoinEarned) {
        const coinReward = Math.max(1, Math.round(g.score * 1));
        onCoinEarned(coinReward);
      }
      draw();
      return;
    }
    draw();
    raf.current = requestAnimationFrame(loopRef.current);
  }, [draw, onCoinEarned]);

  // Keep loopRef in sync
  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  useEffect(() => {
    draw();
    raf.current = requestAnimationFrame(loopRef.current);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [draw]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); flap(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [flap]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full max-w-full" style={{ maxWidth: FW }}>
        <span className="text-gray-400 text-sm flex items-center gap-1.5"><FaDove size={14} /> Flappy Bird</span>
        <span className="font-bold" style={{ color: t.accent }}>Score: {score}</span>
      </div>
      <canvas
        ref={cvs}
        width={FW}
        height={FH}
        className="rounded-xl cursor-pointer max-w-full h-auto"
        style={{ border: `1px solid ${t.accent}33` }}
        onClick={flap}
      />
      <p className="text-xs text-gray-600">Click / SPACE / ↑ to flap wings</p>
    </div>
  );
}
