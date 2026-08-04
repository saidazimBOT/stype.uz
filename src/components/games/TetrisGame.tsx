"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { FaPuzzlePiece } from "react-icons/fa6";
import type { ThemeColors } from "../../types";

interface TetrisGameProps {
  t: ThemeColors;
}

const TC = 26, TW = 10, TH = 18;
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

export default function TetrisGame({ t }: TetrisGameProps) {
  const cvs = useRef<HTMLCanvasElement>(null);
  const G = useRef<GameState | null>(null);
  const [score, setScore] = useState(0);
  const raf = useRef<number | null>(null);
  const lastDrop = useRef(0);

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

  const draw = useCallback(() => {
    const c = cvs.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const W = TW * TC, H = TH * TC;
    ctx.fillStyle = "#0f0f13";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#ffffff06";
    for (let x = 0; x <= TW; x++) { ctx.beginPath(); ctx.moveTo(x * TC, 0); ctx.lineTo(x * TC, H); ctx.stroke(); }
    for (let y = 0; y <= TH; y++) { ctx.beginPath(); ctx.moveTo(0, y * TC); ctx.lineTo(W, y * TC); ctx.stroke(); }

    const g = G.current;
    if (g) {
      g.board.forEach((row, r) =>
        row.forEach((col, c2) => {
          if (col) { ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(c2 * TC + 1, r * TC + 1, TC - 2, TC - 2, 3); ctx.fill(); }
        })
      );
      if (g.piece) {
        let gy = 0;
        while (fits(g.board, g.piece, 0, gy + 1)) gy++;
        g.piece.s.forEach((row, r) =>
          row.forEach((v, col) => {
            if (v) {
              ctx.fillStyle = g.piece.c + "33";
              ctx.beginPath();
              ctx.roundRect((g.piece.x + col) * TC + 1, (g.piece.y + r + gy) * TC + 1, TC - 2, TC - 2, 3);
              ctx.fill();
            }
          })
        );
        g.piece.s.forEach((row, r) =>
          row.forEach((v, col) => {
            if (v) {
              ctx.fillStyle = g.piece.c;
              ctx.beginPath();
              ctx.roundRect((g.piece.x + col) * TC + 1, (g.piece.y + r) * TC + 1, TC - 2, TC - 2, 3);
              ctx.fill();
            }
          })
        );
      }
    }

    if (!g || !g.started) {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 18px Inter";
      ctx.textAlign = "center";
      ctx.fillText("Press SPACE or click", W / 2, H / 2 - 12);
      ctx.fillText("to start Tetris", W / 2, H / 2 + 14);
    } else if (g && !g.alive) {
      ctx.fillStyle = "rgba(0,0,0,0.75)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = t.accent;
      ctx.font = "bold 24px Inter";
      ctx.textAlign = "center";
      ctx.fillText("Game Over", W / 2, H / 2 - 18);
      ctx.fillStyle = "#fff";
      ctx.font = "16px Inter";
      ctx.fillText("Score: " + g.score, W / 2, H / 2 + 8);
      ctx.fillText("SPACE / click to restart", W / 2, H / 2 + 32);
    }
  }, [t]);

  const loop = useCallback(
    (ts: number) => {
      const g = G.current;
      if (!g || !g.alive || !g.started) { draw(); return; }
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
          g.score += cleared === 1 ? 100 : cleared === 2 ? 300 : cleared === 3 ? 500 : cleared === 4 ? 800 : 0;
          setScore(g.score);
          g.piece = g.next;
          g.next = mkPiece();
          if (!fits(g.board, g.piece)) { g.alive = false; draw(); return; }
        }
      }
      draw();
      raf.current = requestAnimationFrame(loop);
    },
    [draw]
  );

  const startGame = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    const p = mkPiece();
    G.current = { board: initBoard(), piece: p, next: mkPiece(), score: 0, alive: true, started: true };
    setScore(0);
    lastDrop.current = 0;
    raf.current = requestAnimationFrame(loop);
  }, [loop]);

  const handleClick = useCallback(() => {
    const g = G.current;
    if (!g || !g.alive) startGame();
    else if (!g.started) startGame();
  }, [startGame]);

  useEffect(() => {
    G.current = null;
    draw();
    raf.current = requestAnimationFrame(loop);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
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
      <div className="flex items-center justify-between w-full max-w-full" style={{ maxWidth: TW * TC }}>
        <span className="text-gray-400 text-sm flex items-center gap-1.5"><FaPuzzlePiece size={14} /> Tetris</span>
        <span className="font-bold" style={{ color: t.accent }}>Score: {score}</span>
      </div>
      <canvas
        ref={cvs}
        width={TW * TC}
        height={TH * TC}
        className="rounded-xl cursor-pointer max-w-full h-auto"
        style={{ border: `1px solid ${t.accent}33` }}
        onClick={handleClick}
      />
      <p className="text-xs text-gray-600">← → move · ↑ rotate · ↓ drop · SPACE start/hard-drop</p>
    </div>
  );
}
