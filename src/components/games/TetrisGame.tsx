"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { FaPuzzlePiece } from "react-icons/fa6";
import type { ThemeColors } from "../../types";

interface TetrisGameProps {
  t: ThemeColors;
  onCoinEarned?: (amount: number) => void;
}

const TC = 28, TW = 10, TH = 18;
const W = TW * TC + 120;
const H = TH * TC + 60;
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

function hex2rgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

// Draw a 3D isometric-style block with top/left/right faces
function draw3DBlock(ctx: CanvasRenderingContext2D, bx: number, by: number, color: string, size: number, alpha = 1) {
  const d = 5; // depth
  const c = hex2rgb(color);
  ctx.globalAlpha = alpha;

  // Right face (darkest)
  ctx.fillStyle = `rgb(${Math.max(0, c.r - 65)},${Math.max(0, c.g - 65)},${Math.max(0, c.b - 65)})`;
  ctx.beginPath();
  ctx.moveTo(bx + size, by);
  ctx.lineTo(bx + size + d, by - d);
  ctx.lineTo(bx + size + d, by + size - d);
  ctx.lineTo(bx + size, by + size);
  ctx.closePath();
  ctx.fill();

  // Left face (medium dark)
  ctx.fillStyle = `rgb(${Math.max(0, c.r - 35)},${Math.max(0, c.g - 35)},${Math.max(0, c.b - 35)})`;
  ctx.beginPath();
  ctx.moveTo(bx, by + size);
  ctx.lineTo(bx + d, by + size - d);
  ctx.lineTo(bx + size + d, by + size - d);
  ctx.lineTo(bx + size, by + size);
  ctx.closePath();
  ctx.fill();

  // Top face (brightest)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(bx, by, size, size, 3);
  ctx.fill();

  // Top highlight gradient
  const tg = ctx.createLinearGradient(bx, by, bx + size, by + size);
  tg.addColorStop(0, "rgba(255,255,255,0.32)");
  tg.addColorStop(0.3, "rgba(255,255,255,0.08)");
  tg.addColorStop(1, "rgba(0,0,0,0.12)");
  ctx.fillStyle = tg;
  ctx.beginPath();
  ctx.roundRect(bx, by, size, size, 3);
  ctx.fill();

  // Inner shine
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.beginPath();
  ctx.roundRect(bx + 2, by + 1, size - 6, size / 2 - 2, 2);
  ctx.fill();

  // Border
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.roundRect(bx, by, size, size, 3);
  ctx.stroke();

  ctx.globalAlpha = 1;
}

// Draw empty cell with 3D inset effect
function drawEmptyCell(ctx: CanvasRenderingContext2D, bx: number, by: number, size: number) {
  ctx.fillStyle = "#0e1422";
  ctx.beginPath();
  ctx.roundRect(bx, by, size, size, 3);
  ctx.fill();
  // Inner shadow (inset look)
  ctx.strokeStyle = "#080c18";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(bx + 0.5, by + 0.5, size - 1, size - 1, 3);
  ctx.stroke();
  // Subtle top highlight
  ctx.fillStyle = "rgba(255,255,255,0.02)";
  ctx.fillRect(bx + 2, by + 1, size - 4, 1);
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
      }),
    );
  };

  const initBoard = (): (string | null)[][] => Array.from({ length: TH }, () => Array(TW).fill(null));

  const draw = useCallback(() => {
    const c = cvs.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const g = G.current;

    // Deep space background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#060a18");
    bg.addColorStop(0.4, "#080e20");
    bg.addColorStop(1, "#050810");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Stars
    for (let i = 0; i < 40; i++) {
      const sx2 = (i * 83 + i * 17) % W;
      const sy2 = (i * 113 + i * 23) % H;
      ctx.globalAlpha = 0.06 + (i % 4) * 0.03;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(sx2, sy2, 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const boardX = 36;
    const boardY = 20;

    // Board background with 3D border
    ctx.fillStyle = "#0a0f1a";
    ctx.beginPath();
    ctx.roundRect(boardX - 4, boardY - 4, TW * TC + 8, TH * TC + 8, 6);
    ctx.fill();
    // 3D border (top-left bright, bottom-right dark)
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(boardX - 4, boardY - 4, TW * TC + 8, TH * TC + 8, 6);
    ctx.stroke();
    // Right edge 3D
    ctx.fillStyle = "#0d1222";
    ctx.fillRect(boardX + TW * TC + 4, boardY - 4, 6, TH * TC + 8);
    // Bottom edge 3D
    ctx.fillStyle = "#0d1222";
    ctx.fillRect(boardX - 4, boardY + TH * TC + 4, TW * TC + 14, 6);

    // Empty grid cells
    for (let r = 0; r < TH; r++) {
      for (let c2 = 0; c2 < TW; c2++) {
        drawEmptyCell(ctx, boardX + c2 * TC, boardY + r * TC, TC);
      }
    }

    if (g) {
      // Settled blocks
      g.board.forEach((row, r) =>
        row.forEach((col, c2) => {
          if (col) draw3DBlock(ctx, boardX + c2 * TC, boardY + r * TC, col, TC);
        }),
      );

      if (g.piece) {
        // Ghost piece
        let gy = 0;
        while (fits(g.board, g.piece, 0, gy + 1)) gy++;
        g.piece.s.forEach((row, r) =>
          row.forEach((v, col) => {
            if (v) {
              const gx = boardX + (g.piece.x + col) * TC;
              const gyy = boardY + (g.piece.y + r + gy) * TC;
              ctx.globalAlpha = 0.18;
              ctx.fillStyle = g.piece.c;
              ctx.beginPath();
              ctx.roundRect(gx, gyy, TC, TC, 3);
              ctx.fill();
              ctx.setLineDash([3, 3]);
              ctx.strokeStyle = g.piece.c + "88";
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.roundRect(gx + 1, gyy + 1, TC - 2, TC - 2, 3);
              ctx.stroke();
              ctx.setLineDash([]);
              ctx.globalAlpha = 1;
            }
          }),
        );

        // Active piece
        g.piece.s.forEach((row, r) =>
          row.forEach((v, col) => {
            if (v) draw3DBlock(ctx, boardX + (g.piece.x + col) * TC, boardY + (g.piece.y + r) * TC, g.piece.c, TC);
          }),
        );
      }

      // Next piece preview
      const previewX = boardX + TW * TC + 20;
      const previewY = boardY + 10;
      ctx.fillStyle = "#0e1422";
      ctx.beginPath();
      ctx.roundRect(previewX, previewY, 80, 80, 8);
      ctx.fill();
      ctx.strokeStyle = t.accent + "33";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(previewX, previewY, 80, 80, 8);
      ctx.stroke();
      ctx.fillStyle = "#6b7280";
      ctx.font = "11px Inter";
      ctx.textAlign = "center";
      ctx.fillText("NEXT", previewX + 40, previewY - 4);
      if (g.next) {
        const pSize = 16;
        const pOffX = previewX + (80 - g.next.s[0].length * pSize) / 2;
        const pOffY = previewY + (80 - g.next.s.length * pSize) / 2;
        g.next.s.forEach((row, r) =>
          row.forEach((v, col) => {
            if (v) draw3DBlock(ctx, pOffX + col * pSize, pOffY + r * pSize, g.next.c, pSize);
          }),
        );
      }
    }

    // Line-clear flash
    if (flash.current && flash.current.t > 0) {
      ctx.fillStyle = `rgba(255,255,255,${(flash.current.t / 8) * 0.3})`;
      ctx.fillRect(boardX, boardY, TW * TC, TH * TC);
    }

    if (!g || !g.started) {
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
      ctx.fillText("TETRIS 3D", W / 2, H / 2 - 26);
      ctx.fillStyle = "#9ca3af";
      ctx.font = "13px Inter";
      ctx.fillText("Clear lines before they stack up!", W / 2, H / 2 + 2);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px Inter";
      ctx.fillText("Press SPACE or click to start", W / 2, H / 2 + 30);
    } else if (g && !g.alive) {
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
      ctx.fillText("Game Over", W / 2, H / 2 - 26);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 18px Inter";
      ctx.fillText(`Score: ${g.score}`, W / 2, H / 2 + 4);
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
              }),
            );
            let cleared = 0;
            for (let r = TH - 1; r >= 0; ) {
              if (g.board[r].every((c) => c)) {
                g.board.splice(r, 1);
                g.board.unshift(Array(TW).fill(null));
                cleared++;
              } else r--;
            }
            if (cleared > 0) flash.current = { t: 8 };
            g.score += cleared === 1 ? 100 : cleared === 2 ? 300 : cleared === 3 ? 500 : cleared === 4 ? 800 : 0;
            setScore(g.score);
            g.piece = g.next;
            g.next = mkPiece();
            if (!fits(g.board, g.piece)) {
              g.alive = false;
              if (g.score > 0 && onCoinEarned) onCoinEarned(Math.round(g.score / 10));
            }
          }
        }
      }
      if (flash.current) flash.current.t--;
      draw();
      raf.current = requestAnimationFrame(loop);
    },
    [draw, onCoinEarned],
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
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [loop, draw]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        const g = G.current;
        if (!g || !g.alive || !g.started) { startGame(); return; }
      }
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
        <span className="text-gray-400 text-sm flex items-center gap-1.5">
          <FaPuzzlePiece size={14} style={{ color: t.accent }} /> Tetris 3D
        </span>
        <span className="font-bold" style={{ color: t.accent }}>Score: {score}</span>
      </div>
      <canvas
        ref={cvs}
        width={W}
        height={H}
        className="rounded-xl cursor-pointer max-w-full h-auto"
        style={{ border: `1px solid ${t.accent}33`, boxShadow: `0 0 32px ${t.accent}22` }}
        onClick={handleClick}
      />
      <p className="text-xs text-gray-600">← → move · ↑ rotate · ↓ drop · SPACE start/hard-drop</p>
    </div>
  );
}
