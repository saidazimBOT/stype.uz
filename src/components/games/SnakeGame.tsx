"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { GiSnake } from "react-icons/gi";
import type { ThemeColors } from "../../types";

interface SnakeGameProps {
  t: ThemeColors;
  onCoinEarned?: (amount: number) => void;
}

const SZ = 20, SC = 20, SR = 18;
const W = SC * SZ, H = SR * SZ;

interface Point {
  x: number;
  y: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
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
  const particles = useRef<Particle[]>([]);
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

  const draw = useCallback(
    (ts: number) => {
      const c = cvs.current;
      if (!c) return;
      const ctx = c.getContext("2d")!;
      const g = G.current;

      // background gradient
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#0c1424");
      bg.addColorStop(0.6, "#0e1120");
      bg.addColorStop(1, "#0b0d15");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // faint grid
      ctx.strokeStyle = "#ffffff05";
      ctx.lineWidth = 1;
      for (let x = 0; x <= SC; x++) {
        ctx.beginPath();
        ctx.moveTo(x * SZ, 0);
        ctx.lineTo(x * SZ, H);
        ctx.stroke();
      }
      for (let y = 0; y <= SR; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * SZ);
        ctx.lineTo(W, y * SZ);
        ctx.stroke();
      }

      // vignette
      const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.85);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.5)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);

      // ── apple (food) ──
      const fx = g.food.x * SZ + SZ / 2, fy = g.food.y * SZ + SZ / 2;
      const pulse = 1 + 0.12 * Math.sin(ts / 170);
      const glow = ctx.createRadialGradient(fx, fy, 1, fx, fy, SZ * 1.4);
      glow.addColorStop(0, "rgba(239,68,68,0.4)");
      glow.addColorStop(1, "rgba(239,68,68,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(fx, fy, SZ * 1.4, 0, Math.PI * 2);
      ctx.fill();
      const ag = ctx.createRadialGradient(fx - 3, fy - 3, 1, fx, fy, SZ / 2);
      ag.addColorStop(0, "#fca5a5");
      ag.addColorStop(0.5, "#ef4444");
      ag.addColorStop(1, "#b91c1c");
      ctx.fillStyle = ag;
      ctx.beginPath();
      ctx.arc(fx, fy, (SZ / 2 - 2) * pulse, 0, Math.PI * 2);
      ctx.fill();
      // leaf
      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.ellipse(fx + 3, fy - SZ / 2 + 1, 4.5, 2.4, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#4ade80";
      ctx.beginPath();
      ctx.moveTo(fx + 1, fy - SZ / 2 - 1);
      ctx.lineTo(fx + 5, fy - SZ / 2 - 5);
      ctx.lineTo(fx + 6, fy - SZ / 2 - 1);
      ctx.closePath();
      ctx.fill();

      // ── snake body ──
      g.snake.forEach((seg, i) => {
        const a = i === 0 ? 1 : Math.max(0.35, 1 - i / (g.snake.length + 5));
        const alpha = Math.floor(a * 255).toString(16).padStart(2, "0");
        ctx.fillStyle = i === 0 ? t.accent : t.accent + alpha;
        ctx.beginPath();
        ctx.roundRect(seg.x * SZ + 1.5, seg.y * SZ + 1.5, SZ - 3, SZ - 3, 7);
        ctx.fill();
      });
      // glow under head
      if (g.snake.length > 0) {
        const h = g.snake[0];
        const hx = h.x * SZ + SZ / 2, hy = h.y * SZ + SZ / 2;
        const hg = ctx.createRadialGradient(hx, hy, 1, hx, hy, SZ * 1.5);
        hg.addColorStop(0, t.accent + "44");
        hg.addColorStop(1, t.accent + "00");
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.arc(hx, hy, SZ * 1.5, 0, Math.PI * 2);
        ctx.fill();
        // eyes
        const ex = g.dir.y, ey = -g.dir.x;
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(hx + g.dir.x * 3 + ex * 4, hy + g.dir.y * 3 + ey * 4, 3.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(hx + g.dir.x * 3 - ex * 4, hy + g.dir.y * 3 - ey * 4, 3.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#0b0d15";
        ctx.beginPath(); ctx.arc(hx + g.dir.x * 4 + ex * 4, hy + g.dir.y * 4 + ey * 4, 1.6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(hx + g.dir.x * 4 - ex * 4, hy + g.dir.y * 4 - ey * 4, 1.6, 0, Math.PI * 2); ctx.fill();
      }

      // ── particles ──
      particles.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.09;
        p.life--;
      });
      particles.current = particles.current.filter((p) => p.life > 0);
      particles.current.forEach((p) => {
        const a = p.life / p.max;
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 * a + 1, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      if (!g.started) {
        ctx.fillStyle = "rgba(8,10,16,0.78)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#151a24";
        ctx.beginPath();
        ctx.roundRect(W / 2 - 115, H / 2 - 62, 230, 124, 16);
        ctx.fill();
        ctx.strokeStyle = t.accent + "66";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(W / 2 - 115, H / 2 - 62, 230, 124, 16);
        ctx.stroke();
        ctx.fillStyle = t.accent;
        ctx.font = "bold 24px Inter";
        ctx.textAlign = "center";
        ctx.fillText("SNAKE", W / 2, H / 2 - 24);
        ctx.fillStyle = "#9ca3af";
        ctx.font = "13px Inter";
        ctx.fillText("Eat apples · don't crash!", W / 2, H / 2 + 2);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px Inter";
        ctx.fillText("Press SPACE or click to start", W / 2, H / 2 + 30);
      }
      if (!g.alive) {
        ctx.fillStyle = "rgba(8,10,16,0.8)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#151a24";
        ctx.beginPath();
        ctx.roundRect(W / 2 - 115, H / 2 - 62, 230, 124, 16);
        ctx.fill();
        ctx.strokeStyle = t.accent + "66";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(W / 2 - 115, H / 2 - 62, 230, 124, 16);
        ctx.stroke();
        ctx.fillStyle = t.accent;
        ctx.font = "bold 26px Inter";
        ctx.textAlign = "center";
        ctx.fillText("Game Over!", W / 2, H / 2 - 22);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 16px Inter";
        ctx.fillText("Score: " + g.score, W / 2, H / 2 + 6);
        ctx.fillStyle = t.accent;
        ctx.font = "bold 14px Inter";
        ctx.fillText("SPACE / click to restart", W / 2, H / 2 + 34);
      }
    },
    [t]
  );

  const tick = useCallback(
    (ts: number) => {
      const g = G.current;
      if (g.started && g.alive && ts - last.current >= 140) {
        last.current = ts;
        g.dir = g.nd;
        const h: Point = { x: g.snake[0].x + g.dir.x, y: g.snake[0].y + g.dir.y };
        if (h.x < 0 || h.x >= SC || h.y < 0 || h.y >= SR || g.snake.some((s) => s.x === h.x && s.y === h.y)) {
          g.alive = false;
          if (g.score > 0 && onCoinEarned) {
            onCoinEarned(g.score);
          }
          return;
        }
        g.snake.unshift(h);
        if (h.x === g.food.x && h.y === g.food.y) {
          g.score++;
          setScore(g.score);
          // burst particles at the apple
          const fx = g.food.x * SZ + SZ / 2, fy = g.food.y * SZ + SZ / 2;
          for (let i = 0; i < 14; i++) {
            particles.current.push({
              x: fx,
              y: fy,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5 - 1.5,
              life: 30 + Math.random() * 15,
              max: 45,
              color: i % 3 === 0 ? "#4ade80" : i % 3 === 1 ? "#ef4444" : t.accent,
            });
          }
          g.food = rndFood(g.snake);
        } else g.snake.pop();
      }
    },
    [onCoinEarned, t]
  );

  const loop = useCallback(
    (ts: number) => {
      tick(ts);
      draw(ts);
      raf.current = requestAnimationFrame(loop);
    },
    [tick, draw]
  );

  const reset = useCallback(() => {
    G.current = { snake: [{ x: 10, y: 9 }], dir: { x: 1, y: 0 }, nd: { x: 1, y: 0 }, food: { x: 5, y: 5 }, score: 0, alive: true, started: true };
    particles.current = [];
    setScore(0);
    last.current = 0;
  }, []);

  const start = useCallback(() => {
    const g = G.current;
    if (!g.alive) { reset(); return; }
    g.started = true;
  }, [reset]);

  useEffect(() => {
    draw(0);
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [loop, draw]);

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
      <div className="flex items-center justify-between w-full max-w-full" style={{ maxWidth: W }}>
        <span className="text-gray-400 text-sm flex items-center gap-1.5"><GiSnake size={14} style={{ color: t.accent }} /> Snake</span>
        <span className="font-bold" style={{ color: t.accent }}>Score: {score}</span>
      </div>
      <canvas
        ref={cvs}
        width={W}
        height={H}
        className="rounded-xl cursor-pointer max-w-full h-auto"
        style={{ border: `1px solid ${t.accent}33`, boxShadow: `0 0 24px ${t.accent}22` }}
        onClick={start}
      />
      <p className="text-xs text-gray-600">Arrow keys / WASD to move · SPACE / click to start</p>
    </div>
  );
}
