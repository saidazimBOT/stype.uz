"use client";

import { useMemo } from "react";
import type { ThemeColors } from "../../types";
import { FINGERS, getFinger, toPhysicalKey, type FingerId } from "./KeyboardVisualizer";

// ── KEYBOARD GEOMETRY (same natural 690px layout as KeyboardVisualizer) ──
const KEY_ROWS: string[][] = [
  ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "Backspace"],
  ["Tab", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]", "\\"],
  ["Caps", "a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'", "Enter"],
  ["Shift", "z", "x", "c", "v", "b", "n", "m", ",", ".", "/", "Shift"],
  ["Ctrl", "Meta", "Alt", "Space", "Alt", "Fn", "Ctrl"],
];

const WIDE_KEYS: Record<string, number> = {
  Backspace: 72, Tab: 56, Caps: 68, Enter: 76, Shift: 88, Space: 240,
  Ctrl: 52, Meta: 48, Alt: 44, Fn: 40,
};

const KEY_W = 40;
const KEY_H = 40;
const GAP = 6;
const TOTAL_W = 690;

// Home row keys — "starting position" (rasmdagi kabi ko'k rangda)
const HOME_KEYS = new Set(["a", "s", "d", "f", "j", "k", "l", ";"]);

function buildRects(): Record<string, { x: number; y: number; w: number }> {
  const out: Record<string, { x: number; y: number; w: number }> = {};
  KEY_ROWS.forEach((row, r) => {
    const widths = row.map((k) => WIDE_KEYS[k] ?? KEY_W);
    const total = widths.reduce((a, b) => a + b, 0) + (row.length - 1) * GAP;
    let x = (TOTAL_W - total) / 2;
    const y = r * (KEY_H + GAP);
    row.forEach((k, i) => {
      const w = widths[i];
      out[k] = { x, y, w };
      x += w + GAP;
    });
  });
  return out;
}
const RECTS = buildRects();

// ── HANDS ────────────────────────────────────────────────────────────────
// Har bir barmoq o'z tayanch qator tugmasi ustida turadi (rasmdagi kabi).
const SKIN = "#f5b184";
const SKIN_EDGE = "#d98a55";
const NAIL = "#ffe0c2";
const FRAME = "#7a5c38";

interface HandFinger {
  id: FingerId;
  key: string;
  len: number;
  rot: number;
}

// Barmoqlar uchlari tugmada, asoslari kaft markaziga qarab bir oz egiladi
const HAND_FINGERS: HandFinger[] = [
  { id: "l_pinky", key: "a", len: 62, rot: -7 },
  { id: "l_ring", key: "s", len: 72, rot: -4 },
  { id: "l_middle", key: "d", len: 78, rot: 0 },
  { id: "l_index", key: "f", len: 72, rot: 4 },
  { id: "r_index", key: "j", len: 72, rot: -4 },
  { id: "r_middle", key: "k", len: 78, rot: 0 },
  { id: "r_ring", key: "l", len: 72, rot: 4 },
  { id: "r_pinky", key: ";", len: 62, rot: 7 },
];

const LABEL: Record<string, string> = {
  Backspace: "⌫", Enter: "↵", Shift: "⇧", Tab: "⇥", Space: "space",
};

interface HandsOnKeyboardProps {
  t: ThemeColors;
  nextKey?: string;
  legend: string;
}

export default function HandsOnKeyboard({ t, nextKey, legend }: HandsOnKeyboardProps) {
  const nextFinger = nextKey ? getFinger(nextKey) : undefined;
  const nextPhys = nextKey ? toPhysicalKey(nextKey) : undefined;

  // Legendni 2 qatorga bo'lamiz (o'rtaga eng yaqin bo'sh joydan)
  const l2s = useMemo(() => {
    const mid = Math.floor(legend.length / 2);
    let cut = -1;
    for (let i = 0; i < legend.length; i++) {
      if (legend[i] === " " && (cut === -1 || Math.abs(i - mid) < Math.abs(cut - mid))) cut = i;
    }
    if (cut === -1) return [legend, undefined] as const;
    return [legend.slice(0, cut), legend.slice(cut + 1)] as const;
  }, [legend]);
  const [l1, l2] = l2s;

  const thumbActive = nextFinger === "thumb";

  return (
    <svg
      viewBox="0 0 690 300"
      className="w-full h-auto select-none"
      role="img"
      aria-label={legend}
    >
      <defs>
        <filter id="hs-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4.5" />
        </filter>
      </defs>

      {/* Keyboard base — quyuq fon, nozik issiq chegara */}
      <rect x={0} y={0} width={690} height={300} rx={20} fill="#191b22" stroke={FRAME} strokeWidth={1.5} />

      {/* Keys */}
      {KEY_ROWS.flatMap((row, r) =>
        row.map((k) => {
          const rct = RECTS[k];
          const home = HOME_KEYS.has(k);
          const isSpace = k === "Space";
          const mod = k in WIDE_KEYS;
          const next = nextPhys !== undefined && toPhysicalKey(k) === nextPhys;
          let fill = "#f1f2f6";
          let textColor = "#23262e";
          if (home || isSpace) {
            fill = t.accent;
            textColor = "#101319";
          } else if (mod) {
            fill = "#545a68";
            textColor = "#e2e5ec";
          }
          const label = LABEL[k] ?? k.toUpperCase();
          const fSize = label.length > 2 ? 9 : 14;
          return (
            <g key={`${r}-${k}`}>
              {next && (
                <rect
                  x={rct.x - 2}
                  y={rct.y - 2}
                  width={rct.w + 4}
                  height={KEY_H + 4}
                  rx={10}
                  fill="none"
                  stroke={t.accent}
                  strokeWidth={2.5}
                  filter="url(#hs-glow)"
                  className="animate-pulse"
                />
              )}
              <rect
                x={rct.x}
                y={rct.y}
                width={rct.w}
                height={KEY_H}
                rx={7}
                fill={fill}
                stroke="rgba(0,0,0,0.35)"
                strokeWidth={1}
              />
              <text
                x={rct.x + rct.w / 2}
                y={rct.y + KEY_H / 2 + fSize / 2 - 1}
                textAnchor="middle"
                fontSize={fSize}
                fontWeight={700}
                fill={textColor}
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {label}
              </text>
              {/* F va J tugmalarida tayanch nuqtalari */}
              {(k === "f" || k === "j") && (
                <g>
                  <rect x={rct.x + rct.w / 2 - 7} y={rct.y + KEY_H - 8} width={4} height={2.5} rx={1.25} fill={textColor} opacity={0.55} />
                  <rect x={rct.x + rct.w / 2 + 3} y={rct.y + KEY_H - 8} width={4} height={2.5} rx={1.25} fill={textColor} opacity={0.55} />
                </g>
              )}
            </g>
          );
        })
      )}

      {/* ── HANDS (palms + wrists) ── */}
      {/* Chap kaft */}
      <ellipse cx={175} cy={212} rx={84} ry={46} fill={SKIN} stroke={SKIN_EDGE} strokeWidth={2} />
      <rect x={122} y={252} width={106} height={48} rx={24} fill={SKIN} stroke={SKIN_EDGE} strokeWidth={2} />
      {/* O'ng kaft */}
      <ellipse cx={487} cy={212} rx={84} ry={46} fill={SKIN} stroke={SKIN_EDGE} strokeWidth={2} />
      <rect x={462} y={252} width={106} height={48} rx={24} fill={SKIN} stroke={SKIN_EDGE} strokeWidth={2} />

      {/* ── THUMBS (spacebar ustida) ── */}
      <g>
        {thumbActive && (
          <line x1={150} y1={252} x2={288} y2={208} stroke={FINGERS.thumb.color} strokeWidth={26} strokeLinecap="round" filter="url(#hs-glow)" opacity={0.55} />
        )}
        <line x1={150} y1={252} x2={288} y2={208} stroke={SKIN_EDGE} strokeWidth={26} strokeLinecap="round" />
        <line x1={150} y1={252} x2={288} y2={208} stroke={thumbActive ? FINGERS.thumb.color : SKIN} strokeWidth={20} strokeLinecap="round" />
        {thumbActive && (
          <line x1={540} y1={252} x2={402} y2={208} stroke={FINGERS.thumb.color} strokeWidth={26} strokeLinecap="round" filter="url(#hs-glow)" opacity={0.55} />
        )}
        <line x1={540} y1={252} x2={402} y2={208} stroke={SKIN_EDGE} strokeWidth={26} strokeLinecap="round" />
        <line x1={540} y1={252} x2={402} y2={208} stroke={thumbActive ? FINGERS.thumb.color : SKIN} strokeWidth={20} strokeLinecap="round" />
      </g>

      {/* ── FINGERS (home row keys ustida) ── */}
      {HAND_FINGERS.map((hf) => {
        const rct = RECTS[hf.key];
        const tipX = rct.x + rct.w / 2;
        const tipY = rct.y + 12;
        const active = nextFinger === hf.id;
        const color = FINGERS[hf.id].color;
        const width = hf.id.includes("pinky") ? 16 : 18;
        return (
          <g key={hf.id} transform={`rotate(${hf.rot} ${tipX} ${tipY})`}>
            {active && (
              <rect
                x={tipX - width / 2 - 2}
                y={tipY - 2}
                width={width + 4}
                height={hf.len + 4}
                rx={(width + 4) / 2}
                fill={color}
                opacity={0.55}
                filter="url(#hs-glow)"
              />
            )}
            <rect
              x={tipX - width / 2}
              y={tipY}
              width={width}
              height={hf.len}
              rx={width / 2}
              fill={active ? color : SKIN}
              stroke={active ? color : SKIN_EDGE}
              strokeWidth={1.5}
            />
            <rect
              x={tipX - width / 2 + 2.5}
              y={tipY + 3}
              width={width - 5}
              height={8}
              rx={(width - 5) / 2}
              fill={NAIL}
              opacity={0.85}
            />
          </g>
        );
      })}

      {/* ── LEGEND (bottom-right) ── */}
      <rect x={576} y={241} width={12} height={12} rx={3} fill={t.accent} />
      <text x={594} y={252} fontSize={11} fontWeight={600} fill="#a3aab8" style={{ fontFamily: "'Inter', sans-serif" }}>
        {l1}
      </text>
      {l2 && (
        <text x={594} y={266} fontSize={11} fontWeight={600} fill="#a3aab8" style={{ fontFamily: "'Inter', sans-serif" }}>
          {l2}
        </text>
      )}
    </svg>
  );
}
