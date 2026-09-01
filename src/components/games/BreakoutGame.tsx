"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { FaRectangleList } from "react-icons/fa6";
import type { ThemeColors } from "../../types";

interface BreakoutGameProps {
  t: ThemeColors;
  onCoinEarned?: (amount: number) => void;
}

const CW = 380, CH = 520;
const BRICK_ROWS = 6, BRICK_COLS = 8;
const BRICK_PAD = 3;
const BRICK_TOP = 55;
const BRICK_H = 20;
const PADDLE_W = 80, PADDLE_H = 16, PADDLE_Y = CH - 42;
const BALL_R = 8;

const BRICK_COLORS = [
  "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#3b82f6", "#a855f7",
];

interface Brick {
  x: number; y: number; w: number; h: number;
  color: string; alive: boolean;
  hit: number; // flash timer
}

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; color: string;
}

interface GameState {
  paddleX: number;
  ballX: number; ballY: number;
  ballVX: number; ballVY: number;
  bricks: Brick[];
  score: number; lives: number;
  alive: boolean; started: boolean; launched: boolean;
}

function hex2rgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function draw3DBrick(ctx: CanvasRenderingContext2D, bx: number, by: number, w: number, h: number, color: string, alpha = 1, flash = 0) {
  const d = 5;
  const c = hex2rgb(color);
  const mixWithWhite = flash > 0 ? flash / 8 : 0;

  const mixColor = (r: number, g: number, b: number, wr: number, wg: number, wb: number, t: number) =>
    `rgb(${Math.round(r + (wr - r) * t)},${Math.round(g + (wg - g) * t)},${Math.round(b + (wb - b) * t)})`;

  ctx.globalAlpha = alpha;

  // Right face
  ctx.fillStyle = mixColor(Math.max(0, c.r - 65), Math.max(0, c.g - 65), Math.max(0, c.b - 65), 255, 255, 255, mixWithWhite * 0.3);
  ctx.beginPath();
  ctx.moveTo(bx + w, by);
  ctx.lineTo(bx + w + d, by - d);
  ctx.lineTo(bx + w + d, by + h - d);
  ctx.lineTo(bx + w, by + h);
  ctx.closePath();
  ctx.fill();

  // Bottom face
  ctx.fillStyle = mixColor(Math.max(0, c.r - 75), Math.max(0, c.g - 75), Math.max(0, c.b - 75), 255, 255, 255, mixWithWhite * 0.2);
  ctx.beginPath();
  ctx.moveTo(bx, by + h);
  ctx.lineTo(bx + d, by + h - d);
  ctx.lineTo(bx + w + d, by + h - d);
  ctx.lineTo(bx + w, by + h);
  ctx.closePath();
  ctx.fill();

  // Top face
  ctx.fillStyle = mixColor(c.r, c.g, c.b, 255, 255, 255, mixWithWhite * 0.5);
  ctx.beginPath();
  ctx.roundRect(bx, by, w, h, 3);
  ctx.fill();

  // Highlight gradient
  const tg = ctx.createLinearGradient(bx, by, bx + w, by + h);
  tg.addColorStop(0, `rgba(255,255,255,${0.3 + mixWithWhite * 0.3})`);
  tg.addColorStop(0.3, "rgba(255,255,255,0.05)");
  tg.addColorStop(1, "rgba(0,0,0,0.12)");
  ctx.fillStyle = tg;
  ctx.beginPath();
  ctx.roundRect(bx, by, w, h, 3);
  ctx.fill();

  // Inner shine
  ctx.fillStyle = `rgba(255,255,255,${0.1 + mixWithWhite * 0.2})`;
  ctx.beginPath();
  ctx.roundRect(bx + 2, by + 1, w - 6, h * 0.35, 2);
  ctx.fill();

  // Border
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.roundRect(bx, by, w, h, 3);
  ctx.stroke();

  ctx.globalAlpha = 1;
}

export default function BreakoutGame({ t, onCoinEarned }: BreakoutGameProps) {
  const cvs = useRef<HTMLCanvasElement>(null);
  const G = useRef<GameState | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [best, setBest] = useState(0);
  const raf = useRef<number | null>(null);
  const mouse = useRef({ x: CW / 2 });
  const particles = useRef<Particle[]>([]);

  const initBricks = (): Brick[] => {
    const bricks: Brick[] = [];
    const bw = (CW - BRICK_PAD * (BRICK_COLS + 1)) / BRICK_COLS;
    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        bricks.push({
          x: BRICK_PAD + c * (bw + BRICK_PAD),
          y: BRICK_TOP + r * (BRICK_H + BRICK_PAD),
          w: bw, h: BRICK_H,
          color: BRICK_COLORS[r], alive: true, hit: 0,
        });
      }
    }
    return bricks;
  };

  const resetBall = useCallback(() => {
    const g = G.current;
    if (!g) return;
    g.ballX = g.paddleX;
    g.ballY = PADDLE_Y - BALL_R - 2;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;
    g.ballVX = Math.cos(angle) * 4.5;
    g.ballVY = Math.sin(angle) * 4.5;
    g.launched = false;
  }, []);

  const startGame = useCallback(() => {
    G.current = {
      paddleX: CW / 2, ballX: CW / 2, ballY: PADDLE_Y - BALL_R - 2,
      ballVX: 0, ballVY: 0,
      bricks: initBricks(), score: 0, lives: 3,
      alive: true, started: true, launched: false,
    };
    particles.current = [];
    setScore(0); setLives(3);
  }, []);

  const draw = useCallback(() => {
    const c = cvs.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const g = G.current;

    // Space background
    const bg = ctx.createLinearGradient(0, 0, 0, CH);
    bg.addColorStop(0, "#060a18");
    bg.addColorStop(0.4, "#0a1025");
    bg.addColorStop(1, "#050810");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CW, CH);

    // Stars
    for (let i = 0; i < 55; i++) {
      const sx = (i * 73) % CW;
      const sy = (i * 97) % CH;
      ctx.globalAlpha = 0.06 + (i % 4) * 0.03;
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(sx, sy, 0.7 + (i % 3) * 0.3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Side glow from bricks
    if (g && g.bricks.some((b) => b.alive)) {
      const topGlow = ctx.createRadialGradient(CW / 2, BRICK_TOP + 50, 20, CW / 2, BRICK_TOP + 50, 200);
      topGlow.addColorStop(0, "rgba(100,150,255,0.06)");
      topGlow.addColorStop(1, "transparent");
      ctx.fillStyle = topGlow;
      ctx.fillRect(0, 0, CW, BRICK_TOP + 120);
    }

    if (g) {
      // 3D Bricks
      g.bricks.forEach((b) => {
        if (!b.alive) return;
        // Shadow under brick
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.beginPath();
        ctx.roundRect(b.x + 3, b.y + 4, b.w, b.h, 3);
        ctx.fill();
        draw3DBrick(ctx, b.x, b.y, b.w, b.h, b.color, 1, b.hit);
        if (b.hit > 0) b.hit--;
      });

      // 3D Paddle
      const px = g.paddleX - PADDLE_W / 2;
      const py = PADDLE_Y;
      // Paddle shadow
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.ellipse(g.paddleX, PADDLE_Y + PADDLE_H + 4, PADDLE_W * 0.45, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Right face
      const pC = hex2rgb(t.accent);
      ctx.fillStyle = `rgb(${Math.max(0, pC.r - 60)},${Math.max(0, pC.g - 60)},${Math.max(0, pC.b - 60)})`;
      ctx.beginPath();
      ctx.moveTo(px + PADDLE_W, py);
      ctx.lineTo(px + PADDLE_W + 5, py - 4);
      ctx.lineTo(px + PADDLE_W + 5, py + PADDLE_H - 4);
      ctx.lineTo(px + PADDLE_W, py + PADDLE_H);
      ctx.closePath();
      ctx.fill();
      // Bottom face
      ctx.fillStyle = `rgb(${Math.max(0, pC.r - 70)},${Math.max(0, pC.g - 70)},${Math.max(0, pC.b - 70)})`;
      ctx.beginPath();
      ctx.moveTo(px, py + PADDLE_H);
      ctx.lineTo(px + 5, py + PADDLE_H - 4);
      ctx.lineTo(px + PADDLE_W + 5, py + PADDLE_H - 4);
      ctx.lineTo(px + PADDLE_W, py + PADDLE_H);
      ctx.closePath();
      ctx.fill();
      // Top face
      const pGrad = ctx.createLinearGradient(px, py, px + PADDLE_W, py + PADDLE_H);
      pGrad.addColorStop(0, `color-mix(in srgb, ${t.accent} 100%, #fff 20%)`);
      pGrad.addColorStop(0.5, t.accent);
      pGrad.addColorStop(1, `color-mix(in srgb, ${t.accent} 80%, #000 20%)`);
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.roundRect(px, py, PADDLE_W, PADDLE_H, 8);
      ctx.fill();
      // Highlight
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.beginPath();
      ctx.roundRect(px + 4, py + 1, PADDLE_W - 8, PADDLE_H * 0.35, 4);
      ctx.fill();
      // Glow
      const pglow = ctx.createRadialGradient(g.paddleX, PADDLE_Y + PADDLE_H / 2, 4, g.paddleX, PADDLE_Y + PADDLE_H / 2, PADDLE_W / 2 + 12);
      pglow.addColorStop(0, t.accent + "30");
      pglow.addColorStop(1, t.accent + "00");
      ctx.fillStyle = pglow;
      ctx.beginPath();
      ctx.arc(g.paddleX, PADDLE_Y + PADDLE_H / 2, PADDLE_W / 2 + 12, 0, Math.PI * 2);
      ctx.fill();

      // 3D Ball
      if (g.launched || g.started) {
        // Shadow
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath();
        ctx.ellipse(g.ballX + 3, g.ballY + 5, BALL_R + 1, BALL_R * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Outer glow
        const ballGlow = ctx.createRadialGradient(g.ballX, g.ballY, 1, g.ballX, g.ballY, BALL_R + 8);
        ballGlow.addColorStop(0, "#ffffff");
        ballGlow.addColorStop(0.3, t.accent);
        ballGlow.addColorStop(1, t.accent + "00");
        ctx.fillStyle = ballGlow;
        ctx.beginPath();
        ctx.arc(g.ballX, g.ballY, BALL_R + 8, 0, Math.PI * 2);
        ctx.fill();
        // Ball body
        const ballG = ctx.createRadialGradient(g.ballX - 2, g.ballY - 2, 1, g.ballX, g.ballY, BALL_R);
        ballG.addColorStop(0, "#ffffff");
        ballG.addColorStop(0.5, t.accent);
        ballG.addColorStop(1, `color-mix(in srgb, ${t.accent} 60%, #000 40%)`);
        ctx.fillStyle = ballG;
        ctx.beginPath();
        ctx.arc(g.ballX, g.ballY, BALL_R, 0, Math.PI * 2);
        ctx.fill();
        // Highlight
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.beginPath();
        ctx.arc(g.ballX - 2, g.ballY - 2, BALL_R * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }

      // Particles
      particles.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
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

      // HUD
      ctx.fillStyle = "rgba(8,10,20,0.78)";
      ctx.beginPath();
      ctx.roundRect(10, 8, 150, 32, 12);
      ctx.fill();
      ctx.strokeStyle = t.accent + "33";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(10, 8, 150, 32, 12);
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 13px Inter";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${g.score}`, 18, 29);
      ctx.textAlign = "right";
      ctx.fillText(`${"❤".repeat(g.lives)}`, CW - 18, 29);
    }

    if (!g || !g.started) {
      ctx.fillStyle = "rgba(6,10,24,0.85)";
      ctx.fillRect(0, 0, CW, CH);
      ctx.fillStyle = "#111827";
      ctx.beginPath();
      ctx.roundRect(CW / 2 - 130, CH / 2 - 70, 260, 140, 18);
      ctx.fill();
      ctx.strokeStyle = t.accent + "55";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(CW / 2 - 130, CH / 2 - 70, 260, 140, 18);
      ctx.stroke();
      ctx.fillStyle = t.accent;
      ctx.font = "bold 28px Inter";
      ctx.textAlign = "center";
      ctx.fillText("BREAKOUT 3D", CW / 2, CH / 2 - 28);
      ctx.fillStyle = "#9ca3af";
      ctx.font = "13px Inter";
      ctx.fillText("Break all the bricks!", CW / 2, CH / 2);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px Inter";
      ctx.fillText("Click / SPACE to start", CW / 2, CH / 2 + 32);
    } else if (!g.alive) {
      ctx.fillStyle = "rgba(6,10,24,0.85)";
      ctx.fillRect(0, 0, CW, CH);
      ctx.fillStyle = "#111827";
      ctx.beginPath();
      ctx.roundRect(CW / 2 - 130, CH / 2 - 70, 260, 140, 18);
      ctx.fill();
      ctx.strokeStyle = t.accent + "55";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(CW / 2 - 130, CH / 2 - 70, 260, 140, 18);
      ctx.stroke();
      ctx.fillStyle = t.accent;
      ctx.font = "bold 28px Inter";
      ctx.textAlign = "center";
      ctx.fillText("Game Over", CW / 2, CH / 2 - 28);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 18px Inter";
      ctx.fillText(`Score: ${g.score}`, CW / 2, CH / 2);
      ctx.fillStyle = "#9ca3af";
      ctx.font = "13px Inter";
      ctx.fillText(`Best: ${Math.max(best, g.score)}`, CW / 2, CH / 2 + 24);
      ctx.fillStyle = t.accent;
      ctx.font = "bold 14px Inter";
      ctx.fillText("Click / SPACE to restart", CW / 2, CH / 2 + 50);
    }
  }, [t, best]);

  const loop = useCallback(() => {
    const g = G.current;
    if (g && g.alive && g.started) {
      g.paddleX = Math.max(PADDLE_W / 2, Math.min(CW - PADDLE_W / 2, mouse.current.x));
      if (g.launched) {
        g.ballX += g.ballVX;
        g.ballY += g.ballVY;
        if (g.ballX - BALL_R <= 0 || g.ballX + BALL_R >= CW) { g.ballVX *= -1; g.ballX = Math.max(BALL_R, Math.min(CW - BALL_R, g.ballX)); }
        if (g.ballY - BALL_R <= 0) { g.ballVY *= -1; g.ballY = BALL_R; }
        // Paddle
        if (g.ballY + BALL_R >= PADDLE_Y && g.ballY + BALL_R <= PADDLE_Y + PADDLE_H + 4 &&
          g.ballX >= g.paddleX - PADDLE_W / 2 - 4 && g.ballX <= g.paddleX + PADDLE_W / 2 + 4 && g.ballVY > 0) {
          const hit = (g.ballX - g.paddleX) / (PADDLE_W / 2);
          const speed = Math.sqrt(g.ballVX ** 2 + g.ballVY ** 2);
          const angle = hit * 1.2 - Math.PI / 2;
          g.ballVX = Math.cos(angle) * speed;
          g.ballVY = Math.sin(angle) * speed;
          g.ballY = PADDLE_Y - BALL_R - 1;
          // Paddle hit particles
          for (let i = 0; i < 5; i++) {
            particles.current.push({
              x: g.ballX, y: PADDLE_Y,
              vx: (Math.random() - 0.5) * 4, vy: -Math.random() * 3 - 1,
              life: 20, max: 20, color: t.accent,
            });
          }
        }
        // Bricks
        for (const b of g.bricks) {
          if (!b.alive) continue;
          if (g.ballX + BALL_R > b.x && g.ballX - BALL_R < b.x + b.w &&
            g.ballY + BALL_R > b.y && g.ballY - BALL_R < b.y + b.h) {
            b.alive = false;
            b.hit = 8;
            g.score += 10;
            setScore(g.score);
            const overlapL = g.ballX + BALL_R - b.x;
            const overlapR = b.x + b.w - (g.ballX - BALL_R);
            const overlapT = g.ballY + BALL_R - b.y;
            const overlapB = b.y + b.h - (g.ballY - BALL_R);
            const minO = Math.min(overlapL, overlapR, overlapT, overlapB);
            if (minO === overlapT || minO === overlapB) g.ballVY *= -1;
            else g.ballVX *= -1;
            // Brick break particles
            for (let i = 0; i < 10; i++) {
              particles.current.push({
                x: b.x + b.w / 2, y: b.y + b.h / 2,
                vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6 - 1,
                life: 25 + Math.random() * 10, max: 35,
                color: i % 3 === 0 ? b.color : i % 3 === 1 ? "#fbbf24" : "#fff",
              });
            }
            break;
          }
        }
        if (g.bricks.every((b) => !b.alive)) {
          g.alive = false;
          setBest((prev) => Math.max(prev, g.score));
          if (onCoinEarned) onCoinEarned(Math.round(g.score / 5));
        }
        if (g.ballY > CH + 10) {
          g.lives--;
          setLives(g.lives);
          if (g.lives <= 0) {
            g.alive = false;
            setBest((prev) => Math.max(prev, g.score));
            if (g.score > 0 && onCoinEarned) onCoinEarned(Math.max(1, Math.round(g.score / 10)));
          } else resetBall();
        }
      } else {
        g.ballX = g.paddleX;
        g.ballY = PADDLE_Y - BALL_R - 2;
      }
    }
    draw();
    raf.current = requestAnimationFrame(loop);
  }, [draw, onCoinEarned, resetBall, t]);

  useEffect(() => { raf.current = requestAnimationFrame(loop); return () => { if (raf.current) cancelAnimationFrame(raf.current); }; }, [loop]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        const g = G.current;
        if (!g || !g.alive || !g.started) { startGame(); return; }
        if (!g.launched) {
          g.launched = true;
          const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
          g.ballVX = Math.cos(angle) * 4.5;
          g.ballVY = Math.sin(angle) * 4.5;
        }
      }
      const g = G.current;
      if (g && g.started && g.alive) {
        if (e.code === "ArrowLeft" || e.code === "KeyA") mouse.current.x = Math.max(PADDLE_W / 2, mouse.current.x - 30);
        if (e.code === "ArrowRight" || e.code === "KeyD") mouse.current.x = Math.min(CW - PADDLE_W / 2, mouse.current.x + 30);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [startGame]);

  const onClick = useCallback(() => {
    const g = G.current;
    if (!g || !g.alive || !g.started) { startGame(); return; }
    if (!g.launched) {
      g.launched = true;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
      g.ballVX = Math.cos(angle) * 4.5;
      g.ballVY = Math.sin(angle) * 4.5;
    }
  }, [startGame]);

  const onMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouse.current.x = ((e.clientX - rect.left) / rect.width) * CW;
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full max-w-full" style={{ maxWidth: CW }}>
        <span className="text-gray-400 text-sm flex items-center gap-1.5">
          <FaRectangleList size={14} style={{ color: t.accent }} /> Breakout 3D
        </span>
        <span className="font-bold" style={{ color: t.accent }}>Best: {best}</span>
      </div>
      <canvas
        ref={cvs} width={CW} height={CH}
        className="rounded-xl cursor-pointer max-w-full h-auto touch-none select-none"
        style={{ border: `1px solid ${t.accent}33`, boxShadow: `0 0 32px ${t.accent}22` }}
        onClick={onClick} onPointerMove={onMove}
      />
      <p className="text-xs text-gray-600">← → / mouse to move paddle · SPACE / click to launch</p>
    </div>
  );
}
