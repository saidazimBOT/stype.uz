"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { FaCar } from "react-icons/fa6";
import type { ThemeColors } from "../../types";

interface CarGameProps {
  t: ThemeColors;
  onCoinEarned?: (amount: number) => void;
}

const CW = 360, CH = 540;

// 3D perspective constants — vanishing point at top center
const VPX = CW / 2, VPY = 60;
const ROAD_BOTTOM_L = 30, ROAD_BOTTOM_R = CW - 30;
const ROAD_W = ROAD_BOTTOM_R - ROAD_BOTTOM_L;
const LANES = 3;

interface Enemy {
  x: number;     // 0-1 lane position
  y: number;     // 0-1 distance from VP (0=far, 1=near bottom)
  color: string;
  speed: number;
}

interface Tree3D {
  side: number;   // -1 left, 1 right
  y: number;      // 0-1
  size: number;
}

interface GameState {
  playerLane: number;  // 0-1 horizontal (0=left, 1=right)
  dist: number;
  score: number;
  scroll: number;
  spawnT: number;
  enemies: Enemy[];
  trees: Tree3D[];
  alive: boolean;
  started: boolean;
  shake: number;
  speedLines: { x: number; y: number; len: number; }[];
}

const ENEMY_COLORS = ["#3b82f6", "#f59e0b", "#a855f7", "#22c55e", "#06b6d4", "#f43f5e"];

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

// Convert a 0-1 distance to screen Y
function distToScreen(d: number) {
  return VPY + d * d * (CH - VPY - 20);
}

// Road X at a given distance d (0-1)
function roadXAt(d: number, side: "l" | "r") {
  const topX = side === "l" ? VPX - 2 : VPX + 2;
  const botX = side === "l" ? ROAD_BOTTOM_L : ROAD_BOTTOM_R;
  return lerp(topX, botX, d * d);
}

// Lane X at a given distance
function laneXAt(d: number, lane: number) {
  const left = roadXAt(d, "l");
  const right = roadXAt(d, "r");
  return left + (right - left) * (lane + 0.5) / LANES;
}

export default function CarGame({ t, onCoinEarned }: CarGameProps) {
  const cvs = useRef<HTMLCanvasElement>(null);
  const G = useRef<GameState>({
    playerLane: 0.5,
    dist: 0,
    score: 0,
    scroll: 0,
    spawnT: 40,
    enemies: [],
    trees: Array.from({ length: 20 }, (_, i) => ({
      side: i % 2 === 0 ? -1 : 1,
      y: (i / 20) + Math.random() * 0.04,
      size: 0.5 + Math.random() * 0.6,
    })),
    alive: true,
    started: false,
    shake: 0,
    speedLines: [],
  });
  const keys = useRef({ left: false, right: false });
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const raf = useRef<number | null>(null);

  const drawTree = useCallback((ctx: CanvasRenderingContext2D, sx: number, sy: number, s: number) => {
    const h = 30 * s;
    // trunk
    ctx.fillStyle = "#6b4226";
    ctx.beginPath();
    ctx.roundRect(sx - 2 * s, sy - h * 0.5, 4 * s, h * 0.55, 2);
    ctx.fill();
    // foliage (3 layers for 3D)
    const foliageColors = ["#166534", "#15803d", "#22c55e"];
    for (let i = 0; i < 3; i++) {
      const r = (12 - i * 2) * s;
      const fy = sy - h * 0.5 - i * h * 0.18;
      const fg = ctx.createRadialGradient(sx - 1, fy - 2, 1, sx, fy, r);
      fg.addColorStop(0, foliageColors[i]);
      fg.addColorStop(1, foliageColors[Math.max(0, i - 1)]);
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.arc(sx, fy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  const drawCar3D = useCallback((ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, color: string, isPlayer: boolean) => {
    // Shadow on road
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(cx, cy + h / 2 + 3, w * 0.55, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Car body (3D box)
    const bodyTop = cy - h / 2;
    // Left side
    ctx.fillStyle = `color-mix(in srgb, ${color} 70%, #000)`;
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, bodyTop + h * 0.3);
    ctx.lineTo(cx - w / 2 - 3, bodyTop + h * 0.35);
    ctx.lineTo(cx - w / 2 - 3, cy + h * 0.35);
    ctx.lineTo(cx - w / 2, cy + h * 0.3);
    ctx.closePath();
    ctx.fill();
    // Right side
    ctx.fillStyle = `color-mix(in srgb, ${color} 60%, #000)`;
    ctx.beginPath();
    ctx.moveTo(cx + w / 2, bodyTop + h * 0.3);
    ctx.lineTo(cx + w / 2 + 3, bodyTop + h * 0.35);
    ctx.lineTo(cx + w / 2 + 3, cy + h * 0.35);
    ctx.lineTo(cx + w / 2, cy + h * 0.3);
    ctx.closePath();
    ctx.fill();

    // Top face (main body)
    const bodyGrad = ctx.createLinearGradient(cx - w / 2, bodyTop, cx + w / 2, cy + h / 2);
    bodyGrad.addColorStop(0, `color-mix(in srgb, ${color} 100%, #fff 20%)`);
    bodyGrad.addColorStop(0.5, color);
    bodyGrad.addColorStop(1, `color-mix(in srgb, ${color} 80%, #000 20%)`);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(cx - w / 2, bodyTop, w, h * 0.55, 5);
    ctx.fill();

    // Roof/cabin
    ctx.fillStyle = `rgba(0,0,0,0.3)`;
    ctx.beginPath();
    ctx.roundRect(cx - w * 0.32, bodyTop + h * 0.08, w * 0.64, h * 0.2, 4);
    ctx.fill();
    // Windshield
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.roundRect(cx - w * 0.28, bodyTop + h * 0.1, w * 0.56, h * 0.14, 3);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Hood highlight
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.3, bodyTop + 3);
    ctx.lineTo(cx + w * 0.3, bodyTop + 3);
    ctx.stroke();

    // Headlights
    if (isPlayer) {
      // Headlight beams
      const beamG = ctx.createRadialGradient(cx, bodyTop, 1, cx, bodyTop - 30, 40);
      beamG.addColorStop(0, "rgba(255,250,200,0.3)");
      beamG.addColorStop(1, "rgba(255,250,200,0)");
      ctx.fillStyle = beamG;
      ctx.beginPath();
      ctx.ellipse(cx, bodyTop - 15, 20, 30, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#fef9c3";
    ctx.beginPath(); ctx.roundRect(cx - w * 0.35, bodyTop + 1, w * 0.2, 3, 1.5); ctx.fill();
    ctx.beginPath(); ctx.roundRect(cx + w * 0.15, bodyTop + 1, w * 0.2, 3, 1.5); ctx.fill();

    // Taillights
    ctx.fillStyle = "#ef4444";
    ctx.beginPath(); ctx.roundRect(cx - w * 0.35, cy + h * 0.08, w * 0.18, 3, 1.5); ctx.fill();
    ctx.beginPath(); ctx.roundRect(cx + w * 0.17, cy + h * 0.08, w * 0.18, 3, 1.5); ctx.fill();

    // Wheels
    ctx.fillStyle = "#111";
    const wheelW = w * 0.18, wheelH = h * 0.12;
    ctx.beginPath(); ctx.roundRect(cx - w / 2 - 3, bodyTop + h * 0.35, wheelW, wheelH, 3); ctx.fill();
    ctx.beginPath(); ctx.roundRect(cx + w / 2 - wheelW + 3, bodyTop + h * 0.35, wheelW, wheelH, 3); ctx.fill();
    ctx.beginPath(); ctx.roundRect(cx - w / 2 - 3, cy - wheelH * 0.5, wheelW, wheelH, 3); ctx.fill();
    ctx.beginPath(); ctx.roundRect(cx + w / 2 - wheelW + 3, cy - wheelH * 0.5, wheelW, wheelH, 3); ctx.fill();
  }, []);

  const draw = useCallback(() => {
    const c = cvs.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const g = G.current;

    // Shake offset
    const shakeX = g.shake > 0 ? (Math.random() - 0.5) * g.shake * 2 : 0;
    const shakeY = g.shake > 0 ? (Math.random() - 0.5) * g.shake * 2 : 0;
    if (g.shake > 0) g.shake *= 0.9;

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, VPY + 60);
    sky.addColorStop(0, "#0c1428");
    sky.addColorStop(0.6, "#1a1040");
    sky.addColorStop(1, "#2d1b69");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, CW, CH);

    // Stars
    for (let i = 0; i < 35; i++) {
      ctx.globalAlpha = 0.05 + (i % 4) * 0.03;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc((i * 83) % CW, (i * 67) % VPY, 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Moon
    const moonX = CW - 55, moonY = 35;
    const moonG = ctx.createRadialGradient(moonX, moonY, 4, moonX, moonY, 30);
    moonG.addColorStop(0, "rgba(220,220,255,0.9)");
    moonG.addColorStop(0.4, "rgba(180,180,240,0.3)");
    moonG.addColorStop(1, "rgba(180,180,240,0)");
    ctx.fillStyle = moonG;
    ctx.beginPath(); ctx.arc(moonX, moonY, 30, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ddd8f0";
    ctx.beginPath(); ctx.arc(moonX, moonY, 10, 0, Math.PI * 2); ctx.fill();

    // Horizon glow
    const hg = ctx.createRadialGradient(VPX, VPY, 10, VPX, VPY, 200);
    hg.addColorStop(0, "rgba(100,60,180,0.2)");
    hg.addColorStop(1, "rgba(100,60,180,0)");
    ctx.fillStyle = hg;
    ctx.beginPath(); ctx.arc(VPX, VPY, 200, 0, Math.PI * 2); ctx.fill();

    // Ground (below road)
    const groundG = ctx.createLinearGradient(0, VPY, 0, CH);
    groundG.addColorStop(0, "#0f3d22");
    groundG.addColorStop(0.3, "#0c2e1a");
    groundG.addColorStop(1, "#081f12");
    ctx.fillStyle = groundG;
    ctx.fillRect(0, VPY, CW, CH - VPY);

    // Road — perspective trapezoid
    ctx.fillStyle = "#1a1e28";
    ctx.beginPath();
    ctx.moveTo(VPX - 4, VPY);
    ctx.lineTo(ROAD_BOTTOM_L, CH);
    ctx.lineTo(ROAD_BOTTOM_R, CH);
    ctx.lineTo(VPX + 4, VPY);
    ctx.closePath();
    ctx.fill();
    // Road surface gradient
    const roadG = ctx.createLinearGradient(0, VPY, 0, CH);
    roadG.addColorStop(0, "#2a2f3a");
    roadG.addColorStop(0.5, "#232833");
    roadG.addColorStop(1, "#1e222c");
    ctx.fillStyle = roadG;
    ctx.beginPath();
    ctx.moveTo(VPX - 4, VPY);
    ctx.lineTo(ROAD_BOTTOM_L, CH);
    ctx.lineTo(ROAD_BOTTOM_R, CH);
    ctx.lineTo(VPX + 4, VPY);
    ctx.closePath();
    ctx.fill();

    // Road edge lines
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 2;
    // Left edge
    ctx.beginPath();
    ctx.moveTo(VPX - 4, VPY);
    ctx.lineTo(ROAD_BOTTOM_L, CH);
    ctx.stroke();
    // Right edge
    ctx.beginPath();
    ctx.moveTo(VPX + 4, VPY);
    ctx.lineTo(ROAD_BOTTOM_R, CH);
    ctx.stroke();

    // Lane dashes (scrolling, perspective)
    const seg = 0.06, gap = 0.04;
    const off = (g.scroll * 0.004) % (seg + gap);
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    for (let l = 1; l < LANES; l++) {
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let d = off; d < 1; d += seg + gap) {
        const d2 = d + seg;
        const x1 = laneXAt(d, l);
        const y1 = distToScreen(d);
        const x2 = laneXAt(Math.min(d2, 1), l);
        const y2 = distToScreen(Math.min(d2, 1));
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      ctx.stroke();
    }

    // 3D speed lines on road
    g.speedLines.forEach((sl) => {
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sl.x, sl.y);
      ctx.lineTo(sl.x, sl.y + sl.len);
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // Sort all objects by distance (far first, then near) for correct overlap
    const drawables: { type: "tree" | "enemy"; d: number; data: any }[] = [];

    // Trees
    g.trees.forEach((tr) => {
      drawables.push({ type: "tree", d: tr.y, data: tr });
    });
    // Enemies
    g.enemies.forEach((e) => {
      drawables.push({ type: "enemy", d: e.y, data: e });
    });
    // Sort by distance (far=0 first, near=1 last)
    drawables.sort((a, b) => a.d - b.d);

    drawables.forEach((obj) => {
      if (obj.type === "tree") {
        const tr: Tree3D = obj.data;
        const d = tr.y;
        if (d < 0.02 || d > 0.98) return;
        const screenY = distToScreen(d);
        const roadL = roadXAt(d, "l");
        const roadR = roadXAt(d, "r");
        const treeX = tr.side === -1 ? roadL - 18 * tr.size : roadR + 18 * tr.size;
        drawTree(ctx, treeX, screenY, tr.size * (0.3 + d * 0.7));
      } else {
        const e: Enemy = obj.data;
        const d = e.y;
        if (d < 0.03 || d > 0.97) return;
        const screenY = distToScreen(d);
        const ex = laneXAt(d, e.x);
        const scale = 0.3 + d * 0.7;
        const carW = 38 * scale;
        const carH = 66 * scale;
        drawCar3D(ctx, ex, screenY, carW, carH, e.color, false);
      }
    });

    // Player car
    {
      const d = 0.82;
      const screenY = distToScreen(d);
      const px = lerp(ROAD_BOTTOM_L + 20, ROAD_BOTTOM_R - 20, g.playerLane);
      const scale = 0.65 + d * 0.35;
      const carW = 42 * scale;
      const carH = 72 * scale;
      drawCar3D(ctx, px, screenY, carW, carH, "#f43f5e", true);
    }

    // Score HUD
    ctx.fillStyle = "rgba(10,12,18,0.75)";
    ctx.beginPath();
    ctx.roundRect(CW / 2 - 64, 8, 128, 32, 14);
    ctx.fill();
    ctx.strokeStyle = t.accent + "44";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(CW / 2 - 64, 8, 128, 32, 14);
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 15px Inter";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Score: " + g.score, CW / 2, 25);

    ctx.restore(); // end shake

    // Overlays (outside shake)
    if (!g.started) {
      ctx.fillStyle = "rgba(6,10,24,0.85)";
      ctx.fillRect(0, 0, CW, CH);
      ctx.fillStyle = "#111827";
      ctx.beginPath();
      ctx.roundRect(CW / 2 - 130, CH / 2 - 74, 260, 148, 18);
      ctx.fill();
      ctx.strokeStyle = t.accent + "55";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(CW / 2 - 130, CH / 2 - 74, 260, 148, 18);
      ctx.stroke();
      ctx.fillStyle = t.accent;
      ctx.font = "bold 26px Inter";
      ctx.textAlign = "center";
      ctx.fillText("CAR RACE 3D", CW / 2, CH / 2 - 30);
      ctx.fillStyle = "#9ca3af";
      ctx.font = "13px Inter";
      ctx.fillText("Dodge the traffic cars!", CW / 2, CH / 2 - 4);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px Inter";
      ctx.fillText("← → / A D to steer", CW / 2, CH / 2 + 24);
      ctx.fillText("SPACE / tap to start", CW / 2, CH / 2 + 46);
    } else if (!g.alive) {
      ctx.fillStyle = "rgba(6,10,24,0.85)";
      ctx.fillRect(0, 0, CW, CH);
      ctx.fillStyle = "#111827";
      ctx.beginPath();
      ctx.roundRect(CW / 2 - 130, CH / 2 - 74, 260, 148, 18);
      ctx.fill();
      ctx.strokeStyle = t.accent + "55";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(CW / 2 - 130, CH / 2 - 74, 260, 148, 18);
      ctx.stroke();
      ctx.fillStyle = t.accent;
      ctx.font = "bold 26px Inter";
      ctx.textAlign = "center";
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
  }, [t, best, drawTree, drawCar3D]);

  const loop = useCallback((ts: number) => {
    const g = G.current;
    if (g.started && g.alive) {
      // Steer
      if (keys.current.left) g.playerLane -= 0.025;
      if (keys.current.right) g.playerLane += 0.025;
      g.playerLane = Math.max(0.05, Math.min(0.95, g.playerLane));

      // Scroll & difficulty
      g.scroll += 4 + g.score * 0.035;
      g.dist += 1 + g.score * 0.015;
      g.score = Math.floor(g.dist / 7);

      // Spawn enemies
      g.spawnT--;
      if (g.spawnT <= 0) {
        const lane = Math.floor(Math.random() * LANES);
        g.enemies.push({
          x: (lane + 0.5) / LANES,
          y: -0.05,
          color: ENEMY_COLORS[Math.floor(Math.random() * ENEMY_COLORS.length)],
          speed: 0.006 + Math.random() * 0.004 + g.score * 0.00015,
        });
        g.spawnT = Math.max(22, 55 - g.score * 0.35);
      }

      // Move enemies
      g.enemies.forEach((e) => (e.y += e.speed));
      g.enemies = g.enemies.filter((e) => e.y < 1.1);

      // Move trees
      g.trees.forEach((tr) => {
        tr.y += 0.005 + g.score * 0.0001;
        if (tr.y > 1.05) {
          tr.y = -0.05;
          tr.side = Math.random() > 0.5 ? -1 : 1;
          tr.size = 0.5 + Math.random() * 0.6;
        }
      });

      // Speed lines
      if (Math.random() < 0.3) {
        const sx = Math.random() * CW;
        g.speedLines.push({ x: sx, y: VPY + 20, len: 8 + Math.random() * 15 });
      }
      g.speedLines.forEach((sl) => { sl.y += 6; sl.len *= 0.97; });
      g.speedLines = g.speedLines.filter((sl) => sl.y < CH && sl.len > 1);

      // Collision (player at d=0.82)
      const pD = 0.82;
      const pX = lerp(ROAD_BOTTOM_L + 20, ROAD_BOTTOM_R - 20, g.playerLane);
      for (const e of g.enemies) {
        if (e.y > pD - 0.06 && e.y < pD + 0.06) {
          const eX = laneXAt(e.y, e.x);
          if (Math.abs(pX - eX) < 35) {
            g.alive = false;
            g.shake = 12;
            setBest((b) => Math.max(b, g.score));
            if (g.score > 0 && onCoinEarned) onCoinEarned(Math.max(1, Math.round(g.score / 10)));
            break;
          }
        }
      }
      setScore(g.score);
    }
    draw();
    raf.current = requestAnimationFrame(loop);
  }, [draw, onCoinEarned]);

  const reset = useCallback(() => {
    G.current = {
      playerLane: 0.5,
      dist: 0, score: 0, scroll: 0, spawnT: 40,
      enemies: [],
      trees: Array.from({ length: 20 }, (_, i) => ({
        side: i % 2 === 0 ? -1 : 1,
        y: (i / 20) + Math.random() * 0.04,
        size: 0.5 + Math.random() * 0.6,
      })),
      alive: true, started: true, shake: 0, speedLines: [],
    };
    setScore(0);
  }, []);

  const start = useCallback(() => {
    const g = G.current;
    if (!g.alive) reset();
    else g.started = true;
  }, [reset]);

  useEffect(() => {
    raf.current = requestAnimationFrame(loop);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [loop]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space") { e.preventDefault(); start(); return; }
      if (e.code === "ArrowLeft" || e.code === "KeyA") { keys.current.left = true; e.preventDefault(); }
      if (e.code === "ArrowRight" || e.code === "KeyD") { keys.current.right = true; e.preventDefault(); }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") keys.current.left = false;
      if (e.code === "ArrowRight" || e.code === "KeyD") keys.current.right = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [start]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CW;
    const g = G.current;
    if (!g.started || !g.alive) { start(); return; }
    if (x < CW / 2) keys.current.left = true;
    else keys.current.right = true;
  }, [start]);
  const onPointerUp = useCallback(() => { keys.current.left = false; keys.current.right = false; }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full max-w-full" style={{ maxWidth: CW }}>
        <span className="text-gray-400 text-sm flex items-center gap-1.5">
          <FaCar size={14} style={{ color: t.accent }} /> Car Race 3D
        </span>
        <span className="font-bold" style={{ color: t.accent }}>Best: {best}</span>
      </div>
      <canvas
        ref={cvs} width={CW} height={CH}
        className="rounded-xl cursor-pointer max-w-full h-auto touch-none select-none"
        style={{ border: `1px solid ${t.accent}33`, boxShadow: `0 0 32px ${t.accent}22` }}
        onClick={start} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}
      />
      <p className="text-xs text-gray-600">← → / A D steer · SPACE / tap to start</p>
    </div>
  );
}
