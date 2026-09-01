"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { GiSnake } from "react-icons/gi";
import type { ThemeColors } from "../../types";

interface SnakeGameProps {
  t: ThemeColors;
  onCoinEarned?: (amount: number) => void;
}

// 3D isometric grid
const SC = 16, SR = 14;
const CELL = 24;
const W = SC * CELL + 80;
const H = SR * CELL + 120;
const ISO_X = 0.85;
const ISO_Y = 0.45;
const OX = 50;
const OY = 40;
const BLOCK_H = 14;

interface Point { x: number; y: number; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; z: number; vz: number; }

interface GameState {
  snake: Point[];
  dir: Point;
  nd: Point;
  food: Point;
  score: number;
  alive: boolean;
  started: boolean;
}

// Convert grid to isometric screen coords
function toIso(gx: number, gy: number) {
  return {
    sx: OX + (gx - gy) * CELL * ISO_X,
    sy: OY + (gx + gy) * CELL * ISO_Y,
  };
}

// Draw a 3D block at grid position
function draw3DBlock(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  color: string,
  height: number,
  alpha = 1,
  accent?: string,
) {
  const { sx, sy } = toIso(gx, gy);
  const cw = CELL * ISO_X;
  const ch = CELL * ISO_Y;
  const h = height;

  ctx.globalAlpha = alpha;

  // Parse color to rgb
  const hex2rgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };
  const c = hex2rgb(color);

  // Top face
  ctx.fillStyle = `rgb(${Math.min(255, c.r + 30)},${Math.min(255, c.g + 30)},${Math.min(255, c.b + 30)})`;
  ctx.beginPath();
  ctx.moveTo(sx, sy - h);
  ctx.lineTo(sx + cw, sy + ch * 0 - h);
  ctx.lineTo(sx, sy + ch * 2 - h);
  ctx.lineTo(sx - cw, sy + ch * 0 - h);
  ctx.closePath();
  ctx.fill();

  // Top highlight
  const tg = ctx.createLinearGradient(sx - cw, sy - h, sx + cw, sy - h);
  tg.addColorStop(0, "rgba(255,255,255,0.25)");
  tg.addColorStop(0.5, "rgba(255,255,255,0.05)");
  tg.addColorStop(1, "rgba(0,0,0,0.1)");
  ctx.fillStyle = tg;
  ctx.beginPath();
  ctx.moveTo(sx, sy - h);
  ctx.lineTo(sx + cw, sy + ch * 0 - h);
  ctx.lineTo(sx, sy + ch * 2 - h);
  ctx.lineTo(sx - cw, sy + ch * 0 - h);
  ctx.closePath();
  ctx.fill();

  // Left face
  ctx.fillStyle = `rgb(${Math.max(0, c.r - 40)},${Math.max(0, c.g - 40)},${Math.max(0, c.b - 40)})`;
  ctx.beginPath();
  ctx.moveTo(sx - cw, sy + ch * 0 - h);
  ctx.lineTo(sx, sy + ch * 2 - h);
  ctx.lineTo(sx, sy + ch * 2);
  ctx.lineTo(sx - cw, sy + ch * 0);
  ctx.closePath();
  ctx.fill();

  // Right face
  ctx.fillStyle = `rgb(${Math.max(0, c.r - 70)},${Math.max(0, c.g - 70)},${Math.max(0, c.b - 70)})`;
  ctx.beginPath();
  ctx.moveTo(sx + cw, sy + ch * 0 - h);
  ctx.lineTo(sx, sy + ch * 2 - h);
  ctx.lineTo(sx, sy + ch * 2);
  ctx.lineTo(sx + cw, sy + ch * 0);
  ctx.closePath();
  ctx.fill();

  // Edge lines
  ctx.strokeStyle = accent || `rgba(255,255,255,0.12)`;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(sx, sy - h);
  ctx.lineTo(sx + cw, sy + ch * 0 - h);
  ctx.lineTo(sx, sy + ch * 2 - h);
  ctx.lineTo(sx - cw, sy + ch * 0 - h);
  ctx.closePath();
  ctx.stroke();

  ctx.globalAlpha = 1;
}

// Draw ground tile (flat)
function drawGround(ctx: CanvasRenderingContext2D, gx: number, gy: number, dark: boolean) {
  const { sx, sy } = toIso(gx, gy);
  const cw = CELL * ISO_X;
  const ch = CELL * ISO_Y;
  ctx.fillStyle = dark ? "#0e1320" : "#111827";
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx + cw, sy - ch);
  ctx.lineTo(sx, sy - ch * 2);
  ctx.lineTo(sx - cw, sy - ch);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#ffffff08";
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

export default function SnakeGame({ t, onCoinEarned }: SnakeGameProps) {
  const cvs = useRef<HTMLCanvasElement>(null);
  const G = useRef<GameState>({
    snake: [{ x: 8, y: 7 }],
    dir: { x: 1, y: 0 },
    nd: { x: 1, y: 0 },
    food: { x: 3, y: 3 },
    score: 0,
    alive: true,
    started: false,
  });
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

      // 3D space background
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#060a18");
      bg.addColorStop(0.5, "#0a1025");
      bg.addColorStop(1, "#050810");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // stars with parallax
      for (let i = 0; i < 60; i++) {
        const sx2 = (i * 73 + ts * 0.003 * ((i % 3) + 1)) % W;
        const sy2 = (i * 97) % H;
        ctx.globalAlpha = 0.08 + (i % 5) * 0.04;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(sx2, sy2, 0.8 + (i % 3) * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // 3D ground plane
      for (let y = 0; y < SR; y++) {
        for (let x = 0; x < SC; x++) {
          drawGround(ctx, x, y, (x + y) % 2 === 0);
        }
      }

      // Ambient glow on board
      const boardCenter = toIso(SC / 2, SR / 2);
      const ambientGlow = ctx.createRadialGradient(boardCenter.sx, boardCenter.sy - 20, 20, boardCenter.sx, boardCenter.sy - 20, 280);
      ambientGlow.addColorStop(0, t.accent + "0c");
      ambientGlow.addColorStop(1, "transparent");
      ctx.fillStyle = ambientGlow;
      ctx.fillRect(0, 0, W, H);

      // Snake body (draw back to front for correct 3D overlap)
      for (let i = g.snake.length - 1; i >= 0; i--) {
        const seg = g.snake[i];
        const isHead = i === 0;
        const ratio = 1 - i / (g.snake.length + 5);
        const h = isHead ? BLOCK_H + 4 : BLOCK_H * ratio + 2;

        // Shadow on ground
        const { sx: shx, sy: shy } = toIso(seg.x, seg.y);
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.ellipse(shx, shy + 2, CELL * 0.4, CELL * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        const blockColor = isHead ? t.accent : t.accent;
        draw3DBlock(ctx, seg.x, seg.y, blockColor, h, isHead ? 1 : Math.max(0.4, ratio), isHead ? "#ffffff22" : undefined);

        // Head eyes
        if (isHead) {
          const ex = g.dir.y, ey = -g.dir.x;
          const { sx: hx, sy: hy } = toIso(seg.x, seg.y);
          const eyeOffX = g.dir.x * 4 + ex * 5;
          const eyeOffY = (g.dir.y * 4 + ey * 5) * ISO_Y - BLOCK_H - 4;
          // Left eye
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(hx + eyeOffX - ex * 3, hy + eyeOffY - (-ey) * 2, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#0a0e18";
          ctx.beginPath();
          ctx.arc(hx + eyeOffX + g.dir.x * 1 - ex * 3, hy + eyeOffY + g.dir.y * 0.5 - (-ey) * 2, 1.5, 0, Math.PI * 2);
          ctx.fill();
          // Right eye
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(hx + eyeOffX + ex * 3, hy + eyeOffY + (-ey) * 2, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#0a0e18";
          ctx.beginPath();
          ctx.arc(hx + eyeOffX + g.dir.x * 1 + ex * 3, hy + eyeOffY + g.dir.y * 0.5 + (-ey) * 2, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3D Food (floating apple with glow)
      const foodPulse = 1 + 0.15 * Math.sin(ts / 160);
      const foodFloat = Math.sin(ts / 200) * 3;
      const { sx: fx, sy: fy } = toIso(g.food.x, g.food.y);
      // Shadow
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(fx, fy + 2, CELL * 0.35, CELL * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      // Glow
      const fg = ctx.createRadialGradient(fx, fy - BLOCK_H - 4 + foodFloat, 2, fx, fy - BLOCK_H - 4 + foodFloat, 28);
      fg.addColorStop(0, "rgba(239,68,68,0.5)");
      fg.addColorStop(0.5, "rgba(239,68,68,0.15)");
      fg.addColorStop(1, "rgba(239,68,68,0)");
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.arc(fx, fy - BLOCK_H - 4 + foodFloat, 28, 0, Math.PI * 2);
      ctx.fill();
      // Apple body (3D sphere)
      const ag = ctx.createRadialGradient(fx - 3, fy - BLOCK_H - 8 + foodFloat, 1, fx, fy - BLOCK_H - 4 + foodFloat, 9 * foodPulse);
      ag.addColorStop(0, "#fca5a5");
      ag.addColorStop(0.4, "#ef4444");
      ag.addColorStop(1, "#b91c1c");
      ctx.fillStyle = ag;
      ctx.beginPath();
      ctx.arc(fx, fy - BLOCK_H - 4 + foodFloat, 9 * foodPulse, 0, Math.PI * 2);
      ctx.fill();
      // Leaf
      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.ellipse(fx + 3, fy - BLOCK_H - 14 + foodFloat, 5, 2.5, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#4ade80";
      ctx.beginPath();
      ctx.moveTo(fx + 1, fy - BLOCK_H - 16 + foodFloat);
      ctx.lineTo(fx + 6, fy - BLOCK_H - 20 + foodFloat);
      ctx.lineTo(fx + 7, fy - BLOCK_H - 16 + foodFloat);
      ctx.closePath();
      ctx.fill();

      // Particles
      particles.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.z = (p.z || 0) + (p.vz || 0);
        p.vz = (p.vz || 0) - 0.12;
        p.vy += 0.06;
        p.life--;
      });
      particles.current = particles.current.filter((p) => p.life > 0);
      particles.current.forEach((p) => {
        const a = p.life / p.max;
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y + (p.z || 0), 3.5 * a + 1, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // HUD
      ctx.fillStyle = "rgba(8,10,20,0.78)";
      ctx.beginPath();
      ctx.roundRect(W / 2 - 70, 4, 140, 30, 12);
      ctx.fill();
      ctx.strokeStyle = t.accent + "44";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(W / 2 - 70, 4, 140, 30, 12);
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px Inter";
      ctx.textAlign = "center";
      ctx.fillText(`Score: ${g.score}`, W / 2, 24);

      // Start overlay
      if (!g.started) {
        ctx.fillStyle = "rgba(6,10,24,0.85)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#111827";
        ctx.beginPath();
        ctx.roundRect(W / 2 - 130, H / 2 - 70, 260, 140, 18);
        ctx.fill();
        ctx.strokeStyle = t.accent + "55";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(W / 2 - 130, H / 2 - 70, 260, 140, 18);
        ctx.stroke();
        ctx.fillStyle = t.accent;
        ctx.font = "bold 28px Inter";
        ctx.textAlign = "center";
        ctx.fillText("SNAKE 3D", W / 2, H / 2 - 26);
        ctx.fillStyle = "#9ca3af";
        ctx.font = "13px Inter";
        ctx.fillText("Eat apples · grow longer · don't crash!", W / 2, H / 2 + 2);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px Inter";
        ctx.fillText("Press SPACE or click to start", W / 2, H / 2 + 30);
      }
      // Game Over overlay
      if (!g.alive) {
        ctx.fillStyle = "rgba(6,10,24,0.85)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#111827";
        ctx.beginPath();
        ctx.roundRect(W / 2 - 130, H / 2 - 70, 260, 140, 18);
        ctx.fill();
        ctx.strokeStyle = t.accent + "55";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(W / 2 - 130, H / 2 - 70, 260, 140, 18);
        ctx.stroke();
        ctx.fillStyle = t.accent;
        ctx.font = "bold 28px Inter";
        ctx.textAlign = "center";
        ctx.fillText("Game Over!", W / 2, H / 2 - 26);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 18px Inter";
        ctx.fillText(`Score: ${g.score}`, W / 2, H / 2 + 4);
        ctx.fillStyle = t.accent;
        ctx.font = "bold 14px Inter";
        ctx.fillText("SPACE / click to restart", W / 2, H / 2 + 34);
      }
    },
    [t],
  );

  const tick = useCallback(
    (ts: number) => {
      const g = G.current;
      if (g.started && g.alive && ts - last.current >= 130) {
        last.current = ts;
        g.dir = g.nd;
        const h: Point = { x: g.snake[0].x + g.dir.x, y: g.snake[0].y + g.dir.y };
        if (h.x < 0 || h.x >= SC || h.y < 0 || h.y >= SR || g.snake.some((s) => s.x === h.x && s.y === h.y)) {
          g.alive = false;
          if (g.score > 0 && onCoinEarned) onCoinEarned(g.score);
          return;
        }
        g.snake.unshift(h);
        if (h.x === g.food.x && h.y === g.food.y) {
          g.score++;
          setScore(g.score);
          const fp = toIso(g.food.x, g.food.y);
          for (let i = 0; i < 18; i++) {
            particles.current.push({
              x: fp.sx,
              y: fp.sy - BLOCK_H - 6,
              vx: (Math.random() - 0.5) * 7,
              vy: (Math.random() - 0.5) * 5 - 2,
              z: 0,
              vz: 3 + Math.random() * 4,
              life: 35 + Math.random() * 15,
              max: 50,
              color: i % 4 === 0 ? "#4ade80" : i % 4 === 1 ? "#ef4444" : i % 4 === 2 ? "#fbbf24" : t.accent,
            });
          }
          g.food = rndFood(g.snake);
        } else g.snake.pop();
      }
    },
    [onCoinEarned, t],
  );

  const loop = useCallback(
    (ts: number) => {
      tick(ts);
      draw(ts);
      raf.current = requestAnimationFrame(loop);
    },
    [tick, draw],
  );

  const reset = useCallback(() => {
    G.current = {
      snake: [{ x: 8, y: 7 }],
      dir: { x: 1, y: 0 },
      nd: { x: 1, y: 0 },
      food: { x: 3, y: 3 },
      score: 0,
      alive: true,
      started: true,
    };
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
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [loop, draw]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const g = G.current;
      if (e.code === "Space") { e.preventDefault(); start(); return; }
      if (!g.started || !g.alive) return;
      const m: Record<string, Point> = {
        ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 },
        KeyW: { x: 0, y: -1 }, KeyS: { x: 0, y: 1 },
        KeyA: { x: -1, y: 0 }, KeyD: { x: 1, y: 0 },
      };
      const nd = m[e.code];
      if (nd && !(nd.x === -g.dir.x && nd.y === -g.dir.y)) { g.nd = nd; e.preventDefault(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [start]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full max-w-full" style={{ maxWidth: W }}>
        <span className="text-gray-400 text-sm flex items-center gap-1.5">
          <GiSnake size={14} style={{ color: t.accent }} /> Snake 3D
        </span>
        <span className="font-bold" style={{ color: t.accent }}>Score: {score}</span>
      </div>
      <canvas
        ref={cvs}
        width={W}
        height={H}
        className="rounded-xl cursor-pointer max-w-full h-auto"
        style={{ border: `1px solid ${t.accent}33`, boxShadow: `0 0 32px ${t.accent}22` }}
        onClick={start}
      />
      <p className="text-xs text-gray-600">Arrow keys / WASD to move · SPACE / click to start</p>
    </div>
  );
}
