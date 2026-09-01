"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { FaRocket } from "react-icons/fa6";
import type { ThemeColors } from "../../types";

interface SpaceInvadersGameProps {
  t: ThemeColors;
  onCoinEarned?: (amount: number) => void;
}

const CW = 360, CH = 500;
const PLAYER_W = 38, PLAYER_H = 28;
const BULLET_W = 4, BULLET_H = 12;
const ALIEN_ROWS = 5, ALIEN_COLS = 7;
const ALIEN_W = 30, ALIEN_H = 24, ALIEN_GAP = 6;
const ALIEN_TOP = 40;

interface Alien {
  x: number;
  y: number;
  alive: boolean;
  color: string;
}

interface Bullet {
  x: number;
  y: number;
  vy: number;
  fromPlayer: boolean;
}

interface GameState {
  px: number;
  aliens: Alien[];
  bullets: Bullet[];
  score: number;
  lives: number;
  alive: boolean;
  started: boolean;
  dir: number;
  tick: number;
}

const ALIEN_COLORS = ["#a855f7", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444"];

export default function SpaceInvadersGame({ t, onCoinEarned }: SpaceInvadersGameProps) {
  const cvs = useRef<HTMLCanvasElement>(null);
  const G = useRef<GameState | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [best, setBest] = useState(0);
  const raf = useRef<number | null>(null);
  const keys = useRef({ left: false, right: false, shoot: false });
  const lastShoot = useRef(0);

  const initAliens = (): Alien[] => {
    const aliens: Alien[] = [];
    const ox = (CW - ALIEN_COLS * (ALIEN_W + ALIEN_GAP)) / 2;
    for (let r = 0; r < ALIEN_ROWS; r++) {
      for (let c = 0; c < ALIEN_COLS; c++) {
        aliens.push({
          x: ox + c * (ALIEN_W + ALIEN_GAP),
          y: ALIEN_TOP + r * (ALIEN_H + ALIEN_GAP),
          alive: true,
          color: ALIEN_COLORS[r % ALIEN_COLORS.length],
        });
      }
    }
    return aliens;
  };

  const startGame = useCallback(() => {
    G.current = {
      px: CW / 2,
      aliens: initAliens(),
      bullets: [],
      score: 0,
      lives: 3,
      alive: true,
      started: true,
      dir: 1,
      tick: 0,
    };
    setScore(0);
    setLives(3);
    lastShoot.current = 0;
  }, []);

  const draw = useCallback(() => {
    const c = cvs.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const g = G.current;

    // starfield background
    ctx.fillStyle = "#060a14";
    ctx.fillRect(0, 0, CW, CH);
    // stars
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 50; i++) {
      const sx = (i * 73 + (g?.tick || 0) * 0.2) % CW;
      const sy = (i * 97) % CH;
      ctx.globalAlpha = 0.15 + (i % 5) * 0.1;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }
    ctx.globalAlpha = 1;

    if (g) {
      // player ship
      const px = g.px, py = CH - 50;
      // engine glow
      const eg = ctx.createRadialGradient(px, py + PLAYER_H / 2 + 4, 1, px, py + PLAYER_H / 2 + 4, 18);
      eg.addColorStop(0, t.accent + "55");
      eg.addColorStop(1, t.accent + "00");
      ctx.fillStyle = eg;
      ctx.beginPath();
      ctx.arc(px, py + PLAYER_H / 2 + 4, 18, 0, Math.PI * 2);
      ctx.fill();
      // ship body
      ctx.fillStyle = t.accent;
      ctx.beginPath();
      ctx.moveTo(px, py - PLAYER_H / 2);
      ctx.lineTo(px - PLAYER_W / 2, py + PLAYER_H / 2);
      ctx.lineTo(px + PLAYER_W / 2, py + PLAYER_H / 2);
      ctx.closePath();
      ctx.fill();
      // cockpit
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.arc(px, py + 2, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = t.accent + "88";
      ctx.beginPath();
      ctx.arc(px, py + 2, 5, 0, Math.PI * 2);
      ctx.fill();

      // aliens
      g.aliens.forEach((a) => {
        if (!a.alive) return;
        // glow
        const ag = ctx.createRadialGradient(a.x + ALIEN_W / 2, a.y + ALIEN_H / 2, 2, a.x + ALIEN_W / 2, a.y + ALIEN_H / 2, ALIEN_W);
        ag.addColorStop(0, a.color + "44");
        ag.addColorStop(1, a.color + "00");
        ctx.fillStyle = ag;
        ctx.beginPath();
        ctx.arc(a.x + ALIEN_W / 2, a.y + ALIEN_H / 2, ALIEN_W, 0, Math.PI * 2);
        ctx.fill();
        // body
        ctx.fillStyle = a.color;
        ctx.beginPath();
        ctx.roundRect(a.x, a.y, ALIEN_W, ALIEN_H, 6);
        ctx.fill();
        // eyes
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(a.x + 9, a.y + ALIEN_H / 2 - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(a.x + ALIEN_W - 9, a.y + ALIEN_H / 2 - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(a.x + 9, a.y + ALIEN_H / 2 - 1, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(a.x + ALIEN_W - 9, a.y + ALIEN_H / 2 - 1, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // bullets
      g.bullets.forEach((b) => {
        const bColor = b.fromPlayer ? t.accent : "#ef4444";
        const glow = ctx.createRadialGradient(b.x, b.y, 1, b.x, b.y, 8);
        glow.addColorStop(0, bColor + "88");
        glow.addColorStop(1, bColor + "00");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = bColor;
        ctx.beginPath();
        ctx.roundRect(b.x - BULLET_W / 2, b.y - BULLET_H / 2, BULLET_W, BULLET_H, 2);
        ctx.fill();
      });

      // HUD
      ctx.fillStyle = "rgba(10,12,18,0.72)";
      ctx.beginPath();
      ctx.roundRect(10, 8, 130, 28, 10);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 13px Inter";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${g.score}`, 18, 27);
      ctx.textAlign = "right";
      ctx.fillText(`${"❤".repeat(g.lives)}`, CW - 18, 27);
    }

    if (!g || !g.started) {
      ctx.fillStyle = "rgba(6,10,20,0.82)";
      ctx.fillRect(0, 0, CW, CH);
      ctx.fillStyle = "#151a24";
      ctx.beginPath();
      ctx.roundRect(CW / 2 - 120, CH / 2 - 66, 240, 132, 16);
      ctx.fill();
      ctx.strokeStyle = t.accent + "66";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(CW / 2 - 120, CH / 2 - 66, 240, 132, 16);
      ctx.stroke();
      ctx.fillStyle = t.accent;
      ctx.font = "bold 24px Inter";
      ctx.textAlign = "center";
      ctx.fillText("SPACE INVADERS", CW / 2, CH / 2 - 28);
      ctx.fillStyle = "#9ca3af";
      ctx.font = "13px Inter";
      ctx.fillText("Defend Earth from aliens!", CW / 2, CH / 2);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px Inter";
      ctx.fillText("Click / SPACE to start", CW / 2, CH / 2 + 32);
    } else if (!g.alive) {
      ctx.fillStyle = "rgba(6,10,20,0.82)";
      ctx.fillRect(0, 0, CW, CH);
      ctx.fillStyle = "#151a24";
      ctx.beginPath();
      ctx.roundRect(CW / 2 - 120, CH / 2 - 66, 240, 132, 16);
      ctx.fill();
      ctx.strokeStyle = t.accent + "66";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(CW / 2 - 120, CH / 2 - 66, 240, 132, 16);
      ctx.stroke();
      ctx.fillStyle = t.accent;
      ctx.font = "bold 26px Inter";
      ctx.textAlign = "center";
      ctx.fillText("Game Over", CW / 2, CH / 2 - 28);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px Inter";
      ctx.fillText(`Score: ${g.score}`, CW / 2, CH / 2);
      ctx.fillStyle = "#9ca3af";
      ctx.font = "13px Inter";
      ctx.fillText(`Best: ${Math.max(best, g.score)}`, CW / 2, CH / 2 + 22);
      ctx.fillStyle = t.accent;
      ctx.font = "bold 14px Inter";
      ctx.fillText("Click / SPACE to restart", CW / 2, CH / 2 + 48);
    }
  }, [t, best]);

  const loop = useCallback((ts: number) => {
    const g = G.current;
    if (g && g.alive && g.started) {
      g.tick++;
      // move player
      if (keys.current.left) g.px -= 5;
      if (keys.current.right) g.px += 5;
      g.px = Math.max(PLAYER_W / 2, Math.min(CW - PLAYER_W / 2, g.px));

      // auto-shoot
      if (keys.current.shoot && ts - lastShoot.current > 300) {
        lastShoot.current = ts;
        g.bullets.push({ x: g.px, y: CH - 50 - PLAYER_H / 2, vy: -7, fromPlayer: true });
      }

      // move aliens (march)
      const aliveAliens = g.aliens.filter((a) => a.alive);
      if (g.tick % 40 === 0) {
        // check bounds
        const minX = Math.min(...aliveAliens.map((a) => a.x));
        const maxX = Math.max(...aliveAliens.map((a) => a.x + ALIEN_W));
        if (maxX >= CW - 4 || minX <= 4) {
          g.dir *= -1;
          aliveAliens.forEach((a) => (a.y += 12));
        } else {
          aliveAliens.forEach((a) => (a.x += g.dir * 16));
        }
      }

      // alien shoot
      if (g.tick % 60 === 0 && aliveAliens.length > 0) {
        const shooter = aliveAliens[Math.floor(Math.random() * aliveAliens.length)];
        g.bullets.push({ x: shooter.x + ALIEN_W / 2, y: shooter.y + ALIEN_H, vy: 4, fromPlayer: false });
      }

      // move bullets
      g.bullets.forEach((b) => (b.y += b.vy));
      g.bullets = g.bullets.filter((b) => b.y > -20 && b.y < CH + 20);

      // bullet-alien collision
      for (const b of g.bullets) {
        if (!b.fromPlayer) continue;
        for (const a of g.aliens) {
          if (!a.alive) continue;
          if (b.x > a.x && b.x < a.x + ALIEN_W && b.y > a.y && b.y < a.y + ALIEN_H) {
            a.alive = false;
            b.y = -99;
            g.score += 10;
            setScore(g.score);
            break;
          }
        }
      }

      // bullet-player collision
      for (const b of g.bullets) {
        if (b.fromPlayer) continue;
        if (
          b.x > g.px - PLAYER_W / 2 && b.x < g.px + PLAYER_W / 2 &&
          b.y > CH - 50 - PLAYER_H / 2 && b.y < CH - 50 + PLAYER_H / 2
        ) {
          b.y = CH + 99;
          g.lives--;
          setLives(g.lives);
          if (g.lives <= 0) {
            g.alive = false;
            setBest((prev) => Math.max(prev, g.score));
            if (g.score > 0 && onCoinEarned) onCoinEarned(Math.max(1, Math.round(g.score / 10)));
          }
        }
      }

      // aliens reached bottom
      const lowestAlien = Math.max(...aliveAliens.map((a) => a.y + ALIEN_H));
      if (lowestAlien >= CH - 60) {
        g.alive = false;
        setBest((prev) => Math.max(prev, g.score));
        if (g.score > 0 && onCoinEarned) onCoinEarned(Math.max(1, Math.round(g.score / 10)));
      }

      // all aliens dead
      if (aliveAliens.length === 0 || aliveAliens.every((a) => !a.alive)) {
        g.alive = false;
        setBest((prev) => Math.max(prev, g.score));
        if (g.score > 0 && onCoinEarned) onCoinEarned(Math.round(g.score / 5));
      }
    }
    draw();
    raf.current = requestAnimationFrame(loop);
  }, [draw, onCoinEarned]);

  useEffect(() => {
    raf.current = requestAnimationFrame(loop);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [loop]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        const g = G.current;
        if (!g || !g.alive || !g.started) { startGame(); return; }
        keys.current.shoot = true;
      }
      if (e.code === "ArrowLeft" || e.code === "KeyA") { keys.current.left = true; e.preventDefault(); }
      if (e.code === "ArrowRight" || e.code === "KeyD") { keys.current.right = true; e.preventDefault(); }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") keys.current.shoot = false;
      if (e.code === "ArrowLeft" || e.code === "KeyA") keys.current.left = false;
      if (e.code === "ArrowRight" || e.code === "KeyD") keys.current.right = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [startGame]);

  const onClick = useCallback(() => {
    const g = G.current;
    if (!g || !g.alive || !g.started) startGame();
  }, [startGame]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const g = G.current;
    if (!g || !g.alive || !g.started) { startGame(); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CW;
    if (x < CW / 2) keys.current.left = true;
    else keys.current.right = true;
    keys.current.shoot = true;
  }, [startGame]);

  const onPointerUp = useCallback(() => {
    keys.current.left = false;
    keys.current.right = false;
    keys.current.shoot = false;
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full max-w-full" style={{ maxWidth: CW }}>
        <span className="text-gray-400 text-sm flex items-center gap-1.5">
          <FaRocket size={14} style={{ color: t.accent }} /> Space Invaders
        </span>
        <span className="font-bold" style={{ color: t.accent }}>Best: {best}</span>
      </div>
      <canvas
        ref={cvs}
        width={CW}
        height={CH}
        className="rounded-xl cursor-pointer max-w-full h-auto touch-none select-none"
        style={{ border: `1px solid ${t.accent}33` }}
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />
      <p className="text-xs text-gray-600">← → move · SPACE auto-fire · Click to start</p>
    </div>
  );
}
