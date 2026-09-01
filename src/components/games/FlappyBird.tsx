"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { FaDove } from "react-icons/fa6";
import type { ThemeColors } from "../../types";

interface FlappyBirdProps {
  t: ThemeColors;
  onCoinEarned?: (amount: number) => void;
}

const FW = 360, FH = 480, PGAP = 140, PW = 54;

interface Pipe {
  x: number;
  top: number;
  passed: boolean;
  glow: number;
}

interface Cloud {
  x: number;
  y: number;
  s: number;
  v: number;
}

interface Mountain {
  x: number;
  h: number;
  color: string;
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

function hex2rgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

export default function FlappyBird({ t, onCoinEarned }: FlappyBirdProps) {
  const cvs = useRef<HTMLCanvasElement>(null);
  const G = useRef<GameState>({ y: FH / 2, vy: 0, pipes: [], score: 0, alive: false, started: false, frame: 0 });
  const clouds = useRef<Cloud[]>(
    Array.from({ length: 7 }, (_, i) => ({
      x: (i / 7) * FW + Math.random() * 40,
      y: 20 + Math.random() * 140,
      s: 0.5 + Math.random() * 0.8,
      v: 0.15 + Math.random() * 0.3,
    })),
  );
  const mountains = useRef<Mountain[]>(
    Array.from({ length: 6 }, (_, i) => ({
      x: (i / 6) * FW * 1.3 - 30,
      h: 50 + Math.random() * 80,
      color: `hsl(${220 + Math.random() * 30}, ${20 + Math.random() * 10}%, ${12 + Math.random() * 8}%)`,
    })),
  );
  const [score, setScore] = useState(0);
  const raf = useRef<number | null>(null);
  const loopRef = useRef<() => void>(() => {});

  const flap = useCallback(() => {
    const g = G.current;
    if (!g.started || !g.alive) {
      G.current = { y: FH / 2, vy: 0, pipes: [], score: 0, alive: true, started: true, frame: 0 };
      setScore(0);
      return;
    }
    g.vy = -9.5;
  }, []);

  const drawPipe3D = useCallback((ctx: CanvasRenderingContext2D, px: number, top: number, isBottom: boolean) => {
    const depth = 6;
    const c = hex2rgb("#22c55e");
    const bodyTop = isBottom ? top + PGAP : 0;
    const bodyH = isBottom ? FH - top - PGAP - 50 : top;

    // Pipe body — left face (darker)
    ctx.fillStyle = `rgb(${Math.max(0, c.r - 50)},${Math.max(0, c.g - 50)},${Math.max(0, c.b - 50)})`;
    ctx.beginPath();
    ctx.moveTo(px + PW, bodyTop);
    ctx.lineTo(px + PW + depth, bodyTop - depth);
    ctx.lineTo(px + PW + depth, bodyTop + bodyH - depth);
    ctx.lineTo(px + PW, bodyTop + bodyH);
    ctx.closePath();
    ctx.fill();

    // Pipe body — main face (gradient)
    const pg = ctx.createLinearGradient(px, 0, px + PW, 0);
    pg.addColorStop(0, `rgb(${Math.max(0, c.r - 30)},${Math.max(0, c.g - 30)},${Math.max(0, c.b - 30)})`);
    pg.addColorStop(0.3, "#22c55e");
    pg.addColorStop(0.5, "#4ade80");
    pg.addColorStop(0.7, "#22c55e");
    pg.addColorStop(1, `rgb(${Math.max(0, c.r - 40)},${Math.max(0, c.g - 40)},${Math.max(0, c.b - 40)})`);
    ctx.fillStyle = pg;
    ctx.fillRect(px, bodyTop, PW, bodyH);

    // Highlight stripe
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(px + PW * 0.25, bodyTop, PW * 0.12, bodyH);
    // Dark stripe
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(px + PW * 0.7, bodyTop, PW * 0.08, bodyH);

    // 3D cap
    const capW = PW + 14;
    const capH = 18;
    const capY = isBottom ? top + PGAP : top - capH;
    // Cap top face
    ctx.fillStyle = "#4ade80";
    ctx.beginPath();
    ctx.roundRect(px - 7, capY, capW, capH, 5);
    ctx.fill();
    // Cap right face
    ctx.fillStyle = `rgb(${Math.max(0, c.r - 55)},${Math.max(0, c.g - 55)},${Math.max(0, c.b - 55)})`;
    ctx.beginPath();
    ctx.moveTo(px + capW - 7, capY);
    ctx.lineTo(px + capW - 7 + depth, capY - depth);
    ctx.lineTo(px + capW - 7 + depth, capY + capH - depth);
    ctx.lineTo(px + capW - 7, capY + capH);
    ctx.closePath();
    ctx.fill();
    // Cap bottom face
    ctx.fillStyle = `rgb(${Math.max(0, c.r - 60)},${Math.max(0, c.g - 60)},${Math.max(0, c.b - 60)})`;
    ctx.beginPath();
    ctx.moveTo(px - 7, capY + capH);
    ctx.lineTo(px - 7 + depth, capY + capH - depth);
    ctx.lineTo(px + capW - 7 + depth, capY + capH - depth);
    ctx.lineTo(px + capW - 7, capY + capH);
    ctx.closePath();
    ctx.fill();
    // Cap highlight
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px - 3, capY + 3);
    ctx.lineTo(px + capW - 11, capY + 3);
    ctx.stroke();
  }, []);

  const drawBird3D = useCallback((ctx: CanvasRenderingContext2D, bx: number, by: number, vy: number, frame: number, started: boolean) => {
    const rot = Math.min(Math.max(vy * 0.055, -0.5), 1.0) + (started ? 0 : Math.sin(frame * 0.1) * 0.07);

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(rot);

    // Shadow on ground (subtle)
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(2, 16, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Wing (flapping, with depth)
    const wingA = started ? Math.sin(frame * 0.55) * 0.9 : Math.sin(frame * 0.12) * 0.5;
    ctx.save();
    ctx.translate(-4, -2);
    ctx.rotate(wingA);
    // Wing shadow
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.beginPath();
    ctx.ellipse(1, 2, 14, 7, -0.4, 0, Math.PI * 2);
    ctx.fill();
    // Wing body
    const wg = ctx.createLinearGradient(-5, -5, 8, 5);
    wg.addColorStop(0, "#fbbf24");
    wg.addColorStop(1, "#f59e0b");
    ctx.fillStyle = wg;
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 6, -0.4, 0, Math.PI * 2);
    ctx.fill();
    // Wing highlight
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath();
    ctx.ellipse(-2, -2, 8, 3, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Tail feathers (3D)
    ctx.fillStyle = "#d97706";
    ctx.beginPath();
    ctx.moveTo(-14, -3);
    ctx.lineTo(-22, -8);
    ctx.lineTo(-19, 0);
    ctx.lineTo(-22, 7);
    ctx.lineTo(-14, 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#b45309";
    ctx.beginPath();
    ctx.moveTo(-13, -1);
    ctx.lineTo(-19, -5);
    ctx.lineTo(-18, 1);
    ctx.closePath();
    ctx.fill();

    // Body (3D sphere)
    const bg = ctx.createRadialGradient(-3, -3, 1, 0, 0, 16);
    bg.addColorStop(0, "#fef9c3");
    bg.addColorStop(0.4, "#facc15");
    bg.addColorStop(0.8, "#f59e0b");
    bg.addColorStop(1, "#b45309");
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    // Belly highlight
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.ellipse(-2, 2, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye (3D with white, iris, pupil, reflection)
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(7, -4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 0.5;
    ctx.stroke();
    // Iris
    const ig = ctx.createRadialGradient(8, -4.5, 0.5, 8, -4.5, 3);
    ig.addColorStop(0, "#111");
    ig.addColorStop(1, "#333");
    ctx.fillStyle = ig;
    ctx.beginPath();
    ctx.arc(8.5, -4.5, 2.8, 0, Math.PI * 2);
    ctx.fill();
    // Pupil
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(9, -5, 1.5, 0, Math.PI * 2);
    ctx.fill();
    // Reflection
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.arc(7.5, -5.5, 1, 0, Math.PI * 2);
    ctx.fill();

    // Beak (3D)
    const beakG = ctx.createLinearGradient(14, -4, 24, 0);
    beakG.addColorStop(0, "#fb923c");
    beakG.addColorStop(0.5, "#f97316");
    beakG.addColorStop(1, "#ea580c");
    ctx.fillStyle = beakG;
    ctx.beginPath();
    ctx.moveTo(14, -1);
    ctx.lineTo(26, -4);
    ctx.lineTo(26, 2);
    ctx.closePath();
    ctx.fill();
    // Lower beak
    ctx.fillStyle = "#ea580c";
    ctx.beginPath();
    ctx.moveTo(14, 2);
    ctx.lineTo(24, 0);
    ctx.lineTo(24, 4);
    ctx.closePath();
    ctx.fill();
    // Beak highlight
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath();
    ctx.moveTo(15, -1);
    ctx.lineTo(22, -3);
    ctx.lineTo(22, -1);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }, []);

  const draw = useCallback(() => {
    const c = cvs.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const g = G.current;

    // Sky gradient (richer)
    const sky = ctx.createLinearGradient(0, 0, 0, FH);
    sky.addColorStop(0, "#0b1a3a");
    sky.addColorStop(0.3, "#1e3a6e");
    sky.addColorStop(0.6, "#5ba3d9");
    sky.addColorStop(0.85, "#87ceeb");
    sky.addColorStop(1, "#c9ecf4");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, FW, FH);

    // Sun (3D glow)
    const sunX = FW - 55, sunY = 50;
    const sg3 = ctx.createRadialGradient(sunX, sunY, 6, sunX, sunY, 60);
    sg3.addColorStop(0, "rgba(255,240,180,0.95)");
    sg3.addColorStop(0.2, "rgba(255,220,100,0.4)");
    sg3.addColorStop(0.5, "rgba(255,200,60,0.1)");
    sg3.addColorStop(1, "rgba(255,200,60,0)");
    ctx.fillStyle = sg3;
    ctx.beginPath(); ctx.arc(sunX, sunY, 60, 0, Math.PI * 2); ctx.fill();
    // Sun core
    const sunCore = ctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, 18);
    sunCore.addColorStop(0, "#fffbe6");
    sunCore.addColorStop(0.6, "#ffe783");
    sunCore.addColorStop(1, "#fbbf24");
    ctx.fillStyle = sunCore;
    ctx.beginPath(); ctx.arc(sunX, sunY, 18, 0, Math.PI * 2); ctx.fill();

    // Mountains (parallax, 3D depth)
    mountains.current.forEach((m) => {
      const mGrad = ctx.createLinearGradient(m.x, FH - 86, m.x, FH - 86 - m.h);
      mGrad.addColorStop(0, m.color);
      mGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = mGrad;
      ctx.beginPath();
      ctx.moveTo(m.x, FH - 86);
      ctx.lineTo(m.x + m.h * 0.6, FH - 86 - m.h);
      ctx.lineTo(m.x + m.h * 1.2, FH - 86);
      ctx.closePath();
      ctx.fill();
      // Mountain highlight
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(m.x + m.h * 0.6, FH - 86 - m.h);
      ctx.lineTo(m.x + m.h * 1.2, FH - 86);
      ctx.stroke();
    });

    // Clouds (parallax)
    clouds.current.forEach((cl) => {
      // Cloud shadow
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(cl.x + 3, cl.y + 4, 28 * cl.s, 13 * cl.s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      // Cloud body (3D shading)
      const cg = ctx.createRadialGradient(cl.x - 5, cl.y - 3, 2, cl.x, cl.y, 28 * cl.s);
      cg.addColorStop(0, "rgba(255,255,255,0.95)");
      cg.addColorStop(0.5, "rgba(255,255,255,0.8)");
      cg.addColorStop(1, "rgba(255,255,255,0.6)");
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.ellipse(cl.x, cl.y, 28 * cl.s, 13 * cl.s, 0, 0, Math.PI * 2);
      ctx.ellipse(cl.x - 18 * cl.s, cl.y + 4 * cl.s, 18 * cl.s, 11 * cl.s, 0, 0, Math.PI * 2);
      ctx.ellipse(cl.x + 18 * cl.s, cl.y + 3 * cl.s, 16 * cl.s, 10 * cl.s, 0, 0, Math.PI * 2);
      ctx.fill();
      // Cloud highlight
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.beginPath();
      ctx.ellipse(cl.x - 3, cl.y - 5, 22 * cl.s, 6 * cl.s, -0.1, 0, Math.PI * 2);
      ctx.fill();
    });

    // Pipes (3D)
    g.pipes.forEach((p) => {
      drawPipe3D(ctx, p.x, p.top, false);
      drawPipe3D(ctx, p.x, p.top, true);
      // Pipe glow on score
      if (p.glow > 0) {
        ctx.globalAlpha = p.glow / 10;
        ctx.fillStyle = "#facc15";
        ctx.fillRect(p.x - 5, 0, PW + 10, FH);
        ctx.globalAlpha = 1;
        p.glow--;
      }
    });

    // 3D ground
    // Grass top
    const grassG = ctx.createLinearGradient(0, FH - 52, 0, FH - 40);
    grassG.addColorStop(0, "#4ade80");
    grassG.addColorStop(1, "#16a34a");
    ctx.fillStyle = grassG;
    ctx.fillRect(0, FH - 52, FW, 14);
    // Grass highlight
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(0, FH - 52, FW, 3);
    // Dirt
    const dirtG = ctx.createLinearGradient(0, FH - 38, 0, FH);
    dirtG.addColorStop(0, "#a06b33");
    dirtG.addColorStop(0.3, "#8a5a2b");
    dirtG.addColorStop(1, "#5c3a1a");
    ctx.fillStyle = dirtG;
    ctx.fillRect(0, FH - 38, FW, 38);
    // Scrolling brick pattern
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    for (let x = (g.frame * 2.5) % 26 - 26; x < FW + 26; x += 26) {
      ctx.fillRect(x, FH - 36, 12, 16);
      ctx.fillRect(x + 13, FH - 20, 12, 16);
    }
    // Ground 3D top edge
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, FH - 52);
    ctx.lineTo(FW, FH - 52);
    ctx.stroke();

    // Bird (3D)
    const bx = 75, by = g.y + (g.started ? 0 : Math.sin(g.frame * 0.05) * 6);
    drawBird3D(ctx, bx, by, g.vy, g.frame, g.started);

    // Score (3D text)
    ctx.font = "bold 36px Inter";
    ctx.textAlign = "center";
    // Shadow layers
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillText(String(g.score), FW / 2 + 2, 52);
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillText(String(g.score), FW / 2 + 1, 51);
    // Main text
    ctx.fillStyle = "#fff";
    ctx.fillText(String(g.score), FW / 2, 50);
    // Top highlight
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "bold 36px Inter";
    ctx.fillText(String(g.score), FW / 2, 49);

    // Overlays
    if (!g.started) {
      ctx.fillStyle = "rgba(6,10,24,0.6)";
      ctx.fillRect(0, 0, FW, FH);
      ctx.fillStyle = "#111827";
      ctx.beginPath();
      ctx.roundRect(FW / 2 - 130, FH / 2 - 68, 260, 136, 18);
      ctx.fill();
      ctx.strokeStyle = t.accent + "55";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(FW / 2 - 130, FH / 2 - 68, 260, 136, 18);
      ctx.stroke();
      ctx.fillStyle = t.accent;
      ctx.font = "bold 26px Inter";
      ctx.textAlign = "center";
      ctx.fillText("FLAPPY BIRD 3D", FW / 2, FH / 2 - 24);
      ctx.fillStyle = "#9ca3af";
      ctx.font = "13px Inter";
      ctx.fillText("Fly through the pipes!", FW / 2, FH / 2 + 2);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px Inter";
      ctx.fillText("Tap or SPACE to fly", FW / 2, FH / 2 + 30);
    }
    if (g.started && !g.alive) {
      ctx.fillStyle = "rgba(6,10,24,0.7)";
      ctx.fillRect(0, 0, FW, FH);
      ctx.fillStyle = "#111827";
      ctx.beginPath();
      ctx.roundRect(FW / 2 - 130, FH / 2 - 68, 260, 136, 18);
      ctx.fill();
      ctx.strokeStyle = t.accent + "55";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(FW / 2 - 130, FH / 2 - 68, 260, 136, 18);
      ctx.stroke();
      ctx.fillStyle = t.accent;
      ctx.font = "bold 28px Inter";
      ctx.textAlign = "center";
      ctx.fillText("Game Over", FW / 2, FH / 2 - 24);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 18px Inter";
      ctx.fillText("Score: " + g.score, FW / 2, FH / 2 + 6);
      ctx.fillStyle = t.accent;
      ctx.font = "bold 14px Inter";
      ctx.fillText("Tap / SPACE to restart", FW / 2, FH / 2 + 34);
    }
  }, [t, drawPipe3D, drawBird3D]);

  const loop = useCallback(() => {
    const g = G.current;
    g.frame++;
    // Clouds drift
    clouds.current.forEach((cl) => {
      cl.x -= cl.v;
      if (cl.x < -60) { cl.x = FW + 50; cl.y = 20 + Math.random() * 140; }
    });
    // Mountains drift
    mountains.current.forEach((m) => {
      m.x -= 0.3;
      if (m.x < -100) { m.x = FW + 40 + Math.random() * 60; m.h = 50 + Math.random() * 80; }
    });
    if (g.started && g.alive) {
      g.vy += 0.52;
      g.y += g.vy;
      if (g.frame % 80 === 0) {
        const top = 80 + Math.random() * (FH - PGAP - 130);
        g.pipes.push({ x: FW, top, passed: false, glow: 0 });
      }
      g.pipes.forEach((p) => (p.x -= 3.2));
      g.pipes = g.pipes.filter((p) => p.x > -PW - 10);
      g.pipes.forEach((p) => {
        if (!p.passed && p.x + PW < 75) {
          p.passed = true;
          p.glow = 8;
          g.score++;
          setScore(g.score);
        }
      });
      const by = g.y;
      if (by < 0 || by > FH - 52 || g.pipes.some((p) => 75 + 14 > p.x && 75 - 14 < p.x + PW && (by - 10 < p.top || by + 10 > p.top + PGAP))) {
        g.alive = false;
        if (g.score > 0 && onCoinEarned) onCoinEarned(Math.max(1, Math.round(g.score)));
      }
    }
    draw();
    raf.current = requestAnimationFrame(loopRef.current);
  }, [draw, onCoinEarned]);

  useEffect(() => { loopRef.current = loop; }, [loop]);

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
        <span className="text-gray-400 text-sm flex items-center gap-1.5">
          <FaDove size={14} style={{ color: t.accent }} /> Flappy Bird 3D
        </span>
        <span className="font-bold" style={{ color: t.accent }}>Score: {score}</span>
      </div>
      <canvas
        ref={cvs} width={FW} height={FH}
        className="rounded-xl cursor-pointer max-w-full h-auto"
        style={{ border: `1px solid ${t.accent}33`, boxShadow: `0 0 32px ${t.accent}22` }}
        onClick={flap}
      />
      <p className="text-xs text-gray-600">Click / SPACE / ↑ to flap wings</p>
    </div>
  );
}
