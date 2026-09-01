"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { FaTableTennisPaddleBall } from "react-icons/fa6";
import type { ThemeColors } from "../../types";

interface PongGameProps {
  t: ThemeColors;
  onCoinEarned?: (amount: number) => void;
}

const CW = 380, CH = 320;
const PADDLE_W = 12, PADDLE_H = 60;
const BALL_SIZE = 10;
const WIN_SCORE = 7;
const PADDLE_SPEED = 4.5;
const AI_SPEED = 3.2;

interface GameState {
  playerY: number;
  aiY: number;
  ballX: number;
  ballY: number;
  ballVX: number;
  ballVY: number;
  pScore: number;
  aScore: number;
  alive: boolean;
  started: boolean;
  paused: boolean;
  msg: string;
}

export default function PongGame({ t, onCoinEarned }: PongGameProps) {
  const cvs = useRef<HTMLCanvasElement>(null);
  const G = useRef<GameState | null>(null);
  const [pScore, setPScore] = useState(0);
  const [aScore, setAScore] = useState(0);
  const [best, setBest] = useState(0);
  const raf = useRef<number | null>(null);
  const keys = useRef({ up: false, down: false });
  const mouseY = useRef(CH / 2);
  const useMouse = useRef(false);

  const resetBall = useCallback((g: GameState, dir: number) => {
    g.ballX = CW / 2;
    g.ballY = CH / 2;
    const angle = (Math.random() - 0.5) * 1.0;
    g.ballVX = dir * (4 + Math.random() * 1.5);
    g.ballVY = Math.sin(angle) * 3;
    g.paused = true;
    g.msg = "3";
    setTimeout(() => { if (G.current) G.current.msg = "2"; }, 400);
    setTimeout(() => { if (G.current) G.current.msg = "1"; }, 800);
    setTimeout(() => {
      if (G.current) { G.current.paused = false; G.current.msg = ""; }
    }, 1200);
  }, []);

  const startGame = useCallback(() => {
    const g: GameState = {
      playerY: CH / 2 - PADDLE_H / 2,
      aiY: CH / 2 - PADDLE_H / 2,
      ballX: CW / 2,
      ballY: CH / 2,
      ballVX: 0,
      ballVY: 0,
      pScore: 0,
      aScore: 0,
      alive: true,
      started: true,
      paused: true,
      msg: "3",
    };
    G.current = g;
    setPScore(0);
    setAScore(0);
    resetBall(g, 1);
  }, [resetBall]);

  const draw = useCallback(() => {
    const c = cvs.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const g = G.current;

    // background
    ctx.fillStyle = "#080c14";
    ctx.fillRect(0, 0, CW, CH);

    // center line
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = "#ffffff18";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CW / 2, 0);
    ctx.lineTo(CW / 2, CH);
    ctx.stroke();
    ctx.setLineDash([]);

    if (g) {
      // center glow
      const cg = ctx.createRadialGradient(g.ballX, g.ballY, 2, g.ballX, g.ballY, 50);
      cg.addColorStop(0, t.accent + "22");
      cg.addColorStop(1, t.accent + "00");
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(g.ballX, g.ballY, 50, 0, Math.PI * 2);
      ctx.fill();

      // player paddle
      ctx.fillStyle = t.accent;
      ctx.beginPath();
      ctx.roundRect(20, g.playerY, PADDLE_W, PADDLE_H, 6);
      ctx.fill();
      // glow
      const pg = ctx.createRadialGradient(20 + PADDLE_W / 2, g.playerY + PADDLE_H / 2, 4, 20 + PADDLE_W / 2, g.playerY + PADDLE_H / 2, PADDLE_H);
      pg.addColorStop(0, t.accent + "44");
      pg.addColorStop(1, t.accent + "00");
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.arc(20 + PADDLE_W / 2, g.playerY + PADDLE_H / 2, PADDLE_H, 0, Math.PI * 2);
      ctx.fill();

      // AI paddle
      ctx.fillStyle = "#6366f1";
      ctx.beginPath();
      ctx.roundRect(CW - 20 - PADDLE_W, g.aiY, PADDLE_W, PADDLE_H, 6);
      ctx.fill();
      const ag = ctx.createRadialGradient(CW - 20 - PADDLE_W / 2, g.aiY + PADDLE_H / 2, 4, CW - 20 - PADDLE_W / 2, g.aiY + PADDLE_H / 2, PADDLE_H);
      ag.addColorStop(0, "#6366f144");
      ag.addColorStop(1, "#6366f100");
      ctx.fillStyle = ag;
      ctx.beginPath();
      ctx.arc(CW - 20 - PADDLE_W / 2, g.aiY + PADDLE_H / 2, PADDLE_H, 0, Math.PI * 2);
      ctx.fill();

      // ball
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(g.ballX, g.ballY, BALL_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
      // ball trail
      const trail = ctx.createRadialGradient(g.ballX, g.ballY, 1, g.ballX, g.ballY, 18);
      trail.addColorStop(0, "rgba(255,255,255,0.35)");
      trail.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = trail;
      ctx.beginPath();
      ctx.arc(g.ballX, g.ballY, 18, 0, Math.PI * 2);
      ctx.fill();

      // scores
      ctx.fillStyle = "#fff";
      ctx.font = "bold 36px Inter";
      ctx.textAlign = "center";
      ctx.globalAlpha = 0.3;
      ctx.fillText(String(g.pScore), CW / 4, 56);
      ctx.fillText(String(g.aScore), (CW / 4) * 3, 56);
      ctx.globalAlpha = 1;

      // countdown / message
      if (g.msg) {
        ctx.fillStyle = "#fff";
        ctx.font = "bold 48px Inter";
        ctx.textAlign = "center";
        ctx.fillText(g.msg, CW / 2, CH / 2 + 16);
      }
    }

    if (!g || !g.started) {
      ctx.fillStyle = "rgba(8,12,20,0.82)";
      ctx.fillRect(0, 0, CW, CH);
      ctx.fillStyle = "#151a24";
      ctx.beginPath();
      ctx.roundRect(CW / 2 - 120, CH / 2 - 62, 240, 124, 16);
      ctx.fill();
      ctx.strokeStyle = t.accent + "66";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(CW / 2 - 120, CH / 2 - 62, 240, 124, 16);
      ctx.stroke();
      ctx.fillStyle = t.accent;
      ctx.font = "bold 24px Inter";
      ctx.textAlign = "center";
      ctx.fillText("PONG", CW / 2, CH / 2 - 24);
      ctx.fillStyle = "#9ca3af";
      ctx.font = "13px Inter";
      ctx.fillText("First to 7 wins!", CW / 2, CH / 2 + 2);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px Inter";
      ctx.fillText("Click / SPACE to start", CW / 2, CH / 2 + 30);
    } else if (g && !g.alive) {
      ctx.fillStyle = "rgba(8,12,20,0.82)";
      ctx.fillRect(0, 0, CW, CH);
      ctx.fillStyle = "#151a24";
      ctx.beginPath();
      ctx.roundRect(CW / 2 - 120, CH / 2 - 62, 240, 124, 16);
      ctx.fill();
      ctx.strokeStyle = t.accent + "66";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(CW / 2 - 120, CH / 2 - 62, 240, 124, 16);
      ctx.stroke();
      const won = g.pScore >= WIN_SCORE;
      ctx.fillStyle = won ? "#22c55e" : "#ef4444";
      ctx.font = "bold 26px Inter";
      ctx.textAlign = "center";
      ctx.fillText(won ? "You Win!" : "AI Wins!", CW / 2, CH / 2 - 22);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px Inter";
      ctx.fillText(`${g.pScore} — ${g.aScore}`, CW / 2, CH / 2 + 6);
      ctx.fillStyle = t.accent;
      ctx.font = "bold 14px Inter";
      ctx.fillText("Click / SPACE to restart", CW / 2, CH / 2 + 34);
    }
  }, [t]);

  const loop = useCallback(() => {
    const g = G.current;
    if (g && g.alive && g.started && !g.paused) {
      // player movement
      if (useMouse.current) {
        const target = mouseY.current - PADDLE_H / 2;
        g.playerY += (target - g.playerY) * 0.35;
      } else {
        if (keys.current.up) g.playerY -= PADDLE_SPEED;
        if (keys.current.down) g.playerY += PADDLE_SPEED;
      }
      g.playerY = Math.max(0, Math.min(CH - PADDLE_H, g.playerY));

      // AI movement
      const aiCenter = g.aiY + PADDLE_H / 2;
      const diff = g.ballY - aiCenter;
      if (Math.abs(diff) > 8) {
        g.aiY += Math.sign(diff) * AI_SPEED;
      }
      g.aiY = Math.max(0, Math.min(CH - PADDLE_H, g.aiY));

      // ball movement
      g.ballX += g.ballVX;
      g.ballY += g.ballVY;

      // top/bottom bounce
      if (g.ballY - BALL_SIZE / 2 <= 0 || g.ballY + BALL_SIZE / 2 >= CH) {
        g.ballVY *= -1;
        g.ballY = Math.max(BALL_SIZE / 2, Math.min(CH - BALL_SIZE / 2, g.ballY));
      }

      // player paddle collision
      if (
        g.ballX - BALL_SIZE / 2 <= 32 &&
        g.ballX + BALL_SIZE / 2 >= 20 &&
        g.ballY >= g.playerY &&
        g.ballY <= g.playerY + PADDLE_H &&
        g.ballVX < 0
      ) {
        const hit = (g.ballY - g.playerY - PADDLE_H / 2) / (PADDLE_H / 2);
        const speed = Math.sqrt(g.ballVX ** 2 + g.ballVY ** 2) * 1.05;
        g.ballVX = Math.abs(Math.cos(hit * 0.9) * speed);
        g.ballVY = Math.sin(hit * 0.9) * speed;
        g.ballX = 33;
      }

      // AI paddle collision
      if (
        g.ballX + BALL_SIZE / 2 >= CW - 32 &&
        g.ballX - BALL_SIZE / 2 <= CW - 20 &&
        g.ballY >= g.aiY &&
        g.ballY <= g.aiY + PADDLE_H &&
        g.ballVX > 0
      ) {
        const hit = (g.ballY - g.aiY - PADDLE_H / 2) / (PADDLE_H / 2);
        const speed = Math.sqrt(g.ballVX ** 2 + g.ballVY ** 2) * 1.05;
        g.ballVX = -Math.abs(Math.cos(hit * 0.9) * speed);
        g.ballVY = Math.sin(hit * 0.9) * speed;
        g.ballX = CW - 33;
      }

      // scoring
      if (g.ballX < -10) {
        g.aScore++;
        setAScore(g.aScore);
        if (g.aScore >= WIN_SCORE) {
          g.alive = false;
          setBest((prev) => Math.max(prev, g.pScore));
        } else {
          resetBall(g, 1);
        }
      } else if (g.ballX > CW + 10) {
        g.pScore++;
        setPScore(g.pScore);
        if (g.pScore >= WIN_SCORE) {
          g.alive = false;
          setBest((prev) => Math.max(prev, g.pScore));
          if (onCoinEarned) onCoinEarned(10);
        } else {
          resetBall(g, -1);
        }
      }
    }
    draw();
    raf.current = requestAnimationFrame(loop);
  }, [draw, onCoinEarned, resetBall]);

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
      }
      if (e.code === "ArrowUp" || e.code === "KeyW") { keys.current.up = true; useMouse.current = false; e.preventDefault(); }
      if (e.code === "ArrowDown" || e.code === "KeyS") { keys.current.down = true; useMouse.current = false; e.preventDefault(); }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "ArrowUp" || e.code === "KeyW") keys.current.up = false;
      if (e.code === "ArrowDown" || e.code === "KeyS") keys.current.down = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [startGame]);

  const onClick = useCallback(() => {
    const g = G.current;
    if (!g || !g.alive || !g.started) startGame();
  }, [startGame]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseY.current = ((e.clientY - rect.top) / rect.height) * CH;
    useMouse.current = true;
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full max-w-full" style={{ maxWidth: CW }}>
        <span className="text-gray-400 text-sm flex items-center gap-1.5">
          <FaTableTennisPaddleBall size={14} style={{ color: t.accent }} /> Pong
        </span>
        <span className="font-bold" style={{ color: t.accent }}>First to {WIN_SCORE}</span>
      </div>
      <canvas
        ref={cvs}
        width={CW}
        height={CH}
        className="rounded-xl cursor-pointer max-w-full h-auto touch-none select-none"
        style={{ border: `1px solid ${t.accent}33` }}
        onClick={onClick}
        onPointerMove={onPointerMove}
      />
      <p className="text-xs text-gray-600">↑ ↓ / W S / mouse to move paddle · SPACE to start</p>
    </div>
  );
}
