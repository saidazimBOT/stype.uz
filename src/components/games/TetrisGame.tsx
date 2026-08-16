"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { FaPuzzlePiece } from "react-icons/fa6";
import type { ThemeColors } from "../../types";

interface TetrisGameProps {
  t: ThemeColors;
  onCoinEarned?: (amount: number) => void;
}

const TC = 26, TW = 10, TH = 18;
const W = TW * TC, H = TH * TC;
const T_SHAPES: number[][][] = [
  [[1, 1, 1, 1]],
  [[1, 1], [1, 1]],
  [[1, 1, 1], [0, 1, 0]],
  [[1, 1, 1], [1, 0, 0]],
  [[1, 1, 1], [0, 0, 1]],
  [[1, 1, 0], [0, 1, 1]],
  [[0, 1, 1], [1, 1, 0]],
];
const T_COLORS = ["#38bdf8", "#f59e0b", "#a78bfa", "#ef4444", "#22c55e", "#ec4899", "#f97316"];

interface Piece {
  s: number[][];
  c: string;
  x: number;
  y: number;
}

interface GameState {
  board: (string | null)[][];
  piece: Piece;
  next: Piece;
  score: number;
  alive: boolean;
  started: boolean;
}

export default function TetrisGame({ t, onCoinEarned }: TetrisGameProps) {
  const cvs = useRef<HTMLCanvasElement>(null);
  const G = useRef<GameState | null>(null);
  const [score, setScore] = useState(0);
  const raf = useRef<number | null>(null);
  const lastDrop = useRef(0);
  const flash = useRef<{ t: number } | null>(null);

  const mkPiece = (): Piece => {
    const i = Math.floor(Math.random() * T_SHAPES.length);
    return { s: [...T_SHAPES[i].map((r) => [...r])], c: T_COLORS[i], x: 3, y: 0 };
  };
  const rotate = (s: number[][]): number[][] => s[0].map((_, i) => s.map((r) => r[i]).reverse());
  const fits = (board: (string | null)[][], piece: Piece, dx = 0, dy = 0, shape?: number[][]): boolean => {
    const sh = shape || piece.s;
    return sh.every((row, r) =>
      row.every((v, col) => {
        if (!v) return true;
        const nx = piece.x + col + dx, ny = piece.y + r + dy;
        return nx >= 0 && nx < TW && ny >= 0 && ny < TH && !board[ny][nx];
      })
    );
  };

  const initBoard = (): (string | null)[][] => Array.from({ length: TH }, () => Array(TW).fill(null));

  // 3D beveled block
  const drawBlock = useCallback((ctx: CanvasRenderingContext2D, bx: number, by: number, color: string, alpha = 1) => {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(bx + 1, by + 1, TC - 2, TC - 2, 4);
    ctx.fill();
    const g = ctx.createLinearGradient(bx + 1, by + 1, bx + 1, by + TC - 2);
    g.addColorStop(0, "rgba(255,255,255,0.35)");
    g.addColorStop(0.4, "rgba(255,255,255,0.05)");
    g.addColorStop(1, "rgba(0,0,0,0.3)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(bx + 1, by + 1, TC - 2, TC - 2, 4);
    ctx.fill();
    ctx.globalAlpha = 1;
  }, []);

  const draw = useCallback(() => {
    const c = cvs.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;

    // background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#0c1424");
    bg.addColorStop(0.6, "#0e1120");
    bg.addColorStop(1, "#0b0d15");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // subtle grid
    ctx.strokeStyle = "#ffffff06";
    ctx.lineWidth = 1;
    for (let x = 0; x <= TW; x++) {
      ctx.beginPath(); ctx.moveTo(x * TC, 0); ctx.lineTo(x * TC, H); ctx.stroke();
    }
    for (let y = 0; y <= TH; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * TC); ctx.lineTo(W, y * TC); ctx.stroke();
    }

    const g = G.current;
    if (g) {
      // settled blocks
      g.board.forEach((row, r) =>
        row.forEach((col, c2) => {
          if (col) drawBlock(ctx, c2 * TC, r * TC, col);
        })
      );

      if (g.piece) {
        // ghost piece
        let gy = 0;
        while (fits(g.board, g.piece, 0, gy + 1)) gy++;
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = g.piece.c + "99";
        ctx.lineWidth = 1.5;
        g.piece.s.forEach((row, r) =>
          row.forEach((v, col) => {
            if (v) ctx.strokeRect((g.piece.x + col) * TC + 3, (g.piece.y + r + gy) * TC + 3, TC - 6, TC - 6);
          })
        );
        ctx.restore();
        // ghost fill (light)
        g.piece.s.forEach((row, r) =>
          row.forEach((v, col) => {
            if (v) drawBlock(ctx, (g.piece.x + col) * TC, (g.piece.y + r + gy) * TC, g.piece.c, 0.18);
          })
        );
        // active piece
        g.piece.s.forEach((row, r) =>
          row.forEach((v, col) => {
            if (v) drawBlock(ctx, (g.piece.x + col) * TC, (g.piece.y + r) * TC, g.piece.c);
          })
        );
      }
    }

    // line-clear flash
    if (flash.current && flash.current.t > 0) {
      ctx.fillStyle = `rgba(255,255,255,${(flash.current.t / 8) * 0.35})`;
      ctx.fillRect(0, 0, W, H);
    }

    if (!g || !g.started) {
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
      ctx.fillText("TETRIS", W / 2, H / 2 - 24);
      ctx.fillStyle = "#9ca3af";
      ctx.font = "13px Inter";
      ctx.fillText("Clear lines before they stack up!", W / 2, H / 2 + 2);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px Inter";
      ctx.fillText("Press SPACE or click to start", W / 2, H / 2 + 30);
    } else if (g && !g.alive) {
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
      ctx.fillText("Game Over", W / 2, H / 2 - 22);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px Inter";
      ctx.fillText("Score: " + g.score, W / 2, H / 2 + 6);
      ctx.fillStyle = t.accent;
      ctx.font = "bold 14px Inter";
      ctx.fillText("SPACE / click to restart", W / 2, H / 2 + 34);
    }
  }, [t]);

  const loop = useCallback(
    (ts: number) => {
      const g = G.current;
      if (g && g.alive && g.started) {
        const speed = Math.max(80, 500 - Math.floor(g.score / 5));
        if (ts - lastDrop.current > speed) {
          lastDrop.current = ts;
          if (fits(g.board, g.piece, 0, 1)) {
            g.piece.y++;
          } else {
            g.piece.s.forEach((row, r) =>
              row.forEach((v, col) => {
                if (v && g.piece.y + r >= 0) g.board[g.piece.y + r][g.piece.x + col] = g.piece.c;
              })
            );
            let cleared = 0;
            for (let r = TH - 1; r >= 0; ) {
              if (g.board[r].every((c) => c)) { g.board.splice(r, 1); g.board.unshift(Array(TW).fill(null)); cleared++; } else r--;
            }
            if (cleared > 0) flash.current = { t: 8 };
            g.score += cleared === 1 ? 100 : cleared === 2 ? 300 : cleared === 3 ? 500 : cleared === 4 ? 800 : 0;
            setScore(g.score);
            g.piece = g.next;
            g.next = mkPiece();
            if (!fits(g.board, g.piece)) {
              g.alive = false;
              if (g.score > 0 && onCoinEarned) {
                onCoinEarned(Math.round(g.score / 10));
              }
            }
          }
        }
      }
      if (flash.current) flash.current.t--;
      draw();
      raf.current = requestAnimationFrame(loop);
    },
    [draw, onCoinEarned]
  );

  const startGame = useCallback(() => {
    const p = mkPiece();
    G.current = { board: initBoard(), piece: p, next: mkPiece(), score: 0, alive: true, started: true };
    setScore(0);
    lastDrop.current = 0;
    flash.current = null;
  }, []);

  const handleClick = useCallback(() => {
    const g = G.current;
    if (!g || !g.alive) startGame();
    else if (!g.started) startGame();
  }, [startGame]);

  useEffect(() => {
    G.current = null;
    draw();
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [loop, draw]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.code === "Space") { e.preventDefault(); const g = G.current; if (!g || !g.alive || !g.started) { startGame(); return; } }
      const g = G.current;
      if (!g || !g.alive || !g.started) return;
      if (e.code === "ArrowLeft") { if (fits(g.board, g.piece, -1, 0)) g.piece.x--; e.preventDefault(); }
      else if (e.code === "ArrowRight") { if (fits(g.board, g.piece, 1, 0)) g.piece.x++; e.preventDefault(); }
      else if (e.code === "ArrowDown") { if (fits(g.board, g.piece, 0, 1)) g.piece.y++; e.preventDefault(); }
      else if (e.code === "ArrowUp") { const r = rotate(g.piece.s); if (fits(g.board, g.piece, 0, 0, r)) g.piece.s = r; e.preventDefault(); }
      else if (e.code === "Space") { let d = 0; while (fits(g.board, g.piece, 0, d + 1)) d++; g.piece.y += d; }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [startGame]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full max-w-full" style={{ maxWidth: W }}>
        <span className="text-gray-400 text-sm flex items-center gap-1.5"><FaPuzzlePiece size={14} style={{ color: t.accent }} /> Tetris</span>
        <span className="font-bold" style={{ color: t.accent }}>Score: {score}</span>
      </div>
      <canvas
        ref={cvs}
        width={W}
        height={H}
        className="rounded-xl cursor-pointer max-w-full h-auto"
        style={{ border: `1px solid ${t.accent}33`, boxShadow: `0 0 24px ${t.accent}22` }}
        onClick={handleClick}
      />
      <p className="text-xs text-gray-600">← → move · ↑ rotate · ↓ drop · SPACE start/hard-drop</p>
    </div>
  );
}
