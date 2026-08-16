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

interface Cloud {
  x: number;
  y: number;
  s: number;
  v: number;
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
  const clouds = useRef<Cloud[]>(
    Array.from({ length: 5 }, (_, i) => ({
      x: (i / 5) * FW + Math.random() * 40,
      y: 26 + Math.random() * 130,
      s: 0.55 + Math.random() * 0.7,
      v: 0.25 + Math.random() * 0.4,
    }))
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
    g.vy = -9;
  }, []);

  const draw = useCallback(() => {
    const c = cvs.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const g = G.current;

    // ── sky gradient ──
    const sky = ctx.createLinearGradient(0, 0, 0, FH);
    sky.addColorStop(0, "#3aa9c9");
    sky.addColorStop(0.55, "#7ec8dd");
    sky.addColorStop(1, "#c9ecf4");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, FW, FH);

    // ── sun ──
    const sunX = FW - 46, sunY = 46;
    const sg = ctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, 44);
    sg.addColorStop(0, "rgba(255,236,150,0.95)");
    sg.addColorStop(0.4, "rgba(255,220,90,0.35)");
    sg.addColorStop(1, "rgba(255,220,90,0)");
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffe783";
    ctx.beginPath();
    ctx.arc(sunX, sunY, 16, 0, Math.PI * 2);
    ctx.fill();

    // ── clouds ──
    clouds.current.forEach((cl) => {
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.ellipse(cl.x, cl.y, 26 * cl.s, 12 * cl.s, 0, 0, Math.PI * 2);
      ctx.ellipse(cl.x - 18 * cl.s, cl.y + 4 * cl.s, 17 * cl.s, 10 * cl.s, 0, 0, Math.PI * 2);
      ctx.ellipse(cl.x + 18 * cl.s, cl.y + 3 * cl.s, 15 * cl.s, 9 * cl.s, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // ── ground ──
    ctx.fillStyle = "#8a5a2b";
    ctx.fillRect(0, FH - 36, FW, 36);
    ctx.fillStyle = "#a06b33";
    for (let x = (g.frame * 2) % 24 - 24; x < FW; x += 24) {
      ctx.fillRect(x, FH - 34, 12, 32);
    }
    const grass = ctx.createLinearGradient(0, FH - 40, 0, FH - 28);
    grass.addColorStop(0, "#7ef06a");
    grass.addColorStop(1, "#2f9e44");
    ctx.fillStyle = grass;
    ctx.fillRect(0, FH - 40, FW, 12);

    // ── pipes ──
    g.pipes.forEach((p) => {
      const pg = ctx.createLinearGradient(p.x, 0, p.x + PW, 0);
      pg.addColorStop(0, "#5be07a");
      pg.addColorStop(0.45, "#22c55e");
      pg.addColorStop(1, "#15803d");
      // body
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.roundRect(p.x, 0, PW, p.top, 5);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(p.x, p.top + PGAP, PW, FH - p.top - PGAP - 40, 5);
      ctx.fill();
      ctx.strokeStyle = "#166534";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(p.x, 0, PW, p.top, 5);
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(p.x, p.top + PGAP, PW, FH - p.top - PGAP - 40, 5);
      ctx.stroke();
      // caps
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.roundRect(p.x - 5, p.top - 14, PW + 10, 14, 5);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(p.x - 5, p.top + PGAP, PW + 10, 14, 5);
      ctx.fill();
      ctx.strokeStyle = "#166534";
      ctx.beginPath();
      ctx.roundRect(p.x - 5, p.top - 14, PW + 10, 14, 5);
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(p.x - 5, p.top + PGAP, PW + 10, 14, 5);
      ctx.stroke();
      // cap highlight
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p.x + 3, p.top - 10);
      ctx.lineTo(p.x + PW - 3, p.top - 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(p.x + 3, p.top + PGAP + 10);
      ctx.lineTo(p.x + PW - 3, p.top + PGAP + 10);
      ctx.stroke();
    });

    // ── bird ──
    const bx = 70, by = g.y + (g.started ? 0 : Math.sin(g.frame * 0.05) * 5);
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(Math.min(Math.max(g.vy * 0.05, -0.5), 0.9) + (g.started ? 0 : Math.sin(g.frame * 0.1) * 0.07));
    // wing (flapping)
    const wingA = g.started ? Math.sin(g.frame * 0.5) * 0.85 : Math.sin(g.frame * 0.12) * 0.5;
    ctx.save();
    ctx.translate(-3, -2);
    ctx.rotate(wingA);
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 6, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // tail
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.moveTo(-12, -2);
    ctx.lineTo(-20, -7);
    ctx.lineTo(-17, 0);
    ctx.lineTo(-20, 6);
    ctx.lineTo(-12, 3);
    ctx.closePath();
    ctx.fill();
    // body
    const bg = ctx.createRadialGradient(-2, -3, 1, 0, 0, 15);
    bg.addColorStop(0, "#fef08a");
    bg.addColorStop(0.7, "#facc15");
    bg.addColorStop(1, "#f59e0b");
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    // eye
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(6, -3, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(7.5, -4, 2.2, 0, Math.PI * 2);
    ctx.fill();
    // beak
    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(24, -3.5);
    ctx.lineTo(24, 3.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // ── score ──
    ctx.font = "bold 30px Inter";
    ctx.textAlign = "center";
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.lineWidth = 5;
    ctx.strokeText(String(g.score), FW / 2, 50);
    ctx.fillStyle = "#fff";
    ctx.fillText(String(g.score), FW / 2, 50);

    if (!g.started) {
      ctx.fillStyle = "rgba(8,10,16,0.55)";
      ctx.fillRect(0, 0, FW, FH);
      ctx.fillStyle = "#151a24";
      ctx.beginPath();
      ctx.roundRect(FW / 2 - 120, FH / 2 - 62, 240, 124, 16);
      ctx.fill();
      ctx.strokeStyle = t.accent + "66";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(FW / 2 - 120, FH / 2 - 62, 240, 124, 16);
      ctx.stroke();
      ctx.fillStyle = t.accent;
      ctx.font = "bold 24px Inter";
      ctx.fillText("FLAPPY BIRD", FW / 2, FH / 2 - 24);
      ctx.fillStyle = "#9ca3af";
      ctx.font = "13px Inter";
      ctx.fillText("Fly through the pipes!", FW / 2, FH / 2 + 2);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px Inter";
      ctx.fillText("Tap or SPACE to fly", FW / 2, FH / 2 + 30);
    }
    if (g.started && !g.alive) {
      ctx.fillStyle = "rgba(8,10,16,0.7)";
      ctx.fillRect(0, 0, FW, FH);
      ctx.fillStyle = "#151a24";
      ctx.beginPath();
      ctx.roundRect(FW / 2 - 120, FH / 2 - 62, 240, 124, 16);
      ctx.fill();
      ctx.strokeStyle = t.accent + "66";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(FW / 2 - 120, FH / 2 - 62, 240, 124, 16);
      ctx.stroke();
      ctx.fillStyle = t.accent;
      ctx.font = "bold 26px Inter";
      ctx.fillText("Game Over", FW / 2, FH / 2 - 22);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px Inter";
      ctx.fillText("Score: " + g.score, FW / 2, FH / 2 + 6);
      ctx.fillStyle = t.accent;
      ctx.font = "bold 14px Inter";
      ctx.fillText("Tap / SPACE to restart", FW / 2, FH / 2 + 34);
    }
  }, [t]);

  const loop = useCallback(() => {
    const g = G.current;
    g.frame++;
    // clouds always drift
    clouds.current.forEach((cl) => {
      cl.x -= cl.v;
      if (cl.x < -50) {
        cl.x = FW + 40;
        cl.y = 26 + Math.random() * 130;
      }
    });
    if (g.started && g.alive) {
      g.vy += 0.5;
      g.y += g.vy;
      if (g.frame % 85 === 0) {
        const top = 80 + Math.random() * (FH - PGAP - 120);
        g.pipes.push({ x: FW, top, passed: false });
      }
      g.pipes.forEach((p) => (p.x -= 3));
      g.pipes = g.pipes.filter((p) => p.x > -PW - 10);
      g.pipes.forEach((p) => {
        if (!p.passed && p.x + PW < 70) {
          p.passed = true;
          g.score++;
          setScore(g.score);
        }
      });
      const by = g.y;
      if (by < 0 || by > FH - 40 || g.pipes.some((p) => 70 + 13 > p.x && 70 - 13 < p.x + PW && (by - 9 < p.top || by + 9 > p.top + PGAP))) {
        g.alive = false;
        if (g.score > 0 && onCoinEarned) {
          const coinReward = Math.max(1, Math.round(g.score * 1));
          onCoinEarned(coinReward);
        }
      }
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
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
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
        <span className="text-gray-400 text-sm flex items-center gap-1.5"><FaDove size={14} style={{ color: t.accent }} /> Flappy Bird</span>
        <span className="font-bold" style={{ color: t.accent }}>Score: {score}</span>
      </div>
      <canvas
        ref={cvs}
        width={FW}
        height={FH}
        className="rounded-xl cursor-pointer max-w-full h-auto"
        style={{ border: `1px solid ${t.accent}33`, boxShadow: `0 0 24px ${t.accent}22` }}
        onClick={flap}
      />
      <p className="text-xs text-gray-600">Click / SPACE / ↑ to flap wings</p>
    </div>
  );
}
