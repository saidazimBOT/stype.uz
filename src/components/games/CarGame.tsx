"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { FaCar } from "react-icons/fa6";
import type { ThemeColors } from "../../types";

interface CarGameProps {
  t: ThemeColors;
  onCoinEarned?: (amount: number) => void;
}

const CW = 320, CH = 500;
const ROAD_L = 42, ROAD_R = CW - 42;
const LANES = 3;
const LANE_W = (ROAD_R - ROAD_L) / LANES;
const CAR_W = 46, CAR_H = 82;
const PY = CH - CAR_H - 30; // player car top Y

interface Enemy {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  speed: number;
}

interface GameState {
  px: number;
  dist: number;
  score: number;
  scroll: number;
  spawnT: number;
  enemies: Enemy[];
  alive: boolean;
  started: boolean;
}

const ENEMY_COLORS = ["#3b82f6", "#f59e0b", "#a855f7", "#22c55e", "#ef4444", "#06b6d4"];

export default function CarGame({ t, onCoinEarned }: CarGameProps) {
  const cvs = useRef<HTMLCanvasElement>(null);
  const G = useRef<GameState>({
    px: (ROAD_L + ROAD_R) / 2,
    dist: 0,
    score: 0,
    scroll: 0,
    spawnT: 40,
    enemies: [],
    alive: true,
    started: false,
  });
  const keys = useRef({ left: false, right: false });
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const raf = useRef<number | null>(null);

  const drawCar = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
      // shadow
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.roundRect(x + 3, y + 5, w, h, 12);
      ctx.fill();
      // wheels
      ctx.fillStyle = "#0b0f14";
      ctx.beginPath(); ctx.roundRect(x - 4, y + 12, 9, 18, 4); ctx.fill();
      ctx.beginPath(); ctx.roundRect(x + w - 5, y + 12, 9, 18, 4); ctx.fill();
      ctx.beginPath(); ctx.roundRect(x - 4, y + h - 30, 9, 18, 4); ctx.fill();
      ctx.beginPath(); ctx.roundRect(x + w - 5, y + h - 30, 9, 18, 4); ctx.fill();
      // body
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 12);
      ctx.fill();
      // body shading (3D)
      const sh = ctx.createLinearGradient(x, y, x, y + h);
      sh.addColorStop(0, "rgba(255,255,255,0.35)");
      sh.addColorStop(0.35, "rgba(255,255,255,0.05)");
      sh.addColorStop(1, "rgba(0,0,0,0.35)");
      ctx.fillStyle = sh;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 12);
      ctx.fill();
      // hood highlight line
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 8, y + 6);
      ctx.lineTo(x + w - 8, y + 6);
      ctx.stroke();
      // windshield
      ctx.fillStyle = "#1e293b";
      ctx.beginPath(); ctx.roundRect(x + 6, y + 18, w - 12, 13, 5); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(x + 6, y + 18, w - 12, 13, 5); ctx.stroke();
      // roof / cabin (darker)
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.beginPath(); ctx.roundRect(x + 4, y + 33, w - 8, 18, 6); ctx.fill();
      // rear window
      ctx.fillStyle = "#1e293b";
      ctx.beginPath(); ctx.roundRect(x + 6, y + 54, w - 12, 10, 5); ctx.fill();
      // headlights (front)
      ctx.fillStyle = "#fef9c3";
      ctx.beginPath(); ctx.roundRect(x + 4, y + 3, 9, 4, 2); ctx.fill();
      ctx.beginPath(); ctx.roundRect(x + w - 13, y + 3, 9, 4, 2); ctx.fill();
      // taillights (rear)
      ctx.fillStyle = "#ef4444";
      ctx.beginPath(); ctx.roundRect(x + 4, y + h - 7, 9, 4, 2); ctx.fill();
      ctx.beginPath(); ctx.roundRect(x + w - 13, y + h - 7, 9, 4, 2); ctx.fill();
      // side mirrors
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.roundRect(x - 5, y + 26, 5, 3, 1.5); ctx.fill();
      ctx.beginPath(); ctx.roundRect(x + w, y + 26, 5, 3, 1.5); ctx.fill();
    },
    []
  );

  const draw = useCallback(() => {
    const c = cvs.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const g = G.current;

    // grass
    const grass = ctx.createLinearGradient(0, 0, 0, CH);
    grass.addColorStop(0, "#14532d");
    grass.addColorStop(1, "#0f3d22");
    ctx.fillStyle = grass;
    ctx.fillRect(0, 0, CW, CH);

    // road
    ctx.fillStyle = "#2a2f3a";
    ctx.fillRect(ROAD_L - 8, 0, ROAD_R - ROAD_L + 16, CH);
    const rd = ctx.createLinearGradient(ROAD_L, 0, ROAD_R, 0);
    rd.addColorStop(0, "#232833");
    rd.addColorStop(0.5, "#333a47");
    rd.addColorStop(1, "#232833");
    ctx.fillStyle = rd;
    ctx.fillRect(ROAD_L, 0, ROAD_R - ROAD_L, CH);

    // road edge lines (scrolling)
    const seg = 36, gap = 24;
    const off = g.scroll % (seg + gap);
    ctx.fillStyle = "#facc15";
    for (let y = -seg - gap + off; y < CH + seg; y += seg + gap) {
      ctx.fillRect(ROAD_L - 4, y, 4, seg);
      ctx.fillRect(ROAD_R, y, 4, seg);
    }

    // lane dashes (scrolling)
    ctx.fillStyle = "#f1f5f9aa";
    for (let l = 1; l < LANES; l++) {
      const lx = ROAD_L + LANE_W * l;
      for (let y = -seg - gap + off; y < CH + seg; y += seg + gap) {
        ctx.fillRect(lx - 2, y, 4, seg);
      }
    }

    // enemy cars
    g.enemies.forEach((e) => drawCar(ctx, e.x, e.y, e.w, e.h, e.color));

    // player car
    drawCar(ctx, g.px - CAR_W / 2, PY, CAR_W, CAR_H, "#f43f5e");

    // score pill
    ctx.fillStyle = "rgba(10,12,18,0.72)";
    ctx.beginPath();
    ctx.roundRect(CW / 2 - 64, 10, 128, 32, 16);
    ctx.fill();
    ctx.strokeStyle = t.accent + "55";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(CW / 2 - 64, 10, 128, 32, 16);
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px Inter";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Score: " + g.score, CW / 2, 27);

    if (!g.started) {
      ctx.fillStyle = "rgba(8,10,16,0.78)";
      ctx.fillRect(0, 0, CW, CH);
      ctx.fillStyle = "#151a24";
      ctx.beginPath();
      ctx.roundRect(CW / 2 - 120, CH / 2 - 74, 240, 148, 16);
      ctx.fill();
      ctx.strokeStyle = t.accent + "66";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(CW / 2 - 120, CH / 2 - 74, 240, 148, 16);
      ctx.stroke();
      ctx.fillStyle = t.accent;
      ctx.font = "bold 24px Inter";
      ctx.fillText("CAR RACE", CW / 2, CH / 2 - 30);
      ctx.fillStyle = "#9ca3af";
      ctx.font = "13px Inter";
      ctx.fillText("Dodge the traffic cars!", CW / 2, CH / 2 - 4);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px Inter";
      ctx.fillText("← → / A D to steer", CW / 2, CH / 2 + 24);
      ctx.fillText("SPACE / tap to start", CW / 2, CH / 2 + 46);
    } else if (!g.alive) {
      ctx.fillStyle = "rgba(8,10,16,0.78)";
      ctx.fillRect(0, 0, CW, CH);
      ctx.fillStyle = "#151a24";
      ctx.beginPath();
      ctx.roundRect(CW / 2 - 120, CH / 2 - 74, 240, 148, 16);
      ctx.fill();
      ctx.strokeStyle = t.accent + "66";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(CW / 2 - 120, CH / 2 - 74, 240, 148, 16);
      ctx.stroke();
      ctx.fillStyle = t.accent;
      ctx.font = "bold 24px Inter";
      ctx.fillText("Game Over", CW / 2, CH / 2 - 30);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px Inter";
      ctx.fillText("Score: " + g.score, CW / 2, CH / 2 - 2);
      ctx.fillStyle = "#9ca3af";
      ctx.font = "13px Inter";
      ctx.fillText("Best: " + Math.max(best, g.score), CW / 2, CH / 2 + 22);
      ctx.fillStyle = t.accent;
      ctx.font = "bold 14px Inter";
      ctx.fillText("SPACE / tap to restart", CW / 2, CH / 2 + 48);
    }
  }, [t, best, drawCar]);

  const loop = useCallback(
    (ts: number) => {
      const g = G.current;
      if (g.started && g.alive) {
        // steer
        if (keys.current.left) g.px -= 6.5;
        if (keys.current.right) g.px += 6.5;
        g.px = Math.max(ROAD_L + CAR_W / 2, Math.min(ROAD_R - CAR_W / 2, g.px));
        // scroll & difficulty
        g.scroll += 4 + g.score * 0.03;
        g.dist += 1 + g.score * 0.015;
        g.score = Math.floor(g.dist / 7);
        // spawn enemies
        g.spawnT--;
        if (g.spawnT <= 0) {
          const lane = Math.floor(Math.random() * LANES);
          const cx = ROAD_L + LANE_W * lane + LANE_W / 2;
          g.enemies.push({
            x: cx - CAR_W / 2,
            y: -CAR_H - 14,
            w: CAR_W,
            h: CAR_H,
            color: ENEMY_COLORS[Math.floor(Math.random() * ENEMY_COLORS.length)],
            speed: 2.8 + Math.random() * 1.6 + g.score * 0.012,
          });
          g.spawnT = Math.max(22, 62 - g.score * 0.4);
        }
        // move enemies
        g.enemies.forEach((e) => (e.y += e.speed));
        g.enemies = g.enemies.filter((e) => e.y < CH + 60);
        // collision (slightly forgiving hitbox)
        const pcx = g.px, pcy = PY + CAR_H / 2;
        for (const e of g.enemies) {
          const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2;
          if (Math.abs(pcx - ecx) < (CAR_W + e.w - 10) / 2 && Math.abs(pcy - ecy) < (CAR_H + e.h - 12) / 2) {
            g.alive = false;
            setBest((b) => Math.max(b, g.score));
            if (g.score > 0 && onCoinEarned) onCoinEarned(Math.max(1, Math.round(g.score / 10)));
            break;
          }
        }
        setScore(g.score);
      }
      draw();
      raf.current = requestAnimationFrame(loop);
    },
    [draw, onCoinEarned]
  );

  const reset = useCallback(() => {
    G.current = {
      px: (ROAD_L + ROAD_R) / 2,
      dist: 0,
      score: 0,
      scroll: 0,
      spawnT: 40,
      enemies: [],
      alive: true,
      started: true,
    };
    setScore(0);
  }, []);

  const start = useCallback(() => {
    const g = G.current;
    if (!g.alive) reset();
    else g.started = true;
  }, [reset]);

  useEffect(() => {
    draw();
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [loop, draw]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space") { e.preventDefault(); start(); return; }
      if (e.code === "ArrowLeft" || e.code === "KeyA") { keys.current.left = true; e.preventDefault(); }
      else if (e.code === "ArrowRight" || e.code === "KeyD") { keys.current.right = true; e.preventDefault(); }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") keys.current.left = false;
      else if (e.code === "ArrowRight" || e.code === "KeyD") keys.current.right = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [start]);

  // touch / click steering
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * CW;
      const g = G.current;
      if (!g.started || !g.alive) { start(); return; }
      if (x < CW / 2) keys.current.left = true;
      else keys.current.right = true;
    },
    [start]
  );
  const onPointerUp = useCallback(() => {
    keys.current.left = false;
    keys.current.right = false;
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full max-w-full" style={{ maxWidth: CW }}>
        <span className="text-gray-400 text-sm flex items-center gap-1.5">
          <FaCar size={14} style={{ color: t.accent }} /> Car Race
        </span>
        <span className="font-bold" style={{ color: t.accent }}>
          Best: {best}
        </span>
      </div>
      <canvas
        ref={cvs}
        width={CW}
        height={CH}
        className="rounded-xl cursor-pointer max-w-full h-auto touch-none select-none"
        style={{ border: `1px solid ${t.accent}33` }}
        onClick={start}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />
      <p className="text-xs text-gray-600">← → / A D steer · SPACE / tap to start</p>
    </div>
  );
}
