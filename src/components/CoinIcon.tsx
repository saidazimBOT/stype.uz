"use client";

import { useId } from "react";

interface CoinIconProps {
  size?: number;
  className?: string;
}

/**
 * STypeUz gold coin — oltin, qirrali (reeded) tanga.
 * Dizayn: starburst yaltiroq, klaviatura, "STUz — COIN —" matni.
 */
export default function CoinIcon({ size = 20, className }: CoinIconProps) {
  // Har bir instansiya uchun unikal gradient ID — bir nechta tanga bir sahifada bo'lsa ham buzilmaydi
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const face = `coin-face-${uid}`;
  const glint = `coin-glint-${uid}`;
  const textGrad = `coin-text-${uid}`;

  const KEY_ROWS: { y: number; keys: number; space?: boolean }[] = [
    { y: -6.4, keys: 5 },
    { y: -2, keys: 5 },
    { y: 2.4, keys: 4, space: true },
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
      style={{ display: "inline-block", flexShrink: 0, verticalAlign: "-0.14em" }}
    >
      <defs>
        <radialGradient id={face} cx="38%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#fff3c2" />
          <stop offset="30%" stopColor="#f6c94e" />
          <stop offset="62%" stopColor="#e5a92f" />
          <stop offset="85%" stopColor="#c9881c" />
          <stop offset="100%" stopColor="#b07a1a" />
        </radialGradient>
        <radialGradient id={glint} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={textGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe9a0" />
          <stop offset="55%" stopColor="#f0b23a" />
          <stop offset="100%" stopColor="#c9821a" />
        </linearGradient>
      </defs>

      {/* Reeded (qirrali) qirra */}
      <circle cx="50" cy="50" r="49" fill="#7c4c0e" />
      <circle
        cx="50" cy="50" r="49.2"
        fill="none" stroke="#d9ab3f" strokeWidth="2.6"
        strokeDasharray="1.1 2.5"
      />
      <circle
        cx="50" cy="50" r="48.2"
        fill="none" stroke="#5a3608" strokeWidth="1.4"
        strokeDasharray="1.1 2.5"
      />
      {/* Tanganing yuzi */}
      <circle cx="50" cy="50" r="45.5" fill={`url(#${face})`} />
      <circle cx="50" cy="50" r="45" fill="none" stroke="#8a5510" strokeWidth="1.6" opacity="0.65" />
      <circle cx="50" cy="50" r="40.5" fill="none" stroke="#b5791b" strokeWidth="1.1" opacity="0.55" />

      {/* Starburst yaltiroq (yuqori chap) */}
      <path
        d="M25 10.5 L28 19.2 L36.7 22.2 L28 25.2 L25 33.9 L22 25.2 L13.3 22.2 L22 19.2 Z"
        fill={`url(#${glint})`}
      />
      <circle cx="25" cy="22.2" r="3.4" fill={`url(#${glint})`} />

      {/* Klaviatura (perspektivada) */}
      <g transform="translate(50 33.5) rotate(-10) scale(1 0.8)">
        <rect x="-15" y="-9.5" width="30" height="19" rx="2.4" fill="#c0851c" stroke="#8a5510" strokeWidth="1" />
        {KEY_ROWS.map((row, ri) => {
          const keyW = 4.6;
          const gap = 1.3;
          const widths = Array.from({ length: row.keys }, (_, i) =>
            row.space && i === row.keys - 1 ? keyW * 2 + gap : keyW
          );
          const total = widths.reduce((a, b) => a + b, 0) + (row.keys - 1) * gap;
          let cursor = -total / 2;
          return (
            <g key={ri}>
              {widths.map((w, i) => {
                const x = cursor;
                cursor += w + gap;
                return (
                  <rect
                    key={i}
                    x={x}
                    y={row.y}
                    width={w}
                    height="3.6"
                    rx="0.9"
                    fill="#f2c45a"
                    stroke="#8a5510"
                    strokeWidth="0.5"
                  />
                );
              })}
            </g>
          );
        })}
      </g>

      {/* STUz — 3D ekstruziyali qalin kursiv */}
      <text
        x="50" y="61.5" textAnchor="middle"
        fontFamily="'Inter', 'Arial', sans-serif"
        fontStyle="italic" fontWeight="900" fontSize="21" letterSpacing="0.5"
        fill="#6e3f08" opacity="0.85"
      >
        STUz
      </text>
      <text
        x="50" y="60.5" textAnchor="middle"
        fontFamily="'Inter', 'Arial', sans-serif"
        fontStyle="italic" fontWeight="900" fontSize="21" letterSpacing="0.5"
        fill="#8a5510"
      >
        STUz
      </text>
      <text
        x="50" y="59.2" textAnchor="middle"
        fontFamily="'Inter', 'Arial', sans-serif"
        fontStyle="italic" fontWeight="900" fontSize="21" letterSpacing="0.5"
        fill={`url(#${textGrad})`} stroke="#8a5510" strokeWidth="0.4"
      >
        STUz
      </text>

      {/* — COIN — */}
      <line x1="27" y1="72.5" x2="37.5" y2="72.5" stroke="#8a5510" strokeWidth="1" />
      <text
        x="50" y="75.5" textAnchor="middle"
        fontFamily="'Inter', 'Arial', sans-serif"
        fontWeight="700" fontSize="8" letterSpacing="2.2"
        fill="#a86a14"
      >
        COIN
      </text>
      <line x1="62.5" y1="72.5" x2="73" y2="72.5" stroke="#8a5510" strokeWidth="1" />
    </svg>
  );
}
